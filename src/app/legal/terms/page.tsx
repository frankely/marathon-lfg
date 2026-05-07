import Link from "next/link";

export const metadata = {
  title: "Terms of Service — RUNNER//NET",
  description: "Rules for using the RUNNER//NET LFG board.",
};

export default function TermsPage() {
  return (
    <main className="relative flex flex-1 flex-col">
      <div className="grid-bg absolute inset-0 opacity-30" aria-hidden />

      <header className="relative z-10 border-b border-line/80 bg-background/40 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-mono text-xs tracking-hud text-accent">
            [ RUNNER//NET ]
          </Link>
          <Link
            href="/legal/privacy"
            className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground"
          >
            PRIVACY →
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <div>
          <div className="font-mono text-[11px] tracking-hud text-accent">
            // TERMS OF SERVICE
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Rules of the road
          </h1>
          <p className="mt-2 font-mono text-[11px] tracking-hud text-muted">
            LAST UPDATED 2026-05-07
          </p>
        </div>

        <Section title="What this is">
          <p>
            RUNNER//NET (&quot;the site&quot;) is an unofficial,
            community-run looking-for-crew board for the game Marathon by
            Bungie. It is{" "}
            <strong>not affiliated with, endorsed by, or operated by Bungie, Inc.</strong>{" "}
            All Marathon, Bungie, and related marks are trademarks of
            Bungie, Inc.
          </p>
          <p className="mt-3">
            By using the site you agree to these terms. If you don&apos;t
            agree, don&apos;t sign in.
          </p>
        </Section>

        <Section title="Eligibility">
          <p>
            You need a bungie.net account to use the site. Bungie has its
            own age and conduct rules at{" "}
            <a
              href="https://www.bungie.net/en/Legal/Terms"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-strong"
            >
              bungie.net/Legal/Terms
            </a>
            . If you violate Bungie&apos;s terms or your account is in bad
            standing with them, you can&apos;t use this site either.
          </p>
        </Section>

        <Section title="What you can do">
          <ul className="list-disc space-y-1 pl-6">
            <li>Post LFG contracts looking for crew members.</li>
            <li>Join other Runners&apos; contracts.</li>
            <li>
              Use the contact-registry view to see your bungie.net friend
              list.
            </li>
            <li>Delete your data at any time.</li>
          </ul>
        </Section>

        <Section title="What you can't do">
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Post titles, briefings, or any user-generated content that
              is harassing, hateful, sexually explicit, threatening, illegal,
              or that targets other Runners or real people.
            </li>
            <li>Impersonate Bungie, Bungie staff, or other Runners.</li>
            <li>
              Post commercial content, advertising, sales, recruitment for
              services, or anything outside the scope of forming a Marathon
              crew.
            </li>
            <li>
              Use the site to harvest other users&apos; bungie.net data,
              spam, scrape, or run automated scripts that aren&apos;t a
              normal browser session.
            </li>
            <li>
              Attempt to bypass authentication, exploit the OAuth flow, or
              probe the API for vulnerabilities (responsible-disclosure
              reports are welcome — see{" "}
              <Link href="/legal/privacy" className="text-accent hover:text-accent-strong">
                privacy
              </Link>{" "}
              for contact).
            </li>
          </ul>
          <p className="mt-3">
            Violating these can result in your data being deleted and your
            access being blocked, at our sole discretion, without notice.
          </p>
        </Section>

        <Section title="Your content, your responsibility">
          <p>
            Anything you post (contract titles, briefings, crew rosters) is
            your content. You&apos;re responsible for it. We don&apos;t
            pre-moderate. By posting, you grant us a non-exclusive license
            to display it on the site for the purpose of running the LFG
            board — nothing more.
          </p>
          <p className="mt-3">
            We may remove content that violates these terms at our
            discretion.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            The site is provided <strong>&quot;as is&quot;</strong> without
            warranty of any kind. It might break. Bungie&apos;s API might
            change. Your contracts might disappear. Your friend requests
            (which you send manually on bungie.net) might get rejected. We
            don&apos;t guarantee the site will be available, accurate, or
            free of bugs.
          </p>
        </Section>

        <Section title="No liability">
          <p>
            To the maximum extent permitted by law, the site&apos;s
            operator(s) aren&apos;t liable for any damages arising from
            your use of the site, including lost crews, missed infils,
            in-game losses, or any indirect or consequential damages.
            You use the site at your own risk.
          </p>
        </Section>

        <Section title="We may shut this down">
          <p>
            This is a hobby project. We may take it offline at any time, for
            any reason, with or without notice. If that happens, your stored
            data will be deleted as part of decommissioning. If you want to
            preserve your data before that, the deletion endpoint at{" "}
            <Link href="/account/delete" className="text-accent hover:text-accent-strong">
              /account/delete
            </Link>{" "}
            shows you exactly what we have on file.
          </p>
        </Section>

        <Section title="Bungie's terms still apply">
          <p>
            Using this site does not exempt you from Bungie&apos;s rules
            for using their platform, their API, or the Marathon game
            itself. If anything in our terms appears to conflict with
            Bungie&apos;s, Bungie&apos;s wins.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We&apos;ll update the &quot;LAST UPDATED&quot; date at the top
            when these change. Continued use after a change means you accept
            the updated terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For questions about these terms, content removal requests, or
            responsible-disclosure security reports, file an issue on the
            project&apos;s GitHub repository.
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
