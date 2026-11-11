import type { MessageTemplateKey } from "@/lib/api/types";

/**
 * The everyday messages EZRA sends after a conversation, without React.
 * Server-safe, so pages can resolve them before anything reaches the client.
 */

/** When each message can go out, in the words the owner would use. The first is the default. */
export const TIMING: Partial<Record<MessageTemplateKey, string[]>> = {
  "booking-confirmation": ["Right after the agent books something", "Five minutes after the call ends"],
  "booking-link": ["When the caller would rather book themselves", "Right after the call ends"],
  "missed-call": [
    "When a call drops before the agent could help",
    "Two minutes after a call drops, if they have not called back",
    "Ten minutes after a call drops, if they have not called back",
  ],
  reminder: ["The day before a booking", "Two days before a booking", "Two hours before a booking", "The day before, and again two hours before"],
};

/** Why a message cannot go by email, when it cannot. */
export const NO_EMAIL: Partial<Record<MessageTemplateKey, string>> = {
  "missed-call": "A dropped call leaves a phone number, not an email address, so this one is a text.",
  "booking-link": "The link goes out during the call, so it is a text they can tap straight away.",
};

/** What each message is for, for the line under its name. */
export const PURPOSE_LINE: Partial<Record<MessageTemplateKey, string>> = {
  "booking-confirmation": "Tells them they are booked, with the time and place, so nobody forgets or turns up at the wrong office.",
  "booking-link": "Lets a caller pick their own time without staying on the phone.",
  "missed-call": "Catches the people who hang up before the agent can help, before they call someone else.",
  reminder: "Cuts no-shows. Replies to it reschedule or confirm without a call.",
};
