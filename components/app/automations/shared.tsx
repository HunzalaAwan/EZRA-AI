"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeftIcon, ArrowDownRightIcon, ArrowUpRightIcon, ChatTextIcon, EnvelopeIcon, StarIcon, type Icon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/field";
import type { MessageChannel, ReviewPlatformKey } from "@/lib/api/types";
import { EMAIL_VARS, fillSample } from "@/lib/email";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The pieces every automation screen shares: the header with its on switch,
 * the save bar, the detail chips, a phone thread for previews, and the
 * funnel that says how many got from one step to the next.
 */

export const fill = fillSample;

export function after(h: number) {
  if (h < 24) return h === 1 ? "1 hour" : `${h} hours`;
  if (h === 24) return "1 day";
  const d = Math.round(h / 24);
  return d === 7 ? "1 week" : `${d} days`;
}

export const CHANNEL: Record<MessageChannel, { label: string; icon: Icon }> = {
  sms: { label: "Text", icon: ChatTextIcon },
  email: { label: "Email", icon: EnvelopeIcon },
};

export const PLATFORM: Record<ReviewPlatformKey, { label: string; hint: string }> = {
  google: { label: "Google", hint: "Your Google Business Profile review link." },
  facebook: { label: "Facebook", hint: "Your page's reviews tab." },
  tripadvisor: { label: "Tripadvisor", hint: "Best for tours, activities, and attractions." },
  website: { label: "Your website", hint: "A testimonials or feedback page you run." },
};

/* ---------------------------------------------------------------- header */

