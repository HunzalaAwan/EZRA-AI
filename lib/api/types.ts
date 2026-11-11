/**
 * Domain types for EZRA AI.
 *
 * Everything the UI renders comes from here. During the frontend phase these
 * are backed by seeded fixtures in lib/mock. Every fixture record carries
 * `__fixture: true` so no placeholder value can be mistaken for a real one or
 * promoted into a product claim.
 */

export type Fixture = { __fixture: true };

export type Channel = "voice" | "chat";

export type AgentStatus = "live" | "paused" | "draft";

export type ConversationOutcome =
  | "booked"
  | "lead"
  | "answered"
  | "transferred"
  | "message"
  | "missed";

export type AgentGoal =
  | "book"
  | "qualify"
  | "answer"
  | "orders"
  | "route";

export interface Workspace extends Fixture {
  id: string;
  name: string;
  industry: string;
  timezone: string;
  plan: string;
  minutesIncluded: number;
  minutesUsed: number;
}

export interface Agent extends Fixture {
  id: string;
  name: string;
  status: AgentStatus;
  channels: Channel[];
  goal: AgentGoal;
  voiceId: string;
  greeting: string;
  version: number;
  updatedAt: string;
  numberId: string | null;
  conversations7d: number;
  bookings7d: number;
  containmentRate: number;
  avgHandleSeconds: number;
}

export interface AgentVersion extends Fixture {
  id: string;
  agentId: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  summary: string;
}

export interface KnowledgeSource extends Fixture {
  id: string;
  agentId: string;
  kind: "website" | "document" | "text" | "faq";
  label: string;
  detail: string;
  chunks: number;
  lastReadAt: string;
  status: "ready" | "reading" | "stale" | "failed";
}

export interface AgentAction extends Fixture {
  id: string;
  agentId: string;
  kind: "book" | "message" | "transfer" | "sms" | "callback";
  label: string;
  description: string;
  enabled: boolean;
  target: string | null;
  usedCount30d: number;
}

export interface Message extends Fixture {
  id: string;
  role: "caller" | "agent";
  text: string;
  atSeconds: number;
}

export interface Conversation extends Fixture {
  id: string;
  agentId: string;
  agentName: string;
  channel: Channel;
  contactName: string | null;
  contactNumber: string | null;
  startedAt: string;
  durationSeconds: number;
  outcome: ConversationOutcome;
  summary: string;
  transcript: Message[];
  recordingUrl: string | null;
  needsReview: boolean;
  resolved: boolean;
  costCents: number;
}

export interface PhoneNumber extends Fixture {
  id: string;
  e164: string;
  label: string;
  city: string;
  state: string;
  agentId: string | null;
  status: "active" | "porting" | "forwarding";
  monthlyCents: number;
  /** Where calls to this number go, in priority order. */
  route: RouteStep[];
}

/**
 * One step in a number's call routing. Steps run in order: each rings for
 * `ringSeconds`, and if nobody answers the next one runs. Voicemail can only
 * be the last step, because nothing comes after it.
 */
export interface RouteStep {
  id: string;
  kind: "agent" | "person" | "number" | "voicemail";
  /** An agent id, a handoff target id, or an E.164 number. Empty for voicemail. */
  ref: string;
  ringSeconds: number;
}

export interface Integration extends Fixture {
  id: string;
  key: string;
  name: string;
  category: "booking" | "calendar" | "records" | "crm" | "messaging" | "payments" | "automation";
  status: "connected" | "error" | "available";
  detail: string;
  connectedAt: string | null;
}

export interface Member extends Fixture {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "viewer";
  lastActiveAt: string;
  initials: string;
}

export interface DayPoint {
  date: string;
  conversations: number;
  booked: number;
  missedBefore: number;
}

export interface HourPoint {
  hour: number;
  afterHours: boolean;
  conversations: number;
}

export interface DashboardSummary extends Fixture {
  handled7d: number;
  handled7dPrev: number;
  booked7d: number;
  booked7dPrev: number;
  afterHoursShare: number;
  needsReview: number;
  minutesUsed: number;
  minutesIncluded: number;
  estimatedValueCents: number;
  daily: DayPoint[];
  hourly: HourPoint[];
  outcomes: { outcome: ConversationOutcome; count: number }[];
}

/**
 * Call forwarding. The business keeps the number on its door and its cards and
 * sends the calls here. A rule is the pairing of one line they already own
 * with one EZRA number, and the condition under which it forwards.
 */
export type ForwardingMode = "always" | "after-hours" | "busy" | "no-answer";

export interface ForwardingRule extends Fixture {
  id: string;
  /** The line the business already owns, as customers dial it. */
  fromE164: string;
  fromLabel: string;
  /** Who they pay the bill to. Decides which instructions we show. */
  carrier: string;
  /** The EZRA number the call lands on. */
  toNumberId: string;
  mode: ForwardingMode;
  /** Where the forwarded calls go, in priority order. */
  route: RouteStep[];
  /** `pending` means we have not yet seen a call arrive through it. */
  status: "verified" | "pending" | "off";
  verifiedAt: string | null;
  calls7d: number;
}

