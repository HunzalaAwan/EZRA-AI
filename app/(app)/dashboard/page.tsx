import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  MoonStarsIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { StatTile } from "@/components/app/stat-tile";
import { DashboardViews } from "@/components/app/dashboard-views";
import { toView } from "@/lib/dashboard-views";
import {
  LinksPanel,
  PatternsPanel,
  PerformancePanel,
} from "@/components/app/analytics-panels";
import { Rise, RiseOnView, Stagger } from "@/components/motion/primitives";
import {
  DailyVolumeChart,
  HourlyChart,
  OutcomeBars,
} from "@/components/app/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { outcomeLabel } from "@/lib/labels";
import {
  agents,
  conversations,
  dashboardSummary,
  workspace,
  members,
  NOW,
  bookingLinks,
} from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The owner's weekly skim. Answers four questions in order:
 * how many calls did the agent handle, how many turned into appointments,
 * what did it fail to handle, and what needs me.
 *
 * Layout families are deliberately varied: stat row, then a two-column split
 * with a chart and a list, then a full-width chart, then a table. No wall of
 * identical cards.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const initial = toView(view);
  const s = dashboardSummary;
  const handledTrend = fmt.delta(s.handled7d, s.handled7dPrev);
  const bookedTrend = fmt.delta(s.booked7d, s.booked7dPrev);
  const needsReview = conversations.filter((c) => c.needsReview);
  const liveAgents = agents.filter((a) => a.status === "live");
  const owner =
    members.find((m) => m.role === "owner")?.name.split(" ")[0] ?? "there";
  // Greet by the hour where the business is, not where the server is.
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: workspace.timezone,
    }).format(NOW),
  );
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* The week, as one sentence, on the brand's own ground. Everything
          below is the detail behind it. */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-band-violet px-6 py-7 sm:px-9 sm:py-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 size-[26rem] rounded-full bg-[#7c4dff] opacity-35 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/3 size-[20rem] rounded-full bg-[#f5a6d8] opacity-20 blur-[110px]"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[40rem]">
            <p className="flex items-center gap-2 text-sm text-on-media-muted">
              <span aria-hidden className="relative flex size-2">
                <span className="animate-ring absolute inset-0 rounded-full bg-signal-live motion-reduce:hidden" />
                <span className="relative size-2 rounded-full bg-signal-live" />
              </span>
              {liveAgents.length} agents answering right now at {workspace.name}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.035em] text-on-media sm:text-4xl">
              {greeting}, {owner}. Your agents booked{" "}
              <span className="text-band-violet-ink">{fmt.count(s.booked7d)}</span>{" "}
              this week.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-on-media-muted">
              That is {bookedTrend.text.replace("+", "")} more than the week
              before. {fmt.count(Math.round(s.handled7d * s.afterHoursShare))} of{" "}
              {fmt.count(s.handled7d)} conversations came in while you were
              closed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button
              asChild
              className="border-transparent bg-on-media text-media hover:bg-white"
            >
              <Link href="/conversations">
                Open the inbox
                <ArrowRightIcon aria-hidden />
              </Link>
            </Button>
            {needsReview.length > 0 ? (
              <Button
                asChild
                className="border-white/25 bg-transparent text-on-media hover:border-white hover:bg-transparent"
              >
                <Link href={"/conversations?review=1" as Route}>
                  {needsReview.length} needs you
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <DashboardViews
        initial={initial}
        panels={{
          overview: (
            <>
      {/* Four numbers that change what the owner does today. */}
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Rise>
          <StatTile
            label="Conversations handled"
            tone="violet"
            icon="conversations"
            value={fmt.count(s.handled7d)}
            countTo={s.handled7d}
            formatAs="count"
            trend={{ ...handledTrend, good: handledTrend.direction === "up" }}
            note="vs the week before"
            href="/conversations"
          />
        </Rise>
        <Rise>
          <StatTile
            label="Bookings"
            tone="teal"
            icon="bookings"
            value={fmt.count(s.booked7d)}
            countTo={s.booked7d}
            formatAs="count"
            trend={{ ...bookedTrend, good: bookedTrend.direction === "up" }}
            note={`${fmt.count(bookingLinks.booked7d)} from links the agent sent`}
            href="/conversations?outcome=booked"
          />
        </Rise>
        <Rise>
          <StatTile
            label="Handled while you were closed"
            tone="gold"
            icon="closed"
            value={fmt.percent(s.afterHoursShare)}
            countTo={s.afterHoursShare}
            formatAs="percent"
            note={`${fmt.count(Math.round(s.handled7d * s.afterHoursShare))} conversations`}
          />
        </Rise>
        <Rise>
          <StatTile
            label="Needs a person"
            tone="signal"
            icon="flag"
            value={fmt.count(s.needsReview)}
            countTo={s.needsReview}
            formatAs="count"
            note={
              s.needsReview === 1
                ? "conversation flagged"
                : "conversations flagged"
            }
            href="/conversations?review=1"
            emphasis={s.needsReview > 0}
          />
        </Rise>
      </Stagger>

      {/* Split: volume chart beside the things that need a human. */}
      <RiseOnView>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Two weeks of volume</CardTitle>
                <CardDescription>
                  Bookings as a share of everything handled.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <DailyVolumeChart data={s.daily} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Waiting on you</CardTitle>
                <CardDescription>
                  The agent escalated these rather than guess.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {needsReview.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CalendarCheckIcon
                    className="size-5 text-success"
                    aria-hidden
                  />
                  <p className="mt-2.5 text-sm font-medium text-ink">
                    Nothing is waiting
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Every conversation this week resolved without you.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {needsReview.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/conversations/${c.id}` as Route}
                        className="block rounded-sm border border-signal/30 bg-signal-wash/50 p-3 transition-colors hover:border-signal/60"
                      >
                        <p className="flex items-center gap-2 text-sm font-medium text-ink">
                          <WarningCircleIcon
                            className="size-4 shrink-0 text-signal"
                            aria-hidden
                          />
                          {c.contactName ?? fmt.phone(c.contactNumber)}
                        </p>
                        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-muted">
                          {c.summary}
                        </p>
                        <p className="mt-2 font-mono text-2xs text-ink-faint">
                          {fmt.relative(c.startedAt, NOW)} · {c.agentName}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </RiseOnView>
            </>
          ),
          performance: <PerformancePanel />,
          links: <LinksPanel />,
          patterns: <PatternsPanel />,
        }}
      />
    </div>
  );
}
