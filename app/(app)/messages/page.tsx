import type { Metadata } from "next";
import { Messages } from "@/components/app/messages";
import {
  members,
  messageTemplates,
  sentMessages,
  teamAlerts,
} from "@/lib/mock/fixtures";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <Messages
      templates={messageTemplates}
      alerts={teamAlerts}
      sent={sentMessages}
      members={members}
    />
  );
}
