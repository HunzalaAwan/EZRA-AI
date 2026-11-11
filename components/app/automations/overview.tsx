"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  CalendarCheckIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  LinkIcon,
  StarIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/field";
import type { FollowUpResults, FollowUpSettings, ReviewResults, ReviewSettings } from "@/lib/api/types";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";
import { CHANNEL, PLATFORM, Stars, after } from "./shared";

/**
 * The two automations that earn their keep, each as one card that answers
 * "is it on, what did it do, and where do I change it". Editing happens on
 * the automation's own screen, never in place.
 */
export function AutomationCards({
  followUps,
  followUpResults: fr,
  reviews,
  reviewResults: rr,
  waiting,
  templateCount,
}: {
  followUps: FollowUpSettings;
  followUpResults: FollowUpResults;
  reviews: ReviewSettings;
  reviewResults: ReviewResults;
  waiting: number;
  templateCount: number;
}) {
  const [fuOn, setFuOn] = React.useState(followUps.enabled);
  const [rvOn, setRvOn] = React.useState(reviews.enabled);
  const platforms = reviews.platforms.filter((p) => p.enabled).map((p) => PLATFORM[p.key].label);
  const fuDelta = fmt.delta(fr.booked, fr.bookedPrev);
  const rvDelta = fmt.delta(rr.reviewed, rr.reviewedPrev);

  return (
    <section aria-label="Automations" className="space-y-4">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AutomationCard
          href="/automations/follow-ups"
          icon={ArrowsClockwiseIcon}
          tone="var(--color-series-1)"
          title="Booking link follow-ups"
          body="Brings back people who got a booking link and never booked."
          enabled={fuOn}
          onToggle={(v) => {
            setFuOn(v);
            toast(v ? "Follow-ups are on." : "Follow-ups are off.");
          }}
          switchId="auto-fu"
          headline={fmt.count(fr.booked)}
          headlineLabel="booked after a follow-up"
          headlineNote={
            <>
              worth <span data-numeric className="font-mono font-semibold text-ink">{fmt.money(fr.bookedValueCents)}</span>
            </>
          }
          delta={fuDelta}
          funnel={[
            { label: "Followed up", value: fmt.count(fr.started) },
            { label: "Tapped the link", value: fmt.count(fr.tapped) },
            { label: "Booking rate", value: fmt.percent(fr.booked / fr.started) },
          ]}
          flow={[
            { label: "Link sent", icon: LinkIcon },
            ...followUps.steps.map((s) => ({ label: after(s.afterHours), icon: CHANNEL[s.channel].icon })),
            { label: "Booked", icon: CalendarCheckIcon, end: true },
          ]}
          footnote={`${waiting} waiting on their next follow-up`}
        />
        <AutomationCard
          href="/automations/reviews"
          icon={StarIcon}
          tone="var(--color-series-4)"
          title="Review requests"
          body={`Asks for a review on ${platforms.join(" or ") || "your page"} after every finished visit.`}
          enabled={rvOn}
          onToggle={(v) => {
            setRvOn(v);
            toast(v ? "Review requests are on." : "Review requests are off.");
          }}
          switchId="auto-rv"
          headline={fmt.count(rr.reviewed)}
          headlineLabel="new reviews"
          headlineNote={
            <span className="inline-flex items-center gap-1.5">
              <Stars value={rr.averageRating} size="size-3.5" />
              <span data-numeric className="font-mono font-semibold text-ink">{rr.averageRating.toFixed(1)}</span>
            </span>
          }
          delta={rvDelta}
          funnel={[
            { label: "Asked", value: fmt.count(rr.asked) },
            { label: "Opened the link", value: fmt.count(rr.tapped) },
            { label: "Review rate", value: fmt.percent(rr.reviewed / rr.asked) },
          ]}
          flow={[
            { label: "Visit done", icon: CheckCircleIcon },
            { label: `${after(reviews.afterHours)} later`, icon: CHANNEL[reviews.channels[0] ?? "sms"].icon },
            ...(reviews.reminder.enabled ? [{ label: `Reminder, ${reviews.reminder.afterDays} days`, icon: CHANNEL[reviews.channels[0] ?? "sms"].icon }] : []),
            { label: "Reviewed", icon: StarIcon, end: true },
          ]}
          footnote="Everyone gets the same ask"
        />
      </div>

      <Link
        href={"/automations/emails" as Route}
        className="group flex flex-wrap items-center gap-4 rounded-2xl border border-rule bg-surface px-5 py-4 transition-colors hover:border-rule-control"
      >
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-panel text-ink">
          <EnvelopeSimpleIcon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">Email templates</span>
          <span className="block text-sm text-ink-muted">
            <span data-numeric className="font-mono">{templateCount}</span> emails in your colours, used by follow-ups, reviews, and bookings.
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
          Open templates
          <ArrowRightIcon aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </section>
  );
}

