import "server-only";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/bungie";

const IDENTITY_COOKIE = "mlfg_identity";

export type RunnerIdentity = {
  membershipId: string;
  displayName: string;
  displayCode?: number;
};

export type RunnerSession = RunnerIdentity & {
  accessToken: string;
};

export async function getSession(): Promise<RunnerSession | null> {
  const store = await cookies();
  const accessToken = store.get(COOKIE.access)?.value;
  const membershipId = store.get(COOKIE.membership)?.value;
  if (!accessToken || !membershipId) return null;

  const identityRaw = store.get(IDENTITY_COOKIE)?.value;
  let displayName = membershipId;
  let displayCode: number | undefined;
  if (identityRaw) {
    try {
      const parsed = JSON.parse(identityRaw) as { name?: string; code?: number };
      if (parsed.name) displayName = parsed.name;
      if (typeof parsed.code === "number") displayCode = parsed.code;
    } catch {
      /* ignore malformed cookie */
    }
  }

  return { accessToken, membershipId, displayName, displayCode };
}

export async function setIdentityCookie(identity: { name: string; code?: number }, maxAge: number) {
  const store = await cookies();
  store.set(IDENTITY_COOKIE, JSON.stringify(identity), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearIdentityCookie() {
  const store = await cookies();
  store.delete(IDENTITY_COOKIE);
}

// --- Re-auth loop protection ---
// We only allow one automatic re-auth round-trip per stale session. If a
// page detects a stale session and the marker is already present, the
// failure is config-level (e.g. API key vs client_id mismatch), not
// session-level — show the user a real error instead of looping.
//
// The marker is *set* by /api/auth/reauth and *cleared* by an explicit
// logout (/api/auth/logout without ?next=). Cookie writes can't happen in
// Server Components, so pages only ever read it via this helper.

export async function hasReauthMarker(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(COOKIE.reauthMarker)?.value);
}
