"use client";

import * as React from "react";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  BellRingingIcon,
  CalendarCheckIcon,
  ChatTextIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  InfoIcon,
  LinkIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { Badge, type BadgeProps } from "@/components/ui/status";
import { CommsButton } from "./comms";
import type {
  FollowUpRun,
  FollowUpSettings,
  FollowUpStep,
  MessageChannel,
  ReviewPlatformKey,
  ReviewRun,
  ReviewSettings,
} from "@/lib/api/types";
import { NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Two automations that run without anyone watching.
 *
 *   Follow-ups. A booking link that was sent and never used is a customer
 *   who nearly booked. EZRA checks in on a short schedule, and stops the
 *   moment they book, reply, call, or say stop.
 *
 *   Reviews. Once a booking has actually happened, EZRA asks how it went and
 *   sends the review link. Everyone gets the link, whatever score they give:
 *   asking only happy customers breaks Google's review rules, and a low score
 *   is better answered with a phone call than hidden.
 *
 * Each is a card that says what it does and what it achieved, an editor with
 * the real message beside it, and a list of who is in it right now.
 */

const VARS: { key: string; sample: string }[] = [
  { key: "first_name", sample: "Marisol" },
  { key: "business", sample: "Alder Creek Dental" },
  { key: "service", sample: "cleaning" },
  { key: "booking_link", sample: "ezra.to/b/k7Qm2" },
  { key: "business_phone", sample: "(541) 388-2014" },
  { key: "review_link", sample: "g.page/r/aldercreek" },
];
const fill = (t: string) => VARS.reduce((x, v) => x.replaceAll(`{${v.key}}`, v.sample), t);

const DELAYS = [1, 2, 4, 8, 24, 48, 72, 120, 168];
const REVIEW_DELAYS = [1, 2, 3, 4, 24, 48];

function after(h: number) {
  if (h < 24) return h === 1 ? "1 hour" : `${h} hours`;
  if (h === 24) return "Next day";
  const d = Math.round(h / 24);
  return d === 7 ? "1 week" : `${d} days`;
}

const PLATFORM: Record<ReviewPlatformKey, { label: string; hint: string }> = {
  google: { label: "Google", hint: "Your Google Business Profile review link." },
  facebook: { label: "Facebook", hint: "Your page's reviews tab." },
  tripadvisor: { label: "Tripadvisor", hint: "Best for tours, activities, and attractions." },
  website: { label: "Your website", hint: "A testimonials or feedback page you run." },
};

const CHANNEL: Record<MessageChannel, { label: string; icon: Icon }> = {
  sms: { label: "Text", icon: ChatTextIcon },
  email: { label: "Email", icon: EnvelopeIcon },
};

export function Automations({
  followUps: initialFollowUps,
  reviews: initialReviews,
  followUpRuns: initialRuns,
  reviewRuns,
}: {
  followUps: FollowUpSettings;
  reviews: ReviewSettings;
  followUpRuns: FollowUpRun[];
  reviewRuns: ReviewRun[];
}) {
  const [followUps, setFollowUps] = React.useState(initialFollowUps);
  const [reviews, setReviews] = React.useState(initialReviews);
  const [runs, setRuns] = React.useState(initialRuns);
  const [editing, setEditing] = React.useState<"followups" | "reviews" | null>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);

  function edit(which: "followups" | "reviews") {
    setEditing(which);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const waiting = runs.filter((r) => r.state === "waiting").length;
  const fuRate = followUps.stats30d.started ? followUps.stats30d.booked / followUps.stats30d.started : 0;
  const rvRate = reviews.stats30d.asked ? reviews.stats30d.reviewed / reviews.stats30d.asked : 0;
  const reviewPlatform = reviews.platforms.find((p) => p.enabled);

  return (
    <section aria-labelledby="automations" className="space-y-4">
      <div>
        <h3 id="automations" className="font-display text-lg font-semibold text-ink">
          Follow-ups and reviews
        </h3>
        <p className="mt-0.5 max-w-[62ch] text-sm text-ink-muted">
          Run on their own. One brings back people who got a booking link and did not book. The other asks for a
          review once a booking has happened.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ------------------------------------------------- follow-ups card */}
        <AutomationCard
          icon={ArrowsClockwiseIcon}
          tone="var(--color-series-1)"
          title="Booking link follow-ups"
          body="When someone gets a booking link and does not book, EZRA checks in. It stops the moment they book."
          enabled={followUps.enabled}
          onToggle={(enabled) => {
            setFollowUps((f) => ({ ...f, enabled }));
            toast(enabled ? "Follow-ups are on." : "Follow-ups are off. Nobody new is followed up.");
          }}
          switchId="auto-followups"
          flow={[
            { label: "Link sent", icon: LinkIcon },
            ...followUps.steps.map((s) => ({ label: after(s.afterHours), icon: CHANNEL[s.channel].icon })),
            { label: "They book", icon: CalendarCheckIcon, end: true },
          ]}
          stats={[
            { label: "Followed up", value: fmt.count(followUps.stats30d.started) },
            { label: "Then booked", value: fmt.count(followUps.stats30d.booked), note: fmt.percent(fuRate) },
            { label: "Asked to stop", value: fmt.count(followUps.stats30d.optedOut) },
          ]}
          footnote={`${waiting} waiting on a follow-up right now.`}
          action={
            <Button variant={editing === "followups" ? "primary" : "secondary"} size="sm" onClick={() => edit("followups")}>
              Edit follow-ups
            </Button>
          }
        />

        {/* --------------------------------------------------- reviews card */}
        <AutomationCard
          icon={StarIcon}
          tone="var(--color-series-4)"
          title="Review requests"
          body="Once a booking has happened, EZRA asks how it went and sends your review link."
          enabled={reviews.enabled}
          onToggle={(enabled) => {
            setReviews((r) => ({ ...r, enabled }));
            toast(enabled ? "Review requests are on." : "Review requests are off.");
          }}
          switchId="auto-reviews"
          flow={[
            { label: "Visit done", icon: CheckCircleIcon },
            { label: `${after(reviews.afterHours)} later`, icon: CHANNEL[reviews.channels[0] ?? "sms"].icon },
            ...(reviews.askScoreFirst ? [{ label: "Score 1 to 5", icon: StarIcon }] : []),
            { label: reviewPlatform ? PLATFORM[reviewPlatform.key].label : "Review link", icon: LinkIcon, end: true },
          ]}
          stats={[
            { label: "Asked", value: fmt.count(reviews.stats30d.asked) },
            { label: "Left a review", value: fmt.count(reviews.stats30d.reviewed), note: fmt.percent(rvRate) },
            { label: "Average score", value: reviews.stats30d.averageScore.toFixed(1), note: "of 5" },
          ]}
          footnote="Everyone gets the review link, whatever score they give."
          action={
            <Button variant={editing === "reviews" ? "primary" : "secondary"} size="sm" onClick={() => edit("reviews")}>
              Edit review requests
            </Button>
          }
        />
      </div>

      <div ref={editorRef} className="scroll-mt-24">
        {editing === "followups" ? (
          <FollowUpEditor
            value={followUps}
            onCancel={() => setEditing(null)}
            onSave={(next) => {
              setFollowUps(next);
              setEditing(null);
              toast.success("Follow-ups saved. They apply to links sent from now on.");
            }}
          />
        ) : editing === "reviews" ? (
          <ReviewEditor
            value={reviews}
            onCancel={() => setEditing(null)}
            onSave={(next) => {
              setReviews(next);
              setEditing(null);
              toast.success("Review requests saved. They apply to the next finished booking.");
            }}
          />
        ) : null}
      </div>

      <Activity
        runs={runs}
        reviewRuns={reviewRuns}
        followUps={followUps}
        onStop={(id) => {
          setRuns((all) => all.map((r) => (r.id === id ? { ...r, state: "opted-out", nextAt: null } : r)));
          toast("Stopped. No more follow-ups go to them.");
        }}
      />
    </section>
  );
}

