"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, MobileSidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { ALL_NAV } from "./nav";
import { TooltipProvider } from "@/components/ui/overlay";
import { MotionRoot } from "@/components/motion/primitives";
import { CommsProvider } from "./comms";

/** The top bar names the section. The content area names the record. */
const EXTRA_TITLES: Record<string, string> = {
  "/agents/new": "New agent",
};

function titleFor(pathname: string): string {
  if (EXTRA_TITLES[pathname]) return EXTRA_TITLES[pathname]!;
  const match = ALL_NAV.filter(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label ?? "EZRA AI";
}

/**
 * The app shell. Sidebar on panel, 56px top bar, content on paper with a
 * 1280px measure. The single client boundary for the authenticated app.
 */
export function AppShell({
  actions,
  needsReview,
  children,
}: {
  actions?: React.ReactNode;
  needsReview: number;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const pathname = usePathname();
  const title = titleFor(pathname);

  return (
    <MotionRoot>
      <TooltipProvider delayDuration={300}>
        <CommsProvider>
        <div className="flex min-h-dvh bg-canvas">
          <Sidebar needsReview={needsReview} />
          <MobileSidebar
            open={navOpen}
            onClose={() => setNavOpen(false)}
            needsReview={needsReview}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              title={title}
              actions={actions}
              onOpenNav={() => setNavOpen(true)}
              onOpenSearch={() => setSearchOpen(true)}
            />
            <main className="flex-1 px-4 py-6 sm:px-6">
              <div className="mx-auto w-full max-w-[1280px]">{children}</div>
            </main>
          </div>
        </div>

        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </CommsProvider>
      </TooltipProvider>
    </MotionRoot>
  );
}
