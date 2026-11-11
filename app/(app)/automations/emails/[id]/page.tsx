import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmailEditor } from "@/components/app/automations/email-editor";
import type { EmailPurpose } from "@/lib/api/types";
import { PURPOSE, draftFor, usedByLabel } from "@/lib/email";
import { NOW, emailTemplates, workspace } from "@/lib/mock/fixtures";
import { emailUses } from "../uses";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: id === "new" ? "New email template" : (emailTemplates.find((t) => t.id === id)?.name ?? "Email template") };
}

export default async function EmailTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; purpose?: string }>;
}) {
  const { id } = await params;
  const { from, purpose } = await searchParams;

  if (id === "new") {
    const source = emailTemplates.find((t) => t.id === from);
    const initial = source
      ? { ...source, id: "new", name: `Copy of ${source.name}`, updatedAt: NOW.toISOString() }
      : draftFor(purpose && Object.hasOwn(PURPOSE, purpose) ? (purpose as EmailPurpose) : "follow-up", NOW.toISOString());
    return <EmailEditor key={`new-${from ?? purpose ?? ""}`} initial={initial} isNew businessName={workspace.name} usedBy={null} />;
  }

  const template = emailTemplates.find((t) => t.id === id);
  if (!template) notFound();
  return <EmailEditor key={id} initial={template} isNew={false} businessName={workspace.name} usedBy={usedByLabel(id, emailUses())} />;
}
