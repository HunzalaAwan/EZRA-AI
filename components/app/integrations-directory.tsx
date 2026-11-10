"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRightIcon,
  ArrowsLeftRightIcon,
  CheckCircleIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PlugsIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/status";
import { Logo } from "@/components/marketing/nav";
import { AppLogo } from "./app-logo";
import { DeveloperPanel } from "./developer-panel";
import type { ApiKey, Integration, WebhookDelivery, WebhookEndpoint } from "@/lib/api/types";
import { NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Integrations, as a directory: every app with its own mark, a search box,
 * and category filters, with what is already connected kept at the top.
 *
 * The API and webhooks live on a second tab. PRODUCT.md keeps endpoints and
 * keys out of the default view, so the owner lands on apps and only someone
 * building on top of EZRA goes looking for the other tab.
 */

type Category = Integration["category"];

const CATEGORIES: { key: Category; title: string; blurb: string; does: string[] }[] = [
  {
    key: "booking",
    title: "Bookings and tickets",
    blurb: "Tours, activities, and tickets, booked and paid for while the caller is still on the line.",
    does: [
      "Read live availability while the caller is on the line",
      "Text a checkout link that books straight in",
      "Count which links turned into bookings",
    ],
  },
  {
    key: "calendar",
    title: "Calendars",
    blurb: "Where an appointment gets written the moment a time is agreed.",
    does: [
      "See when you are free",
      "Write the appointment the moment a time is agreed",
      "Move or cancel it when a caller asks",
    ],
  },
  {
    key: "records",
    title: "Practice and job software",
    blurb: "The system your office already runs on, for patients, clients, and jobs.",
    does: [
      "Find the customer by name or phone number",
      "Book the right person, chair, or crew",
      "Attach the call summary to their record",
    ],
  },
  {
    key: "crm",
    title: "Customer records",
    blurb: "Where new customers and what they asked about get filed for follow up.",
    does: [
      "Create or update the contact",
      "Log every call and chat with its summary",
      "Mark new leads for someone to follow up",
    ],
  },
  {
    key: "messaging",
    title: "Messaging and alerts",
    blurb: "Where customers message you, and where your team hears what needs them.",
    does: [
      "Answer and send messages as your business",
      "Alert your team when a caller needs a person",
      "Keep the whole thread with the customer's record",
    ],
  },
  {
    key: "payments",
    title: "Payments",
    blurb: "Deposits and prepaid tickets, taken before the customer hangs up.",
    does: [
      "Send a deposit or payment link",
      "Mark the booking paid when the payment clears",
      "Show what was paid in Conversations",
    ],
  },
  {
    key: "automation",
    title: "Automation",
    blurb: "Send what EZRA learns on to anything else you use.",
    does: [
      "Send each call, booking, and message as it happens",
      "Include the summary and the customer's details",
      "Turn it off at any time",
    ],
  },
];

const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<Category, (typeof CATEGORIES)[number]>;

/** The stored notes are written for engineers; the office gets these. */
const PLAIN: Record<string, { detail: string; fix: string; action: string }> = {
  "google-calendar": {
    detail:
      "Google Calendar stopped accepting appointments because its sign in expired. Nothing was lost: bookings since then went to Curve Dental only.",
    fix: "Sign in to the Google account that owns the calendar. We start writing appointments to it again right away, and fill in the ones it missed.",
    action: "Sign in again",
  },
};

const ORDER: Record<Integration["status"], number> = { error: 0, connected: 1, available: 2 };

export function IntegrationsDirectory({
  apps: initial,
  linkStats,
  apiKeys,
  endpoints,
  deliveries,
  initialTab,
}: {
  apps: Integration[];
  linkStats: { sent7d: number; booked7d: number };
  apiKeys: ApiKey[];
  endpoints: WebhookEndpoint[];
  deliveries: WebhookDelivery[];
  initialTab: "apps" | "developers";
}) {
  const [apps, setApps] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Category | "all" | "connected">("all");
  const [open, setOpen] = React.useState<string | null>(null);
  const current = apps.find((a) => a.id === open) ?? null;

  const q = query.trim().toLowerCase();
  const browsing = q === "" && filter === "all";
  const matches = apps
    .filter((a) =>
      filter === "all" ? true : filter === "connected" ? a.status !== "available" : a.category === filter,
    )
    .filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        CATEGORY[a.category].title.toLowerCase().includes(q),
    )
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name));

  const inUse = apps.filter((a) => a.status !== "available").sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const broken = apps.filter((a) => a.status === "error");

  function update(id: string, patch: Partial<Integration>) {
    setApps((all) => all.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  const chips: { key: typeof filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: apps.length },
    { key: "connected", label: "In use", count: inUse.length },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.title, count: apps.filter((a) => a.category === c.key).length })),
  ];

  return (
    <Tabs defaultValue={initialTab} className="space-y-6">
      <TabsList aria-label="Integrations">
        <TabsTrigger value="apps">Apps</TabsTrigger>
        <TabsTrigger value="developers">API and webhooks</TabsTrigger>
      </TabsList>

      <TabsContent value="apps" className="space-y-8 focus-visible:outline-none">
        {/* What is broken comes first, with what to press. */}
        {broken.map((a) => {
          const plain = PLAIN[a.key];
          return (
            <div
              key={a.id}
              role="status"
              className="flex flex-wrap items-start gap-4 rounded-2xl border border-danger/30 bg-danger-wash p-4 sm:p-5"
            >
              <AppLogo appKey={a.key} />
              <div className="min-w-0 flex-1 basis-56">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                  {a.name}
                  <Badge tone="danger">
                    <WarningCircleIcon aria-hidden weight="fill" className="size-3.5" />
                    Needs attention
                  </Badge>
                </p>
                <p className="mt-1 max-w-[70ch] text-sm leading-relaxed text-ink">{plain?.detail ?? a.detail}</p>
                {plain ? <p className="mt-1 max-w-[70ch] text-xs leading-relaxed text-ink-muted">{plain.fix}</p> : null}
              </div>
              <Button variant="primary" size="sm" className="w-full sm:w-auto" onClick={() => setOpen(a.id)}>
                {plain?.action ?? "Sign in again"}
              </Button>
            </div>
          );
        })}

        {/* Search and filters. */}
        <div className="space-y-3">
          <div className="relative max-w-xl">
            <MagnifyingGlassIcon
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-faint"
            />
            <Input
              type="search"
              aria-label="Search apps"
              placeholder={`Search ${apps.length} apps`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 rounded-full pl-10 pr-10"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-raised hover:text-ink"
              >
                <XIcon aria-hidden className="size-4" />
              </button>
            ) : null}
          </div>
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={filter === c.key}
                onClick={() => setFilter(c.key)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === c.key
                    ? "border-ink bg-ink text-canvas"
                    : "border-rule bg-surface text-ink-muted hover:border-rule-control hover:text-ink",
                )}
              >
                {c.label}
                <span data-numeric className={cn("font-mono", filter === c.key ? "text-canvas" : "text-ink-faint")}>
                  {c.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {browsing ? (
          <>
            <Group title="In use" body="Connected and working for your agents right now.">
              {inUse.map((a) => (
                <AppCard key={a.id} app={a} onOpen={() => setOpen(a.id)} />
              ))}
            </Group>

            {CATEGORIES.map((c) => {
              const rows = apps.filter((a) => a.category === c.key && a.status === "available");
              if (!rows.length) return null;
              return (
                <Group key={c.key} title={c.title} body={c.blurb}>
                  {rows.map((a) => (
                    <AppCard key={a.id} app={a} onOpen={() => setOpen(a.id)} />
                  ))}
                  {c.key === "booking" ? <LinkStats {...linkStats} /> : null}
                </Group>
              );
            })}
          </>
        ) : matches.length ? (
          <section aria-label="Matching apps" className="space-y-3">
            <p className="text-sm text-ink-muted" aria-live="polite">
              <span data-numeric className="font-mono text-ink">{matches.length}</span>{" "}
              {matches.length === 1 ? "app" : "apps"}
              {q ? ` match "${query.trim()}"` : ""}
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {matches.map((a) => (
                <AppCard key={a.id} app={a} onOpen={() => setOpen(a.id)} />
              ))}
            </ul>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-rule-control">
            <EmptyState
              icon={PlugsIcon}
              title={q ? `Nothing called "${query.trim()}" yet` : "Nothing here yet"}
              body="Tell us what you use and we will look at connecting it. Until then, Zapier or a webhook can send your calls and bookings to almost anything."
              action={
                <Button
                  variant="secondary"
                  onClick={() => toast.success(q ? `Noted. We will look at ${query.trim()}.` : "Noted.")}
                >
                  Ask us to connect it
                </Button>
              }
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="developers" className="focus-visible:outline-none">
        <DeveloperPanel apiKeys={apiKeys} endpoints={endpoints} deliveries={deliveries} />
      </TabsContent>

      <ConnectDialog
        app={current}
        onOpenChange={(o) => !o && setOpen(null)}
        onConnect={(id) => {
          update(id, { status: "connected", connectedAt: new Date().toISOString(), detail: "Connected just now. Your agents start using it on the next call." });
        }}
        onDisconnect={(id) => update(id, { status: "available", connectedAt: null, detail: initial.find((a) => a.id === id)?.detail ?? "" })}
      />
    </Tabs>
  );
}

function Group({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 max-w-[62ch] text-sm text-ink-muted">{body}</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</ul>
    </section>
  );
}

function AppCard({ app, onOpen }: { app: Integration; onOpen: () => void }) {
  const detail = PLAIN[app.key]?.detail ?? app.detail;
  return (
    <li className="group flex flex-col rounded-2xl border border-rule bg-surface p-4 shadow-[0_1px_2px_rgb(10_10_10/0.04)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-rule-control hover:shadow-[0_14px_30px_-20px_rgb(10_10_10/0.35)] motion-reduce:hover:translate-y-0">
      <div className="flex items-start gap-3">
        <AppLogo appKey={app.key} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{app.name}</p>
          <p className="truncate text-xs text-ink-muted">{CATEGORY[app.category].title}</p>
        </div>
        {app.status === "connected" ? (
          <Badge tone="success">
            <CheckCircleIcon aria-hidden weight="fill" className="size-3.5" />
            Connected
          </Badge>
        ) : app.status === "error" ? (
          <Badge tone="danger">
            <WarningCircleIcon aria-hidden weight="fill" className="size-3.5" />
            Needs attention
          </Badge>
        ) : null}
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-muted">{detail}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-rule pt-3">
        {app.status === "connected" && app.connectedAt ? (
          <span className="text-xs text-ink-faint">
            Since <span data-numeric className="font-mono">{fmt.relative(app.connectedAt, NOW)}</span>
          </span>
        ) : (
          <span />
        )}
        <Button
          variant={app.status === "error" ? "primary" : app.status === "connected" ? "quiet" : "secondary"}
          size="sm"
          onClick={onOpen}
        >
          {app.status === "error" ? "Fix it" : app.status === "connected" ? "Manage" : "Connect"}
          <span className="sr-only"> {app.name}</span>
        </Button>
      </div>
    </li>
  );
}

function LinkStats({ sent7d, booked7d }: { sent7d: number; booked7d: number }) {
  const rate = sent7d > 0 ? booked7d / sent7d : 0;
  return (
    <li className="flex flex-col justify-between gap-3 rounded-2xl bg-primary-wash p-4 sm:col-span-2 xl:col-span-1">
      <p className="text-sm leading-relaxed text-ink">
        This week the agent sent <span data-numeric className="font-mono font-semibold">{fmt.count(sent7d)}</span>{" "}
        booking links and <span data-numeric className="font-mono font-semibold">{fmt.count(booked7d)}</span> became
        bookings, a rate of <span data-numeric className="font-mono font-semibold">{fmt.percent(rate)}</span>. Today
        they go to your online booking page.
      </p>
      <Button asChild variant="quiet" size="sm" className="self-start">
        <Link href={"/dashboard?view=links" as Route}>
          See where they went
          <ArrowRightIcon aria-hidden />
        </Link>
      </Button>
    </li>
  );
}

function ConnectDialog({
  app,
  onOpenChange,
  onConnect,
  onDisconnect,
}: {
  app: Integration | null;
  onOpenChange: (open: boolean) => void;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  // Keep the last app while the dialog animates closed, so it never empties mid-fade.
  const [shown, setShown] = React.useState(app);
  React.useEffect(() => {
    if (app) {
      setShown(app);
      setConfirming(false);
    }
  }, [app]);

  const a = app ?? shown;
  if (!a) return null;
  const category = CATEGORY[a.category];
  const plain = PLAIN[a.key];

  function connect() {
    if (!a) return;
    setBusy(true);
    // Stands in for the app's own sign in window.
    window.setTimeout(() => {
      setBusy(false);
      onConnect(a.id);
      onOpenChange(false);
      toast.success(`${a.name} connected. Your agents use it from the next call.`);
    }, 1100);
  }

  const title =
    a.status === "available" ? `Connect ${a.name}` : a.status === "error" ? `Reconnect ${a.name}` : a.name;

  return (
    <Dialog open={Boolean(app)} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={category.title}>
        <div className="flex items-center justify-center gap-4 rounded-2xl bg-panel py-6">
          <AppLogo appKey={a.key} size="lg" />
          <ArrowsLeftRightIcon aria-hidden className="size-5 text-ink-faint" />
          <span aria-hidden className="flex size-14 items-center justify-center rounded-2xl bg-surface ring-1 ring-rule">
            <Logo className="size-9" />
          </span>
        </div>

        {a.status === "connected" ? (
          <p className="mt-4 text-sm leading-relaxed text-ink">{a.detail}</p>
        ) : a.status === "error" && plain ? (
          <p className="mt-4 rounded-xl bg-danger-wash px-3.5 py-2.5 text-sm leading-relaxed text-ink">{plain.fix}</p>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{a.detail}</p>
        )}

        <p className="mt-5 text-sm font-semibold text-ink">What your agents can do with it</p>
        <ul className="mt-2 space-y-2">
          {category.does.map((d) => (
            <li key={d} className="flex items-start gap-2.5 text-sm text-ink">
              <CheckIcon aria-hidden weight="bold" className="mt-0.5 size-4 shrink-0 text-success" />
              {d}
            </li>
          ))}
        </ul>

        {a.status !== "connected" ? (
          <p className="mt-5 text-xs leading-relaxed text-ink-muted">
            You sign in to {a.name} to allow it. You can disconnect at any time, and nothing already written is removed.
          </p>
        ) : null}

        <DialogFooter className="flex-wrap">
          {a.status === "connected" ? (
            confirming ? (
              <>
                <span className="mr-auto text-sm text-ink">Disconnect {a.name}?</span>
                <Button variant="secondary" onClick={() => setConfirming(false)}>
                  Keep it
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    onDisconnect(a.id);
                    onOpenChange(false);
                    toast(`${a.name} disconnected.`);
                  }}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <Button variant="quiet" className="mr-auto text-danger" onClick={() => setConfirming(true)}>
                  Disconnect
                </Button>
                <Button variant="primary" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </>
            )
          ) : (
            <>
              <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="primary" loading={busy} onClick={connect}>
                {a.status === "error" ? `Sign in to ${a.name}` : `Connect ${a.name}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
