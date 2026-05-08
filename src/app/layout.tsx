import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://runneruplink.net"),
  // Per-page generateMetadata can override `title` directly; pages that
  // set a title use the template here so headers read e.g.
  // "Open a contract — RUNNER//NET".
  title: {
    default: "RUNNER//NET — Marathon LFG",
    template: "%s — RUNNER//NET",
  },
  description:
    "Looking-for-Crew uplink for Runners infiling Tau Ceti IV. Form duos and trios, broadcast contracts, exfil richer.",
  keywords: [
    "Marathon",
    "Marathon LFG",
    "Marathon looking for group",
    "Bungie Marathon",
    "Tau Ceti IV",
    "Runner",
    "Marathon crew finder",
    "extraction shooter LFG",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "RUNNER//NET",
    title: "RUNNER//NET — Marathon LFG",
    description:
      "Find a crew. Exfil richer. Looking-for-Crew uplink for Marathon Runners.",
    url: "https://runneruplink.net",
  },
  twitter: {
    card: "summary",
    title: "RUNNER//NET — Marathon LFG",
    description:
      "Find a crew. Exfil richer. Looking-for-Crew uplink for Marathon Runners.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col scanlines">
        {/* Skip-to-content link — visible only when keyboard-focused.
            Lets keyboard users bypass the header nav on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-accent focus:bg-background focus:px-3 focus:py-2 focus:font-mono focus:text-xs focus:tracking-hud focus:text-accent"
        >
          SKIP TO CONTENT
        </a>
        {children}
        <footer className="relative z-10 mt-auto border-t border-line/60 bg-background/40 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 font-mono text-xs leading-relaxed tracking-hud text-muted">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a href="/legal/privacy" className="hover:text-foreground">
                PRIVACY
              </a>
              <span aria-hidden>·</span>
              <a href="/legal/terms" className="hover:text-foreground">
                TERMS
              </a>
              <span aria-hidden>·</span>
              <a href="/account/delete" className="hover:text-foreground">
                DELETE MY DATA
              </a>
              <span aria-hidden>·</span>
              <a
                href="https://www.bungie.net/en/Legal"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                BUNGIE LEGAL ↗
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-muted">
              <span>
                UNAFFILIATED FAN PROJECT · NOT ENDORSED BY OR ASSOCIATED WITH BUNGIE
              </span>
              <span>
                MARATHON, BUNGIE, AND ALL RELATED MARKS ARE TRADEMARKS OF
                BUNGIE, INC.
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
