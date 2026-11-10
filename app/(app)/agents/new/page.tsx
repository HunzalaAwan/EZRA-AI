import type { Metadata } from "next";
import { CreateAgentFlow } from "@/components/builder/create-agent-flow";

export const metadata: Metadata = { title: "New agent" };

/**
 * The creation flow. The product's whole positioning lives here.
 *
 * Five steps, target under 5 minutes, and one rule above all others: the owner
 * corrects pre-filled values derived from their own website. They never author
 * from blank. A blank required input in this flow is a defect.
 */
export default function NewAgentPage() {
  return <CreateAgentFlow />;
}
