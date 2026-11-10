import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  ChartLineUpIcon,
  ChatCircleDotsIcon,
  ClockCountdownIcon,
  DeviceMobileIcon,
  GlobeIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
  SlidersIcon,
  TranslateIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/marketing/hero";
import { FeatureCard } from "@/components/marketing/feature-card";
import { BigStat } from "@/components/marketing/photo";
import { Moments } from "@/components/marketing/moments";
import {
  CallLoop,
  DetailsBento,
  SetupDemo,
} from "@/components/marketing/home-showcase";
import { CardStack, StackCard } from "@/components/marketing/stack";
import { AnswersArt, BooksArt, HandsOffArt } from "@/components/marketing/band-art";
import { VideoBackground } from "@/components/marketing/video-bg";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  Section,
  SectionHead,
} from "@/components/marketing/sections";

export const metadata: Metadata = {
  title: "Never miss another call",
  description:
    "EZRA answers your phone and your website chat, books the appointment, and tells you what happened. Set it up from your own website in under five minutes.",
};

/**
 * The homepage.
 *
 * Design language taken from the reference kits: a dark stage carrying a real
 * 3D object rather than a flat gradient, very large and very tight display
 * type, and a neon accent on near-black.
 *
 * Nothing above the fold is a photograph. The two sections that carry the
 * argument are both drawn: a trade picker that plays back a call, and a plot
 * of a week against the hours anyone is there to answer it. Both were
 * photography once and both say more without it, because the claims they make
 * are about time and coverage, which a picture of someone holding a phone can
 * assert but cannot show.
 *
 * Nine sections, and no layout family repeats.
 */
export default function HomePage() {
  return (
    <>
      <Hero />

      {/* --------------------------------------------------------------
          Three bands. Each is a deep coloured object that pins while the next
          slides over it: what EZRA does, in the order a call happens. The
          colour carries the identity of each step and the pale display tint
          is mixed for that ground, so no band is a recolour of another.
          No step numbers: the order is the content, not a label on it.
          -------------------------------------------------------------- */}
      <section className="px-3 py-16 sm:px-5 sm:py-24">
        <div className="mx-auto mb-12 max-w-[1240px] px-2 sm:mb-16 sm:px-3">
          <SectionHead
            title="It answers. It books. It knows when to step aside."
            body="Three things, done the same way at 9am on a Tuesday and 11pm on a Saturday."
          />
        </div>
        <CardStack>
          {[
            {
              key: "answers",
              title: "Answers every call.",
              body: "First ring, every hour, in your own voice. It knows your services, your prices and your hours because it read your website before the first call came in.",
              band: "bg-band-violet",
              ink: "text-band-violet-ink",
              tags: ["Phone", "Website chat", "Spanish", "After hours"],
            },
            {
              key: "books",
              title: "Books the job.",
              body: "Finds a real open time, writes it into your calendar or booking system, and texts the confirmation before the caller has hung up.",
              band: "bg-band-indigo",
              ink: "text-band-indigo-ink",
              tags: ["Calendars", "FareHarbor", "Ezra Pro", "Booking links"],
            },
            {
              key: "hands-off",
              title: "Puts them through.",
              body: "When a caller asks for a person, or it sounds urgent, it rings your team in order, tells them who is calling and why, and only then connects.",
              band: "bg-band-claret",
              ink: "text-band-claret-ink",
              tags: ["Ring order", "Warm transfer", "Text the summary"],
            },
          ].map((c, i, all) => (
            <StackCard
              key={c.key}
              index={i}
              total={all.length}
              className={`${c.band} rounded-[2rem] sm:rounded-[3rem]`}
            >
              <div className="relative flex min-h-[34rem] flex-col gap-8 overflow-hidden p-7 sm:p-12 lg:h-[82vh] lg:min-h-[38rem] lg:flex-row lg:items-center lg:gap-12 lg:p-16">
                <div className="relative shrink-0 lg:w-[30rem]">
                  <h3 className={`display-2 ${c.ink}`}>{c.title}</h3>
                  <p className="lede mt-6 max-w-[38ch] text-on-media">
                    {c.body}
                  </p>
                  <ul className="mt-7 flex flex-wrap gap-2">
                    {c.tags.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-white/25 px-3.5 py-1.5 text-sm text-on-media"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* An illustration of the idea, not a screenshot of the app. */}
                <div className="relative min-w-0 flex-1 self-stretch">
                  {c.key === "answers" ? (
                    <AnswersArt />
                  ) : c.key === "books" ? (
                    <BooksArt />
                  ) : (
                    <HandsOffArt />
                  )}
                </div>
              </div>
            </StackCard>
          ))}
        </CardStack>
      </section>

      {/* --------------------------------------------------------------
          Four capabilities.
          -------------------------------------------------------------- */}
      <Section>
        <SectionHead
          title="Four things it does, the day you turn it on."
          body="No scripts to write. EZRA reads your website and arrives already knowing your services, your hours, and what people ask you most."
        />
        <RevealGroup className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: PhoneCallIcon,
              title: "Answers the phone",
              body: "Picks up on the first ring, at 2am, on a Sunday, and during the rush when nobody can reach the front desk.",
              href: "/product/voice" as Route,
            },
            {
              icon: ChatCircleDotsIcon,
              title: "Works your website",
              body: "Catches the visitor who was comparing three places and was about to close the tab.",
              href: "/product/chat" as Route,
            },
            {
              icon: CalendarCheckIcon,
              title: "Books the appointment",
              body: "Finds a real open slot, writes it into your calendar, and texts the confirmation.",
              href: "/product/scheduling" as Route,
            },
            {
              icon: ChartLineUpIcon,
              title: "Tells you what happened",
              body: "A recording, a transcript, and a plain summary. Only the ones needing you are flagged.",
              href: "/product/reporting" as Route,
            },
          ].map((c) => (
            <RevealItem key={c.title}>
              <FeatureCard {...c} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* --------------------------------------------------------------
          One call, start to finish, played live. See home-showcase.tsx.
          -------------------------------------------------------------- */}
      <CallLoop />

      {/* --------------------------------------------------------------
          Setup, as an animated build rather than a screenshot.
          -------------------------------------------------------------- */}
      <SetupDemo />

      {/* --------------------------------------------------------------
          The details, as a bento of live tiles rather than six equal cards.
          -------------------------------------------------------------- */}
      <DetailsBento />

      {/* --------------------------------------------------------------
          What it does all day, as two drifting streams of small moments.
          Open on the page ground, no panel.
          -------------------------------------------------------------- */}
      <Moments />

      {/* --------------------------------------------------------------
          Closing. One black panel, one sentence, one inverted pill.
          Dark in both themes, so it uses the media tokens, which never flip.
          -------------------------------------------------------------- */}
      <section className="px-3 pb-6 pt-10 sm:px-5 sm:pb-8">
        <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] bg-media px-6 py-24 text-center sm:rounded-[3rem] sm:py-36">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-full size-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-25 blur-[140px]"
          />
          <Reveal className="relative mx-auto max-w-[52rem]">
            <h2 className="display-1 text-on-media">Your phone is ringing right now.</h2>
            <p className="lede mx-auto mt-7 max-w-[42ch] text-on-media-muted">
              Paste your website, hear your agent answer, and decide from
              there. Five minutes, no prompts to write.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-on-media text-media hover:bg-white"
              >
                <Link href={"/agents/new" as Route}>
                  Build your agent
                  <ArrowRightIcon aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border-white/30 bg-transparent text-on-media hover:border-white hover:bg-transparent"
              >
                <Link href={"/pricing" as Route}>See pricing</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
