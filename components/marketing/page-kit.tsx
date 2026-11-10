"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRightIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  Section,
  SectionHead,
} from "./sections";

/**
 * The furniture every landing page shares, in the homepage's language: a
 * dark rounded stage for the hero, tinted step cards, a two-column FAQ, and
 * the black rounded closing panel.
 *
 * Keeping these here rather than copying them per page is what stops nine
 * landing pages drifting into nine slightly different designs.
 */

/**
 * Each page takes one of the marketing band grounds. They are
 * theme-independent like media, so a hero looks the same in light and dark,
 * and every text pair on them is in the contrast gate.
 */
const GROUND = {
  violet: { bg: "bg-band-violet", ink: "text-band-violet-ink", glow: "#7c4dff" },
  indigo: { bg: "bg-band-indigo", ink: "text-band-indigo-ink", glow: "#5b7cff" },
  claret: { bg: "bg-band-claret", ink: "text-band-claret-ink", glow: "#e0559a" },
  media: { bg: "bg-media", ink: "text-on-media-accent", glow: "#7c4dff" },
} as const;
export type Ground = keyof typeof GROUND;

export function PageHero({
  eyebrowless,
  title,
  body,
  primary,
  secondary,
  ground = "violet",
  visual,
}: {
  /** Named to make the absence deliberate: no kickers above headings. */
  eyebrowless?: never;
  title: React.ReactNode;
  body: string;
  primary?: { label: string; href: Route };
  secondary?: { label: string; href: Route };
  ground?: Ground;
  /** An illustration for the right half. Without one the copy centres. */
  visual?: React.ReactNode;
}) {
  const g = GROUND[ground];
  return (
    <section className="px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={cn(
          "relative isolate mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] sm:rounded-[3rem]",
          g.bg,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-40 -z-10 size-[42rem] rounded-full opacity-35 blur-[130px]"
          style={{ backgroundColor: g.glow }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-24 -z-10 size-[30rem] rounded-full bg-[#f5a6d8] opacity-15 blur-[130px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(70%_60%_at_30%_20%,black,transparent)]"
        />

        <div
          className={cn(
            "grid grid-cols-1 items-center gap-10 px-6 py-16 sm:px-12 sm:py-20 lg:px-16",
            visual ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-24" : "lg:py-28",
          )}
        >
          <Reveal className={cn(visual ? "max-w-[38rem]" : "mx-auto max-w-[48rem] text-center")}>
            {/* Beside an illustration the copy has half the width, so it takes the
                next size down; at full size it broke into five lines and pushed
                the buttons below the fold. */}
            <h1 className={cn(visual ? "display-2" : "display-1", g.ink)}>{title}</h1>
            <p
              className={cn(
                "lede mt-6 max-w-[46ch] text-on-media",
                !visual && "mx-auto",
              )}
            >
              {body}
            </p>
            {(primary || secondary) && (
              <div
                className={cn(
                  "mt-9 flex flex-col gap-3 sm:flex-row",
                  visual ? "sm:items-center" : "items-center justify-center",
                )}
              >
                {primary && (
                  <Button
                    asChild
                    size="lg"
                    className="border-transparent bg-on-media font-semibold text-media hover:bg-white"
                  >
                    <Link href={primary.href}>
                      {primary.label}
                      <ArrowRightIcon aria-hidden />
                    </Link>
                  </Button>
                )}
                {secondary && (
                  <Button
                    asChild
                    size="lg"
                    className="border-white/25 bg-white/5 text-on-media hover:border-white/60 hover:bg-white/10"
                  >
                    <Link href={secondary.href}>{secondary.label}</Link>
                  </Button>
                )}
              </div>
            )}
          </Reveal>
          {visual ? <Reveal delay={0.12} className="min-w-0">{visual}</Reveal> : null}
        </div>
      </div>
    </section>
  );
}

const STEP_TONES = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-4)",
  "var(--color-series-3)",
];

/** A numbered list of plain steps. The order is the content here, so it carries numbers. */
export function Steps({
  title,
  body,
  steps,
}: {
  title: string;
  body?: string;
  steps: { title: string; body: string }[];
}) {
  return (
    <Section>
      <SectionHead title={title} body={body} />
      <RevealGroup className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        {steps.map((s, i) => (
          <RevealItem key={s.title} className="h-full">
            <div
              style={{ "--tone": STEP_TONES[i % STEP_TONES.length] } as React.CSSProperties}
              className="flex h-full gap-5 rounded-[1.75rem] bg-[color-mix(in_oklab,var(--tone)_9%,var(--color-surface))] p-6 ring-1 ring-rule sm:p-7"
            >
              <span
                data-numeric
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--tone)] font-display text-xl font-semibold text-on-primary shadow-[0_10px_24px_-12px_var(--tone)] light:bg-[color-mix(in_oklab,var(--tone)_80%,black)]"
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="display-4 block text-ink">{s.title}</span>
                <span className="mt-2 block text-sm leading-relaxed text-ink-muted">{s.body}</span>
              </span>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}

/** Questions, two columns: the heading holds the left, the answers the right. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <Section>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <SectionHead
          title="Questions people ask before signing up."
          body="Straight answers. If yours is not here, talk to us."
        />
        <RevealGroup className="space-y-3">
          {items.map((item) => (
            <RevealItem key={item.q}>
              <details className="group rounded-2xl bg-panel px-6 ring-1 ring-rule transition-colors open:bg-surface open:shadow-[0_14px_34px_-22px_rgb(10_10_10/0.25)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold text-ink">
                  {item.q}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-rule transition-transform duration-200 group-open:rotate-45">
                    <PlusIcon aria-hidden className="size-4 text-ink" />
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-5 text-sm leading-relaxed text-ink-muted">{item.a}</p>
              </details>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

/** The black rounded closing panel, the same object the homepage ends on. */
export function ClosingCta({ title, body }: { title: string; body: string }) {
  return (
    <section className="px-3 pb-6 pt-6 sm:px-5 sm:pb-8">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] bg-media px-6 py-24 text-center sm:rounded-[3rem] sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-full size-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c4dff] opacity-30 blur-[140px]"
        />
        <Reveal className="relative mx-auto max-w-[46rem]">
          <h2 className="display-1 text-on-media">{title}</h2>
          <p className="lede mx-auto mt-6 max-w-[44ch] text-on-media-muted">{body}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-on-media font-semibold text-media hover:bg-white">
              <Link href={"/agents/new" as Route}>
                Build your agent
                <ArrowRightIcon aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border-white/30 bg-transparent text-on-media hover:border-white hover:bg-transparent"
            >
              <Link href={"/pricing" as Route}>Talk to sales</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
