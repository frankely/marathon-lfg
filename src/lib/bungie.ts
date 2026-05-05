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

export async function sendFriendRequest(
  accessToken: string,
  targetMembershipId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { apiKey } = getBungieEnv();
  const res = await fetch(
    `${BUNGIE_API_BASE}/Social/Friends/Add/${encodeURIComponent(targetMembershipId)}/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const text = await res.text();
    const webAuth = isWebAuthRequired(text);
    if (webAuth.yes || res.status === 401) {
      throw new BungieAuthError(webAuth.message);
    }
    return { ok: false, status: res.status, error: text };
  }
  return { ok: true };
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
} as const;
