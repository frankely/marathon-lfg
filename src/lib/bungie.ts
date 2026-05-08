import "server-only";

export const BUNGIE_AUTHORIZE_URL = "https://www.bungie.net/en/OAuth/Authorize";
export const BUNGIE_TOKEN_URL = "https://www.bungie.net/Platform/App/OAuth/Token/";
export const BUNGIE_API_BASE = "https://www.bungie.net/Platform";

/**
 * Bungie's "your access token is no longer valid for API calls" signal —
 * surfaces on the wire as ErrorCode 99 / ErrorStatus "WebAuthRequired".
 * Common triggers: token expired, user revoked the app, or the API key in
 * use was issued under a different OAuth client than the access token.
 * Pages should catch this and route the user back through the OAuth flow
 * rather than rendering a raw error.
 */
export class BungieAuthError extends Error {
  constructor(public readonly bungieMessage?: string) {
    super(bungieMessage ?? "Bungie access token rejected");
    this.name = "BungieAuthError";
  }
}

/**
 * Token endpoint rejected our authorization_code. Bungie returns this as
 * 400 with body { error: "invalid_grant", error_description:
 * "AuthorizationCodeInvalid" }. Single-use OAuth codes mean the most
 * common trigger is the URL being fetched a second time — by a browser
 * refresh, back button, or (on a fresh / Safe-Browsing-flagged domain)
 * Chrome's scanner pre-fetching the URL before the user clicks through.
 *
 * Callback should handle this gracefully — if the user already has session
 * cookies the first exchange succeeded and we redirect to the app; if not,
 * restart the OAuth flow with a fresh code rather than dumping the error.
 */
export class BungieAuthorizationCodeInvalidError extends Error {
  constructor() {
    super("Bungie authorization code already used or expired");
    this.name = "BungieAuthorizationCodeInvalidError";
  }
}

export type BungieTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  membership_id: string;
};

export function getBungieEnv() {
  const apiKey = process.env.BUNGIE_API_KEY;
  const clientId = process.env.BUNGIE_CLIENT_ID;
  const clientSecret = process.env.BUNGIE_CLIENT_SECRET ?? "";
  const redirectUri = process.env.BUNGIE_REDIRECT_URI;

  if (!apiKey || !clientId || !redirectUri) {
    throw new Error(
      "Missing Bungie env. Required: BUNGIE_API_KEY, BUNGIE_CLIENT_ID, BUNGIE_REDIRECT_URI",
    );
  }

  return { apiKey, clientId, clientSecret, redirectUri };
}

