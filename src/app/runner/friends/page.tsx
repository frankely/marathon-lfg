import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE,
  ONLINE_STATUS,
  getFriends,
  getFriendRequests,
  type BungieFriend,
} from "@/lib/bungie";

export default async function FriendsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE.access)?.value;
  if (!accessToken) redirect("/");

  const [friendsRes, requestsRes] = await Promise.allSettled([
    getFriends(accessToken),
    getFriendRequests(accessToken),
  ]);

  const friends =
    friendsRes.status === "fulfilled" ? friendsRes.value.Response.friends ?? [] : [];
  const requests =
    requestsRes.status === "fulfilled" ? requestsRes.value.Response.friends ?? [] : [];

  const friendsError =
    friendsRes.status === "rejected"
      ? friendsRes.reason instanceof Error
        ? friendsRes.reason.message
        : "Unknown error"
      : null;

  const sorted = [...friends].sort((a, b) => {
    // Online (1) first, then idle (2), then offline (0)
    const order = (s: number) => (s === 1 ? 0 : s === 2 ? 1 : 2);
    const diff = order(a.onlineStatus) - order(b.onlineStatus);
    if (diff !== 0) return diff;
    return nameOf(a).localeCompare(nameOf(b));
  });

  const onlineCount = friends.filter((f) => f.onlineStatus === 1).length;

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />

      <header className="relative z-10 border-b border-line/80 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-mono text-xs tracking-hud text-accent">
              [ RUNNER//NET ]
            </Link>
            <Link
              href="/runner"
              className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground"
            >
              ← PROFILE
            </Link>
          </div>
          <Link
            href="/api/auth/logout"
            className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground"
          >
            [ EXTRACT // LOG OUT ]
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[11px] tracking-hud text-accent">
              // CONTACT REGISTRY — BUNGIE.NET FRIENDS
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Known Runners
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1 font-mono text-[11px] tracking-hud text-muted">
            <span>
              <span className="text-accent">{friends.length}</span> TOTAL
            </span>
            <span>
              <span className="text-signal">{onlineCount}</span> ONLINE
            </span>
            {requests.length > 0 && (
              <span>
                <span className="text-warn">{requests.length}</span> PENDING
              </span>
            )}
          </div>
        </div>

        {friendsError && (
          <div className="hud-corner relative border border-danger/60 bg-background-elev/70 p-4">
            <div className="font-mono text-[11px] tracking-hud text-danger">
              // RELAY ERROR
            </div>
            <p className="mt-2 text-sm text-foreground">
              Could not pull the friend list from Bungie. The most common cause is the
              app missing the <code className="text-accent">ReadUserData</code> OAuth
              scope on bungie.net — toggle it on in the app config and re-authenticate.
            </p>
            <pre className="mt-3 max-h-48 overflow-auto border border-line bg-background p-3 font-mono text-[11px] whitespace-pre-wrap text-muted">
              {friendsError}
            </pre>
          </div>
        )}

        {requests.length > 0 && (
          <div>
            <div className="mb-3 font-mono text-[11px] tracking-hud text-warn">
              // INCOMING + OUTGOING REQUESTS — {requests.length}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {requests.map((f) => (
                <FriendCard key={keyOf(f)} friend={f} pending />
              ))}
            </ul>
          </div>
        )}

        {!friendsError && (
          <div>
            {sorted.length === 0 ? (
              <div className="hud-corner relative border border-line bg-background-elev/60 p-6 text-center">
                <div className="font-mono text-[11px] tracking-hud text-muted">
                  // EMPTY REGISTRY
                </div>
                <p className="mt-2 text-sm text-muted">
                  No bungie.net friends on this account yet. Once Marathon ships,
                  Bungie may extend the API for crew invites — for now, the
                  registry tracks bungie.net friendships.
                </p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {sorted.map((f) => (
                  <FriendCard key={keyOf(f)} friend={f} />
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function FriendCard({ friend, pending }: { friend: BungieFriend; pending?: boolean }) {
  const status = ONLINE_STATUS[friend.onlineStatus] ?? { label: "UNKNOWN", tone: "off" as const };
  const dotColor =
    status.tone === "on" ? "bg-signal" : status.tone === "idle" ? "bg-warn" : "bg-muted/60";
  const name = nameOf(friend);
  const code = friend.bungieGlobalDisplayNameCode ?? friend.bungieNetUser?.cachedBungieGlobalDisplayNameCode;
  const avatar = friend.bungieNetUser?.profilePicturePath;
  const relationship = pending ? relationshipLabel(friend.relationship) : null;

  return (
    <li className="hud-corner relative flex items-center gap-4 border border-line bg-background-elev/60 p-4">
      {avatar ? (
        <Image
          src={`https://www.bungie.net${avatar.startsWith("/") ? "" : "/"}${avatar}`}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="size-12 border border-accent/30 object-cover"
        />
      ) : (
        <div className="size-12 border border-accent/30 bg-background" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm text-foreground">{name}</span>
          {typeof code === "number" && (
            <span className="font-mono text-[11px] text-muted">
              #{String(code).padStart(4, "0")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-hud">
          <span className={`size-1.5 rounded-full ${dotColor} ${status.tone === "on" ? "animate-pulse" : ""}`} />
          <span className={status.tone === "on" ? "text-signal" : status.tone === "idle" ? "text-warn" : "text-muted"}>
            {status.label}
          </span>
          {relationship && (
            <span className="text-warn">· {relationship}</span>
          )}
        </div>
      </div>
    </li>
  );
}

function nameOf(f: BungieFriend) {
  return (
    f.bungieGlobalDisplayName ??
    f.bungieNetUser?.cachedBungieGlobalDisplayName ??
    f.bungieNetUser?.displayName ??
    f.bungieNetUser?.uniqueName ??
    f.lastSeenAsMembershipId
  );
}

function keyOf(f: BungieFriend) {
  return f.bungieNetUser?.membershipId ?? f.lastSeenAsMembershipId;
}

function relationshipLabel(r: number) {
  switch (r) {
    case 2:
      return "INCOMING REQUEST";
    case 3:
      return "OUTGOING REQUEST";
    case 1:
    case 4:
      return "FRIEND";
    default:
      return `REL_${r}`;
  }
}
