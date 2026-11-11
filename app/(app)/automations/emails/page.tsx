import type { Metadata } from "next";
import { EmailLibrary } from "@/components/app/automations/email-library";
import { usedByLabel } from "@/lib/email";
import { emailTemplates, workspace } from "@/lib/mock/fixtures";
import { emailUses } from "./uses";

export const metadata: Metadata = { title: "Email templates" };

export default function EmailTemplatesPage() {
  const uses = emailUses();
  const usedBy = Object.fromEntries(emailTemplates.map((t) => [t.id, usedByLabel(t.id, uses)]));
  return <EmailLibrary templates={emailTemplates} usedBy={usedBy} businessName={workspace.name} />;
}
