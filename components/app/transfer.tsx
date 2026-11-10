"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatCircleDotsIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UserSwitchIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import type { AgentTransfer, HandoffTarget, HandoffTrigger, TransferStep } from "@/lib/api/types";
import * as fmt from "@/lib/format";
import { describeTransfer, transferIncomplete } from "@/lib/transfer";
import { cn } from "@/lib/utils";

/**
 * Transfer to a person: the moment an agent that is already on a call hands
 * the caller to a human.
 *
 * Three questions, asked in the order an owner thinks about them: when should
 * it happen, who should it ring, and what if nobody picks up. A sentence at
 * the top reads the whole setting back, because a page of switches is easy to
 * get wrong and a sentence is easy to check.
 *
 * Who answers a number in the first place is a different question, set on
 * Phone numbers. This is only what happens once the agent has the call.
 */

const ORDINAL = ["1st", "2nd", "3rd", "4th"];
const MAX_STEPS = 4;
const RING = [15, 20, 25, 30, 45, 60];

const FALLBACK: { value: AgentTransfer["ifNoAnswer"]; label: string; body: string }[] = [
  {
    value: "message",
    label: "Take a message",
    body: "The agent takes their details and texts the message to you.",
  },
  {
    value: "callback",
    label: "Book a callback",
    body: "The agent agrees a time for someone to call them back.",
  },
  {
    value: "voicemail",
    label: "Voicemail",
    body: "The caller leaves a voicemail, transcribed in Conversations.",
  },
];

const STYLE: { value: AgentTransfer["style"]; label: string; body: string }[] = [
  {
    value: "warm",
    label: "Introduce the caller first",
    body: "Your team member hears who is calling and why, then the caller joins.",
  },
  {
    value: "direct",
    label: "Put them straight through",
    body: "Faster. Your team member picks up straight to the caller.",
  },
];

let seq = 0;
const newId = () => `ts_${Date.now()}_${seq++}`;

