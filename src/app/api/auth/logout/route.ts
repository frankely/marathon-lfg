import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/bungie";
import { clearIdentityCookie } from "@/lib/session";

async function clear(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE.access);
  cookieStore.delete(COOKIE.membership);
  cookieStore.delete(COOKIE.expires);
  cookieStore.delete(COOKIE.state);
  await clearIdentityCookie();

  // Allow ?next=/safe-path so callers (e.g. /api/auth/reauth in the loop
  // breaker) can drop the user straight back into a re-auth instead of
  // bouncing them through "/". Restricted to same-origin relative paths.
  const next = request.nextUrl.searchParams.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  // When this is an explicit logout (no `next`), also clear the loop marker
  // so the user gets a true reset. During the auto re-auth flow we leave
  // the marker in place so /runner can detect a config-level loop.
  if (!next) {
    cookieStore.delete(COOKIE.reauthMarker);
  }

  return NextResponse.redirect(new URL(target, request.nextUrl.origin));
}

export async function GET(request: NextRequest) {
  return clear(request);
}

export async function POST(request: NextRequest) {
  return clear(request);
}
