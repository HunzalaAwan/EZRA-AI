"use client";

import * as React from "react";
import { PhoneIncomingIcon, PlayIcon, StopIcon, TranslateIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { WidgetSettings } from "@/lib/api/types";
import { inkOn } from "@/lib/widget";
import { cn } from "@/lib/utils";

/**
 * A call to the business, heard from the caller's side.
 *
 * It rings for the chosen number of rings, picks up, and speaks the greeting
 * with captions that follow each word. The sound is the browser's own speech
 * at the chosen pace and warmth: a rough preview of rhythm and wording, not
 * the agent's real voice, and the page says so. Where the browser cannot
 * speak, the captions play on their own.
 */

type Phase = "idle" | "ringing" | "talking" | "done";

const HOLD_LABEL = { silence: "Silence", piano: "Soft piano", acoustic: "Acoustic guitar" } as const;

export function VoicePreview({
  settings: s,
  businessName,
  voiceName,
  voiceTone,
}: {
  settings: WidgetSettings;
  businessName: string;
  voiceName: string;
  voiceTone: string;
}) {
  const v = s.voice;
  const text = v.spanish ? `${v.greeting} También hablo español.` : v.greeting;
  const words = React.useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [word, setWord] = React.useState(-1);
  const [canSpeak, setCanSpeak] = React.useState<boolean | null>(null);
  const timers = React.useRef<number[]>([]);
  const ticker = React.useRef<number | null>(null);

  React.useEffect(() => setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window), []);

  const clear = React.useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    if (ticker.current) window.clearInterval(ticker.current);
    ticker.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);
  React.useEffect(() => clear, [clear]);
  // Any change to what would be said resets the call.
  React.useEffect(() => {
    clear();
    setPhase("idle");
    setWord(-1);
  }, [text, v.pace, v.warmth, v.answerAfterRings, clear]);

  function captionsByClock() {
    // Roughly 2.6 words a second at normal pace.
    const ms = 380 / v.pace;
    let i = 0;
    ticker.current = window.setInterval(() => {
      setWord(i);
      i += 1;
      if (i >= words.length && ticker.current) {
        window.clearInterval(ticker.current);
        ticker.current = null;
        timers.current.push(window.setTimeout(() => setPhase("done"), 700));
      }
    }, ms);
  }

  function speak() {
    setPhase("talking");
    setWord(0);
    if (!canSpeak) return captionsByClock();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = v.pace;
    u.pitch = 1.25 - v.warmth * 0.5;
    const voices = window.speechSynthesis.getVoices().filter((x) => x.lang.startsWith("en"));
    if (voices[0]) u.voice = voices[0];
    // Word boundaries move the caption. Some voices never send them, so the
    // clock takes over if none has arrived shortly after speech starts.
    let gotBoundary = false;
    const starts = words.reduce<number[]>((acc, w, i) => {
      acc.push(i === 0 ? 0 : acc[i - 1]! + words[i - 1]!.length + 1);
      return acc;
    }, []);
    u.onboundary = (e) => {
      if (e.name && e.name !== "word") return;
      gotBoundary = true;
      let idx = starts.findIndex((st, i) => e.charIndex >= st && e.charIndex < (starts[i + 1] ?? Infinity));
      if (idx < 0) idx = words.length - 1;
      setWord(idx);
    };
    u.onstart = () =>
      timers.current.push(
        window.setTimeout(() => {
          if (!gotBoundary && !ticker.current) captionsByClock();
        }, 700),
      );
    u.onend = () => {
      if (ticker.current) return;
      setWord(words.length - 1);
      setPhase("done");
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function play() {
    clear();
    setWord(-1);
    setPhase("ringing");
    timers.current.push(window.setTimeout(speak, v.answerAfterRings * 1300));
  }

  function stop() {
    clear();
    setPhase("idle");
    setWord(-1);
  }

  const live = phase === "talking";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* The phone screen. */}
      <div
        style={{ "--accent": s.accent } as React.CSSProperties}
        className="relative flex h-[30rem] w-full max-w-[19rem] flex-col items-center overflow-hidden rounded-[2.75rem] bg-[#0c0c11] px-6 pb-8 pt-12 text-white shadow-[0_30px_70px_-30px_rgb(0_0_0/0.7)] ring-8 ring-[#1f1f26]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 size-[26rem] -translate-x-1/2 rounded-full opacity-40 blur-[90px]"
          style={{ background: s.accent }}
        />
        <p className="relative text-xs font-medium uppercase tracking-[0.18em] text-white/70">
          {phase === "idle" ? "Calling" : phase === "ringing" ? "Ringing" : phase === "talking" ? "Connected" : "Call preview"}
        </p>
        <p className="relative mt-2 text-center font-display text-2xl font-semibold leading-tight">{businessName}</p>
        <p className="relative mt-1 text-sm text-white/70">Answered by {voiceName}</p>

        {/* The orb: still when idle, rings when ringing, breathes with speech. */}
        <div className="relative my-auto flex size-44 items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: s.accent }}
              animate={
                phase === "ringing"
                  ? { scale: [0.6, 1.25], opacity: [0.7, 0] }
                  : live
                    ? { scale: [0.82 + i * 0.08, 0.9 + i * 0.1, 0.82 + i * 0.08], opacity: 0.55 - i * 0.15 }
                    : { scale: 0.7 + i * 0.12, opacity: 0.18 }
              }
              transition={
                phase === "ringing"
                  ? { duration: 1.3, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }
                  : { duration: 0.9 + i * 0.25, repeat: live ? Infinity : 0, ease: "easeInOut" }
              }
            />
          ))}
          <motion.span
            className="relative flex size-24 items-center justify-center rounded-full shadow-[0_0_60px_-6px_var(--accent)]"
            style={{ background: s.accent }}
            animate={live ? { scale: [1, 1.07, 0.98, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 1.1, repeat: live ? Infinity : 0, ease: "easeInOut" }}
          >
            <PhoneIncomingIcon aria-hidden className="size-9" style={{ color: inkOn(s.accent) }} />
          </motion.span>
        </div>

        {/* Captions, word by word. */}
        <p aria-live="polite" className="relative min-h-[5.5rem] text-center text-[15px] leading-relaxed">
          {phase === "idle" || phase === "ringing" ? (
            <span className="text-white/60">Press play to hear how a caller is greeted.</span>
          ) : (
            words.map((w, i) => (
              <span key={i} className={cn("transition-colors duration-150", i <= word ? "text-white" : "text-white/35")}>
                {w}{" "}
              </span>
            ))
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {phase === "ringing" || phase === "talking" ? (
          <Button variant="secondary" onClick={stop}>
            <StopIcon aria-hidden weight="fill" />
            Stop
          </Button>
        ) : (
          <Button variant="primary" onClick={play}>
            <PlayIcon aria-hidden weight="fill" />
            {phase === "done" ? "Play again" : "Play the greeting"}
          </Button>
        )}
      </div>

      <dl className="grid w-full max-w-[22rem] grid-cols-2 gap-2 text-xs">
        {[
          ["Voice", `${voiceName}, ${voiceTone.split(",")[0]!.toLowerCase()}`],
          ["Picks up after", `${v.answerAfterRings} ${v.answerAfterRings === 1 ? "ring" : "rings"}`],
          ["While transferring", HOLD_LABEL[v.hold]],
          ["Background", v.ambience === "office" ? "Quiet office" : "None"],
        ].map(([k, val]) => (
          <div key={k} className="rounded-xl bg-panel px-3 py-2">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="mt-0.5 font-medium text-ink">{val}</dd>
          </div>
        ))}
      </dl>
      {v.spanish ? (
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <TranslateIcon aria-hidden className="size-4 text-primary" />
          Switches to Spanish when the caller does.
        </p>
      ) : null}
      <p className="max-w-[22rem] text-center text-xs leading-relaxed text-ink-muted">
        {canSpeak === false
          ? "Your browser cannot play speech, so the captions play on their own."
          : "Played in your browser's voice to check the wording and pace. Callers hear the voice you chose."}
      </p>
    </div>
  );
}
