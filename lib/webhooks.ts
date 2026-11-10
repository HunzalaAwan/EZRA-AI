import type { WebhookEventKey } from "@/lib/api/types";

/**
 * The events EZRA can send to a webhook, each with what it means in plain
 * words. Server-safe, so pages and the API contract share one list.
 */
export const WEBHOOK_EVENTS: { key: WebhookEventKey; group: string; label: string }[] = [
  { key: "call.completed", group: "Calls", label: "A call ended, with its summary and outcome" },
  { key: "voicemail.received", group: "Calls", label: "A caller left a voicemail" },
  { key: "transfer.started", group: "Calls", label: "The agent put a caller through to a person" },
  { key: "booking.created", group: "Bookings", label: "A booking was made" },
  { key: "booking.cancelled", group: "Bookings", label: "A booking was cancelled" },
  { key: "booking_link.converted", group: "Bookings", label: "A booking link turned into a booking" },
  { key: "contact.created", group: "Customers", label: "A new customer was added" },
  { key: "message.received", group: "Customers", label: "A text or chat message came in" },
];

/**
 * Where the public API answers. A placeholder until the backend names its
 * host; it appears only on the API tab, never in the default interface.
 */
export const API_BASE = "https://api.ezra.ai/v1";
