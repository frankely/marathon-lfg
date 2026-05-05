import Link from "next/link";
import { redirect } from "next/navigation";
import { listLfgs } from "@/lib/lfg";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LfgBoard() {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");

  const lfgs = await listLfgs();
  const open = lfgs.filter((l) => l.status === "OPEN");
  const initiated = lfgs.filter((l) => l.status === "INITIATED");

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />

      <header className="relative z-10 border-b border-line/80 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-mono text-xs tracking-hud text-accent">
              [ RUNNER//NET ]
            </Link>
            <Link href="/runner" className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground">
              ← PROFILE
            </Link>
          </div>
          <a href="/api/auth/logout" className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground">
            [ EXTRACT // LOG OUT ]
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[11px] tracking-hud text-accent">
              // DROP MANIFEST — OPEN RUNS
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Active uplinks
            </h1>
          </div>
          <Link
            href="/lfg/new"
            className="hud-corner group relative inline-flex items-center gap-2 border border-accent bg-accent/10 px-4 py-2 font-mono text-[11px] tracking-hud text-accent-strong hover:bg-accent/20"
          >
            POST NEW RUN
            <span className="opacity-60 transition group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {open.length === 0 ? (
          <div className="hud-corner relative border border-line bg-background-elev/60 p-6">
            <div className="font-mono text-[11px] tracking-hud text-muted">// EMPTY MANIFEST</div>
            <p className="mt-2 text-sm text-muted">
              No open runs. Be the first to broadcast a beacon.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {open.map((lfg) => (
              <LfgCard key={lfg.id} lfg={lfg} />
            ))}
          </ul>
        )}

        {initiated.length > 0 && (
          <div className="mt-4">
            <div className="mb-3 font-mono text-[11px] tracking-hud text-signal">
              // RECENTLY INITIATED — DROPPED
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {initiated.slice(0, 6).map((lfg) => (
                <LfgCard key={lfg.id} lfg={lfg} />
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}

function LfgCard({ lfg }: { lfg: Awaited<ReturnType<typeof listLfgs>>[number] }) {
  const host = lfg.members.find((m) => m.role === "HOST");
  const filled = lfg.members.length;
  const isOpen = lfg.status === "OPEN";

  return (
    <li>
      <Link
        href={`/lfg/${lfg.id}`}
        className="hud-corner relative flex flex-col gap-3 border border-line bg-background-elev/60 p-4 transition hover:border-accent/60 hover:bg-background-elev"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-base text-foreground">{lfg.title}</span>
          <span
            className={`shrink-0 border px-2 py-0.5 font-mono text-[10px] tracking-hud ${
              isOpen ? "border-accent/60 text-accent" : "border-signal/60 text-signal"
            }`}
          >
            {lfg.status}
          </span>
        </div>
        {lfg.notes && <p className="line-clamp-2 text-sm text-muted">{lfg.notes}</p>}
        <div className="flex items-center justify-between font-mono text-[11px] tracking-hud text-muted">
          <span>
            HOST <span className="text-foreground">{host?.displayName ?? "—"}</span>
          </span>
          <span>
            {lfg.capacity === 2 ? "DUO" : "TRIO"} ·{" "}
            <span className={filled >= lfg.capacity ? "text-warn" : "text-foreground"}>
              {filled}
            </span>
            <span className="text-muted">/{lfg.capacity}</span>
          </span>
        </div>
      </Link>
    </li>
  );
}
