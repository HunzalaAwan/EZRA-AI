import type { EmailBlock, EmailBlockKind, EmailLink, EmailPurpose, EmailTemplate, SocialNetwork } from "@/lib/api/types";

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
  custom: { label: "A web address you type", sample: "" },
};

/** Where a link actually goes, for the line under a button in the editor. */
export function linkTarget(link: EmailLink, url?: string) {
  if (link === "custom") return url?.trim() || "No address yet";
  return link === "business_phone" ? BUSINESS.phone : LINK[link].sample;
}

export const BLOCK: Record<EmailBlockKind, { label: string; hint: string }> = {
  heading: { label: "Heading", hint: "A short, large line." },
  text: { label: "Paragraph", hint: "A few sentences in your own words." },
  callout: { label: "Highlight", hint: "A shaded box for the one thing they must not miss." },
  image: { label: "Image", hint: "A photo of your place, your team, or your work." },
  button: { label: "Button", hint: "One clear thing to tap, with an optional second." },
  booking: { label: "Booking details", hint: "Service, time, and place, filled in for them." },
  stars: { label: "Star rating", hint: "Five stars that open your review page." },
  contact: { label: "Contact card", hint: "Your phone, address, and opening hours." },
  social: { label: "Social links", hint: "Small icons that open your pages." },
  divider: { label: "Divider", hint: "A thin line between parts." },
  spacer: { label: "Space", hint: "Breathing room, with nothing in it." },
  signoff: { label: "Sign-off", hint: "Who it is from." },
};

/** The block picker, grouped by what a block is for. */
export const BLOCK_GROUPS: { label: string; kinds: EmailBlockKind[] }[] = [
  { label: "Words", kinds: ["heading", "text", "callout", "signoff"] },
  { label: "Pictures and buttons", kinds: ["image", "button", "stars", "social"] },
  { label: "Filled in for you", kinds: ["booking", "contact"] },
  { label: "Layout", kinds: ["divider", "spacer"] },
];

/** The business's own details, as the contact card shows them. */
export const BUSINESS = {
  phone: "(541) 388-2014",
  address: "1450 NE Purcell Blvd, Bend, OR 97701",
  hours: "Mon to Thu 7:30am to 5pm, Fri 7:30am to 1pm",
  website: "aldercreekdental.com",
};

export const SOCIAL: Record<SocialNetwork, { label: string; placeholder: string }> = {
  facebook: { label: "Facebook", placeholder: "facebook.com/yourpage" },
  instagram: { label: "Instagram", placeholder: "instagram.com/yourname" },
  google: { label: "Google", placeholder: "g.page/yourbusiness" },
  youtube: { label: "YouTube", placeholder: "youtube.com/@yourchannel" },
  tiktok: { label: "TikTok", placeholder: "tiktok.com/@yourname" },
  x: { label: "X", placeholder: "x.com/yourname" },
};

/**
 * Pictures already in the business's library. Each alt text says what is in
 * the frame, and is the starting point when it is placed in an email.
 */
export const EMAIL_IMAGES: { src: string; label: string; alt: string }[] = [
  { src: "/photos/dental-operatory.jpg", label: "In the chair", alt: "A patient in the dental chair while two dentists work beside her" },
  { src: "/photos/clinic-consult.jpg", label: "Consultation", alt: "A doctor in a white coat talking with a patient across his desk" },
  { src: "/photos/team-office.jpg", label: "Working together", alt: "Four people leaning over papers on a shared office table" },
];

/** Largest upload, in megabytes. Bigger pictures load slowly on a phone. */
export const IMAGE_MAX_MB = 5;

