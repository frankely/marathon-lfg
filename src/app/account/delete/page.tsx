import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { countUserData } from "@/lib/lfg";
import { deleteAccountAction } from "@/app/account/actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/api/auth/login");

  const { error } = await searchParams;
  const counts = await countUserData(session.membershipId);

  return (
    <main id="main" tabIndex={-1} className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-30" aria-hidden />

      <header className="relative z-10 border-b border-line/80 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
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
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <div>
          <div className="font-mono text-[11px] tracking-hud text-danger">
            // DANGER ZONE — IRREVERSIBLE
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Delete my data
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This wipes your data from RUNNER//NET. It does <em>not</em>{" "}
            affect your bungie.net account, your Marathon progress, or any
            friends you&apos;ve already added through bungie.net.
          </p>
        </div>

        <div className="hud-corner relative border border-danger/60 bg-background-elev/70 p-5">
          <div className="font-mono text-[11px] tracking-hud text-danger">
            // WHAT GETS DELETED
          </div>
          <ul className="mt-3 space-y-2 text-sm text-foreground">
            <li>
              <span className="font-mono text-accent">{counts.hosted}</span>{" "}
              {counts.hosted === 1 ? "contract" : "contracts"} you host —
              deleted entirely (every Runner on those contracts loses access
              to the page).
            </li>
            <li>
              <span className="font-mono text-accent">{counts.memberships}</span>{" "}
              {counts.memberships === 1 ? "contract" : "contracts"} where
              you&apos;re a guest — your row is removed (the contract itself
              and other Runners stay).
            </li>
            <li>
              Your session cookies (access token, cached identity) — cleared.
            </li>
            <li>
              Your stored bungie.net{" "}
              <span className="font-mono text-accent">membership_id</span>,
              display name, and{" "}
              <span className="font-mono text-accent">#code</span> — purged
              from D1.
            </li>
          </ul>
        </div>

        {error === "mismatch" && (
          <div className="hud-corner relative border border-warn/60 bg-background-elev/70 p-4">
            <div className="font-mono text-[11px] tracking-hud text-warn">
              // CONFIRMATION DID NOT MATCH
            </div>
            <p className="mt-2 text-sm text-foreground">
              You need to type{" "}
              <span className="font-mono text-foreground">DELETE MY DATA</span>{" "}
              exactly (case-sensitive) to confirm.
            </p>
          </div>
        )}

        <form
          action={deleteAccountAction}
          className="hud-corner relative flex flex-col gap-4 border border-line bg-background-elev/60 p-5"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="confirm"
              className="font-mono text-[10px] tracking-hud text-danger"
            >
              TYPE{" "}
              <span className="text-foreground">DELETE MY DATA</span>{" "}
              TO CONFIRM
            </label>
            <input
              id="confirm"
              name="confirm"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="DELETE MY DATA"
              className="border border-line bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted focus:border-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="border border-danger bg-danger/10 px-5 py-2 font-mono text-[11px] tracking-hud text-danger hover:bg-danger/20"
            >
              PERMANENTLY DELETE EVERYTHING
            </button>
            <Link
              href="/runner"
              className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground"
            >
              [ CANCEL ]
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
