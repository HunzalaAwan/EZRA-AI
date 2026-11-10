import type { Metadata } from "next";
import { ContactsList } from "@/components/app/contacts-list";
import { CommsButton } from "@/components/app/comms";
import { contacts } from "@/lib/mock/fixtures";
import * as fmt from "@/lib/format";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  const followUps = contacts.filter((c) => c.followUp).length;
  const neverBooked = contacts.filter((c) => c.bookings === 0).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink">
            Contacts
          </h2>
          <p className="mt-1.5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
            Everyone who has called or chatted.{" "}
            <span data-numeric className="font-mono text-ink">{fmt.count(followUps)}</span>{" "}
            waiting on a follow up, and{" "}
            <span data-numeric className="font-mono text-ink">{fmt.count(neverBooked)}</span>{" "}
            talked to an agent but never booked.
          </p>
        </div>
        <div className="flex gap-2">
          <CommsButton action="text" label="New message" size="md" />
          <CommsButton action="call" label="Call someone" size="md" variant="primary" />
        </div>
      </div>
      <ContactsList contacts={contacts} />
    </div>
  );
}
