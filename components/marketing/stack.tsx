"use client";

import * as React from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Full-height stacking cards.
 *
 * Each card fills most of the viewport, pins at the top, and stays there while
 * the next one rises over it. The card underneath tips back in perspective,
 * shrinks, blurs and dims, so the pile reads as physical depth rather than as
 * one rectangle sliding behind another.
 *
 * Two separate scroll trackers drive it:
 *
 *   ENTER runs while the card climbs into place from below. It arrives
 *   slightly small and slightly low, then settles. That is what makes the
 *   reveal feel dealt rather than merely scrolled to.
 *
 *   EXIT runs once it is pinned and the next card starts covering it. Scale,
 *   rotateX, lift, blur and dim all come off this one.
 *
 * Both are smoothed through a spring, because raw scroll progress from a
 * trackpad is jittery and the card visibly stutters without it.
 *
 * Why every card shares one parent: a sticky element is constrained by its own
 * parent block, so giving each card its own wrapper makes it unstick the
 * moment that wrapper scrolls past, which looks like nothing happened.
 *
 * Under reduced motion MotionConfig strips the transforms and this degrades to
 * a plain stacked list, which is a fine fallback.
 */

/** Where the pile pins, clear of the sticky header. */
const TOP = 76;
/** Visible lip of each card beneath the next. */
const LIP = 18;

const SMOOTH = { stiffness: 170, damping: 30, mass: 0.6 } as const;

export function StackCard({
  index,
  total,
  children,
  className,
}: {
  index: number;
  total: number;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isLast = index === total - 1;
  const isFirst = index === 0;

  // Climbing into place from below.
  const { scrollYProgress: enterRaw } = useScroll({
    target: ref,
    offset: ["start end", "start 96px"],
  });
  // Pinned, and being covered by the next card.
  const { scrollYProgress: exitRaw } = useScroll({
    target: ref,
    offset: ["start 96px", "end 280px"],
  });

  const enter = useSpring(enterRaw, SMOOTH);
  const exit = useSpring(exitRaw, SMOOTH);

  // The first card is already in place on load, so it never plays an entry.
  const enterScale = useTransform(enter, [0, 1], [isFirst ? 1 : 0.9, 1]);
  const enterY = useTransform(enter, [0, 1], [isFirst ? 0 : 56, 0]);
  // Always fully opaque. An entering card used to start at 0.4, which on a
  // deep coloured band over a white page showed a ghosted, unreadable slab
  // and failed contrast. The rise and scale already carry the entrance.
  const opacity = useTransform(enter, [0, 1], [1, 1]);

  // Receding under the next card.
  const exitScale = useTransform(exit, [0, 1], [1, isLast ? 1 : 0.88]);
  const rotateX = useTransform(exit, [0, 1], [0, isLast ? 0 : 7]);
  const exitY = useTransform(exit, [0, 1], [0, isLast ? 0 : -14]);
  const dim = useTransform(exit, [0, 1], [0, isLast ? 0 : 0.72]);
  const blur = useTransform(
    exit,
    [0, 1],
    ["blur(0px)", isLast ? "blur(0px)" : "blur(6px)"],
  );

  // Entry and exit never run at the same time, so composing them multiplies
  // and adds cleanly rather than needing a single combined timeline.
  const scale = useTransform(
    [enterScale, exitScale],
    ([a, b]: number[]) => (a ?? 1) * (b ?? 1),
  );
  const y = useTransform(
    [enterY, exitY],
    ([a, b]: number[]) => (a ?? 0) + (b ?? 0),
  );

  return (
    <div
      ref={ref}
      className="sticky"
      style={{
        top: TOP + index * LIP,
        perspective: 1800,
        // Scaling from the top edge pulls the receding card's bottom upward,
        // which opens a band of page background beneath it. Overlapping each
        // card into the one before closes that band for good.
        marginTop: isFirst ? 0 : "-9vh",
      }}
    >
      <motion.div
        style={{
          scale,
          y,
          opacity,
          rotateX,
          filter: blur,
          transformOrigin: "50% 0%",
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl will-change-transform",
          className,
        )}
      >
        {children}
        {/* Darkens as the next card arrives. */}
        <motion.div
          aria-hidden
          style={{ opacity: dim }}
          className="pointer-events-none absolute inset-0 bg-canvas"
        />
        {/* A lit lip along the top edge. This is what sells the pile: each
            card beneath catches a line of light from the one above. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        />
      </motion.div>
    </div>
  );
}

/** The pile. One block, no gaps, and a short tail so the last card settles. */
export function CardStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("relative pb-[8vh]", className)}>{children}</div>;
}
