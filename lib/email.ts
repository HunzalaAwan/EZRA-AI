import type { EmailBlock, EmailBlockKind, EmailLink, EmailPurpose, EmailTemplate } from "@/lib/api/types";

/**
 * Email templates without React. Server-safe, so pages can resolve names and
 * "used by" lines before anything reaches the client.
 *
 * An email is a short list of blocks rather than free HTML. Blocks keep every
 * email readable on a phone, keep the button big enough to tap, and mean a
 * business never has to think about how Outlook renders a table.
 */

/** Details filled in per customer, with the sample shown in previews. */
export const EMAIL_VARS: { key: string; label: string; sample: string }[] = [
  { key: "first_name", label: "First name", sample: "Marisol" },
  { key: "business", label: "Business name", sample: "Alder Creek Dental" },
  { key: "service", label: "Service", sample: "cleaning" },
  { key: "booking_time", label: "Booking time", sample: "Thursday at 9:40am" },
  { key: "location", label: "Location", sample: "our Bend office" },
  { key: "business_phone", label: "Phone number", sample: "(541) 388-2014" },
  { key: "booking_link", label: "Booking link", sample: "ezra.to/b/k7Qm2" },
  { key: "review_link", label: "Review link", sample: "g.page/r/aldercreek" },
];

export function fillSample(text: string) {
  return EMAIL_VARS.reduce((t, v) => t.replaceAll(`{${v.key}}`, v.sample), text);
}

export const PURPOSE: Record<EmailPurpose, { label: string; hint: string }> = {
  "follow-up": { label: "Follow-up", hint: "For people who got a booking link and have not booked." },
  review: { label: "Review request", hint: "Sent after a finished booking." },
  booking: { label: "Booking", hint: "Confirmations and reminders." },
  general: { label: "General", hint: "Anything else you send." },
};

export const LINK: Record<EmailLink, { label: string; sample: string }> = {
  booking_link: { label: "Their booking link", sample: "ezra.to/b/k7Qm2" },
  review_link: { label: "Your review link", sample: "g.page/r/aldercreek" },
  business_phone: { label: "Call the business", sample: "tel:+15413882014" },
  website: { label: "Your website", sample: "aldercreekdental.com" },
};

export const BLOCK: Record<EmailBlockKind, { label: string; hint: string }> = {
  heading: { label: "Heading", hint: "A short, large line at the top." },
  text: { label: "Paragraph", hint: "A few sentences in your own words." },
  button: { label: "Button", hint: "One clear thing to tap." },
  booking: { label: "Booking details", hint: "Service, time, and place, filled in for them." },
  stars: { label: "Star rating", hint: "Five stars that open your review page." },
  divider: { label: "Divider", hint: "A thin line between parts." },
  signoff: { label: "Sign-off", hint: "Who it is from." },
};

export function newBlock(kind: EmailBlockKind): EmailBlock {
  const id = `b_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  switch (kind) {
    case "heading":
      return { id, kind, text: "A short headline" };
    case "text":
      return { id, kind, text: "Hi {first_name}, " };
    case "button":
      return { id, kind, label: "Book a time", link: "booking_link" };
    case "booking":
      return { id, kind };
    case "stars":
      return { id, kind, prompt: "How was your visit? Tap to leave a review." };
    case "divider":
      return { id, kind };
    case "signoff":
      return { id, kind, text: "Thanks,", name: "The team at {business}" };
  }
}

/** A one-line summary of a block, for the collapsed list. */
export function blockSummary(b: EmailBlock) {
  switch (b.kind) {
    case "heading":
    case "text":
      return fillSample(b.text);
    case "button":
      return `${b.label}, opens ${LINK[b.link].label.toLowerCase()}`;
    case "booking":
      return "Cleaning, Thursday at 9:40am, our Bend office";
    case "stars":
      return b.prompt;
    case "divider":
      return "A thin line";
    case "signoff":
      return `${b.text} ${fillSample(b.name)}`;
  }
}

/** What a template must contain to do its job. Null when it is fine. */
export function templateProblem(t: Pick<EmailTemplate, "subject" | "blocks" | "purpose">): string | null {
  if (!t.subject.trim()) return "Add a subject line. It is the first thing they read.";
  if (t.blocks.length === 0) return "Add at least one block.";
  const links = t.blocks.flatMap((b) => (b.kind === "button" ? [b.link] : b.kind === "stars" ? ["review_link" as const] : []));
  if (t.purpose === "follow-up" && !links.includes("booking_link"))
    return "A follow-up needs a button to their booking link, or there is nothing to tap.";
  if (t.purpose === "review" && !links.includes("review_link"))
    return "A review request needs a star rating or a button to your review link.";
  return null;
}

export const BLANK_STYLE: EmailTemplate["style"] = {
  accent: "#0f766e",
  corners: "soft",
  font: "modern",
  header: "band",
};

/** The postal footer every email carries, with the way out. */
export const EMAIL_FOOTER = {
  address: "Alder Creek Dental Group, 1450 NE Purcell Blvd, Bend, OR 97701",
  reason: "You are getting this because you booked or asked about a visit with us.",
};

/** Where each automation's emails are used, by template id. */
export function usedByLabel(
  id: string,
  uses: { templateId: string | null; label: string }[],
): string | null {
  const names = uses.filter((u) => u.templateId === id).map((u) => u.label);
  return names.length ? names.join(", ") : null;
}

/** A sensible first draft for a new template, so nobody starts from nothing. */
export function draftFor(purpose: EmailPurpose, now: string): EmailTemplate {
  const id = (n: number) => `b_new${n}`;
  const base = { __fixture: true as const, id: "new", purpose, preheader: "A quick note from {business}.", style: BLANK_STYLE, updatedAt: now };
  switch (purpose) {
    case "review":
      return {
        ...base,
        name: "New review request",
        subject: "Thanks for visiting {business}, {first_name}",
        blocks: [
          { id: id(1), kind: "heading", text: "Thanks for coming in" },
          { id: id(2), kind: "text", text: "Hi {first_name}, we hope your {service} went well. Would you share how it went?" },
          { id: id(3), kind: "stars", prompt: "Tap a star to leave a review." },
          { id: id(4), kind: "signoff", text: "Thank you,", name: "The team at {business}" },
        ],
      };
    case "booking":
      return {
        ...base,
        name: "New booking email",
        subject: "Your {service} on {booking_time}",
        blocks: [
          { id: id(1), kind: "heading", text: "See you soon, {first_name}" },
          { id: id(2), kind: "booking" },
          { id: id(3), kind: "button", label: "Change or cancel", link: "booking_link" },
          { id: id(4), kind: "signoff", text: "Thanks,", name: "{business}" },
        ],
      };
    case "general":
      return {
        ...base,
        name: "New email",
        subject: "A note from {business}",
        blocks: [
          { id: id(1), kind: "text", text: "Hi {first_name}, " },
          { id: id(2), kind: "signoff", text: "Thanks,", name: "{business}" },
        ],
      };
    default:
      return {
        ...base,
        name: "New follow-up",
        subject: "Your {service} is still open to book",
        blocks: [
          { id: id(1), kind: "heading", text: "Still want to come in?" },
          { id: id(2), kind: "text", text: "Hi {first_name}, the link below shows every open time. It takes under a minute." },
          { id: id(3), kind: "button", label: "See open times", link: "booking_link" },
          { id: id(4), kind: "signoff", text: "Hope to see you soon,", name: "The team at {business}" },
        ],
      };
  }
}
