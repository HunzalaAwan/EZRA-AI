"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  PhoneIcon,
  PlusIcon,
  RobotIcon,
  TrashIcon,
  UserIcon,
  VoicemailIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { Agent, HandoffTarget, RouteStep } from "@/lib/api/types";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Call routing for one number, as an ordered list.
 *
 * The same editor serves an EZRA number and a line from another phone
 * company: both are "a number people call", and both get a list of places the
 * call goes, in priority order. Each step is one of four things anyone can
 * name: an AI agent, a team member, any phone number, or voicemail. If a step
 * is not answered within its ring time, the next one runs.
 *
 * The footer reads the whole route back as one sentence, because a list of
 * settings is easy to get wrong and a sentence is easy to check.
 */

type Kind = RouteStep["kind"];

const KIND: Record<Kind, { label: string; icon: Icon; tone: string }> = {
  agent: { label: "AI agent", icon: RobotIcon, tone: "var(--color-series-1)" },
  person: { label: "Team member", icon: UserIcon, tone: "var(--color-series-4)" },
  number: { label: "Phone number", icon: PhoneIcon, tone: "var(--color-series-2)" },
  voicemail: { label: "Voicemail", icon: VoicemailIcon, tone: "var(--color-series-3)" },
};
const KINDS = Object.keys(KIND) as Kind[];
const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const MAX_STEPS = 6;

export interface RouteDirectory {
  agents: Agent[];
  people: HandoffTarget[];
}

function stepName(s: RouteStep, d: RouteDirectory) {
  if (s.kind === "agent") return d.agents.find((a) => a.id === s.ref)?.name ?? "an agent";
  if (s.kind === "person") return d.people.find((p) => p.id === s.ref)?.name ?? "a team member";
  if (s.kind === "number") return s.ref ? fmt.phone(s.ref) : "a phone number";
  return "Voicemail";
}

/** The route as one sentence a person can check at a glance. */
export function describeRoute(route: RouteStep[], d: RouteDirectory) {
  if (route.length === 0) return "No routing yet. Calls to this number go nowhere.";
  return route
    .map((s, i) => {
      const name = stepName(s, d);
      const what =
        s.kind === "agent"
          ? `the ${name} agent answers`
          : s.kind === "voicemail"
            ? "they go to voicemail"
            : `${name} rings`;
      if (i === 0) return `First, ${what}.`;
      const prev = route[i - 1]!;
      return `If no one answers in ${prev.ringSeconds} seconds, ${what}.`;
    })
    .join(" ");
}

