import type { Metadata } from "next";
import { AppShell } from "@/components/app/shell";
import { conversations } from "@/lib/mock/fixtures";

/** The app runs on fixture data, so none of it belongs in search results. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const needsReview = conversations.filter((c) => c.needsReview).length;
  return <AppShell needsReview={needsReview}>{children}</AppShell>;
}
