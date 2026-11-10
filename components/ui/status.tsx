"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { AgentStatus, ConversationOutcome } from "@/lib/api/types";

/**
 * Status vocabulary. Every state is carried by a word, never by colour alone.
 * Signal orange means one thing: a line is live.
 */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-rule bg-raised text-ink-muted",
        primary: "border-primary/25 bg-primary-wash text-primary",
        success: "border-success/25 bg-success-wash text-success",
        warning: "border-warning/25 bg-warning-wash text-warning",
        danger: "border-danger/25 bg-danger-wash text-danger",
        signal: "border-signal/30 bg-signal-wash text-signal",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/**
 * The one continuously animated element in the system. It reports real state,
 * so the motion is earned: a core dot that breathes and a ring that expands
 * out of it like a transmission.
 *
 * Under reduced motion the dot renders solid, the ring is gone, and the word
 * remains. No state is lost.
 */
export function LiveIndicator({
  label = "Live",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal-wash px-2.5 py-0.5 text-2xs font-medium text-signal",
        className,
      )}
    >
      <span
        aria-hidden
        className="relative flex size-1.5 items-center justify-center"
      >
        <span className="absolute inset-0 rounded-full bg-signal-live animate-ring motion-reduce:hidden" />
        <span className="relative size-1.5 rounded-full bg-signal-live animate-live-pulse" />
      </span>
      {label}
    </span>
  );
}

const AGENT_STATUS: Record<
  AgentStatus,
  { label: string; tone: BadgeProps["tone"] }
> = {
  live: { label: "Live", tone: "signal" },
  paused: { label: "Paused", tone: "warning" },
  draft: { label: "Draft", tone: "neutral" },
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  if (status === "live") return <LiveIndicator />;
  const { label, tone } = AGENT_STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const OUTCOME: Record<
  ConversationOutcome,
  { label: string; tone: BadgeProps["tone"] }
> = {
  booked: { label: "Booked", tone: "success" },
  lead: { label: "Lead captured", tone: "primary" },
  answered: { label: "Answered", tone: "neutral" },
  transferred: { label: "Transferred", tone: "primary" },
  message: { label: "Message taken", tone: "warning" },
  missed: { label: "Dropped", tone: "danger" },
};

export function OutcomeBadge({ outcome }: { outcome: ConversationOutcome }) {
  const { label, tone } = OUTCOME[outcome];
  return <Badge tone={tone}>{label}</Badge>;
}
