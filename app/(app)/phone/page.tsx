import type { Metadata } from "next";
import { NumbersPanel } from "@/components/app/numbers-panel";
import { agentTransfers, agents, handoffTargets, phoneNumbers } from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Phone numbers" };

/**
 * Your EZRA numbers and where each one rings. A number's route can send a
 * call to an AI agent, a team member, any phone number, or voicemail, in
 * order, so this one page is where every call path is set.
 */
export default function PhonePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">
          Phone numbers
        </h2>
        <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
          Choose where each number rings, in order: an AI agent, a person on your
          team, any phone number, or voicemail. When an agent answers, it can put
          the caller through to a person.
        </p>
      </div>
      <NumbersPanel
        numbers={phoneNumbers}
        directory={{ agents, people: handoffTargets }}
        transfers={agentTransfers}
      />
    </div>
  );
}