/**
 * A question callers asked that nothing in the knowledge base answered. The
 * agent took a message or declined instead. This is the list the owner works
 * through, and it is where most knowledge actually gets added.
 */
export interface KnowledgeGap extends Fixture {
  id: string;
  question: string;
  askedCount7d: number;
  lastAskedAt: string;
  channel: Channel;
  /** What the agent did instead of answering. */
  fallback: "message" | "transfer" | "declined";
}

/**
 * One thing that is true today and not tomorrow: a closure, a cancelled
 * sailing, a clinician out sick. The agent reads it on every call until it
 * expires. Tours and attractions live on this; everyone else needs it some
 * days.
 */
export interface DailyNotice extends Fixture {
  id: string;
  text: string;
  activeUntil: string;
  setBy: string;
  setAt: string;
}

export type BookingPlatform = "fareharbor" | "ezra-pro" | "calendar";

export interface BookingLinkDay {
  date: string;
  sent: number;
  booked: number;
}

/**
 * Booking links the agent sent by text or chat, and what came of them. A
 * booking from a link is a subset of links sent; the two never sit on separate
 * scales.
 */
export interface BookingLinkStats extends Fixture {
  sent7d: number;
  sent7dPrev: number;
  opened7d: number;
  booked7d: number;
  booked7dPrev: number;
  daily: BookingLinkDay[];
  byPlatform: {
    platform: BookingPlatform;
    name: string;
    sent: number;
    booked: number;
  }[];
  byChannel: { channel: Channel; sent: number; booked: number }[];
}

// ---------------------------------------------------------------------------
// Human handoff. When a call goes to a person, who, in what order, and how.
// ---------------------------------------------------------------------------

export type HandoffTriggerKey =
  | "asks-for-person"
  | "upset"
  | "emergency"
  | "billing"
  | "repeat-caller"
  | "agent-unsure";

export interface HandoffTrigger extends Fixture {
  key: HandoffTriggerKey;
  label: string;
  /** How the agent recognises it, in plain words. */
  description: string;
  enabled: boolean;
  fired30d: number;
}

/** One person or line in the ring order. */
export interface HandoffTarget extends Fixture {
  id: string;
  name: string;
  role: string;
  e164: string;
  /** Days and hours they take transfers, as people say it. */
  availability: string;
  availableNow: boolean;
  /** How a transfer to this person goes. Set per person, not per business. */
  transfer: TargetTransfer;
}

export interface TargetTransfer {
  /** Warm: the agent tells this person who is calling and why before connecting. */
  style: "warm" | "direct";
  /** Seconds to ring this person. */
  ringSeconds: number;
  /** What happens when this person does not pick up. */
  ifNoAnswer: "next" | "message" | "callback" | "voicemail";
  /** Text this person the summary when they take the call. */
  textSummary: boolean;
}

export interface HandoffSettings extends Fixture {
  /** Warm: the agent tells the person who is calling and why before connecting. */
  style: "warm" | "direct";
  /** Seconds to ring each person before trying the next. */
  ringSeconds: number;
  /** What happens when nobody picks up. */
  fallback: "message" | "callback" | "voicemail";
  /** Text the summary to whoever took the call. */
  textSummary: boolean;
}

export interface HandoffRecord extends Fixture {
  id: string;
  conversationId: string | null;
  callerLabel: string;
  trigger: HandoffTriggerKey;
  at: string;
  /** Who picked up, or null when it fell back. */
  answeredBy: string | null;
  waitSeconds: number;
  result: "connected" | "fell-back";
}

/**
 * When an agent that is already on a call puts the caller through to a
 * person, and who it rings. Separate from a number's routing, which decides
 * who answers in the first place.
 */
export interface AgentTransfer {
  enabled: boolean;
  /** Built-in reasons that start a transfer. */
  triggers: HandoffTriggerKey[];
  /** Extra reasons in the owner's own words. */
  customTriggers: string[];
  /** Who to ring, in order, until someone picks up. */
  to: TransferStep[];
  /** Warm: the person hears who is calling and why before the caller is connected. */
  style: "warm" | "direct";
  /** What the agent does when nobody picks up. */
  ifNoAnswer: "message" | "callback" | "voicemail";
  /** Text a short summary to whoever picks up. */
  textSummary: boolean;
  /** Said to the caller just before the transfer. */
  say: string;
}

export interface TransferStep {
  id: string;
  kind: "person" | "number";
  /** A team member id, or an E.164 number. */
  ref: string;
  /** For a bare number, who it reaches, so the readback can name a person. */
  label?: string;
  ringSeconds: number;
}

// ---------------------------------------------------------------------------
// Messages. What gets sent to callers after a conversation, and what the team
// hears about.
// ---------------------------------------------------------------------------

