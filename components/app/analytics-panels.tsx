import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookingLinkChart,
  HourlyChart,
  OutcomeBars,
} from "@/components/app/charts";
import { StatTile } from "@/components/app/stat-tile";
import { channelLabel, outcomeLabel } from "@/lib/labels";
import { Rise, Stagger } from "@/components/motion/primitives";
import {
  agents,
  bookingLinks,
  conversations,
  dashboardSummary,
} from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";

/**
 * What used to be the Analytics page, as three panels the dashboard switches
 * between. Server components: the numbers are computed once, here, and the
 * client switcher only decides which one is showing.
 */

export function PerformancePanel() {
  const totalMinutes = Math.round(
    conversations.reduce((acc, c) => acc + c.durationSeconds, 0) / 60,
  );
  const avgSeconds = Math.round(
    conversations.reduce((acc, c) => acc + c.durationSeconds, 0) /
      Math.max(1, conversations.length),
  );
  const totalCost = conversations.reduce((acc, c) => acc + c.costCents, 0);
  const contained = agents.filter((a) => a.status !== "draft");
  const avgContainment =
    contained.reduce((acc, a) => acc + a.containmentRate, 0) /
    Math.max(1, contained.length);
  const s = dashboardSummary;

  return (
    <>
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Rise><StatTile
          label="Containment"
          tone="violet"
          icon="gauge"
          value={fmt.percent(avgContainment)}
          countTo={avgContainment}
          formatAs="percent"
          note="across published agents"
        /></Rise>
        <Rise><StatTile
          label="Average call length"
          tone="teal"
          icon="timer"
          value={fmt.durationWords(avgSeconds)}
          note="phone and chat combined"
        /></Rise>
        <Rise><StatTile
          label="Minutes used"
          tone="gold"
          icon="minutes"
          value={fmt.count(s.minutesUsed)}
          countTo={s.minutesUsed}
          formatAs="count"
          unit={`of ${fmt.count(s.minutesIncluded)}`}
          note="this billing period"
        /></Rise>
        <Rise><StatTile
          label="Spend on conversations"
          tone="pink"
          icon="money"
          value={fmt.money(totalCost)}
          countTo={totalCost}
          formatAs="money"
          note={`${fmt.count(totalMinutes)} minutes of talk time`}
        /></Rise>
      </Stagger>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>By agent</CardTitle>
            <CardDescription>
              Where volume is going and which agents finish what they start.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-rule bg-sunken text-2xs text-ink-muted">
                  <th scope="col" className="px-5 py-2.5 text-left font-medium">
                    Agent
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">
                    Handled
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">
                    Booked
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">
                    Contained
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">
                    Avg length
                  </th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-rule last:border-b-0 hover:bg-panel"
                  >
                    <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                      {a.name}
                    </th>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {fmt.count(a.conversations7d)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {fmt.count(a.bookings7d)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {a.status === "draft" ? (
                        <span className="text-ink-faint">not published</span>
                      ) : (
                        fmt.percent(a.containmentRate)
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {a.avgHandleSeconds > 0
                        ? fmt.durationWords(a.avgHandleSeconds)
                        : "0s"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function LinksPanel() {
  const sentTrend = fmt.delta(bookingLinks.sent7d, bookingLinks.sent7dPrev);
  const linkBookedTrend = fmt.delta(
    bookingLinks.booked7d,
    bookingLinks.booked7dPrev,
  );
  const linkRate =
    bookingLinks.sent7d > 0 ? bookingLinks.booked7d / bookingLinks.sent7d : 0;

  return (
    <>
      {/* Booking links. The agent texts a link, or drops it into chat, and a
          booking that comes back through it counts here. A booking from a
          link is a subset of links sent, so the chart stacks on one axis and
          the tiles above it are the sums of the same daily rows. Which system
          the link points at (an online booking page today; FareHarbor or Ezra
          Pro once connected) is a row in the table, never a second chart. */}
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">
          Booking links the agent sent
        </h3>
        <p className="mt-0.5 max-w-[62ch] text-sm text-ink-muted">
          By text after a call, or in chat. A link counts as booked when the
          booking that came back was made through it.
        </p>
      </div>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Rise><StatTile
          label="Links sent"
          tone="violet"
          icon="link"
          value={fmt.count(bookingLinks.sent7d)}
          countTo={bookingLinks.sent7d}
          formatAs="count"
          trend={{ ...sentTrend, good: sentTrend.direction === "up" }}
          note="vs the week before"
        /></Rise>
        <Rise><StatTile
          label="Booked from a link"
          tone="teal"
          icon="check"
          value={fmt.count(bookingLinks.booked7d)}
          countTo={bookingLinks.booked7d}
          formatAs="count"
          trend={{
            ...linkBookedTrend,
            good: linkBookedTrend.direction === "up",
          }}
          note="vs the week before"
        /></Rise>
        <Rise><StatTile
          label="Link to booking"
          tone="pink"
          icon="percent"
          value={fmt.percent(linkRate)}
          countTo={linkRate}
          formatAs="percent"
          note={`${fmt.count(bookingLinks.opened7d)} of ${fmt.count(bookingLinks.sent7d)} links were opened`}
        /></Rise>
      </Stagger>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Sent and booked, by day</CardTitle>
              <CardDescription>Two weeks.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BookingLinkChart data={bookingLinks.daily} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Where the links went</CardTitle>
              <CardDescription>
                By channel, and by the system the booking landed in.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule bg-sunken text-2xs text-ink-muted">
                  <th scope="col" className="px-5 py-2.5 text-left font-medium">
                    Through
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">
                    Sent
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">
                    Booked
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookingLinks.byChannel.map((r) => (
                  <tr key={r.channel} className="border-b border-rule">
                    <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                      {channelLabel(r.channel)}
                    </th>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {fmt.count(r.sent)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {fmt.count(r.booked)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {fmt.percent(r.sent > 0 ? r.booked / r.sent : 0)}
                    </td>
                  </tr>
                ))}
                {bookingLinks.byPlatform.map((r) => (
                  <tr key={r.platform} className="border-b border-rule last:border-b-0">
                    <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                      {r.name}
                    </th>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {fmt.count(r.sent)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {fmt.count(r.booked)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink">
                      {fmt.percent(r.sent > 0 ? r.booked / r.sent : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function PatternsPanel() {
  const s = dashboardSummary;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Hour of day</CardTitle>
              <CardDescription>
                The closed hours are the ones you were not covering before.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <HourlyChart data={s.hourly} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Outcomes</CardTitle>
              <CardDescription>Every channel, last 7 days.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <OutcomeBars
              data={s.outcomes.map((o) => ({
                label: outcomeLabel(o.outcome),
                count: o.count,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
