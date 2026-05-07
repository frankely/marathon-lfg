import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLfg, type Lfg, type LfgMember } from "@/lib/lfg";
import { bungieProfileUrl } from "@/lib/bungie";
import { getSession } from "@/lib/session";
import {
  deleteLfgAction,
  initiateLfgAction,
  joinLfgAction,
  kickMemberAction,
  leaveLfgAction,
} from "@/app/lfg/actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function LfgDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/api/auth/login");

  const lfg = await getLfg(id);
  if (!lfg) notFound();

  const isHost = lfg.hostMembershipId === session.membershipId;
  const me = lfg.members.find((m) => m.membershipId === session.membershipId);
  const guests = lfg.members.filter((m) => m.role === "GUEST");
  const host = lfg.members.find((m) => m.role === "HOST");
  const isFull = lfg.members.length >= lfg.capacity;
  const canJoin = !me && lfg.status === "OPEN" && !isFull;
  const canInitiate = isHost && lfg.status === "OPEN" && guests.length > 0;

  return (
    <main className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />

      <header className="relative z-10 border-b border-line/80 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-mono text-xs tracking-hud text-accent">
              [ RUNNER//NET ]
            </Link>
            <Link href="/lfg" className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground">
              ← BOARD
            </Link>
          </div>
          <a href="/api/auth/logout" className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground">
            [ EXFIL // LOG OUT ]
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-hud text-accent">
              // CONTRACT {lfg.id}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {lfg.title}
            </h1>
            {lfg.notes && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{lfg.notes}</p>
            )}
          </div>
          <StatusBadge status={lfg.status} />
        </div>

        <div className="hud-corner relative grid grid-cols-3 gap-3 border border-line bg-background-elev/60 p-4 font-mono text-[11px] tracking-hud">
          <Stat
            label={lfg.capacity === 2 ? "DUO" : "TRIO"}
            value={`${lfg.members.length}/${lfg.capacity}`}
            highlight={isFull}
          />
          <Stat label="POSTED" value={fmtClock(lfg.createdAt)} />
          <Stat
            label={lfg.initiatedAt ? "INFIL CALLED" : "STATUS"}
            value={
              lfg.initiatedAt
                ? fmtClock(lfg.initiatedAt)
                : lfg.status === "INITIATED"
                  ? "ON INFIL"
                  : lfg.status
            }
          />
        </div>

        <NextStepPanel
          lfg={lfg}
          isHost={isHost}
          me={me}
          host={host}
          isFull={isFull}
          canJoin={canJoin}
          canInitiate={canInitiate}
        />

        <div className="flex flex-wrap items-center gap-3">
          {isHost && lfg.status === "OPEN" && (
            <form action={initiateLfgAction}>
              <input type="hidden" name="id" value={lfg.id} />
              <button
                type="submit"
                disabled={!canInitiate}
                className="hud-corner relative inline-flex items-center gap-2 border border-accent bg-accent/10 px-5 py-2 font-mono text-[11px] tracking-hud text-accent-strong transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                CALL INFIL — LOCK CREW →
              </button>
            </form>
          )}
          {canJoin && (
            <form action={joinLfgAction}>
              <input type="hidden" name="id" value={lfg.id} />
              <button
                type="submit"
                className="hud-corner relative inline-flex items-center gap-2 border border-signal/60 bg-signal/10 px-4 py-2 font-mono text-[11px] tracking-hud text-signal hover:bg-signal/20"
              >
                REQUEST SLOT →
              </button>
            </form>
          )}
          {me && !isHost && (
            <form action={leaveLfgAction}>
              <input type="hidden" name="id" value={lfg.id} />
              <button
                type="submit"
                className="border border-line px-3 py-2 font-mono text-[11px] tracking-hud text-muted hover:border-danger/60 hover:text-danger"
              >
                DROP SLOT
              </button>
            </form>
          )}
          {isHost && (
            <form action={deleteLfgAction}>
              <input type="hidden" name="id" value={lfg.id} />
              <button
                type="submit"
                className="border border-line px-3 py-2 font-mono text-[11px] tracking-hud text-muted hover:border-danger/60 hover:text-danger"
              >
                SCRUB CONTRACT
              </button>
            </form>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-hud text-accent">
              // CREW MANIFEST
            </span>
            {lfg.status === "INITIATED" && (
              <span className="font-mono text-[10px] tracking-hud text-signal">
                CLICK ↗ TO ADD ON BUNGIE.NET
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {lfg.members.map((m) => (
              <MemberRow
                key={m.membershipId}
                member={m}
                lfg={lfg}
                isHostViewer={isHost}
                isSelf={m.membershipId === session.membershipId}
              />
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

/**
 * Big plain-English instruction panel that adapts to the viewer's role and
 * the LFG's current state. The whole point is to make it obvious what to do
 * next without having to read the rest of the page.
 */
function NextStepPanel({
  lfg,
  isHost,
  me,
  host,
  isFull,
  canJoin,
  canInitiate,
}: {
  lfg: Lfg;
  isHost: boolean;
  me: LfgMember | undefined;
  host: LfgMember | undefined;
  isFull: boolean;
  canJoin: boolean;
  canInitiate: boolean;
}) {
  if (lfg.status === "INITIATED") {
    return (
      <Panel tone="signal" tag="// NEXT — ADD CREW ON BUNGIE.NET">
        <p className="text-sm leading-relaxed text-foreground">
          {isHost ? "You called infil." : "Host called infil."} Now add each
          Runner below as a friend on bungie.net using the{" "}
          <span className="text-signal">ADD ↗</span> button. Once they accept,
          launch Marathon — they&apos;ll show up in your friends list and you
          can invite them to a fireteam.
        </p>
        <p className="mt-2 font-mono text-[11px] tracking-hud text-muted">
          Why manual? Bungie reserves the friend-request API for first-party
          apps, so this site can&apos;t do it for you. One click per Runner.
        </p>
      </Panel>
    );
  }

  if (lfg.status === "CLOSED") {
    return (
      <Panel tone="muted" tag="// CONTRACT CLOSED">
        <p className="text-sm text-muted">
          This contract has been terminated. Head back to the{" "}
          <Link href="/lfg" className="text-accent hover:text-accent-strong">
            board
          </Link>{" "}
          for other open infils.
        </p>
      </Panel>
    );
  }

  // status === "OPEN" — branch on viewer role
  if (isHost) {
    if (canInitiate && isFull) {
      return (
        <Panel tone="accent" tag="// READY — CREW IS FULL">
          <p className="text-sm leading-relaxed text-foreground">
            Crew at capacity. Hit{" "}
            <span className="text-accent-strong">CALL INFIL</span> below to
            lock the manifest — you&apos;ll then add each Runner on
            bungie.net and invite them in-game.
          </p>
        </Panel>
      );
    }
    if (canInitiate) {
      const need = lfg.capacity - lfg.members.length;
      return (
        <Panel tone="accent" tag="// HOSTING — WAITING ON RUNNERS">
          <p className="text-sm leading-relaxed text-foreground">
            You have {lfg.members.length - 1}{" "}
            {lfg.members.length - 1 === 1 ? "Runner" : "Runners"} on the
            manifest, looking for {need} more. You can{" "}
            <span className="text-accent-strong">CALL INFIL</span> now to roll
            out short, or wait for the crew to fill.
          </p>
        </Panel>
      );
    }
    // Host with no guests yet
    return (
      <Panel tone="accent" tag="// HOSTING — SHARE THIS PAGE">
        <p className="text-sm leading-relaxed text-foreground">
          No Runners yet. The contract is live on the{" "}
          <Link href="/lfg" className="text-accent hover:text-accent-strong">
            board
          </Link>{" "}
          and will appear for everyone authed in. You can also share this
          page&apos;s URL directly. Once at least 1 Runner joins, you can{" "}
          <span className="text-accent-strong">CALL INFIL</span>.
        </p>
      </Panel>
    );
  }

  // Viewer is a guest (already joined)
  if (me) {
    return (
      <Panel tone="warn" tag="// YOU'RE ON THE MANIFEST — STANDBY">
        <p className="text-sm leading-relaxed text-foreground">
          You&apos;re slotted as <span className="text-warn">PENDING</span>.
          Once{" "}
          <span className="text-foreground">{host?.displayName ?? "the host"}</span>{" "}
          calls infil, you&apos;ll add each Runner on bungie.net (one click
          each), then launch Marathon and meet up in-game.
        </p>
        <p className="mt-2 font-mono text-[11px] tracking-hud text-muted">
          Bookmark this page or keep the tab open — it&apos;ll switch to
          ON INFIL when the host is ready.
        </p>
      </Panel>
    );
  }

  // Viewer is not a member yet
  if (canJoin) {
    return (
      <Panel tone="signal" tag="// JOIN THIS CREW">
        <p className="text-sm leading-relaxed text-foreground">
          Hit <span className="text-signal">REQUEST SLOT</span> below to add
          yourself to the manifest. You&apos;ll show as PENDING until{" "}
          <span className="text-foreground">{host?.displayName ?? "the host"}</span>{" "}
          calls infil, at which point you&apos;ll add the rest of the crew
          on bungie.net to play together.
        </p>
      </Panel>
    );
  }

  // Full or otherwise can't join
  return (
    <Panel tone="warn" tag="// CREW AT CAPACITY">
      <p className="text-sm text-muted">
        This {lfg.capacity === 2 ? "duo" : "trio"} is full. Try the{" "}
        <Link href="/lfg" className="text-accent hover:text-accent-strong">
          board
        </Link>{" "}
        for other open infils, or post your own.
      </p>
    </Panel>
  );
}

function Panel({
  tone,
  tag,
  children,
}: {
  tone: "accent" | "signal" | "warn" | "muted";
  tag: string;
  children: React.ReactNode;
}) {
  const border =
    tone === "accent"
      ? "border-accent/60"
      : tone === "signal"
        ? "border-signal/60"
        : tone === "warn"
          ? "border-warn/60"
          : "border-line";
  const tagColor =
    tone === "accent"
      ? "text-accent"
      : tone === "signal"
        ? "text-signal"
        : tone === "warn"
          ? "text-warn"
          : "text-muted";
  return (
    <div className={`hud-corner relative border ${border} bg-background-elev/70 p-5`}>
      <div className={`font-mono text-[11px] tracking-hud ${tagColor}`}>{tag}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function MemberRow({
  member,
  lfg,
  isHostViewer,
  isSelf,
}: {
  member: LfgMember;
  lfg: Lfg;
  isHostViewer: boolean;
  isSelf: boolean;
}) {
  const isHost = member.role === "HOST";
  const showAddCta = lfg.status === "INITIATED" && !isSelf;

  return (
    <li className="hud-corner relative flex flex-wrap items-center justify-between gap-4 border border-line bg-background-elev/60 p-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base text-foreground">{member.displayName}</span>
          {typeof member.displayCode === "number" && (
            <span className="font-mono text-[11px] text-muted">
              #{String(member.displayCode).padStart(4, "0")}
            </span>
          )}
          {isSelf && <span className="font-mono text-[10px] tracking-hud text-accent">[ YOU ]</span>}
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-hud">
          <span className={isHost ? "text-accent" : "text-muted"}>
            {isHost ? "HOST" : "GUEST"}
          </span>
          <StatusDot status={member.status} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showAddCta && (
          <a
            href={bungieProfileUrl(member.membershipId)}
            target="_blank"
            rel="noreferrer"
            className="hud-corner relative inline-flex items-center gap-1.5 border border-signal/60 bg-signal/10 px-3 py-1.5 font-mono text-[10px] tracking-hud text-signal hover:bg-signal/20"
          >
            ADD ON BUNGIE.NET ↗
          </a>
        )}
        {isHostViewer && !isHost && lfg.status === "OPEN" && (
          <form action={kickMemberAction}>
            <input type="hidden" name="id" value={lfg.id} />
            <input type="hidden" name="membershipId" value={member.membershipId} />
            <button
              type="submit"
              className="border border-line px-3 py-1.5 font-mono text-[10px] tracking-hud text-muted hover:border-danger/60 hover:text-danger"
            >
              EJECT
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: Lfg["status"] }) {
  const tone =
    status === "OPEN"
      ? "border-accent text-accent"
      : status === "INITIATED"
        ? "border-signal text-signal"
        : "border-line text-muted";
  const label = status === "INITIATED" ? "ON INFIL" : status;
  return (
    <span className={`shrink-0 border px-3 py-1 font-mono text-[11px] tracking-hud ${tone}`}>
      {label}
    </span>
  );
}

function StatusDot({ status }: { status: LfgMember["status"] }) {
  if (status === "CONFIRMED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-signal">
        <span className="size-1.5 rounded-full bg-signal" /> CONFIRMED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-warn">
      <span className="size-1.5 rounded-full bg-warn animate-pulse" /> PENDING
    </span>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-accent">{label}</span>
      <span className={highlight ? "text-warn" : "text-foreground"}>{value}</span>
    </div>
  );
}

function fmtClock(ts: number): string {
  const now = Date.now();
  const diff = Math.max(0, now - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins}m AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h AGO`;
  return `${Math.floor(hours / 24)}d AGO`;
}
