import type { MetadataRoute } from "next";

/**
 * Robots policy:
 * - Allow indexing of public marketing + legal pages.
 * - Disallow auth-gated paths (the indexer just gets a redirect; no
 *   point spending crawl budget) and admin / API endpoints.
 * - Disallow individual LFG contracts because they're ephemeral and
 *   already marked noindex via generateMetadata.
 *
 * Next 16 serves this at /robots.txt automatically.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/legal/privacy", "/legal/terms"],
        disallow: [
          "/api/",
          "/account/",
          "/runner",
          "/runner/",
          "/lfg",
          "/lfg/",
        ],
      },
    ],
    sitemap: "https://runneruplink.net/sitemap.xml",
  };
}
