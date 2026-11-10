"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  BooksIcon,
  CaretDownIcon,
  CheckCircleIcon,
  IdentificationCardIcon,
  LightningIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  SpeakerHighIcon,
  UserSwitchIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch, Textarea } from "@/components/ui/field";
import { AgentStatusBadge, Badge } from "@/components/ui/status";
import { TestPanel } from "./test-panel";
import { TransferSettings } from "@/components/app/transfer";
import { Swap, SPRING, motion } from "@/components/motion/primitives";
import type {
  Agent,
  AgentAction,
  AgentTransfer,
  AgentVersion,
  HandoffTarget,
  HandoffTrigger,
  KnowledgeSource,
} from "@/lib/api/types";
import { voices, NOW } from "@/lib/mock/fixtures";
// The ids live in lib so the server page can check a ?section= link.
import type { SectionId } from "@/lib/agent-sections";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Three panes at xl, tabs below. Left is section nav, center is the editing
 * surface, right is the test panel that never goes away.
 *
 * Advanced controls, including the raw instruction text, live behind
 * disclosure inside each section. They are never the default view, because the
 * buyer is a non-technical office manager.
 *
 * Unsaved changes are explicit. Publishing creates a version.
 */

const SECTIONS = [
  { id: "identity", label: "Identity", icon: IdentificationCardIcon },
  { id: "knowledge", label: "Knowledge", icon: BooksIcon },
  { id: "actions", label: "What it can do", icon: LightningIcon },
  { id: "transfer", label: "Transfer to a person", icon: UserSwitchIcon },
  { id: "voice", label: "Voice", icon: SpeakerHighIcon },
  { id: "guardrails", label: "Limits", icon: ShieldCheckIcon },
  { id: "deploy", label: "Publish", icon: RocketLaunchIcon },
] as const satisfies readonly { id: SectionId; label: string; icon: React.ElementType }[];

