import type { Metadata } from "next";
import { BooksArt, ReportArt } from "@/components/marketing/band-art";
import type { Route } from "next";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  Section,
  SectionHead,
} from "@/components/marketing/sections";
import {
  ClosingCta,
  Faq,
  PageHero,
  Steps,
} from "@/components/marketing/page-kit";

export const metadata: Metadata = {
  title: "Scheduling",
  description:
    "EZRA reads the calendar your office already runs on, offers a time that is genuinely free, and writes the appointment in while the caller is still on the line.",
};

/**
 * Scheduling. The shape runs sequence first, because booking is a process and
 * a process reads as steps. Then the dashboard capture, then the limits, which
 * are set as plain text rather than cards: a list of refusals should not look
 * like a list of features.
 */
export default function SchedulingPage() {
  return (
    <>
      <PageHero
        ground="indigo"
        visual={<BooksArt />}
        title="It never offers a time that is already taken."
        body="EZRA reads the calendar your office already runs on, offers what is genuinely free, and writes the appointment in while the caller is still on the line."
        primary={{ label: "Build your agent", href: "/agents/new" as Route }}
        secondary={{ label: "See pricing", href: "/pricing" as Route }}
      />

      <Steps
        title="What happens between the question and the calendar entry."
        body="Four things, all of them inside the same conversation, with nobody at the desk."
        steps={[
          {
            title: "It checks what is actually free",
            body: "Not a generic list of times. It looks at the working hours you set, the person the caller asked for, and the gaps that are already spoken for.",
          },
          {
            title: "It offers two, not twelve",
            body: "A long menu of openings makes people say they will call back. EZRA names the soonest one and one alternative, and waits.",
          },
          {
            title: "It writes the entry",
            body: "Name, number, the reason for the visit, and which service, in the calendar your team already opens every morning.",
          },
          {
            title: "It confirms in writing",
            body: "A text with the day, the time, and the address goes out before the caller has put the phone down.",
          },
        ]}
      />

      <Section>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <ReportArt />
          </Reveal>
          <div className="order-1 lg:order-2">
            <SectionHead
              title="How many it booked, on one screen."
              body="Appointments booked, conversations handled without one, and how much of it happened while you were closed. It is the number you check on a Monday morning and then get on with your day."
            />
            <RevealGroup className="mt-8 space-y-4">
              {[
                "Every booking is traceable to the conversation that made it",
                "The share that arrived outside your open hours, counted separately",
                "One flagged conversation is easier to act on than forty unread ones",
              ].map((line) => (
                <RevealItem key={line} className="flex items-start gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <p className="text-base text-ink-muted">{line}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </Section>

      <Section className="border-y border-rule bg-panel">
        <SectionHead
          title="What it will not do."
          body="Booking is the part that gets a business in trouble, so the limits are deliberate and they are yours to set."
        />
        <RevealGroup className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
          {[
            {
              t: "It will not double-book",
              b: "The calendar is read at the moment of booking, not at the start of the call. If the slot went in the last ninety seconds, it says so and offers the next one.",
            },
            {
              t: "It will not ask for a card number",
              b: "If you take a deposit, EZRA books the time and hands the payment to the process you already use. It will not read a card number back either.",
            },
            {
              t: "It will not promise a specific person",
              b: "Unless you said it could. If the person a caller asked for is booked out, it says that plainly before it offers anyone else.",
            },
            {
              t: "It will not squeeze an emergency in",
              b: "Anything you have defined as urgent goes to a human instead of into a routine slot that will not help.",
            },
          ].map((item) => (
            <RevealItem key={item.t}>
              <h3 className="font-display text-base font-semibold text-ink">
                {item.t}
              </h3>
              <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-ink-muted">
                {item.b}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Faq
        items={[
          {
            q: "Which calendar does it write into?",
            a: "Tell us what your office runs on and we will tell you where that one stands today. We would rather answer that honestly than publish a list here that is out of date by the time you read it.",
          },
          {
            q: "Can it move or cancel an appointment?",
            a: "Yes. It finds the appointment by name and number, moves it to a time that is free, and sends a fresh confirmation. A cancellation releases the slot straight away so the next caller can have it.",
          },
          {
            q: "What if two people call at the same moment?",
            a: "Only one of them gets the slot. The second caller is told it just went and is offered the next opening, which is better than two people arriving for the same appointment.",
          },
          {
            q: "How does it know how long a job takes?",
            a: "You set the length per service once. A consultation and a full appointment are not the same block of time, and the question it asks is the one that tells it which is which.",
          },
          {
            q: "We take walk-ins. Does that break it?",
            a: "No. It books only against what the calendar shows as free, so anything your team adds by hand is respected the moment it is in there.",
          },
        ]}
      />

      <ClosingCta
        title="The 6:40pm caller can book a 9am."
        body="Build an agent from your own website, connect a calendar, and watch the entry appear while you are still on the test call."
      />
    </>
  );
}
