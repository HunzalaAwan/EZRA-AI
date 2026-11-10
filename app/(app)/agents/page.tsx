import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import {
  ArrowRightIcon,
  ChatCircleDotsIcon,
  PhoneIcon,
  PlusIcon,
  RobotIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AgentStatusBadge } from "@/components/ui/status";
import { agents, phoneNumbers, NOW } from "@/lib/mock/fixtures";
import { goalLabel } from "@/lib/labels";
import { Rise, Stagger } from "@/components/motion/primitives";
import * as fmt from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Agents" };

/**
 * Every agent carries a colour, and the colour travels: avatar, stat chips,
 * booking-rate bar. It is identity, so it is assigned in a fixed order and
 * never repeats until the four hues run out. Text never takes the hue; text
 * stays ink, whose pairs are gated.
 *
 * A live agent's avatar pulses, so the eye finds what is answering without
 * reading a badge. The badge still says it in words.
 */
const HUES = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-4)",
  "var(--color-series-3)",
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function AgentsPage() {
  if (agents.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={RobotIcon}
          title="No agents yet"
          body="An agent answers your phone or your website chat. Paste your website and we will build the first one from what is already there."
          action={
            <Button asChild variant="primary">
              <Link href="/agents/new">
                <PlusIcon aria-hidden weight="bold" />
                Create your first agent
              </Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const live = agents.filter((a) => a.status === "live");
  const handled = live.reduce((n, a) => n + a.conversations7d, 0);
  const booked = live.reduce((n, a) => n + a.bookings7d, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">
            Your agents
          </h2>
          <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
            <span data-numeric className="font-mono text-ink">{live.length}</span>{" "}
            answering, <span data-numeric className="font-mono text-ink">{fmt.count(handled)}</span>{" "}
            conversations and{" "}
            <span data-numeric className="font-mono text-ink">{fmt.count(booked)}</span>{" "}
            bookings this week. Publish changes when you are ready, not as you
            type.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link href="/agents/new">
            <PlusIcon aria-hidden weight="bold" />
            New agent
          </Link>
        </Button>
      </div>

      <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {agents.map((agent, i) => {
          const number = phoneNumbers.find((n) => n.id === agent.numberId);
          const hue = HUES[i % HUES.length]!;
          const rate =
            agent.conversations7d > 0 ? agent.bookings7d / agent.conversations7d : 0;
          const isLive = agent.status === "live";
          return (
            <Rise key={agent.id}>
              <Card
                className="group relative h-full overflow-hidden transition-shadow duration-300 hover:shadow-[0_22px_48px_-26px_var(--hue)]"
                style={{ "--hue": hue } as React.CSSProperties}
              >
                {/* A wash of the agent's colour from the top corner. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(28rem_9rem_at_0%_0%,color-mix(in_oklab,var(--hue)_15%,transparent),transparent_75%)]"
                />
                <CardContent className="relative flex h-full flex-col p-6">
                  <div className="flex items-start gap-4">
                    <span className="relative shrink-0">
                      {isLive ? (
                        <span
                          aria-hidden
                          className="animate-halo absolute inset-0 rounded-2xl border-2 border-[var(--hue)] motion-reduce:hidden"
                        />
                      ) : null}
                      <span
                        aria-hidden
                        className={cn(
                          "relative flex size-12 items-center justify-center rounded-2xl font-display text-base font-semibold",
                          agent.status === "draft"
                            ? "border-2 border-dashed border-[var(--hue)] text-ink"
                            : // Initials are text, so this fill must reach 4.5:1, not the
                              // 3:1 an icon needs. In light mode the hue is deepened a
                              // little under white type; the chart hues stay untouched.
                              "bg-[var(--hue)] text-on-primary shadow-[0_8px_20px_-10px_var(--hue)] light:bg-[color-mix(in_oklab,var(--hue)_80%,black)]",
                        )}
                      >
                        {initials(agent.name)}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/agents/${agent.id}` as Route}
                          className="font-display text-xl font-semibold tracking-[-0.02em] text-ink underline-offset-4 hover:underline"
                        >
                          {agent.name}
                        </Link>
                        <AgentStatusBadge status={agent.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-ink-muted">{goalLabel(agent.goal)}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {agent.channels.includes("voice") ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-surface px-2.5 py-1 text-xs text-ink-muted">
                            <PhoneIcon className="size-3.5" aria-hidden />
                            {number ? (
                              <span data-numeric className="font-mono">{fmt.phone(number.e164)}</span>
                            ) : (
                              "No number yet"
                            )}
                          </span>
                        ) : null}
                        {agent.channels.includes("chat") ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-surface px-2.5 py-1 text-xs text-ink-muted">
                            <ChatCircleDotsIcon className="size-3.5" aria-hidden />
                            Website chat
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {agent.status === "draft" ? (
                    <div className="mt-5 flex flex-1 items-center rounded-xl border border-dashed border-rule-control/60 bg-sunken px-4 py-4">
                      <p className="text-sm text-ink-muted">
                        Never published. Nobody can reach this agent yet. Open it
                        to finish the setup and hear it on a test call.
                      </p>
                    </div>
                  ) : (
                    <>
                      <dl className="mt-5 grid grid-cols-3 gap-2">
                        {[
                          { k: "Handled", v: fmt.count(agent.conversations7d) },
                          { k: "Booked", v: fmt.count(agent.bookings7d) },
                          { k: "Avg length", v: fmt.durationWords(agent.avgHandleSeconds) },
                        ].map((d) => (
                          <div
                            key={d.k}
                            className="rounded-xl bg-[color-mix(in_oklab,var(--hue)_8%,var(--color-surface))] px-3.5 py-3"
                          >
                            <dt className="text-xs text-ink-muted">{d.k}</dt>
                            <dd
                              data-numeric
                              className="mt-1 font-display text-xl font-semibold tracking-[-0.02em] text-ink"
                            >
                              {d.v}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      {/* Booking rate: the one number that says it is working. */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-muted">Conversations that became a booking</span>
                          <span data-numeric className="font-mono font-medium text-ink">
                            {fmt.percent(rate)}
                          </span>
                        </div>
                        <div
                          className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken"
                          role="presentation"
                        >
                          <div
                            className="h-full rounded-full bg-[var(--hue)]"
                            style={{ width: `${Math.max(2, rate * 100)}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-rule pt-4">
                    <p className="text-xs text-ink-faint">
                      {agent.version === 0
                        ? "Never published"
                        : `Version ${agent.version}, updated ${fmt.relative(agent.updatedAt, NOW)}`}
                    </p>
                    <Button asChild variant={agent.status === "draft" ? "primary" : "secondary"} size="sm">
                      <Link href={`/agents/${agent.id}` as Route}>
                        {agent.status === "draft" ? "Finish setup" : "Open"}
                        <ArrowRightIcon aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Rise>
          );
        })}
      </Stagger>
    </div>
  );
}
