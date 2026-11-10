"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowsLeftRightIcon,
  BackspaceIcon,
  ChatTextIcon,
  CheckCircleIcon,
  ClockIcon,
  CopyIcon,
  DotsNineIcon,
  EnvelopeIcon,
  LinkSimpleIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PauseIcon,
  PaperPlaneTiltIcon,
  PhoneCallIcon,
  PhoneDisconnectIcon,
  PhoneIcon,
  PlayIcon,
  RobotIcon,
  UserIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type {
  BookingPlatform,
  Contact,
  MessageChannel,
  OutboundGoal,
} from "@/lib/api/types";
import {
  agents,
  bookingServices,
  contacts,
  integrations,
  messageTemplates,
  phoneNumbers,
  workspace,
} from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Outbound: calling someone back, and texting or emailing them, from anywhere
 * in the app.
 *
 * One provider in the shell owns both surfaces, so a Call or Text button on
 * any page opens the same dialer or composer with the right person already
 * filled in. Pages rendered on the server cannot pass a click handler across
 * the client boundary, so they place a `CommsButton`, which is the client leaf
 * that calls into this provider.
 *
 * Calls and sends are simulated during the frontend phase, like every other
 * write in the app, and the dialer says so. When the voice runtime lands it
 * sits behind lib/voice and this file stops pretending.
 */

/* ------------------------------------------------------------------ context */

interface ComposeOptions {
  to?: string;
  channel?: MessageChannel;
  /** Open the booking link picker straight away. */
  withLink?: boolean;
}

interface Comms {
  openDialer: (number?: string) => void;
  openCompose: (opts?: ComposeOptions) => void;
}

const CommsContext = React.createContext<Comms | null>(null);

export function useComms() {
  const ctx = React.useContext(CommsContext);
  if (!ctx) throw new Error("useComms must be used inside CommsProvider");
  return ctx;
}

export function CommsProvider({ children }: { children: React.ReactNode }) {
  const [dialer, setDialer] = React.useState<{ open: boolean; number: string }>({
    open: false,
    number: "",
  });
  const [compose, setCompose] = React.useState<{ open: boolean; opts: ComposeOptions; key: number }>({
    open: false,
    opts: {},
    key: 0,
  });

  const value = React.useMemo<Comms>(
    () => ({
      openDialer: (number) => setDialer({ open: true, number: number ?? "" }),
      openCompose: (opts) =>
        setCompose((c) => ({ open: true, opts: opts ?? {}, key: c.key + 1 })),
    }),
    [],
  );

  return (
    <CommsContext.Provider value={value}>
      {children}
      <Dialer
        open={dialer.open}
        initialNumber={dialer.number}
        onOpenChange={(open) => setDialer((d) => ({ ...d, open }))}
        onTextAfterCall={(to) => {
          setDialer((d) => ({ ...d, open: false }));
          value.openCompose({ to, channel: "sms", withLink: true });
        }}
      />
      <Compose
        key={compose.key}
        open={compose.open}
        opts={compose.opts}
        onOpenChange={(open) => setCompose((c) => ({ ...c, open }))}
      />
    </CommsContext.Provider>
  );
}

/* -------------------------------------------------------------- the button */

const ACTION: Record<
  "call" | "text" | "email" | "link",
  { icon: Icon; channel?: MessageChannel }
> = {
  call: { icon: PhoneIcon },
  text: { icon: ChatTextIcon, channel: "sms" },
  email: { icon: EnvelopeIcon, channel: "email" },
  link: { icon: LinkSimpleIcon, channel: "sms" },
};

/** A Call, Text, Email or booking-link button any page can place. */
export function CommsButton({
  action,
  to,
  label,
  iconOnly,
  variant = "secondary",
  size = "sm",
  disabled,
  className,
}: {
  action: keyof typeof ACTION;
  to?: string | null;
  label: string;
  iconOnly?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  disabled?: boolean;
  className?: string;
}) {
  const { openDialer, openCompose } = useComms();
  const a = ACTION[action];
  const ActionIcon = a.icon;
  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon-sm" : size}
      disabled={disabled}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={className}
      onClick={() =>
        action === "call"
          ? openDialer(to ?? undefined)
          : openCompose({ to: to ?? undefined, channel: a.channel, withLink: action === "link" })
      }
    >
      <ActionIcon aria-hidden />
      {iconOnly ? null : label}
    </Button>
  );
}

