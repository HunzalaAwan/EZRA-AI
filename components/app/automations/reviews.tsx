"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { BellSimpleRingingIcon, EnvelopeSimpleIcon, InfoIcon, PlusIcon, StarIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { Badge, type BadgeProps } from "@/components/ui/status";
import { ConversionChart } from "@/components/app/charts";
import { CommsButton } from "@/components/app/comms";
import type { EmailTemplate, MessageChannel, ReviewResults, ReviewRun, ReviewSettings } from "@/lib/api/types";
import { NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmailRender, InboxHeader } from "./email-render";
import {
  Bubble,
  CHANNEL,
  ChannelToggle,
  DetailHeader,
  FilterPills,
  Funnel,
  PLATFORM,
  Panel,
  PhoneThread,
  Rule,
  SaveBar,
  Stars,
  Stat,
  StatStrip,
  ThreadTime,
  VarChips,
  after,
  fill,
  smsParts,
  useInsert,
  useTabParam,
} from "./shared";

/**
 * Review requests, on a screen of their own.
 *
 * Once a booking has actually happened, EZRA sends the review link. One
 * message, one link, and at most one reminder: no score first, no filtering.
 * Everyone gets the same ask, which is what Google's rules require, and it is
 * the simplest thing for the customer.
 *
 * Results read back from each platform, so "left a review" means a review
 * that exists, with the stars they gave.
 */

export type ReviewTab = "results" | "setup" | "people";

const DELAYS = [1, 2, 3, 4, 24, 48];

