"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  ChartLineUpIcon,
  ClockIcon,
  LinkSimpleIcon,
  SquaresFourIcon,
  type Icon,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * The dashboard's sections, switched in place.
 *
 * Analytics used to be its own page, which meant the owner skimmed the week on
 * one screen and had to leave it to ask why. Now the why sits one click away,
 * under the same banner.
 *
 * The chosen view lives in the address (`?view=`), so a view can be
 * bookmarked or sent to someone, and the back button behaves. The address is
 * updated with replaceState rather than a navigation: the panels are already
 * rendered on the server, so switching costs nothing and nothing refetches.
 *
 * Radix gives the tablist its keyboard model: one tab stop, arrows between
 * tabs, Home and End.
 */

import { VIEWS, toView, type View } from "@/lib/dashboard-views";

const META: Record<View, { label: string; hint: string; icon: Icon; tone: string }> = {
  overview: {
    label: "Overview",
    hint: "This week at a glance",
    icon: SquaresFourIcon,
    tone: "var(--color-series-1)",
  },
  performance: {
    label: "Performance",
    hint: "Containment, length, spend",
    icon: ChartLineUpIcon,
    tone: "var(--color-series-2)",
  },
  links: {
    label: "Booking links",
    hint: "Sent, opened, booked",
    icon: LinkSimpleIcon,
    tone: "var(--color-series-4)",
  },
  patterns: {
    label: "Call patterns",
    hint: "When and how calls end",
    icon: ClockIcon,
    tone: "var(--color-series-3)",
  },
};

export function DashboardViews({
  initial,
  panels,
}: {
  initial: View;
  panels: Record<View, React.ReactNode>;
}) {
  const [view, setView] = React.useState<View>(initial);
  const pathname = usePathname();

  function change(next: string) {
    const v = toView(next);
    setView(v);
    const url = v === "overview" ? pathname : `${pathname}?view=${v}`;
    window.history.replaceState(null, "", url);
  }

  return (
    <TabsPrimitive.Root value={view} onValueChange={change}>
      <TabsPrimitive.List
        aria-label="Dashboard sections"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-rule bg-panel p-1.5 lg:grid-cols-4"
      >
        {VIEWS.map((v) => {
          const m = META[v];
          const ViewIcon = m.icon;
          const active = view === v;
          return (
            <TabsPrimitive.Trigger
              key={v}
              value={v}
              style={{ "--tone": m.tone } as React.CSSProperties}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors duration-200",
                !active && "hover:bg-surface/70",
              )}
            >
              {active ? (
                <motion.span
                  aria-hidden
                  layoutId="dashboard-view"
                  className="absolute inset-0 rounded-xl bg-surface shadow-[0_1px_2px_rgb(10_10_10/0.05),0_10px_24px_-14px_var(--tone)] ring-1 ring-rule"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "relative flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                  active
                    ? "bg-[var(--tone)] text-on-primary"
                    : "bg-[color-mix(in_oklab,var(--tone)_14%,transparent)] text-ink-muted",
                )}
              >
                <ViewIcon className="size-[1.125rem]" />
              </span>
              <span className="relative min-w-0">
                <span
                  className={cn(
                    "block truncate text-sm font-semibold",
                    active ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {m.label}
                </span>
                <span className="hidden truncate text-xs text-ink-muted sm:block">
                  {m.hint}
                </span>
              </span>
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>

      {VIEWS.map((v) => (
        <TabsPrimitive.Content
          key={v}
          value={v}
          className="mt-6 focus-visible:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {panels[v]}
          </motion.div>
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
