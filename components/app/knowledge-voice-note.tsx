"use client";

import * as React from "react";
import { CheckCircleIcon, MicrophoneIcon, StopIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { dictationSupported, startDictation, type Dictation, type DictationError } from "@/lib/voice/dictation";
import { cn } from "@/lib/utils";

/**
 * Say it: the owner presses the microphone and talks, and what they say
 * becomes a note the agents know. No questions to answer, no form to fill.
 *
 * For the owner who will never write a policy page but can explain a thing
 * out loud in thirty seconds. The words land in an editable box as they are
 * spoken, so a misheard word is fixed by typing, and speaking and typing mix
 * freely. Each note is saved on its own, and another can follow straight
 * away.
 */

export interface VoiceNote {
  title: string;
  text: string;
}

const MIC_ERROR: Record<DictationError, string> = {
  blocked: "Your microphone is blocked. Allow it from the address bar, or type the note instead.",
  silence: "We did not hear anything. Try again a little closer to the microphone, or type it.",
  failed: "Listening stopped unexpectedly. Try again, or type the note.",
};

/** A title from the first few words, for when the owner does not give one. */
function titleFrom(text: string) {
  const words = text.replace(/[^\p{L}\p{N}\s'-]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 6);
  const t = words.join(" ");
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "A note";
}

function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function KnowledgeVoiceNote({ onSave, onDone }: { onSave: (note: VoiceNote) => void; onDone: () => void }) {
  const [text, setText] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [saved, setSaved] = React.useState<string[]>([]);

  // Whether this browser can listen. Known only after mount, so the server and
  // the first client render agree; until then the microphone button waits.
  const [canListen, setCanListen] = React.useState<boolean | null>(null);
  const [listening, setListening] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [micError, setMicError] = React.useState<string | null>(null);
  const dictation = React.useRef<Dictation | null>(null);
  const base = React.useRef("");

  React.useEffect(() => setCanListen(dictationSupported()), []);
  React.useEffect(() => () => dictation.current?.stop(), []);
  React.useEffect(() => {
    if (!listening) return;
    setSeconds(0);
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [listening]);

  function stopListening() {
    dictation.current?.stop();
    dictation.current = null;
    setListening(false);
  }

  function toggleMic() {
    if (listening) return stopListening();
    setMicError(null);
    base.current = text.trim();
    setListening(true);
    dictation.current = startDictation({
      onText: (t) => setText(base.current ? `${base.current} ${t}` : t),
      onEnd: () => {
        dictation.current = null;
        setListening(false);
      },
      onError: (e) => setMicError(MIC_ERROR[e]),
    });
  }

  function save() {
    stopListening();
    const note = { title: title.trim() || titleFrom(text), text: text.trim() };
    if (!note.text) return;
    onSave(note);
    setSaved((s) => [...s, note.title]);
    setText("");
    setTitle("");
    setMicError(null);
  }

  return (
    <div className="space-y-4">
      {saved.length ? (
        <ul aria-label="Saved just now" aria-live="polite" className="flex flex-wrap gap-1.5">
          {saved.map((t, i) => (
            <li key={`${t}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-success-wash px-2.5 py-1 text-xs font-medium text-ink">
              <CheckCircleIcon aria-hidden weight="fill" className="size-3.5 text-success" />
              {t}
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={cn(
          "rounded-2xl border bg-surface p-3 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25",
          listening ? "border-primary" : "border-rule-control",
        )}
      >
        <label htmlFor="kb-say" className="sr-only">
          Your note
        </label>
        <Textarea
          id="kb-say"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) {
              e.preventDefault();
              save();
            }
          }}
          placeholder={
            listening
              ? "Listening. Talk the way you would to a new hire."
              : "Press the microphone and say it, or type. For example: we close at noon on Christmas Eve and reopen on the 27th."
          }
          className="min-h-32 resize-y border-0 bg-transparent px-1 focus:ring-0 focus:ring-offset-0"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleMic}
            disabled={canListen !== true}
            aria-pressed={listening}
            aria-label={listening ? "Stop listening" : "Say it out loud"}
            className={cn(
              "relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-45",
              listening ? "bg-danger text-on-primary" : "bg-ink text-canvas hover:bg-ink/85",
            )}
          >
            {listening ? <span aria-hidden className="absolute inset-0 animate-halo rounded-full border-2 border-danger motion-reduce:hidden" /> : null}
            {listening ? <StopIcon aria-hidden weight="fill" className="size-4.5" /> : <MicrophoneIcon aria-hidden className="size-5" />}
          </button>

          {listening ? (
            <span className="flex items-center gap-2 text-sm text-ink">
              <Bars />
              Listening
              <span data-numeric className="font-mono text-xs text-ink-muted">
                {clock(seconds)}
              </span>
            </span>
          ) : (
            <span className="text-xs text-ink-muted">
              {canListen === false
                ? "Speaking needs Chrome, Edge, or Safari. Type the note instead."
                : text.trim()
                  ? "Fix any misheard words by typing. Press the microphone again to add more."
                  : "One topic per note works best: holiday hours, parking, what you never quote."}
            </span>
          )}
        </div>
        {micError ? (
          <p role="alert" className="mt-2 rounded-lg bg-danger-wash px-3 py-2 text-xs text-ink">
            {micError}
          </p>
        ) : null}
      </div>

      {text.trim() ? (
        <Field label="Call it" htmlFor="kb-say-title" hint="Optional. Leave it and we name it from the first words." className="max-w-md">
          <Input value={title} maxLength={60} placeholder={titleFrom(text)} onChange={(e) => setTitle(e.target.value)} />
        </Field>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={save} disabled={!text.trim()}>
          Save note
        </Button>
        <Button
          variant={saved.length ? "secondary" : "quiet"}
          onClick={() => {
            stopListening();
            onDone();
          }}
        >
          {saved.length ? "Done" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}

/** A small live level, so the owner can see they are being heard. */
function Bars() {
  return (
    <span aria-hidden className="flex h-4 items-end gap-0.5">
      {[0.5, 1, 0.7, 0.9, 0.6].map((h, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-primary"
          style={{ height: `${h * 100}%`, transformOrigin: "bottom" }}
          animate={{ scaleY: [0.35, 1, 0.5, 0.85, 0.35] }}
          transition={{ duration: 0.9 + i * 0.12, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}