export function DetailHeader({
  title,
  body,
  enabled,
  onToggle,
  switchLabel,
  back,
  children,
}: {
  title: string;
  body: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  switchLabel: string;
  /** A way back to the list, for screens one level below a tab. */
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {back ? (
        <Link
          href={back.href as Route}
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon aria-hidden className="size-4" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">{title}</h2>
          <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">{body}</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-rule bg-surface py-1.5 pl-4 pr-2">
          <label htmlFor="automation-on" className="cursor-pointer text-sm font-medium text-ink">
            {enabled ? "On" : "Off"}
            <span className="sr-only">, {switchLabel}</span>
          </label>
          <Switch id="automation-on" checked={enabled} onCheckedChange={onToggle} />
        </div>
      </div>
      {children}
    </div>
  );
}

/** Keeps the chosen tab in the address, so a link can open Setup directly. */
export function useTabParam<T extends string>(initial: T) {
  const [tab, setTab] = React.useState<T>(initial);
  const change = React.useCallback((v: string) => {
    setTab(v as T);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", v);
    window.history.replaceState(null, "", url);
  }, []);
  return [tab, change] as const;
}

/* -------------------------------------------------------------- save bar */

export function SaveBar({
  dirty,
  note,
  saving,
  onDiscard,
  onSave,
  saveLabel = "Save changes",
}: {
  dirty: boolean;
  note: string;
  saving?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <AnimatePresence>
      {dirty ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="sticky bottom-4 z-30 mx-auto flex w-fit max-w-full flex-wrap items-center gap-3 rounded-full border border-rule bg-surface py-2 pl-5 pr-2 shadow-overlay"
          role="region"
          aria-label="Unsaved changes"
        >
          <span className="text-sm text-ink">{note}</span>
          <Button variant="secondary" size="sm" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={onSave}>
            {saveLabel}
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------ text tools */

export function VarChips({ onInsert, keys }: { onInsert: (k: string) => void; keys: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Details you can insert">
      <span className="mr-0.5 text-2xs text-ink-muted">Insert</span>
      {EMAIL_VARS.filter((v) => keys.includes(v.key)).map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onInsert(v.key)}
          className="cursor-pointer rounded-full border border-rule bg-canvas px-2.5 py-1 text-2xs text-ink-muted transition-colors hover:border-primary/40 hover:text-primary"
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

/** A text field that accepts detail chips at the cursor. */
export function useInsert<E extends HTMLTextAreaElement | HTMLInputElement>(value: string, onChange: (v: string) => void) {
  const ref = React.useRef<E>(null);
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

/** One text holds 160 characters; past that it is billed in 153-character parts. */
export function smsParts(text: string) {
  const n = fill(text).length + " Reply STOP to opt out".length;
  return { chars: n, parts: n <= 160 ? 1 : Math.ceil(n / 153) };
}

export function ChannelToggle({
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
              "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
              on ? "border-primary/40 bg-primary-wash text-primary" : "border-rule-control text-ink-muted hover:text-ink",
            )}
          >
            <CIcon aria-hidden className="size-4" />
            {CHANNEL[c].label}
          </button>
        );
      })}
    </div>
  );
}

export function Rule({
  id,
  label,
  hint,
  checked,
  onChange,
  locked,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
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

/** A section of a setup screen: a heading, a line of why, and its controls. */
export function Panel({ title, body, children, className }: { title: string; body?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-rule bg-surface p-5 sm:p-6", className)}>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {body ? <p className="mt-0.5 max-w-[62ch] text-sm leading-relaxed text-ink-muted">{body}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------ previews */

/** A phone showing a text thread from the business. */
export function PhoneThread({ children, from = "(541) 388-2014" }: { children: React.ReactNode; from?: string }) {
  return (
    <div className="mx-auto w-full max-w-[20rem] overflow-hidden rounded-[2.25rem] border-[6px] border-[#1f1f26] bg-surface shadow-[0_24px_60px_-28px_rgb(0_0_0/0.5)]">
      <div className="border-b border-rule bg-panel px-4 pb-3 pt-4 text-center">
        <span aria-hidden className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-ink">
          AC
        </span>
        <p className="text-xs font-medium text-ink">Alder Creek Dental</p>
        <p data-numeric className="font-mono text-2xs text-ink-muted">
          {from}
        </p>
      </div>
      <div className="max-h-[32rem] min-h-[22rem] space-y-2.5 overflow-y-auto bg-surface px-3.5 py-4">{children}</div>
    </div>
  );
}

export function ThreadTime({ children }: { children: React.ReactNode }) {
  return <p className="pt-1 text-center text-2xs font-medium text-ink-muted">{children}</p>;
}

export function Bubble({
  text,
  from = "business",
  optOut,
  active,
}: {
  text: string;
  from?: "business" | "customer";
  optOut?: boolean;
  active?: boolean;
}) {
  const customer = from === "customer";
  return (
    <p
      className={cn(
        "w-fit max-w-[85%] whitespace-pre-line px-3.5 py-2.5 text-sm leading-relaxed transition-shadow",
        customer ? "ml-auto rounded-2xl rounded-br-md bg-primary text-on-primary" : "rounded-2xl rounded-bl-md bg-panel text-ink",
        active && "ring-2 ring-primary ring-offset-2 ring-offset-surface",
      )}
    >
      {text || "Nothing written yet."}
      {optOut ? <span className="mt-1 block text-xs text-ink-muted">Reply STOP to opt out</span> : null}
    </p>
  );
}

/* --------------------------------------------------------------- results */

/** A stat with what it is compared against, written as words and an arrow. */
export function Stat({
  label,
  value,
  note,
  delta,
}: {
  label: string;
  value: string;
  note?: string;
  delta?: { current: number; previous: number };
}) {
  const d = delta ? fmt.delta(delta.current, delta.previous) : null;
  return (
    <div className="min-w-0 bg-surface px-5 py-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span data-numeric className="font-mono text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-ink">
            {value}
          </span>
          {note ? (
            <span data-numeric className="font-mono text-xs text-ink-muted">
              {note}
            </span>
          ) : null}
        </span>
        {d ? (
          <span className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
            {d.direction === "up" ? (
              <ArrowUpRightIcon aria-hidden className="size-3.5 text-success" />
            ) : d.direction === "down" ? (
              <ArrowDownRightIcon aria-hidden className="size-3.5 text-danger" />
            ) : null}
            <span data-numeric className="font-mono text-ink">
              {d.text}
            </span>
            vs the 30 days before
          </span>
        ) : null}
      </dd>
    </div>
  );
}

export function StatStrip({ children }: { children: React.ReactNode }) {
  // A one-pixel gap over the rule colour draws the dividers at every width.
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </dl>
  );
}

/**
 * How many got from each step to the next. One hue: the steps are named on
 * the left and carry identity themselves, and the width is a share of the
 * first step, so the bars never need an axis.
 */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const first = steps[0]?.value || 1;
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1]!.value : null;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink">{s.label}</span>
              <span className="flex items-baseline gap-2">
                <span data-numeric className="font-mono font-semibold text-ink">
                  {fmt.count(s.value)}
                </span>
                {prev !== null ? (
                  <span data-numeric className="w-14 text-right font-mono text-xs text-ink-muted">
                    {fmt.percent(prev ? s.value / prev : 0)}
                  </span>
                ) : (
                  <span className="w-14" />
                )}
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max((s.value / first) * 100, 1.5)}%`, background: "var(--color-series-1)" }}
              />
            </div>
          </li>
        );
      })}
      <li className="text-xs text-ink-muted">Percentages are of the step above.</li>
    </ol>
  );
}

/** A filter row of pill buttons with counts. */
export function FilterPills<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string; count: number }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
            value === o.key ? "border-ink bg-ink text-canvas" : "border-rule text-ink-muted hover:border-rule-control hover:text-ink",
          )}
        >
          {o.label}
          <span data-numeric className="font-mono">
            {o.count}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span role="img" aria-label={`${value} of 5 stars`} className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarGlyph key={i} filled={i < Math.round(value)} className={size} />
      ))}
    </span>
  );
}


function StarGlyph({ filled, className }: { filled: boolean; className: string }) {
  return <StarIcon aria-hidden weight={filled ? "fill" : "regular"} className={cn(className, filled ? "text-ink" : "text-ink-faint")} />;
}
