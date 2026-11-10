/**
 * The agent builder's sections. Kept out of the client builder so the server
 * page can check a `?section=` link against it: values exported from a
 * "use client" module do not survive the trip to a Server Component.
 */
export const SECTION_IDS = [
  "identity",
  "knowledge",
  "actions",
  "transfer",
  "voice",
  "guardrails",
  "deploy",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export function isSection(v: string | undefined): v is SectionId {
  return (SECTION_IDS as readonly string[]).includes(v ?? "");
}
