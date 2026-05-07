import { initialsOf } from "@/lib/format";

/**
 * Initials-based avatar tile. Marathon-styled — square (not round),
 * thin accent border, monospace text. Used wherever we render a
 * Runner identity but don't have a real bungie.net portrait cached.
 *
 * Color is derived from the membership ID (deterministic) so the same
 * Runner always gets the same accent color across the app — gives
 * subtle visual continuity without needing avatar URLs.
 */

const TONES = [
  { border: "border-accent/60", bg: "bg-accent/10", text: "text-accent-strong" },
  { border: "border-signal/60", bg: "bg-signal/10", text: "text-signal" },
  { border: "border-warn/60", bg: "bg-warn/10", text: "text-warn" },
  { border: "border-foreground/40", bg: "bg-foreground/10", text: "text-foreground" },
] as const;

function toneFor(seed: string) {
  // Simple deterministic hash — same membership ID always gets same tone.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

export function Avatar({
  name,
  seed,
  size = "md",
  isHost = false,
}: {
  name: string;
  seed: string;
  size?: "sm" | "md" | "lg";
  isHost?: boolean;
}) {
  // Hosts always get the accent (orange) tone for instant visual identification.
  const tone = isHost ? TONES[0] : toneFor(seed);
  const sizeClass =
    size === "sm"
      ? "size-8 text-[10px]"
      : size === "lg"
        ? "size-14 text-base"
        : "size-10 text-xs";

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center border font-mono tracking-wider ${sizeClass} ${tone.border} ${tone.bg} ${tone.text}`}
    >
      {initialsOf(name)}
    </span>
  );
}