/* ------------------------------------------------------------------ helpers */

const digits = (s: string) => s.replace(/\D/g, "");
const toE164 = (s: string) => {
  const d = digits(s);
  return d.length >= 10 ? `+1${d.slice(-10)}` : null;
};
function findContact(query: string): Contact | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const d = digits(q);
  return contacts.find(
    (c) =>
      (d.length >= 7 && digits(c.e164).endsWith(d.slice(-10))) ||
      c.name?.toLowerCase() === q ||
      c.email?.toLowerCase() === q,
  );
}
function who(c: Contact | undefined, fallback: string) {
  return c?.name ?? (toE164(fallback) ? fmt.phone(toE164(fallback)) : fallback);
}

/** A side panel built on the Radix dialog, so focus, Escape and the overlay come for free. */
function Panel({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  side?: "right" | "center";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgb(10_10_10/0.36)] backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border border-rule bg-surface shadow-overlay focus:outline-none",
            side === "right"
              ? "inset-y-3 right-3 w-[calc(100vw-1.5rem)] max-w-[25rem] rounded-[1.75rem]"
              : "left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem]",
            className,
          )}
        >
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
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ================================================================== DIALER */

const GOALS: Record<OutboundGoal, { label: string; body: string }> = {
  confirm: { label: "Confirm a booking", body: "Confirms the time, and offers another if it no longer works." },
  reschedule: { label: "Move a booking", body: "Finds a new time that suits them and updates the calendar." },
  "follow-up": { label: "Follow up", body: "Picks up where the last conversation left off." },
  recall: { label: "Bring them back in", body: "Offers the next open times for a visit that is due." },
};

/** What the agent's side of an outbound call sounds like, by goal. Illustrative. */
const SCRIPTS: Record<OutboundGoal, { who: "agent" | "them"; text: string }[]> = {
  confirm: [
    { who: "agent", text: "Hi, this is Maren from Alder Creek Dental, calling to confirm Thursday at 9:40." },
    { who: "them", text: "Oh, yes. Thursday is still fine." },
    { who: "agent", text: "Lovely. I will text you the address and the forms. See you Thursday." },
  ],
  reschedule: [
    { who: "agent", text: "Hi, this is Maren from Alder Creek Dental. We need to move your Thursday visit." },
    { who: "them", text: "Okay. Do you have anything on Friday?" },
    { who: "agent", text: "Friday at 2:20 is open. I have moved you, and the new time is on its way by text." },
  ],
  "follow-up": [
    { who: "agent", text: "Hi, it is Maren from Alder Creek Dental, following up on your call yesterday." },
    { who: "them", text: "Thanks for calling back. Did you find out about my insurance?" },
    { who: "agent", text: "We did, and you are covered. Would you like me to book the visit now?" },
  ],
  recall: [
    { who: "agent", text: "Hi, this is Maren from Alder Creek Dental. You are due for a cleaning." },
    { who: "them", text: "Right, I keep forgetting. What do you have?" },
    { who: "agent", text: "Tuesday at 8:10 or Wednesday at 4:30. I can hold either for you." },
  ],
};

const PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"] as const;

type Phase = "idle" | "ringing" | "live" | "ended";

