"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  CalendarCheckIcon,
  EnvelopeSimpleIcon,
  LinkIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { Badge, type BadgeProps } from "@/components/ui/status";
import { ConversionChart } from "@/components/app/charts";
import { CommsButton } from "@/components/app/comms";
import type {
  EmailTemplate,
  FollowUpBooking,
  FollowUpResults,
  FollowUpRun,
  FollowUpSettings,
  FollowUpStep,
} from "@/lib/api/types";
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
  Panel,
  PhoneThread,
  Rule,
  SaveBar,
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
 * Booking link follow-ups, on a screen of their own.
 *
 *   Results first, because the question an owner brings here is "is this
 *   working": how many booked because of a follow-up, what those bookings are
 *   worth, and which follow-up in the sequence does the work.
 *
 *   Setup is the sequence as a timeline, from the link being sent to the
 *   booking that stops it, with the whole thread previewed on a phone.
 *
 *   People is who is in the sequence right now, with a way to stop any one.
 */

export type FollowUpTab = "results" | "setup" | "people";

const DELAYS = [1, 2, 4, 8, 24, 48, 72, 120, 168];
const MAX_STEPS = 4;

export function FollowUpsScreen({
  initial,
  results,
  bookings,
  runs: initialRuns,
  templates,
  businessName,
  initialTab,
}: {
  initial: FollowUpSettings;
  results: FollowUpResults;
  bookings: FollowUpBooking[];
  runs: FollowUpRun[];
  templates: EmailTemplate[];
  businessName: string;
  initialTab: FollowUpTab;
}) {
  const [tab, setTab] = useTabParam<FollowUpTab>(initialTab);
  const [saved, setSaved] = React.useState(initial);
  const [d, setD] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [runs, setRuns] = React.useState(initialRuns);
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);

  function toggle(enabled: boolean) {
    setSaved((s) => ({ ...s, enabled }));
    setD((s) => ({ ...s, enabled }));
    toast(enabled ? "Follow-ups are on." : "Follow-ups are off. Nobody new is followed up; people already in it finish.");
  }

  const stepLabel = (id: string) => {
    const i = saved.steps.findIndex((s) => s.id === id);
    return i < 0 ? "An earlier follow-up" : `Follow-up ${i + 1}`;
  };

  return (
    <div className="space-y-6">
      <DetailHeader
        title="Booking link follow-ups"
        body="When someone gets a booking link and does not use it, EZRA checks in on a short schedule. It stops the moment they book, reply, or ask it to."
        enabled={saved.enabled}
        onToggle={toggle}
        switchLabel="booking link follow-ups"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Follow-ups">
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="people">
            People <span data-numeric className="ml-1.5 font-mono text-xs text-ink-muted">{runs.filter((r) => r.state === "waiting").length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-6 focus-visible:outline-none">
          <Results results={results} bookings={bookings} steps={saved.steps} stepLabel={stepLabel} />
        </TabsContent>

        <TabsContent value="setup" className="mt-6 focus-visible:outline-none">
          <Setup d={d} setD={setD} templates={templates} businessName={businessName} />
          <SaveBar
            dirty={dirty}
            saving={saving}
            note="Changes apply to links sent from now on."
            onDiscard={() => setD(saved)}
            onSave={() => {
              const problem = validate(d);
              if (problem) return toast.error(problem);
              setSaving(true);
              window.setTimeout(() => {
                setSaved(d);
                setSaving(false);
                toast.success("Follow-ups saved.");
              }, 500);
            }}
          />
        </TabsContent>

        <TabsContent value="people" className="mt-6 focus-visible:outline-none">
          <People
            runs={runs}
            total={saved.steps.length}
            onStop={(id) => {
              setRuns((all) => all.map((r) => (r.id === id ? { ...r, state: "opted-out", nextAt: null } : r)));
              toast("Stopped. No more follow-ups go to them.");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function waitedWords(ms: number) {
  const h = ms / 3_600_000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} minutes`;
  if (h < 24) return Math.round(h) === 1 ? "1 hour" : `${Math.round(h)} hours`;
  const d = Math.round(h / 24);
  return d === 1 ? "1 day" : `${d} days`;
}

function validate(d: FollowUpSettings): string | null {
  if (d.steps.length === 0) return "Add at least one follow-up, or turn follow-ups off instead.";
  for (let i = 0; i < d.steps.length; i++) {
    const s = d.steps[i]!;
    if (s.channel === "sms") {
      if (!s.body.trim()) return `Follow-up ${i + 1} has no message.`;
      if (!s.body.includes("{booking_link}")) return `Follow-up ${i + 1} needs the booking link, or there is nothing to tap.`;
    } else if (!s.emailTemplateId) return `Pick an email for follow-up ${i + 1}.`;
    if (i > 0 && s.afterHours <= d.steps[i - 1]!.afterHours) return `Follow-up ${i + 1} has to go out later than follow-up ${i}.`;
  }
  return null;
}

/* =============================================================== results */

function Results({
  results: r,
  bookings,
  steps,
  stepLabel,
}: {
  results: FollowUpResults;
  bookings: FollowUpBooking[];
  steps: FollowUpStep[];
  stepLabel: (id: string) => string;
}) {
  const maxBooked = Math.max(...r.byStep.map((s) => s.booked), 1);
  return (
    <div className="space-y-6">
      <div>
        <StatStrip>
          <Stat label="Booked after a follow-up" value={fmt.count(r.booked)} delta={{ current: r.booked, previous: r.bookedPrev }} />
          <Stat label="What those visits are worth" value={fmt.money(r.bookedValueCents)} note="booked value" />
          <Stat label="Tapped the link again" value={fmt.count(r.tapped)} note={fmt.percent(r.tapped / r.started)} />
          <Stat label="Asked to stop" value={fmt.count(r.optedOut)} note={fmt.percent(r.optedOut / r.started)} />
        </StatStrip>
        <p className="mt-2 text-xs text-ink-muted">
          The last 30 days. A booking counts once, against the follow-up they tapped last, and only if they booked within 7 days of it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>From follow-up to booking</CardTitle>
              <CardDescription>Everyone who got at least one follow-up.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Funnel
              steps={[
                { label: "Got a follow-up", value: r.started },
                { label: "Tapped the booking link", value: r.tapped },
                { label: "Booked", value: r.booked },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Which follow-up gets the booking</CardTitle>
              <CardDescription>Fewer people reach the later ones, because many have booked by then.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <table className="w-full text-sm">
              <caption className="sr-only">Bookings by follow-up</caption>
              <thead>
                <tr className="border-y border-rule bg-sunken text-2xs text-ink-muted">
                  <th scope="col" className="px-5 py-2 text-left font-medium">Follow-up</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Sent</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Booked</th>
                  <th scope="col" className="w-[34%] px-5 py-2 text-left font-medium">
                    <span className="sr-only">Share of bookings</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {r.byStep.map((s) => {
                  const step = steps.find((x) => x.id === s.stepId);
                  const SIcon = step ? CHANNEL[step.channel].icon : EnvelopeSimpleIcon;
                  return (
                    <tr key={s.stepId} className="border-b border-rule last:border-b-0">
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <span className="block font-medium text-ink">{stepLabel(s.stepId)}</span>
                        {step ? (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                            <SIcon aria-hidden className="size-3.5" />
                            {CHANNEL[step.channel].label}, {after(step.afterHours)} after the link
                          </span>
                        ) : null}
                      </th>
                      <td data-numeric className="px-3 py-3 text-right font-mono text-ink-muted">
                        {fmt.count(s.sent)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span data-numeric className="font-mono font-semibold text-ink">{fmt.count(s.booked)}</span>
                        <span data-numeric className="block font-mono text-2xs text-ink-muted">{fmt.percent(s.booked / s.sent)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span aria-hidden className="block h-2.5 overflow-hidden rounded-full bg-sunken">
                          <span className="block h-full rounded-full" style={{ width: `${(s.booked / maxBooked) * 100}%`, background: "var(--color-series-1)" }} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Day by day</CardTitle>
            <CardDescription>People followed up each day over the last two weeks, and how many of them booked.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ConversionChart
            data={r.daily}
            convertedLabel="Booked"
            restLabel="Followed up, not booked yet"
            caption="Follow-ups and bookings, by day"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Booked through a follow-up</CardTitle>
            <CardDescription>The latest people who came back and booked.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <ul>
            {bookings.map((b) => {
              const waited = new Date(b.bookedAt).getTime() - new Date(b.linkSentAt).getTime();
              return (
                <li key={b.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule px-5 py-3.5">
                  <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-wash text-success">
                    <CalendarCheckIcon className="size-4.5" weight="fill" />
                  </span>
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-medium text-ink">{b.name}</p>
                    <p className="text-xs text-ink-muted">
                      {b.service}, booked <span data-numeric className="font-mono">{fmt.relative(b.bookedAt, NOW)}</span>
                    </p>
                  </div>
                  <p className="w-72 text-xs text-ink-muted">
                    After <span className="font-medium text-ink">{stepLabel(b.stepId).toLowerCase()}</span>,{" "}
                    <span data-numeric className="font-mono">{waitedWords(waited)}</span> after the link
                  </p>
                  <p data-numeric className="w-20 text-right font-mono text-sm font-semibold text-ink">
                    {fmt.money(b.valueCents)}
                  </p>
                  <CommsButton action="call" to={b.e164} label={`Call ${b.name}`} iconOnly variant="quiet" />
                </li>
              );
            })}
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
  d: FollowUpSettings;
  setD: React.Dispatch<React.SetStateAction<FollowUpSettings>>;
  templates: EmailTemplate[];
  businessName: string;
}) {
  const [selected, setSelected] = React.useState<string | null>(d.steps[0]?.id ?? null);
  const [emailOpen, setEmailOpen] = React.useState<EmailTemplate | null>(null);
  const setStep = (id: string, patch: Partial<FollowUpStep>) =>
    setD((x) => ({ ...x, steps: x.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const tplOf = (id: string | null) => templates.find((t) => t.id === id) ?? null;

  function add() {
    const last = d.steps[d.steps.length - 1]?.afterHours ?? 0;
    const id = `fu_${Date.now().toString(36)}`;
    setD((x) => ({
      ...x,
      steps: [
        ...x.steps,
        {
          id,
          afterHours: DELAYS.find((h) => h > last) ?? 168,
          channel: "sms",
          body: "Hi {first_name}, just checking in from {business}. Your link is still here when you're ready: {booking_link}",
          emailTemplateId: null,
        },
      ],
    }));
    setSelected(id);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <Panel title="The sequence" body="Each message is timed from when the booking link was sent. Select one to change it.">
          <ol className="relative">
            <span aria-hidden className="absolute bottom-6 left-[1.1875rem] top-6 w-px bg-rule" />
            <TimelineNode icon={LinkIcon} title="Booking link sent" body="By your agent, in a call or a chat. Nobody is followed up twice for the same link." />
            {d.steps.map((s, i) => {
              const open = selected === s.id;
              const SIcon = CHANNEL[s.channel].icon;
              const tpl = tplOf(s.emailTemplateId);
              return (
                <li key={s.id} className="relative pb-3 pl-14">
                  <span
                    aria-hidden
                    data-numeric
                    className={cn(
                      "absolute left-0 top-3 flex size-10 items-center justify-center rounded-full border font-mono text-sm font-semibold transition-colors",
                      open ? "border-primary bg-primary text-on-primary" : "border-rule-control bg-surface text-ink",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className={cn("rounded-xl border transition-colors", open ? "border-primary/40 bg-canvas" : "border-rule hover:border-rule-control")}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setSelected(open ? null : s.id)}
                      className="flex w-full cursor-pointer items-start gap-3 rounded-xl px-4 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-ink">
                          {after(s.afterHours)} after the link
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted">
                            <SIcon aria-hidden className="size-3.5" />
                            {CHANNEL[s.channel].label}
                          </span>
                        </span>
                        {!open ? (
                          <span className="mt-0.5 block truncate text-xs text-ink-muted">
                            {s.channel === "sms" ? fill(s.body) : tpl ? `${tpl.name}: ${fill(tpl.subject)}` : "No email picked yet"}
                          </span>
                        ) : null}
                      </span>
                      <PencilSimpleIcon aria-hidden className={cn("mt-0.5 size-4 shrink-0", open ? "text-primary" : "text-ink-muted")} />
                    </button>
                    {open ? (
                      <StepEditor
                        index={i}
                        step={s}
                        templates={templates}
                        onChange={(p) => setStep(s.id, p)}
                        onPreview={(t) => setEmailOpen(t)}
                        onRemove={() => {
                          setD((x) => ({ ...x, steps: x.steps.filter((y) => y.id !== s.id) }));
                          setSelected(null);
                        }}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
            {d.steps.length < MAX_STEPS ? (
              <li className="relative pb-3 pl-14">
                <span aria-hidden className="absolute left-0 top-1 flex size-10 items-center justify-center rounded-full border border-dashed border-rule-control bg-surface text-ink-muted">
                  <PlusIcon className="size-4" />
                </span>
                <Button variant="secondary" size="sm" className="mt-1.5 border-dashed" onClick={add}>
                  Add a follow-up
                </Button>
              </li>
            ) : null}
            <TimelineNode icon={CalendarCheckIcon} end title="They book, and it stops" body="Any booking stops the sequence, whether it came from the link, a call, or the front desk." />
          </ol>
        </Panel>

        <Panel title="When to stop early" body="Booking and replying STOP always end it. These are up to you.">
          <Rule id="fu-booked" label="They book" checked locked />
          <Rule id="fu-stop" label="They reply STOP" hint="Added to every text. They never get another text from you." checked locked />
          <Rule
            id="fu-replied"
            label="They reply with anything else"
            hint="Your agent picks up the conversation instead, so they never get a scheduled nudge mid-chat."
            checked={d.stopWhenReplied}
            onChange={(stopWhenReplied) => setD((x) => ({ ...x, stopWhenReplied }))}
          />
          <Rule id="fu-called" label="They call you" checked={d.stopWhenCalled} onChange={(stopWhenCalled) => setD((x) => ({ ...x, stopWhenCalled }))} />
          <div className="border-t border-rule pt-5">
            <Rule
              id="fu-quiet"
              label="Hold texts overnight"
              hint="Anything due between 8pm and 8am in their time zone waits until 8am."
              checked={d.quietHours}
              onChange={(quietHours) => setD((x) => ({ ...x, quietHours }))}
            />
          </div>
        </Panel>
      </div>

      {/* The whole thread, as Marisol would see it. */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="text-sm font-medium text-ink">What they receive</p>
        <p className="mb-3 mt-0.5 text-xs text-ink-muted">Marisol asked about a cleaning and got a link at 9:12am.</p>
        <PhoneThread>
          <ThreadTime>Today 9:12am</ThreadTime>
          <Bubble text="Here's your link to book a cleaning: ezra.to/b/k7Qm2" />
          {d.steps.map((s) => {
            const tpl = tplOf(s.emailTemplateId);
            return (
              <React.Fragment key={s.id}>
                <ThreadTime>{after(s.afterHours)} later</ThreadTime>
                {s.channel === "sms" ? (
                  <Bubble text={fill(s.body)} optOut active={selected === s.id} />
                ) : (
                  <button
                    type="button"
                    disabled={!tpl}
                    onClick={() => tpl && setEmailOpen(tpl)}
                    className={cn(
                      "flex w-[85%] cursor-pointer items-start gap-2.5 rounded-2xl border border-rule bg-canvas px-3.5 py-2.5 text-left transition-colors hover:border-rule-control disabled:cursor-default",
                      selected === s.id && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
                    )}
                  >
                    <EnvelopeSimpleIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                    <span className="min-w-0">
                      <span className="block text-2xs text-ink-muted">Email to marisol.vega@gmail.com</span>
                      <span className="block truncate text-sm font-medium text-ink">{tpl ? fill(tpl.subject) : "No email picked"}</span>
                      {tpl ? <span className="block text-xs text-primary">Open the email</span> : null}
                    </span>
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </PhoneThread>
      </div>

      <Dialog open={!!emailOpen} onOpenChange={(o) => !o && setEmailOpen(null)}>
        {emailOpen ? (
          <DialogContent title={emailOpen.name} description="As it lands in their inbox." className="max-w-2xl">
            <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-rule">
              <InboxHeader businessName={businessName} subject={emailOpen.subject} preheader={emailOpen.preheader} />
              <EmailRender template={emailOpen} businessName={businessName} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button asChild variant="secondary" size="sm">
                <Link href={`/automations/emails/${emailOpen.id}` as Route}>Edit this email</Link>
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function TimelineNode({ icon: NIcon, title, body, end }: { icon: React.ElementType; title: string; body: string; end?: boolean }) {
  return (
    <li className={cn("relative pl-14", end ? "pt-1" : "pb-4")}>
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 flex size-10 items-center justify-center rounded-full",
          end ? "bg-success-wash text-success" : "bg-panel text-ink",
        )}
      >
        <NIcon className="size-4.5" weight={end ? "fill" : "regular"} />
      </span>
      <p className="pt-0.5 text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs leading-relaxed text-ink-muted">{body}</p>
    </li>
  );
}

function StepEditor({
  index,
  step: s,
  templates,
  onChange,
  onPreview,
  onRemove,
}: {
  index: number;
  step: FollowUpStep;
  templates: EmailTemplate[];
  onChange: (p: Partial<FollowUpStep>) => void;
  onPreview: (t: EmailTemplate) => void;
  onRemove: () => void;
}) {
  const { ref, insert } = useInsert<HTMLTextAreaElement>(s.body, (body) => onChange({ body }));
  const base = `fu-${s.id}`;
  const parts = smsParts(s.body);
  const followUps = templates.filter((t) => t.purpose === "follow-up");
  const others = templates.filter((t) => t.purpose !== "follow-up");
  const tpl = templates.find((t) => t.id === s.emailTemplateId);

  return (
    <div className="space-y-4 border-t border-rule px-4 pb-4 pt-4">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Send it" htmlFor={`${base}-after`} className="w-64">
          <Select value={String(s.afterHours)} onChange={(e) => onChange({ afterHours: Number(e.target.value) })}>
            {DELAYS.map((h) => (
              <option key={h} value={h}>
                {after(h)} after the link
              </option>
            ))}
          </Select>
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">By</p>
          <ChannelToggle
            label={`Send follow-up ${index + 1} by`}
            value={[s.channel]}
            onChange={(c) =>
              onChange({ channel: c[0]!, emailTemplateId: c[0] === "email" ? s.emailTemplateId ?? followUps[0]?.id ?? null : s.emailTemplateId })
            }
          />
        </div>
      </div>

      {s.channel === "sms" ? (
        <>
          <Field label="Message" htmlFor={`${base}-body`}>
            <Textarea ref={ref} value={s.body} onChange={(e) => onChange({ body: e.target.value })} className="min-h-24" />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <VarChips onInsert={insert} keys={["first_name", "business", "service", "booking_link", "business_phone"]} />
            <p data-numeric className="font-mono text-2xs text-ink-muted">
              {parts.chars} chars, {parts.parts === 1 ? "1 text" : `${parts.parts} texts`}
            </p>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <Field label="Email" htmlFor={`${base}-tpl`} hint="Emails are written in the template editor, in your own colours.">
            <Select value={s.emailTemplateId ?? ""} onChange={(e) => onChange({ emailTemplateId: e.target.value || null })}>
              <option value="" disabled>
                Pick an email
              </option>
              <optgroup label="Follow-up emails">
                {followUps.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other emails">
                {others.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2">
            {tpl ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => onPreview(tpl)}>
                  <EnvelopeSimpleIcon aria-hidden />
                  Preview
                </Button>
                <Button asChild variant="quiet" size="sm">
                  <Link href={`/automations/emails/${tpl.id}` as Route}>Edit this email</Link>
                </Button>
              </>
            ) : null}
            <Button asChild variant="quiet" size="sm">
              <Link href={"/automations/emails/new?purpose=follow-up" as Route}>
                <PlusIcon aria-hidden />
                New email
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-rule pt-3">
        <Button variant="quiet" size="sm" onClick={onRemove}>
          <TrashIcon aria-hidden />
          Remove follow-up {index + 1}
        </Button>
      </div>
    </div>
  );
}

/* ================================================================ people */

const RUN_STATE: Record<FollowUpRun["state"], { label: string; tone: BadgeProps["tone"] }> = {
  waiting: { label: "Waiting", tone: "neutral" },
  booked: { label: "Booked", tone: "success" },
  replied: { label: "Replied, agent took over", tone: "primary" },
  "opted-out": { label: "Stopped", tone: "warning" },
};

function People({ runs, total, onStop }: { runs: FollowUpRun[]; total: number; onStop: (id: string) => void }) {
  const [filter, setFilter] = React.useState<"all" | FollowUpRun["state"]>("all");
  const shown = filter === "all" ? runs : runs.filter((r) => r.state === filter);
  const count = (s: FollowUpRun["state"]) => runs.filter((r) => r.state === s).length;
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h3 className="font-display text-base font-semibold text-ink">Who is in it</h3>
          <p className="text-sm text-ink-muted">Everyone who got a booking link in the last week.</p>
        </div>
        <FilterPills
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { key: "all", label: "All", count: runs.length },
            { key: "waiting", label: "Waiting", count: count("waiting") },
            { key: "booked", label: "Booked", count: count("booked") },
            { key: "replied", label: "Replied", count: count("replied") },
            { key: "opted-out", label: "Stopped", count: count("opted-out") },
          ]}
        />
      </div>
      {shown.length === 0 ? (
        <p className="border-t border-rule px-5 py-10 text-center text-sm text-ink-muted">Nobody here right now.</p>
      ) : (
        <ul>
          {shown.map((r) => {
            const st = RUN_STATE[r.state];
            const who = r.name ?? fmt.phone(r.e164);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule px-5 py-3.5">
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
                <div className="w-44 text-xs text-ink-muted">
                  {r.state === "waiting" && r.nextAt ? (
                    <>
                      Next one <span data-numeric className="font-mono text-ink">{fmt.relative(r.nextAt, NOW)}</span>
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
      )}
    </Card>
  );
}