/* ------------------------------------------------------------------ card */

function AutomationCard({
  icon: CardIcon,
  tone,
  title,
  body,
  enabled,
  onToggle,
  switchId,
  flow,
  stats,
  footnote,
  action,
}: {
  icon: Icon;
  tone: string;
  title: string;
  body: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  switchId: string;
  flow: { label: string; icon: Icon; end?: boolean }[];
  stats: { label: string; value: string; note?: string }[];
  footnote: string;
  action: React.ReactNode;
}) {
  return (
    <Card
      className={cn("flex flex-col p-5 transition-opacity", !enabled && "opacity-80")}
      style={{ "--tone": tone } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--tone)_14%,transparent)] text-[var(--tone)] light:bg-[color-mix(in_oklab,var(--tone)_12%,white)]">
          <CardIcon aria-hidden weight="fill" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor={switchId} className="block cursor-pointer font-display text-base font-semibold text-ink">
            {title}
          </label>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{body}</p>
        </div>
        <Switch id={switchId} checked={enabled} onCheckedChange={onToggle} className="mt-1" />
      </div>

      {/* The flow, as steps. */}
      <ol aria-label={`How ${title.toLowerCase()} work`} className="mt-4 flex flex-wrap items-center gap-1.5">
        {flow.map((f, i) => {
          const FIcon = f.icon;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 ? <ArrowRightIcon aria-hidden className="size-3.5 text-ink-faint" /> : null}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  f.end ? "bg-success-wash text-ink" : "bg-panel text-ink",
                )}
              >
                <FIcon aria-hidden className={cn("size-3.5", f.end ? "text-success" : "text-ink-muted")} />
                {f.label}
              </span>
            </li>
          );
        })}
      </ol>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-rule pt-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-ink-muted">{s.label}</dt>
            <dd className="mt-0.5 flex items-baseline gap-1.5">
              <span data-numeric className="font-mono text-xl font-semibold text-ink">
                {s.value}
              </span>
              {s.note ? (
                <span data-numeric className="font-mono text-xs text-ink-muted">
                  {s.note}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-1 text-xs text-ink-muted">In the last 30 days.</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
        <p className="text-xs text-ink-muted">{footnote}</p>
        {action}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- editors */

function VarChips({ onInsert, keys }: { onInsert: (k: string) => void; keys: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Details you can insert">
      {VARS.filter((v) => keys.includes(v.key)).map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onInsert(v.key)}
          className="cursor-pointer rounded-full border border-rule bg-canvas px-2.5 py-1 text-2xs text-ink-muted transition-colors hover:border-primary/40 hover:text-primary"
        >
          {v.key.replaceAll("_", " ")}
        </button>
      ))}
    </div>
  );
}

