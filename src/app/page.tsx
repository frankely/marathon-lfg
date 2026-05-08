import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE } from "@/lib/bungie";

type SearchParams = Promise<{ deleted?: string }>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const cookieStore = await cookies();
  const isAuthed = Boolean(cookieStore.get(COOKIE.access)?.value);
  const { deleted } = await searchParams;

  return (
    <main id="main" tabIndex={-1} className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />
      {deleted && (
        <div className="relative z-20 border-b border-signal/40 bg-signal/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3 font-mono text-[11px] tracking-hud">
            <span className="text-signal">
              ✓ ACCOUNT WIPED — all RUNNER//NET data tied to your Bungie ID
              has been deleted. (Your bungie.net account is untouched.)
            </span>
          </div>
        </div>
      )}

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

      {isAuthed ? <AuthedHome /> : <UnauthedHome />}
    </main>
  );
}

/**
 * Returning-user view. Skips the marketing copy entirely — they've
 * already opted in. Single hero CTA into the actual product.
 */
function AuthedHome() {
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-start justify-center gap-10 px-6 py-24">
      <div className="font-mono text-xs tracking-hud text-accent">
        // SHELL ONLINE — WELCOME BACK
      </div>

      <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
        Find a crew.
      </h1>

      <p className="max-w-2xl text-xl leading-relaxed text-muted">
        Open the infil board to see live contracts, or post your own. Your
        profile and account settings are one click away in the header on
        any page.
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/lfg"
          className="hud-corner cta-primary group relative inline-flex items-center gap-3 border px-8 py-4 font-mono text-base tracking-hud"
        >
          <span className="size-1.5 rounded-full bg-black animate-pulse" />
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
      </div>
    </section>
  );
}

/**
 * First-time / signed-out view. Full marketing pitch + sign-in CTA +
 * how-it-works + scope/consent disclosure.
 */
function UnauthedHome() {
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-10 px-6 py-24 sm:py-28">
      <div className="font-mono text-xs tracking-hud text-accent">
        // INCOMING TRANSMISSION — UESC RUNNER NETWORK
      </div>

      <h1 className="max-w-4xl text-6xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-8xl">
        Form your crew.
        <br />
        <span className="text-accent">Exfil richer.</span>
      </h1>

      <p className="max-w-2xl text-xl leading-relaxed text-muted">
        RUNNER//NET is the unofficial LFG uplink for Marathon. Sign in with
        your Bungie account to surface your Runner identity, broadcast
        contracts, and fill out duos and trios for the next infil into Tau
        Ceti IV.
      </p>

      <div className="flex flex-col gap-3">
        <a
          href="/api/auth/login"
          className="hud-corner cta-primary group relative inline-flex w-fit items-center gap-3 border px-8 py-4 font-mono text-base tracking-hud"
        >
          <span className="size-1.5 rounded-full bg-black animate-pulse" />
          SIGN IN WITH BUNGIE
          <span className="opacity-60 transition group-hover:translate-x-1">→</span>
        </a>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-hud text-muted">
          <span>NO ACCOUNT TO CREATE</span>
          <span aria-hidden>·</span>
          <span>YOUR PASSWORD STAYS ON BUNGIE.NET</span>
          <span aria-hidden>·</span>
          <span>~10 SECONDS</span>
        </span>
      </div>

      <p className="max-w-2xl border-l-2 border-line/80 pl-4 font-mono text-[11px] leading-relaxed tracking-hud text-muted">
        By signing in, you authorize RUNNER//NET to read your bungie.net
        display name, platform memberships, and friend list. We never send
        messages or friend requests on your behalf — friending the crew is
        a one-click handoff to bungie.net you do yourself. Tokens stay in
        httpOnly cookies and are not sold or shared.
      </p>

      <div className="mt-12 w-full">
        <div className="font-mono text-xs tracking-hud text-accent">
          // HOW IT WORKS
        </div>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Three steps from solo to a full crew
        </h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-3">
          <Step
            n="01"
            title="SIGN IN"
            body="One click via bungie.net's OAuth. We never see your password — bungie.net handles the handshake. You authorize, you come back, you're in."
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
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="hud-corner card-lift relative border border-line bg-background-elev/60 p-6">
      <div className="flex items-start justify-between">
        <span className="serial-number">{n}</span>
        <span className="mt-3 font-mono text-[11px] tracking-hud text-muted">
          STEP
        </span>
      </div>
      <div className="mt-4 font-mono text-base tracking-hud text-foreground">
        {title}
      </div>
      <p className="mt-3 text-base leading-relaxed text-muted">{body}</p>
    </li>
  );
}
