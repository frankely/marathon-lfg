/**
 * Tiny formatting utilities. Pure functions, server-or-client safe.
 */

export function fmtTimeAgo(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins}m AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h AGO`;
  return `${Math.floor(hours / 24)}d AGO`;
}

export function fmtBungieTag(name: string, code?: number): string {
  if (typeof code !== "number") return name;
  return `${name}#${String(code).padStart(4, "0")}`;
}

export function initialsOf(name: string): string {
  // Take first letter of each word, max 2 chars. "Frankely Diaz" → "FD".
  // Single-word names → first 2 chars uppercased.
  const trimmed = name.trim();
  if (!trimmed) return "??";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