function AutomationCard({
  href,
  icon: CardIcon,
  tone,
  title,
  body,
  enabled,
  onToggle,
  switchId,
  headline,
  headlineLabel,
  headlineNote,
  delta,
  funnel,
  flow,
  footnote,
}: {
  href: string;
  icon: Icon;
  tone: string;
  title: string;
  body: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  switchId: string;
  headline: string;
  headlineLabel: string;
  headlineNote: React.ReactNode;
  delta: { text: string; direction: "up" | "down" | "flat" };
  funnel: { label: string; value: string }[];
  flow: { label: string; icon: Icon; end?: boolean }[];
  footnote: string;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-rule bg-surface p-6" style={{ "--tone": tone } as React.CSSProperties}>
      <div className="flex items-start gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--tone)_14%,transparent)] text-[var(--tone)] light:bg-[color-mix(in_oklab,var(--tone)_12%,white)]">
          <CardIcon aria-hidden weight="fill" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-ink">
            <Link href={href as Route} className="hover:underline">
              {title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{body}</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <label htmlFor={switchId} className="cursor-pointer text-xs font-medium text-ink-muted">
            {enabled ? "On" : "Off"}
            <span className="sr-only">, {title}</span>
          </label>
          <Switch id={switchId} checked={enabled} onCheckedChange={onToggle} />
        </div>
      </div>

      <div className={cn("mt-6 transition-opacity", !enabled && "opacity-70")}>
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span data-numeric className="font-mono text-[2.5rem] font-semibold leading-none tracking-[-0.03em] text-ink">
            {headline}
          </span>
          <span className="text-base text-ink">{headlineLabel}</span>
          <span className="text-sm text-ink-muted">{headlineNote}</span>
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          <span data-numeric className={cn("font-mono font-medium", delta.direction === "up" ? "text-success" : delta.direction === "down" ? "text-danger" : "text-ink")}>
            {delta.text}
          </span>{" "}
          on the 30 days before
        </p>

        <dl className="mt-5 grid grid-cols-3 border-y border-rule">
          {funnel.map((f, i) => (
            <div key={f.label} className={cn("py-3", i > 0 && "border-l border-rule pl-4")}>
              <dt className="text-xs text-ink-muted">{f.label}</dt>
              <dd data-numeric className="mt-0.5 font-mono text-base font-semibold text-ink">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>

        <ol aria-label={`How ${title.toLowerCase()} run`} className="mt-4 flex flex-wrap items-center gap-1.5">
          {flow.map((f, i) => {
            const FIcon = f.icon;
            return (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 ? <ArrowRightIcon aria-hidden className="size-3 text-ink-faint" /> : null}
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", f.end ? "bg-success-wash text-ink" : "bg-panel text-ink")}>
                  <FIcon aria-hidden className={cn("size-3.5", f.end ? "text-success" : "text-ink-muted")} />
                  {f.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
        <p className="text-xs text-ink-muted">{footnote}</p>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={`${href}?tab=results` as Route}>See results</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href={`${href}?tab=setup` as Route}>Edit setup</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
