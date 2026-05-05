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
  title: "RUNNER//NET — Marathon LFG",
  description:
    "Looking-for-Crew uplink for Runners infiling Tau Ceti IV. Form duos and trios, broadcast contracts, exfil richer.",
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
        {children}
        <footer className="relative z-10 border-t border-line/60 bg-background/40 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-3 font-mono text-[10px] leading-relaxed tracking-hud text-muted sm:flex-row sm:items-center">
            <span>
              UNAFFILIATED FAN PROJECT · NOT ENDORSED BY OR ASSOCIATED WITH BUNGIE
            </span>
            <span>
              MARATHON, BUNGIE, AND ALL RELATED MARKS ARE TRADEMARKS OF
              BUNGIE, INC. ·{" "}
              <a
                href="https://www.bungie.net/en/Legal"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                BUNGIE LEGAL ↗
              </a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
