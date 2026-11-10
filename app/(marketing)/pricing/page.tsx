import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  Section,
  SectionHead,
} from "@/components/marketing/sections";
import { Faq, PageHero } from "@/components/marketing/page-kit";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "What each EZRA plan includes. Talk to us for the number that fits how many calls you actually take.",
};

/**
 * Pricing.
 *
 * Prices, plan limits, and per-minute rates are explicitly undecided in
 * PRODUCT.md. This page therefore ships the full surface with real feature
 * differences and no invented dollar amounts. When the numbers are set they
 * drop into PLANS and nothing else changes.
 *
 * Inventing a price on a public page would be a claim, not a placeholder.
 */

interface Plan {
  name: string;
  who: string;
  /** Left null until pricing is decided. Do not fill this in with a guess. */
  price: string | null;
  /** What stands in for the price until there is one. */
  rate: string;
  cta: string;
  featured?: boolean;
  includes: string[];
}

const PLANS: Plan[] = [
  {
    name: "Single line",
    who: "One location, one number, one agent answering.",
    price: null,
    rate: "By call volume",
    cta: "Talk to us",
    includes: [
      "One voice agent on one number",
      "Website chat on one site",
      "Recordings, transcripts, and summaries",
      "Calendar booking into one calendar",
      "Call forwarding or number porting",
      "Email support",
    ],
  },
  {
    name: "Practice",
    who: "Most offices land here. Several agents, real integrations.",
    price: null,
    rate: "By call volume",
    cta: "Talk to us",
    featured: true,
    includes: [
      "Everything in Single line",
      "Unlimited agents, including an after-hours line",
      "A second language on the same number",
      "Practice management and CRM integrations",
      "Team accounts with roles",
      "Warm transfer to a person with context",
      "Priority support",
    ],
  },
  {
    name: "Multi location",
    who: "Several sites, shared reporting, one place to manage it.",
    price: null,
    rate: "Quoted per site",
    cta: "Talk to sales",
    includes: [
      "Everything in Practice",
      "Per-location numbers, agents, and hours",
      "Reporting rolled up across locations",
      "Single sign-on",
      "A named contact and onboarding help",
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        title="Priced on how much your phone rings."
        body="Every plan includes the recordings, the transcripts, and the booking. What changes is how many agents you run and what they connect to."
      />

      <Section className="pt-0">
        <RevealGroup className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <RevealItem key={plan.name}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-lg border bg-surface p-6 edge-light",
                  plan.featured
                    ? "border-primary/45 shadow-glow"
                    : "border-rule",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold tracking-[-0.025em] text-ink">
                    {plan.name}
                  </h2>
                  {plan.featured && (
                    <span className="rounded-full border border-primary/25 bg-primary-wash px-2.5 py-0.5 text-2xs font-medium text-primary">
                      Most offices
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {plan.who}
                </p>

                <div className="mt-6 border-y border-rule py-5">
                  {plan.price ? (
                    <p
                      data-numeric
                      className="font-display text-3xl font-semibold text-ink"
                    >
                      {plan.price}
                    </p>
                  ) : (
                    <>
                      <p className="font-display text-xl font-semibold text-ink">
                        {plan.rate}
                      </p>
                      {/* The reasoning is stated once, on the plan most
                          offices land on, rather than three times over. */}
                      {plan.featured ? (
                        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                          We are still setting rates by call volume and we would
                          rather quote you honestly than publish a number that
                          does not fit your office.
                        </p>
                      ) : null}
                    </>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.includes.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckIcon
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        weight="bold"
                        aria-hidden
                      />
                      <span className="text-sm leading-relaxed text-ink-muted">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.featured ? "primary" : "secondary"}
                  size="lg"
                  className="mt-7 w-full"
                >
                  <Link href={"/agents/new" as Route}>
                    {plan.cta}
                    <ArrowRightIcon aria-hidden />
                  </Link>
                </Button>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="mt-8">
          <p className="mx-auto max-w-[60ch] text-center text-sm leading-relaxed text-ink-muted">
            You can build an agent and place a test call before any of this
            matters. Nothing is reachable by the public until you publish it.
          </p>
        </Reveal>
      </Section>

      <Section className="border-y border-rule bg-panel">
        <SectionHead
          title="What every plan includes."
          body="These are not upsells. An agent that cannot do them is not worth having."
        />
        <RevealGroup className="mt-10 grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
          {[
            "Setup that reads your website and fills itself in",
            "A real test call before anything goes live",
            "Recording plus a synchronized transcript on every call",
            "A plain summary of what happened, per conversation",
            "Flagging when the agent chose not to guess",
            "Keeping the number already on your door",
            "Hours, holidays, and different behaviour after close",
            "Handoff to a person with the context passed along",
          ].map((f) => (
            <RevealItem key={f} className="flex items-start gap-2.5 py-1">
              <CheckIcon
                className="mt-0.5 size-4 shrink-0 text-primary"
                weight="bold"
                aria-hidden
              />
              <span className="text-sm leading-relaxed text-ink-muted">{f}</span>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Faq
        items={[
          {
            q: "Why is there no price on this page?",
            a: "Because we have not set one yet, and a made-up number would waste your time and ours. Rates will depend on how many minutes your office actually uses. Tell us roughly how many calls you take in a week and we will give you a real figure.",
          },
          {
            q: "What happens if we go over our minutes?",
            a: "The agents keep answering. Nothing switches off mid-month, because a missed call costs you far more than the overage does. The extra minutes appear on the next invoice.",
          },
          {
            q: "Is there a contract?",
            a: "Terms are being finalised. What we can tell you now is that we are not planning to lock anyone into a year to try this.",
          },
          {
            q: "Do you charge for the phone number?",
            a: "Numbers carry a small monthly cost each. If you forward your existing line instead of claiming a new one, there is nothing extra.",
          },
          {
            q: "What about patient privacy?",
            a: "Recording retention, consent language, and our compliance posture for dental and veterinary practices are being worked through with counsel. We will put the specifics in writing before your account handles a real call, rather than claim a certification we do not yet hold.",
          },
        ]}
      />

      <section className="border-t border-rule px-5 py-20 sm:px-8 sm:py-24">
        <Reveal className="mx-auto max-w-[44rem] text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">
            Tell us how busy your phone is.
          </h2>
          <p className="mx-auto mt-5 max-w-[44ch] text-lg leading-relaxed text-ink-muted">
            We will come back with a number that fits, and you can try the
            agent before you decide anything.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg">
              <Link href={"/agents/new" as Route}>
                Build your agent first
                <ArrowRightIcon aria-hidden />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