export function AgentBuilder({
  agent,
  knowledge,
  actions,
  versions,
  numberLabel,
  transfer: initialTransfer,
  people,
  triggers,
  initialSection = "identity",
}: {
  agent: Agent;
  knowledge: KnowledgeSource[];
  actions: AgentAction[];
  versions: AgentVersion[];
  numberLabel: string | null;
  transfer: AgentTransfer;
  people: HandoffTarget[];
  triggers: HandoffTrigger[];
  /** Phone numbers links straight to a section, such as transfer. */
  initialSection?: SectionId;
}) {
  const [section, setSection] = React.useState<SectionId>(initialSection);
  const [transfer, setTransfer] = React.useState(initialTransfer);
  const [dirty, setDirty] = React.useState(false);
  const [name, setName] = React.useState(agent.name);
  const [greeting, setGreeting] = React.useState(agent.greeting);

  return (
    <div className="space-y-4">
      <Button asChild variant="quiet" size="sm" className="-ml-2">
        <Link href="/agents">
          <ArrowLeftIcon aria-hidden />
          All agents
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2.5 font-display text-2xl font-semibold text-ink">
            {name}
            <AgentStatusBadge status={agent.status} />
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            {agent.version === 0
              ? "Never published. Nobody can reach this agent yet."
              : `Version ${agent.version}, published ${fmt.relative(agent.updatedAt, NOW)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dirty ? (
            <span className="flex items-center gap-1.5 text-xs text-warning">
              <WarningCircleIcon className="size-4" aria-hidden />
              Unpublished changes
            </span>
          ) : null}
          <Button variant="secondary" disabled={!dirty}>
            Discard
          </Button>
          <Button variant="primary" disabled={!dirty}>
            Publish changes
          </Button>
        </div>
      </div>

      {/* Three panes at xl. Below that the test panel moves under the editor
          and the section nav becomes a horizontal scroller. */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[13rem_minmax(0,1fr)_21rem]">
        <nav
          aria-label="Agent sections"
          className="xl:sticky xl:top-20 xl:self-start"
        >
          <ul className="flex gap-1 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = section === s.id;
              return (
                <li key={s.id} className="shrink-0 xl:shrink">
                  <button
                    type="button"
                    onClick={() => setSection(s.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "relative flex w-full cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-ink-muted hover:bg-raised hover:text-ink",
                    )}
                  >
                    {active && (
                      <motion.span
                        aria-hidden
                        layoutId="builder-section-active"
                        transition={SPRING}
                        className="absolute inset-0 -z-10 rounded-sm border border-primary/25 bg-primary-wash"
                      />
                    )}
                    <Icon
                      className="size-4 shrink-0"
                      weight={active ? "fill" : "regular"}
                      aria-hidden
                    />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 rounded-lg border border-rule bg-surface p-5 edge-light">
          <Swap activeKey={section}>
          {section === "identity" && (
            <IdentitySection
              name={name}
              greeting={greeting}
              onName={(v) => {
                setName(v);
                setDirty(true);
              }}
              onGreeting={(v) => {
                setGreeting(v);
                setDirty(true);
              }}
            />
          )}
          {section === "knowledge" && <KnowledgeSection sources={knowledge} />}
          {section === "actions" && (
            <ActionsSection actions={actions} onChange={() => setDirty(true)} />
          )}
          {section === "transfer" && (
            <div>
              <SectionHead
                title="Transfer to a person"
                body="When the agent is already on a call and the caller needs a human, this is when it hands over and who it rings. Who answers your number in the first place is set on Phone numbers."
              />
              <TransferSettings
                agentName={name}
                voice={agent.channels.includes("voice")}
                value={transfer}
                onChange={(t) => {
                  setTransfer(t);
                  setDirty(true);
                }}
                people={people}
                triggers={triggers}
              />
            </div>
          )}
          {section === "voice" && (
            <VoiceSection
              voiceId={agent.voiceId}
              onChange={() => setDirty(true)}
            />
          )}
          {section === "guardrails" && (
            <GuardrailsSection
              onChange={() => setDirty(true)}
              onTransfer={() => setSection("transfer")}
            />
          )}
          {section === "deploy" && (
            <DeploySection
              agent={agent}
              versions={versions}
              numberLabel={numberLabel}
            />
          )}
          </Swap>
        </div>

        {/* The composer must be reachable without scrolling first, so the
            panel is sized to clear the page header above it rather than the
            top bar alone. It pins on scroll. */}
        <div className="xl:sticky xl:top-20 xl:h-[calc(100dvh-13rem)] xl:self-start">
          <div className="h-[30rem] xl:h-full">
            <TestPanel greeting={greeting} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-5">
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-ink-muted">
        {body}
      </p>
    </div>
  );
}

/** Advanced controls always sit behind disclosure, never in the default view. */
function Advanced({ children }: { children: React.ReactNode }) {
  return (
    <details className="mt-6 border-t border-rule pt-4">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
        <CaretDownIcon
          className="size-4 transition-transform [details[open]_&]:rotate-180"
          aria-hidden
        />
        Advanced settings
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function IdentitySection({
  name,
  greeting,
  onName,
  onGreeting,
}: {
  name: string;
  greeting: string;
  onName: (v: string) => void;
  onGreeting: (v: string) => void;
}) {
  return (
    <div>
      <SectionHead
        title="Identity"
        body="Who the agent says it is and how it opens. Callers hear the greeting before anything else, so keep it short."
      />
      <div className="space-y-5">
        <Field
          label="Agent name"
          htmlFor="name"
          hint="Only you see this. It keeps your agents straight."
        >
          <Input value={name} onChange={(e) => onName(e.target.value)} />
        </Field>
        <Field
          label="Greeting"
          htmlFor="greeting"
          hint="Callers interrupt anything longer than about two lines."
        >
          <Textarea
            value={greeting}
            onChange={(e) => onGreeting(e.target.value)}
          />
        </Field>
        <Field
          label="How it should sound"
          htmlFor="tone"
          hint="Plain description. Warm and unhurried, or brisk and efficient."
        >
          <Input defaultValue="Warm, patient, never rushed. Uses the caller's name once." />
        </Field>
      </div>

      <Advanced>
        <Field
          label="Full instructions"
          htmlFor="instructions"
          hint="Everything above is written into these instructions for you. Edit directly only if you know why you need to."
        >
          <Textarea
            className="min-h-40 font-mono text-xs"
            defaultValue={`You are the front desk for Alder Creek Dental Group in Bend, Oregon.\n\nOpen with the greeting exactly as written. Speak warmly and do not rush.\n\nYou may book, reschedule, and cancel appointments. You may answer questions about services, hours, location, and parking.\n\nYou may not quote prices for treatment. If asked, say the doctor sets that after an exam and offer to take a message.\n\nIf the caller describes bleeding that will not stop, facial swelling, or a knocked out tooth, treat it as an emergency and page the on-call dentist immediately.`}
          />
        </Field>
      </Advanced>
    </div>
  );
}

const KNOWLEDGE_STATUS = {
  ready: { label: "Ready", tone: "success" as const, icon: CheckCircleIcon },
  reading: {
    label: "Reading",
    tone: "primary" as const,
    icon: ArrowsClockwiseIcon,
  },
  stale: {
    label: "Out of date",
    tone: "warning" as const,
    icon: WarningCircleIcon,
  },
  failed: {
    label: "Could not read",
    tone: "danger" as const,
    icon: XCircleIcon,
  },
};

function KnowledgeSection({ sources }: { sources: KnowledgeSource[] }) {
  return (
    <div>
      <SectionHead
        title="Knowledge"
        body="What the agent knows about your business. Each source shows what it contributed and when we last read it."
      />
      <ul className="space-y-2.5">
        {sources.map((s) => {
          const meta = KNOWLEDGE_STATUS[s.status];
          const Icon = meta.icon;
          return (
            <li
              key={s.id}
              className="rounded-sm border border-rule bg-canvas p-3.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                    {s.detail}
                  </p>
                </div>
                <Badge tone={meta.tone}>
                  <Icon className="size-3" aria-hidden />
                  {meta.label}
                </Badge>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-2xs text-ink-faint">
                  {s.chunks > 0
                    ? `${fmt.count(s.chunks)} passages · read ${fmt.relative(s.lastReadAt, NOW)}`
                    : `Last tried ${fmt.relative(s.lastReadAt, NOW)}`}
                </p>
                <Button variant="quiet" size="sm">
                  {s.status === "failed" ? "Try again" : "Read it again"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm">
          Add a document
        </Button>
        <Button variant="secondary" size="sm">
          Paste some text
        </Button>
      </div>
    </div>
  );
}

function ActionsSection({
  actions,
  onChange,
}: {
  actions: AgentAction[];
  onChange: () => void;
}) {
  return (
    <div>
      <SectionHead
        title="What it can do"
        body="Turn on what the agent is allowed to do on your behalf. Everything off means it answers questions and takes messages only."
      />
      <ul className="space-y-2.5">
        {/* Transfers have their own section, with who to ring and when. */}
        {actions.filter((a) => a.kind !== "transfer").map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-3.5 rounded-sm border border-rule bg-canvas p-3.5"
          >
            <Switch
              defaultChecked={a.enabled}
              onCheckedChange={onChange}
              id={`action-${a.id}`}
              className="mt-0.5"
            />
            <label
              htmlFor={`action-${a.id}`}
              className="min-w-0 flex-1 cursor-pointer"
            >
              <span className="block text-sm font-medium text-ink">
                {a.label}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                {a.description}
              </span>
              {a.target ? (
                <span className="mt-1.5 block font-mono text-2xs text-ink-faint">
                  {a.target}
                </span>
              ) : null}
            </label>
            {a.usedCount30d > 0 ? (
              <span className="shrink-0 text-right">
                <span data-numeric className="block font-mono text-sm text-ink">
                  {fmt.count(a.usedCount30d)}
                </span>
                <span className="block text-2xs text-ink-faint">
                  in 30 days
                </span>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VoiceSection({
  voiceId,
  onChange,
}: {
  voiceId: string;
  onChange: () => void;
}) {
  const [selected, setSelected] = React.useState(voiceId);
  return (
    <div>
      <SectionHead
        title="Voice"
        body="How the agent sounds on the phone. Samples speak your own greeting so you hear what a caller hears."
      />
      <ul className="space-y-2.5">
        {voices.map((v) => {
          const active = selected === v.id;
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(v.id);
                  onChange();
                }}
                aria-pressed={active}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-sm border p-3.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary-wash"
                    : "border-rule bg-canvas hover:border-ink-faint",
                )}
              >
                <SpeakerHighIcon
                  className={cn(
                    "size-5 shrink-0",
                    active ? "text-primary" : "text-ink-faint",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">
                    {v.name}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {v.tone}
                  </span>
                </span>
                {active ? (
                  <CheckCircleIcon
                    className="size-5 shrink-0 text-primary"
                    weight="fill"
                    aria-hidden
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <Advanced>
        <div className="space-y-5">
          <Field
            label="Speaking pace"
            htmlFor="pace"
            hint="Slower reads as more patient. Faster gets through more calls."
          >
            <Input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              defaultValue="1"
            />
          </Field>
          <div className="flex items-start gap-3">
            <Switch id="interrupt" defaultChecked onCheckedChange={onChange} />
            <label htmlFor="interrupt" className="cursor-pointer">
              <span className="block text-sm font-medium text-ink">
                Let callers interrupt
              </span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                The agent stops talking as soon as the caller starts. Turn this
                off only if your line has heavy background noise.
              </span>
            </label>
          </div>
        </div>
      </Advanced>
    </div>
  );
}

function GuardrailsSection({
  onChange,
  onTransfer,
}: {
  onChange: () => void;
  onTransfer: () => void;
}) {
  return (
    <div>
      <SectionHead
        title="Limits"
        body="What the agent must not do. These override everything else."
      />
      <div className="space-y-5">
        <Field
          label="Never discuss"
          htmlFor="avoid"
          hint="One per line. The agent offers to take a message instead."
        >
          <Textarea
            defaultValue={
              "Treatment prices before an exam\nWhether a specific procedure is covered\nAnything about another patient"
            }
            onChange={onChange}
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-rule bg-canvas p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Handing a caller to a person</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              When to transfer and who to ring are set in one place.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onTransfer}>
            <UserSwitchIcon aria-hidden />
            Transfer settings
          </Button>
        </div>
        <Field
          label="When it does not know"
          htmlFor="fallback"
          hint="Said out loud before taking a message."
        >
          <Textarea
            className="min-h-16"
            defaultValue="I want to get that right rather than guess. Can I take your number and have the office call you back?"
            onChange={onChange}
          />
        </Field>
      </div>
    </div>
  );
}

function DeploySection({
  agent,
  versions,
  numberLabel,
}: {
  agent: Agent;
  versions: AgentVersion[];
  numberLabel: string | null;
}) {
  return (
    <div>
      <SectionHead
        title="Publish"
        body="Where this agent answers, and what changed each time you published."
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-rule bg-canvas p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Phone number</p>
            <p className="mt-0.5 font-mono text-xs text-ink-muted">
              {numberLabel ?? "No number attached yet"}
            </p>
          </div>
          <Button variant="secondary" size="sm">
            {numberLabel ? "Change" : "Attach a number"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-rule bg-canvas p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Website chat</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {agent.channels.includes("chat")
                ? "Answering on your site"
                : "Not on your site yet"}
            </p>
          </div>
          <Button variant="secondary" size="sm">
            Get the snippet
          </Button>
        </div>
      </div>

      {versions.length > 0 ? (
        <div className="mt-6">
          <h4 className="font-display text-sm font-semibold text-ink">
            Publish history
          </h4>
          <ul className="mt-2.5">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-rule py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink">{v.summary}</p>
                  <p className="mt-0.5 font-mono text-2xs text-ink-faint">
                    Version {v.version} · {v.publishedBy} ·{" "}
                    {fmt.relative(v.publishedAt, NOW)}
                  </p>
                </div>
                {v.version !== agent.version ? (
                  <Button variant="quiet" size="sm">
                    Roll back to this
                  </Button>
                ) : (
                  <Badge tone="primary">Current</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
