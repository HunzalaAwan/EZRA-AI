"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  CaretDownIcon,
  ListIcon,
  XIcon,
  PhoneCallIcon,
  ChatCircleDotsIcon,
  CalendarCheckIcon,
  ChartLineUpIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Marketing navigation. Calendly's pattern: a wide mega menu per category,
 * pricing and sales as plain links, then log in and a primary action.
 *
 * The bar stays on one line at desktop and is capped in height, because nav
 * chrome that eats the viewport is a layout bug, not a design choice.
 */

interface MenuItem {
  href: Route;
  label: string;
  body: string;
  icon: React.ComponentType<{
    className?: string;
    weight?: "regular" | "fill";
  }>;
}

const PRODUCT: MenuItem[] = [
  {
    href: "/product/voice" as Route,
    label: "Voice agents",
    body: "Answers the phone, books the appointment, pages you when it matters.",
    icon: PhoneCallIcon,
  },
  {
    href: "/product/chat" as Route,
    label: "Website chat",
    body: "Catches the visitor who was about to leave without calling.",
    icon: ChatCircleDotsIcon,
  },
  {
    href: "/product/scheduling" as Route,
    label: "Scheduling",
    body: "Writes straight into the calendar the office already runs on.",
    icon: CalendarCheckIcon,
  },
  {
    href: "/product/reporting" as Route,
    label: "Reporting",
    body: "What was handled, what was booked, what still needs a person.",
    icon: ChartLineUpIcon,
  },
];

export function MarketingNav() {
  const [open, setOpen] = React.useState<string | null>(null);
  const [mobile, setMobile] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const closeTimer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // A small grace period stops the menu flickering shut as the pointer
  // travels from the trigger down into the panel.
  function hover(key: string | null) {
    window.clearTimeout(closeTimer.current);
    if (key === null) {
      closeTimer.current = window.setTimeout(() => setOpen(null), 120);
    } else {
      setOpen(key);
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-rule bg-canvas/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
      onMouseLeave={() => hover(null)}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-2 px-5 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="EZRA AI home"
        >
          <Logo />
          <span className="font-display text-lg font-semibold tracking-[-0.03em] text-ink">
            EZRA
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="ml-6 hidden items-center gap-1 lg:flex"
        >
          <MenuTrigger
            label="Product"
            isOpen={open === "product"}
            onHover={() => hover("product")}
          />
          <TopLink href={"/pricing" as Route} onHover={() => hover(null)}>
            Pricing
          </TopLink>
          <TopLink href={"/pricing" as Route} onHover={() => hover(null)}>
            Talk to sales
          </TopLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="quiet"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/dashboard">Log in</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href="/agents/new">Get started</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobile((v) => !v)}
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
          >
            {mobile ? <XIcon aria-hidden /> : <ListIcon aria-hidden />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key={open}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-16 hidden lg:block"
            onMouseEnter={() => hover(open)}
          >
            <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
              <div className="overflow-hidden rounded-lg border border-rule bg-surface p-2 shadow-overlay">
                <ul className="grid grid-cols-2 gap-1">
                  {PRODUCT.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(null)}
                          className="flex gap-3 rounded-sm p-3.5 transition-colors hover:bg-raised"
                        >
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary-wash text-primary">
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-ink">
                              {item.label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                              {item.body}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-rule bg-canvas lg:hidden"
          >
            <div className="space-y-5 px-5 py-6">
              <MobileGroup
                title="Product"
                items={PRODUCT}
                onNavigate={() => setMobile(false)}
              />
              <div className="flex flex-col gap-2 border-t border-rule pt-5">
                <Button asChild variant="secondary">
                  <Link href="/pricing" onClick={() => setMobile(false)}>
                    Pricing
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/dashboard" onClick={() => setMobile(false)}>
                    Log in
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuTrigger({
  label,
  isOpen,
  onHover,
}: {
  label: string;
  isOpen: boolean;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onHover}
      aria-expanded={isOpen}
      className={cn(
        "flex cursor-pointer items-center gap-1 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
        isOpen ? "text-ink" : "text-ink-muted hover:text-ink",
      )}
    >
      {label}
      <CaretDownIcon
        className={cn(
          "size-3.5 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
        aria-hidden
      />
    </button>
  );
}

function TopLink({
  href,
  children,
  onHover,
}: {
  href: Route;
  children: React.ReactNode;
  onHover: () => void;
}) {
  return (
    <Link
      href={href}
      onMouseEnter={onHover}
      className="rounded-sm px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
    >
      {children}
    </Link>
  );
}

function MobileGroup({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: MenuItem[];
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="mb-2 text-2xs font-medium text-ink-faint">{title}</p>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-sm px-2 py-2.5 text-sm text-ink transition-colors hover:bg-raised"
              >
                <Icon className="size-4 text-primary" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Drawn, not imported. A receiver arc over a solid base. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("size-7", className)}
      aria-hidden
      fill="none"
    >
      <rect
        width="28"
        height="28"
        rx="8"
        className="fill-[var(--color-primary)]"
      />
      <path
        d="M8.5 17.5c0-4.14 2.46-7 5.5-7s5.5 2.86 5.5 7"
        stroke="var(--color-on-primary)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="14" cy="20.2" r="1.6" fill="var(--color-on-primary)" />
    </svg>
  );
}