export function TransferSettings({
  agentName,
  voice,
  value: t,
  onChange,
  people,
  triggers,
}: {
  agentName: string;
  /** Chat-only agents have no call to transfer. */
  voice: boolean;
  value: AgentTransfer;
  onChange: (next: AgentTransfer) => void;
  people: HandoffTarget[];
  /** The built-in reasons, with their plain descriptions. */
  triggers: HandoffTrigger[];
}) {
  const [custom, setCustom] = React.useState("");
  const [touched, setTouched] = React.useState<Set<string>>(new Set());

  if (!voice) {
    return (
      <p className="flex items-start gap-3 rounded-xl bg-panel p-4 text-sm leading-relaxed text-ink">
        <ChatCircleDotsIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        {agentName} answers website chat, so there is no call to put through. When a visitor asks
        for a person, it takes their name and number and texts your team.
      </p>
    );
  }

  const set = (patch: Partial<AgentTransfer>) => onChange({ ...t, ...patch });
  const setStep = (i: number, patch: Partial<TransferStep>) =>
    set({ to: t.to.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  function move(i: number, by: -1 | 1) {
    const n = [...t.to];
    const a = n[i];
    const b = n[i + by];
    if (!a || !b) return;
    n[i] = b;
    n[i + by] = a;
    set({ to: n });
  }
  function addCustom() {
    const v = custom.trim();
    if (!v || t.customTriggers.includes(v)) return;
    set({ customTriggers: [...t.customTriggers, v] });
    setCustom("");
  }
  function addStep() {
    // Offer the next team member not already in the list.
    const next = people.find((p) => !t.to.some((s) => s.kind === "person" && s.ref === p.id));
    set({
      to: [
        ...t.to,
        next
          ? { id: newId(), kind: "person", ref: next.id, ringSeconds: 20 }
          : { id: newId(), kind: "number", ref: "", ringSeconds: 20 },
      ],
    });
  }

  const sentence = describeTransfer(t, people, agentName);
  const incomplete = transferIncomplete(t);

  return (
    <div className="space-y-7">
      {/* On or off. */}
      <div className="flex items-start gap-3.5 rounded-sm border border-rule bg-canvas p-3.5">
        <Switch
          id="transfer-enabled"
          checked={t.enabled}
          onCheckedChange={(enabled) => set({ enabled })}
          className="mt-0.5"
        />
        <label htmlFor="transfer-enabled" className="min-w-0 flex-1 cursor-pointer">
          <span className="block text-sm font-medium text-ink">Let callers reach a person</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
            Off means the agent never transfers. It takes a message instead.
          </span>
        </label>
      </div>

      {/* The setting, read back. */}
      <p
        className={cn(
          "flex items-start gap-3 rounded-xl p-4 text-sm leading-relaxed text-ink",
          incomplete ? "bg-warning-wash" : "bg-primary-wash",
        )}
      >
        <UserSwitchIcon
          aria-hidden
          className={cn("mt-0.5 size-5 shrink-0", incomplete ? "text-warning" : "text-primary")}
        />
        <span aria-live="polite">{sentence}</span>
      </p>

      {t.enabled ? (
        <>
          {/* 1. When. */}
          <section aria-labelledby="transfer-when" className="space-y-3">
            <Heading id="transfer-when" title="When to transfer" body="As soon as one of these happens on a call." />
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {triggers.map((tr) => {
                const on = t.triggers.includes(tr.key);
                const id = `trigger-${tr.key}`;
                return (
                  <li key={tr.key} className="flex items-start gap-3 rounded-sm border border-rule bg-canvas p-3">
                    <Switch
                      id={id}
                      checked={on}
                      onCheckedChange={(c) =>
                        set({
                          triggers: c ? [...t.triggers, tr.key] : t.triggers.filter((k) => k !== tr.key),
                        })
                      }
                      className="mt-0.5"
                    />
                    <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                      <span className="block text-sm font-medium text-ink">{tr.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{tr.description}</span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addCustom();
              }}
            >
              <Field
                label="Also transfer when"
                htmlFor="transfer-custom"
                hint="In your own words. For example: a patient asks about a referral."
                className="min-w-0 flex-1"
              >
                <Input value={custom} onChange={(e) => setCustom(e.target.value)} />
              </Field>
              <Button type="submit" variant="secondary" disabled={!custom.trim()}>
                <PlusIcon aria-hidden weight="bold" />
                Add
              </Button>
            </form>

            {t.customTriggers.length ? (
              <ul aria-label="Your own reasons" className="flex flex-wrap gap-1.5">
                {t.customTriggers.map((c) => (
                  <li
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full bg-panel py-1 pl-3 pr-1 text-xs font-medium text-ink ring-1 ring-rule"
                  >
                    {c}
                    <button
                      type="button"
                      aria-label={`Remove: ${c}`}
                      onClick={() => set({ customTriggers: t.customTriggers.filter((x) => x !== c) })}
                      className="flex size-6 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-raised hover:text-ink"
                    >
                      <XIcon aria-hidden className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* 2. Who. */}
          <section aria-labelledby="transfer-who" className="space-y-3">
            <Heading
              id="transfer-who"
              title="Who to transfer to"
              body="Rung in this order until someone picks up. Use a team member or any phone number, like a mobile."
            />

            <ol>
              {t.to.map((s, i) => {
                const base = `transfer-${s.id}`;
                const digits = s.ref.replace(/\D/g, "").length;
                const badNumber = s.kind === "number" && touched.has(s.id) && digits < 10;
                const person = s.kind === "person" ? people.find((p) => p.id === s.ref) : undefined;
                return (
                  <li key={s.id}>
                    {i > 0 ? (
                      <p className="flex items-center gap-2 py-2 pl-5 text-xs text-ink-muted">
                        <span aria-hidden className="h-4 w-px bg-rule-control" />
                        If no answer after {t.to[i - 1]!.ringSeconds} seconds, then
                      </p>
                    ) : null}
                    <div className="rounded-2xl border border-rule bg-surface p-3.5 shadow-[0_1px_2px_rgb(10_10_10/0.04)]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-panel px-2.5 py-0.5 text-xs font-semibold text-ink">
                            {ORDINAL[i]}
                          </span>
                          {/* What it is: two plain options. */}
                          <span role="group" aria-label={`${ORDINAL[i]} transfer goes to`} className="flex rounded-full bg-panel p-0.5">
                            {(
                              [
                                ["person", "Team member", UserIcon],
                                ["number", "Phone number", PhoneIcon],
                              ] as const
                            ).map(([kind, label, KIcon]) => (
                              <button
                                key={kind}
                                type="button"
                                aria-pressed={s.kind === kind}
                                onClick={() =>
                                  s.kind !== kind &&
                                  setStep(i, {
                                    kind,
                                    ref: kind === "person" ? (people[0]?.id ?? "") : "",
                                    label: undefined,
                                  })
                                }
                                className={cn(
                                  "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                                  s.kind === kind
                                    ? "bg-surface text-ink shadow-[0_1px_3px_rgb(10_10_10/0.12)]"
                                    : "text-ink-muted hover:text-ink",
                                )}
                              >
                                <KIcon aria-hidden className="size-3.5" />
                                {label}
                              </button>
                            ))}
                          </span>
                        </span>
                        <span className="flex items-center">
                          <Button
                            variant="quiet"
                            size="icon-sm"
                            aria-label={`Move ${ORDINAL[i]} up`}
                            disabled={i === 0}
                            onClick={() => move(i, -1)}
                          >
                            <ArrowUpIcon aria-hidden />
                          </Button>
                          <Button
                            variant="quiet"
                            size="icon-sm"
                            aria-label={`Move ${ORDINAL[i]} down`}
                            disabled={i === t.to.length - 1}
                            onClick={() => move(i, 1)}
                          >
                            <ArrowDownIcon aria-hidden />
                          </Button>
                          <Button
                            variant="quiet"
                            size="icon-sm"
                            aria-label={`Remove ${ORDINAL[i]}`}
                            onClick={() => set({ to: t.to.filter((x) => x.id !== s.id) })}
                          >
                            <TrashIcon aria-hidden />
                          </Button>
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
                        {s.kind === "person" ? (
                          <Field label="Which person" htmlFor={`${base}-ref`}>
                            <Select value={s.ref} onChange={(e) => setStep(i, { ref: e.target.value })}>
                              {people.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </Select>
                          </Field>
                        ) : (
                          <Field
                            label="Which number"
                            htmlFor={`${base}-ref`}
                            error={badNumber ? "Add the full number, with the area code." : undefined}
                          >
                            <Input
                              type="tel"
                              inputMode="tel"
                              autoComplete="off"
                              value={s.ref.startsWith("+1") ? fmt.phone(s.ref) : s.ref}
                              onChange={(e) => setStep(i, { ref: e.target.value, label: undefined })}
                              onBlur={(e) => {
                                setTouched((x) => new Set(x).add(s.id));
                                const d = e.target.value.replace(/\D/g, "");
                                if (d.length === 10 || (d.length === 11 && d.startsWith("1")))
                                  setStep(i, { ref: `+1${d.slice(-10)}` });
                              }}
                              placeholder="(541) 596 0473"
                            />
                          </Field>
                        )}
                        <Field label="Ring for" htmlFor={`${base}-ring`}>
                          <Select
                            value={String(s.ringSeconds)}
                            onChange={(e) => setStep(i, { ringSeconds: Number(e.target.value) })}
                          >
                            {RING.map((n) => (
                              <option key={n} value={n}>
                                {n} seconds
                              </option>
                            ))}
                          </Select>
                        </Field>
                      </div>
                      {person ? (
                        <p className="mt-2 text-xs text-ink-muted">
                          {person.role}. Available {person.availability}.
                        </p>
                      ) : s.kind === "number" && s.label ? (
                        <p className="mt-2 text-xs text-ink-muted">Reaches {s.label}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>

            {t.to.length < MAX_STEPS ? (
              <Button variant="secondary" className="w-full border-dashed" onClick={addStep}>
                <PlusIcon aria-hidden weight="bold" />
                {t.to.length ? "Add someone else" : "Add someone to transfer to"}
              </Button>
            ) : null}
          </section>

          {/* 3. If nobody picks up. */}
          <section aria-labelledby="transfer-fallback" className="space-y-3">
            <Heading id="transfer-fallback" title="If nobody picks up" body="The caller is never left ringing." />
            <Choices
              name="transfer-fallback"
              labelledBy="transfer-fallback"
              value={t.ifNoAnswer}
              options={FALLBACK}
              onChange={(ifNoAnswer) => set({ ifNoAnswer })}
              className="sm:grid-cols-3"
            />
          </section>

          {/* 4. How. */}
          <section aria-labelledby="transfer-how" className="space-y-3">
            <Heading id="transfer-how" title="How it hands over" />
            <Choices
              name="transfer-style"
              labelledBy="transfer-how"
              value={t.style}
              options={STYLE}
              onChange={(style) => set({ style })}
              className="sm:grid-cols-2"
            />
            <div className="flex items-start gap-3.5 rounded-sm border border-rule bg-canvas p-3.5">
              <Switch
                id="transfer-summary"
                checked={t.textSummary}
                onCheckedChange={(textSummary) => set({ textSummary })}
                className="mt-0.5"
              />
              <label htmlFor="transfer-summary" className="min-w-0 flex-1 cursor-pointer">
                <span className="block text-sm font-medium text-ink">Text a summary to whoever picks up</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                  Who is calling, their number, and what they need, so nobody has to ask twice.
                </span>
              </label>
            </div>
            <Field
              label="What the agent says first"
              htmlFor="transfer-say"
              hint="Said to the caller just before it puts them through."
            >
              <Textarea className="min-h-16" value={t.say} onChange={(e) => set({ say: e.target.value })} />
            </Field>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Heading({ id, title, body }: { id: string; title: string; body?: string }) {
  return (
    <div>
      <h4 id={id} className="font-display text-base font-semibold text-ink">
        {title}
      </h4>
      {body ? <p className="mt-0.5 text-sm text-ink-muted">{body}</p> : null}
    </div>
  );
}

/** Radio cards. Native radios underneath, so arrow keys and screen readers behave. */
function Choices<T extends string>({
  name,
  value,
  options,
  onChange,
  className,
  labelledBy,
}: {
  name: string;
  labelledBy: string;
  value: T;
  options: { value: T; label: string; body: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={cn("grid grid-cols-1 gap-2", className)}>
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "relative cursor-pointer rounded-xl border p-3.5 transition-colors",
            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas",
            value === o.value
              ? "border-primary bg-primary-wash"
              : "border-rule bg-canvas hover:border-rule-control",
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <span
              aria-hidden
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border",
                value === o.value ? "border-primary" : "border-rule-control",
              )}
            >
              {value === o.value ? <span className="size-2 rounded-full bg-primary" /> : null}
            </span>
            {o.label}
          </span>
          <span className="mt-1 block pl-6 text-xs leading-relaxed text-ink-muted">{o.body}</span>
        </label>
      ))}
    </div>
  );
}
