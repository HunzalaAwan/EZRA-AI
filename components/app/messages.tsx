"use client";

import * as React from "react";
import {
  ChatTextIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  PaperPlaneTiltIcon,
  WarningCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, Input, Switch, Textarea } from "@/components/ui/field";
import { Badge, type BadgeProps } from "@/components/ui/status";
import type {
  FollowUpRun,
  FollowUpSettings,
  Member,
  MessageChannel,
  MessageTemplate,
  ReviewRun,
  ReviewSettings,
  SentMessage,
  TeamAlert,
} from "@/lib/api/types";
import { Automations } from "./automations";
import { NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Messages: everything EZRA sends that is not the conversation itself.
 *
 * Two audiences, kept apart because they answer different questions.
 *
 *   To your customers. The texts and emails that follow a call: the booking
 *   confirmation, the booking link, the missed-call text back, the reminder.
 *   Each is a switch and a template. The template is edited in place with the
 *   real preview beside it, because a placeholder like {first_name} is
 *   meaningless until you see it filled in. Variables are inserted as chips so
 *   nobody has to remember the spelling.
 *
 *   To your team. Alerts when something needs a person, and the morning and
 *   weekly summaries, each with who receives it and how.
 *
 * The sent log closes the page, with failures written as what went wrong
 * ("that number is a landline") rather than a carrier error code.
 */

const VARIABLES: { key: string; sample: string }[] = [
  { key: "first_name", sample: "Marisol" },
  { key: "business", sample: "Alder Creek Dental" },
  { key: "booking_time", sample: "Thursday at 9:40am" },
  { key: "location", sample: "our Bend office" },
  { key: "booking_link", sample: "ezra.to/b/k7Qm2" },
  { key: "business_phone", sample: "(541) 388-2014" },
  { key: "callback_window", sample: "before noon tomorrow" },
  { key: "call_date", sample: "Monday" },
];

function fill(text: string) {
  return VARIABLES.reduce(
    (t, v) => t.replaceAll(`{${v.key}}`, v.sample),
    text,
  );
}

/**
 * One text holds 160 characters. Past that the carrier splits it, and each
 * part loses 7 characters to the header that stitches them back together, so
 * a long message is billed in 153-character parts.
 */
function segments(text: string) {
  const n = fill(text).length;
  return n <= 160 ? 1 : Math.ceil(n / 153);
}

const CHANNEL: Record<MessageChannel, { label: string; icon: Icon }> = {
  sms: { label: "Text", icon: ChatTextIcon },
  email: { label: "Email", icon: EnvelopeIcon },
};

const STATUS: Record<
  SentMessage["status"],
  { label: string; tone: BadgeProps["tone"]; icon: Icon }
> = {
  delivered: { label: "Delivered", tone: "success", icon: CheckCircleIcon },
  opened: { label: "Opened", tone: "primary", icon: EnvelopeOpenIcon },
  queued: { label: "Scheduled", tone: "neutral", icon: ClockCountdownIcon },
  failed: { label: "Not delivered", tone: "danger", icon: WarningCircleIcon },
};

export function Messages({
  templates: initialTemplates,
  alerts: initialAlerts,
  sent,
  members,
  followUps,
  reviews,
  followUpRuns,
  reviewRuns,
}: {
  templates: MessageTemplate[];
  alerts: TeamAlert[];
  sent: SentMessage[];
  members: Member[];
  followUps: FollowUpSettings;
  reviews: ReviewSettings;
  followUpRuns: FollowUpRun[];
  reviewRuns: ReviewRun[];
}) {
  const [templates, setTemplates] = React.useState(initialTemplates);
  const [alerts, setAlerts] = React.useState(initialAlerts);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draftBody, setDraftBody] = React.useState("");
  const [draftSubject, setDraftSubject] = React.useState("");
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  const nameOf = (key: MessageTemplate["key"]) =>
    templates.find((t) => t.key === key)?.name ?? key;
  const memberName = (id: string) =>
    members
      .find((m) => m.id === id)
      ?.name.replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/, "")
      .split(" ")[0] ?? id;

  function startEdit(t: MessageTemplate) {
    setEditing(t.id);
    setDraftBody(t.body);
    setDraftSubject(t.subject ?? "");
  }

  function insertVariable(key: string) {
    const el = bodyRef.current;
    const token = `{${key}}`;
    if (!el) {
      setDraftBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? draftBody.length;
    const end = el.selectionEnd ?? draftBody.length;
    const next = draftBody.slice(0, start) + token + draftBody.slice(end);
    setDraftBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function toggleChannel(t: MessageTemplate, c: MessageChannel) {
    setTemplates((all) =>
      all.map((x) => {
        if (x.id !== t.id) return x;
        const has = x.channels.includes(c);
        const channels = has ? x.channels.filter((y) => y !== c) : [...x.channels, c];
        return channels.length === 0 ? x : { ...x, channels };
      }),
    );
  }

  const sent30d = templates.reduce((n, t) => n + t.sent30d, 0);
  const failed = sent.filter((m) => m.status === "failed").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="max-w-[62ch] text-base leading-relaxed text-ink-muted">
          The texts and emails that go out after a conversation, and what your
          team hears about. Everything here is in plain words: edit it the way
          you would say it.
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          <span data-numeric className="font-mono text-ink">
            {fmt.count(sent30d)}
          </span>{" "}
          sent to customers in the last 30 days.
          {failed > 0 ? (
            <span className="text-danger">
              {" "}
              {fmt.count(failed)} could not be delivered today.
            </span>
          ) : null}
        </p>
      </div>

      {/* Automations: follow-ups on unused booking links, and review requests */}
      <Automations
        followUps={followUps}
        reviews={reviews}
        followUpRuns={followUpRuns}
        reviewRuns={reviewRuns}
      />

      {/* To customers */}
      <section aria-labelledby="to-customers">
        <h3 id="to-customers" className="font-display text-lg font-semibold text-ink">
          To your customers
        </h3>
        <p className="mt-0.5 max-w-[62ch] text-sm text-ink-muted">
          Sent automatically after the conversation. Every agent uses the same
          ones.
        </p>

        <Card className="mt-3">
          <CardContent className="p-0">
            <ul>
              {templates.map((t) => {
                const open = editing === t.id;
                const switchId = `tpl-${t.id}`;
                return (
                  <li key={t.id} className="border-b border-rule px-5 py-4 last:border-b-0">
                    <div className="flex flex-wrap items-start gap-4">
                      <Switch
                        id={switchId}
                        checked={t.enabled}
                        onCheckedChange={(v) => {
                          setTemplates((all) =>
                            all.map((x) => (x.id === t.id ? { ...x, enabled: v } : x)),
                          );
                          toast.success(v ? `${t.name} is on.` : `${t.name} is off.`);
                        }}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <label htmlFor={switchId} className="text-sm font-medium text-ink">
                          {t.name}
                        </label>
                        <p className="mt-0.5 text-xs text-ink-muted">{t.when}</p>
                        {!open ? (
                          <p
                            className={cn(
                              "mt-2 max-w-[70ch] rounded-md border border-rule bg-canvas px-3 py-2 text-xs leading-relaxed",
                              t.enabled ? "text-ink" : "text-ink-muted",
                            )}
                          >
                            {fill(t.body)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex gap-1" role="group" aria-label={`Send ${t.name} by`}>
                          {(["sms", "email"] as const).map((c) => {
                            const on = t.channels.includes(c);
                            const ChannelIcon = CHANNEL[c].icon;
                            return (
                              <button
                                key={c}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggleChannel(t, c)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150",
                                  on
                                    ? "border-primary/40 bg-primary-wash text-primary"
                                    : "border-rule text-ink-muted hover:border-rule-control hover:text-ink",
                                )}
                              >
                                <ChannelIcon className="size-3.5" aria-hidden />
                                {CHANNEL[c].label}
                              </button>
                            );
                          })}
                        </div>
                        {!open ? (
                          <Button variant="secondary" size="sm" onClick={() => startEdit(t)}>
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {t.sent30d > 0 && !open ? (
                      <p className="mt-2 pl-[3.25rem] text-2xs text-ink-faint">
                        <span data-numeric className="font-mono">
                          {fmt.count(t.sent30d)}
                        </span>{" "}
                        sent in the last 30 days
                      </p>
                    ) : null}

                    {open ? (
                      <form
                        className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setTemplates((all) =>
                            all.map((x) =>
                              x.id === t.id
                                ? {
                                    ...x,
                                    body: draftBody,
                                    subject: x.channels.includes("email")
                                      ? draftSubject || x.subject
                                      : x.subject,
                                  }
                                : x,
                            ),
                          );
                          setEditing(null);
                          toast.success(`${t.name} saved.`);
                        }}
                      >
                        <div className="space-y-4">
                          {t.channels.includes("email") ? (
                            <Field label="Email subject" htmlFor={`subj-${t.id}`}>
                              <Input
                                value={draftSubject}
                                onChange={(e) => setDraftSubject(e.target.value)}
                              />
                            </Field>
                          ) : null}
                          <Field
                            label="Message"
                            htmlFor={`body-${t.id}`}
                            hint="Tap a detail below to drop it in where the cursor is."
                          >
                            <Textarea
                              ref={bodyRef}
                              value={draftBody}
                              onChange={(e) => setDraftBody(e.target.value)}
                              className="min-h-32"
                              required
                            />
                          </Field>
                          <div className="flex flex-wrap gap-1.5" aria-label="Details you can insert">
                            {VARIABLES.map((v) => (
                              <button
                                key={v.key}
                                type="button"
                                onClick={() => insertVariable(v.key)}
                                className="rounded-full border border-rule bg-canvas px-2.5 py-1 text-2xs text-ink-muted transition-colors duration-150 hover:border-primary/40 hover:text-primary"
                              >
                                {v.key.replaceAll("_", " ")}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="submit" variant="primary" size="sm">
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                toast.success("Sent a test to your own phone and inbox.")
                              }
                            >
                              <PaperPlaneTiltIcon aria-hidden />
                              Send me a test
                            </Button>
                            <Button
                              type="button"
                              variant="quiet"
                              size="sm"
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>

                        {/* The preview: a phone bubble, filled with real-looking details. */}
                        <div>
                          <p className="text-sm font-medium text-ink">What they receive</p>
                          <div className="mt-2 rounded-xl border border-rule bg-sunken p-4">
                            {t.channels.includes("sms") ? (
                              <div>
                                <p className="text-2xs text-ink-faint">Text from (541) 388-2014</p>
                                <p className="mt-1.5 max-w-[34ch] rounded-2xl rounded-bl-sm bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-raised">
                                  {fill(draftBody) || "Nothing yet."}
                                </p>
                                <p className="mt-1.5 text-2xs text-ink-faint">
                                  <span data-numeric className="font-mono">
                                    {fill(draftBody).length}
                                  </span>{" "}
                                  characters,{" "}
                                  {segments(draftBody) === 1
                                    ? "one text"
                                    : `splits into ${segments(draftBody)} texts`}
                                </p>
                              </div>
                            ) : null}
                            {t.channels.includes("email") ? (
                              <div className={cn(t.channels.includes("sms") && "mt-4 border-t border-rule pt-4")}>
                                <p className="text-2xs text-ink-faint">Email</p>
                                <p className="mt-1 text-sm font-semibold text-ink">
                                  {fill(draftSubject || t.subject || "")}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                                  {fill(draftBody)}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </form>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* To the team */}
      <section aria-labelledby="to-team">
        <h3 id="to-team" className="font-display text-lg font-semibold text-ink">
          To your team
        </h3>
        <p className="mt-0.5 max-w-[62ch] text-sm text-ink-muted">
          What lands on your phone or in your inbox, and who gets it.
        </p>

        <Card className="mt-3">
          <CardContent className="p-0">
            <ul>
              {alerts.map((a) => {
                const id = `alert-${a.id}`;
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-start gap-4 border-b border-rule px-5 py-4 last:border-b-0"
                  >
                    <Switch
                      id={id}
                      checked={a.enabled}
                      onCheckedChange={(v) =>
                        setAlerts((all) =>
                          all.map((x) => (x.id === a.id ? { ...x, enabled: v } : x)),
                        )
                      }
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <label htmlFor={id} className="text-sm font-medium text-ink">
                        {a.name}
                      </label>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                        {a.description}
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-2xs text-ink-faint">
                        {a.channels.map((c) => {
                          const ChannelIcon = CHANNEL[c].icon;
                          return (
                            <span key={c} className="inline-flex items-center gap-1">
                              <ChannelIcon className="size-3.5" aria-hidden />
                              {CHANNEL[c].label}
                            </span>
                          );
                        })}
                        <span aria-hidden>·</span>
                        <span>to {a.recipients.map(memberName).join(", ")}</span>
                      </p>
                    </div>
                    <Button variant="quiet" size="sm">
                      Change who gets it
                    </Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Sent */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Sent today</CardTitle>
            <CardDescription>
              Anything that could not be delivered says why, in words.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
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
                          {nameOf(m.templateKey)}
                        </span>
                      </th>
                      <td className="px-5 py-3 font-mono text-ink-muted">{m.to}</td>
                      <td className="px-5 py-3">
                        <Badge tone={st.tone}>
                          <StatusIcon className="size-3" aria-hidden />
                          {st.label}
                        </Badge>
                        {m.failure ? (
                          <p className="mt-1 max-w-[32ch] text-xs leading-relaxed text-ink-muted">
                            {m.failure}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-ink-muted">
                        {fmt.relative(m.sentAt, NOW)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
