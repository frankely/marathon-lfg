import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — RUNNER//NET",
  description: "What RUNNER//NET stores about you, why, and how to delete it.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-30" aria-hidden />

      <header className="relative z-10 border-b border-line/80 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-mono text-xs tracking-hud text-accent"
          >
            [ RUNNER//NET ]
          </Link>
          <Link
            href="/legal/terms"
            className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground"
          >
            TERMS →
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <div>
          <div className="font-mono text-[11px] tracking-hud text-accent">
            // PRIVACY POLICY
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            What we store, why, and how to wipe it
          </h1>
          <p className="mt-2 font-mono text-[11px] tracking-hud text-muted">
            LAST UPDATED 2026-05-07
          </p>
        </div>

        <Section title="The short version">
          <p>
            RUNNER//NET is an unofficial fan project. We store the minimum
            data needed to make the LFG board work: your bungie.net
            membership ID, your display name + #code, and a session cookie
            with your OAuth access token. We don&apos;t collect email,
            payment info, or anything we don&apos;t need. You can delete
            everything tied to your account at any time at{" "}
            <Link href="/account/delete" className="text-accent hover:text-accent-strong">
              /account/delete
            </Link>
            .
          </p>
        </Section>

        <Section title="What we store on the server">
          <p>
            We use a Cloudflare D1 (SQLite) database. The only personal data
            in it is per-LFG-contract:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              Your bungie.net <span className="font-mono text-accent">membership_id</span>{" "}
              (a public identifier from bungie.net).
            </li>
            <li>
              Your bungie.net display name and{" "}
              <span className="font-mono text-accent">#code</span> (also
              public on bungie.net).
            </li>
            <li>
              The role you took in each contract (host or guest), the
              status (pending or confirmed), and the timestamp you joined.
            </li>
          </ul>
          <p className="mt-3">
            We do <strong>not</strong> store: your email address, your real
            name, payment info, IP address, your friend list, your Destiny
            inventory, or anything else from the Bungie API beyond what&apos;s
            listed above.
          </p>
        </Section>

        <Section title="What we store in cookies">
          <p>
            All session cookies are <span className="font-mono">httpOnly</span>{" "}
            and <span className="font-mono">secure</span>, scoped to the
            access-token lifetime (currently ~1 hour, set by Bungie):
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <span className="font-mono text-accent">mlfg_access</span> —
              your Bungie OAuth access token.
            </li>
            <li>
              <span className="font-mono text-accent">mlfg_membership_id</span>{" "}
              — mirror of your membership ID for fast lookup.
            </li>
            <li>
              <span className="font-mono text-accent">mlfg_identity</span> —
              cached display name + code so we don&apos;t hit the Bungie API
              on every page load.
            </li>
            <li>
              <span className="font-mono text-accent">mlfg_oauth_state</span>{" "}
              — short-lived (~10 min) CSRF token used during the OAuth
              handshake.
            </li>
            <li>
              <span className="font-mono text-accent">mlfg_reauth_attempted</span>{" "}
              — short-lived (~2 min) marker used to break re-auth loops if
              your token gets rejected.
            </li>
          </ul>
          <p className="mt-3">
            We don&apos;t use analytics cookies, advertising cookies, or any
            third-party tracking.
          </p>
        </Section>

        <Section title="Who we share data with">
          <p>
            <strong>No one.</strong> Your data is not sold, rented, or shared
            with third parties. The site does send authenticated requests to{" "}
            <a
              href="https://www.bungie.net"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-strong"
            >
              bungie.net
            </a>{" "}
            on your behalf using your OAuth token (to read your display name,
            platform memberships, and friend list); those requests are
            governed by{" "}
            <a
              href="https://www.bungie.net/en/Legal"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-strong"
            >
              Bungie&apos;s privacy policy
            </a>
            . We don&apos;t store your data on Bungie&apos;s side beyond the
            standard OAuth grant record they keep.
          </p>
        </Section>

        <Section title="Where the data lives">
          <p>
            The site runs on Cloudflare Workers. The D1 database is hosted in
            the ENAM (eastern North America) Cloudflare region. Cloudflare
            may handle the data per their{" "}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-strong"
            >
              privacy policy
            </a>
            .
          </p>
        </Section>

        <Section title="Retention">
          <p>
            LFG contracts persist in D1 until either (a) the host scrubs the
            contract via the UI, or (b) you wipe everything tied to your
            account at{" "}
            <Link href="/account/delete" className="text-accent hover:text-accent-strong">
              /account/delete
            </Link>
            . There&apos;s no automatic expiry today. If we add one we&apos;ll
            update this policy.
          </p>
        </Section>

        <Section title="Your rights">
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Access:</strong> everything we store about you is
              visible on{" "}
              <Link href="/runner" className="text-accent hover:text-accent-strong">
                /runner
              </Link>{" "}
              and on each contract page where you&apos;re a member.
            </li>
            <li>
              <strong>Delete:</strong> wipe everything at{" "}
              <Link href="/account/delete" className="text-accent hover:text-accent-strong">
                /account/delete
              </Link>
              . The deletion is immediate and irreversible.
            </li>
            <li>
              <strong>Revoke:</strong> you can also revoke the OAuth grant on{" "}
              <a
                href="https://www.bungie.net/en/User/Settings/Connected"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:text-accent-strong"
              >
                bungie.net
              </a>{" "}
              at any time, which invalidates our access token.
            </li>
          </ul>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we change what we collect or how we use it, we&apos;ll update
            the &quot;LAST UPDATED&quot; date at the top and bump it
            visibly. There&apos;s no email list, so check back here when in
            doubt.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            This is a fan project run by an individual. For questions or
            data requests, the best path is to file an issue on the project
            repository (see{" "}
            <Link href="/legal/terms" className="text-accent hover:text-accent-strong">
              terms
            </Link>{" "}
            for the unaffiliated-with-Bungie disclaimer).
          </p>
        </Section>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="hud-corner relative border border-line bg-background-elev/60 p-5">
      <h2 className="font-mono text-[11px] tracking-hud text-accent">
        // {title.toUpperCase()}
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </div>
  );
}
