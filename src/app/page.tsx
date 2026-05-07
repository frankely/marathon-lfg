import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/bungie";

export default async function Home() {
  const cookieStore = await cookies();
  const isAuthed = Boolean(cookieStore.get(COOKIE.access)?.value);

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />

      <header className="relative z-10 border-b border-line/80 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-mono text-xs tracking-hud text-accent">[ RUNNER//NET ]</span>
            <span className="font-mono text-[10px] tracking-hud text-muted">v0.1 // PRE-DROP</span>
          </Link>
          <nav className="flex items-center gap-3 font-mono text-[11px] tracking-hud text-muted">
            <span>UPLINK · TAU CETI IV</span>
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-signal" />
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-10 px-6 py-20">
        <div className="font-mono text-[11px] tracking-hud text-accent">
          // INCOMING TRANSMISSION — UESC RUNNER NETWORK
        </div>

        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
          Form your crew.
          <br />
          <span className="text-accent">Exfil richer.</span>
        </h1>

        <p className="max-w-2xl text-lg leading-relaxed text-muted">
          RUNNER//NET is the unofficial LFG uplink for Marathon. Authenticate
          with your Bungie credentials to surface your Runner identity, broadcast
          contracts, and fill out duos and trios for the next infil into Tau Ceti IV.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          {isAuthed ? (
            <>
              <Link
                href="/lfg"
                className="hud-corner group relative inline-flex items-center gap-3 border border-accent bg-accent/10 px-6 py-3 font-mono text-sm tracking-hud text-accent-strong transition hover:bg-accent/20"
              >
                <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                OPEN INFIL BOARD
                <span className="opacity-60 transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/runner"
                className="border border-line px-4 py-3 font-mono text-xs tracking-hud text-muted hover:border-accent/60 hover:text-foreground"
              >
                RUNNER PROFILE
              </Link>
              <a
                href="/api/auth/logout"
                className="font-mono text-xs tracking-hud text-muted hover:text-foreground"
              >
                [ EXFIL // LOG OUT ]
              </a>
            </>
          ) : (
            <a
              href="/api/auth/login"
              className="hud-corner group relative inline-flex items-center gap-3 border border-accent bg-accent/10 px-6 py-3 font-mono text-sm tracking-hud text-accent-strong transition hover:bg-accent/20"
            >
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              JACK IN — BUNGIE HANDSHAKE
              <span className="opacity-60 transition group-hover:translate-x-1">→</span>
            </a>
          )}
          <span className="font-mono text-[11px] tracking-hud text-muted">
            BUNGIE.NET // OAUTH HANDSHAKE
          </span>
        </div>
        {!isAuthed && (
          <p className="max-w-2xl font-mono text-[10px] leading-relaxed tracking-hud text-muted">
            By signing in, you authorize RUNNER//NET to read your bungie.net
            display name, platform memberships, and friend list. We never
            send messages or friend requests on your behalf — friending the
            crew is a one-click handoff to bungie.net you do yourself.
            Tokens stay in httpOnly cookies and are not sold or shared.
          </p>
        )}

        <div className="mt-10 w-full">
          <div className="font-mono text-[11px] tracking-hud text-accent">
            // HOW IT WORKS
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Three steps from solo to a full crew
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            <Step
              n="01"
              title="JACK IN"
              body="Sign in with your Bungie account so we can pull your Runner ID. We never see your password — bungie.net handles the handshake."
            />
            <Step
              n="02"
              title="JOIN OR POST"
              body="Browse open contracts on the infil board and request a slot, or post your own duo / trio for other Runners to fill."
            />
            <Step
              n="03"
              title="ADD ON BUNGIE.NET"
              body="When the host calls infil, click ADD ↗ next to each Runner — opens their bungie.net profile so you can friend them in one click. Then launch Marathon and invite them to your fireteam."
            />
          </ol>
        </div>
      </section>

    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="hud-corner relative border border-line bg-background-elev/60 p-5">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-2xl text-accent">{n}</span>
        <span className="font-mono text-sm tracking-hud text-foreground">{title}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </li>
  );
}
