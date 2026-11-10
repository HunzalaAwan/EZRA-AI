"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  ChatTextIcon,
  DeviceMobileIcon,
  GlobeIcon,
  HeadsetIcon,
  PhoneCallIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TranslateIcon,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Three homepage sections that show the product working instead of
 * describing it.
 *
 * Every loop here plays only while its section is on screen, and every loop
 * resolves to a complete, readable final state for anyone who asked for
 * reduced motion. That preference is read inside effects, never during
 * render: the hook is null on the server and a boolean on the client, so any
 * render branch on it is a hydration error.
 *
 * All the examples are illustrative and labelled as such.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

function useReducedMotionPref() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reduced;
}

/* ===========================================================================
   1. One call, start to finish
   ========================================================================= */

type Stage = "rings" | "answers" | "books" | "recaps";

const STAGES: {
  key: Stage;
  title: string;
  body: string;
  icon: Icon;
  dot: string;
  text: string;
  ring: string;
}[] = [
  {
    key: "rings",
    title: "It rings",
    body: "7:42pm on a Friday. The office closed at five.",
    icon: PhoneCallIcon,
    dot: "bg-signal-live",
    text: "text-[#ffb59c]",
    ring: "ring-signal-live/50",
  },
  {
    key: "answers",
    title: "It answers",
    body: "First ring, by name, in your voice.",
    icon: HeadsetIcon,
    dot: "bg-band-violet-ink",
    text: "text-band-violet-ink",
    ring: "ring-band-violet-ink/50",
  },
  {
    key: "books",
    title: "It books",
    body: "A real open time, written into your calendar.",
    icon: CalendarCheckIcon,
    dot: "bg-band-indigo-ink",
    text: "text-band-indigo-ink",
    ring: "ring-band-indigo-ink/50",
  },
  {
    key: "recaps",
    title: "It recaps",
    body: "By morning the office has the whole story.",
    icon: ChatTextIcon,
    dot: "bg-band-claret-ink",
    text: "text-band-claret-ink",
    ring: "ring-band-claret-ink/50",
  },
];

const SCRIPT: { stage: Stage; who: "system" | "caller" | "ezra"; text: string }[] = [
  { stage: "rings", who: "system", text: "Incoming call, Friday 7:42pm" },
  { stage: "answers", who: "ezra", text: "Alder Creek Dental, this is Maren. How can I help?" },
  { stage: "answers", who: "caller", text: "I chipped a tooth on Saturday. I have not been in since 2023." },
  { stage: "books", who: "ezra", text: "I can see you Thursday at 9:40 for an exam and an x-ray. Does that work?" },
  { stage: "books", who: "caller", text: "Perfect, thank you." },
  { stage: "books", who: "system", text: "Booked Thursday 9:40, confirmation texted" },
  { stage: "recaps", who: "system", text: "Summary and transcript sent to the office" },
];

