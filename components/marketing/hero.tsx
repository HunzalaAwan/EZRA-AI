"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  HeadsetIcon,
  LightningIcon,
  PhoneCallIcon,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import { VoiceOrb } from "./voice-orb";
import { cn } from "@/lib/utils";

/**
 * The hero, as one dark stage.
 *
 * The voice orb is the background: a large sphere of violet light rising from
 * the bottom edge, moving slowly, leaning a little toward the cursor. The
 * headline and the single black-on-white action sit in the clear space above
 * it. An earlier version put the orb in its own panel under the headline with
 * orbit rings, arriving particles, three chips and a captions box over the
 * sphere; it read as busy, so all of that went and the sphere stayed.
 *
 * One slim line of captions cycles at the foot of the stage, so the orb is
 * still visibly the voice of a call.
 *
 * The stage is dark in both themes, because the scene is content, and its
 * rounded shape matches the closing panel so the page opens and ends in the
 * same form. Loops run only while the stage is on screen; reduced motion is
 * read inside an effect, never during render.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const WORDS = ["Never", "miss", "another"];

/** Capability, not proof by association. Every line here ships today. */
const FACTS: { icon: Icon; label: string; tone: string }[] = [
  { icon: PhoneCallIcon, label: "Answers on the first ring", tone: "#c4b5fd" },
  { icon: CalendarCheckIcon, label: "Books into your calendar", tone: "#8be3f0" },
  { icon: HeadsetIcon, label: "Hands off to a person", tone: "#f5a6d8" },
  { icon: LightningIcon, label: "Live in about five minutes", tone: "#f3d27a" },
];

/** The call the orb is voicing. Illustrative, not customer data. */
const CAPTIONS: { who: "Caller" | "EZRA"; text: string }[] = [
  { who: "Caller", text: "Hi, I chipped a tooth. Can anyone see me this week?" },
  { who: "EZRA", text: "I have Thursday at 9:40 or Friday at 2:20." },
  { who: "Caller", text: "Thursday works, thank you." },
  { who: "EZRA", text: "You are booked. The confirmation is on its way." },
  { who: "Caller", text: "Can I talk to someone about my bill?" },
  { who: "EZRA", text: "Of course. Putting you through to Priya now." },
];

export function Hero() {
  const stage = React.useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { amount: 0.2 });
  const [line, setLine] = React.useState(0);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!inView) return;
    const id = window.setInterval(() => setLine((n) => (n + 1) % CAPTIONS.length), 3000);
    return () => window.clearInterval(id);
  }, [inView]);

  const current = CAPTIONS[line] ?? CAPTIONS[0]!;

  return (
    <section className="px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        ref={stage}
        className="relative isolate mx-auto flex min-h-[44rem] max-w-[1400px] flex-col overflow-hidden rounded-[2rem] bg-media sm:min-h-[48rem] sm:rounded-[3rem] lg:min-h-[52rem]"
      >
        {/* Ground and scene. The gradient carries the stage on its own if
            WebGL is unavailable. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_50%_100%,#3b1d82_0%,#1a0d3d_45%,#07040f_100%)]"
        />
        <VoiceOrb minimal className="absolute inset-0 -z-10" />
        {/* Keeps the reading area clean: the sphere's light is allowed into
            the lower half only, so no dot ever sits behind a word. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#07040f_0%,rgb(7_4_15/0.92)_38%,rgb(7_4_15/0.35)_62%,transparent_80%)]"
        />
        {/* A hairline grid that fades out under the headline, for depth. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(70%_55%_at_50%_10%,black,transparent)]"
        />

        <div className="relative px-5 pt-20 text-center sm:px-8 sm:pt-28">
          <h1 className="display-1 mx-auto max-w-[11ch] text-on-media">
            {WORDS.map((w, i) => (
              <motion.span
                key={w}
                className="inline-block"
                initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.08 + i * 0.09, ease: EASE }}
              >
                {w}&nbsp;
              </motion.span>
            ))}
            {/* Solid, never a gradient: emphasis comes from colour. */}
            <motion.span
              className="inline-block text-on-media-accent"
              initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.08 + WORDS.length * 0.09, ease: EASE }}
            >
              call.
            </motion.span>
          </h1>

          <motion.p
            className="lede mx-auto mt-7 max-w-[44ch] text-on-media-muted"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          >
            EZRA answers your phone and your website chat, books the job, and
            puts the caller through to a person when they ask for one.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.62, ease: EASE }}
          >
            {/* Inverted on the dark stage: the one strong action. */}
            <Button
              asChild
              size="lg"
              className="border-transparent bg-on-media font-semibold text-media hover:bg-white"
            >
              <Link href={"/agents/new" as Route}>
                Build your agent
                <ArrowRightIcon aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border-white/25 bg-white/5 text-on-media backdrop-blur hover:border-white/60 hover:bg-white/10"
            >
              <Link href={"/product/voice" as Route}>Hear it answer</Link>
            </Button>
          </motion.div>

          <motion.ul
            className="mx-auto mt-10 flex max-w-[58rem] flex-wrap items-center justify-center gap-x-7 gap-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {FACTS.map((f) => {
              const FactIcon = f.icon;
              return (
                <li key={f.label} className="flex items-center gap-2.5 text-sm font-medium text-on-media">
                  <span
                    aria-hidden
                    style={{ color: f.tone, backgroundColor: `color-mix(in oklab, ${f.tone} 16%, transparent)` }}
                    className="flex size-7 items-center justify-center rounded-full"
                  >
                    <FactIcon className="size-4" weight="bold" />
                  </span>
                  {f.label}
                </li>
              );
            })}
          </motion.ul>
        </div>

        {/* The captions: one quiet line over the top of the sphere. */}
        <div className="relative mt-auto flex justify-center px-4 pb-8 sm:pb-12">
          <div
            aria-hidden
            className="flex max-w-full items-center gap-3 rounded-full border border-white/12 bg-[#0c0720]/55 py-2 pl-3 pr-5 backdrop-blur-xl"
          >
            <span className="flex shrink-0 items-center gap-2 text-2xs font-semibold uppercase tracking-[0.14em] text-on-media-muted">
              <span className="relative flex size-2">
                <span className="animate-ring absolute inset-0 rounded-full bg-signal-live motion-reduce:hidden" />
                <span className="relative size-2 rounded-full bg-signal-live" />
              </span>
              Live
            </span>
            <span className="relative min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={line}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="block truncate text-sm text-on-media"
                >
                  <span
                    className={cn(
                      "mr-1.5 font-semibold",
                      current.who === "EZRA" ? "text-band-violet-ink" : "text-[#ffd2c2]",
                    )}
                  >
                    {current.who}:
                  </span>
                  {current.text}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
          <p className="sr-only">
            An example call: a caller with a chipped tooth is booked for
            Thursday at 9:40, then asks about a bill and is put through to a
            person.
          </p>
        </div>
      </div>
    </section>
  );
}
