import Link from "next/link";
import { redirect } from "next/navigation";
import { listLfgs } from "@/lib/lfg";
import { getSession } from "@/lib/session";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ size?: string; show?: string }>;

type SizeFilter = "any" | "duo" | "trio";
type ShowFilter = "open" | "all";

function parseSize(raw: string | undefined): SizeFilter {
  return raw === "duo" || raw === "trio" ? raw : "any";
}
function parseShow(raw: string | undefined): ShowFilter {
  return raw === "all" ? "all" : "open";
}

export default async function LfgBoard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");

  const { size: sizeRaw, show: showRaw } = await searchParams;
  const size = parseSize(sizeRaw);
  const show = parseShow(showRaw);

  const all = await listLfgs();
  const sizeFiltered =
    size === "duo"
      ? all.filter((l) => l.capacity === 2)
      : size === "trio"
        ? all.filter((l) => l.capacity === 3)
        : all;
  const open = sizeFiltered.filter((l) => l.status === "OPEN");
  const initiated = sizeFiltered.filter((l) => l.status === "INITIATED");

  return (
    <main className="relative flex flex-1 flex-col">
      {/* Live updates so a host sees joins arrive without refreshing. */}
      <AutoRefresh intervalMs={10000} />
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
            [ EXFIL // LOG OUT ]
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-hud text-accent">
              // INFIL BOARD
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Find a crew, or post your own
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Each card below is a crew assembling for an infil into Tau Ceti
              IV. Click in to see the manifest and{" "}
              <span className="text-signal">request a slot</span>, or hit{" "}
              <span className="text-accent">POST CONTRACT</span> to host your
              own.
            </p>
          </div>
          <Link
            href="/lfg/new"
            className="hud-corner group relative inline-flex shrink-0 items-center gap-2 border border-accent bg-accent/10 px-4 py-2 font-mono text-[11px] tracking-hud text-accent-strong hover:bg-accent/20"
          >
            POST CONTRACT
            <span className="opacity-60 transition group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        <FilterBar size={size} show={show} />

        {open.length === 0 ? (
          <div className="hud-corner relative border border-line bg-background-elev/60 p-6">
            <div className="font-mono text-[11px] tracking-hud text-muted">// BOARD QUIET</div>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              {size === "any"
                ? "No open contracts right now. Be the first to post — Runners checking the board will see your contract immediately."
                : `No open ${size === "duo" ? "duos" : "trios"} right now. Try widening the filter or post your own.`}
            </p>
            <Link
              href="/lfg/new"
              className="mt-4 inline-flex items-center gap-2 border border-accent bg-accent/10 px-4 py-2 font-mono text-[11px] tracking-hud text-accent-strong hover:bg-accent/20"
            >
              POST {size === "any" ? "THE FIRST" : `A NEW ${size === "duo" ? "DUO" : "TRIO"}`} CONTRACT →
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {open.map((lfg) => (
              <LfgCard key={lfg.id} lfg={lfg} />
            ))}
          </ul>
        )}

        {show === "all" && initiated.length > 0 && (
          <div className="mt-4">
            <div className="mb-3 font-mono text-[11px] tracking-hud text-signal">
              // ON INFIL — CREWS EN ROUTE
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

function FilterBar({ size, show }: { size: SizeFilter; show: ShowFilter }) {
  // Build query strings that preserve the *other* filter when one changes.
  const urlFor = (next: { size?: SizeFilter; show?: ShowFilter }) => {
    const params = new URLSearchParams();
    const s = next.size ?? size;
    const sh = next.show ?? show;
    if (s !== "any") params.set("size", s);
    if (sh !== "open") params.set("show", sh);
    const q = params.toString();
    return q ? `/lfg?${q}` : "/lfg";
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line/60 pb-3 font-mono text-[11px] tracking-hud">
      <FilterGroup label="SIZE">
        <FilterPill href={urlFor({ size: "any" })} active={size === "any"}>
          ANY
        </FilterPill>
        <FilterPill href={urlFor({ size: "duo" })} active={size === "duo"}>
          DUO
        </FilterPill>
        <FilterPill href={urlFor({ size: "trio" })} active={size === "trio"}>
          TRIO
        </FilterPill>
      </FilterGroup>
      <FilterGroup label="SHOW">
        <FilterPill href={urlFor({ show: "open" })} active={show === "open"}>
          OPEN ONLY
        </FilterPill>
        <FilterPill href={urlFor({ show: "all" })} active={show === "all"}>
          OPEN + ON INFIL
        </FilterPill>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-accent">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`border px-2 py-0.5 transition ${
        active
          ? "border-accent bg-accent/10 text-accent-strong"
          : "border-line text-muted hover:border-accent/60 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
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
            {lfg.status === "INITIATED" ? "ON INFIL" : lfg.status}
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
