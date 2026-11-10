"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The lifecycle of one call, as a connected journey.
 *
 * This replaces an earlier version that drew the rail as a standalone SVG and
 * then repeated every step label in a row of text beneath it. That was the
 * same four words twice, and the rail itself never showed up because its
 * gradient stroke sat under the section's own background.
 *
 * Here the rail, the markers and the copy are one component, so a step can
 * only ever be written once.
 *
 * The rail is not one element spanning the row. It is one segment per step,
 * living inside that step and reaching across the gap to the next marker.
 * A single full-width rail has to be positioned by guessing where the first
 * and last markers land, which is a different answer at every column count
 * and gap, and the first version duly overshot past the final marker. A
 * per-step segment is anchored to its own marker, so it is correct at any
 * breakpoint without arithmetic.
 *
 * Each segment draws in turn, and a pulse hops along it, so the call visibly
 * travels from one stage to the next rather than one bar sweeping the row.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

export interface JourneyStep {
  n: string;
  title: string;
  body: string;
  /** Tints this step's marker so the sequence reads as a progression. */
  tone: "signal" | "primary" | "accent";
}

const TONE = {
  signal: {
    ring: "border-signal/45",
    dot: "bg-signal",
    glow: "shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-signal)_12%,transparent)]",
    text: "text-signal",
    rail: "bg-gradient-to-r from-signal to-primary lg:bg-gradient-to-r",
  },
  primary: {
    ring: "border-primary/45",
    dot: "bg-primary",
    glow: "shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-primary)_12%,transparent)]",
    text: "text-primary",
    rail: "bg-gradient-to-r from-primary to-[var(--color-series-2)]",
  },
  accent: {
    ring: "border-[color-mix(in_oklab,var(--color-series-2)_50%,transparent)]",
    dot: "bg-[var(--color-series-2)]",
    glow: "shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-series-2)_12%,transparent)]",
    text: "text-[var(--color-series-2)]",
    rail: "bg-[var(--color-series-2)]",
  },
};

export function CallJourney({
  steps,
  className,
}: {
  steps: JourneyStep[];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <ol className="relative grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-4">
        {steps.map((s, i) => {
          const tone = TONE[s.tone];
          return (
            <motion.li
              key={s.n}
              className="relative flex gap-5 lg:block"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.25 + i * 0.13, ease: EASE }}
            >
              {/* The segment reaching to the next marker. Horizontal at lg,
                  vertical below, and absent on the final step. */}
              {i < steps.length - 1 ? (
                <>
                  <span
                    aria-hidden
                    className="absolute left-[1.375rem] top-11 bottom-[-2.5rem] w-px overflow-hidden lg:hidden"
                  >
                    <span className="absolute inset-0 bg-rule" />
                    <motion.span
                      className={cn("absolute inset-0 origin-top", tone.rail)}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.4 + i * 0.16,
                        ease: EASE,
                      }}
                    />
                  </span>
                  <span
                    aria-hidden
                    className="absolute left-[1.375rem] right-[-2rem] top-[1.375rem] hidden h-px overflow-hidden lg:block"
                  >
                    <span className="absolute inset-0 bg-rule" />
                    <motion.span
                      className={cn("absolute inset-0 origin-left", tone.rail)}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.4 + i * 0.16,
                        ease: EASE,
                      }}
                    />
                    {/* The call hopping to the next stage. */}
                    <motion.span
                      className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_2px_color-mix(in_oklab,var(--color-primary)_65%,transparent)] motion-reduce:hidden"
                      initial={{ left: "0%", opacity: 0 }}
                      animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 4.5 - 1.5,
                        delay: i * 1.5,
                        ease: "easeInOut",
                      }}
                    />
                  </span>
                </>
              ) : null}

              {/* Marker. Every segment anchors to its centre. */}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border-2 bg-canvas",
                  tone.ring,
                  tone.glow,
                )}
              >
                <span className={cn("size-2.5 rounded-full", tone.dot)} />
              </span>

              <div className="min-w-0 lg:mt-6">
                <span
                  data-numeric
                  className={cn(
                    "font-mono text-xs tracking-[0.2em]",
                    tone.text,
                  )}
                >
                  {s.n}
                </span>
                <h3 className="display-4 mt-2 text-ink">{s.title}</h3>
                <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-ink-muted">
                  {s.body}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
