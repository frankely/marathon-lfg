/**
 * Visual crew-capacity indicator. ●●○ for 2-of-3 confirmed, etc. Reads
 * faster than "2/3" text and scales naturally for both DUO (2 dots) and
 * TRIO (3 dots) sizes.
 *
 * Also flags PENDING members with a hollow-amber dot so a host
 * eyeballing the board can see "this crew has a slot needing my
 * attention" without clicking in.
 */
export function CapacityIndicator({
  capacity,
  filled,
  pending = 0,
  size = "sm",
}: {
  capacity: number;
  filled: number;
  pending?: number;
  size?: "sm" | "lg";
}) {
  const dots: Array<"confirmed" | "pending" | "empty"> = [];
  const confirmedCount = Math.max(0, filled - pending);
  for (let i = 0; i < confirmedCount; i++) dots.push("confirmed");
  for (let i = 0; i < pending; i++) dots.push("pending");
  for (let i = dots.length; i < capacity; i++) dots.push("empty");

  const dotSize = size === "lg" ? "size-3.5" : "size-2.5";

  return (
    <span
      role="img"
      aria-label={`${filled} of ${capacity} runners${pending ? ` (${pending} pending)` : ""}`}
      className="inline-flex items-center gap-1"
    >
      {dots.map((kind, i) => (
        <span
          key={i}
          className={`${dotSize} rounded-full border ${classFor(kind)}`}
        />
      ))}
    </span>
  );
}

function classFor(kind: "confirmed" | "pending" | "empty"): string {
  switch (kind) {
    case "confirmed":
      return "border-signal bg-signal";
    case "pending":
      return "border-warn bg-warn/20 animate-pulse";
    case "empty":
      return "border-line/80 bg-transparent";
  }
}
