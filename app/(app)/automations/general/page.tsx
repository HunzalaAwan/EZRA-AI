import type { Metadata } from "next";
import { GeneralList } from "@/components/app/automations/general";
import { emailTemplates, messageTemplates, sentMessages } from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "General messages" };

export default function GeneralPage() {
  return (
    <GeneralList
      templates={messageTemplates}
      sent={sentMessages}
      emailNames={Object.fromEntries(emailTemplates.map((t) => [t.id, t.name]))}
    />
  );
}
