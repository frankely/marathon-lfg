import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createLfgAction } from "@/app/lfg/actions";

export default async function NewLfgPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />

      <header className="relative z-10 border-b border-line/80 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-mono text-xs tracking-hud text-accent">
              [ RUNNER//NET ]
            </Link>
            <Link href="/lfg" className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground">
              ← MANIFEST
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
        <div>
          <div className="font-mono text-[11px] tracking-hud text-accent">// OPEN A NEW BEACON</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Broadcast a run
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
            . Other Runners can request insertion until you initiate the drop.
          </p>
        </div>

        <form action={createLfgAction} className="hud-corner relative flex flex-col gap-5 border border-line bg-background-elev/60 p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="font-mono text-[10px] tracking-hud text-accent">
              CALLSIGN / TITLE
            </label>
            <input
              id="title"
              name="title"
              required
              maxLength={80}
              placeholder="Trio drop — Tau Ceti perimeter"
              className="border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="notes" className="font-mono text-[10px] tracking-hud text-accent">
              BRIEFING (OPTIONAL)
            </label>
            <textarea
              id="notes"
              name="notes"
              maxLength={280}
              rows={3}
              placeholder="Mic preferred. Stealth comp. Last hour of cycle."
              className="resize-none border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="capacity" className="font-mono text-[10px] tracking-hud text-accent">
              LOOKING FOR
            </label>
            <select
              id="capacity"
              name="capacity"
              defaultValue="3"
              className="border border-line bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="2">+1 — fill out a DUO</option>
              <option value="3">+2 — fill out a TRIO</option>
            </select>
            <p className="font-mono text-[10px] tracking-hud text-muted">
              You count as 1 of the crew. Marathon runs cap at trios.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="hud-corner relative inline-flex items-center gap-2 border border-accent bg-accent/10 px-5 py-2 font-mono text-[11px] tracking-hud text-accent-strong hover:bg-accent/20"
            >
              OPEN BEACON →
            </button>
            <Link href="/lfg" className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground">
              [ ABORT ]
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
