import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLfg, type Lfg, type LfgMember } from "@/lib/lfg";
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
  const canInitiate = isHost && lfg.status === "OPEN" && guests.length > 0;
  const isFull = lfg.members.length >= lfg.capacity;
  const canJoin = !me && lfg.status === "OPEN" && !isFull;

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
              ← MANIFEST
            </Link>
          </div>
          <a href="/api/auth/logout" className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground">
            [ EXTRACT // LOG OUT ]
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-hud text-accent">
              // BEACON {lfg.id}
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
          <Stat label="CREW" value={`${lfg.members.length}/${lfg.capacity}`} highlight={isFull} />
          <Stat label="OPENED" value={fmtClock(lfg.createdAt)} />
          <Stat
            label={lfg.initiatedAt ? "INITIATED" : "STATUS"}
            value={lfg.initiatedAt ? fmtClock(lfg.initiatedAt) : lfg.status}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isHost && lfg.status === "OPEN" && (
            <form action={initiateLfgAction}>
              <input type="hidden" name="id" value={lfg.id} />
              <button
                type="submit"
                disabled={!canInitiate}
                className="hud-corner relative inline-flex items-center gap-2 border border-accent bg-accent/10 px-5 py-2 font-mono text-[11px] tracking-hud text-accent-strong transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                INITIATE DROP — SEND FRIEND REQUESTS →
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
                REQUEST INSERTION →
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
                ABORT INSERTION
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
                TERMINATE BEACON
              </button>
            </form>
          )}
          {!canJoin && !me && lfg.status === "OPEN" && isFull && (
            <span className="font-mono text-[11px] tracking-hud text-warn">CREW AT CAPACITY</span>
          )}
          {lfg.status !== "OPEN" && !me && (
            <span className="font-mono text-[11px] tracking-hud text-muted">DROP NO LONGER ACCEPTING RUNNERS</span>
          )}
        </div>

        <div>
          <div className="mb-3 font-mono text-[11px] tracking-hud text-accent">
            // CREW MANIFEST
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

        {lfg.status === "INITIATED" && (
          <div className="hud-corner relative border border-signal/40 bg-background-elev/60 p-4">
            <div className="font-mono text-[11px] tracking-hud text-signal">
              // DROP INITIATED — FRIEND REQUESTS DISPATCHED
            </div>
            <p className="mt-2 text-sm text-muted">
              Friend-request status is shown per Runner above. Recipients still need
              to accept on bungie.net for the link to finalize.
            </p>
          </div>
        )}
      </section>
    </main>
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
  const fr = member.friendRequest;

  return (
    <li className="hud-corner relative flex flex-wrap items-center justify-between gap-4 border border-line bg-background-elev/60 p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
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
          {fr && (
            <span className={fr.ok ? "text-signal" : "text-danger"}>
              FRIEND REQ: {fr.ok ? "SENT" : "FAILED"}
            </span>
          )}
        </div>
        {fr?.error && (
          <pre className="mt-1 max-w-md whitespace-pre-wrap font-mono text-[10px] text-danger/80">
            {fr.error}
          </pre>
        )}
      </div>
      {isHostViewer && !isHost && lfg.status === "OPEN" && (
        <form action={kickMemberAction}>
          <input type="hidden" name="id" value={lfg.id} />
          <input type="hidden" name="membershipId" value={member.membershipId} />
          <button
            type="submit"
            className="border border-line px-3 py-1.5 font-mono text-[10px] tracking-hud text-muted hover:border-danger/60 hover:text-danger"
          >
            EXTRACT
          </button>
        </form>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: Lfg["status"] }) {
  const tone =
    status === "OPEN" ? "border-accent text-accent" : status === "INITIATED" ? "border-signal text-signal" : "border-line text-muted";
  return (
    <span className={`shrink-0 border px-3 py-1 font-mono text-[11px] tracking-hud ${tone}`}>
      {status}
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