/** Compact pills for a list row: 1st → 2nd → 3rd. */
export function RouteSummary({ route, directory }: { route: RouteStep[]; directory: RouteDirectory }) {
  if (route.length === 0) {
    return <span className="text-sm text-warning">No routing set up</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {route.map((s, i) => {
        const k = KIND[s.kind];
        const KIcon = k.icon;
        return (
          <React.Fragment key={s.id}>
            {i > 0 ? <ArrowRightIcon aria-hidden className="size-3.5 text-ink-faint" /> : null}
            <span
              style={{ "--tone": k.tone } as React.CSSProperties}
              className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--tone)_13%,transparent)] py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-ink"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-[var(--tone)] text-on-primary">
                <KIcon aria-hidden className="size-3" />
              </span>
              <span className="max-w-[10rem] truncate">{stepName(s, directory)}</span>
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
}

let seq = 0;
const newId = () => `st_${Date.now()}_${seq++}`;

function defaultStep(kind: Kind, d: RouteDirectory): RouteStep {
  return {
    id: newId(),
    kind,
    ref:
      kind === "agent"
        ? (d.agents.find((a) => a.status === "live")?.id ?? "")
        : kind === "person"
          ? (d.people[0]?.id ?? "")
          : "",
    ringSeconds: kind === "voicemail" ? 0 : 20,
  };
}

/**
 * The editor, in a side panel. `askForNumber` adds the "number customers
 * call" field first, for a line from another phone company.
 */
export function RoutingPanel({
  open,
  onOpenChange,
  title,
  description,
  initial,
  directory,
  askForNumber,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initial: RouteStep[];
  directory: RouteDirectory;
  askForNumber?: boolean;
  onSave: (route: RouteStep[], fromE164?: string) => void;
}) {
  const [route, setRoute] = React.useState<RouteStep[]>(initial);
  const [from, setFrom] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // A fresh copy every time the panel opens.
  React.useEffect(() => {
    if (open) {
      setRoute(initial.length ? initial : [defaultStep("agent", directory)]);
      setFrom("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // An error describes the route as it was; any edit makes it stale.
  React.useEffect(() => setError(null), [route, from]);

  const live = directory.agents.filter((a) => a.status !== "draft");
  const endsInVoicemail = route[route.length - 1]?.kind === "voicemail";

  function update(i: number, patch: Partial<RouteStep>) {
    setRoute((r) => r.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }
  function setKind(i: number, kind: Kind) {
    setRoute((r) => {
      const next = r.map((s, j) => (j === i ? { ...defaultStep(kind, directory), id: s.id } : s));
      // Voicemail ends the route, so anything after it is dropped.
      return kind === "voicemail" ? next.slice(0, i + 1) : next;
    });
  }
  function move(i: number, by: -1 | 1) {
    setRoute((r) => {
      const n = [...r];
      const a = n[i];
      const b = n[i + by];
      if (!a || !b) return r;
      n[i] = b;
      n[i + by] = a;
      return n;
    });
  }

  function save() {
    setError(null);
    const d = from.replace(/\D/g, "");
    if (askForNumber && d.length < 10) return setError("Add the number your customers call.");
    if (route.length === 0) return setError("Add at least one place for calls to go.");
    const vm = route.findIndex((s) => s.kind === "voicemail");
    if (vm !== -1 && vm !== route.length - 1) return setError("Voicemail has to be the last step.");
    for (const s of route) {
      if (s.kind === "number" && s.ref.replace(/\D/g, "").length < 10)
        return setError("One of the phone numbers is missing or too short.");
      if ((s.kind === "agent" || s.kind === "person") && !s.ref)
        return setError(`Choose which ${s.kind === "agent" ? "agent" : "team member"} to ring.`);
    }
    const clean = route.map((s) =>
      s.kind === "number" ? { ...s, ref: `+1${s.ref.replace(/\D/g, "").slice(-10)}` } : s,
    );
    onSave(clean, askForNumber ? `+1${d.slice(-10)}` : undefined);
    onOpenChange(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgb(10_10_10/0.36)] backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="fixed inset-y-3 right-3 z-50 flex w-[calc(100vw-1.5rem)] max-w-[34rem] flex-col overflow-hidden rounded-[1.75rem] border border-rule bg-surface shadow-overlay focus:outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-5">
            <div>
              <DialogPrimitive.Title className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-sm text-ink-muted">
                {description}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="-mr-2 -mt-1 cursor-pointer rounded-full p-2 text-ink-muted transition-colors hover:bg-panel hover:text-ink"
            >
              <XIcon className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {askForNumber ? (
              <Field
                label="The number your customers call"
                htmlFor="route-from"
                hint="Your existing line. It stays with your phone company."
              >
                <Input
                  type="tel"
                  inputMode="tel"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="(541) 388 0610"
                />
              </Field>
            ) : null}

            <p className="text-sm font-semibold text-ink">Calls go to, in this order</p>

            <ol className="space-y-0">
              {route.map((s, i) => {
                const k = KIND[s.kind];
                const KIcon = k.icon;
                const base = `route-${s.id}`;
                return (
                  <li key={s.id}>
                    {i > 0 ? (
                      <p className="flex items-center gap-2 py-2 pl-5 text-xs text-ink-muted">
                        <span aria-hidden className="h-4 w-px bg-rule-control" />
                        If no answer after {route[i - 1]!.ringSeconds} seconds, then
                      </p>
                    ) : null}
                    <div
                      style={{ "--tone": k.tone } as React.CSSProperties}
                      className="rounded-2xl border border-rule bg-surface p-4 shadow-[0_1px_2px_rgb(10_10_10/0.04)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2.5">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--tone)] text-on-primary">
                            <KIcon aria-hidden className="size-4" />
                          </span>
                          <span className="rounded-full bg-panel px-2.5 py-0.5 text-xs font-semibold text-ink">
                            {ORDINAL[i]} priority
                          </span>
                        </span>
                        <span className="flex items-center">
                          <Button
                            variant="quiet"
                            size="icon-sm"
                            aria-label={`Move step ${i + 1} up`}
                            disabled={i === 0}
                            onClick={() => move(i, -1)}
                          >
                            <ArrowUpIcon aria-hidden />
                          </Button>
                          <Button
                            variant="quiet"
                            size="icon-sm"
                            aria-label={`Move step ${i + 1} down`}
                            disabled={i === route.length - 1 || route[i + 1]?.kind === "voicemail"}
                            onClick={() => move(i, 1)}
                          >
                            <ArrowDownIcon aria-hidden />
                          </Button>
                          <Button
                            variant="quiet"
                            size="icon-sm"
                            aria-label={`Remove step ${i + 1}`}
                            disabled={route.length === 1}
                            onClick={() => setRoute((r) => r.filter((x) => x.id !== s.id))}
                          >
                            <TrashIcon aria-hidden />
                          </Button>
                        </span>
                      </div>

                      {/* What it is: four big, plain options. */}
                      <div role="group" aria-label={`Step ${i + 1} goes to`} className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                        {KINDS.map((kind) => {
                          const on = s.kind === kind;
                          const OIcon = KIND[kind].icon;
                          return (
                            <button
                              key={kind}
                              type="button"
                              aria-pressed={on}
                              onClick={() => setKind(i, kind)}
                              className={cn(
                                "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
                                on
                                  ? "border-[var(--tone)] bg-[color-mix(in_oklab,var(--tone)_10%,transparent)] text-ink"
                                  : "border-rule text-ink-muted hover:border-rule-control hover:text-ink",
                              )}
                            >
                              <OIcon aria-hidden className="size-4" />
                              {KIND[kind].label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Which one, and for how long. */}
                      {s.kind !== "voicemail" ? (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10.5rem]">
                          {s.kind === "agent" ? (
                            <Field label="Which agent" htmlFor={`${base}-ref`}>
                              <Select value={s.ref} onChange={(e) => update(i, { ref: e.target.value })}>
                                {live.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}
                                  </option>
                                ))}
                              </Select>
                            </Field>
                          ) : s.kind === "person" ? (
                            <Field label="Which person" htmlFor={`${base}-ref`}>
                              <Select value={s.ref} onChange={(e) => update(i, { ref: e.target.value })}>
                                {directory.people.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </Select>
                            </Field>
                          ) : (
                            <Field label="Which number" htmlFor={`${base}-ref`}>
                              <Input
                                type="tel"
                                inputMode="tel"
                                value={s.ref.startsWith("+1") ? fmt.phone(s.ref) : s.ref}
                                onChange={(e) => update(i, { ref: e.target.value })}
                                onBlur={(e) => {
                                  const d = e.target.value.replace(/\D/g, "");
                                  if (d.length === 10 || (d.length === 11 && d.startsWith("1")))
                                    update(i, { ref: `+1${d.slice(-10)}` });
                                }}
                                placeholder="(541) 555 0182"
                              />
                            </Field>
                          )}
                          <Field label="Ring for" htmlFor={`${base}-ring`}>
                            <Select
                              value={String(s.ringSeconds)}
                              onChange={(e) => update(i, { ringSeconds: Number(e.target.value) })}
                            >
                              {[15, 20, 25, 30, 45, 60].map((n) => (
                                <option key={n} value={n}>
                                  {n} seconds
                                </option>
                              ))}
                            </Select>
                          </Field>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-ink-muted">
                          The caller leaves a message. It shows up in Conversations with a transcript.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {!endsInVoicemail && route.length < MAX_STEPS ? (
              <Button
                variant="secondary"
                className="w-full border-dashed"
                onClick={() => setRoute((r) => [...r, defaultStep(r.length ? "person" : "agent", directory)])}
              >
                <PlusIcon aria-hidden weight="bold" />
                Add a fallback
              </Button>
            ) : null}
          </div>

          {/* The route, read back. */}
          <div className="space-y-3 border-t border-rule bg-panel px-6 py-4">
            <p className="text-sm leading-relaxed text-ink">{describeRoute(route, directory)}</p>
            {error ? (
              <p role="alert" className="rounded-xl bg-danger-wash px-3.5 py-2.5 text-sm text-danger">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={save}>
                Save routing
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