/** A textarea that accepts variable chips at the cursor. */
function useInsert(value: string, onChange: (v: string) => void) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const insert = (key: string) => {
    const el = ref.current;
    const token = `{${key}}`;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };
  return { ref, insert };
}

function ChannelToggle({
  value,
  onChange,
  label,
  multiple,
}: {
  value: MessageChannel[];
  onChange: (v: MessageChannel[]) => void;
  label: string;
  multiple?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {(["sms", "email"] as const).map((c) => {
        const on = value.includes(c);
        const CIcon = CHANNEL[c].icon;
        return (
          <button
            key={c}
            type="button"
            aria-pressed={on}
            onClick={() => {
              if (!multiple) return onChange([c]);
              const next = on ? value.filter((x) => x !== c) : [...value, c];
              if (next.length) onChange(next);
            }}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
              on ? "border-primary/40 bg-primary-wash text-primary" : "border-rule text-ink-muted hover:border-rule-control hover:text-ink",
            )}
          >
            <CIcon aria-hidden className="size-3.5" />
            {CHANNEL[c].label}
          </button>
        );
      })}
    </div>
  );
}

function Rule({ id, label, hint, checked, onChange, locked }: { id: string; label: string; hint?: string; checked: boolean; onChange?: (v: boolean) => void; locked?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={locked} className="mt-0.5" />
      <label htmlFor={id} className={cn("min-w-0", locked ? "cursor-default" : "cursor-pointer")}>
        <span className="block text-sm font-medium text-ink">
          {label}
          {locked ? <span className="ml-2 text-xs font-normal text-ink-muted">Always</span> : null}
        </span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{hint}</span> : null}
      </label>
    </div>
  );
}

