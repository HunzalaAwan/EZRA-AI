import type { Metadata } from "next";
import { ReviewsScreen, type ReviewTab } from "@/components/app/automations/reviews";
import { emailTemplates, reviewResults, reviewRuns, reviewSettings, workspace } from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Review requests" };

const TABS = ["results", "setup", "people"] as const;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initialTab: ReviewTab = (TABS as readonly string[]).includes(tab ?? "") ? (tab as ReviewTab) : "results";
  return (
    <ReviewsScreen
      key={initialTab}
      initial={reviewSettings}
      results={reviewResults}
      runs={reviewRuns}
      templates={emailTemplates}
      businessName={workspace.name}
      initialTab={initialTab}
    />
  );
}