function Dialer({
  open,
  initialNumber,
  onOpenChange,
  onTextAfterCall,
}: {
  open: boolean;
  initialNumber: string;
  onOpenChange: (open: boolean) => void;
  onTextAfterCall: (to: string) => void;
}) {
  const [number, setNumber] = React.useState(initialNumber);
  const [mode, setMode] = React.useState<"you" | "agent">("you");
  const [goal, setGoal] = React.useState<OutboundGoal>("confirm");
  const callable = phoneNumbers.filter((n) => n.status === "active");
  const [fromId, setFromId] = React.useState(callable[0]?.id ?? "");
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const [pad, setPad] = React.useState(false);
  const [lines, setLines] = React.useState(0);
  const timers = React.useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    timers.current = [];
  };
  React.useEffect(() => clear, []);

  // A fresh number each time the panel opens with one.
  React.useEffect(() => {
    // Show a number the way people read it, not as stored.
    if (open && phase === "idle")
      setNumber(toE164(initialNumber) ? fmt.phone(toE164(initialNumber)) : initialNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialNumber]);

  const contact = findContact(number);
  const e164 = toE164(number);
  const from = callable.find((n) => n.id === fromId);
  const fromAgent = agents.find((a) => a.id === from?.agentId);
  const script = SCRIPTS[goal];

  function start() {
    if (!e164) return;
    clear();
    setSeconds(0);
    setLines(0);
    setMuted(false);
    setHeld(false);
    setPhase("ringing");
    timers.current.push(
      window.setTimeout(() => {
        setPhase("live");
        timers.current.push(window.setInterval(() => setSeconds((s) => s + 1), 1000));
        if (mode === "agent") {
          script.forEach((_, i) =>
            timers.current.push(window.setTimeout(() => setLines(i + 1), 900 + i * 2300)),
          );
        }
      }, 1800),
    );
  }

  function end() {
    clear();
    setPhase("ended");
  }

  function reset() {
    clear();
    setPhase("idle");
    setSeconds(0);
    setLines(0);
    setPad(false);
  }

  const press = (k: string) => setNumber((n) => (n + k).slice(0, 20));
  const recent = [...contacts]
    .sort((a, b) => Number(Boolean(b.followUp)) - Number(Boolean(a.followUp)))
    .slice(0, 4);

  return (
    <Panel
      open={open}
      onOpenChange={(o) => {
        if (!o && (phase === "live" || phase === "ringing")) end();
        onOpenChange(o);
        if (!o) window.setTimeout(reset, 250);
      }}
      title={phase === "idle" ? "Make a call" : phase === "ended" ? "Call ended" : "On a call"}
      description={
        phase === "idle"
          ? "Call yourself, or have an agent call for you."
          : `${mode === "agent" ? `${fromAgent?.name ?? "The agent"} is calling` : "You are calling"} from ${fmt.phone(from?.e164 ?? null)}`
      }
    >
      {phase === "idle" ? (
        <div className="space-y-5 px-6 py-5">
          {/* Who places the call. */}
          <div role="group" aria-label="Who makes the call" className="grid grid-cols-2 gap-2">
            {(
              [
                ["you", "You call", UserIcon],
                ["agent", "Agent calls", RobotIcon],
              ] as const
            ).map(([value, label, ModeIcon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                  mode === value
                    ? "border-primary/40 bg-primary-wash text-primary"
                    : "border-rule text-ink-muted hover:border-rule-control hover:text-ink",
                )}
              >
                <ModeIcon aria-hidden className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <Field label="Number or name" htmlFor="dial-number">
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="(541) 555 0182"
              className="font-mono text-lg"
            />
          </Field>
          {contact ? (
            <p className="-mt-3 flex items-center gap-2 text-sm text-ink-muted">
              <CheckCircleIcon aria-hidden className="size-4 text-success" />
              {contact.name ?? "Known caller"}, {contact.conversations}{" "}
              {contact.conversations === 1 ? "conversation" : "conversations"} before
            </p>
          ) : null}

          {/* Keypad. */}
          <div className="grid grid-cols-3 gap-2">
            {PAD.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                aria-label={`Dial ${k}`}
                className="h-12 rounded-2xl bg-panel font-mono text-lg font-medium text-ink transition-colors hover:bg-sunken active:scale-[0.97]"
              >
                {k}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={() => setNumber((n) => n.slice(0, -1))}
              disabled={!number}
            >
              <BackspaceIcon aria-hidden />
              Delete
            </Button>
          </div>

          <Field label="Call from" htmlFor="dial-from" hint="The caller sees this number.">
            <Select value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {callable.map((n) => (
                <option key={n.id} value={n.id}>
                  {fmt.phone(n.e164)}, {n.label}
                </option>
              ))}
            </Select>
          </Field>

          {mode === "agent" ? (
            <Field label="What should it do" htmlFor="dial-goal" hint={GOALS[goal].body}>
              <Select value={goal} onChange={(e) => setGoal(e.target.value as OutboundGoal)}>
                {(Object.keys(GOALS) as OutboundGoal[]).map((g) => (
                  <option key={g} value={g}>
                    {GOALS[g].label}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!e164}
            onClick={start}
          >
            <PhoneCallIcon aria-hidden />
            {mode === "agent" ? "Have the agent call" : "Call"}{" "}
            {e164 ? who(contact, number) : ""}
          </Button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Waiting on a call back
            </p>
            <ul className="mt-2 space-y-1">
              {recent.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setNumber(fmt.phone(c.e164))}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-panel"
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary-wash text-xs font-semibold text-primary">
                      {c.name ? fmt.initials(c.name) : "#"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {c.name ?? fmt.phone(c.e164)}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {c.followUp ?? `Last ${fmt.relative(c.lastContactAt, new Date())}`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          {/* The person, large. */}
          <div className="relative overflow-hidden bg-band-violet px-6 py-8 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-[#7c4dff] opacity-30 blur-[90px]"
            />
            <span className="relative mx-auto flex size-20 items-center justify-center">
              {phase !== "ended" ? (
                <span
                  aria-hidden
                  className="animate-halo absolute inset-0 rounded-full border-2 border-band-violet-ink motion-reduce:hidden"
                />
              ) : null}
              <span className="flex size-20 items-center justify-center rounded-full bg-band-violet-ink font-display text-2xl font-semibold text-[#1a0d3d]">
                {contact?.name ? fmt.initials(contact.name) : <PhoneIcon aria-hidden className="size-8" />}
              </span>
            </span>
            <p className="relative mt-4 font-display text-2xl font-semibold text-on-media">
              {who(contact, number)}
            </p>
            <p className="relative mt-1 font-mono text-sm text-on-media-muted" aria-live="polite">
              {phase === "ringing"
                ? "Ringing"
                : phase === "ended"
                  ? `Ended after ${fmt.duration(seconds)}`
                  : `${held ? "On hold" : "Connected"} · ${fmt.duration(seconds)}`}
            </p>
          </div>

          {/* Agent calls show what is being said. */}
          {mode === "agent" ? (
            <ul aria-label="Live transcript" className="flex-1 space-y-2.5 px-6 py-5">
              {script.slice(0, lines).map((l, i) => (
                <li
                  key={i}
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    l.who === "agent"
                      ? "rounded-bl-md bg-primary-wash text-ink"
                      : "ml-auto rounded-br-md bg-panel text-ink",
                  )}
                >
                  <span className="mb-0.5 block text-2xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    {l.who === "agent" ? fromAgent?.name ?? "Agent" : who(contact, number)}
                  </span>
                  {l.text}
                </li>
              ))}
              {phase === "live" && lines < script.length ? (
                <li className="text-xs text-ink-muted">Listening</li>
              ) : null}
            </ul>
          ) : (
            <div className="flex-1 px-6 py-5">
              <p className="rounded-xl bg-panel px-4 py-3 text-sm text-ink-muted">
                This call is recorded and transcribed, the same as the ones the
                agent takes. It will appear in Conversations when you hang up.
              </p>
              {pad && phase === "live" ? (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {PAD.map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-label={`Send ${k}`}
                      className="h-11 rounded-2xl bg-panel font-mono text-lg text-ink hover:bg-sunken"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {phase === "ended" ? (
            <div className="space-y-2.5 border-t border-rule px-6 py-5">
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => onTextAfterCall(e164 ?? number)}
              >
                <LinkSimpleIcon aria-hidden />
                Text them a booking link
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={reset}>
                New call
              </Button>
            </div>
          ) : (
            <div className="border-t border-rule px-6 py-5">
              {mode === "you" ? (
                <div className="mb-4 grid grid-cols-4 gap-2">
                  {[
                    { label: muted ? "Unmute" : "Mute", icon: muted ? MicrophoneSlashIcon : MicrophoneIcon, on: muted, act: () => setMuted((m) => !m) },
                    { label: held ? "Resume" : "Hold", icon: held ? PlayIcon : PauseIcon, on: held, act: () => setHeld((h) => !h) },
                    { label: "Keypad", icon: DotsNineIcon, on: pad, act: () => setPad((p) => !p) },
                    { label: "Transfer", icon: ArrowsLeftRightIcon, on: false, act: () => toast("Transfers follow the routing set on each phone number.") },
                  ].map((c) => {
                    const CIcon = c.icon;
                    return (
                      <button
                        key={c.label}
                        type="button"
                        aria-pressed={c.on}
                        disabled={phase !== "live"}
                        onClick={c.act}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-2xl py-2.5 text-xs font-medium transition-colors disabled:opacity-40",
                          c.on ? "bg-primary-wash text-primary" : "bg-panel text-ink-muted hover:text-ink",
                        )}
                      >
                        <CIcon aria-hidden className="size-5" />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <Button type="button" variant="danger" size="lg" className="w-full" onClick={end}>
                <PhoneDisconnectIcon aria-hidden />
                {mode === "agent" ? "Stop the call" : "Hang up"}
              </Button>
            </div>
          )}
          <p className="px-6 pb-4 text-center text-2xs text-ink-faint">
            Calls are simulated until the voice service is connected.
          </p>
        </div>
      )}
    </Panel>
  );
}

/* ================================================================= COMPOSE */

const PLATFORM: Record<BookingPlatform, { label: string; key: string }> = {
  calendar: { label: "Your online booking page", key: "curve" },
  fareharbor: { label: "FareHarbor", key: "fareharbor" },
  "ezra-pro": { label: "Ezra Pro", key: "ezra-pro" },
};

function platformReady(p: BookingPlatform) {
  if (p === "calendar") return true;
  return integrations.find((i) => i.key === PLATFORM[p].key)?.status === "connected";
}

/** Short, unambiguous link codes: no 0/O, no 1/l. */
function linkCode() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function fill(text: string, c: Contact | undefined, link: string | null) {
  return text
    .replaceAll("{first_name}", c?.name?.split(" ")[0] ?? "there")
    .replaceAll("{business}", "Alder Creek Dental")
    .replaceAll("{business_phone}", "(541) 388-2014")
    .replaceAll("{booking_link}", link ?? "{booking_link}")
    .replaceAll("{location}", "our Bend office")
    .replaceAll("{booking_time}", "Thursday at 9:40am")
    .replaceAll("{callback_window}", "before noon tomorrow")
    .replaceAll("{call_date}", "Monday");
}

function Compose({
  open,
  opts,
  onOpenChange,
}: {
  open: boolean;
  opts: ComposeOptions;
  onOpenChange: (open: boolean) => void;
}) {
  const [to, setTo] = React.useState(opts.to ? (toE164(opts.to) ? fmt.phone(toE164(opts.to)) : opts.to) : "");
  const [channel, setChannel] = React.useState<MessageChannel>(opts.channel ?? "sms");
  const initialTemplate = opts.withLink ? "mt_link" : "";
  const [templateId, setTemplateId] = React.useState(initialTemplate);
  const contact = findContact(to);
  const tpl = messageTemplates.find((t) => t.id === templateId);
  const [subject, setSubject] = React.useState(tpl?.subject ?? "");
  const [body, setBody] = React.useState(tpl ? tpl.body : "");
  const [picker, setPicker] = React.useState(Boolean(opts.withLink));
  const [platform, setPlatform] = React.useState<BookingPlatform>("calendar");
  const [serviceId, setServiceId] = React.useState(
    bookingServices.find((s) => s.platform === "calendar")?.id ?? "",
  );
  const [links, setLinks] = React.useState<{ url: string; service: string }[]>([]);
  const [when, setWhen] = React.useState<"now" | "later">("now");
  const [at, setAt] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const services = bookingServices.filter((s) => s.platform === platform);
  const ready = platformReady(platform);
  const lastLink = links[links.length - 1]?.url ?? null;
  const rendered = fill(body, contact, lastLink);
  const segments = rendered.length <= 160 ? 1 : Math.ceil(rendered.length / 153);

  function chooseTemplate(id: string) {
    setTemplateId(id);
    const t = messageTemplates.find((x) => x.id === id);
    if (!t) return;
    setBody(t.body);
    if (t.subject) setSubject(t.subject);
    if (t.body.includes("{booking_link}")) setPicker(true);
  }

  function insertLink() {
    const service = bookingServices.find((s) => s.id === serviceId);
    if (!service || !ready) return;
    const url = `ezra.to/b/${linkCode()}`;
    setLinks((l) => [...l, { url, service: service.name }]);
    setBody((b) => (b.includes("{booking_link}") ? b : `${b}${b && !b.endsWith(" ") ? " " : ""}{booking_link}`));
    toast.success("Booking link added. It counts toward your booking link numbers.");
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const isEmail = /\S+@\S+\.\S+/.test(to);
    if (!to.trim()) return setError("Add who this goes to.");
    if (channel === "sms" && !toE164(to) && !contact) return setError("That is not a phone number we can text.");
    if (channel === "email" && !isEmail && !contact?.email)
      return setError(`We do not have an email for ${who(contact, to)}. Send a text instead, or type their email.`);
    if (!body.trim()) return setError("The message is empty.");
    if (body.includes("{booking_link}") && !lastLink) return setError("Add the booking link before sending.");
    if (when === "later" && !at) return setError("Pick when it should go out.");
    toast.success(
      `${when === "later" ? "Scheduled" : "Sent"} to ${who(contact, to)}${lastLink ? ". The link is tracked under Booking links." : "."}`,
    );
    onOpenChange(false);
  }

  return (
    <Panel
      open={open}
      onOpenChange={onOpenChange}
      side="center"
      title="New message"
      description="Text or email someone, with a booking link if they need one."
    >
      <form onSubmit={send} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5 px-6 py-5">
          <Field label="To" htmlFor="compose-to" hint="A name, a phone number, or an email.">
            <Input
              list="compose-contacts"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              autoComplete="off"
              placeholder="Marisol Vega"
            />
          </Field>
          <datalist id="compose-contacts">
            {contacts.map((c) => (
              <option key={c.id} value={c.name ?? fmt.phone(c.e164)}>
                {fmt.phone(c.e164)}
              </option>
            ))}
          </datalist>
          {contact ? (
            <p className="-mt-3 text-sm text-ink-muted">
              {fmt.phone(contact.e164)}
              {contact.email ? ` · ${contact.email}` : " · no email on file"}
            </p>
          ) : null}

          <div>
            <p className="text-sm font-medium text-ink" id="compose-channel">
              Send as
            </p>
            <div role="group" aria-labelledby="compose-channel" className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ["sms", "Text message", ChatTextIcon],
                  ["email", "Email", EnvelopeIcon],
                ] as const
              ).map(([value, label, CIcon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={channel === value}
                  onClick={() => setChannel(value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                    channel === value
                      ? "border-primary/40 bg-primary-wash text-primary"
                      : "border-rule text-ink-muted hover:border-rule-control hover:text-ink",
                  )}
                >
                  <CIcon aria-hidden className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Start from a template" htmlFor="compose-template">
            <Select value={templateId} onChange={(e) => chooseTemplate(e.target.value)}>
              <option value="">Write my own</option>
              {messageTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>

          {channel === "email" ? (
            <Field label="Subject" htmlFor="compose-subject">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
          ) : null}

          <Field
            label="Message"
            htmlFor="compose-body"
            hint="{booking_link} is replaced with the link you add below."
          >
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-32" />
          </Field>

          {/* Booking link. */}
          <div className="rounded-2xl border border-rule bg-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <LinkSimpleIcon aria-hidden className="size-4 text-primary" />
                Booking link
              </p>
              {!picker ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => setPicker(true)}>
                  Add a booking link
                </Button>
              ) : null}
            </div>
            {picker ? (
              <div className="mt-3 grid grid-cols-1 gap-3">
                <Field label="Book through" htmlFor="compose-platform">
                  <Select
                    value={platform}
                    onChange={(e) => {
                      const p = e.target.value as BookingPlatform;
                      setPlatform(p);
                      setServiceId(bookingServices.find((s) => s.platform === p)?.id ?? "");
                    }}
                  >
                    {(Object.keys(PLATFORM) as BookingPlatform[]).map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM[p].label}
                        {platformReady(p) ? "" : " (not connected)"}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="For" htmlFor="compose-service">
                  <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={!ready}>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}, {s.durationMinutes} min
                      </option>
                    ))}
                  </Select>
                </Field>
                <div>
                  {ready ? (
                    <Button type="button" variant="primary" size="sm" onClick={insertLink}>
                      Insert the link
                    </Button>
                  ) : (
                    <p className="text-sm text-ink-muted">
                      {PLATFORM[platform].label} is not connected yet.{" "}
                      <Link
                        href="/integrations"
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        Connect it
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            ) : null}
            {links.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {links.map((l) => (
                  <li
                    key={l.url}
                    className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 ring-1 ring-rule"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-sm text-ink">{l.url}</span>
                      <span className="block truncate text-xs text-ink-muted">{l.service} · tracked</span>
                    </span>
                    <Button
                      type="button"
                      variant="quiet"
                      size="icon-sm"
                      aria-label={`Copy ${l.url}`}
                      onClick={() => {
                        void navigator.clipboard?.writeText(`https://${l.url}`).catch(() => {});
                        toast("Link copied.");
                      }}
                    >
                      <CopyIcon aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* When. */}
          <div className="flex flex-wrap items-end gap-3">
            <div role="group" aria-label="When to send" className="flex gap-1 rounded-full bg-panel p-1">
              {(
                [
                  ["now", "Send now"],
                  ["later", "Schedule"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={when === v}
                  onClick={() => setWhen(v)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    when === v ? "bg-surface text-ink shadow-raised" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {when === "later" ? (
              <Field label="Send at" htmlFor="compose-at" className="min-w-[14rem]">
                <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
              </Field>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-danger-wash px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>

        {/* Preview. */}
        <aside className="border-t border-rule bg-panel px-6 py-5 lg:border-l lg:border-t-0">
          <p className="text-sm font-semibold text-ink">What they receive</p>
          {channel === "sms" ? (
            <div className="mt-3">
              <p className="text-xs text-ink-muted">Text from (541) 388-2014</p>
              <p className="mt-1.5 whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink shadow-raised">
                {rendered || "Nothing yet."}
              </p>
              <p className="mt-1.5 text-xs text-ink-muted">
                <span data-numeric className="font-mono">{rendered.length}</span> characters,{" "}
                {segments === 1 ? "one text" : `${segments} texts`}
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-surface p-4 shadow-raised">
              <p className="text-xs text-ink-muted">From {workspace.name}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{fill(subject, contact, lastLink) || "No subject"}</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-muted">
                {rendered || "Nothing yet."}
              </p>
              {lastLink ? (
                <span className="mt-3 inline-block rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas">
                  Book a time
                </span>
              ) : null}
            </div>
          )}
          <div className="mt-6 space-y-2">
            <Button type="submit" variant="primary" className="w-full">
              {when === "later" ? <ClockIcon aria-hidden /> : <PaperPlaneTiltIcon aria-hidden />}
              {when === "later" ? "Schedule it" : channel === "sms" ? "Send the text" : "Send the email"}
            </Button>
            <p className="text-center text-2xs text-ink-faint">Sends are simulated in this preview.</p>
          </div>
        </aside>
      </form>
    </Panel>
  );
}
