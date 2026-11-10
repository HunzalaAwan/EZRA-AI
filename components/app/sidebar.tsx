"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretUpDownIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { SPRING } from "@/components/motion/primitives";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { workspace } from "@/lib/mock/fixtures";

/**
 * Sidebar sits on the panel neutral, one step off the paper content area.
 * Three structural states, per DESIGN.md: full at xl, icon rail at lg,
 * a sheet below md. Type size never changes with viewport.
 */

function NavLink({
  item,
  collapsed,
  badge,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200",
        collapsed && "justify-center px-0",
        active
          ? "font-semibold text-primary"
          : "text-ink-muted hover:bg-[color-mix(in_oklab,var(--color-primary)_6%,transparent)] hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          aria-hidden
          layoutId={`nav-active-${collapsed ? "rail" : "full"}`}
          transition={SPRING}
          className="absolute inset-0 -z-10 rounded-xl border border-primary/25 bg-primary-wash shadow-[0_6px_16px_-10px_var(--color-primary)]"
        />
      )}
      <Icon
        className="size-5 shrink-0"
        weight={active ? "fill" : "regular"}
        aria-hidden
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {badge && badge > 0 ? (
        <span
          className={cn(
            "ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-signal-wash px-1.5 py-0.5 font-mono text-2xs text-signal",
            collapsed &&
              "absolute right-1 top-1 ml-0 min-w-4 px-1 py-0 leading-4",
          )}
        >
          {badge}
          <span className="sr-only"> needing review</span>
        </span>
      ) : null}
    </Link>
  );
}

function SidebarBody({
  collapsed,
  needsReview,
  onNavigate,
}: {
  collapsed: boolean;
  needsReview: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Workspace. Names the business, not the product. */}
      <div className={cn("px-3 pt-3", collapsed && "px-2")}>
        <button
          type="button"
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-rule bg-surface p-2 text-left shadow-[0_1px_2px_rgb(10_10_10/0.04)] transition-colors hover:border-rule-control",
            collapsed && "justify-center p-1.5",
          )}
        >
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#c026d3] font-display text-xs font-semibold text-white"
          >
            AC
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {workspace.name}
                </span>
                <span className="block truncate text-2xs text-ink-muted">
                  {workspace.industry}
                </span>
              </span>
              <CaretUpDownIcon
                className="size-4 shrink-0 text-ink-faint"
                aria-hidden
              />
            </>
          )}
          <span className="sr-only">Switch workspace</span>
        </button>
      </div>

      <div className={cn("px-3 py-3", collapsed && "px-2")}>
        <Button
          asChild
          variant="primary"
          size={collapsed ? "icon" : "md"}
          className={cn(!collapsed && "w-full")}
        >
          <Link href="/agents/new" onClick={onNavigate}>
            <PlusIcon aria-hidden weight="bold" />
            {!collapsed && "New agent"}
          </Link>
        </Button>
      </div>

      <nav
        aria-label="Main"
        className={cn("flex-1 space-y-0.5 px-3", collapsed && "px-2")}
      >
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            badge={item.badgeKey === "needsReview" ? needsReview : undefined}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div
        className={cn(
          "space-y-0.5 border-t border-rule px-3 py-3",
          collapsed && "px-2",
        )}
      >
        {SECONDARY_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </>
  );
}

export function Sidebar({ needsReview }: { needsReview: number }) {
  return (
    <aside className="hidden h-dvh shrink-0 flex-col border-r border-rule bg-panel md:flex md:w-16 xl:w-[280px] bg-[radial-gradient(26rem_20rem_at_0%_0%,color-mix(in_oklab,var(--color-primary)_9%,transparent),transparent_70%)]">
      {/* Collapsed rail at md and lg, full sidebar at xl. Structural, not fluid. */}
      <div className="flex h-full flex-col xl:hidden">
        <SidebarBody collapsed needsReview={needsReview} />
      </div>
      <div className="hidden h-full flex-col xl:flex">
        <SidebarBody collapsed={false} needsReview={needsReview} />
      </div>
    </aside>
  );
}

/** Below md the sidebar becomes a sheet. */
export function MobileSidebar({
  open,
  onClose,
  needsReview,
}: {
  open: boolean;
  onClose: () => void;
  needsReview: number;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgb(0_0_0/0.62)] backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-label="Navigation"
        aria-modal="true"
        className="relative flex h-full w-[272px] flex-col border-r border-rule bg-panel shadow-overlay"
      >
        <div className="flex items-center justify-end px-3 pt-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <XIcon aria-hidden />
          </Button>
        </div>
        <SidebarBody
          collapsed={false}
          needsReview={needsReview}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}
