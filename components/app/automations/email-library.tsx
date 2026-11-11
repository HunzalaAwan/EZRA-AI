"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CopyIcon, FileIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/status";
import type { EmailPurpose, EmailTemplate } from "@/lib/api/types";
import { PURPOSE, fillSample } from "@/lib/email";
import { NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmailRender } from "./email-render";
import { FilterPills } from "./shared";

/**
 * Every email EZRA can send, as the email itself. A list of names would make
 * the owner open each one to remember which is which; a real thumbnail says
 * it at a glance.
 */
export function EmailLibrary({
  templates,
  usedBy,
  businessName,
}: {
  templates: EmailTemplate[];
  usedBy: Record<string, string | null>;
  businessName: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | EmailPurpose>("all");
  const [creating, setCreating] = React.useState(false);
  const shown = filter === "all" ? templates : templates.filter((t) => t.purpose === filter);
  const n = (p: EmailPurpose) => templates.filter((t) => t.purpose === p).length;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link href={"/automations" as Route} className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-muted transition-colors hover:text-ink">
          <ArrowLeftIcon aria-hidden className="size-4" />
          Automations
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">Email templates</h2>
            <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
              The emails your follow-ups, review requests, and bookings send, in your own colours. Change one here and it
              changes everywhere it is used.
            </p>
          </div>
          <Button variant="primary" onClick={() => setCreating(true)}>
            <PlusIcon aria-hidden weight="bold" />
            New template
          </Button>
        </div>
      </div>

      <FilterPills
        label="Show"
        value={filter}
        onChange={setFilter}
        options={[
          { key: "all", label: "All", count: templates.length },
          { key: "follow-up", label: "Follow-ups", count: n("follow-up") },
          { key: "review", label: "Review requests", count: n("review") },
          { key: "booking", label: "Bookings", count: n("booking") },
          { key: "general", label: "General", count: n("general") },
        ]}
      />

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rule-control px-6 py-14 text-center">
          <p className="text-sm font-medium text-ink">No {filter === "all" ? "" : PURPOSE[filter as EmailPurpose].label.toLowerCase() + " "}templates yet</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => router.push(`/automations/emails/new?purpose=${filter === "all" ? "general" : filter}` as Route)}>
            Write one
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((t) => (
            <li key={t.id}>
              <Link
                href={`/automations/emails/${t.id}` as Route}
                className="group block overflow-hidden rounded-2xl border border-rule bg-surface transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-rule-control hover:shadow-raised"
              >
                {/* A real thumbnail of the email, at half size. */}
                <div aria-hidden className="relative h-60 overflow-hidden border-b border-rule" style={{ background: "#f1f1f4" }}>
                  <div className="pointer-events-none absolute left-0 top-0 w-[200%] origin-top-left scale-50">
                    <EmailRender template={t} businessName={businessName} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#f1f1f4] to-transparent" />
                </div>
                <div className="space-y-1.5 px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-ink group-hover:text-primary">{t.name}</p>
                    <Badge tone="neutral">{PURPOSE[t.purpose].label}</Badge>
                  </div>
                  <p className="truncate text-sm text-ink-muted">{fillSample(t.subject)}</p>
                  <p className={cn("text-xs", usedBy[t.id] ? "text-ink" : "text-ink-muted")}>
                    {usedBy[t.id] ? `Sent as ${usedBy[t.id]}` : "Not used by an automation"}
                    <span className="text-ink-muted">
                      {" "}
                      &middot; edited <span data-numeric className="font-mono">{fmt.relative(t.updatedAt, NOW)}</span>
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent title="New email template" description="Start from a first draft for what it is for, or copy one you already have.">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-ink">A first draft</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PURPOSE) as EmailPurpose[]).map((p) => (
                  <Link
                    key={p}
                    href={`/automations/emails/new?purpose=${p}` as Route}
                    className="flex items-start gap-2.5 rounded-xl border border-rule bg-canvas px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary-wash"
                  >
                    <FileIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                    <span>
                      <span className="block text-sm font-medium text-ink">{PURPOSE[p].label}</span>
                      <span className="block text-xs leading-snug text-ink-muted">{PURPOSE[p].hint}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">A copy of</p>
              <ul className="max-h-56 space-y-1 overflow-y-auto">
                {templates.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/automations/emails/new?from=${t.id}` as Route}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors hover:bg-panel"
                    >
                      <CopyIcon aria-hidden className="size-4 text-ink-muted" />
                      {t.name}
                      <span className="ml-auto text-xs text-ink-muted">{PURPOSE[t.purpose].label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
