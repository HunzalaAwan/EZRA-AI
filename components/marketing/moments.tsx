import {
  ArrowsClockwiseIcon,
  BellIcon,
  CalendarCheckIcon,
  ChatCircleDotsIcon,
  CreditCardIcon,
  FirstAidIcon,
  MoonIcon,
  PawPrintIcon,
  PhoneIncomingIcon,
  ScalesIcon,
  ScissorsIcon,
  TicketIcon,
  TranslateIcon,
  UserSwitchIcon,
  VoicemailIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { SectionHead } from "./sections";
import { cn } from "@/lib/utils";

/**
 * What EZRA does all day, as two slow streams of small moments.
 *
 * Each chip is one thing done, in the business's own words: a cleaning
 * booked, a caller put through, a checkout link sent. They span the trades on
 * purpose, so every visitor finds their own kind of call in the stream.
 * Illustrative examples, never counts: there are no usage figures to quote.
 *
 * Open on the page ground, no panel. Pure CSS, so it costs no JavaScript;
 * it pauses on hover and focus so a chip can be read, and holds still under
 * reduced motion.
 */

type Tone = 1 | 2 | 3 | 4;
interface Moment {
  icon: Icon;
  text: string;
  /** A time, set in mono. Measurement only. */
  at?: string;
  tone: Tone;
}

const TOP: Moment[] = [
  { icon: PhoneIncomingIcon, text: "Answered on the first ring", at: "11:52 pm", tone: 1 },
  { icon: CalendarCheckIcon, text: "Booked a cleaning", at: "Thu 9:40", tone: 2 },
  { icon: TranslateIcon, text: "Switched to Spanish mid call", tone: 4 },
  { icon: UserSwitchIcon, text: "Put the caller through to Priya", tone: 1 },
  { icon: TicketIcon, text: "Texted a checkout link for 4 kayak tickets", tone: 3 },
  { icon: WrenchIcon, text: "Booked a leak repair", at: "4:15 pm", tone: 2 },
  { icon: ScissorsIcon, text: "Filled a cancelled color slot", at: "2:20 pm", tone: 4 },
  { icon: PawPrintIcon, text: "Booked a puppy's first checkup", tone: 3 },
];

const BOTTOM: Moment[] = [
  { icon: ChatCircleDotsIcon, text: "Answered a website chat about Invisalign", tone: 4 },
  { icon: ArrowsClockwiseIcon, text: "Moved Friday's appointment to Monday", tone: 2 },
  { icon: BellIcon, text: "Sent tomorrow's reminders", at: "6:00 pm", tone: 1 },
  { icon: FirstAidIcon, text: "Flagged an urgent toothache", tone: 3 },
  { icon: VoicemailIcon, text: "Took a message after hours", at: "9:07 pm", tone: 4 },
  { icon: CreditCardIcon, text: "Took a deposit for a consult", tone: 2 },
  { icon: ScalesIcon, text: "Ran intake for a new client", tone: 1 },
  { icon: MoonIcon, text: "Booked a Sunday night caller for Monday", at: "8:30 am", tone: 3 },
];

function Chip({ m }: { m: Moment }) {
  const MIcon = m.icon;
  return (
    <span
      style={{ "--tone": `var(--color-series-${m.tone})` } as React.CSSProperties}
      className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border border-rule bg-surface py-1.5 pl-1.5 pr-4 shadow-[0_1px_2px_rgb(10_10_10/0.04),0_10px_24px_-18px_rgb(10_10_10/0.35)]"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--tone)_14%,transparent)] text-[var(--tone)]">
        <MIcon aria-hidden className="size-4" />
      </span>
      <span className="text-sm font-medium text-ink">{m.text}</span>
      {m.at ? (
        <span data-numeric className="font-mono text-xs text-ink-muted">
          {m.at}
        </span>
      ) : null}
    </span>
  );
}

function Stream({ items, reverse, label }: { items: Moment[]; reverse?: boolean; label: string }) {
  return (
    <div className="flex overflow-hidden py-1.5 [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
      <div
        className={cn(
          "flex w-max animate-drift group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none",
          reverse && "[animation-direction:reverse]",
        )}
      >
        {/* Read once; the copy that makes the loop seamless is hidden. Each
            copy carries its own trailing gap, so sliding by half is exact. */}
        <ul aria-label={label} className="flex gap-3 pr-3">
          {items.map((m) => (
            <li key={m.text}>
              <Chip m={m} />
            </li>
          ))}
        </ul>
        <ul aria-hidden className="flex gap-3 pr-3">
          {items.map((m) => (
            <li key={m.text}>
              <Chip m={m} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Moments() {
  return (
    <section className="py-20 sm:py-28">
      <div className="px-5 sm:px-8">
        <SectionHead
          align="center"
          title="Every call ends in something done."
          body="A booking, a reminder, a message taken, or the right person on the line. Here is the kind of thing EZRA handles while you are busy with the customer in front of you."
        />
      </div>
      <div className="group mt-12 space-y-3">
        <Stream items={TOP} label="Things EZRA handles on calls" />
        <Stream items={BOTTOM} reverse label="Things EZRA handles after hours and in chat" />
      </div>
    </section>
  );
}
