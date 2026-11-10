import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AgentBuilder } from "@/components/builder/agent-builder";
import { isSection } from "@/lib/agent-sections";
import { NO_TRANSFER } from "@/lib/transfer";
import {
  agentActions,
  agentTransfers,
  agentVersions,
  agents,
  handoffTargets,
  handoffTriggers,
  phoneNumbers,
} from "@/lib/mock/fixtures";
import { knowledgeSources } from "@/lib/mock/fixtures";
import { phone } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const agent = agents.find((a) => a.id === id);
  return { title: agent?.name ?? "Agent" };
}

export default async function AgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { id } = await params;
  const { section } = await searchParams;
  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();

  const number = phoneNumbers.find((n) => n.id === agent.numberId);

  // The fixture set details the front desk agent. Others fall back to its
  // shape so every agent opens rather than showing an empty builder.
  const knowledge = knowledgeSources.filter(
    (k) => k.agentId === agent.id || agent.id !== "ag_frontdesk",
  );
  const actions = agentActions.filter(
    (a) => a.agentId === agent.id || agent.id !== "ag_frontdesk",
  );
  const versions = agentVersions.filter((v) => v.agentId === agent.id);

  return (
    <AgentBuilder
      agent={agent}
      knowledge={knowledge}
      actions={actions}
      versions={versions}
      numberLabel={number ? `${phone(number.e164)}, ${number.label}` : null}
      transfer={agentTransfers[agent.id] ?? NO_TRANSFER}
      people={handoffTargets}
      triggers={handoffTriggers}
      initialSection={isSection(section) ? section : undefined}
    />
  );
}
