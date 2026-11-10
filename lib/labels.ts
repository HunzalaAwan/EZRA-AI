import type { ConversationOutcome, AgentGoal, Channel } from "@/lib/api/types";

/**
 * Plain-language labels, in a server-safe module.
 *
 * These live outside the client components that also render them, because a
 * Server Component importing from a "use client" file gets client references
 * rather than callable functions.
 */

const OUTCOME: Record<ConversationOutcome, string> = {
  booked: "Booked",
  lead: "Lead captured",
  answered: "Answered",
  transferred: "Transferred",
  message: "Message taken",
  missed: "Dropped",
};

export function outcomeLabel(outcome: ConversationOutcome): string {
  return OUTCOME[outcome];
}

const GOAL: Record<AgentGoal, string> = {
  book: "Takes bookings",
  qualify: "Qualifies leads",
  answer: "Answers questions",
  orders: "Takes orders",
  route: "Routes urgent calls",
};

export function goalLabel(goal: AgentGoal): string {
  return GOAL[goal];
}

export function channelLabel(channel: Channel): string {
  return channel === "voice" ? "Phone" : "Website chat";
}
