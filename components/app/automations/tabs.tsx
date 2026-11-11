"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The screens of Automations, as one row of tabs over every page in it. Each
 * tab is its own address, so a link can open any of them and the browser's
 * back button does what people expect.
 */
const TABS: { href: string; label: string; match?: (p: string) => boolean }[] = [
  { href: "/automations", label: "Overview", match: (p) => p === "/automations" },
  { href: "/automations/general", label: "General" },
  { href: "/automations/follow-ups", label: "Follow-ups" },
  { href: "/automations/reviews", label: "Reviews" },
  { href: "/automations/emails", label: "Email templates" },
  { href: "/automations/team", label: "Team alerts" },
];

export function AutomationTabs() {
  const pathname = usePathname();
  const active = TABS.find((t) => (t.match ? t.match(pathname) : pathname === t.href || pathname.startsWith(`${t.href}/`)))?.href;
  const listRef = React.useRef<HTMLUListElement>(null);

  // On a phone the row scrolls sideways; keep the current tab in view.
  React.useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !el) return;
    const left = el.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + el.offsetWidth > list.scrollLeft + list.clientWidth) list.scrollLeft = left - 16;
  }, [active]);

  return (
    <nav aria-label="Automations" className="-mx-4 border-b border-rule sm:mx-0">
      <ul ref={listRef} className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const on = t.href === active;
          return (
            <li key={t.href} className="shrink-0">
              <Link
                href={t.href as Route}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative block rounded-t-md px-3 pb-3 pt-2 text-sm font-medium transition-colors",
                  on ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {t.label}
                {on ? (
                  <motion.span
                    layoutId="automations-tab"
                    aria-hidden
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 520, damping: 40 }}
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
