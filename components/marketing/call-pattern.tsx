"use client";

import * as React from "react";
import { RobotIcon } from "@phosphor-icons/react";
import { motion, useInView } from "motion/react";
import { SectionHead } from "./sections";
import { cn } from "@/lib/utils";

/**
 * A week of incoming calls plotted against the hours anyone is there to take
 * them, in a section whose whole mood follows the switch.
 *
 * The plot makes the headline's argument as a shape in time: the desk covers a
 * block in the middle of five and a half days, the calls do not care, and
 * everything landing outside the block reaches nobody. Flip the switch and the
 * block grows to cover the week, every uncovered call drops into the agent at
 * the foot of the card, and the field behind the entire section turns from a
 * warm alarm into the emerald mesh the rest of the site runs on. The colour of
 * the section is the state of the phone. That is why the section owns its own
 * shell here rather than sitting inside the generic one: the mood has to reach
 * the edges of the band, not stop at the card.
 *
 * ENCODING, and why it is built this way.
 *
 * A call's state is carried by three redundant channels, in this order:
 *
 *   1. Position. A mark outside the lit coverage band is uncovered. This is
 *      geometry and it survives any colour vision, any monitor, and print.
 *   2. Shape. Answered marks are filled discs; missed marks are open rings
 *      with a pulse.
 *   3. Colour. Answered is `success`, missed is `danger`.
 *
 * Colour is last deliberately. dataviz's validator puts that pair at deutan
 * delta-E 8.3 against the dark surface and 8.0 against the light one, which is
 * the floor of the legal band and is permitted only when something other than
 * hue also carries the meaning. Position and shape are that something. The
 * greys-versus-red alternative was measured too and is worse, at protan 4.4.
 *
 * There is no orange anywhere in here, including the warm field. Signal orange
 * means a live line in this product, and a whole band of it would say the
 * opposite of what the uncovered state means. The warm field is `danger` and
 * the gold series, which is what `.bg-alarm` is made of.
 *
 * The figures are an illustrative week and are labelled as one. EZRA has no
 * customers, so there is no real week to plot and inventing one would be a
 * claim rather than a placeholder.
 */

type Mode = "desk" | "ezra";

/** The plotted window. Nothing in the fixture falls outside it. */
const START_HOUR = 6;
const END_HOUR = 24;
const SPAN = END_HOUR - START_HOUR;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** When a front desk is actually staffed. Sunday nobody is. */
const DESK: Array<{ open: number; close: number } | null> = [
  { open: 9, close: 17 },
  { open: 9, close: 17 },
  { open: 9, close: 17 },
  { open: 9, close: 17 },
  { open: 9, close: 17 },
  { open: 9, close: 13 },
  null,
];

interface Call {
  day: number;
  /** 24h clock, "HH:MM". */
  at: string;
  what: string;
}

const CALLS: Call[] = [
  { day: 0, at: "07:24", what: "New patient, toothache" },
  { day: 0, at: "12:18", what: "Moving an appointment" },
  { day: 0, at: "18:54", what: "Consult enquiry" },
  { day: 1, at: "08:12", what: "What do you charge" },
  { day: 1, at: "13:48", what: "Moving an appointment" },
  { day: 1, at: "23:06", what: "Burst pipe, emergency" },
  { day: 2, at: "10:36", what: "Booking" },
  { day: 2, at: "20:47", what: "Viewing request" },
  { day: 3, at: "07:55", what: "Group of nine, sailing" },
  { day: 3, at: "15:12", what: "Booking" },
  { day: 3, at: "18:52", what: "Check engine light" },
  { day: 4, at: "11:24", what: "Booking" },
  { day: 4, at: "19:42", what: "Chipped tooth" },
  { day: 5, at: "10:18", what: "Root touch up" },
  { day: 5, at: "14:36", what: "Do you take walk-ins" },
  { day: 5, at: "20:11", what: "Dog ate raisins" },
  { day: 6, at: "09:31", what: "What time do you close" },
  { day: 6, at: "16:06", what: "Spin class, last bike" },
];

function hours(at: string) {
  const [h, m] = at.split(":");
  return Number(h) + Number(m) / 60;
}

/** Reads back as "7:24pm", which is how anyone says a time out loud. */
function clock(at: string) {
  const [h, m] = at.split(":");
  const n = Number(h);
  const suffix = n < 12 ? "am" : "pm";
  const twelve = n % 12 === 0 ? 12 : n % 12;
  return `${twelve}:${m}${suffix}`;
}

function covered(call: Call) {
  const shift = DESK[call.day];
  if (!shift) return false;
  const t = hours(call.at);
  return t >= shift.open && t < shift.close;
}

