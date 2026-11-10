import type { Metadata } from "next";
import { AnswersArt } from "@/components/marketing/band-art";
import type { Route } from "next";
import {
  ArrowsLeftRightIcon,
  ClockCountdownIcon,
  MicrophoneIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
  TranslateIcon,
} from "@phosphor-icons/react/dist/ssr";
import { FeatureCard } from "@/components/marketing/feature-card";
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
  title: "Voice agents",
  description:
    "An agent that answers your phone by name, books into your calendar, and pages a person when it should.",
};

export default function VoicePage() {
  return (
    <>
      <PageHero
        ground="violet"
        visual={<AnswersArt />}
        title="It picks up on the first ring. Every time."
        body="Nights, weekends, and the ten minutes your front desk is walking a patient out. The caller hears a warm voice that knows your hours, your services, and what you charge for a consult."
        primary={{ label: "Build your agent", href: "/agents/new" as Route }}
        secondary={{ label: "See pricing", href: "/pricing" as Route }}
      />


      <Section className="border-y border-rule bg-panel">
        <SectionHead
          title="What a good answer actually requires."
          body="Picking up is the easy part. These are the things that decide whether a caller books or hangs up."
        />
        <RevealGroup className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: MicrophoneIcon,
              title: "Lets people interrupt",
              body: "Real callers talk over a greeting. EZRA stops mid-sentence and listens instead of finishing its script.",
            },
            {
              icon: ShieldCheckIcon,
              title: "Refuses to guess",
              body: "It will not quote a crown or promise coverage. It takes a message and says so plainly.",
            },
            {
              icon: ArrowsLeftRightIcon,
              title: "Transfers with context",
              body: "A billing dispute reaches your business office with the amount and the history already passed along.",
            },
            {
              icon: ClockCountdownIcon,
              title: "Knows the clock",
              body: "Different behaviour at 11am and 11pm. After hours it pages on-call rather than offering Tuesday.",
            },
            {
              icon: TranslateIcon,
              title: "Switches language",
              body: "When the caller answers in Spanish, so does EZRA, on the same number.",
            },
            {
              icon: PhoneCallIcon,
              title: "Sounds like a person",
              body: "Four voices, adjustable pace. You hear your own greeting in each one before you choose.",
            },
          ].map((c, i) => (
            <RevealItem key={c.title}>
              <FeatureCard {...c} tone={((i % 4) + 1) as 1 | 2 | 3 | 4} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Steps
        title="Keep the number on your door."
        body="Patients dial what they have always dialled. You decide how it reaches EZRA."
        steps={[
          {
            title: "Forward your existing line",
            body: "Five minutes in your phone company's website. Your number stays exactly where it is, and you can undo it whenever you want.",
          },
          {
            title: "Or move the number to us",
            body: "We handle the paperwork with your carrier. It rings where it rings today until the day the move completes.",
          },
          {
            title: "Send only the overflow",
            body: "Many offices forward on busy and on no-answer only, so a person still picks up first when one is free.",
          },
          {
            title: "Claim a second number",
            body: "Useful for an after-hours line, a Spanish line, or a campaign you want to measure on its own.",
          },
        ]}
      />

      <Faq
        items={[
          {
            q: "Will callers know it is not a person?",
            a: "Some will and some will not. EZRA does not claim to be human, and if a caller asks directly it says so and offers to take a message or transfer. Pretending would cost you more trust than it buys.",
          },
          {
            q: "What happens if it cannot answer something?",
            a: "It says it wants to get the answer right rather than guess, takes a callback number and the reason, and flags the conversation in your inbox. You see exactly what it could not handle and why.",
          },
          {
            q: "Can I hear it before it goes live?",
            a: "That is the last step of setup. You place a real call to the agent in your browser and talk to it. Nothing is reachable by the public until you publish.",
          },
          {
            q: "What about a real emergency?",
            a: "You define what counts as one in plain words. For a dental practice that is usually bleeding that will not stop, facial swelling, or a knocked-out tooth. EZRA recognises those and pages your on-call number immediately.",
          },
          {
            q: "Does it record calls?",
            a: "Yes, with a transcript beside every recording. Retention and consent settings are being finalised with counsel, and we will confirm the specifics before your account goes live.",
          },
        ]}
      />

      <ClosingCta
        title="Hear it answer your own phone."
        body="Paste your website, pick a voice, and place a test call. It takes about five minutes."
      />
    </>
  );
}
