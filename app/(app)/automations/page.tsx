import type { Metadata } from "next";
import { AutomationCards, OtherAutomations } from "@/components/app/automations/overview";
import {
  emailTemplates,
  followUpResults,
  followUpRuns,
  followUpSettings,
  messageTemplates,
  reviewResults,
  reviewSettings,
  teamAlerts,
} from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Automations" };

/**
 * Everything EZRA sends on its own, at a glance. The two automations that
 * bring people back lead, with what they achieved; every other message is
 * one line with a way into its own tab.
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
      />
      <OtherAutomations
        messages={messageTemplates.map(({ id, name, when, enabled, sent30d }) => ({ id, name, when, enabled, sent30d }))}
        alerts={{ on: teamAlerts.filter((a) => a.enabled).length, total: teamAlerts.length }}
        templateCount={emailTemplates.length}
      />
    </div>
  );
}