export function buildAuthorizeUrl(state: string) {
  const { clientId } = getBungieEnv();
  const url = new URL(BUNGIE_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<BungieTokenResponse> {
  const { clientId, clientSecret } = getBungieEnv();
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (clientSecret) {
    // Confidential client: HTTP Basic auth
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${basic}`;
  } else {
    // Public client: include client_id in body
    body.set("client_id", clientId);
  }

  const res = await fetch(BUNGIE_TOKEN_URL, {
    method: "POST",
    headers,
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    // Detect the single-use-code-already-consumed / expired-code case so
    // the callback can recover gracefully instead of rendering a generic
    // 400 error to the user.
    try {
      const parsed = JSON.parse(text) as {
        error?: string;
        error_description?: string;
      };
      if (
        parsed.error === "invalid_grant" ||
        parsed.error_description === "AuthorizationCodeInvalid"
      ) {
        throw new BungieAuthorizationCodeInvalidError();
      }
    } catch (e) {
      // If the body wasn't JSON, fall through to the generic error below.
      if (e instanceof BungieAuthorizationCodeInvalidError) throw e;
    }
    throw new Error(`Bungie token exchange failed (${res.status}): ${text}`);
  }

  return (await res.json()) as BungieTokenResponse;
}

export type BungieUserMembershipData = {
  Response: {
    bungieNetUser: {
      membershipId: string;
      uniqueName: string;
      displayName: string;
      profilePicturePath?: string;
      cachedBungieGlobalDisplayName?: string;
      cachedBungieGlobalDisplayNameCode?: number;
    };
    destinyMemberships: Array<{
      membershipType: number;
      membershipId: string;
      displayName: string;
      bungieGlobalDisplayName?: string;
      bungieGlobalDisplayNameCode?: number;
      iconPath?: string;
      crossSaveOverride?: number;
    }>;
    primaryMembershipId?: string;
  };
  ErrorCode: number;
  ErrorStatus: string;
  Message: string;
};

export function getCurrentUser(accessToken: string) {
  return bungieGet<BungieUserMembershipData>(
    "/User/GetMembershipsForCurrentUser/",
    accessToken,
  );
}

export type BungieFriend = {
  lastSeenAsMembershipId: string;
  lastSeenAsBungieMembershipType: number;
  bungieGlobalDisplayName?: string;
  bungieGlobalDisplayNameCode?: number;
  onlineStatus: number;
  onlineTitle: number;
  relationship: number;
  bungieNetUser?: {
    membershipId: string;
    uniqueName?: string;
    displayName?: string;
    profilePicturePath?: string;
    cachedBungieGlobalDisplayName?: string;
    cachedBungieGlobalDisplayNameCode?: number;
  };
};

export type BungieFriendListResponse = {
  Response: { friends: BungieFriend[] };
  ErrorCode: number;
  ErrorStatus: string;
  Message: string;
};

function isWebAuthRequired(body: string): { yes: boolean; message?: string } {
  try {
    const parsed = JSON.parse(body) as { ErrorCode?: number; Message?: string };
    if (parsed?.ErrorCode === 99) {
      return { yes: true, message: parsed.Message };
    }
  } catch {
    /* not JSON, fall through */
  }
  return { yes: false };
}

async function bungieGet<T>(path: string, accessToken: string): Promise<T> {
  const { apiKey } = getBungieEnv();
  const res = await fetch(`${BUNGIE_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-API-Key": apiKey,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    const webAuth = isWebAuthRequired(text);
    if (webAuth.yes || res.status === 401) {
      throw new BungieAuthError(webAuth.message);
    }
    throw new Error(`Bungie ${path} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

export function getFriends(accessToken: string) {
  return bungieGet<BungieFriendListResponse>("/Social/Friends/", accessToken);
}

export function getFriendRequests(accessToken: string) {
  return bungieGet<BungieFriendListResponse>("/Social/Friends/Requests/", accessToken);
}

/**
 * Build a bungie.net profile URL for a Runner. Host opens this in a new tab
 * and clicks "Add Friend" there — we can't issue friend requests via API
 * because POST /Social/Friends/Add requires the BnetWrite scope, which is
 * reserved for Bungie's first-party apps and not available to third-party
 * developers (per Bungie's own OpenAPI spec).
 */
export function bungieProfileUrl(membershipId: string): string {
  return `https://www.bungie.net/en/User/Profile/254/${encodeURIComponent(membershipId)}`;
}

export const ONLINE_STATUS: Record<number, { label: string; tone: "on" | "idle" | "off" }> = {
  0: { label: "OFFLINE", tone: "off" },
  1: { label: "ONLINE", tone: "on" },
  2: { label: "IDLE", tone: "idle" },
};

export const COOKIE = {
  state: "mlfg_oauth_state",
  access: "mlfg_access",
  membership: "mlfg_membership_id",
  expires: "mlfg_access_expires",
  // Set right before we trigger an auto re-auth to break a loop. If we land
  // back on /runner with this still set AND another BungieAuthError, we know
  // the re-auth didn't help and the underlying problem is config-level.
  // Survives /api/auth/logout (which only clears the named session cookies).
  reauthMarker: "mlfg_reauth_attempted",
} as const;
