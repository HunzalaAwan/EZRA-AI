import { AppShell } from "@/components/app/shell";
import { conversations } from "@/lib/mock/fixtures";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const needsReview = conversations.filter((c) => c.needsReview).length;
  return <AppShell needsReview={needsReview}>{children}</AppShell>;
}
