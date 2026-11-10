import type { Metadata } from "next";
import { KnowledgeBase } from "@/components/app/knowledge-base";
import {
  agents,
  dailyNotice,
  knowledgeGaps,
  knowledgeSources,
} from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Knowledge" };

/**
 * Workspace-wide knowledge. The per-agent view of the same sources lives in
 * each agent's builder; this is the place the office manager comes to see what
 * callers asked that nobody had told the agent, and to fix it in a sentence.
 */
export default function KnowledgePage() {
  return (
    <KnowledgeBase
      sources={knowledgeSources}
      gaps={knowledgeGaps}
      notice={dailyNotice}
      agents={agents}
    />
  );
}
