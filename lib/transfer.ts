import type { AgentTransfer, HandoffTarget, HandoffTriggerKey, TransferStep } from "@/lib/api/types";
import * as fmt from "@/lib/format";

/**
 * Transfer to a person, as plain values and sentences. Server-safe, so the
 * agent page and Phone numbers can read a setting back without importing the
 * client editor.
 */

export const NO_TRANSFER: AgentTransfer = {
  enabled: false,
  triggers: ["asks-for-person"],
  customTriggers: [],
  to: [],
  style: "warm",
  ifNoAnswer: "message",
  textSummary: true,
  say: "Of course. Let me put you through to someone now. One moment.",
};

/** The reason, as it reads after "When a caller...". */
const REASON: Record<HandoffTriggerKey, string> = {
  "asks-for-person": "asks for a person",
  emergency: "sounds urgent",
  upset: "is upset",
  billing: "has a billing question",
  "repeat-caller": "calls a third time in a day",
  "agent-unsure": "asks something the agent is not sure of",
};

const FALLBACK_SAYS: Record<AgentTransfer["ifNoAnswer"], string> = {
  message: "takes a message and texts it to you",
  callback: "books a time for someone to call back",
  voicemail: "sends the caller to voicemail",
};

export function stepName(s: TransferStep, people: HandoffTarget[]) {
  if (s.kind === "person") return people.find((p) => p.id === s.ref)?.name ?? "a team member";
  if (s.label) return s.label;
  return s.ref.replace(/\D/g, "").length >= 10 ? fmt.phone(s.ref) : "a phone number";
}

/** "A, then B, then C" */
export function transferTargets(t: AgentTransfer, people: HandoffTarget[]) {
  return t.to.map((s) => stepName(s, people)).join(", then ");
}

/** Whether the setting is on but missing what it needs to work. */
export function transferIncomplete(t: AgentTransfer) {
  return t.enabled && (t.to.length === 0 || t.triggers.length + t.customTriggers.length === 0);
}

/** The whole setting as one sentence a person can check at a glance. */
export function describeTransfer(t: AgentTransfer, people: HandoffTarget[], agentName: string) {
  if (!t.enabled) {
    return `${agentName} never transfers. It answers what it can and takes a message for the rest.`;
  }
  const reasons = [...t.triggers.map((k) => REASON[k]), ...t.customTriggers];
  if (reasons.length === 0) return "No reasons are switched on yet, so nothing will start a transfer.";
  if (t.to.length === 0) return "Add someone to transfer to, or nobody will be rung.";
  // Custom reasons are the owner's own sentences. They read cleanly only in
  // the count, never spliced in after "a caller".
  const built = t.triggers.map((k) => REASON[k]);
  const extra = reasons.length - Math.min(built.length, 2);
  const named = built.slice(0, 2);
  const lead = named.length
    ? `When a caller ${named.join(" or ")}${extra > 0 ? `, or for ${extra} other ${extra === 1 ? "reason" : "reasons"}` : ""}`
    : `When one of your ${reasons.length} reasons comes up`;
  const how = t.style === "warm" ? "introduces them to" : "puts them straight through to";
  return `${lead}, ${agentName} ${how} ${transferTargets(t, people)}. If nobody picks up, it ${FALLBACK_SAYS[t.ifNoAnswer]}.`;
}