function SmsBubble({ text, from = "business", optOut }: { text: string; from?: "business" | "customer"; optOut?: boolean }) {
  const customer = from === "customer";
  return (
    <p
      className={cn(
        "w-fit max-w-[30ch] whitespace-pre-line px-3.5 py-2.5 text-sm leading-relaxed shadow-raised",
        customer ? "ml-auto rounded-2xl rounded-br-sm bg-primary text-on-primary" : "rounded-2xl rounded-bl-sm bg-surface text-ink",
      )}
    >
      {text || "Nothing yet."}
      {optOut ? <span className="mt-1 block text-xs text-ink-muted">Reply STOP to opt out</span> : null}
    </p>
  );
}

function EditorShell({ title, body, children, onSave, onCancel, saveLabel, error }: { title: string; body: string; children: React.ReactNode; onSave: () => void; onCancel: () => void; saveLabel: string; error?: string | null }) {
  return (
    <Card className="p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="space-y-6"
      >
        <div>
          <h4 className="font-display text-lg font-semibold text-ink">{title}</h4>
          <p className="mt-0.5 max-w-[62ch] text-sm text-ink-muted">{body}</p>
        </div>
        {children}
        {error ? (
          <p role="alert" className="rounded-xl bg-danger-wash px-3.5 py-2.5 text-sm text-ink">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 border-t border-rule pt-4">
          <Button type="submit" variant="primary" size="sm">
            {saveLabel}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => toast.success("Sent a test to your own phone and inbox.")}>
            <PaperPlaneTiltIcon aria-hidden />
            Send me a test
          </Button>
          <Button type="button" variant="quiet" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function FollowUpEditor({ value, onSave, onCancel }: { value: FollowUpSettings; onSave: (v: FollowUpSettings) => void; onCancel: () => void }) {
  const [d, setD] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => setError(null), [d]);

  const setStep = (i: number, patch: Partial<FollowUpStep>) =>
    setD((x) => ({ ...x, steps: x.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  function save() {
    if (d.steps.length === 0) return setError("Add at least one follow-up, or turn follow-ups off instead.");
    for (let i = 0; i < d.steps.length; i++) {
      const s = d.steps[i]!;
      if (!s.body.trim()) return setError(`Follow-up ${i + 1} has no message.`);
      if (!s.body.includes("{booking_link}")) return setError(`Follow-up ${i + 1} needs the booking link, or there is nothing to tap.`);
      if (i > 0 && s.afterHours <= d.steps[i - 1]!.afterHours)
        return setError(`Follow-up ${i + 1} has to go out later than follow-up ${i}.`);
    }
    onSave(d);
  }

  return (
    <EditorShell
      title="Booking link follow-ups"
      body="Each one is timed from when the booking link was sent. Tap a detail to drop it in where the cursor is."
      onSave={save}
      onCancel={onCancel}
      saveLabel="Save follow-ups"
      error={error}
    >
      <ol className="space-y-4">
        {d.steps.map((s, i) => (
          <StepEditor
            key={s.id}
            index={i}
            step={s}
            onChange={(patch) => setStep(i, patch)}
            onRemove={() => setD((x) => ({ ...x, steps: x.steps.filter((y) => y.id !== s.id) }))}
          />
        ))}
      </ol>
      {d.steps.length < 4 ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="border-dashed"
          onClick={() =>
            setD((x) => {
              const last = x.steps[x.steps.length - 1]?.afterHours ?? 0;
              const nextDelay = DELAYS.find((h) => h > last) ?? 168;
              return {
                ...x,
                steps: [
                  ...x.steps,
                  {
                    id: `fu_${Date.now()}`,
                    afterHours: nextDelay,
                    channel: "sms",
                    subject: null,
                    body: "Hi {first_name}, just checking in from {business}. Your link is still here when you're ready: {booking_link}",
                  },
                ],
              };
            })
          }
        >
          <PlusIcon aria-hidden weight="bold" />
          Add a follow-up
        </Button>
      ) : null}

      <fieldset className="space-y-3 rounded-xl border border-rule bg-canvas p-4">
        <legend className="px-1 text-sm font-semibold text-ink">Stop following up when</legend>
        <Rule id="fu-booked" label="They book" checked locked />
        <Rule
          id="fu-replied"
          label="They reply"
          hint="The reply goes to your agent, who carries on the conversation instead."
          checked={d.stopWhenReplied}
          onChange={(stopWhenReplied) => setD((x) => ({ ...x, stopWhenReplied }))}
        />
        <Rule
          id="fu-called"
          label="They call you"
          checked={d.stopWhenCalled}
          onChange={(stopWhenCalled) => setD((x) => ({ ...x, stopWhenCalled }))}
        />
        <Rule id="fu-stop" label="They reply STOP" hint="Added to every text automatically. They never hear from you by text again." checked locked />
      </fieldset>
      <Rule
        id="fu-quiet"
        label="Hold texts overnight"
        hint="Anything due between 8pm and 8am in their time zone waits until 8am."
        checked={d.quietHours}
        onChange={(quietHours) => setD((x) => ({ ...x, quietHours }))}
      />
    </EditorShell>
  );
}

function StepEditor({ index, step: s, onChange, onRemove }: { index: number; step: FollowUpStep; onChange: (p: Partial<FollowUpStep>) => void; onRemove: () => void }) {
  const { ref, insert } = useInsert(s.body, (body) => onChange({ body }));
  const base = `fu-${s.id}`;
  return (
    <li className="grid grid-cols-1 gap-5 rounded-2xl border border-rule p-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span data-numeric className="flex size-7 items-center justify-center rounded-full bg-primary-wash font-mono text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <span className="text-sm font-semibold text-ink">Follow-up {index + 1}</span>
          </span>
          <Button type="button" variant="quiet" size="icon-sm" aria-label={`Remove follow-up ${index + 1}`} onClick={onRemove}>
            <TrashIcon aria-hidden />
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Send it" htmlFor={`${base}-after`} className="w-48">
            <Select value={String(s.afterHours)} onChange={(e) => onChange({ afterHours: Number(e.target.value) })}>
              {DELAYS.map((h) => (
                <option key={h} value={h}>
                  {h === 24 ? "Next day" : after(h)} after the link
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">By</p>
            <ChannelToggle
              label={`Send follow-up ${index + 1} by`}
              value={[s.channel]}
              onChange={(c) => onChange({ channel: c[0]!, subject: c[0] === "email" ? s.subject ?? "A quick note from {business}" : null })}
            />
          </div>
        </div>
        {s.channel === "email" ? (
          <Field label="Email subject" htmlFor={`${base}-subj`}>
            <Input value={s.subject ?? ""} onChange={(e) => onChange({ subject: e.target.value })} />
          </Field>
        ) : null}
        <Field label="Message" htmlFor={`${base}-body`}>
          <Textarea ref={ref} value={s.body} onChange={(e) => onChange({ body: e.target.value })} className="min-h-24" />
        </Field>
        <VarChips onInsert={insert} keys={["first_name", "business", "service", "booking_link", "business_phone"]} />
      </div>
      <div>
        <p className="text-xs font-medium text-ink-muted">What they receive</p>
        <div className="mt-2 rounded-xl bg-sunken p-4">
          {s.channel === "sms" ? (
            <>
              <p className="mb-1.5 text-2xs text-ink-muted">Text from (541) 388-2014</p>
              <SmsBubble text={fill(s.body)} optOut />
            </>
          ) : (
            <>
              <p className="text-2xs text-ink-muted">Email</p>
              <p className="mt-1 text-sm font-semibold text-ink">{fill(s.subject ?? "")}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{fill(s.body)}</p>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function ReviewEditor({ value, onSave, onCancel }: { value: ReviewSettings; onSave: (v: ReviewSettings) => void; onCancel: () => void }) {
  const [d, setD] = React.useState(value);
  const [error, setError] = React.useState<string | null>(null);
  const [sample, setSample] = React.useState<"high" | "low">("high");
  React.useEffect(() => setError(null), [d]);

  const q = useInsert(d.scoreQuestion, (scoreQuestion) => setD((x) => ({ ...x, scoreQuestion })));
  const b = useInsert(d.body, (body) => setD((x) => ({ ...x, body })));
  const l = useInsert(d.lowScoreReply, (lowScoreReply) => setD((x) => ({ ...x, lowScoreReply })));
  // Detail chips drop into whichever message was last being edited.
  const [active, setActive] = React.useState<"q" | "b" | "l">("b");
  const target = { q, b, l }[active];

  function save() {
    const on = d.platforms.filter((p) => p.enabled);
    if (on.length === 0) return setError("Turn on at least one place to leave a review.");
    for (const p of on) {
      if (!/^https:\/\/\S+\.\S+/.test(p.url.trim())) return setError(`Add the full ${PLATFORM[p.key].label} review link, starting with https://`);
    }
    if (!d.body.includes("{review_link}")) return setError("The review message needs the review link, or there is nowhere to tap.");
    if (d.askScoreFirst && !d.lowScoreReply.includes("{review_link}"))
      return setError("The reply to a low score still needs the review link. Everyone gets the same chance to review.");
    onSave(d);
  }

  return (
    <EditorShell
      title="Review requests"
      body="Sent after the booking ends. Cancelled bookings and no-shows are skipped."
      onSave={save}
      onCancel={onCancel}
      saveLabel="Save review requests"
      error={error}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Ask" htmlFor="rv-after" className="w-72">
              <Select value={String(d.afterHours)} onChange={(e) => setD((x) => ({ ...x, afterHours: Number(e.target.value) }))}>
                {REVIEW_DELAYS.map((h) => (
                  <option key={h} value={h}>
                    {h === 24 ? "Next day" : after(h)} after the booking ends
                  </option>
                ))}
              </Select>
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">By</p>
              <ChannelToggle label="Send review requests by" multiple value={d.channels} onChange={(channels) => setD((x) => ({ ...x, channels }))} />
            </div>
          </div>

          <Rule
            id="rv-score"
            label="Ask for a score first"
            hint="They reply with a number from 1 to 5. More people answer a number than open a link, and you hear about problems early."
            checked={d.askScoreFirst}
            onChange={(askScoreFirst) => setD((x) => ({ ...x, askScoreFirst }))}
          />

          {d.askScoreFirst ? (
            <Field label="The question" htmlFor="rv-q">
              <Textarea ref={q.ref} onFocus={() => setActive("q")} className="min-h-16" value={d.scoreQuestion} onChange={(e) => setD((x) => ({ ...x, scoreQuestion: e.target.value }))} />
            </Field>
          ) : null}
          <Field label={d.askScoreFirst ? "When they score 4 or 5" : "The message"} htmlFor="rv-body">
            <Textarea ref={b.ref} onFocus={() => setActive("b")} className="min-h-16" value={d.body} onChange={(e) => setD((x) => ({ ...x, body: e.target.value }))} />
          </Field>
          {d.askScoreFirst ? (
            <Field
              label="When they score 1 to 3"
              htmlFor="rv-low"
              hint="Still includes the review link. Say sorry, and say someone will be in touch."
            >
              <Textarea ref={l.ref} onFocus={() => setActive("l")} className="min-h-20" value={d.lowScoreReply} onChange={(e) => setD((x) => ({ ...x, lowScoreReply: e.target.value }))} />
            </Field>
          ) : null}
          <VarChips onInsert={(k) => target.insert(k)} keys={["first_name", "business", "service", "review_link", "business_phone"]} />

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-ink">Where people leave the review</legend>
            <p className="text-xs text-ink-muted">With more than one turned on, the link opens a short page where they pick.</p>
            <ul className="space-y-2">
              {d.platforms.map((p, i) => {
                const id = `rv-pl-${p.key}`;
                return (
                  <li key={p.key} className="rounded-xl border border-rule bg-canvas p-3">
                    <div className="flex items-start gap-3">
                      <Switch
                        id={id}
                        checked={p.enabled}
                        onCheckedChange={(enabled) =>
                          setD((x) => ({ ...x, platforms: x.platforms.map((y, j) => (j === i ? { ...y, enabled } : y)) }))
                        }
                        className="mt-0.5"
                      />
                      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                        <span className="block text-sm font-medium text-ink">{PLATFORM[p.key].label}</span>
                        <span className="block text-xs text-ink-muted">{PLATFORM[p.key].hint}</span>
                      </label>
                    </div>
                    {p.enabled ? (
                      <div className="mt-2.5 pl-12">
                        <label htmlFor={`${id}-url`} className="sr-only">
                          {PLATFORM[p.key].label} review link
                        </label>
                        <Input
                          id={`${id}-url`}
                          type="url"
                          inputMode="url"
                          placeholder="https://"
                          value={p.url}
                          onChange={(e) =>
                            setD((x) => ({ ...x, platforms: x.platforms.map((y, j) => (j === i ? { ...y, url: e.target.value } : y)) }))
                          }
                          className="font-mono text-sm"
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <div className="space-y-3">
            <Rule
              id="rv-alert"
              label="Tell my team about scores of 3 or lower"
              hint="A text to whoever gets alerts, with the customer's number, so someone can call them today."
              checked={d.alertOnLowScore}
              onChange={(alertOnLowScore) => setD((x) => ({ ...x, alertOnLowScore }))}
            />
            <Field label="Ask the same person at most once every" htmlFor="rv-once" className="w-56">
              <Select value={String(d.onceEveryDays)} onChange={(e) => setD((x) => ({ ...x, onceEveryDays: Number(e.target.value) }))}>
                {[30, 60, 90, 180].map((n) => (
                  <option key={n} value={n}>
                    {n} days
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <p className="flex items-start gap-2.5 rounded-xl bg-panel px-3.5 py-3 text-xs leading-relaxed text-ink">
            <InfoIcon aria-hidden className="mt-px size-4 shrink-0 text-primary" />
            Everyone gets the review link, whatever score they give. Sending it only to happy customers breaks
            Google&apos;s review rules and can get reviews removed. Yelp asks businesses not to request reviews at all, so
            it is not offered here.
          </p>
        </div>

        {/* The conversation they will have. */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink-muted">What they receive</p>
            {d.askScoreFirst ? (
              <div role="group" aria-label="Preview a score" className="flex rounded-full bg-panel p-0.5">
                {(["high", "low"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={sample === k}
                    onClick={() => setSample(k)}
                    className={cn(
                      "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      sample === k ? "bg-surface text-ink shadow-[0_1px_3px_rgb(10_10_10/0.12)]" : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {k === "high" ? "Scores 5" : "Scores 2"}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="mt-2 space-y-2.5 rounded-xl bg-sunken p-4">
            <p className="text-2xs text-ink-muted">Text from (541) 388-2014</p>
            {d.askScoreFirst ? (
              <>
                <SmsBubble text={fill(d.scoreQuestion)} />
                <SmsBubble from="customer" text={sample === "high" ? "5" : "2"} />
                <SmsBubble text={fill(sample === "high" ? d.body : d.lowScoreReply)} optOut />
                {sample === "low" && d.alertOnLowScore ? (
                  <p className="flex items-center gap-1.5 pt-1 text-xs font-medium text-ink">
                    <BellRingingIcon aria-hidden className="size-4 text-warning" />
                    Your team gets a text to call Marisol
                  </p>
                ) : null}
              </>
            ) : (
              <SmsBubble text={fill(d.body)} optOut />
            )}
          </div>
        </div>
      </div>
    </EditorShell>
  );
}

/* ------------------------------------------------------------- activity */

const RUN_STATE: Record<FollowUpRun["state"], { label: string; tone: BadgeProps["tone"] }> = {
  waiting: { label: "Waiting", tone: "neutral" },
  booked: { label: "Booked", tone: "success" },
  replied: { label: "Replied, agent took over", tone: "primary" },
  "opted-out": { label: "Stopped", tone: "warning" },
};

function Activity({
  runs,
  reviewRuns,
  followUps,
  onStop,
}: {
  runs: FollowUpRun[];
  reviewRuns: ReviewRun[];
  followUps: FollowUpSettings;
  onStop: (id: string) => void;
}) {
  const total = followUps.steps.length;
  return (
    <Card className="overflow-hidden">
      <Tabs defaultValue="followups">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
          <h4 className="font-display text-base font-semibold text-ink">Right now</h4>
          <TabsList aria-label="Who is in which automation" className="border-b-0">
            <TabsTrigger value="followups">
              Follow-ups <span data-numeric className="ml-1 font-mono text-xs text-ink-muted">{runs.length}</span>
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Review replies <span data-numeric className="ml-1 font-mono text-xs text-ink-muted">{reviewRuns.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="followups" className="focus-visible:outline-none">
          <ul className="mt-2">
            {runs.map((r) => {
              const st = RUN_STATE[r.state];
              const who = r.name ?? fmt.phone(r.e164);
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule px-5 py-3.5">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-sm font-medium text-ink">{who}</p>
                    <p className="text-xs text-ink-muted">
                      {r.service} link sent <span data-numeric className="font-mono">{fmt.relative(r.linkSentAt, NOW)}</span>
                    </p>
                  </div>
                  <div role="img" className="flex items-center gap-1.5" aria-label={`${r.sent} of ${total} follow-ups sent`}>
                    {Array.from({ length: total }, (_, i) => (
                      <span key={i} aria-hidden className={cn("h-1.5 w-6 rounded-full", i < r.sent ? "bg-primary" : "bg-sunken")} />
                    ))}
                  </div>
                  <div className="w-40 text-xs text-ink-muted">
                    {r.state === "waiting" && r.nextAt ? (
                      <>
                        Next <span data-numeric className="font-mono text-ink">{fmt.relative(r.nextAt, NOW)}</span>
                      </>
                    ) : (
                      <Badge tone={st.tone}>{st.label}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <CommsButton action="call" to={r.e164} label={`Call ${who}`} iconOnly variant="quiet" />
                    {r.state === "waiting" ? (
                      <Button variant="quiet" size="sm" onClick={() => onStop(r.id)}>
                        Stop
                        <span className="sr-only"> following up {who}</span>
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="reviews" className="focus-visible:outline-none">
          <ul className="mt-2">
            {reviewRuns.map((r) => {
              const low = r.score !== null && r.score <= 3;
              return (
                <li
                  key={r.id}
                  className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule px-5 py-3.5", low && "bg-danger-wash")}
                >
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                    <p className="text-xs text-ink-muted">
                      {r.service}, asked <span data-numeric className="font-mono">{fmt.relative(r.askedAt, NOW)}</span>
                    </p>
                  </div>
                  <div role="img" className="flex w-36 items-center gap-0.5" aria-label={r.score === null ? "No reply yet" : `Scored ${r.score} of 5`}>
                    {r.score === null ? (
                      <span className="text-xs text-ink-muted">No reply yet</span>
                    ) : (
                      Array.from({ length: 5 }, (_, i) => (
                        <StarIcon
                          key={i}
                          aria-hidden
                          weight={i < r.score! ? "fill" : "regular"}
                          className={cn("size-4", i < r.score! ? "text-ink" : "text-ink-faint")}
                        />
                      ))
                    )}
                  </div>
                  <div className="w-48 text-xs">
                    {r.state === "reviewed" ? (
                      <Badge tone="success">
                        <CheckCircleIcon aria-hidden weight="fill" className="size-3.5" />
                        Reviewed on {r.platform ? PLATFORM[r.platform].label : "your page"}
                      </Badge>
                    ) : low ? (
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        <BellRingingIcon aria-hidden className="size-4 text-danger" />
                        Team told to call
                      </span>
                    ) : r.state === "scored" ? (
                      <span className="text-ink-muted">Link sent, not reviewed yet</span>
                    ) : (
                      <span className="text-ink-muted">Waiting for a score</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <CommsButton action="call" to={r.e164} label={`Call ${r.name}`} iconOnly={!low} variant={low ? "secondary" : "quiet"} />
                  </div>
                </li>
              );
            })}
          </ul>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
