import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/bungie";

/**
 * Stamp the re-auth loop marker, then bounce through logout → login.
 *
 * Server Components can't modify cookies (Next 16 enforces this), so when a
 * page detects a stale Bungie session it redirects here instead of mutating
 * the cookie itself. This handler sets the marker and then chains into the
 * standard logout-with-`next` flow that clears stale session cookies and
 * starts a fresh OAuth handshake.
 *
 * The marker survives logout intentionally — it's how /runner detects "we
 * already tried re-auth and Bungie still rejected the fresh token, so the
 * problem is config-level, not session-level."
 */
export async function GET(request: NextRequest) {
  const store = await cookies();
  store.set(COOKIE.reauthMarker, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 120,
  });
  return NextResponse.redirect(
    new URL("/api/auth/logout?next=/api/auth/login", request.nextUrl.origin),
  );
}
