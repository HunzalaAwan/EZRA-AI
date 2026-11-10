import { redirect } from "next/navigation";

/**
 * Analytics merged into the dashboard, as switchable sections. Old links and
 * bookmarks land on the equivalent view rather than a 404.
 */
export default function AnalyticsPage() {
  redirect("/dashboard?view=performance");
}
