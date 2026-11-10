"use client";

import * as React from "react";
import {
  ChatTextIcon,
  ListIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  MoonIcon,
  SunIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlay";
import { members } from "@/lib/mock/fixtures";
import { useComms } from "./comms";

/**
 * 56px top bar. Carries the page title and page-level actions only.
 * Height cap matters: nav chrome must not eat the viewport.
 */
export function TopBar({
  title,
  actions,
  onOpenNav,
  onOpenSearch,
}: {
  title: string;
  actions?: React.ReactNode;
  onOpenNav: () => void;
  onOpenSearch: () => void;
}) {
  const { openDialer, openCompose } = useComms();
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-rule bg-canvas/95 px-4 backdrop-blur-sm sm:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onOpenNav}
        aria-label="Open navigation"
      >
        <ListIcon aria-hidden />
      </Button>

      <h1 className="truncate font-display text-lg font-semibold text-ink">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenSearch}
          className="hidden gap-2 text-ink-muted sm:inline-flex"
        >
          <MagnifyingGlassIcon aria-hidden />
          Search
          <kbd className="ml-1 rounded-xs border border-rule bg-sunken px-1.5 font-mono text-2xs text-ink-faint">
            Ctrl K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="sm:hidden"
          onClick={onOpenSearch}
          aria-label="Search"
        >
          <MagnifyingGlassIcon aria-hidden />
        </Button>

        {/* Outbound, one press away from anywhere. */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => openCompose()}
          className="hidden lg:inline-flex"
        >
          <ChatTextIcon aria-hidden />
          New message
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => openCompose()}
          aria-label="New message"
        >
          <ChatTextIcon aria-hidden />
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => openDialer()}
          aria-label="Open the dialer"
          className="max-sm:size-8 max-sm:px-0"
        >
          <PhoneIcon aria-hidden />
          <span className="max-sm:sr-only">Call</span>
        </Button>

        <ThemeToggle />

        {actions}

        <AccountMenu />
      </div>
    </header>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("ezra-theme", next);
    } catch {
      // Private mode. The theme still applies for this session.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      {theme === "dark" ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
    </Button>
  );
}

function AccountMenu() {
  const me = members[0]!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-1 grid size-8 cursor-pointer place-items-center rounded-full bg-primary-wash font-mono text-2xs font-medium text-primary transition-colors hover:bg-primary hover:text-on-primary"
          aria-label="Account menu"
        >
          {me.initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{me.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Notification preferences</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem tone="danger">Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
