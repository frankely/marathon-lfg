"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls `router.refresh()` on a fixed interval so an LFG detail page reacts
 * to other Runners joining / the host calling infil without a manual reload.
 *
 * Pauses when the tab is hidden so we don't burn CPU + Worker invocations
 * for tabs nobody's looking at. Resumes on visibility change.
 *
 * Intentionally polling (not websockets / SSE) — the overhead of one fetch
 * every few seconds per active viewer is negligible at our scale, and this
 * works on Cloudflare Workers without per-connection state.
 */
export default function AutoRefresh({
  intervalMs = 5000,
  enabled = true,
}: {
  intervalMs?: number;
  enabled?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer != null) return;
      timer = setInterval(() => {
        router.refresh();
      }, intervalMs);
    };
    const stop = () => {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    };

    if (document.visibilityState === "visible") start();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        // Refresh once immediately on tab focus so a returning user sees
        // current state without waiting for the next interval tick.
        router.refresh();
        start();
      } else {
        stop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
