import type { MetadataRoute } from "next";

/**
 * Static sitemap. Public pages only — no LFG contract URLs (those are
 * ephemeral and noindex'd anyway), no auth-gated routes (they require
 * a session and have nothing to index).
 *
 * Next 16 serves this at /sitemap.xml automatically.
 */
const SITE = "https://runneruplink.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE}/legal/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE}/legal/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
