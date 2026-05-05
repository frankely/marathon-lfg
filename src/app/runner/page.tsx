import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, getCurrentUser } from "@/lib/bungie";

const MEMBERSHIP_TYPE_LABELS: Record<number, string> = {
  1: "Xbox",
  2: "PlayStation",
  3: "Steam",
  4: "Blizzard",
  5: "Stadia",
  6: "Epic",
  10: "Demon",
  254: "BungieNext",
};

type SearchParams = Promise<{ error?: string }>;

export default async function RunnerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE.access)?.value;

  if (!accessToken) {
    if (error) {
      return <ErrorScreen error={error} />;
    }
    redirect("/");
  }

  let user;
  let fetchError: string | null = null;
  try {
    user = await getCurrentUser(accessToken);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Unknown error";
  }

  if (fetchError || !user) {
    return <ErrorScreen error={fetchError ?? "fetch_failed"} />;
  }

  const bn = user.Response.bungieNetUser;
  const memberships = user.Response.destinyMemberships ?? [];
  const primaryId = user.Response.primaryMembershipId;
  const globalName = bn.cachedBungieGlobalDisplayName ?? bn.displayName;
  const globalCode = bn.cachedBungieGlobalDisplayNameCode;

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />

      <header className="relative z-10 border-b border-line/80 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-mono text-xs tracking-hud text-accent">[ RUNNER//NET ]</span>
            <span className="font-mono text-[10px] tracking-hud text-muted">v0.1</span>
          </Link>
          <a
            href="/api/auth/logout"
            className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground"
          >
            [ EXTRACT // LOG OUT ]
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[11px] tracking-hud text-accent">
            // UPLINK ESTABLISHED — RUNNER PROFILE LOADED
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/lfg"
              className="hud-corner group relative inline-flex items-center gap-2 border border-accent bg-accent/10 px-4 py-2 font-mono text-[11px] tracking-hud text-accent-strong transition hover:bg-accent/20"
            >
              DROP MANIFEST
              <span className="opacity-60 transition group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/runner/friends"
              className="border border-line px-4 py-2 font-mono text-[11px] tracking-hud text-muted hover:border-accent/60 hover:text-foreground"
            >
              CONTACT REGISTRY
            </Link>
          </div>
        </div>

        <div className="hud-corner relative flex flex-col gap-6 border border-line bg-background-elev/70 p-6 sm:flex-row sm:items-center">
          {bn.profilePicturePath ? (
            <Image
              src={`https://www.bungie.net${bn.profilePicturePath.startsWith("/") ? "" : "/"}${bn.profilePicturePath}`}
              alt="Runner avatar"
              width={96}
              height={96}
              className="size-24 border border-accent/40 object-cover"
              unoptimized
            />
          ) : (
            <div className="size-24 border border-accent/40 bg-background" />
          )}

          <div className="flex flex-col gap-2">
            <div className="font-mono text-[10px] tracking-hud text-muted">RUNNER DESIGNATION</div>
            <div className="text-3xl font-semibold tracking-tight text-foreground">
              {globalName}
              {typeof globalCode === "number" && (
                <span className="ml-2 font-mono text-base text-muted">
                  #{String(globalCode).padStart(4, "0")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] tracking-hud text-muted">
              <DataPair label="BUNGIE_ID" value={bn.membershipId} />
              <DataPair label="HANDLE" value={bn.uniqueName} />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 font-mono text-[11px] tracking-hud text-accent">
            // PLATFORM MEMBERSHIPS — {memberships.length}
          </div>
          {memberships.length === 0 ? (
            <div className="border border-line bg-background-elev/60 p-4 text-sm text-muted">
              No platform memberships returned by Bungie for this account.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {memberships.map((m) => {
                const isPrimary = primaryId && m.membershipId === primaryId;
                return (
                  <li
                    key={`${m.membershipType}-${m.membershipId}`}
                    className="hud-corner relative flex items-start justify-between gap-4 border border-line bg-background-elev/60 p-4"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="font-mono text-[10px] tracking-hud text-accent">
                        {MEMBERSHIP_TYPE_LABELS[m.membershipType] ?? `TYPE_${m.membershipType}`}
                        {isPrimary && (
                          <span className="ml-2 text-signal">[ PRIMARY ]</span>
                        )}
                      </div>
                      <div className="text-sm text-foreground">
                        {m.bungieGlobalDisplayName ?? m.displayName}
                        {typeof m.bungieGlobalDisplayNameCode === "number" && (
                          <span className="ml-1 font-mono text-xs text-muted">
                            #{String(m.bungieGlobalDisplayNameCode).padStart(4, "0")}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] tracking-hud text-muted">
                        ID {m.membershipId}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <details className="font-mono text-[11px] text-muted">
          <summary className="cursor-pointer tracking-hud text-accent hover:text-accent-strong">
            // RAW TRANSMISSION
          </summary>
          <pre className="mt-3 max-h-[420px] overflow-auto border border-line bg-background-elev/60 p-4 text-[11px] leading-relaxed text-foreground">
            {JSON.stringify(user.Response, null, 2)}
          </pre>
        </details>
      </section>
    </main>
  );
}

function DataPair({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-accent/70">{label}:</span> <span className="text-foreground">{value}</span>
    </span>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6">
      <div className="hud-corner relative w-full max-w-xl border border-danger/60 bg-background-elev/70 p-6">
        <div className="font-mono text-[11px] tracking-hud text-danger">
          // UPLINK FAILURE
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Insertion aborted</h1>
        <p className="mt-2 text-sm text-muted">
          The Bungie handshake did not complete. Reason returned by relay:
        </p>
        <pre className="mt-3 max-h-60 overflow-auto border border-line bg-background p-3 font-mono text-[11px] text-foreground whitespace-pre-wrap">
          {error}
        </pre>
        <div className="mt-5 flex items-center gap-3">
          <a
            href="/api/auth/login"
            className="border border-accent/60 bg-accent/10 px-4 py-2 font-mono text-xs tracking-hud text-accent-strong hover:bg-accent/20"
          >
            RETRY INSERTION
          </a>
          <Link href="/" className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground">
            [ ABORT ]
          </Link>
        </div>
      </div>
    </main>
  );
}
