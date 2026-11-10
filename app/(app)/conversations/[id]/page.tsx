import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChatCircleDotsIcon,
  PhoneIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OutcomeBadge } from "@/components/ui/status";
import { TranscriptPlayer } from "@/components/app/transcript-player";
import { CommsButton } from "@/components/app/comms";
import { agentActions, conversations, NOW } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = conversations.find((x) => x.id === id);
  return { title: c ? (c.contactName ?? fmt.phone(c.contactNumber)) : "Conversation" };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = conversations.find((x) => x.id === id);
  if (!c) notFound();

  const Icon = c.channel === "voice" ? PhoneIcon : ChatCircleDotsIcon;
  const actionsTaken =
    c.outcome === "booked"
      ? agentActions.filter((a) => a.kind === "book" || a.kind === "sms")
      : c.outcome === "transferred"
        ? agentActions.filter((a) => a.kind === "transfer")
        : c.outcome === "message"
          ? agentActions.filter((a) => a.kind === "message")
          : [];

  return (
    <div className="space-y-5">
      <Button asChild variant="quiet" size="sm" className="-ml-2">
        <Link href="/conversations">
          <ArrowLeftIcon aria-hidden />
          All conversations
        </Link>
      </Button>

      {c.needsReview ? (
        <div className="flex flex-wrap items-start gap-3 rounded-lg border border-signal/40 bg-signal-wash px-4 py-3.5">
          <WarningCircleIcon
            className="mt-0.5 size-5 shrink-0 text-signal"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-signal">
              The agent could not answer this one
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              It took a message instead of guessing. Someone at the office needs
              to call back.
            </p>
          </div>
          <Button variant="secondary" size="sm">
            <CheckCircleIcon aria-hidden />
            Mark handled
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2.5 font-display text-2xl font-semibold text-ink">
            <Icon className="size-5 shrink-0 text-ink-faint" aria-hidden />
            {c.contactName ?? fmt.phone(c.contactNumber)}
          </h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span>{fmt.dateTime(c.startedAt)}</span>
            <span aria-hidden className="text-ink-faint">
              ·
            </span>
            <span data-numeric className="font-mono">
              {fmt.durationWords(c.durationSeconds)}
            </span>
            <span aria-hidden className="text-ink-faint">
              ·
            </span>
            <Link
              href={`/agents/${c.agentId}` as Route}
              className="underline underline-offset-2 hover:text-ink"
            >
              {c.agentName}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OutcomeBadge outcome={c.outcome} />
          {/* Act on it without leaving the page. */}
          {c.contactNumber ? (
            <>
              <CommsButton action="call" to={c.contactNumber} label="Call back" variant="primary" />
              <CommsButton action="link" to={c.contactNumber} label="Text a booking link" />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {c.channel === "voice" ? "Recording and transcript" : "Transcript"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TranscriptPlayer
                transcript={c.transcript}
                totalSeconds={c.durationSeconds}
                hasRecording={Boolean(c.recordingUrl)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What happened</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-ink">{c.summary}</p>
            </CardContent>
          </Card>

          {actionsTaken.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>What the agent did</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <ul>
                  {actionsTaken.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start gap-2.5 border-t border-rule px-5 py-3"
                    >
                      <CheckCircleIcon
                        className="mt-0.5 size-4 shrink-0 text-success"
                        aria-hidden
                        weight="fill"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm text-ink">{a.label}</span>
                        {a.target ? (
                          <span className="mt-0.5 block font-mono text-2xs text-ink-faint">
                            {a.target}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Channel</dt>
                  <dd className="text-ink">
                    {c.channel === "voice" ? "Phone call" : "Website chat"}
                  </dd>
                </div>
                {c.contactNumber ? (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-muted">Number</dt>
                    <dd data-numeric className="font-mono text-ink">
                      {fmt.phone(c.contactNumber)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Turns</dt>
                  <dd data-numeric className="font-mono text-ink">
                    {fmt.count(c.transcript.length)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Cost</dt>
                  <dd data-numeric className="font-mono text-ink">
                    {fmt.money(c.costCents, { cents: true })}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Started</dt>
                  <dd className="text-ink">{fmt.relative(c.startedAt, NOW)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
