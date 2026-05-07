import "server-only";

/**
 * Structured logging that flows into Cloudflare Workers Logs (and stdout
 * locally). Designed to be greppable in the CF dashboard's Logs view —
 * every entry is one JSON line with a stable `event` name.
 *
 * Why not Sentry / external APM? At this scale the CF-native logs cover
 * the same ground for $0 and zero extra dependencies. Workers Logs ships
 * with: 7-day retention on free tier, real-time tail, structured
 * filtering, and zero bundle bloat. If we ever outgrow that, swapping the
 * impls in this file is a 30-minute job.
 *
 * Usage:
 *   logInfo("oauth_callback", { membershipId });
 *   logError("oauth_callback_failed", err, { code });
 */

type Fields = Record<string, unknown>;

function emit(level: "info" | "warn" | "error", event: string, fields: Fields) {
  // Stringify with sensible defaults — Errors lose their stack on plain
  // JSON.stringify, so unwrap them ourselves.
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const line = JSON.stringify(payload, (_k, v) => {
    if (v instanceof Error) {
      return { name: v.name, message: v.message, stack: v.stack };
    }
    return v;
  });
  // Workers Logs captures console.* output verbatim. Use the matching
  // level so the dashboard's level filter works.
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logInfo(event: string, fields: Fields = {}): void {
  emit("info", event, fields);
}

export function logWarn(event: string, fields: Fields = {}): void {
  emit("warn", event, fields);
}

export function logError(event: string, err: unknown, fields: Fields = {}): void {
  const errorField =
    err instanceof Error ? err : { name: "NonError", message: String(err) };
  emit("error", event, { ...fields, error: errorField });
}
