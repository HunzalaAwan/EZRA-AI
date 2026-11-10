"use client";

import * as React from "react";

import Link from "next/link";
import type { Route } from "next";
import {
  ArrowDownRightIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarCheckIcon,
  ChatsCircleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  FlagIcon,
  GaugeIcon,
  HourglassIcon,
  LinkSimpleIcon,
  MoonStarsIcon,
  PercentIcon,
  TimerIcon,
  type Icon,
} from "@phosphor-icons/react";
import { CountUp, Lift, Spotlight } from "@/components/motion/primitives";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A formatter cannot be passed from a Server Component: functions do not
 * cross the RSC boundary. The page names one instead and the tile resolves it
 * here, which also guarantees a counter formats identically to the same number
 * rendered anywhere else.
 */
const FORMATTERS = {
  count: (n: number) => fmt.count(Math.round(n)),
  percent: (n: number) => fmt.percent(n),
  money: (n: number) => fmt.money(Math.round(n)),
  duration: (n: number) => fmt.durationWords(Math.round(n)),
} as const;

export type StatFormat = keyof typeof FORMATTERS;

/**
 * A stat tile states one number and what it means. Four of these sit above
 * real content; they are never the page structure themselves.
 *
 * The number counts up because a measurement arriving should feel like it
 * arrived. Trend direction is carried by an arrow and a word, never by colour
 * alone.
 */
/**
 * Identity for a tile. Icons are resolved here by name, because a component
 * cannot cross from a Server Component into this client one; the formatter
 * works the same way.
 */
const ICONS = {
  conversations: ChatsCircleIcon,
  bookings: CalendarCheckIcon,
  closed: MoonStarsIcon,
  flag: FlagIcon,
  gauge: GaugeIcon,
  timer: TimerIcon,
  minutes: HourglassIcon,
  money: CurrencyDollarIcon,
  link: LinkSimpleIcon,
  check: CheckCircleIcon,
  percent: PercentIcon,
} satisfies Record<string, Icon>;
export type StatIcon = keyof typeof ICONS;

const TONES = {
  violet: "var(--color-series-1)",
  teal: "var(--color-series-2)",
  gold: "var(--color-series-3)",
  pink: "var(--color-series-4)",
  signal: "var(--color-signal)",
} as const;
export type StatTone = keyof typeof TONES;

export function StatTile({
  label,
  value,
  countTo,
  formatAs,
  unit,
  trend,
  note,
  href,
  emphasis,
  tone = "violet",
  icon,
}: {
  /** The tile's colour. It tints the icon chip and a soft wash, never text. */
  tone?: StatTone;
  icon?: StatIcon;
  label: string;
  /** Rendered when there is nothing to count, or under reduced motion. */
  value: string;
  /** The numeric target. Omit for values that are not a single number. */
  countTo?: number;
  formatAs?: StatFormat;
  unit?: string;
  trend?: { text: string; direction: "up" | "down" | "flat"; good: boolean };
  note?: string;
  href?: Route;
  emphasis?: boolean;
}) {
  const Arrow =
    trend?.direction === "up"
      ? ArrowUpRightIcon
      : trend?.direction === "down"
        ? ArrowDownRightIcon
        : ArrowRightIcon;

  const TileIcon = icon ? ICONS[icon] : null;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {TileIcon ? (
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--tone)] text-on-primary shadow-[0_6px_16px_-8px_var(--tone)]"
          >
            <TileIcon className="size-[1.125rem]" weight="regular" />
          </span>
        ) : null}
      </div>
      <p className="mt-2.5 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-semibold leading-none tracking-[-0.03em] text-ink">
          {countTo !== undefined && formatAs ? (
            <CountUp value={countTo} format={FORMATTERS[formatAs]} />
          ) : (
            <span data-numeric>{value}</span>
          )}
        </span>
        {unit ? <span className="text-sm text-ink-muted">{unit}</span> : null}
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono tabular-nums",
              trend.good
                ? "bg-success-wash text-success"
                : "bg-raised text-ink-muted",
            )}
          >
            <Arrow className="size-3" aria-hidden weight="bold" />
            {trend.text}
          </span>
        ) : null}
        {note ? <span className="text-ink-muted">{note}</span> : null}
      </p>
    </>
  );

  // The tone travels as a CSS variable from a plain wrapper, because
  // Spotlight does not take a style prop.
  const surface = (
    <div className="h-full" style={{ "--tone": TONES[tone] } as React.CSSProperties}>
    <Spotlight
      className={cn(
        "relative h-full overflow-hidden rounded-2xl border bg-surface p-5 edge-light transition-[border-color,box-shadow] duration-200",
        "bg-[radial-gradient(20rem_9rem_at_100%_0%,color-mix(in_oklab,var(--tone)_13%,transparent),transparent_72%)]",
        "shadow-[0_1px_2px_rgb(10_10_10/0.04),0_14px_34px_-20px_rgb(10_10_10/0.16)]",
        emphasis ? "border-signal/35" : "border-rule",
        href && "hover:border-rule-control hover:shadow-[0_18px_40px_-22px_var(--tone)]",
      )}
    >
      {inner}
    </Spotlight>
    </div>
  );

  if (href) {
    return (
      <Lift className="h-full">
        <Link href={href} className="block h-full rounded-lg">
          {surface}
        </Link>
      </Lift>
    );
  }
  return <div className="h-full">{surface}</div>;
}
