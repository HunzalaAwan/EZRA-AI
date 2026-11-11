"use client";

import * as React from "react";
import { CheckIcon, UsersIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import type { Member, MessageChannel, TeamAlert } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { CHANNEL, ChannelToggle } from "./shared";

/**
 * Team alerts: what lands on your own phone or inbox, and who gets it. These
 * go to the people who run the business, never to customers.
 */
export function TeamAlerts({ alerts: initial, members }: { alerts: TeamAlert[]; members: Member[] }) {
  const [alerts, setAlerts] = React.useState(initial);
  const [editing, setEditing] = React.useState<TeamAlert | null>(null);
  const firstName = (id: string) =>
    members
      .find((m) => m.id === id)
      ?.name.replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/, "")
      .split(" ")[0] ?? id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">Team alerts</h2>
        <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
          What lands on your phone or in your inbox, and who gets it. Customers never see these.
        </p>
      </div>

      <ul className="divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface">
        {alerts.map((a) => {
          const id = `alert-${a.id}`;
          return (
            <li key={a.id} className="flex flex-wrap items-start gap-x-5 gap-y-3 px-5 py-5 sm:px-6">
              <Switch
                id={id}
                checked={a.enabled}
                onCheckedChange={(v) => {
                  setAlerts((all) => all.map((x) => (x.id === a.id ? { ...x, enabled: v } : x)));
                  toast.success(v ? `${a.name} is on.` : `${a.name} is off.`);
                }}
                className="mt-0.5"
              />
              <div className="min-w-0 grow basis-72">
                <label htmlFor={id} className="cursor-pointer font-medium text-ink">
                  {a.name}
                </label>
                <p className="mt-0.5 max-w-[62ch] text-sm leading-relaxed text-ink-muted">{a.description}</p>
                <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                  {a.channels.map((c) => {
                    const CIcon = CHANNEL[c].icon;
                    return (
                      <span key={c} className="inline-flex items-center gap-1.5">
                        <CIcon aria-hidden className="size-3.5" />
                        {CHANNEL[c].label}
                      </span>
                    );
                  })}
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon aria-hidden className="size-3.5" />
                    to {a.recipients.map(firstName).join(", ") || "nobody yet"}
                  </span>
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEditing(a)}>
                Change who gets it
                <span className="sr-only">: {a.name}</span>
              </Button>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing ? (
          <RecipientsDialog
            alert={editing}
            members={members}
            onSave={(recipients, channels) => {
              setAlerts((all) => all.map((x) => (x.id === editing.id ? { ...x, recipients, channels } : x)));
              setEditing(null);
              toast.success(`${editing.name} updated.`);
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function RecipientsDialog({
  alert: a,
  members,
  onSave,
}: {
  alert: TeamAlert;
  members: Member[];
  onSave: (recipients: string[], channels: MessageChannel[]) => void;
}) {
  const [picked, setPicked] = React.useState(a.recipients);
  const [channels, setChannels] = React.useState(a.channels);
  return (
    <DialogContent title={a.name} description="Who gets it, and how.">
      <div className="space-y-5">
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Send by</p>
          <ChannelToggle label="Send by" value={channels} onChange={setChannels} multiple />
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink">To</legend>
          <ul className="space-y-1">
            {members.map((m) => {
              const on = picked.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => setPicked((p) => (on ? p.filter((x) => x !== m.id) : [...p, m.id]))}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      on ? "border-primary/40 bg-primary-wash" : "border-rule hover:border-rule-control",
                    )}
                  >
                    <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-panel text-2xs font-semibold text-ink">
                      {m.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{m.name}</span>
                      <span className="block truncate text-xs text-ink-muted">{m.email}</span>
                    </span>
                    <span
                      aria-hidden
                      className={cn("flex size-5 items-center justify-center rounded-md border", on ? "border-primary bg-primary text-on-primary" : "border-rule-control")}
                    >
                      {on ? <CheckIcon weight="bold" className="size-3" /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      </div>
      <DialogFooter>
        <Button
          variant="primary"
          onClick={() => {
            if (!picked.length) return toast.error("Pick at least one person, or turn the alert off.");
            onSave(picked, channels);
          }}
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