const UNCOVERED = CALLS.filter((c) => !covered(c));
const MISSED = UNCOVERED.length;

/**
 * Bar heights for the agent's voice, as fractions. Fixed rather than random,
 * because a random walk regenerated on every render is a different waveform on
 * the server and on the client, and because a speaking voice has a shape.
 */
const VOICE = [
  0.3, 0.55, 0.85, 0.45, 0.7, 1, 0.62, 0.38, 0.8, 0.5, 0.92, 0.35, 0.68, 0.48,
  0.88, 0.58, 0.42, 0.75, 0.95, 0.52, 0.33, 0.66, 0.82, 0.4, 0.72, 0.28, 0.9,
  0.46, 0.64, 0.86, 0.36, 0.78, 0.54, 0.98, 0.32, 0.6, 0.84, 0.44, 0.7, 0.26,
];

/** Vertical position of a time, as a percentage from the top of the plot. */
function y(t: number) {
  return ((t - START_HOUR) / SPAN) * 100;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const AXIS = [6, 9, 12, 15, 18, 21, 24];

/**
 * The two coverage fills, in one place so the plot and its legend cannot drift
 * apart. The desk band is a neutral with a light-mode override, because a
 * neutral mixed from `ink` is nearly invisible at 7% over near-black and fine
 * at 7% over white. The EZRA band is a vertical fade of the emerald, brighter
 * at the opening hour, so a covered week reads as lit from above rather than
 * painted flat.
 */
const DESK_FILL =
  "bg-[color-mix(in_oklab,var(--color-ink)_13%,transparent)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-ink)_9%,transparent)] light:bg-[color-mix(in_oklab,var(--color-ink)_7%,transparent)] light:ring-[color-mix(in_oklab,var(--color-ink)_10%,transparent)]";
const EZRA_FILL =
  "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-primary)_32%,transparent),color-mix(in_oklab,var(--color-primary)_9%,transparent))] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-primary)_42%,transparent)]";

/**
 * The section. Owns the mode so the field behind the whole band can follow it.
 */
export function CallPatternSection() {
  const [mode, setMode] = React.useState<Mode>("desk");
  const ezra = mode === "ezra";

  return (
    <section className="bg-grain relative isolate overflow-hidden px-5 py-20 sm:px-8 sm:py-28">
      {/* Two fields, crossfaded. The warm one is the uncovered state, the
          emerald mesh is the covered one. Both stay mounted; only opacity
          moves, so the switch is one continuous change of light rather than a
          background swapping out. */}
      <motion.div
        aria-hidden
        className="bg-alarm absolute inset-0 z-0"
        initial={false}
        animate={{ opacity: ezra ? 0 : 1 }}
        transition={{ duration: 1.1, ease: EASE }}
      />
      <motion.div
        aria-hidden
        className="bg-mesh absolute inset-0 z-0"
        initial={false}
        animate={{ opacity: ezra ? 1 : 0 }}
        transition={{ duration: 1.1, ease: EASE }}
      />
      <div aria-hidden className="bg-grid absolute inset-0 z-0 opacity-50" />

      {/* Two soft discs of light, one per state, swapping the same way. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-24 z-0 size-[38rem] rounded-full bg-danger blur-[140px]"
        initial={false}
        animate={{ opacity: ezra ? 0 : 0.16 }}
        transition={{ duration: 1.1, ease: EASE }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-24 z-0 size-[38rem] rounded-full bg-primary blur-[140px]"
        initial={false}
        animate={{ opacity: ezra ? 0.22 : 0 }}
        transition={{ duration: 1.1, ease: EASE }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-24 z-0 size-[30rem] rounded-full bg-[var(--color-series-2)] opacity-[0.1] blur-[130px] light:opacity-[0.18]"
      />

      <div className="relative z-10 mx-auto max-w-[1240px]">
        <SectionHead
          title={
            <>
              The calls you are losing
              <br className="hidden sm:block" /> have a pattern.
            </>
          }
          body="They arrive after five, during the rush, and on a Saturday. Every one of them was somebody ready to book."
        />
        <CallPattern mode={mode} onModeChange={setMode} className="mt-12" />
      </div>
    </section>
  );
}

export function CallPattern({
  mode,
  onModeChange,
  className,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  className?: string;
}) {
  const radios = React.useRef<Array<HTMLButtonElement | null>>([]);
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const ezra = mode === "ezra";

  /**
   * The sweep replays on every switch, so flipping back and forth reads as the
   * week being covered again rather than as a static restyle.
   */
  const [sweep, setSweep] = React.useState(0);
  React.useEffect(() => {
    if (inView) setSweep((n) => n + 1);
  }, [inView, mode]);

  /**
   * Which call the agent is working through. It walks the calls that reached
   * nobody, which is the whole set EZRA exists to pick up.
   *
   * The reduced-motion check lives in the effect rather than in render. Reading
   * the hook during render returns null on the server and a boolean on the
   * client, and anything branching on that is a hydration error; reading the
   * media query inside an effect never runs on the server at all. A reader who
   * asked for stillness gets the first call, held.
   */
  const [cursor, setCursor] = React.useState(0);
  React.useEffect(() => {
    if (!ezra) {
      setCursor(0);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setCursor((n) => (n + 1) % UNCOVERED.length),
      2100,
    );
    return () => window.clearInterval(id);
  }, [ezra]);

  const onCall = UNCOVERED[cursor] ?? UNCOVERED[0];

  return (
    <figure ref={ref} className={cn("m-0", className)}>
      {/* Control and running total. The count is the headline number and it is
          derived from the plotted fixture, never asserted on its own. */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        {/* A radiogroup owes the reader one tab stop and arrow keys inside it,
            not two stops and no arrows. With two options every arrow is the
            same move, so they all just flip. */}
        <div
          role="radiogroup"
          aria-label="Who is covering the phone"
          onKeyDown={(e) => {
            if (!/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
            e.preventDefault();
            const next: Mode = ezra ? "desk" : "ezra";
            onModeChange(next);
            radios.current[next === "desk" ? 0 : 1]?.focus();
          }}
          className="inline-flex rounded-xl border border-rule bg-surface p-1 shadow-raised"
        >
          {(
            [
              ["desk", "Your front desk"],
              ["ezra", "With EZRA"],
            ] as const
          ).map(([value, label], i) => (
            <button
              key={value}
              ref={(el) => {
                radios.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={mode === value}
              tabIndex={mode === value ? 0 : -1}
              onClick={() => onModeChange(value)}
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                mode === value
                  ? "bg-primary-wash text-primary"
                  : "text-ink-muted hover:text-ink active:bg-sunken",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Counts the calls, never the absence of them. "0 of 18 reached
            nobody" is a double negative to unpick and a lone mono zero at
            display size. */}
        <p className="flex items-baseline gap-2 text-base text-ink-muted">
          <span
            data-numeric
            className={cn(
              "font-mono text-4xl font-semibold leading-none transition-colors duration-500",
              ezra ? "text-primary" : "text-danger",
            )}
          >
            {ezra ? CALLS.length : MISSED}
          </span>
          of {CALLS.length} {ezra ? "answered" : "reached nobody"}
        </p>
      </div>

      {/* The card. Its edge and its shadow take the colour of the state, so
          the plot is lit from the same source as the field behind it. */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-surface p-4 transition-[border-color,box-shadow] duration-700 sm:p-6",
          ezra
            ? "border-[color-mix(in_oklab,var(--color-primary)_45%,var(--color-rule))] shadow-[0_30px_90px_-36px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]"
            : "border-[color-mix(in_oklab,var(--color-danger)_38%,var(--color-rule))] shadow-[0_30px_90px_-36px_color-mix(in_oklab,var(--color-danger)_50%,transparent)]",
        )}
      >
        {/* Day labels. */}
        <div className="mb-2 flex pl-11">
          {DAYS.map((d) => (
            <span
              key={d}
              className="flex-1 text-center text-2xs font-semibold uppercase tracking-[0.1em] text-ink-faint"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="flex">
          {/* Hour axis. */}
          <div className="relative w-11 shrink-0">
            {AXIS.map((t) => (
              <span
                key={t}
                data-numeric
                className="absolute right-2 -translate-y-1/2 font-mono text-2xs text-ink-faint"
                style={{ top: `${y(t)}%` }}
              >
                {t === 24 ? "12am" : t === 12 ? "12pm" : t > 12 ? `${t - 12}pm` : `${t}am`}
              </span>
            ))}
          </div>

          {/* The plot. */}
          <div className="relative h-[22rem] flex-1 sm:h-[26rem]">
            {/* Hour rules, drawn in rather than switched on. */}
            {AXIS.map((t, i) => (
              <motion.span
                key={t}
                aria-hidden
                className="absolute left-0 h-px w-full origin-left bg-rule"
                style={{ top: `${y(t)}%` }}
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : undefined}
                transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
              />
            ))}

            {/* Coverage. One band per day, growing from the opening hour. The
                EZRA band is the same element at full span, so switching modes
                animates the block rather than crossfading two of them. */}
            {DAYS.map((d, i) => {
              const shift = DESK[i];
              const open = ezra ? START_HOUR : (shift?.open ?? 0);
              const close = ezra ? END_HOUR : (shift?.close ?? 0);
              const height = close > open ? y(close) - y(open) : 0;
              return (
                <motion.span
                  key={d}
                  aria-hidden
                  className={cn(
                    "absolute origin-top rounded-lg transition-[background,box-shadow] duration-500",
                    ezra ? EZRA_FILL : DESK_FILL,
                  )}
                  style={{
                    left: `calc(${(i / 7) * 100}% + 3px)`,
                    width: `calc(${100 / 7}% - 6px)`,
                  }}
                  initial={{ top: "50%", height: 0, opacity: 0 }}
                  animate={
                    inView
                      ? { top: `${y(open)}%`, height: `${height}%`, opacity: 1 }
                      : undefined
                  }
                  transition={{
                    duration: 0.7,
                    delay: ezra ? i * 0.05 : 0.15 + i * 0.05,
                    ease: EASE,
                  }}
                />
              );
            })}

            {/* The sweep. One pass per mode change, so covering the week is a
                thing that visibly happens. */}
            <motion.span
              key={sweep}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-28 motion-reduce:hidden"
              style={{
                background:
                  "linear-gradient(90deg,transparent,color-mix(in oklab,var(--color-primary) 28%,transparent),transparent)",
              }}
              initial={{ left: "-10%", opacity: 0 }}
              animate={
                inView ? { left: "105%", opacity: [0, 1, 1, 0] } : undefined
              }
              transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
            />

            {/* Where the calls go once EZRA is on. Each one that used to ring
                out drops down its own day column and into the agent below, so
                the two halves of the card are visibly one circuit rather than
                a plot with a decoration bolted under it. Replays on every
                switch, because `sweep` is in the key. */}
            {ezra
              ? UNCOVERED.map((c, i) => {
                  const from = y(hours(c.at));
                  return (
                    <motion.span
                      key={`drop-${sweep}-${c.day}-${c.at}`}
                      aria-hidden
                      className="absolute z-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-primary motion-reduce:hidden"
                      style={{
                        left: `${((c.day + 0.5) / 7) * 100}%`,
                        top: `${from}%`,
                      }}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: `${100 - from}%`,
                        opacity: [0, 0.9, 0.9, 0],
                      }}
                      transition={{
                        duration: 1.1,
                        delay: 0.25 + i * 0.07,
                        ease: EASE,
                      }}
                    />
                  );
                })
              : null}

            {/* The calls. Each mark casts a little of its own colour, which is
                what lets them read as lights on the field rather than dots on
                a chart. */}
            {CALLS.map((c, i) => {
              const answered = ezra || covered(c);
              return (
                <motion.span
                  key={`${c.day}-${c.at}`}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${((c.day + 0.5) / 7) * 100}%`,
                    top: `${y(hours(c.at))}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : undefined}
                  transition={{
                    delay: 0.55 + i * 0.06,
                    type: "spring",
                    stiffness: 520,
                    damping: 24,
                  }}
                >
                  {/* Pulse. Only on a call nobody is picking up, and only for
                      as long as that is true. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger motion-reduce:hidden",
                      answered ? "opacity-0" : "animate-ring",
                    )}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "relative block size-3.5 rounded-full border-2 transition-all duration-300",
                      answered
                        ? "border-primary bg-primary shadow-[0_0_12px_1px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]"
                        : "border-danger bg-surface shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-danger)_16%,transparent),0_0_14px_2px_color-mix(in_oklab,var(--color-danger)_45%,transparent)]",
                    )}
                  />
                  {/* Hover layer. The same facts are in the table below, which
                      is what anyone on a keyboard or a screen reader gets. */}
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-rule bg-raised px-2.5 py-1.5 text-2xs text-ink shadow-floating group-hover:block">
                    <span data-numeric className="font-mono text-ink-muted">
                      {DAYS[c.day]} {clock(c.at)}
                    </span>{" "}
                    {c.what}
                  </span>
                </motion.span>
              );
            })}
          </div>
        </div>

        {/* The agent, at the foot of the week the calls drop into. Dormant in
            one state and working in the other, so the switch above changes
            something that is visibly a machine rather than only a fill. */}
        <div
          className={cn(
            "mt-5 flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-[background,border-color] duration-700 sm:gap-5 sm:px-5",
            ezra
              ? "border-[color-mix(in_oklab,var(--color-primary)_45%,var(--color-rule))] bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-primary)_20%,var(--color-surface)),var(--color-surface)_70%)]"
              : "border-rule bg-sunken",
          )}
        >
          <span className="relative flex size-11 shrink-0 items-center justify-center">
            {/* Two rings, offset in time so the unit breathes instead of
                blinking. Present in the tree in both states and hidden by
                opacity, never mounted conditionally. An outlined ring stopping
                at 1.45x stays inside the row; the shared filled `animate-ring`
                at 2.6x overran it and read as a slab once clipped. */}
            {[0, 0.9].map((delay) => (
              <motion.span
                key={delay}
                aria-hidden
                className="absolute inset-0 rounded-xl border border-primary motion-reduce:hidden"
                animate={
                  ezra
                    ? { scale: [1, 1.45], opacity: [0.6, 0] }
                    : { scale: 1, opacity: 0 }
                }
                transition={
                  ezra
                    ? { duration: 1.9, repeat: Infinity, ease: "easeOut", delay }
                    : { duration: 0.3 }
                }
              />
            ))}
            <span
              className={cn(
                "relative flex size-11 items-center justify-center rounded-xl border transition-[background,border-color,box-shadow,color] duration-500",
                ezra
                  ? "border-primary/50 bg-primary text-on-primary shadow-glow"
                  : "border-rule bg-surface text-ink-faint",
              )}
            >
              <RobotIcon weight="regular" className="size-6" aria-hidden />
            </span>
          </span>

          {/* The voice. Flat when the unit is off, running when it is not.
              Each bar is flex-1 capped at 3px, so the leftover width becomes
              the gaps: the trace fills whatever it is given and never
              overflows a narrow row. */}
          <span
            aria-hidden
            className="flex h-9 min-w-0 max-w-[34rem] flex-1 items-center justify-between gap-[2px] overflow-hidden"
          >
            {VOICE.map((h, i) => (
              <motion.span
                key={i}
                className={cn(
                  "h-full min-w-px max-w-[3px] flex-1 rounded-full transition-colors duration-500",
                  ezra ? "bg-primary" : "bg-rule-control",
                )}
                animate={
                  ezra
                    ? { scaleY: [0.12, h, 0.3, h * 0.66, 0.12] }
                    : { scaleY: 0.07 }
                }
                transition={
                  ezra
                    ? {
                        duration: 1.05 + (i % 5) * 0.14,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: (i % 7) * 0.09,
                      }
                    : { duration: 0.45, ease: EASE }
                }
              />
            ))}
          </span>

          {/* The readout. Hidden from assistive technology because a ticker
              that rewrites itself every two seconds is hostile to listen to;
              the same calls are in the table at the end, in full. */}
          <span
            aria-hidden
            className="hidden min-w-0 shrink-0 text-right sm:block sm:w-[19rem]"
          >
            {ezra && onCall ? (
              <motion.span
                key={`${onCall.day}-${onCall.at}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="block"
              >
                <span className="block truncate text-sm font-semibold text-ink">
                  {onCall.what}
                </span>
                <span
                  data-numeric
                  className="block font-mono text-2xs text-primary"
                >
                  Answering · {DAYS[onCall.day]} {clock(onCall.at)}
                </span>
              </motion.span>
            ) : (
              <span className="block">
                <span className="block text-sm font-semibold text-ink-muted">
                  Nobody is on the line
                </span>
                <span className="block text-2xs text-ink-faint">
                  These {MISSED} reach the answering machine
                </span>
              </span>
            )}
          </span>
        </div>

        {/* Legend. Present because there are two states, and naming them is
            what keeps the reading off colour alone. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 pl-11 text-2xs text-ink-muted">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full border-2 border-primary bg-primary" />
            Answered
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full border-2 border-danger bg-surface" />
            Rang out
          </span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "h-3 w-5 rounded-sm transition-[background] duration-500",
                ezra ? EZRA_FILL : DESK_FILL,
              )}
            />
            {ezra ? "EZRA is on the line" : "Someone is at the desk"}
          </span>
        </div>
      </div>

      <figcaption className="mt-4 text-2xs text-ink-faint">
        An illustrative week for a single location. Not customer data.
      </figcaption>

      {/* The same week as a table, because a plot that only exists as position
          is unreadable to anyone not looking at it. */}
      <table className="sr-only">
        <caption>
          An illustrative week of incoming calls, with the hours a front desk is
          staffed
        </caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Time</th>
            <th scope="col">Reason</th>
            <th scope="col">Front desk</th>
          </tr>
        </thead>
        <tbody>
          {CALLS.map((c) => (
            <tr key={`${c.day}-${c.at}-row`}>
              <td>{DAYS[c.day]}</td>
              <td>{clock(c.at)}</td>
              <td>{c.what}</td>
              <td>{covered(c) ? "Answered" : "Rang out"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
