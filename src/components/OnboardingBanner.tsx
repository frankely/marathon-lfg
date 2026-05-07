import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const DISMISS_COOKIE = "mlfg_onboarding_dismissed";

/**
 * One-time "first time on the board" intro. Renders only when the user
 * hasn't dismissed it. Dismiss action sets a year-long cookie so it stays
 * gone across sessions.
 *
 * Server-rendered on purpose — no client JS needed for either the render
 * or the dismiss flow. Server action handles the cookie write + revalidate.
 */
export default async function OnboardingBanner() {
  const store = await cookies();
  if (store.get(DISMISS_COOKIE)?.value === "1") return null;

  async function dismiss() {
    "use server";
    const s = await cookies();
    s.set(DISMISS_COOKIE, "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/lfg");
  }

  return (
    <div className="hud-corner relative border border-signal/60 bg-background-elev/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="font-mono text-[11px] tracking-hud text-signal">
            // FIRST TIME ON THE BOARD?
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            Each card below is a crew assembling for an infil into Tau Ceti
            IV. Click one to see the manifest and{" "}
            <span className="text-signal">request a slot</span>, or hit{" "}
            <span className="text-accent">POST CONTRACT</span> to host your
            own duo or trio.
          </p>
          <ol className="flex flex-col gap-1 font-mono text-[11px] tracking-hud text-muted">
            <li>
              <span className="text-accent">JOIN</span> a contract → wait
              for the host to call infil
            </li>
            <li>
              <span className="text-accent">HOST</span> calls infil →
              everyone adds each Runner on bungie.net (one click each)
            </li>
            <li>
              <span className="text-accent">LAUNCH</span> Marathon →
              invite the crew to your fireteam
            </li>
          </ol>
        </div>
        <form action={dismiss}>
          <button
            type="submit"
            className="border border-line px-3 py-1 font-mono text-[10px] tracking-hud text-muted hover:border-foreground hover:text-foreground"
            aria-label="Dismiss onboarding intro"
          >
            DISMISS ✕
          </button>
        </form>
      </div>
    </div>
  );
}
