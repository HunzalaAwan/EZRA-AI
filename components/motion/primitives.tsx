"use client";

import * as React from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The motion layer.
 *
 * Built on Motion, the library formerly published as framer-motion. It is the
 * same project at its current package name, imported from motion/react.
 *
 * Two rules hold everything together.
 *
 * Springs for anything the user caused, eases for anything the system reports.
 * A press should feel physical; a number arriving should not.
 *
 * Reduced motion is handled by MotionConfig at the root, never by branching
 * the element structure. Returning a plain div for reduced-motion users and a
 * motion div for everyone else produces different HTML on the server and the
 * client, which is a hydration error. MotionConfig keeps one tree and strips
 * the movement instead.
 */

export const SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.7,
} as const;
export const EASE = [0.16, 1, 0.3, 1] as const;

/** Wrap the app once. "user" honours the OS setting for every child. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// ---------------------------------------------------------------------------
// Entrance choreography
// ---------------------------------------------------------------------------

/**
 * Staggers direct children in on mount. 40ms between items reads as one
 * motion with texture; 120ms reads as a queue the user waits through.
 */
export function Stagger({
  children,
  className,
  delay = 0,
  gap = 0.04,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  gap?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="shown"
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: gap, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

const riseVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE },
  },
};

/** One item inside a Stagger. */
export function Rise({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={riseVariants}>
      {children}
    </motion.div>
  );
}

/** Rises when it scrolls into view. Fires once, never on the way back up. */
export function RiseOnView({
  children,
  className,
  amount = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

/**
 * A surface that lifts under the pointer. The travel is deliberately tiny:
 * past about 4px it stops reading as a lift and starts reading as a jump.
 */
export function Lift({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -3 }}
      whileTap={{ y: -1, scale: 0.995 }}
      transition={SPRING}
    >
      {children}
    </motion.div>
  );
}

/**
 * A pointer-tracked sheen across a panel. The position lives in motion values,
 * never state: this updates on every pointer move, and re-rendering the React
 * tree at that rate collapses on mobile.
 */
export function Spotlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const opacity = useMotionValue(0);

  const background = useTransform(
    [x, y],
    ([cx, cy]: number[]) =>
      `radial-gradient(340px circle at ${cx}px ${cy}px, color-mix(in oklab, var(--color-primary) 11%, transparent), transparent 70%)`,
  );

  return (
    <div
      className={cn("relative isolate", className)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
        opacity.set(1);
      }}
      onPointerLeave={() => opacity.set(0)}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] transition-opacity duration-300"
        style={{ background, opacity }}
      />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

const useIsoLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * Counts up to a value when it scrolls into view.
 *
 * The final text is what renders on the server and on the first client pass,
 * so there is no hydration mismatch and no flash for anyone whose JavaScript
 * never runs. The count is then driven through textContent, outside React, so
 * a spring settling over a second does not re-render the tree sixty times.
 */
export function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20, mass: 1 });

  useIsoLayoutEffect(() => {
    if (reduced || !ref.current) return;
    ref.current.textContent = format(0);
  }, [reduced, format]);

  React.useEffect(() => {
    if (reduced || !inView) return;
    mv.set(value);
  }, [inView, value, mv, reduced]);

  React.useEffect(() => {
    if (reduced) return;
    return spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = format(v);
    });
  }, [spring, format, reduced]);

  return (
    <span ref={ref} className={className} data-numeric>
      {format(value)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

/** Cross-fades whatever is keyed, for tab and section switches. */
export function Swap({
  activeKey,
  children,
  className,
}: {
  activeKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeKey}
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export { motion, AnimatePresence, useReducedMotion };
