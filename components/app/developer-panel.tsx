"use client";

import * as React from "react";
import {
  CopyIcon,
  KeyIcon,
  PaperPlaneTiltIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
  WarningCircleIcon,
  WebhooksLogoIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, type BadgeProps } from "@/components/ui/status";
import type { ApiKey, WebhookDelivery, WebhookEndpoint, WebhookEventKey } from "@/lib/api/types";
import { NOW } from "@/lib/mock/fixtures";
import { API_BASE, WEBHOOK_EVENTS } from "@/lib/webhooks";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * API keys, webhooks, and what was delivered. For whoever builds on top of
 * EZRA for the business, so the words here can be technical; the page still
 * says what each thing does before it says what it is called.
 *
 * A full key is shown once, the moment it is made, and never again. Only its
 * last four characters are kept for the list.
 */

const ENDPOINT_STATE: Record<WebhookEndpoint["status"], { label: string; tone: BadgeProps["tone"] }> = {
  active: { label: "Delivering", tone: "success" },
  failing: { label: "Failing", tone: "danger" },
  paused: { label: "Paused", tone: "neutral" },
};

const EVENT_GROUPS = [...new Set(WEBHOOK_EVENTS.map((e) => e.group))];

const SAMPLE_PAYLOAD = `{
  "event": "booking.created",
  "sent_at": "2026-09-18T16:33:12Z",
  "data": {
    "booking_id": "bk_7Qm2x9",
    "customer": { "name": "Dana Whitcomb", "phone": "+15412208817" },
    "service": "New patient exam",
    "starts_at": "2026-09-24T16:40:00Z",
    "agent": "Front Desk",
    "channel": "voice"
  }
}`;

