"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ClockCountdownIcon,
  GearSixIcon,
  PhoneIcon,
  PlusIcon,
  UserSwitchIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, type BadgeProps } from "@/components/ui/status";
import { RoutingPanel, RouteSummary, type RouteDirectory } from "./routing";
import type { AgentTransfer, PhoneNumber } from "@/lib/api/types";
import * as fmt from "@/lib/format";
import { transferIncomplete, transferTargets } from "@/lib/transfer";

/**
 * The EZRA numbers, each with where its calls go.
 *
 * Every row reads as a number and its route: who rings first, then next.
 * "Set up routing" opens the same editor a forwarded line uses, so there is
 * one way to say where a call goes, whichever company owns the number.
 *
 * Every state is carried by a word. Signal orange stays reserved for a live
 * line, so nothing here borrows it.
 */
const STATUS: Record<PhoneNumber["status"], { label: string; tone: BadgeProps["tone"] }> = {
  active: { label: "Answering", tone: "success" },
  porting: { label: "Moving over", tone: "warning" },
  forwarding: { label: "Forwarded here", tone: "primary" },
};

/** Phone companies quote 7 to 10 business days. This is the date we promised. */
const PORTING_READY_BY = "Sep 29";

export function NumbersPanel({
  numbers: initial,
  directory,
  transfers,
}: {
  numbers: PhoneNumber[];
  directory: RouteDirectory;
  /** Per agent: who it puts a caller through to once it has the call. */
  transfers: Record<string, AgentTransfer>;
}) {
  const [numbers, setNumbers] = React.useState(initial);
  const [editing, setEditing] = React.useState<string | null>(null);
  const current = numbers.find((n) => n.id === editing);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-ink-muted">
          <span data-numeric className="font-semibold text-ink">{numbers.length}</span> numbers
        </p>
        <Button variant="primary">
          <PlusIcon aria-hidden weight="bold" />
          Get a new number
        </Button>
      </div>

      <Card className="overflow-hidden">
        {numbers.length === 0 ? (
          <EmptyState
            icon={PhoneIcon}
            title="No phone numbers yet"
            body="Get a local number and choose where it rings, or keep the number you already have and forward it."
          />
        ) : (
          <ul>
            {numbers.map((n) => {
              const status = STATUS[n.status];
              return (
                <li key={n.id} className="border-b border-rule px-5 py-4 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <div className="w-44 shrink-0">
                      <p data-numeric className="font-mono text-base text-ink">
                        {fmt.phone(n.e164)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {n.label}, {n.city}
                      </p>
                    </div>
                    <div className="min-w-[14rem] flex-1">
                      <RouteSummary route={n.route} directory={directory} />
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(n.id)}>
                      <GearSixIcon aria-hidden />
                      Set up routing
                    </Button>
                  </div>

                  <TransferLine route={n.route} directory={directory} transfers={transfers} />

                  {n.status === "porting" ? (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-warning-wash px-3.5 py-2.5 text-xs leading-relaxed text-ink">
                      <ClockCountdownIcon aria-hidden className="mt-px size-4 shrink-0 text-warning" />
                      Still moving over from your old phone company, expected by{" "}
                      {PORTING_READY_BY}. Until then it rings where it rings today. The routing above
                      starts the day it lands.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <RoutingPanel
        open={Boolean(current)}
        onOpenChange={(o) => !o && setEditing(null)}
        title={current ? `Routing for ${fmt.phone(current.e164)}` : "Routing"}
        description={current ? `${current.label}. Where calls to this number go.` : ""}
        initial={current?.route ?? []}
        directory={directory}
        onSave={(route) => {
          setNumbers((all) => all.map((x) => (x.id === editing ? { ...x, route } : x)));
          toast.success("Routing saved. It applies to the next call.");
        }}
      />
    </div>
  );
}

/**
 * Routing decides who answers. Once an agent has the call, its own transfer
 * setting decides who it hands the caller to, so the row says that too and
 * links straight to it.
 */
function TransferLine({
  route,
  directory,
  transfers,
}: {
  route: PhoneNumber["route"];
  directory: RouteDirectory;
  transfers: Record<string, AgentTransfer>;
}) {
  const step = route.find((s) => s.kind === "agent");
  const agent = step ? directory.agents.find((a) => a.id === step.ref) : undefined;
  if (!agent || !agent.channels.includes("voice")) return null;

  const t = transfers[agent.id];
  const on = Boolean(t?.enabled);
  const incomplete = t ? transferIncomplete(t) : false;
  const text = !on
    ? `${agent.name} does not transfer callers to a person.`
    : incomplete
      ? `${agent.name} is set to transfer, but it is missing who to ring or when.`
      : `When a caller needs a person, ${agent.name} puts them through to ${transferTargets(t!, directory.people)}.`;

  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted sm:pl-[12.25rem]">
      <UserSwitchIcon
        aria-hidden
        className={on && !incomplete ? "size-4 shrink-0 text-primary" : "size-4 shrink-0 text-warning"}
      />
      <span>{text}</span>
      <Link
        href={`/agents/${agent.id}?section=transfer` as Route}
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        {on ? "Change transfer" : "Set up transfer"}
        <span className="sr-only"> for {agent.name}</span>
      </Link>
    </p>
  );
}
