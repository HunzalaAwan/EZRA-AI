import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageEditor } from "@/components/app/automations/general";
import { emailTemplates, messageTemplates, sentMessages, workspace } from "@/lib/mock/fixtures";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: messageTemplates.find((t) => t.id === id)?.name ?? "Message" };
}

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const message = messageTemplates.find((t) => t.id === id);
  if (!message) notFound();
  return (
    <MessageEditor
      key={id}
      initial={message}
      emailTemplates={emailTemplates}
      sent={sentMessages.filter((s) => s.templateKey === message.key)}
      businessName={workspace.name}
    />
  );
}
