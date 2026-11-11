import type { Metadata } from "next";
import { FollowUpsScreen, type FollowUpTab } from "@/components/app/automations/follow-ups";
import {
  emailTemplates,
  followUpBookings,
  followUpResults,
  followUpRuns,
  followUpSettings,
  workspace,
} from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Booking link follow-ups" };

const TABS = ["results", "setup", "people"] as const;

export default async function FollowUpsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initialTab: FollowUpTab = (TABS as readonly string[]).includes(tab ?? "") ? (tab as FollowUpTab) : "results";
  return (
    <FollowUpsScreen
      key={initialTab}
      initial={followUpSettings}
      results={followUpResults}
      bookings={followUpBookings}
      runs={followUpRuns}
      templates={emailTemplates}
      businessName={workspace.name}
      initialTab={initialTab}
    />
  );
}
