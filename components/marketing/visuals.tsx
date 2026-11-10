"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Authored visuals for the marketing site.
 *
 * Everything here is drawn in code: SVG paths, CSS gradients, and motion
 * values. No stock photography and no downloaded art. That is a deliberate
 * choice, not a limitation. Vectors stay sharp at any density, they inherit
 * the product's own colour tokens so the site can never drift from the app,
 * and nothing here carries a licence someone has to honour later.
 *
 * The one raster asset on the site is the product itself, captured at 2x by
 * scripts/capture-marketing.mjs, alongside the photography in public/photos.
 *
 * The ambient background fields used to live here as a React component. They
 * are now the .bg-mesh, .bg-spot, .bg-ember and .bg-grid utilities in
 * globals.css, because a background needs no JavaScript and the CSS version
 * can be tuned per theme in one place.
 */

// ---------------------------------------------------------------------------
// Waveform: a live line, drawn
// ---------------------------------------------------------------------------

/**
 * A voice waveform built from bars whose heights are a fixed seeded pattern,
 * not random, so the server and the client agree and the shape is the same on
 * every load.
 */
const WAVE = [
  0.22, 0.38, 0.62, 0.45, 0.8, 0.95, 0.7, 0.42, 0.28, 0.55, 0.78, 0.9, 0.66,
  0.34, 0.2, 0.46, 0.72, 0.88, 0.58, 0.3, 0.24, 0.5, 0.74, 0.92, 0.64, 0.4,
  0.26, 0.6, 0.84, 0.52,
];

export function Waveform({
  className,
  bars = WAVE.length,
}: {
  className?: string;
  bars?: number;
}) {
  const set = WAVE.slice(0, bars);

  return (
    <div
      aria-hidden
      className={cn("flex h-10 items-center gap-[3px]", className)}
    >
      {set.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-primary"
          style={{ height: `${h * 100}%` }}
          animate={{ scaleY: [1, 0.35 + h * 0.5, 1, 0.6 + h * 0.3, 1] }}
          transition={{
            duration: 1.8 + (i % 5) * 0.22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.035,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product frame: real screenshots, presented like software
// ---------------------------------------------------------------------------

/**
 * Wraps a real product capture in browser chrome. The chrome is drawn, the
 * content inside it is the running application, never a fake dashboard
 * assembled from divs.
 */
export function ProductFrame({
  src,
  alt,
  width,
  height,
  className,
  priority,
  glow = true,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  glow?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      {glow && (
        <div
          aria-hidden
          /* Bleeds vertically but never horizontally. `-inset-x-10` put the
             glow 40px past each edge of its parent, which at 390px hung 20px
             off the left of the viewport and gave three product pages a
             horizontal scrollbar. blur-3xl already spreads 64px on its own, so
             the halo reads just as wide from a box that stays in bounds. */
          className="pointer-events-none absolute inset-x-0 -bottom-6 -top-10 -z-10 rounded-[3rem] bg-primary/10 blur-3xl"
        />
      )}
      <div className="overflow-hidden rounded-xl border border-rule bg-surface shadow-overlay">
        <div className="flex items-center gap-2 border-b border-rule bg-panel px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-rule-control/60" />
            <span className="size-2.5 rounded-full bg-rule-control/60" />
            <span className="size-2.5 rounded-full bg-rule-control/60" />
          </span>
          <span className="mx-auto rounded-sm bg-surface px-3 py-0.5 font-mono text-2xs text-ink-faint">
            app.ezra.ai
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="block w-full"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Marquee
// ---------------------------------------------------------------------------

/**
 * A continuous horizontal scroll. Duplicated content plus a 50% translation
 * gives a seam-free loop, and it pauses on hover so a visitor can actually
 * read an item.
 */
export function Marquee({
  items,
  className,
  duration = 38,
}: {
  items: string[];
  className?: string;
  duration?: number;
}) {
  const doubled = [...items, ...items];

  return (
    <div
      className={cn("group relative overflow-hidden", className)}
      style={{
        maskImage:
          "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
      }}
    >
      <motion.div
        className="flex w-max gap-10"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="whitespace-nowrap text-sm font-medium text-ink-muted"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
