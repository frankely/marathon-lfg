import { NextResponse, type NextRequest } from "next/server";
import { purgeStaleLfgs } from "@/lib/lfg";
import { logError, logInfo } from "@/lib/log";

const DEFAULT_AGE_HOURS = 24;

/**
 * Authenticated admin endpoint that drops contracts older than the cutoff.
 * Triggered on a schedule by .github/workflows/purge.yml; can also be
 * curled manually with the same Bearer token if you need to flush.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>` matching the
 * Worker secret of the same name.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logError("purge_stale", new Error("CRON_SECRET not configured"));
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Allow ?ageHours=N to override the default. Bounded to [1, 168] so a
  // typo can't accidentally wipe the whole DB or be a no-op forever.
  const url = request.nextUrl;
  const raw = Number(url.searchParams.get("ageHours") ?? DEFAULT_AGE_HOURS);
  const ageHours = Number.isFinite(raw) ? Math.min(168, Math.max(1, raw)) : DEFAULT_AGE_HOURS;
  const cutoffMs = Date.now() - ageHours * 60 * 60 * 1000;

  try {
    const deleted = await purgeStaleLfgs(cutoffMs);
    logInfo("purge_stale_completed", { ageHours, deleted });
    return NextResponse.json({ ok: true, ageHours, deleted });
  } catch (e) {
    logError("purge_stale_failed", e);
    return NextResponse.json({ error: "purge_failed" }, { status: 500 });
  }
}