export function CallLoop() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduced = useReducedMotionPref();
  const [shown, setShown] = React.useState(1);

  React.useEffect(() => {
    if (reduced) {
      setShown(SCRIPT.length);
      return;
    }
    if (!inView) return;
    const id = window.setInterval(() => {
      // Hold on the finished call for a beat, then start the next one.
      setShown((n) => (n >= SCRIPT.length + 2 ? 1 : n + 1));
    }, 1500);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  const visible = SCRIPT.slice(0, Math.min(shown, SCRIPT.length));
  const current = visible[visible.length - 1]?.stage ?? "rings";
  const currentIndex = STAGES.findIndex((s) => s.key === current);

  return (
    <section className="px-3 py-6 sm:px-5">
      <div
        ref={ref}
        className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] bg-band-violet px-6 py-16 sm:rounded-[3rem] sm:px-12 sm:py-24 lg:px-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 size-[40rem] rounded-full bg-[#7c4dff] opacity-30 blur-[140px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-32 size-[32rem] rounded-full bg-[#f5a6d8] opacity-15 blur-[140px]"
        />

        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <h2 className="display-2 text-band-violet-ink">One call, start to finish.</h2>
            <p className="lede mt-5 max-w-[40ch] text-on-media">
              The whole loop, playing out live. Nobody is at the desk for any of
              it.
            </p>

            {/* The stages. The current one lights in its own colour. */}
            <ol className="mt-10 space-y-2">
              {STAGES.map((s, i) => {
                const active = i === currentIndex;
                const done = i < currentIndex;
                const StageIcon = s.icon;
                return (
                  <li
                    key={s.key}
                    className={cn(
                      "flex items-start gap-4 rounded-2xl px-4 py-3.5 transition-colors duration-500",
                      active ? "bg-white/10" : "bg-transparent",
                    )}
                  >
                    <span
                      className={cn(
                        "relative mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 transition-all duration-500",
                        active || done ? s.ring : "ring-white/15",
                        active ? "bg-white/15" : "bg-transparent",
                      )}
                    >
                      <StageIcon
                        aria-hidden
                        className={cn(
                          "size-5 transition-colors duration-500",
                          active || done ? s.text : "text-on-media-muted",
                        )}
                      />
                      {active ? (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute -right-0.5 -top-0.5 size-2.5 rounded-full",
                            s.dot,
                          )}
                        />
                      ) : null}
                    </span>
                    <span>
                      <span
                        className={cn(
                          "block text-lg font-semibold transition-colors duration-500",
                          active ? s.text : "text-on-media",
                        )}
                      >
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-on-media-muted">
                        {s.body}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* The call itself. */}
          <div className="relative">
            <div className="rounded-[1.75rem] bg-[#140b2e]/80 p-5 ring-1 ring-white/10 backdrop-blur sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <span className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-on-media text-media">
                    <PhoneIcon aria-hidden className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-on-media">
                      (541) 410-2287
                    </span>
                    <span className="block text-xs text-on-media-muted">
                      Front Desk agent
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-on-media">
                  <span aria-hidden className="relative flex size-2">
                    <span className="animate-ring absolute inset-0 rounded-full bg-signal-live motion-reduce:hidden" />
                    <span className="relative size-2 rounded-full bg-signal-live" />
                  </span>
                  Live
                </span>
              </div>

              {/* Fixed height, so the panel never jumps as lines arrive. */}
              <ul
                aria-label="An example call transcript"
                className="mt-5 flex h-[22rem] flex-col justify-end gap-3 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%)]"
              >
                <AnimatePresence initial={false}>
                  {visible.map((line, i) => (
                    <motion.li
                      key={`${i}-${line.text}`}
                      layout
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className={cn(
                        "max-w-[85%]",
                        line.who === "caller" && "self-end",
                        line.who === "system" && "self-center max-w-full",
                      )}
                    >
                      {line.who === "system" ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-on-media">
                          <CheckCircleIcon aria-hidden className="size-3.5 text-band-violet-ink" />
                          {line.text}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "block rounded-2xl px-4 py-3 text-sm leading-relaxed",
                            line.who === "ezra"
                              ? "rounded-bl-md bg-band-violet-ink text-[#1a0d3d]"
                              : "rounded-br-md bg-white/12 text-on-media",
                          )}
                        >
                          <span className="mb-0.5 block text-2xs font-semibold uppercase tracking-[0.12em] opacity-70">
                            {line.who === "ezra" ? "EZRA" : "Caller"}
                          </span>
                          {line.text}
                        </span>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
            <p className="mt-3 text-center text-2xs text-on-media-muted">
              An example of how a call goes. Not a real patient.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===========================================================================
   2. You will not write a single prompt
   ========================================================================= */

const URL_TEXT = "aldercreekdental.com";
const FOUND: { label: string; value: string }[] = [
  { label: "Services", value: "14 found" },
  { label: "Hours", value: "Mon to Sat" },
  { label: "Locations", value: "Bend, Redmond, Sisters" },
  { label: "Insurance", value: "11 carriers" },
  { label: "Emergencies", value: "Page the on-call" },
  { label: "Top question", value: "Do you take my plan?" },
];

export function SetupDemo() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = useReducedMotionPref();
  // 0..URL_TEXT.length typing, then reading, then facts, then ready.
  const TYPE_END = URL_TEXT.length;
  const READ_END = TYPE_END + 8;
  const FACTS_END = READ_END + FOUND.length * 3;
  const READY_END = FACTS_END + 14;
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (reduced) {
      setTick(READY_END - 1);
      return;
    }
    if (!inView) return;
    const id = window.setInterval(() => {
      setTick((t) => (t >= READY_END ? 0 : t + 1));
    }, 110);
    return () => window.clearInterval(id);
  }, [inView, reduced, READY_END]);

  const typed = URL_TEXT.slice(0, Math.min(tick, TYPE_END));
  const reading = tick > TYPE_END && tick <= READ_END;
  const readPct = Math.min(1, Math.max(0, (tick - TYPE_END) / (READ_END - TYPE_END)));
  const factsShown = Math.max(0, Math.min(FOUND.length, Math.floor((tick - READ_END) / 3)));
  const ready = tick > FACTS_END;

  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="display-2 text-ink">You will not write a single prompt.</h2>
          <p className="lede mt-5 max-w-[44ch] text-ink-muted">
            Paste your website address. EZRA reads it and fills in your
            services, your hours, where you are, and the questions people
            actually ask. You correct what is wrong and you are done.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Nothing starts blank, so there is nothing to stare at",
              "Hear it on a real call before anyone else can reach it",
              "Change your mind later without starting over",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <CheckCircleIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="text-base text-ink-muted">{line}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="primary" size="lg" className="mt-9">
            <Link href={"/agents/new" as Route}>
              See the setup
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
        </div>

        <div
          ref={ref}
          className="relative overflow-hidden rounded-[2rem] bg-band-indigo p-6 sm:rounded-[2.5rem] sm:p-9"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-[26rem] rounded-full bg-[#5b7cff] opacity-30 blur-[110px]"
          />
          <div className="relative" aria-hidden>
            {/* The address field. */}
            <p className="text-sm font-medium text-band-indigo-ink">Your website</p>
            <div className="mt-2 flex items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-floating">
              <GlobeIcon className="size-5 shrink-0 text-[#3b4ba8]" />
              <span className="min-w-0 flex-1 truncate font-mono text-sm text-[#0a0a0a]">
                {typed}
                {tick <= TYPE_END ? (
                  <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-[#0a0a0a]" />
                ) : null}
              </span>
              <span className="rounded-full bg-[#0a0a0a] px-3.5 py-1.5 text-xs font-semibold text-white">
                Read my site
              </span>
            </div>

            {/* Reading. */}
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-band-indigo-ink transition-[width] duration-150"
                style={{ width: `${(tick > TYPE_END ? readPct : 0) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-on-media-muted">
              {tick <= TYPE_END
                ? "Waiting for an address"
                : reading
                  ? `Reading page ${Math.max(1, Math.round(readPct * 34))} of 34`
                  : "Read 34 pages"}
            </p>

            {/* What it found. */}
            <ul className="mt-6 grid grid-cols-2 gap-2.5">
              {/* A chip that has not been found yet shows its label at full
                  strength and a shimmer where the value will land. The first
                  version faded the whole chip to 18%, which left real text
                  unreadable at rest and failed contrast. */}
              {FOUND.map((f, i) => {
                const found = i < factsShown;
                return (
                  <li
                    key={f.label}
                    className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10"
                  >
                    <span className="block text-2xs font-semibold uppercase tracking-[0.12em] text-band-indigo-ink">
                      {f.label}
                    </span>
                    <span className="relative mt-0.5 block h-5">
                      <motion.span
                        initial={false}
                        animate={{ opacity: found ? 1 : 0, y: found ? 0 : 4 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="absolute inset-0 truncate text-sm font-medium text-on-media"
                      >
                        {found ? f.value : ""}
                      </motion.span>
                      {!found ? (
                        <span className="absolute left-0 top-1.5 h-2 w-3/4 animate-pulse rounded-full bg-white/20 motion-reduce:animate-none" />
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Ready. */}
            <motion.div
              initial={false}
              animate={{ scale: ready ? 1 : 0.985 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4"
            >
              <span>
                <span className="block text-sm font-semibold text-[#0a0a0a]">
                  {ready ? "Your agent is ready" : "Building your agent"}
                </span>
                <span className="block text-xs text-[#555553]">
                  Maren, warm and unhurried
                </span>
              </span>
              <span className="flex h-6 items-center gap-[3px]">
                {[0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.35].map((h, i) => (
                  <motion.span
                    key={i}
                    className="h-full w-[3px] rounded-full bg-[#6d28d9]"
                    animate={ready ? { scaleY: [0.25, h, 0.4, h * 0.7, 0.25] } : { scaleY: 0.15 }}
                    transition={
                      ready
                        ? { duration: 1 + i * 0.1, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.3 }
                    }
                  />
                ))}
              </span>
            </motion.div>
          </div>
          <p className="sr-only">
            An animation of the setup: a website address is typed in, 34 pages
            are read, EZRA lists the services, hours, locations, insurance,
            emergency handling and most common question it found, and the
            agent is ready.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ===========================================================================
   3. The details that decide whether you keep it
   ========================================================================= */

/** A tile's tint, mixed from a chart hue so both themes stay in family. */
const TINT = {
  violet: "bg-[color-mix(in_oklab,var(--color-series-1)_11%,var(--color-surface))]",
  teal: "bg-[color-mix(in_oklab,var(--color-series-2)_11%,var(--color-surface))]",
  gold: "bg-[color-mix(in_oklab,var(--color-series-3)_13%,var(--color-surface))]",
  pink: "bg-[color-mix(in_oklab,var(--color-series-4)_11%,var(--color-surface))]",
} as const;

const ICON_TONE = {
  violet: "bg-[var(--color-series-1)]",
  teal: "bg-[var(--color-series-2)]",
  gold: "bg-[var(--color-series-3)]",
  pink: "bg-[var(--color-series-4)]",
} as const;

function Tile({
  tint,
  icon: TileIcon,
  title,
  body,
  className,
  wide,
  children,
}: {
  /** Text left, illustration right, so a wide tile has no dead middle. */
  wide?: boolean;
  tint: keyof typeof TINT;
  icon: Icon;
  title: string;
  body: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.75rem] p-6 ring-1 ring-rule sm:p-8",
        wide && "md:flex-row md:items-center md:gap-10",
        TINT[tint],
        className,
      )}
    >
      <div className={cn(wide && "md:w-[22rem] md:shrink-0")}>
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full text-white light:text-white",
          ICON_TONE[tint],
        )}
      >
        <TileIcon aria-hidden className="size-5" />
      </span>
      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-ink">{title}</h3>
      <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-ink-muted">{body}</p>
      </div>
      <div
        aria-hidden
        className={cn(
          "mt-6 flex flex-1",
          wide ? "items-center md:mt-0" : "items-end",
        )}
      >
        {children}
      </div>
    </motion.li>
  );
}

/**
 * The old number, a pulse running down a dashed line, and EZRA answering.
 * Vertical, so it fits a narrow column at any width; laid out in a row it
 * wrapped and left the line pointing at nothing.
 */
function ForwardLine() {
  return (
    <div className="flex w-full flex-col items-center gap-0">
      <span className="rounded-full bg-surface px-4 py-2 font-mono text-sm text-ink ring-1 ring-rule">
        (541) 388-0610
      </span>
      <span className="relative h-16 w-px border-l-2 border-dashed border-[var(--color-series-1)]/40">
        <motion.span
          className="absolute -left-[5px] size-2 rounded-full bg-[var(--color-series-1)] shadow-[0_0_12px_2px_var(--color-series-1)]"
          animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
        />
      </span>
      <span className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas">
        EZRA answers
      </span>
    </div>
  );
}

function StopBubbles() {
  return (
    <div className="w-full space-y-2">
      <span className="ml-auto block w-fit max-w-[85%] rounded-2xl rounded-br-md bg-surface px-3.5 py-2.5 text-sm text-ink ring-1 ring-rule">
        How much is a crown?
      </span>
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
        className="block w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-[var(--color-series-4)] px-3.5 py-2.5 text-sm text-white"
      >
        That depends on the exam, so I would rather not guess. Can I book you
        in to find out?
      </motion.span>
    </div>
  );
}

function RingOrder() {
  const people = ["Front desk", "Priya", "On call"];
  return (
    <ol className="w-full space-y-2">
      {people.map((p, i) => (
        <li
          key={p}
          className="flex items-center gap-3 rounded-full bg-surface px-3 py-2 ring-1 ring-rule"
        >
          <span className="relative flex size-7 items-center justify-center rounded-full bg-[var(--color-series-2)] text-xs font-semibold text-white">
            {i + 1}
            <motion.span
              className="absolute inset-0 rounded-full ring-2 ring-[var(--color-series-2)]"
              animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 1.2, repeatDelay: 2.4 }}
            />
          </span>
          <span className="text-sm font-medium text-ink">{p}</span>
        </li>
      ))}
    </ol>
  );
}

function Greeting() {
  const lines = [
    "Thanks for calling. How can I help?",
    "Gracias por llamar. ¿Cómo le puedo ayudar?",
  ];
  const [i, setI] = React.useState(0);
  const reduced = useReducedMotionPref();
  React.useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % lines.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced, lines.length]);
  return (
    <div className="relative h-20 w-full">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="absolute inset-x-0 bottom-0 block rounded-2xl bg-surface px-4 py-3 text-sm text-ink ring-1 ring-rule"
        >
          {lines[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function PhoneNote() {
  return (
    <div className="relative mx-auto h-28 w-full max-w-[13rem] overflow-hidden rounded-t-[1.5rem] bg-ink px-3 pt-3">
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
        className="rounded-xl bg-canvas px-3 py-2.5"
      >
        <span className="block text-2xs font-semibold text-ink">EZRA · 3 overnight</span>
        <span className="mt-0.5 block text-2xs text-ink-muted">2 booked, 1 needs you</span>
      </motion.div>
    </div>
  );
}

function HoursSync() {
  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <span className="rounded-full bg-surface px-4 py-2 text-sm text-ink ring-1 ring-rule">
        Saturday{" "}
        <motion.span
          className="font-semibold"
          initial={{ opacity: 0.5 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          9am to 2pm
        </motion.span>{" "}
        on your website
      </span>
      <ArrowRightIcon className="size-4 text-ink-faint" />
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.8, ease: EASE }}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-series-3)] px-4 py-2 text-sm font-semibold text-white"
      >
        <CheckCircleIcon className="size-4" />
        EZRA updated
      </motion.span>
    </div>
  );
}

export function DetailsBento() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1240px]">
        <h2 className="display-2 max-w-[18ch] text-ink">
          The details that decide whether you keep it.
        </h2>
        <p className="lede mt-5 max-w-[44ch] text-ink-muted">
          Everything here ships today. None of it is a roadmap promise.
        </p>

        <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6">
          <Tile
            tint="violet"
            icon={PhoneIcon}
            title="Keeps your number"
            body="Forward the line on your door and your cards, or move it over. Customers keep dialing what they already know."
            className="md:col-span-4"
            wide
          >
            <ForwardLine />
          </Tile>
          <Tile
            tint="pink"
            icon={ShieldCheckIcon}
            title="Knows when to stop"
            body="It will not quote what it should not. When it does not know, it says so."
            className="md:col-span-2"
          >
            <StopBubbles />
          </Tile>
          <Tile
            tint="teal"
            icon={HeadsetIcon}
            title="Hands off cleanly"
            body="Rings your team in order, with the caller's story already passed along."
            className="md:col-span-2"
          >
            <RingOrder />
          </Tile>
          <Tile
            tint="gold"
            icon={TranslateIcon}
            title="Speaks Spanish"
            body="Switches mid-call when the caller does."
            className="md:col-span-2"
          >
            <Greeting />
          </Tile>
          <Tile
            tint="violet"
            icon={DeviceMobileIcon}
            title="Reads on a phone"
            body="Check the overnight queue between appointments."
            className="md:col-span-2"
          >
            <PhoneNote />
          </Tile>
          <Tile
            tint="gold"
            icon={GlobeIcon}
            title="Stays current"
            body="Change your hours on your website and EZRA picks it up. No second place to keep updated."
            className="md:col-span-6"
            wide
          >
            <HoursSync />
          </Tile>
        </ul>
      </div>
    </section>
  );
}
