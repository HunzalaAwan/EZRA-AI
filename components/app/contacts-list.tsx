"use client";

import * as React from "react";
import {
  ChatCircleDotsIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { OutcomeBadge } from "@/components/ui/status";
import { CommsButton } from "./comms";
import type { Contact } from "@/lib/api/types";
import { NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Everyone who has called or chatted, with what to do next.
 *
 * The filters are the questions the owner actually asks: who is waiting on
 * us, who booked, and who talked to the agent and never booked. That last one
 * is the list a booking link exists for, so its rows lead with "Send a booking
 * link" rather than burying it.
 */

type Filter = "all" | "follow-up" | "booked" | "never-booked";

const FILTERS: { key: Filter; label: string; test: (c: Contact) => boolean }[] = [
  { key: "all", label: "Everyone", test: () => true },
  { key: "follow-up", label: "Needs follow up", test: (c) => Boolean(c.followUp) },
  { key: "booked", label: "Booked", test: (c) => c.bookings > 0 },
  { key: "never-booked", label: "Never booked", test: (c) => c.bookings === 0 },
];

/** One grid for the header and the rows. Below md, rows stack. */
const COLS =
  "md:grid md:grid-cols-[minmax(0,1.6fr)_8.5rem_minmax(0,1.5fr)_7.5rem_10.5rem] md:items-center md:gap-5";

/** Identity colour by position in a fixed order, never by rank. */
const HUES = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-4)",
  "var(--color-series-3)",
];

export function ContactsList({ contacts }: { contacts: Contact[] }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const q = query.trim().toLowerCase();
  const qd = q.replace(/\D/g, "");
  const shown = contacts.filter((c) => {
    const f = FILTERS.find((x) => x.key === filter)!;
    if (!f.test(c)) return false;
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)) ||
      (qd.length >= 3 && c.e164.includes(qd))
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <MagnifyingGlassIcon
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
          />
          <label htmlFor="contact-search" className="sr-only">
            Search contacts
          </label>
          <Input
            id="contact-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, number, email or tag"
            className="rounded-full pl-10"
          />
        </div>
        <div role="group" aria-label="Show" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const n = contacts.filter(f.test).length;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  filter === f.key
                    ? "border-ink bg-ink text-canvas"
                    : "border-rule text-ink-muted hover:border-rule-control hover:text-ink",
                )}
              >
                {f.label}{" "}
                <span data-numeric className="font-mono text-xs opacity-80">
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* One grid for the header and every row, so every column lines up
          and the actions never move from row to row. */}
      <Card className="overflow-hidden">
        <div
          aria-hidden
          className={`hidden border-b border-rule bg-panel px-5 py-3 text-xs font-medium text-ink-muted ${COLS}`}
        >
          <span>Contact</span>
          <span>Status</span>
          <span>Next step</span>
          <span>Last contact</span>
          <span className="text-right">Actions</span>
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={MagnifyingGlassIcon}
            title="Nobody matches that"
            body="Try part of a name, the last four digits of a number, or clear the filter."
          />
        ) : (
          <ul>
            {shown.map((c) => {
              const hue = HUES[contacts.indexOf(c) % HUES.length]!;
              const SourceIcon = c.source === "voice" ? PhoneIcon : ChatCircleDotsIcon;
              const display = c.name ?? fmt.phone(c.e164);
              const needsLink = c.bookings === 0;
              return (
                <li
                  key={c.id}
                  style={{ "--hue": hue } as React.CSSProperties}
                  className={`border-b border-rule px-5 py-4 transition-colors last:border-b-0 hover:bg-panel/60 ${COLS}`}
                >
                  {/* Contact */}
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--hue)_16%,var(--color-surface))] font-display text-sm font-semibold text-ink"
                    >
                      {c.name ? fmt.initials(c.name) : "#"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{display}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {c.name ? (
                          <span data-numeric className="font-mono">
                            {fmt.phone(c.e164)}
                          </span>
                        ) : (
                          c.tags[0]
                        )}
                        {c.name && c.tags.length ? ` · ${c.tags.join(", ")}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-2 md:mt-0">
                    <OutcomeBadge outcome={c.lastOutcome} />
                  </div>

                  {/* Next step */}
                  <div className="mt-2 min-w-0 md:mt-0">
                    {c.followUp ? (
                      <p className="flex items-start gap-1.5 text-sm text-ink">
                        <WarningCircleIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
                        <span className="line-clamp-2">{c.followUp}</span>
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                        <SourceIcon aria-hidden className="size-4 shrink-0" />
                        <span className="truncate">
                          {c.conversations} {c.conversations === 1 ? "call" : "calls"}, {c.bookings} booked
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Last contact */}
                  <p className="mt-1 text-xs text-ink-muted md:mt-0 md:text-sm">
                    <span className="md:hidden">Last contact </span>
                    {fmt.relative(c.lastContactAt, NOW)}
                  </p>

                  {/* Actions: four fixed slots. The link is highlighted only for
                      someone who has never booked. */}
                  <div className="mt-3 flex items-center gap-1.5 md:mt-0 md:justify-end">
                    <CommsButton
                      action="link"
                      to={c.e164}
                      label={`Send ${display} a booking link`}
                      iconOnly
                      variant={needsLink ? "primary" : "secondary"}
                    />
                    <CommsButton action="call" to={c.e164} label={`Call ${display}`} iconOnly />
                    <CommsButton action="text" to={c.e164} label={`Text ${display}`} iconOnly />
                    <CommsButton
                      action="email"
                      to={c.email ?? undefined}
                      label={c.email ? `Email ${display}` : `No email on file for ${display}`}
                      iconOnly
                      disabled={!c.email}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
