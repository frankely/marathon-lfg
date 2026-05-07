import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import NewLfgForm from "@/components/NewLfgForm";

export default async function NewLfgPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");

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
              href="/lfg"
              className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground"
            >
              ← BOARD
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <div>
          <div className="font-mono text-[11px] tracking-hud text-accent">
            // POST A NEW INFIL CONTRACT
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Open a contract
          </h1>
          <p className="mt-2 text-sm text-muted">
            Posting as{" "}
            <span className="font-mono text-foreground">
              {session.displayName}
              {typeof session.displayCode === "number" && (
                <span className="text-muted">
                  #{String(session.displayCode).padStart(4, "0")}
                </span>
              )}
            </span>
            . Other Runners can request a slot until you call infil.
          </p>
        </div>

        <div className="hud-corner relative border border-signal/40 bg-background-elev/60 p-4">
          <div className="font-mono text-[10px] tracking-hud text-signal">
            // WHAT HAPPENS NEXT
          </div>
          <ol className="mt-2 grid gap-2 text-sm text-muted sm:grid-cols-3">
            <li>
              <span className="font-mono text-[10px] text-accent">1 →</span>{" "}
              Your contract appears on the board. Runners join as{" "}
              <span className="text-warn">PENDING</span>.
            </li>
            <li>
              <span className="font-mono text-[10px] text-accent">2 →</span>{" "}
              When you&apos;re ready, hit{" "}
              <span className="text-accent-strong">CALL INFIL</span> to lock
              the crew.
            </li>
            <li>
              <span className="font-mono text-[10px] text-accent">3 →</span>{" "}
              Add each Runner on bungie.net via the one-click link, then
              launch Marathon and invite them in-game.
            </li>
          </ol>
        </div>

        <NewLfgForm
          hostName={session.displayName}
          hostCode={session.displayCode}
        />
      </section>
    </main>
  );
}
