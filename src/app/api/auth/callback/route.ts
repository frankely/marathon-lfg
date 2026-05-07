import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, exchangeCodeForToken, getCurrentUser } from "@/lib/bungie";
import { setIdentityCookie } from "@/lib/session";
import { logError, logInfo, logWarn } from "@/lib/log";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    logWarn("oauth_callback_provider_error", { error });
    return redirectAfterAuth(request, { error });
  }
  if (!code || !state) {
    logWarn("oauth_callback_missing_params", { hasCode: !!code, hasState: !!state });
    return redirectAfterAuth(request, { error: "missing_code_or_state" });
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(COOKIE.state)?.value;
  if (!expectedState || expectedState !== state) {
    logWarn("oauth_callback_state_mismatch", { hasExpected: !!expectedState });
    return redirectAfterAuth(request, { error: "state_mismatch" });
  }
  cookieStore.delete(COOKIE.state);

  let token;
  try {
    token = await exchangeCodeForToken(code);
  } catch (e) {
    logError("oauth_token_exchange_failed", e);
    const message = e instanceof Error ? e.message : "token_exchange_failed";
    return redirectAfterAuth(request, { error: message });
  }
  logInfo("oauth_callback_success", { membershipId: token.membership_id });

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
  } catch (e) {
    // Identity caching is best-effort — LFG actions still work without it.
    // Log so we notice if the Bungie API is broken or scopes are wrong.
    logWarn("identity_cache_failed", { error: e instanceof Error ? e.message : String(e) });
  }

  // Send freshly-authed users straight to the product (the LFG board)
  // rather than to /runner. Profile is one click away via the header
  // link; landing on /lfg means the first thing they see is what the
  // app actually does.
  return redirectAfterAuth(request);
}

function redirectAfterAuth(request: NextRequest, params: Record<string, string> = {}) {
  // Errors still route to /runner so the existing ErrorScreen /
  // AuthLoopScreen surface picks them up. Successful flow → /lfg.
  const path = params.error ? "/runner" : "/lfg";
  const target = new URL(path, request.nextUrl.origin);
  for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
  return NextResponse.redirect(target);
}
