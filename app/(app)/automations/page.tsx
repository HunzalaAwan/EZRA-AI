import type { Metadata } from "next";
import { AutomationCards } from "@/components/app/automations/overview";
import { MessageSettings } from "@/components/app/messages";
import {
  emailTemplates,
  followUpResults,
  followUpRuns,
  followUpSettings,
  members,
  messageTemplates,
  reviewResults,
  reviewSettings,
  sentMessages,
  teamAlerts,
} from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Automations" };

/**
 * Everything EZRA sends on its own. The two automations that bring people
 * back lead, with what they achieved; the simpler messages and team alerts
 * follow.
 */
export default function AutomationsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">Automations</h2>
        <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
          The texts and emails EZRA sends on its own, so people who nearly booked come back and people who visited
          leave a review. Each one stops the moment it is no longer needed.
        </p>
      </div>
      <AutomationCards
        followUps={followUpSettings}
        followUpResults={followUpResults}
        reviews={reviewSettings}
        reviewResults={reviewResults}
        waiting={followUpRuns.filter((r) => r.state === "waiting").length}
        templateCount={emailTemplates.length}
      />
      <MessageSettings templates={messageTemplates} alerts={teamAlerts} sent={sentMessages} members={members} />
    </div>
  );
}
