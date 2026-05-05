import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, exchangeCodeForToken, getCurrentUser } from "@/lib/bungie";
import { setIdentityCookie } from "@/lib/session";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return redirectToRunner(request, { error });
  }
  if (!code || !state) {
    return redirectToRunner(request, { error: "missing_code_or_state" });
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(COOKIE.state)?.value;
  if (!expectedState || expectedState !== state) {
    return redirectToRunner(request, { error: "state_mismatch" });
  }
  cookieStore.delete(COOKIE.state);

  let token;
  try {
    token = await exchangeCodeForToken(code);
  } catch (e) {
    const message = e instanceof Error ? e.message : "token_exchange_failed";
    return redirectToRunner(request, { error: message });
  }

  const expiresAt = Date.now() + token.expires_in * 1000;

  cookieStore.set(COOKIE.access, token.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: token.expires_in,
  });
  cookieStore.set(COOKIE.membership, token.membership_id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: token.expires_in,
  });
  cookieStore.set(COOKIE.expires, String(expiresAt), {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: token.expires_in,
  });

  // Cache the runner's display identity so server actions don't have to
  // re-hit the Bungie API on every join/post.
  try {
    const ident = await getCurrentUser(token.access_token);
    const bn = ident.Response.bungieNetUser;
    await setIdentityCookie(
      {
        name: bn.cachedBungieGlobalDisplayName ?? bn.displayName,
        code: bn.cachedBungieGlobalDisplayNameCode,
      },
      token.expires_in,
    );
  } catch {
    /* identity caching is best-effort; LFG actions can still work */
  }

  return redirectToRunner(request);
}

function redirectToRunner(request: NextRequest, params: Record<string, string> = {}) {
  const target = new URL("/runner", request.nextUrl.origin);
  for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
  return NextResponse.redirect(target);
}
