"use client";

import * as React from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarCheckIcon,
  CheckIcon,
  GlobeIcon,
  PhoneCallIcon,
  PlayIcon,
  SpeakerHighIcon,
  UserCheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { LiveIndicator } from "@/components/ui/status";
import { voices } from "@/lib/mock/fixtures";
import { Swap } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";
import type { AgentGoal } from "@/lib/api/types";

/**
 * Five steps. Every field the platform can derive from the website arrives
 * filled in. The owner corrects, never authors.
 *
 * Progress persists across steps and Back never loses work, which is why the
 * draft lives in one state object above the step components rather than inside
 * them.
 */

interface Draft {
  website: string;
  businessName: string;
  services: string;
  hours: string;
  serviceArea: string;
  phone: string;
  goal: AgentGoal | null;
  agentName: string;
  voiceId: string;
  greeting: string;
}

const STEPS = [
  "Your website",
  "What we found",
  "What it should do",
  "Voice and name",
  "Try it",
] as const;

/** What the scan derives. In production this comes from reading the site. */
const SCANNED: Omit<
  Draft,
  "website" | "goal" | "agentName" | "voiceId" | "greeting"
> = {
  businessName: "Alder Creek Dental Group",
  services:
    "General dentistry, cleanings and exams, crowns and bridges, Invisalign, emergency care",
  hours:
    "Monday to Thursday 7:30am to 5pm, Friday 8am to 2pm, closed Saturday and Sunday",
  serviceArea: "Bend, Redmond, and Sisters, Oregon",
  phone: "(541) 388-2014",
};

const GOALS: {
  id: AgentGoal;
  label: string;
  body: string;
  icon: React.ComponentType<{
    className?: string;
    weight?: "regular" | "fill";
  }>;
}[] = [
  {
    id: "book",
    label: "Book appointments",
    body: "Finds an open slot, confirms by text, and writes it into your calendar.",
    icon: CalendarCheckIcon,
  },
  {
    id: "qualify",
    label: "Qualify new customers",
    body: "Asks what they need, checks insurance, and passes on the ones worth your time.",
    icon: UserCheckIcon,
  },
  {
    id: "answer",
    label: "Answer questions",
    body: "Hours, location, insurance, parking, and what to bring to a first visit.",
    icon: GlobeIcon,
  },
  {
    id: "route",
    label: "Route urgent calls",
    body: "Tells a real emergency from a question and pages whoever is on call.",
    icon: PhoneCallIcon,
  },
];

