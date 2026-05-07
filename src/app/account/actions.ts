"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession, clearIdentityCookie } from "@/lib/session";
import { COOKIE } from "@/lib/bungie";
import { deleteAllUserData } from "@/lib/lfg";

const CONFIRMATION_PHRASE = "DELETE MY DATA";

export async function deleteAccountAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");

  const typed = String(formData.get("confirm") ?? "").trim();
  if (typed !== CONFIRMATION_PHRASE) {
    redirect("/account/delete?error=mismatch");
  }

  await deleteAllUserData(session.membershipId);

  // Clear the session — there's no account to come back to.
  const store = await cookies();
  store.delete(COOKIE.access);
  store.delete(COOKIE.membership);
  store.delete(COOKIE.expires);
  store.delete(COOKIE.state);
  store.delete(COOKIE.reauthMarker);
  await clearIdentityCookie();

  revalidatePath("/lfg");
  redirect("/?deleted=1");
}
