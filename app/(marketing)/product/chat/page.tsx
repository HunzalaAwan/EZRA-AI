import type { Metadata } from "next";
import { AnswersArt, ChatArt } from "@/components/marketing/band-art";
import type { Route } from "next";
import Link from "next/link";
import {
  ArrowsLeftRightIcon,
  CalendarCheckIcon,
  ChatCircleDotsIcon,
  GlobeIcon,
  ShieldCheckIcon,
  TranslateIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/marketing/feature-card";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  Section,
  SectionHead,
} from "@/components/marketing/sections";
import { ClosingCta, Faq, PageHero } from "@/components/marketing/page-kit";

export const metadata: Metadata = {
  title: "Website chat",
  description:
    "A chat window that answers with your hours, your services, and a time that is genuinely open, then books it before the visitor closes the tab.",
};

/**
 * Website chat. The shape is a split against the builder capture, one dense
 * grid of what the window actually does, then questions. No Steps block: the
 * voice page owns that shape, and there is no phone line to move here.
 */
export default function ChatPage() {
  return (
    <>
      <PageHero
        ground="claret"
        visual={<ChatArt />}
        title="The visitor who will never call you will type."
        body="A chat window on your own site, answering at 11pm on a Sunday with your hours, your services, and a time that is actually open. It books before the tab gets closed."
        primary={{ label: "Build your agent", href: "/agents/new" as Route }}
        secondary={{ label: "See pricing", href: "/pricing" as Route }}
      />

      <Section className="pt-0">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHead
              title="One agent. Two ways to reach it."
              body="The thing answering your phone is the thing answering your website. Change your Saturday hours once and both know. There is no second version to keep in sync."
            />
            <RevealGroup className="mt-8 space-y-4">
              {[
                "The greeting a caller hears is the greeting a visitor reads",
                "Type at it yourself in the browser before anyone outside can reach it",
                "Turn chat off for a week without touching the phone line",
              ].map((line) => (
                <RevealItem key={line} className="flex items-start gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <p className="text-base text-ink-muted">{line}</p>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal delay={0.1} className="mt-8">
              <Button asChild variant="secondary" size="lg">
                <Link href={"/product/voice" as Route}>How voice works</Link>
              </Button>
            </Reveal>
          </div>
          <Reveal delay={0.08}>
            <AnswersArt />
          </Reveal>
        </div>
      </Section>

      <Section className="border-y border-rule bg-panel">
        <SectionHead
          title="What happens inside the window."
          body="Someone who has to wait until Monday for an answer has already opened a competitor in the next tab."
        />
        <RevealGroup className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ChatCircleDotsIcon,
              title: "Replies while they are reading",
              body: "No queue, no contact form, and nothing that says somebody will get back to you within one business day.",
            },
            {
              icon: CalendarCheckIcon,
              title: "Books instead of collecting",
              body: "It asks for the two or three things it needs and writes the appointment in. There is nothing waiting for you to chase in the morning.",
            },
            {
              icon: GlobeIcon,
              title: "Answers from your own pages",
              body: "It is built from the site it sits on, so it knows your services, your hours, and your service area without anyone typing them out.",
            },
            {
              icon: ArrowsLeftRightIcon,
              title: "Hands a thread to a person",
              body: "An upset visitor, a billing question, or something it should not answer goes to whoever is at the desk with the whole exchange attached.",
            },
            {
              icon: TranslateIcon,
              title: "Answers in Spanish",
              body: "When the visitor writes in Spanish, the reply comes back in Spanish, in the same window.",
            },
            {
              icon: ShieldCheckIcon,
              title: "Says when it does not know",
              body: "It will not invent a price or a policy to keep the conversation moving. It takes the question and a way to reach them back.",
            },
          ].map((c, i) => (
            <RevealItem key={c.title}>
              <FeatureCard {...c} tone={((i % 4) + 1) as 1 | 2 | 3 | 4} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Faq
        items={[
          {
            q: "How does it get onto my site?",
            a: "One line goes into your site template. If somebody built your site for you, send them that line and it is a minute of their time. On Squarespace, Wix, or WordPress it goes in the settings box for custom code.",
          },
          {
            q: "Will it look like it belongs there?",
            a: "You choose the colour, the corner it sits in, and what the button says before anyone opens it. It should read as part of your site rather than something bolted on.",
          },
          {
            q: "What if it cannot answer something?",
            a: "It says it would rather get the answer right than guess, takes a name and a way to reach them, and flags the conversation for you. You see exactly what it could not handle and why.",
          },
          {
            q: "Does it get in the way on a phone screen?",
            a: "It opens without covering the page and it closes with one tap. A visitor who ignores it is not asked a second time.",
          },
          {
            q: "Can I read what it said to people?",
            a: "Every chat lands in the same inbox as the calls, with the full exchange, a short summary, and a list of what the agent did. Nothing is hidden behind a separate report.",
          },
        ]}
      />

      <ClosingCta
        title="Answer the person who was about to close the tab."
        body="Paste your website, put the window on a test page, and type at it yourself. It takes about five minutes."
      />
    </>
  );
}