export function newBlock(kind: EmailBlockKind): EmailBlock {
  const id = `b_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  switch (kind) {
    case "heading":
      return { id, kind, text: "A short headline", align: "left", size: "large" };
    case "text":
      return { id, kind, text: "Hi {first_name}, ", align: "left" };
    case "callout":
      return { id, kind, text: "Please bring your insurance card to your visit.", tone: "tint" };
    case "image":
      return { id, kind, src: null, alt: "", size: "full", link: null };
    case "button":
      return { id, kind, label: "Book a time", link: "booking_link", variant: "solid", align: "left", second: null };
    case "booking":
      return { id, kind };
    case "stars":
      return { id, kind, prompt: "How was your visit? Tap to leave a review." };
    case "contact":
      return { id, kind, showHours: true, showMap: true };
    case "social":
      return { id, kind, links: [{ network: "facebook", url: "" }, { network: "instagram", url: "" }] };
    case "divider":
      return { id, kind };
    case "spacer":
      return { id, kind, size: "m" };
    case "signoff":
      return { id, kind, text: "Thanks,", name: "The team at {business}" };
  }
}

/** A one-line summary of a block, for the collapsed list. */
export function blockSummary(b: EmailBlock) {
  switch (b.kind) {
    case "heading":
    case "text":
    case "callout":
      return fillSample(b.text).replaceAll("**", "");
    case "image":
      return b.src ? b.alt || "No description yet" : "No picture chosen yet";
    case "button":
      return `${fillSample(b.label)}, opens ${LINK[b.link].label.toLowerCase()}${b.second ? `, and ${fillSample(b.second.label)}` : ""}`;
    case "booking":
      return "Cleaning, Thursday at 9:40am, our Bend office";
    case "stars":
      return b.prompt;
    case "contact":
      return `${BUSINESS.phone}, ${BUSINESS.address}`;
    case "social": {
      const names = b.links.map((l) => SOCIAL[l.network].label);
      return names.length ? names.join(", ") : "No links yet";
    }
    case "divider":
      return "A thin line";
    case "spacer":
      return { s: "A little space", m: "Some space", l: "A lot of space" }[b.size ?? "m"];
    case "signoff":
      return `${b.text} ${fillSample(b.name)}`;
  }
}

/** What a template must contain to do its job. Null when it is fine. */
export function templateProblem(t: Pick<EmailTemplate, "subject" | "blocks" | "purpose">): string | null {
  if (!t.subject.trim()) return "Add a subject line. It is the first thing they read.";
  if (t.blocks.length === 0) return "Add at least one block.";
  for (const b of t.blocks) {
    if (b.kind === "button" && !b.label.trim()) return "A button has no text. Say what tapping it does.";
    if (b.kind === "button" && b.link === "custom" && !b.url?.trim()) return "A button opens a web address you type, but there is no address yet.";
    if (b.kind === "button" && b.second && !b.second.label.trim()) return "The second button has no text.";
    if (b.kind === "button" && b.second?.link === "custom" && !b.second.url?.trim()) return "The second button has no web address yet.";
    if (b.kind === "image" && !b.src) return "An image block has no picture yet. Choose one or remove the block.";
  }
  const links = t.blocks.flatMap((b): EmailLink[] =>
    b.kind === "button"
      ? [b.link, ...(b.second ? [b.second.link] : [])]
      : b.kind === "stars"
        ? ["review_link"]
        : b.kind === "image" && b.link
          ? [b.link]
          : [],
  );
  if (t.purpose === "follow-up" && !links.includes("booking_link"))
    return "A follow-up needs a button to their booking link, or there is nothing to tap.";
  if (t.purpose === "review" && !links.includes("review_link"))
    return "A review request needs a star rating or a button to your review link.";
  return null;
}

export type EmailCheck = { ok: boolean; label: string; fix: string };

/**
 * What a careful person checks before sending to a few hundred customers.
 * Unlike templateProblem, none of these stop a save.
 */
export function templateChecks(t: Pick<EmailTemplate, "subject" | "preheader" | "blocks">): EmailCheck[] {
  const subject = fillSample(t.subject);
  const images = t.blocks.filter((b) => b.kind === "image");
  const actions = t.blocks.filter((b) => b.kind === "button" || b.kind === "stars").length;
  const words = t.blocks
    .flatMap((b) => (b.kind === "text" || b.kind === "heading" || b.kind === "callout" ? [b.text] : []))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return [
    {
      ok: subject.length > 0 && subject.length <= 60,
      label: subject.length > 60 ? `Subject is ${subject.length} characters` : "Subject fits on a phone",
      fix: "Phones cut a subject off at about 60 characters.",
    },
    {
      ok: t.preheader.trim().length > 0,
      label: t.preheader.trim() ? "Preview text is written" : "No preview text",
      fix: "Without it, inboxes show the first words of the email instead.",
    },
    {
      ok: actions > 0 && actions <= 2,
      label: actions === 0 ? "Nothing to tap" : actions > 2 ? `${actions} things to tap` : "A clear thing to tap",
      fix: actions === 0 ? "Add a button, so it is obvious what to do next." : "Keep to one main button. Every extra one splits the taps.",
    },
    {
      ok: images.every((b) => b.kind === "image" && b.alt.trim().length > 0),
      label: images.length === 0 ? "No images to describe" : "Every image is described",
      fix: "Describe each picture. Many inboxes hide images until asked, and screen readers read the description aloud.",
    },
    {
      ok: words <= 180,
      label: words > 180 ? `${words} words is a long read` : "Short enough to read at a glance",
      fix: "Most people stop reading an email like this after about 150 words.",
    },
  ];
}

export const BLANK_STYLE: EmailTemplate["style"] = {
  accent: "#0f766e",
  corners: "soft",
  font: "modern",
  header: "band",
  logo: null,
  backdrop: "grey",
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
          { id: id(3), kind: "button", label: "Change or cancel", link: "booking_link", second: { label: "Call the office", link: "business_phone" } },
          { id: id(4), kind: "signoff", text: "Thanks,", name: "{business}" },
          { id: id(5), kind: "contact", showHours: true, showMap: true },
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
