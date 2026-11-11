"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  EnvelopeOpenIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  PlusIcon,
  WarningCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Select, Switch, Textarea } from "@/components/ui/field";
import { Badge, type BadgeProps } from "@/components/ui/status";
import type { EmailTemplate, MessageChannel, MessageTemplate, SentMessage } from "@/lib/api/types";
import { NO_EMAIL, PURPOSE_LINE, TIMING } from "@/lib/messages";
import { NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmailRender, InboxHeader } from "./email-render";
import { Bubble, CHANNEL, DetailHeader, Panel, PhoneThread, SaveBar, ThreadTime, VarChips, fill, smsParts, useInsert } from "./shared";

/**
 * General: the everyday messages that follow a conversation. The booking
 * confirmation, the booking link, the missed-call text back, the reminder.
 *
 * The list says what each one is doing. Changing one happens on its own
 * screen, with the real preview beside it, never in an editor that opens
 * inside the list.
 */

const STATUS: Record<SentMessage["status"], { label: string; tone: BadgeProps["tone"]; icon: Icon }> = {
  delivered: { label: "Delivered", tone: "success", icon: CheckCircleIcon },
  opened: { label: "Opened", tone: "primary", icon: EnvelopeOpenIcon },
  queued: { label: "Scheduled", tone: "neutral", icon: ClockCountdownIcon },
  failed: { label: "Not delivered", tone: "danger", icon: WarningCircleIcon },
};

const SMS_KEYS = ["first_name", "business", "booking_time", "location", "booking_link", "business_phone"];

/* ------------------------------------------------------------------ list */