export function CreateAgentFlow() {
  const [step, setStep] = React.useState(0);
  const [scanning, setScanning] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>({
    website: "",
    businessName: "",
    services: "",
    hours: "",
    serviceArea: "",
    phone: "",
    goal: null,
    agentName: "",
    voiceId: voices[0]!.id,
    greeting: "",
  });

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function runScan() {
    setScanning(true);
    window.setTimeout(() => {
      setDraft((d) => ({
        ...d,
        ...SCANNED,
        agentName: "Front Desk",
        greeting: `Thanks for calling ${SCANNED.businessName}, this is Maren. How can I help you today?`,
      }));
      setScanning(false);
      setStep(1);
    }, 1400);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <StepBar current={step} />

      <Swap activeKey={String(step)} className="mt-6">
        {step === 0 && (
          <StepWebsite
            value={draft.website}
            onChange={(v) => update("website", v)}
            scanning={scanning}
            onScan={runScan}
          />
        )}
        {step === 1 && (
          <StepConfirm
            draft={draft}
            update={update}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepGoal
            value={draft.goal}
            onChange={(g) => {
              update("goal", g);
              setStep(3);
            }}
          />
        )}
        {step === 3 && (
          <StepVoice draft={draft} update={update} onNext={() => setStep(4)} />
        )}
        {step === 4 && <StepTest draft={draft} />}
      </Swap>

      {step > 0 && step < 4 ? (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="quiet" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeftIcon aria-hidden />
            Back
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StepBar({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-2xs",
                done && "bg-primary text-on-primary",
                active && "border-2 border-primary text-primary",
                !done && !active && "border border-rule-control text-ink-faint",
              )}
            >
              {done ? (
                <CheckIcon className="size-3" weight="bold" aria-hidden />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "text-xs",
                active ? "font-medium text-ink" : "text-ink-muted",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? (
              <span aria-hidden className="mx-1 h-px w-4 bg-rule sm:w-6" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function StepWebsite({
  value,
  onChange,
  scanning,
  onScan,
}: {
  value: string;
  onChange: (v: string) => void;
  scanning: boolean;
  onScan: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Start with your website
        </h2>
        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-muted">
          We read your site and fill in your services, hours, and the questions
          people ask most. You correct anything we get wrong. There is nothing
          to write from scratch.
        </p>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            onScan();
          }}
        >
          <Field
            label="Your website address"
            htmlFor="website"
            hint="The public site your customers visit."
          >
            <Input
              type="text"
              inputMode="url"
              placeholder="aldercreekdental.com"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              autoFocus
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-5 w-full sm:w-auto"
            loading={scanning}
            disabled={value.trim().length < 3}
          >
            {scanning ? "Reading your site" : "Read my site"}
            {!scanning && <ArrowRightIcon aria-hidden />}
          </Button>
        </form>

        {scanning ? (
          <ul className="mt-5 space-y-1.5" aria-live="polite">
            {["Home", "Services", "Our team", "Insurance", "Contact"].map(
              (p, i) => (
                <li
                  key={p}
                  className="flex items-center gap-2 font-mono text-xs text-ink-muted"
                  style={{ opacity: 1 - i * 0.14 }}
                >
                  <CheckIcon className="size-3.5 text-success" aria-hidden />
                  Read the {p.toLowerCase()} page
                </li>
              ),
            )}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StepConfirm({
  draft,
  update,
  onNext,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  onNext: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Here is what we found
        </h2>
        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-muted">
          All of this came off your site. Change anything that is wrong. You can
          come back and edit it later too.
        </p>

        <div className="mt-6 space-y-5">
          <Field label="Business name" htmlFor="businessName">
            <Input
              value={draft.businessName}
              onChange={(e) => update("businessName", e.target.value)}
            />
          </Field>

          <Field
            label="What you do"
            htmlFor="services"
            hint="The agent uses this to answer what you offer."
          >
            <Textarea
              value={draft.services}
              onChange={(e) => update("services", e.target.value)}
            />
          </Field>

          <Field label="Hours" htmlFor="hours">
            <Textarea
              value={draft.hours}
              onChange={(e) => update("hours", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Area you serve" htmlFor="serviceArea">
              <Input
                value={draft.serviceArea}
                onChange={(e) => update("serviceArea", e.target.value)}
              />
            </Field>
            <Field label="Your current phone number" htmlFor="phone">
              <Input
                value={draft.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Anything the scan could not find is called out plainly with a
            suggested value, never left blank. */}
        <div className="mt-5 flex items-start gap-2.5 rounded-sm border border-rule bg-warning-wash px-3.5 py-3">
          <WarningCircleIcon
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden
          />
          <p className="text-xs leading-relaxed text-ink">
            We could not find which insurance you accept. We have left that out
            for now, and the agent will offer to take a message when someone
            asks. You can add it later under Knowledge.
          </p>
        </div>

        <Button variant="primary" size="lg" className="mt-6" onClick={onNext}>
          This looks right
          <ArrowRightIcon aria-hidden />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepGoal({
  value,
  onChange,
}: {
  value: AgentGoal | null;
  onChange: (g: AgentGoal) => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink">
        What should it do when the phone rings?
      </h2>
      <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-muted">
        Pick the one that matters most. The agent will still answer questions
        either way, and you can add more later.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GOALS.map((g) => {
          const Icon = g.icon;
          const selected = value === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange(g.id)}
              aria-pressed={selected}
              className={cn(
                "cursor-pointer rounded-lg border bg-surface p-5 text-left shadow-raised transition-colors",
                selected
                  ? "border-primary ring-2 ring-primary"
                  : "border-rule hover:border-ink-faint",
              )}
            >
              <Icon
                className="size-5 text-primary"
                weight={selected ? "fill" : "regular"}
                aria-hidden
              />
              <span className="mt-3 block font-display text-lg font-semibold text-ink">
                {g.label}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
                {g.body}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepVoice({
  draft,
  update,
  onNext,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  onNext: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Give it a voice and a name
        </h2>
        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-muted">
          Each sample says your own greeting, not a generic line, so you can
          hear how it will actually sound to a caller.
        </p>

        <div className="mt-6 space-y-2.5">
          {voices.map((v) => {
            const selected = draft.voiceId === v.id;
            return (
              <div
                key={v.id}
                className={cn(
                  "flex items-center gap-3 rounded-sm border bg-surface p-3.5 transition-colors",
                  selected ? "border-primary" : "border-rule",
                )}
              >
                <Button
                  variant="secondary"
                  size="icon-sm"
                  aria-label={`Hear ${v.name} say your greeting`}
                >
                  <PlayIcon weight="fill" aria-hidden />
                </Button>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">
                    {v.name}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {v.tone}
                  </span>
                </span>
                <Button
                  variant={selected ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => update("voiceId", v.id)}
                >
                  {selected ? (
                    <>
                      <CheckIcon aria-hidden weight="bold" />
                      Chosen
                    </>
                  ) : (
                    "Use this one"
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5">
          <Field
            label="What should we call this agent?"
            htmlFor="agentName"
            hint="Only you see this. It keeps your agents straight."
          >
            <Input
              value={draft.agentName}
              onChange={(e) => update("agentName", e.target.value)}
            />
          </Field>

          <Field
            label="First thing it says"
            htmlFor="greeting"
            hint="Keep it short. Callers start talking over long greetings."
          >
            <Textarea
              value={draft.greeting}
              onChange={(e) => update("greeting", e.target.value)}
            />
          </Field>
        </div>

        <Button variant="primary" size="lg" className="mt-6" onClick={onNext}>
          Try it out
          <ArrowRightIcon aria-hidden />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepTest({ draft }: { draft: Draft }) {
  const [state, setState] = React.useState<"idle" | "connecting" | "live">(
    "idle",
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Call it yourself
            </h2>
            <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-muted">
              Talk to it the way a customer would. Nothing is live to the public
              until you publish.
            </p>
          </div>
          {state === "live" ? <LiveIndicator /> : null}
        </div>

        <div className="mt-6 rounded-lg border border-rule bg-sunken p-6 text-center">
          <div
            className={cn(
              "mx-auto flex size-16 items-center justify-center rounded-full",
              state === "live"
                ? "bg-signal-wash text-signal"
                : "bg-primary-wash text-primary",
            )}
          >
            {state === "live" ? (
              <SpeakerHighIcon
                className="size-7 animate-live-pulse motion-reduce:animate-none"
                weight="fill"
                aria-hidden
              />
            ) : (
              <PhoneCallIcon className="size-7" weight="fill" aria-hidden />
            )}
          </div>

          <p className="mt-4 text-sm font-medium text-ink">
            {state === "idle" && `${draft.agentName || "Your agent"} is ready`}
            {state === "connecting" && "Connecting"}
            {state === "live" && "You are connected. Say hello."}
          </p>
          <p className="mx-auto mt-1 max-w-[46ch] text-xs leading-relaxed text-ink-muted">
            {state === "live"
              ? "Try asking for an appointment, or something it should not know."
              : "Your browser will ask for the microphone. This is a test line only."}
          </p>

          <Button
            variant={state === "live" ? "danger" : "primary"}
            size="lg"
            className="mt-5"
            loading={state === "connecting"}
            onClick={() => {
              if (state === "live") return setState("idle");
              setState("connecting");
              window.setTimeout(() => setState("live"), 1200);
            }}
          >
            {state === "live" ? "End the call" : "Start a test call"}
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
          <Button variant="primary" size="lg">
            Publish and get a number
          </Button>
          <Button variant="secondary" size="lg">
            Save as a draft
          </Button>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Publishing does not change your existing phone line. You choose how
          calls reach the agent in the next step.
        </p>
      </CardContent>
    </Card>
  );
}