export function ReviewsScreen({
  initial,
  results,
  runs,
  templates,
  businessName,
  initialTab,
}: {
  initial: ReviewSettings;
  results: ReviewResults;
  runs: ReviewRun[];
  templates: EmailTemplate[];
  businessName: string;
  initialTab: ReviewTab;
}) {
  const [tab, setTab] = useTabParam<ReviewTab>(initialTab);
  const [saved, setSaved] = React.useState(initial);
  const [d, setD] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);

  return (
    <div className="space-y-6">
      <DetailHeader
        title="Review requests"
        body="A few hours after a visit, EZRA thanks them and sends your review link. Cancelled bookings and no-shows are never asked."
        enabled={saved.enabled}
        onToggle={(enabled) => {
          setSaved((s) => ({ ...s, enabled }));
          setD((s) => ({ ...s, enabled }));
          toast(enabled ? "Review requests are on." : "Review requests are off.");
        }}
        switchLabel="review requests"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Review requests">
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="people">
            People <span data-numeric className="ml-1.5 font-mono text-xs text-ink-muted">{runs.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-6 focus-visible:outline-none">
          <Results r={results} runs={runs} />
        </TabsContent>

        <TabsContent value="setup" className="mt-6 focus-visible:outline-none">
          <Setup d={d} setD={setD} templates={templates} businessName={businessName} />
          <SaveBar
            dirty={dirty}
            saving={saving}
            note="Changes apply from the next finished booking."
            onDiscard={() => setD(saved)}
            onSave={() => {
              const problem = validate(d);
              if (problem) return toast.error(problem);
              setSaving(true);
              window.setTimeout(() => {
                setSaved(d);
                setSaving(false);
                toast.success("Review requests saved.");
              }, 500);
            }}
          />
        </TabsContent>

        <TabsContent value="people" className="mt-6 focus-visible:outline-none">
          <People runs={runs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function validate(d: ReviewSettings): string | null {
  const on = d.platforms.filter((p) => p.enabled);
  if (on.length === 0) return "Turn on at least one place to leave a review.";
  for (const p of on) if (!/^https:\/\/\S+\.\S+/.test(p.url.trim())) return `Add the full ${PLATFORM[p.key].label} review link, starting with https://`;
  if (d.channels.includes("sms") && !d.body.includes("{review_link}")) return "The text needs the review link, or there is nowhere to tap.";
  if (d.channels.includes("email") && !d.emailTemplateId) return "Pick the email to send.";
  if (d.reminder.enabled && !d.reminder.body.includes("{review_link}")) return "The reminder needs the review link too.";
  return null;
}

/* =============================================================== results */

function Results({ r, runs }: { r: ReviewResults; runs: ReviewRun[] }) {
  const latest = runs.filter((x) => x.state === "reviewed").sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""));
  const maxPlatform = Math.max(...r.byPlatform.map((p) => p.reviews), 1);
  return (
    <div className="space-y-6">
      <div>
        <StatStrip>
          <Stat label="New reviews" value={fmt.count(r.reviewed)} delta={{ current: r.reviewed, previous: r.reviewedPrev }} />
          <div className="min-w-0 bg-surface px-5 py-4">
            <dt className="text-sm text-ink-muted">Their average rating</dt>
            <dd className="mt-1">
              <span className="flex items-baseline gap-2">
                <span data-numeric className="font-mono text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-ink">
                  {r.averageRating.toFixed(1)}
                </span>
                <span data-numeric className="font-mono text-xs text-ink-muted">of 5</span>
              </span>
              <span className="mt-2 block">
                <Stars value={r.averageRating} size="size-3.5" />
              </span>
            </dd>
          </div>
          <Stat label="Opened the review link" value={fmt.count(r.tapped)} note={fmt.percent(r.tapped / r.asked)} />
          <Stat label="Came in after the reminder" value={fmt.count(r.reviewedAfterReminder)} note={`${fmt.percent(r.reviewedAfterReminder / r.reviewed)} of reviews`} />
        </StatStrip>
        <p className="mt-2 text-xs text-ink-muted">
          The last 30 days. Reviews are matched to the person EZRA asked, read back from Google and Facebook once they post.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>From ask to review</CardTitle>
              <CardDescription>Everyone asked after a finished visit.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Funnel
              steps={[
                { label: "Asked for a review", value: r.asked },
                { label: "Opened the review link", value: r.tapped },
                { label: "Left a review", value: r.reviewed },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Where they left it</CardTitle>
              <CardDescription>And how they asked: texts get far more reviews than emails.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="space-y-3.5">
              {r.byPlatform.map((p) => (
                <li key={p.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-ink">{PLATFORM[p.key].label}</span>
                    <span className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                        <StarIcon aria-hidden weight="fill" className="size-3.5 text-ink" />
                        <span data-numeric className="font-mono text-ink">{p.rating.toFixed(1)}</span>
                      </span>
                      <span data-numeric className="w-20 text-right font-mono font-semibold text-ink">
                        {fmt.count(p.reviews)} <span className="text-xs font-normal text-ink-muted">reviews</span>
                      </span>
                    </span>
                  </div>
                  <span aria-hidden className="mt-1.5 block h-2.5 overflow-hidden rounded-full bg-sunken">
                    <span className="block h-full rounded-full" style={{ width: `${(p.reviews / maxPlatform) * 100}%`, background: "var(--color-series-1)" }} />
                  </span>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-2 gap-3 border-t border-rule pt-4">
              {r.byChannel.map((c) => {
                const CIcon = CHANNEL[c.channel].icon;
                return (
                  <div key={c.channel} className="rounded-xl bg-panel px-3.5 py-3">
                    <dt className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <CIcon aria-hidden className="size-3.5" />
                      Asked by {CHANNEL[c.channel].label.toLowerCase()}
                    </dt>
                    <dd className="mt-1">
                      <span data-numeric className="font-mono text-lg font-semibold text-ink">{fmt.percent(c.asked ? c.reviewed / c.asked : 0)}</span>
                      <span className="block text-xs text-ink-muted">
                        <span data-numeric className="font-mono">{fmt.count(c.reviewed)}</span> of{" "}
                        <span data-numeric className="font-mono">{fmt.count(c.asked)}</span> reviewed
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Day by day</CardTitle>
            <CardDescription>People asked each day over the last two weeks, and how many of them reviewed.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ConversionChart data={r.daily} convertedLabel="Left a review" restLabel="Asked, no review yet" caption="Review requests and reviews, by day" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Latest reviews from your requests</CardTitle>
            <CardDescription>What they wrote, and where.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <ul>
            {latest.map((x) => (
              <li key={x.id} className="flex flex-wrap items-start gap-x-5 gap-y-2 border-t border-rule px-5 py-4">
                <div className="min-w-0 flex-1 basis-72">
                  <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-sm font-medium text-ink">{x.name}</span>
                    {x.rating ? <Stars value={x.rating} size="size-3.5" /> : null}
                    {x.platform ? <Badge tone="neutral">{PLATFORM[x.platform].label}</Badge> : null}
                  </p>
                  {x.excerpt ? <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-ink-muted">&ldquo;{x.excerpt}&rdquo;</p> : null}
                </div>
                <p className="text-xs text-ink-muted">
                  After a {x.service.toLowerCase()},{" "}
                  <span data-numeric className="font-mono">{x.reviewedAt ? fmt.relative(x.reviewedAt, NOW) : ""}</span>
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================= setup */

function Setup({
  d,
  setD,
  templates,
  businessName,
}: {
  d: ReviewSettings;
  setD: React.Dispatch<React.SetStateAction<ReviewSettings>>;
  templates: EmailTemplate[];
  businessName: string;
}) {
  const body = useInsert<HTMLTextAreaElement>(d.body, (v) => setD((x) => ({ ...x, body: v })));
  const rem = useInsert<HTMLTextAreaElement>(d.reminder.body, (v) => setD((x) => ({ ...x, reminder: { ...x.reminder, body: v } })));
  const [view, setView] = React.useState<MessageChannel>(d.channels[0] ?? "sms");
  React.useEffect(() => {
    if (!d.channels.includes(view)) setView(d.channels[0] ?? "sms");
  }, [d.channels, view]);

  const reviewTemplates = templates.filter((t) => t.purpose === "review");
  const tpl = templates.find((t) => t.id === d.emailTemplateId) ?? null;
  const enabledPlatforms = d.platforms.filter((p) => p.enabled);
  const parts = smsParts(d.body);
  const VAR_KEYS = ["first_name", "business", "service", "review_link", "business_phone"];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <Panel title="When to ask" body="Soon enough that the visit is fresh, late enough that they are home.">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Send it" htmlFor="rv-after" className="w-80">
              <Select value={String(d.afterHours)} onChange={(e) => setD((x) => ({ ...x, afterHours: Number(e.target.value) }))}>
                {DELAYS.map((h) => (
                  <option key={h} value={h}>
                    {after(h)} after the booking ends
                  </option>
                ))}
              </Select>
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">By</p>
              <ChannelToggle label="Send review requests by" multiple value={d.channels} onChange={(channels) => setD((x) => ({ ...x, channels }))} />
            </div>
          </div>
          <p className="text-xs text-ink-muted">With both on, people with a mobile number get the text, and the rest get the email.</p>
        </Panel>

        <Panel title="The message" body="Thank them, keep it short, and make the link the only thing to do.">
          {d.channels.includes("sms") ? (
            <div className="space-y-2">
              <Field label="Text" htmlFor="rv-body">
                <Textarea ref={body.ref} value={d.body} onFocus={() => setView("sms")} onChange={(e) => setD((x) => ({ ...x, body: e.target.value }))} className="min-h-24" />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <VarChips onInsert={body.insert} keys={VAR_KEYS} />
                <p data-numeric className="font-mono text-2xs text-ink-muted">
                  {parts.chars} chars, {parts.parts === 1 ? "1 text" : `${parts.parts} texts`}
                </p>
              </div>
            </div>
          ) : null}
          {d.channels.includes("email") ? (
            <div className={cn("space-y-3", d.channels.includes("sms") && "border-t border-rule pt-5")}>
              <Field label="Email" htmlFor="rv-tpl" hint="Written in the template editor, in your own colours.">
                <Select
                  value={d.emailTemplateId}
                  onFocus={() => setView("email")}
                  onChange={(e) => {
                    setD((x) => ({ ...x, emailTemplateId: e.target.value }));
                    setView("email");
                  }}
                >
                  {reviewTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-wrap gap-2">
                {tpl ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/automations/emails/${tpl.id}` as Route}>Edit this email</Link>
                  </Button>
                ) : null}
                <Button asChild variant="quiet" size="sm">
                  <Link href={"/automations/emails/new?purpose=review" as Route}>
                    <PlusIcon aria-hidden />
                    New email
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel title="One reminder" body="Many reviews come from the second ask. EZRA never sends more than one.">
          <Rule
            id="rv-rem"
            label="Remind people who have not opened the link"
            hint="Anyone who already reviewed, or opened the link, is skipped."
            checked={d.reminder.enabled}
            onChange={(enabled) => setD((x) => ({ ...x, reminder: { ...x.reminder, enabled } }))}
          />
          {d.reminder.enabled ? (
            <div className="space-y-3 pl-[3.25rem]">
              <Field label="Send it" htmlFor="rv-rem-after" className="w-72">
                <Select value={String(d.reminder.afterDays)} onChange={(e) => setD((x) => ({ ...x, reminder: { ...x.reminder, afterDays: Number(e.target.value) } }))}>
                  {[1, 2, 3, 5, 7].map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? "1 day" : `${n} days`} after the first ask
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Reminder text" htmlFor="rv-rem-body">
                <Textarea
                  ref={rem.ref}
                  value={d.reminder.body}
                  onFocus={() => setView("sms")}
                  onChange={(e) => setD((x) => ({ ...x, reminder: { ...x.reminder, body: e.target.value } }))}
                  className="min-h-20"
                />
              </Field>
              <VarChips onInsert={rem.insert} keys={VAR_KEYS} />
            </div>
          ) : null}
        </Panel>

        <Panel title="Where they leave it" body="With more than one turned on, the link opens a short page where they pick.">
          <ul className="space-y-2">
            {d.platforms.map((p, i) => {
              const id = `rv-pl-${p.key}`;
              return (
                <li key={p.key} className="rounded-xl border border-rule bg-canvas p-3.5">
                  <div className="flex items-start gap-3">
                    <Switch
                      id={id}
                      checked={p.enabled}
                      onCheckedChange={(enabled) => setD((x) => ({ ...x, platforms: x.platforms.map((y, j) => (j === i ? { ...y, enabled } : y)) }))}
                      className="mt-0.5"
                    />
                    <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                      <span className="block text-sm font-medium text-ink">{PLATFORM[p.key].label}</span>
                      <span className="block text-xs text-ink-muted">{PLATFORM[p.key].hint}</span>
                    </label>
                  </div>
                  {p.enabled ? (
                    <div className="mt-3 pl-[3.25rem]">
                      <label htmlFor={`${id}-url`} className="sr-only">
                        {PLATFORM[p.key].label} review link
                      </label>
                      <Input
                        id={`${id}-url`}
                        type="url"
                        inputMode="url"
                        placeholder="https://"
                        value={p.url}
                        onChange={(e) => setD((x) => ({ ...x, platforms: x.platforms.map((y, j) => (j === i ? { ...y, url: e.target.value } : y)) }))}
                        className="font-mono text-sm"
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Limits">
          <Field label="Ask the same person at most once every" htmlFor="rv-once" className="w-80">
            <Select value={String(d.onceEveryDays)} onChange={(e) => setD((x) => ({ ...x, onceEveryDays: Number(e.target.value) }))}>
              {[30, 60, 90, 180].map((n) => (
                <option key={n} value={n}>
                  {n} days
                </option>
              ))}
            </Select>
          </Field>
          <p className="flex items-start gap-2.5 rounded-xl bg-panel px-3.5 py-3 text-xs leading-relaxed text-ink">
            <InfoIcon aria-hidden className="mt-px size-4 shrink-0 text-primary" />
            Everyone gets the same ask. Sending the link only to people you expect to be happy breaks Google&apos;s review
            rules and can get reviews removed. Yelp asks businesses not to request reviews at all, so it is not offered here.
          </p>
        </Panel>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-ink">What they receive</p>
            <p className="mt-0.5 text-xs text-ink-muted">Marisol finished a cleaning at 11:40am.</p>
          </div>
          {d.channels.length > 1 ? (
            <div role="group" aria-label="Preview" className="flex rounded-full bg-panel p-0.5">
              {d.channels.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={view === c}
                  onClick={() => setView(c)}
                  className={cn(
                    "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    view === c ? "bg-surface text-ink shadow-[0_1px_3px_rgb(10_10_10/0.12)]" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {CHANNEL[c].label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {view === "sms" ? (
          <PhoneThread>
            <ThreadTime>Today {d.afterHours < 24 ? `${after(d.afterHours)} after the visit` : `${after(d.afterHours)} later`}</ThreadTime>
            <Bubble text={fill(d.body)} optOut />
            {d.reminder.enabled ? (
              <>
                <ThreadTime>{d.reminder.afterDays === 1 ? "1 day" : `${d.reminder.afterDays} days`} later, if they have not opened it</ThreadTime>
                <Bubble text={fill(d.reminder.body)} optOut />
              </>
            ) : null}
          </PhoneThread>
        ) : tpl ? (
          <div className="overflow-hidden rounded-2xl border border-rule">
            <InboxHeader businessName={businessName} subject={tpl.subject} preheader={tpl.preheader} />
            <EmailRender template={tpl} businessName={businessName} width="mobile" className="px-2 sm:px-2" />
          </div>
        ) : null}

        {enabledPlatforms.length > 1 ? (
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
            <EnvelopeSimpleIcon aria-hidden className="mt-px size-4 shrink-0" />
            The link opens a page with {enabledPlatforms.map((p) => PLATFORM[p.key].label).join(" and ")} side by side.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ================================================================ people */

const RUN_STATE: Record<ReviewRun["state"], { label: string; tone: BadgeProps["tone"] }> = {
  asked: { label: "Asked", tone: "neutral" },
  reminded: { label: "Reminded", tone: "neutral" },
  tapped: { label: "Opened the link", tone: "primary" },
  reviewed: { label: "Reviewed", tone: "success" },
};

function People({ runs }: { runs: ReviewRun[] }) {
  const [filter, setFilter] = React.useState<"all" | ReviewRun["state"]>("all");
  const shown = filter === "all" ? runs : runs.filter((r) => r.state === filter);
  const count = (s: ReviewRun["state"]) => runs.filter((r) => r.state === s).length;
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Who was asked</h3>
          <p className="text-sm text-ink-muted">Everyone asked in the last three days.</p>
        </div>
        <FilterPills
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { key: "all", label: "All", count: runs.length },
            { key: "asked", label: "Asked", count: count("asked") },
            { key: "reminded", label: "Reminded", count: count("reminded") },
            { key: "tapped", label: "Opened", count: count("tapped") },
            { key: "reviewed", label: "Reviewed", count: count("reviewed") },
          ]}
        />
      </div>
      {shown.length === 0 ? (
        <p className="border-t border-rule px-5 py-10 text-center text-sm text-ink-muted">Nobody here right now.</p>
      ) : (
        <ul>
          {shown.map((r) => {
            const st = RUN_STATE[r.state];
            const CIcon = CHANNEL[r.channel].icon;
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule px-5 py-3.5">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                  <p className="flex items-center gap-1 text-xs text-ink-muted">
                    <CIcon aria-hidden className="size-3.5" />
                    {r.service}, asked <span data-numeric className="font-mono">{fmt.relative(r.askedAt, NOW)}</span>
                  </p>
                </div>
                <div className="w-52">
                  {r.state === "reviewed" && r.rating ? (
                    <span className="flex items-center gap-2">
                      <Stars value={r.rating} size="size-3.5" />
                      <span className="text-xs text-ink-muted">on {r.platform ? PLATFORM[r.platform].label : "your page"}</span>
                    </span>
                  ) : r.state === "reminded" ? (
                    <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <BellSimpleRingingIcon aria-hidden className="size-3.5" />
                      Reminder sent
                    </span>
                  ) : (
                    <Badge tone={st.tone}>{st.label}</Badge>
                  )}
                </div>
                <CommsButton action="call" to={r.e164} label={`Call ${r.name}`} iconOnly variant="quiet" />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
