"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Shared section furniture for the marketing site.
 *
 * Calendly's page works because each section has one job and a different
 * shape from the one above it. These pieces make that rhythm cheap to keep:
 * a section wrapper with consistent vertical rhythm, a heading block that is
 * never a split-header floater, and a reveal that fires once on scroll.
 */

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("px-5 py-20 sm:px-8 sm:py-28", className)}>
      <div className="mx-auto max-w-[1240px]">{children}</div>
    </section>
  );
}

/**
 * Heading plus optional body, stacked. Never a giant left headline with a
 * small paragraph floating in the top right corner: that pattern is the tell.
 */
export function SectionHead({
  title,
  body,
  align = "left",
  className,
}: {
  title: React.ReactNode;
  body?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-[44rem]",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <h2 className="display-2 text-ink">{title}</h2>
      {body ? <p className="lede mt-4 text-ink-muted">{body}</p> : null}
    </Reveal>
  );
}

/** Rises once when scrolled to. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggers a group of children as the group enters view. */
export function RevealGroup({
  children,
  className,
  gap = 0.07,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        shown: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Drifts its child as the page scrolls past. The range is small on purpose:
 * parallax that moves more than about 60px stops feeling like depth and
 * starts feeling like a bug.
 */
export function Parallax({
  children,
  className,
  distance = 48,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