export function GeneralList({
  templates: initial,
  sent,
  emailNames,
}: {
  templates: MessageTemplate[];
  sent: SentMessage[];
  emailNames: Record<string, string>;
}) {
  const [templates, setTemplates] = React.useState(initial);
  const sent30d = templates.reduce((n, t) => n + t.sent30d, 0);
  const failed = sent.filter((m) => m.status === "failed").length;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">General</h2>
        <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
          The texts and emails that follow a conversation. Every agent uses the same ones.{" "}
          <span data-numeric className="font-mono text-ink">
            {fmt.count(sent30d)}
          </span>{" "}
          sent in the last 30 days
          {failed > 0 ? <span className="text-danger">, {fmt.count(failed)} not delivered today</span> : null}.
        </p>
      </div>

      <ul className="divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface">
        {templates.map((t) => {
          const switchId = `gen-${t.id}`;
          const href = `/automations/general/${t.id}` as Route;
          return (
            <li key={t.id} className="flex flex-wrap items-start gap-x-5 gap-y-3 px-5 py-5 sm:px-6">
              <Switch
                id={switchId}
                aria-label={`${t.name}, ${t.enabled ? "on" : "off"}`}
                checked={t.enabled}
                onCheckedChange={(v) => {
                  setTemplates((all) => all.map((x) => (x.id === t.id ? { ...x, enabled: v } : x)));
                  toast.success(v ? `${t.name} is on.` : `${t.name} is off.`);
                }}
                className="mt-1"
              />
              <div className="min-w-0 grow basis-72">
                <Link href={href} className="font-medium text-ink hover:underline">
                  {t.name}
                </Link>
                <p className="mt-0.5 text-sm text-ink-muted">{t.when}</p>
                <p className={cn("mt-3 max-w-[68ch] rounded-xl bg-panel px-3.5 py-2.5 text-sm leading-relaxed [overflow-wrap:anywhere]", t.enabled ? "text-ink" : "text-ink-muted")}>
                  {fill(t.body)}
                </p>
                <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                  {t.channels.map((c) => {
                    const CIcon = CHANNEL[c].icon;
                    return (
                      <span key={c} className="inline-flex items-center gap-1.5">
                        <CIcon aria-hidden className="size-3.5" />
                        {c === "email" && t.emailTemplateId ? `Email: ${emailNames[t.emailTemplateId] ?? "a template"}` : CHANNEL[c].label}
                      </span>
                    );
                  })}
                  {t.sent30d > 0 ? (
                    <span>
                      <span data-numeric className="font-mono text-ink">
                        {fmt.count(t.sent30d)}
                      </span>{" "}
                      sent in 30 days
                    </span>
                  ) : null}
                </p>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href={href}>
                  <PencilSimpleIcon aria-hidden />
                  Edit
                  <span className="sr-only"> {t.name}</span>
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>

      <SentLog sent={sent} names={Object.fromEntries(templates.map((t) => [t.key, t.name]))} />
    </div>
  );
}

function SentLog({ sent, names }: { sent: SentMessage[]; names: Record<string, string> }) {
  return (
    <section aria-labelledby="sent-today">
      <h3 id="sent-today" className="font-display text-lg font-semibold text-ink">
        Sent today
      </h3>
      <p className="mt-0.5 text-sm text-ink-muted">Anything that could not be delivered says why, in words.</p>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-rule bg-surface">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-rule bg-sunken text-2xs text-ink-muted">
              <th scope="col" className="px-5 py-2.5 text-left font-medium">What</th>
              <th scope="col" className="px-5 py-2.5 text-left font-medium">To</th>
              <th scope="col" className="px-5 py-2.5 text-left font-medium">Status</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Sent</th>
            </tr>
          </thead>
          <tbody>
            {sent.map((m) => {
              const st = STATUS[m.status];
              const StatusIcon = st.icon;
              const ChannelIcon = CHANNEL[m.channel].icon;
              return (
                <tr key={m.id} className="border-b border-rule align-top last:border-b-0">
                  <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                    <span className="inline-flex items-center gap-1.5">
                      <ChannelIcon className="size-4 text-ink-faint" aria-label={CHANNEL[m.channel].label} />
                      {names[m.templateKey] ?? m.templateKey}
                    </span>
                  </th>
                  <td className={cn("px-5 py-3 text-ink-muted", m.channel === "sms" && "font-mono")}>{m.to}</td>
                  <td className="px-5 py-3">
                    <Badge tone={st.tone}>
                      <StatusIcon className="size-3" aria-hidden />
                      {st.label}
                    </Badge>
                    {m.failure ? <p className="mt-1 max-w-[32ch] text-xs leading-relaxed text-ink-muted">{m.failure}</p> : null}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-ink-muted">{fmt.relative(m.sentAt, NOW)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- editor */

export function MessageEditor({
  initial,
  emailTemplates,
  sent,
  businessName,
}: {
  initial: MessageTemplate;
  emailTemplates: EmailTemplate[];
  sent: SentMessage[];
  businessName: string;
}) {
  const [saved, setSaved] = React.useState(initial);
  const [m, setM] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [view, setView] = React.useState<MessageChannel>(initial.channels[0] ?? "sms");
  const dirty = JSON.stringify(m) !== JSON.stringify(saved);
  const body = useInsert<HTMLTextAreaElement>(m.body, (v) => setM((x) => ({ ...x, body: v })));
  const parts = smsParts(m.body);
  const timing = TIMING[m.key] ?? [m.when];
  const noEmail = NO_EMAIL[m.key];
  const hasSms = m.channels.includes("sms");
  const hasEmail = m.channels.includes("email");
  const tpl = emailTemplates.find((t) => t.id === m.emailTemplateId);
  const suited = emailTemplates.filter((t) => t.purpose === "booking" || t.purpose === "general");
  const others = emailTemplates.filter((t) => !suited.includes(t));
  const shown: MessageChannel = m.channels.includes(view) ? view : (m.channels[0] ?? "sms");

  function setChannel(c: MessageChannel, on: boolean) {
    const channels = on ? [...m.channels.filter((x) => x !== c), c] : m.channels.filter((x) => x !== c);
    if (channels.length === 0) return toast.error("Keep one way to send it, or turn the message off at the top.");
    setM((x) => ({
      ...x,
      channels,
      emailTemplateId: c === "email" && on ? x.emailTemplateId ?? suited[0]?.id ?? null : x.emailTemplateId,
    }));
    if (on) setView(c);
  }

  function save() {
    if (hasSms && !m.body.trim()) return toast.error("Write the text, or turn texts off.");
    if (hasEmail && !tpl) return toast.error("Pick the email it sends, or turn email off.");
    setSaving(true);
    window.setTimeout(() => {
      setSaved(m);
      setSaving(false);
      toast.success(`${m.name} saved.`);
    }, 450);
  }

  return (
    <div className="space-y-8">
      <DetailHeader
        back={{ href: "/automations/general", label: "General" }}
        title={m.name}
        body={PURPOSE_LINE[m.key] ?? m.when}
        enabled={m.enabled}
        onToggle={(enabled) => setM((x) => ({ ...x, enabled }))}
        switchLabel={m.name}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className={cn("min-w-0 space-y-6", !m.enabled && "opacity-70")}>
          <Panel title="When it sends">
            <Field label="Send it" htmlFor="gen-when" className="max-w-md">
              <Select value={m.when} onChange={(e) => setM((x) => ({ ...x, when: e.target.value }))}>
                {timing.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </Field>
          </Panel>

          <Panel title="Text message" body="Short and plain. Replies come back to your inbox in Conversations.">
            <ChannelSwitch id="gen-sms" label="Send a text" checked={hasSms} onChange={(v) => setChannel("sms", v)} />
            {hasSms ? (
              <div className="space-y-2">
                <Field label="Message" htmlFor="gen-body">
                  <Textarea ref={body.ref} value={m.body} onChange={(e) => setM((x) => ({ ...x, body: e.target.value }))} className="min-h-28" onFocus={() => setView("sms")} />
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <VarChips onInsert={body.insert} keys={SMS_KEYS} />
                  <p data-numeric className={cn("font-mono text-2xs", parts.parts > 1 ? "text-warning" : "text-ink-muted")}>
                    {parts.chars} chars, {parts.parts === 1 ? "1 text" : `${parts.parts} texts`}
                  </p>
                </div>
              </div>
            ) : null}
          </Panel>

          <Panel title="Email" body="Emails are designed in the template editor, in your own colours, so they match everything else you send.">
            <ChannelSwitch
              id="gen-email"
              label="Send an email"
              checked={hasEmail}
              disabled={!!noEmail && !hasEmail}
              hint={noEmail && !hasEmail ? noEmail : undefined}
              onChange={(v) => setChannel("email", v)}
            />
            {hasEmail ? (
              <div className="space-y-3">
                <Field label="Email it sends" htmlFor="gen-tpl">
                  <Select value={m.emailTemplateId ?? ""} onChange={(e) => setM((x) => ({ ...x, emailTemplateId: e.target.value || null }))} onFocus={() => setView("email")}>
                    <option value="" disabled>
                      Pick an email
                    </option>
                    <optgroup label="Booking and general emails">
                      {suited.map((t) => (
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
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/automations/emails/${tpl.id}` as Route}>
                        <PencilSimpleIcon aria-hidden />
                        Edit this email
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="quiet" size="sm">
                    <Link href={"/automations/emails/new?purpose=booking" as Route}>
                      <PlusIcon aria-hidden />
                      New email
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </Panel>

          <RecentSends sent={sent} />
        </div>

        {/* ------------------------------------------------------ preview */}
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink">What Marisol receives</p>
            {m.channels.length > 1 ? (
              <div role="group" aria-label="Preview" className="flex rounded-full bg-panel p-0.5">
                {m.channels.map((c) => {
                  const CIcon = CHANNEL[c].icon;
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={shown === c}
                      onClick={() => setView(c)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        shown === c ? "bg-surface text-ink shadow-[0_1px_3px_rgb(10_10_10/0.12)]" : "text-ink-muted hover:text-ink",
                      )}
                    >
                      <CIcon aria-hidden className="size-3.5" />
                      {CHANNEL[c].label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          {shown === "sms" ? (
            <PhoneThread>
              <ThreadTime>Today 4:21pm</ThreadTime>
              <Bubble text={fill(m.body)} />
            </PhoneThread>
          ) : tpl ? (
            <div className="overflow-hidden rounded-2xl border border-rule shadow-raised">
              <InboxHeader businessName={businessName} subject={tpl.subject} preheader={tpl.preheader} fromName={tpl.fromName} />
              <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto">
                <EmailRender template={tpl} businessName={businessName} width="mobile" />
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-rule-control px-6 py-14 text-center text-sm text-ink-muted">Pick an email to see it here.</p>
          )}
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => toast.success(`Sent a test to your own ${shown === "sms" ? "phone" : "inbox"}.`)}>
            <PaperPlaneTiltIcon aria-hidden />
            Send me a test
          </Button>
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} note="Changes apply to every agent." onDiscard={() => setM(saved)} onSave={save} />
    </div>
  );
}

function ChannelSwitch({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} className="mt-0.5" />
      <label htmlFor={id} className={cn("min-w-0", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <span className={cn("block text-sm font-medium", disabled ? "text-ink-muted" : "text-ink")}>{label}</span>
        {hint ? <span className="mt-0.5 block max-w-[56ch] text-xs leading-relaxed text-ink-muted">{hint}</span> : null}
      </label>
    </div>
  );
}

function RecentSends({ sent }: { sent: SentMessage[] }) {
  return (
    <Panel title="Sent today" body={sent.length ? undefined : "Nothing sent yet today."}>
      {sent.length ? (
        <ul className="-mt-2 divide-y divide-rule">
          {sent.map((s) => {
            const st = STATUS[s.status];
            const CIcon = CHANNEL[s.channel].icon;
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <CIcon aria-label={CHANNEL[s.channel].label} className="size-4 text-ink-faint" />
                <span data-numeric={s.channel === "sms" || undefined} className={cn("min-w-0 truncate text-ink", s.channel === "sms" && "font-mono")}>
                  {s.to}
                </span>
                <Badge tone={st.tone}>{st.label}</Badge>
                <span data-numeric className="ml-auto font-mono text-xs text-ink-muted">
                  {fmt.relative(s.sentAt, NOW)}
                </span>
                {s.failure ? <p className="w-full text-xs text-ink-muted">{s.failure}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      <Link href={"/conversations" as Route} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:underline">
        See replies in Conversations
        <ArrowRightIcon aria-hidden className="size-4" />
      </Link>
    </Panel>
  );
}
