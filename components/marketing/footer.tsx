import Link from "next/link";
import type { Route } from "next";
import { Logo } from "./nav";

/**
 * Footer. Three columns of real destinations plus the legal strip.
 *
 * No atmospheric locale line, no build stamp, no version number. Those are
 * devtool fixtures, not landing-page content.
 */

const COLUMNS: { title: string; links: { label: string; href: Route }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Voice agents", href: "/product/voice" as Route },
      { label: "Website chat", href: "/product/chat" as Route },
      { label: "Scheduling", href: "/product/scheduling" as Route },
      { label: "Reporting", href: "/product/reporting" as Route },
      { label: "Pricing", href: "/pricing" as Route },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/pricing" as Route },
      { label: "Talk to sales", href: "/pricing" as Route },
      { label: "Support", href: "/pricing" as Route },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Create an agent", href: "/agents/new" as Route },
      { label: "Log in", href: "/dashboard" as Route },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-rule bg-panel">
      <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo />
              <span className="font-display text-lg font-semibold tracking-[-0.03em] text-ink">
                EZRA
              </span>
            </Link>
            <p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-ink-muted">
              Agents that answer your phone and your website chat, so a missed
              call stops being a lost customer.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-2xs font-medium text-ink-faint">{col.title}</p>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            EZRA AI by Ellington Technologies
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {["Privacy", "Terms", "Security", "Accessibility"].map((l) => (
              <li key={l}>
                <Link
                  href={"/pricing" as Route}
                  className="text-xs text-ink-faint transition-colors hover:text-ink-muted"
                >
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
