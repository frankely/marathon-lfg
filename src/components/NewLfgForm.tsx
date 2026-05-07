"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createLfgAction } from "@/app/lfg/actions";

const TITLE_MAX = 80;
const NOTES_MAX = 280;

// Curated quick-tags for the briefing field. Clicking toggles a [TAG]
// prefix in the notes textarea. Pure derived state — "is this tag
// active" is just whether the prefix appears in the notes.
const QUICK_TAGS = [
  { id: "mic", label: "MIC", prefix: "[MIC]" },
  { id: "no-mic", label: "NO MIC", prefix: "[NO-MIC]" },
  { id: "exp", label: "EXPERIENCED", prefix: "[EXP]" },
  { id: "casual", label: "FIRST-TIME OK", prefix: "[CASUAL]" },
  { id: "stealth", label: "STEALTH", prefix: "[STEALTH]" },
  { id: "loot", label: "LOOT FOCUS", prefix: "[LOOT]" },
] as const;

export default function NewLfgForm({
  hostName,
  hostCode,
}: {
  hostName: string;
  hostCode?: number;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [capacity, setCapacity] = useState<2 | 3>(3);
  const formRef = useRef<HTMLFormElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const isTagActive = (prefix: string) => notes.includes(prefix);

  const toggleTag = (prefix: string) => {
    if (isTagActive(prefix)) {
      // Remove the prefix and a single trailing space if present.
      setNotes((n) => n.replace(`${prefix} `, "").replace(prefix, ""));
    } else {
      // Prepend so tags stay grouped at the start of the briefing.
      setNotes((n) => (n ? `${prefix} ${n}` : `${prefix} `));
    }
    // Refocus the textarea so the user can keep typing.
    requestAnimationFrame(() => notesRef.current?.focus());
  };

  // Cmd/Ctrl+Enter submits from anywhere in the form.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (!title.trim()) return;
        formRef.current?.requestSubmit();
      }
    };
    const f = formRef.current;
    f?.addEventListener("keydown", onKey);
    return () => f?.removeEventListener("keydown", onKey);
  }, [title]);

  const titleRemaining = TITLE_MAX - title.length;
  const notesRemaining = NOTES_MAX - notes.length;
  const titleNearLimit = titleRemaining <= 10;
  const notesNearLimit = notesRemaining <= 30;

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <form
        ref={formRef}
        action={createLfgAction}
        className="hud-corner relative flex flex-col gap-5 border border-line bg-background-elev/60 p-6"
      >
        {/* Title */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="title"
              className="font-mono text-[10px] tracking-hud text-accent"
            >
              CALLSIGN / TITLE
            </label>
            <span
              className={`font-mono text-[10px] tracking-hud ${titleNearLimit ? "text-warn" : "text-muted"}`}
            >
              {titleRemaining}
            </span>
          </div>
          <input
            id="title"
            name="title"
            required
            maxLength={TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Trio infil — Dire Marsh sweep"
            className="border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Briefing */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor="notes"
              className="font-mono text-[10px] tracking-hud text-accent"
            >
              BRIEFING (OPTIONAL)
            </label>
            <span
              className={`font-mono text-[10px] tracking-hud ${notesNearLimit ? "text-warn" : "text-muted"}`}
            >
              {notesRemaining}
            </span>
          </div>
          <textarea
            id="notes"
            name="notes"
            maxLength={NOTES_MAX}
            rows={3}
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mic preferred. Stealth shells. Faction contracts welcome."
            className="resize-none border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="mr-1 font-mono text-[10px] tracking-hud text-muted">
              QUICK TAGS:
            </span>
            {QUICK_TAGS.map((t) => {
              const active = isTagActive(t.prefix);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.prefix)}
                  aria-pressed={active}
                  className={`border px-2 py-0.5 font-mono text-[10px] tracking-hud transition ${
                    active
                      ? "border-accent bg-accent/15 text-accent-strong"
                      : "border-line text-muted hover:border-accent/60 hover:text-foreground"
                  }`}
                >
                  {active ? "✓ " : "+ "}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Capacity */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="capacity"
            className="font-mono text-[10px] tracking-hud text-accent"
          >
            LOOKING FOR
          </label>
          <select
            id="capacity"
            name="capacity"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value) === 2 ? 2 : 3)}
            className="border border-line bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="2">+1 — fill out a DUO</option>
            <option value="3">+2 — fill out a TRIO</option>
          </select>
          <p className="font-mono text-[10px] tracking-hud text-muted">
            You count as 1 of the crew. Marathon runs cap at trios.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <SubmitButton disabled={!title.trim()} />
            <Link
              href="/lfg"
              className="font-mono text-[11px] tracking-hud text-muted hover:text-foreground"
            >
              [ ABORT ]
            </Link>
          </div>
          <span className="hidden font-mono text-[10px] tracking-hud text-muted sm:inline">
            ⌘ / CTRL + ↵ TO POST
          </span>
        </div>
      </form>

      {/* Live preview — what the contract will look like on the board */}
      <div className="flex flex-col gap-3">
        <div className="font-mono text-[10px] tracking-hud text-muted">
          // PREVIEW — HOW YOUR CARD WILL LOOK ON THE BOARD
        </div>
        <PreviewCard
          title={title || "Your callsign appears here"}
          notes={notes}
          capacity={capacity}
          hostName={hostName}
          hostCode={hostCode}
          isPlaceholder={!title.trim()}
        />
      </div>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  // useFormStatus reads from the parent <form>'s action state — gives us
  // a real "is the server action in flight" signal so we can disable the
  // button and avoid double-submits.
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`hud-corner relative inline-flex items-center gap-2 border px-5 py-2 font-mono text-[11px] tracking-hud transition ${
        isDisabled
          ? "cursor-not-allowed border-line bg-background-elev text-muted"
          : "border-accent bg-accent/10 text-accent-strong hover:bg-accent/20"
      }`}
    >
      {pending ? "POSTING…" : "POST CONTRACT →"}
    </button>
  );
}

function PreviewCard({
  title,
  notes,
  capacity,
  hostName,
  hostCode,
  isPlaceholder,
}: {
  title: string;
  notes: string;
  capacity: 2 | 3;
  hostName: string;
  hostCode?: number;
  isPlaceholder: boolean;
}) {
  return (
    <div
      className={`hud-corner relative flex flex-col gap-3 border bg-background-elev/60 p-4 transition ${
        isPlaceholder ? "border-dashed border-line/60 opacity-60" : "border-accent/40"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-base text-foreground">{title}</span>
        <span className="shrink-0 border border-accent/60 px-2 py-0.5 font-mono text-[10px] tracking-hud text-accent">
          OPEN
        </span>
      </div>
      {notes && (
        <p className="line-clamp-2 text-sm text-muted">{notes}</p>
      )}
      <div className="flex items-center justify-between font-mono text-[11px] tracking-hud text-muted">
        <span>
          HOST{" "}
          <span className="text-foreground">{hostName}</span>
          {typeof hostCode === "number" && (
            <span className="text-muted">
              #{String(hostCode).padStart(4, "0")}
            </span>
          )}
        </span>
        <span>
          {capacity === 2 ? "DUO" : "TRIO"} ·{" "}
          <span className="text-foreground">1</span>
          <span className="text-muted">/{capacity}</span>
        </span>
      </div>
    </div>
  );
}
