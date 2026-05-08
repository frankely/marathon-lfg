import path from "node:path";
import type { NextConfig } from "next";

/**
 * Security response headers applied to every route.
 *
 * Beyond the obvious "good practice" reasons, these matter for us because
 * Chrome's Safe Browsing heuristics flag fresh domains with OAuth callback
 * URLs as potential phishing kits. Phishing kits typically lack these
 * headers; production-grade sites have them. Sending them is one of the
 * trust signals the heuristic engine uses to disambiguate.
 */
const SECURITY_HEADERS = [
  // Force HTTPS for 2 years. Adding `preload` advertises eligibility for
  // the HSTS preload list; submit at hstspreload.org once we're confident
  // we'll never need to serve the apex over plain HTTP.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Prevent MIME-type sniffing — known XSS vector when off.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URL paths to third parties via Referer header. We do
  // need same-origin referrer for some Next.js client navigation, so use
  // the standard "strict-origin-when-cross-origin" rather than no-referrer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disallow embedding the site in iframes (clickjacking protection).
  // CSP frame-ancestors is the modern equivalent; X-Frame-Options is the
  // belt-and-suspenders for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Lock down permission APIs we don't use. Helps quell heuristic
  // suspicion that the page might be requesting sensitive permissions.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), midi=()",
  },
  // Cross-origin isolation hints — defensive, restrict who can interact
  // with our window/document via JS.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't get confused by lockfiles
  // higher up the tree (e.g. ~/package-lock.json).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Don't broadcast the framework. Tiny obscurity gain; bigger value as
  // a signal the site is intentionally configured rather than out-of-the-box.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
    ];
  },
};

export default nextConfig;
