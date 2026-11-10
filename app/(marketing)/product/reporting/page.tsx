import type { Metadata } from "next";
import { AnswersArt, ReportArt } from "@/components/marketing/band-art";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  Section,
  SectionHead,
} from "@/components/marketing/sections";
import { ClosingCta, PageHero } from "@/components/marketing/page-kit";

export const metadata: Metadata = {
  title: "Call review and reporting",
  description:
    "Every call and chat arrives with a recording, a transcript, and a plain summary of what the agent did. The ones it refused to answer are flagged.",
};

/**
 * Reporting. The shape is deliberately the most visual of the product pages:
 * the analytics capture at full width, what lands on every conversation as a
 * plain row, then the review surface itself. No questions block here, because
 * the two captures answer most of them on sight.
 */
export default function ReportingPage() {
  return (
    <>
      <PageHero
        ground="media"
        visual={<ReportArt />}
        title="You were not there. You can still hear what was said."
        body="Every call and every chat arrives with a recording, a transcript you can scrub through, and a summary in plain words. The ones the agent refused to answer are marked, and the rest are there if you want them."
        primary={{ label: "Build your agent", href: "/agents/new" as Route }}
        secondary={{ label: "See pricing", href: "/pricing" as Route }}
      />


      <Section className="border-y border-rule bg-panel">
        <SectionHead
          align="center"
          title="Four things arrive with every conversation."
          body="The same four whether it was a call at 2am or a chat at lunchtime."
        />
        <RevealGroup className="mx-auto mt-14 grid max-w-[64rem] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "The recording",
              b: "Playable from the first second, with the length of the call on it so you know what you are committing to.",
            },
            {
              t: "The transcript",
              b: "Timestamped and tied to playback. Click the line where the price came up and the audio jumps there.",
            },
            {
              t: "What happened",
              b: "Three or four sentences in your own language. What they wanted, what was agreed, what was booked and when.",
            },
            {
              t: "What the agent did",
              b: "The actions it took, listed. Booked an appointment, texted directions, took a message, transferred to a person.",
            },
          ].map((s) => (
            <RevealItem key={s.t}>
              <h3 className="font-display text-base font-semibold text-ink">
                {s.t}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {s.b}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHead
              title="Read a ten minute call in ninety seconds."
              body="Open the conversation and the summary is already written. Play the recording only when the summary makes you want to hear the tone of it."
            />
            <RevealGroup className="mt-8 space-y-4">
              {[
                "The conversations that needed a person are marked, not buried in a list",
                "Search what was actually said, so you can find every caller who asked about a service you do not offer yet",
                "The closed hours are counted on their own, because that is the coverage you did not have before",
              ].map((line) => (
                <RevealItem key={line} className="flex items-start gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <p className="text-base text-ink-muted">{line}</p>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal delay={0.1} className="mt-8">
              <Button asChild variant="secondary" size="lg">
                <Link href={"/product/scheduling" as Route}>
                  How booking works
                </Link>
              </Button>
            </Reveal>
          </div>
          <Reveal delay={0.08}>
            <AnswersArt />
          </Reveal>
        </div>
      </Section>

      <ClosingCta
        title="Know what your phone said all weekend."
        body="Build an agent from your own website, place a test call, and read your own transcript back."
      />
    </>
  );
}
