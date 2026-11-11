import type { Metadata } from "next";
import { TeamAlerts } from "@/components/app/automations/team";
import { members, teamAlerts } from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Team alerts" };

export default function TeamAlertsPage() {
  return <TeamAlerts alerts={teamAlerts} members={members} />;
}
