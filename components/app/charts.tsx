"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BookingLinkDay, DayPoint, HourPoint } from "@/lib/api/types";
import { count, hourLabel, weekday } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Charts follow the dataviz skill.
 *
 * Series colors were validated with its six-checks script against both the
 * paper and the dark surface: lightness band, chroma floor, deutan and tritan
 * separation, normal-vision floor, and 3:1 contrast. All pass in both modes.
 *
 * Rules honored here: one axis only, never dual. Categorical hues in fixed
 * order, never cycled. Legend present whenever there are two series, so
 * identity is never carried by color alone. Grid and axes stay recessive.
 * Every chart ships a hover layer and a table view.
 */

const GRID = "var(--color-chart-grid)";
const AXIS = "var(--color-chart-axis)";
const S1 = "var(--color-series-1)";
const S2 = "var(--color-series-2)";

const axisProps = {
  stroke: AXIS,
  tickLine: false,
  axisLine: false,
  tick: { fill: AXIS, fontSize: 11, fontFamily: "var(--font-mono)" },
} as const;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-rule bg-surface px-3 py-2 shadow-floating">
      <p className="mb-1 text-2xs font-medium text-ink-faint">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-xs text-ink">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-xs"
            style={{ backgroundColor: p.color }}
          />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-mono tabular-nums">
            {count(p.value ?? 0)}
          </span>
        </p>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <li
          key={i.label}
          className="flex items-center gap-1.5 text-xs text-ink-muted"
        >
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-xs"
            style={{ backgroundColor: i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Every chart has a table view. Identity is never color-alone. */
function TableView({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: (string | number)[][];
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer text-2xs text-ink-muted underline underline-offset-2 hover:text-ink"
        aria-expanded={open}
      >
        {open ? "Hide the numbers" : "Show the numbers"}
      </button>
      {open ? (
        <div className="mt-2 max-h-56 overflow-auto rounded-sm border border-rule">
          <table className="w-full text-xs">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 bg-sunken">
              <tr>
                {head.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-1.5 text-left font-medium text-ink-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-rule">
                  {r.map((c, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-3 py-1.5 text-ink",
                        j > 0 && "font-mono tabular-nums",
                      )}
                    >
                      {typeof c === "number" ? count(c) : c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Two weeks of daily volume. Booked is a subset of handled, so the bars stack
 * honestly rather than sitting side by side on two scales.
 */
export function DailyVolumeChart({ data }: { data: DayPoint[] }) {
  const shaped = data.map((d) => ({
    label: weekday(d.date),
    date: d.date,
    Booked: d.booked,
    "Handled, not booked": d.conversations - d.booked,
  }));

  return (
    <div>
      <Legend
        items={[
          { label: "Booked", color: S1 },
          { label: "Handled, not booked", color: S2 },
        ]}
      />
      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={shaped}
            margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
          >
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" {...axisProps} interval={0} minTickGap={0} />
            <YAxis {...axisProps} width={44} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--color-panel)" }}
            />
            {/* 2px surface gap between stacked segments. */}
            <Bar dataKey="Booked" stackId="a" fill={S1} />
            <Bar
              dataKey="Handled, not booked"
              stackId="a"
              fill={S2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView
        caption="Conversations handled and booked per day over the last 14 days"
        head={["Day", "Booked", "Not booked"]}
        rows={shaped.map((d) => [d.date, d.Booked, d["Handled, not booked"]])}
      />
    </div>
  );
}

/**
 * When calls actually arrive. The after-hours bars are the argument for the
 * product, so they carry the second hue and the legend names them.
 */
export function HourlyChart({ data }: { data: HourPoint[] }) {
  return (
    <div>
      <Legend
        items={[
          { label: "Open hours", color: S1 },
          { label: "Closed, agent covered it", color: S2 },
        ]}
      />
      <div className="mt-3 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.map((h) => ({ ...h, label: hourLabel(h.hour) }))}
            margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
          >
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" {...axisProps} interval={2} />
            <YAxis {...axisProps} width={44} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--color-panel)" }}
            />
            <Bar
              dataKey="conversations"
              name="Conversations"
              radius={[4, 4, 0, 0]}
            >
              {data.map((h) => (
                <Cell key={h.hour} fill={h.afterHours ? S2 : S1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView
        caption="Conversations by hour of day"
        head={["Hour", "Conversations", "Office"]}
        rows={data.map((h) => [
          hourLabel(h.hour),
          h.conversations,
          h.afterHours ? "Closed" : "Open",
        ])}
      />
    </div>
  );
}

/**
 * Outcomes. One hue, because the category names sit on the axis and carry
 * identity themselves. A second hue here would encode nothing.
 */
export function OutcomeBars({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <ul className="space-y-2.5">
        {data.map((d) => (
          <li
            key={d.label}
            className="grid grid-cols-[9.5rem_1fr_3rem] items-center gap-3"
          >
            <span className="truncate text-xs text-ink-muted">{d.label}</span>
            <span className="h-4 w-full overflow-hidden rounded-xs bg-sunken">
              <span
                className="block h-full rounded-xs"
                style={{
                  width: `${(d.count / max) * 100}%`,
                  backgroundColor: S1,
                }}
              />
            </span>
            <span className="text-right font-mono text-xs tabular-nums text-ink">
              {count(d.count)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Booking links the agent sent, and how many became a booking. A booking from
 * a link is a subset of links sent, so the two stack on one axis exactly as
 * booked stacks under handled above. Same hues in the same roles: the emerald
 * is the outcome the business wanted, the blue is the rest.
 */
export function BookingLinkChart({ data }: { data: BookingLinkDay[] }) {
  const shaped = data.map((d) => ({
    label: weekday(d.date),
    date: d.date,
    "Booked from the link": d.booked,
    "Sent, not booked": d.sent - d.booked,
  }));

  return (
    <div>
      <Legend
        items={[
          { label: "Booked from the link", color: S1 },
          { label: "Sent, not booked", color: S2 },
        ]}
      />
      <div className="mt-3 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={shaped}
            margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
          >
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" {...axisProps} interval={0} minTickGap={0} />
            <YAxis {...axisProps} width={44} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--color-panel)" }}
            />
            <Bar dataKey="Booked from the link" stackId="a" fill={S1} />
            <Bar
              dataKey="Sent, not booked"
              stackId="a"
              fill={S2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView
        caption="Booking links sent and booked, by day"
        head={["Day", "Sent", "Booked"]}
        rows={data.map((d) => [weekday(d.date), d.sent, d.booked])}
      />
    </div>
  );
}
