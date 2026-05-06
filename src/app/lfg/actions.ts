"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, hasReauthMarker } from "@/lib/session";
import { BungieAuthError, sendFriendRequest } from "@/lib/bungie";
import {
  createLfg,
  deleteLfg,
  getLfg,
  joinLfg,
  kickMember,
  leaveLfg,
  markInitiated,
} from "@/lib/lfg";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");
  return session!;
}

export async function createLfgAction(formData: FormData) {
  const session = await requireSession();
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 3);
  if (!title) throw new Error("Title required");

  const lfg = await createLfg({
    title,
    notes,
    capacity,
    host: {
      membershipId: session.membershipId,
      displayName: session.displayName,
      displayCode: session.displayCode,
    },
  });
  revalidatePath("/lfg");
  redirect(`/lfg/${lfg.id}`);
}

export async function joinLfgAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("LFG id required");

  await joinLfg(id, {
    membershipId: session.membershipId,
    displayName: session.displayName,
    displayCode: session.displayCode,
  });
  revalidatePath(`/lfg/${id}`);
  revalidatePath("/lfg");
}

export async function leaveLfgAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("LFG id required");
  await leaveLfg(id, session.membershipId);
  revalidatePath(`/lfg/${id}`);
  revalidatePath("/lfg");
  redirect("/lfg");
}

export async function kickMemberAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const target = String(formData.get("membershipId") ?? "");
  const lfg = await getLfg(id);
  if (!lfg) throw new Error("LFG not found");
  if (lfg.hostMembershipId !== session.membershipId) {
    throw new Error("Only the host can kick members");
  }
  await kickMember(id, target);
  revalidatePath(`/lfg/${id}`);
}

export async function deleteLfgAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const lfg = await getLfg(id);
  if (!lfg) return;
  if (lfg.hostMembershipId !== session.membershipId) {
    throw new Error("Only the host can terminate this run");
  }
  await deleteLfg(id);
  revalidatePath("/lfg");
  redirect("/lfg");
}

export async function initiateLfgAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const lfg = await getLfg(id);
  if (!lfg) throw new Error("LFG not found");
  if (lfg.hostMembershipId !== session.membershipId) {
    throw new Error("Only the host can initiate this run");
  }
  if (lfg.status !== "OPEN") throw new Error("Run already initiated");

  const guests = lfg.members.filter((m) => m.role === "GUEST");
  let results: Array<{ membershipId: string; ok: boolean; error?: string }>;
  try {
    results = await Promise.all(
      guests.map(async (g) => {
        try {
          const r = await sendFriendRequest(session.accessToken, g.membershipId);
          if (r.ok) return { membershipId: g.membershipId, ok: true };
          return {
            membershipId: g.membershipId,
            ok: false,
            error: `HTTP ${r.status}: ${r.error.slice(0, 200)}`,
          };
        } catch (e) {
          // Bubble auth failures up so we can re-auth instead of recording
          // a per-guest error and half-initiating the run.
          if (e instanceof BungieAuthError) throw e;
          return {
            membershipId: g.membershipId,
            ok: false,
            error: e instanceof Error ? e.message : "unknown",
          };
        }
      }),
    );
  } catch (e) {
    if (e instanceof BungieAuthError) {
      // First failure: try one re-auth round-trip. Second failure: route
      // the host to /runner so they see the diagnostic AuthLoopScreen
      // instead of looping logout → login → callback → action → ...
      if (await hasReauthMarker()) {
        // Already retried once — bounce to /runner for the diagnostic screen.
        redirect("/runner");
      }
      redirect("/api/auth/reauth");
    }
    throw e;
  }
  await markInitiated(id, results);
  revalidatePath(`/lfg/${id}`);
  revalidatePath("/lfg");
}