export type MessageChannel = "sms" | "email";

export type MessageTemplateKey =
  | "booking-confirmation"
  | "booking-link"
  | "missed-call"
  | "reminder"
  | "follow-up"
  | "message-received";

export interface MessageTemplate extends Fixture {
  id: string;
  key: MessageTemplateKey;
  name: string;
  /** When it is sent, in plain words. */
  when: string;
  channels: MessageChannel[];
  enabled: boolean;
  subject: string | null;
  body: string;
  sent30d: number;
}

export interface TeamAlert extends Fixture {
  id: string;
  key:
    | "needs-person"
    | "handoff-missed"
    | "new-booking"
    | "daily-digest"
    | "weekly-report";
  name: string;
  description: string;
  channels: MessageChannel[];
  enabled: boolean;
  /** Member ids who receive it. */
  recipients: string[];
}

export interface SentMessage extends Fixture {
  id: string;
  templateKey: MessageTemplateKey;
  channel: MessageChannel;
  to: string;
  sentAt: string;
  status: "delivered" | "opened" | "failed" | "queued";
  /** Plain reason when it failed. */
  failure: string | null;
}

// ---------------------------------------------------------------------------
// Contacts, outbound calls, and booking links sent by hand.
// ---------------------------------------------------------------------------

export interface Contact extends Fixture {
  id: string;
  name: string | null;
  e164: string;
  email: string | null;
  /** How they first reached the business. */
  source: Channel;
  tags: string[];
  firstSeenAt: string;
  lastContactAt: string;
  conversations: number;
  bookings: number;
  lastOutcome: ConversationOutcome;
  /** Something a person should do next, if anything. */
  followUp: string | null;
}

/** Something a booking link can point at, in a given booking system. */
export interface BookingService extends Fixture {
  id: string;
  platform: BookingPlatform;
  name: string;
  durationMinutes: number;
}

/** What the agent is asked to do when it places a call for you. */
export type OutboundGoal =
  | "confirm"
  | "reschedule"
  | "follow-up"
  | "recall";

// ---------------------------------------------------------------------------
// API and webhooks. Off the default view: the Integrations page keeps them on
// their own tab, for whoever builds on top of EZRA for the business.
// ---------------------------------------------------------------------------

export type WebhookEventKey =
  | "call.completed"
  | "voicemail.received"
  | "transfer.started"
  | "booking.created"
  | "booking.cancelled"
  | "booking_link.converted"
  | "contact.created"
  | "message.received";

export interface ApiKey extends Fixture {
  id: string;
  name: string;
  /** Only the last four characters are ever stored for display. */
  last4: string;
  access: "read" | "write";
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
}

export interface WebhookEndpoint extends Fixture {
  id: string;
  url: string;
  /** What it is for, in the owner's words. */
  description: string;
  events: WebhookEventKey[];
  status: "active" | "failing" | "paused";
  createdAt: string;
  lastDeliveryAt: string | null;
  /** Share of deliveries in the last 7 days that got a 2xx back. */
  successRate7d: number;
  secretLast4: string;
}

export interface WebhookDelivery extends Fixture {
  id: string;
  endpointId: string;
  event: WebhookEventKey;
  at: string;
  statusCode: number;
  durationMs: number;
  attempt: number;
}

// ---------------------------------------------------------------------------
// The website widget and the voice agent's sound: how EZRA looks on the
// business's site and sounds on its phone line.
// ---------------------------------------------------------------------------

export type LauncherIcon =
  | "chat"
  | "chats"
  | "headset"
  | "sparkle"
  | "robot"
  | "smiley"
  | "wave"
  | "initials"
  | "logo";

export interface WidgetSettings {
  /** The business's brand colour, as #rrggbb. Text on it is chosen for contrast. */
  accent: string;
  mode: "light" | "dark" | "auto";
  corners: "sharp" | "soft" | "round";
  font: "modern" | "friendly" | "classic";
  launcher: {
    icon: LauncherIcon;
    size: "sm" | "md" | "lg";
    position: "right" | "left";
    /** Empty for a round button. */
    label: string;
    motion: "none" | "pulse" | "bounce" | "wiggle";
  };
  greeting: { enabled: boolean; text: string; delaySeconds: number; onPhones: boolean };
  assistantName: string;
  subtitle: string;
  welcome: string;
  quickReplies: string[];
  placeholder: string;
  showCallButton: boolean;
  showBranding: boolean;
  voice: {
    voiceId: string;
    /** 0.8 slower to 1.2 faster. */
    pace: number;
    /** 0 brighter to 1 warmer. */
    warmth: number;
    greeting: string;
    answerAfterRings: 1 | 2;
    hold: "silence" | "piano" | "acoustic";
    ambience: "none" | "office";
    naturalPauses: boolean;
    interrupt: boolean;
    spanish: boolean;
  };
}