function randomToken(n: number) {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied.`);
  } catch {
    toast.error("Could not copy. Select the text and copy it by hand.");
  }
}

export function DeveloperPanel({
  apiKeys: initialKeys,
  endpoints: initialEndpoints,
  deliveries: initialDeliveries,
}: {
  apiKeys: ApiKey[];
  endpoints: WebhookEndpoint[];
  deliveries: WebhookDelivery[];
}) {
  const [keys, setKeys] = React.useState(initialKeys);
  const [endpoints, setEndpoints] = React.useState(initialEndpoints);
  const [deliveries, setDeliveries] = React.useState(initialDeliveries);
  const [creatingKey, setCreatingKey] = React.useState(false);
  const [addingEndpoint, setAddingEndpoint] = React.useState(false);
  const [revoking, setRevoking] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  function sendTest(e: WebhookEndpoint) {
    const ok = e.status !== "failing";
    const event = e.events[0] ?? "call.completed";
    setDeliveries((d) => [
      {
        __fixture: true,
        id: `dl_${Date.now()}`,
        endpointId: e.id,
        event,
        at: new Date().toISOString(),
        statusCode: ok ? 200 : 503,
        durationMs: ok ? 241 : 10_000,
        attempt: 1,
      },
      ...d,
    ]);
    if (ok) toast.success(`Test ${event} delivered. Your server answered 200.`);
    else toast.error("Test failed. Your server answered 503, the same as the last few tries.");
  }

  return (
    <div className="space-y-8">
      <p className="max-w-[70ch] text-sm leading-relaxed text-ink-muted">
        For whoever builds on top of EZRA for your business. The API reads and writes your calls, bookings, and
        customers. Webhooks send them to your own systems the moment they happen. Both carry customer data, so keep
        keys and signing secrets private.
      </p>

      {/* Webhooks first: most businesses only ever need these. */}
      <section aria-labelledby="dev-webhooks" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="dev-webhooks" className="font-display text-lg font-semibold text-ink">Webhooks</h3>
            <p className="mt-0.5 max-w-[62ch] text-sm text-ink-muted">
              EZRA sends an event to your address each time something happens. Failed deliveries are retried for 3
              days.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddingEndpoint(true)}>
            <PlusIcon aria-hidden weight="bold" />
            Add endpoint
          </Button>
        </div>

        {endpoints.length === 0 ? (
          <Card>
            <EmptyState
              icon={WebhooksLogoIcon}
              title="No webhooks yet"
              body="Add the address of your server, or a Zapier or Make hook, and choose what to send it."
            />
          </Card>
        ) : (
          <ul className="space-y-3">
            {endpoints.map((e) => {
              const state = ENDPOINT_STATE[e.status];
              return (
                <li key={e.id}>
                  <Card className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-panel text-ink">
                        <WebhooksLogoIcon aria-hidden className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                          {e.description}
                          <Badge tone={state.tone}>{state.label}</Badge>
                        </p>
                        <p className="mt-0.5 truncate font-mono text-xs text-ink-muted" title={e.url}>
                          {e.url}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <Button variant="quiet" size="sm" onClick={() => sendTest(e)} disabled={e.status === "paused"}>
                          <PaperPlaneTiltIcon aria-hidden />
                          Send test
                        </Button>
                        <Button
                          variant="quiet"
                          size="sm"
                          onClick={() => {
                            setEndpoints((all) =>
                              all.map((x) => (x.id === e.id ? { ...x, status: x.status === "paused" ? "active" : "paused" } : x)),
                            );
                            toast(e.status === "paused" ? "Webhook resumed." : "Webhook paused. Nothing is sent until you resume it.");
                          }}
                        >
                          {e.status === "paused" ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
                          {e.status === "paused" ? "Resume" : "Pause"}
                        </Button>
                        <Button variant="quiet" size="icon-sm" aria-label={`Delete ${e.description}`} onClick={() => setDeleting(e.id)}>
                          <TrashIcon aria-hidden />
                        </Button>
                      </div>
                    </div>

                    <ul aria-label="Events sent" className="mt-3 flex flex-wrap gap-1.5">
                      {e.events.map((ev) => (
                        <li key={ev} className="rounded-full bg-panel px-2.5 py-1 font-mono text-2xs text-ink">
                          {ev}
                        </li>
                      ))}
                    </ul>

                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
                      <div className="flex gap-1.5">
                        <dt>Delivered in 7 days</dt>
                        <dd data-numeric className={cn("font-mono", e.lastDeliveryAt && e.successRate7d < 0.9 ? "text-danger" : "text-ink")}>
                          {e.lastDeliveryAt ? fmt.percent(e.successRate7d) : "None yet"}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Last sent</dt>
                        <dd data-numeric className="font-mono text-ink">
                          {e.lastDeliveryAt ? fmt.relative(e.lastDeliveryAt, NOW) : "Never"}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Signing secret</dt>
                        <dd className="font-mono text-ink">whsec_••••{e.secretLast4}</dd>
                      </div>
                    </dl>

                    {e.status === "failing" ? (
                      <p className="mt-3 flex items-start gap-2 rounded-xl bg-danger-wash px-3.5 py-2.5 text-xs leading-relaxed text-ink">
                        <WarningCircleIcon aria-hidden weight="fill" className="mt-px size-4 shrink-0 text-danger" />
                        Your server answered 503 to the last few events. We keep retrying for 3 days, then pause this
                        webhook and email you. Nothing is lost: every event is in Conversations.
                      </p>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Deliveries. */}
      <section aria-labelledby="dev-deliveries" className="space-y-3">
        <div>
          <h3 id="dev-deliveries" className="font-display text-lg font-semibold text-ink">Recent deliveries</h3>
          <p className="mt-0.5 text-sm text-ink-muted">What was sent, where, and what your server said back.</p>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-rule text-xs text-ink-muted">
                  <th scope="col" className="px-4 py-2.5 font-medium">Result</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Event</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Sent to</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Took</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.slice(0, 8).map((d) => {
                  const ok = d.statusCode >= 200 && d.statusCode < 300;
                  const to = endpoints.find((e) => e.id === d.endpointId)?.description ?? "Deleted endpoint";
                  return (
                    <tr key={d.id} className="border-b border-rule last:border-b-0">
                      <td className="px-4 py-2.5">
                        <Badge tone={ok ? "success" : "danger"}>
                          <span data-numeric className="font-mono">{d.statusCode}</span>
                          {ok ? "Delivered" : d.attempt > 1 ? `Failed, try ${d.attempt}` : "Failed"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-ink">{d.event}</td>
                      <td className="max-w-[14rem] truncate px-4 py-2.5 text-ink-muted">{to}</td>
                      <td data-numeric className="px-4 py-2.5 text-right font-mono text-xs text-ink-muted">
                        {fmt.count(d.durationMs)} ms
                      </td>
                      <td data-numeric className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs text-ink-muted">
                        {fmt.relative(d.at, NOW)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* API keys. */}
      <section aria-labelledby="dev-keys" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="dev-keys" className="font-display text-lg font-semibold text-ink">API keys</h3>
            <p className="mt-0.5 max-w-[62ch] text-sm text-ink-muted">
              Let your own software read or change your data. Give each key one job, so you can turn one off
              without breaking the rest.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCreatingKey(true)}>
            <PlusIcon aria-hidden weight="bold" />
            Create key
          </Button>
        </div>
        <Card>
          {keys.length === 0 ? (
            <EmptyState icon={KeyIcon} title="No API keys" body="Create one when you connect your own software." />
          ) : (
            <ul>
              {keys.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3.5 last:border-b-0 sm:px-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-panel text-ink">
                    <KeyIcon aria-hidden className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                      {k.name}
                      <Badge tone={k.access === "write" ? "warning" : "neutral"}>
                        {k.access === "write" ? "Read and write" : "Read only"}
                      </Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      <span className="font-mono text-ink">ezra_live_••••{k.last4}</span>
                      {" · "}Made by {k.createdBy}
                      {" · "}
                      {k.lastUsedAt ? (
                        <>
                          Last used <span data-numeric className="font-mono">{fmt.relative(k.lastUsedAt, NOW)}</span>
                        </>
                      ) : (
                        "Never used"
                      )}
                    </p>
                  </div>
                  {revoking === k.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-ink">Anything using it stops working.</span>
                      <Button variant="secondary" size="sm" onClick={() => setRevoking(null)}>
                        Keep
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setKeys((all) => all.filter((x) => x.id !== k.id));
                          setRevoking(null);
                          toast(`${k.name} revoked.`);
                        }}
                      >
                        Revoke
                      </Button>
                    </span>
                  ) : (
                    <Button variant="quiet" size="sm" className="text-danger" onClick={() => setRevoking(k.id)}>
                      Revoke
                      <span className="sr-only"> {k.name}</span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Quick start. */}
      <section aria-labelledby="dev-start" className="space-y-3">
        <div>
          <h3 id="dev-start" className="font-display text-lg font-semibold text-ink">Quick start</h3>
          <p className="mt-0.5 text-sm text-ink-muted">Every request sends a key. Every webhook is signed, so you can check it came from EZRA.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <CodeBlock
            title="Read today's calls"
            code={`curl ${API_BASE}/calls?since=2026-09-18 \\\n  -H "Authorization: Bearer $EZRA_API_KEY"`}
          />
          <CodeBlock title="What a webhook sends" code={SAMPLE_PAYLOAD} />
        </div>
      </section>

      <CreateKeyDialog
        open={creatingKey}
        onOpenChange={setCreatingKey}
        onCreate={(k) => setKeys((all) => [k, ...all])}
      />
      <AddEndpointDialog
        open={addingEndpoint}
        onOpenChange={setAddingEndpoint}
        onAdd={(e) => setEndpoints((all) => [...all, e])}
      />
      <Dialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent
          title="Delete this webhook?"
          description="Events stop going to it straight away. You can add it again later."
        >
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setEndpoints((all) => all.filter((x) => x.id !== deleting));
                setDeleting(null);
                toast("Webhook deleted.");
              }}
            >
              Delete webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-sunken">
      <div className="flex items-center justify-between gap-2 border-b border-rule px-4 py-2">
        <p className="text-xs font-medium text-ink-muted">{title}</p>
        <Button variant="quiet" size="sm" onClick={() => copy(code, title)}>
          <CopyIcon aria-hidden />
          Copy
          <span className="sr-only"> {title}</span>
        </Button>
      </div>
      <pre tabIndex={0} aria-label={title} className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CreateKeyDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (k: ApiKey) => void;
}) {
  const [name, setName] = React.useState("");
  const [access, setAccess] = React.useState<ApiKey["access"]>("read");
  const [error, setError] = React.useState<string | null>(null);
  const [made, setMade] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName("");
      setAccess("read");
      setError(null);
      setMade(null);
    }
  }, [open]);

  function create() {
    if (!name.trim()) return setError("Name it after what will use it, so you know what to revoke later.");
    const secret = `ezra_live_${randomToken(32)}`;
    onCreate({
      __fixture: true,
      id: `key_${Date.now()}`,
      name: name.trim(),
      last4: secret.slice(-4),
      access,
      createdAt: new Date().toISOString(),
      createdBy: "Priya Raghunathan",
      lastUsedAt: null,
    });
    setMade(secret);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={made ? "Copy your key now" : "Create an API key"}
        description={made ? "This is the only time it is shown. Store it somewhere safe." : "Give it a name and choose what it may do."}
      >
        {made ? (
          <>
            <div className="flex items-center gap-2 rounded-xl border border-rule bg-sunken p-3">
              <code className="min-w-0 flex-1 break-all font-mono text-xs text-ink">{made}</code>
              <Button variant="secondary" size="sm" onClick={() => copy(made, "Key")}>
                <CopyIcon aria-hidden />
                Copy
              </Button>
            </div>
            <DialogFooter>
              <Button variant="primary" onClick={() => onOpenChange(false)}>
                I have saved it
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <Field label="Name" htmlFor="key-name" hint="What will use it, for example: booking form on our website." error={error ?? undefined}>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                autoComplete="off"
              />
            </Field>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-ink">What it may do</legend>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    ["read", "Read only", "See calls, bookings, and customers."],
                    ["write", "Read and write", "Also create bookings and update customers."],
                  ] as const
                ).map(([value, label, body]) => (
                  <label
                    key={value}
                    className={cn(
                      "cursor-pointer rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas",
                      access === value ? "border-primary bg-primary-wash" : "border-rule hover:border-rule-control",
                    )}
                  >
                    <input
                      type="radio"
                      name="key-access"
                      value={value}
                      checked={access === value}
                      onChange={() => setAccess(value)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium text-ink">{label}</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">{body}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Create key
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddEndpointDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (e: WebhookEndpoint) => void;
}) {
  const [url, setUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [events, setEvents] = React.useState<WebhookEventKey[]>(["call.completed", "booking.created"]);
  const [error, setError] = React.useState<{ url?: string; events?: string }>({});

  React.useEffect(() => {
    if (open) {
      setUrl("");
      setDescription("");
      setEvents(["call.completed", "booking.created"]);
      setError({});
    }
  }, [open]);

  function save() {
    const next: typeof error = {};
    let parsed: URL | null = null;
    try {
      parsed = new URL(url.trim());
    } catch {
      parsed = null;
    }
    if (!parsed || parsed.protocol !== "https:") next.url = "Use the full address, starting with https://";
    if (events.length === 0) next.events = "Choose at least one event to send.";
    setError(next);
    if (next.url || next.events || !parsed) return;
    onAdd({
      __fixture: true,
      id: `wh_${Date.now()}`,
      url: parsed.toString(),
      description: description.trim() || parsed.hostname,
      events,
      status: "active",
      createdAt: new Date().toISOString(),
      lastDeliveryAt: null,
      successRate7d: 1,
      secretLast4: randomToken(4),
    });
    onOpenChange(false);
    toast.success("Webhook added. Send a test to check your server receives it.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Add a webhook"
        description="Where to send events, and which ones."
        className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-4"
        >
          <Field label="Address" htmlFor="wh-url" hint="Your server, or a hook URL from Zapier or Make." error={error.url}>
            <Input
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://ops.aldercreekdental.com/hooks/bookings"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError((x) => ({ ...x, url: undefined }));
              }}
            />
          </Field>
          <Field label="What it is for" htmlFor="wh-desc" hint="Optional. Shown in the list instead of the address.">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} autoComplete="off" />
          </Field>

          <fieldset aria-describedby={error.events ? "wh-events-error" : undefined}>
            <legend className="text-sm font-medium text-ink">Events to send</legend>
            <div className="mt-2 space-y-3">
              {EVENT_GROUPS.map((g) => (
                <div key={g}>
                  <p className="text-xs font-medium text-ink-muted">{g}</p>
                  <ul className="mt-1.5 space-y-1">
                    {WEBHOOK_EVENTS.filter((e) => e.group === g).map((ev) => {
                      const id = `ev-${ev.key}`;
                      return (
                        <li key={ev.key}>
                          <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-raised">
                            <input
                              id={id}
                              type="checkbox"
                              checked={events.includes(ev.key)}
                              onChange={(e) => {
                                setEvents((all) => (e.target.checked ? [...all, ev.key] : all.filter((k) => k !== ev.key)));
                                setError((x) => ({ ...x, events: undefined }));
                              }}
                              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--color-primary)]"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm text-ink">{ev.label}</span>
                              <span className="block font-mono text-2xs text-ink-muted">{ev.key}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            {error.events ? (
              <p id="wh-events-error" role="alert" className="mt-2 text-sm text-danger">
                {error.events}
              </p>
            ) : null}
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add webhook
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
