/**
 * Seeded fixture data for EZRA AI.
 *
 * Rules this file follows, from DESIGN.md:
 *   - No "Acme", no "Jane Doe", no round percentages, no (555) 123-4567.
 *   - Realistic local businesses, believable numbers, messy real-looking figures.
 *   - Every record carries __fixture so it can never be mistaken for real data.
 *   - No em-dash or en-dash anywhere, including inside transcripts.
 *
 * The workspace is a three-location dental group in Bend, Oregon. Area code 541
 * is correct for that region. Nothing here is a real practice.
 */

import type {
  Agent,
  EmailTemplate,
  FollowUpBooking,
  FollowUpResults,
  FollowUpRun,
  FollowUpSettings,
  ReviewResults,
  ReviewRun,
  ReviewSettings,
  WidgetSettings,
  ApiKey,
  WebhookDelivery,
  WebhookEndpoint,
  AgentTransfer,
  AgentAction,
  AgentVersion,
  BookingLinkStats,
  BookingService,
  Contact,
  Conversation,
  DailyNotice,
  DashboardSummary,
  ForwardingRule,
  HandoffRecord,
  HandoffSettings,
  HandoffTarget,
  HandoffTrigger,
  MessageTemplate,
  SentMessage,
  TeamAlert,
  Integration,
  KnowledgeGap,
  KnowledgeSource,
  Member,
  Message,
  PhoneNumber,
  Workspace,
} from "@/lib/api/types";

const F = { __fixture: true } as const;

/** Deterministic PRNG so every reload renders identical data. */
function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DAY = 86_400_000;
/** Fixed clock so fixtures never drift and snapshots stay stable. */
export const NOW = new Date("2026-09-18T16:40:00.000Z");

function daysAgo(n: number, hour = 14, minute = 12) {
  const d = new Date(NOW.getTime() - n * DAY);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export const workspace: Workspace = {
  ...F,
  id: "ws_aldercreek",
  name: "Alder Creek Dental Group",
  industry: "Dental practice, 3 locations",
  timezone: "America/Los_Angeles",
  plan: "Practice",
  minutesIncluded: 1500,
  minutesUsed: 1147,
};

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

export const agents: Agent[] = [
  {
    ...F,
    id: "ag_frontdesk",
    name: "Front Desk",
    status: "live",
    channels: ["voice"],
    goal: "book",
    voiceId: "vc_maren",
    greeting:
      "Thanks for calling Alder Creek Dental, this is Maren. How can I help you today?",
    version: 7,
    updatedAt: daysAgo(2, 21, 8),
    numberId: "pn_main",
    conversations7d: 213,
    bookings7d: 88,
    containmentRate: 0.847,
    avgHandleSeconds: 187,
  },
  {
    ...F,
    id: "ag_afterhours",
    name: "After Hours Line",
    status: "live",
    channels: ["voice"],
    goal: "route",
    voiceId: "vc_theo",
    greeting:
      "You have reached Alder Creek Dental after hours. If this is a dental emergency, stay on the line and I will page the on-call dentist.",
    version: 3,
    updatedAt: daysAgo(9, 3, 41),
    numberId: "pn_afterhours",
    conversations7d: 61,
    bookings7d: 19,
    containmentRate: 0.721,
    avgHandleSeconds: 142,
  },
  {
    ...F,
    id: "ag_webchat",
    name: "Website Chat",
    status: "live",
    channels: ["chat"],
    goal: "qualify",
    voiceId: "vc_maren",
    greeting:
      "Hi, I can check availability, answer insurance questions, or get you scheduled. What brings you in?",
    version: 12,
    updatedAt: daysAgo(1, 17, 55),
    numberId: null,
    conversations7d: 134,
    bookings7d: 41,
    containmentRate: 0.906,
    avgHandleSeconds: 96,
  },
  {
    ...F,
    id: "ag_recall",
    name: "Recall Outreach",
    status: "paused",
    channels: ["voice", "chat"],
    goal: "book",
    voiceId: "vc_theo",
    greeting:
      "Hi, this is Alder Creek Dental calling about your six month cleaning. Do you have a minute to get it on the books?",
    version: 2,
    updatedAt: daysAgo(23, 19, 30),
    numberId: null,
    conversations7d: 0,
    bookings7d: 0,
    containmentRate: 0.634,
    avgHandleSeconds: 118,
  },
  {
    ...F,
    id: "ag_spanish",
    name: "Spanish Front Desk",
    status: "draft",
    channels: ["voice", "chat"],
    goal: "book",
    voiceId: "vc_lucia",
    greeting:
      "Gracias por llamar a Alder Creek Dental. Le puedo ayudar a hacer una cita.",
    version: 0,
    updatedAt: daysAgo(4, 22, 14),
    numberId: null,
    conversations7d: 0,
    bookings7d: 0,
    containmentRate: 0,
    avgHandleSeconds: 0,
  },
];

export const agentVersions: AgentVersion[] = [
  {
    ...F,
    id: "av_7",
    agentId: "ag_frontdesk",
    version: 7,
    publishedAt: daysAgo(2, 21, 8),
    publishedBy: "Priya Raghunathan",
    summary: "Added Delta Dental and Regence to the accepted insurance list.",
  },
  {
    ...F,
    id: "av_6",
    agentId: "ag_frontdesk",
    version: 6,
    publishedAt: daysAgo(11, 16, 2),
    publishedBy: "Priya Raghunathan",
    summary: "Stopped quoting prices for crowns. Routes to the office instead.",
  },
  {
    ...F,
    id: "av_5",
    agentId: "ag_frontdesk",
    version: 5,
    publishedAt: daysAgo(26, 15, 47),
    publishedBy: "Dr. Omar Castellanos",
    summary: "Shortened the greeting. Callers were interrupting it.",
  },
];

// ---------------------------------------------------------------------------
// Knowledge and actions
// ---------------------------------------------------------------------------

export const knowledgeSources: KnowledgeSource[] = [
  {
    ...F,
    id: "ks_site",
    agentId: "ag_frontdesk",
    kind: "website",
    label: "aldercreekdental.com",
    detail: "34 pages read, including services, team, and the insurance page",
    chunks: 218,
    lastReadAt: daysAgo(2, 9, 14),
    status: "ready",
  },
  {
    ...F,
    id: "ks_hours",
    agentId: "ag_frontdesk",
    kind: "faq",
    label: "Hours and locations",
    detail: "3 locations, holiday closures through December",
    chunks: 12,
    lastReadAt: daysAgo(2, 9, 14),
    status: "ready",
  },
  {
    ...F,
    id: "ks_insurance",
    agentId: "ag_frontdesk",
    kind: "document",
    label: "Accepted insurance 2026.pdf",
    detail: "11 carriers, in network and out of network split",
    chunks: 41,
    lastReadAt: daysAgo(17, 11, 30),
    status: "stale",
  },
  {
    ...F,
    id: "ks_newpatient",
    agentId: "ag_frontdesk",
    kind: "text",
    label: "New patient intake script",
    detail: "Pasted by Priya on the day the account was created",
    chunks: 7,
    lastReadAt: daysAgo(41, 13, 5),
    status: "ready",
  },
  {
    ...F,
    id: "ks_pricing",
    agentId: "ag_frontdesk",
    kind: "document",
    label: "Fee schedule Q3.xlsx",
    detail: "Could not be read. The file is password protected.",
    chunks: 0,
    lastReadAt: daysAgo(6, 8, 22),
    status: "failed",
  },
];

export const agentActions: AgentAction[] = [
  {
    ...F,
    id: "aa_book",
    agentId: "ag_frontdesk",
    kind: "book",
    label: "Book an appointment",
    description:
      "Finds an open slot and writes it into the practice calendar. Confirms by text.",
    enabled: true,
    target: "Curve Dental, Bend office",
    usedCount30d: 341,
  },
  {
    ...F,
    id: "aa_transfer",
    agentId: "ag_frontdesk",
    kind: "transfer",
    label: "Transfer to the front desk",
    description:
      "Rings the office during business hours. Falls back to taking a message.",
    enabled: true,
    target: "(541) 388-2014",
    usedCount30d: 96,
  },
  {
    ...F,
    id: "aa_message",
    agentId: "ag_frontdesk",
    kind: "message",
    label: "Take a message",
    description: "Captures the reason, a callback number, and the best time.",
    enabled: true,
    target: null,
    usedCount30d: 128,
  },
  {
    ...F,
    id: "aa_sms",
    agentId: "ag_frontdesk",
    kind: "sms",
    label: "Text directions or forms",
    description:
      "Sends the new patient forms link or the map pin for the right location.",
    enabled: true,
    target: null,
    usedCount30d: 212,
  },
  {
    ...F,
    id: "aa_callback",
    agentId: "ag_frontdesk",
    kind: "callback",
    label: "Schedule a callback",
    description: "Offers a window and puts it on the office task list.",
    enabled: false,
    target: null,
    usedCount30d: 0,
  },
];

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

function turns(pairs: [Message["role"], string][], startAt = 2): Message[] {
  let t = startAt;
  return pairs.map(([role, text], i) => {
    const m: Message = {
      ...F,
      id: `m_${i}`,
      role,
      text,
      atSeconds: t,
    };
    t += Math.max(4, Math.round(text.length / 13));
    return m;
  });
}

const bookedCall = turns([
  [
    "agent",
    "Thanks for calling Alder Creek Dental, this is Maren. How can I help you today?",
  ],
  [
    "caller",
    "Hi, yeah, I chipped a tooth on Saturday and I need to get seen. I have not been in since maybe 2023.",
  ],
  [
    "agent",
    "I am sorry, that sounds uncomfortable. I can get you in. Is it painful right now, or is it mostly the chip you are worried about?",
  ],
  [
    "caller",
    "It aches if I drink something cold, but it is not terrible.",
  ],
  [
    "agent",
    "Understood. Since it has been a few years I will book you as a returning patient with an exam and an x-ray so the doctor can see the whole picture. Our next opening at the Bend office is Thursday at 9:40 in the morning, or we have Friday at 2:20 in the afternoon. Which works better?",
  ],
  ["caller", "Thursday morning works."],
  [
    "agent",
    "Thursday September 24th at 9:40 with Dr. Castellanos. Can I get your full name and a good mobile number?",
  ],
  ["caller", "Nadia Okonkwo. 541 419 7732."],
  [
    "agent",
    "Thank you Nadia. Last thing, are you still on the Regence plan we have on file?",
  ],
  [
    "caller",
    "No, I switched to Delta Dental through my new job in January.",
  ],
  [
    "agent",
    "Good to know, and we are in network with Delta Dental. I have updated that. You are booked for Thursday the 24th at 9:40. I am texting you the confirmation and the new patient forms now. Please fill those out before you come in so you are not doing paperwork in the waiting room.",
  ],
  ["caller", "Perfect, thank you."],
  [
    "agent",
    "Of course. If the tooth gets worse before Thursday, call us back and we will move you up. Take care, Nadia.",
  ],
]);

const transferredCall = turns([
  [
    "agent",
    "Thanks for calling Alder Creek Dental, this is Maren. How can I help you today?",
  ],
  [
    "caller",
    "I got a bill for 412 dollars and I already paid my portion at the visit. This is the second time.",
  ],
  [
    "agent",
    "I am sorry about that, and I do not want to guess at your account. Billing questions go to Renata in our business office. She is in until 4 today. Would you like me to ring her now, or would a callback be easier?",
  ],
  ["caller", "Just put me through, I want this sorted today."],
  [
    "agent",
    "Transferring you now. I am passing along that this is a duplicate charge of 412 dollars so you do not have to start over.",
  ],
]);

const missedCall = turns([
  [
    "agent",
    "You have reached Alder Creek Dental after hours. If this is a dental emergency, stay on the line and I will page the on-call dentist.",
  ],
  [
    "caller",
    "Yeah hi, I need to know if you take the state plan, the Oregon Health Plan, for my daughter, she is seven.",
  ],
  [
    "agent",
    "I want to get that right rather than guess. Our coverage for pediatric state plans changed this year and I do not have the current answer. Can I take your number and have the office call you first thing?",
  ],
  ["caller", "I already left a message yesterday and nobody called."],
  [
    "agent",
    "That should not have happened. I am flagging this for the office manager directly rather than the general list. What is the best number and name?",
  ],
  ["caller", "Marisol Vega, 541 550 8841. Just call before 2, I work nights."],
  [
    "agent",
    "Marisol Vega, 541 550 8841, before 2 in the afternoon, about Oregon Health Plan coverage for a seven year old. Priya will call you tomorrow morning. I am sorry about yesterday.",
  ],
]);

const chatQualify = turns([
  [
    "agent",
    "Hi, I can check availability, answer insurance questions, or get you scheduled. What brings you in?",
  ],
  [
    "caller",
    "do you guys do invisalign and roughly what does it run",
  ],
  [
    "agent",
    "We do, at the Bend and Redmond offices. Cost depends on how much movement your case needs, so I cannot quote a number honestly without the doctor seeing you. What I can tell you is the consult is free and takes about 30 minutes, including the scan.",
  ],
  ["caller", "ok. is there financing"],
  [
    "agent",
    "Yes, we run in house payment plans over 12 or 24 months, and we also take CareCredit. Most Invisalign patients here use the 24 month plan.",
  ],
  ["caller", "cool, what do you have next week"],
  [
    "agent",
    "For a free consult at Bend: Tuesday at 11:15, Wednesday at 4:00, or Thursday at 8:30. Redmond has Wednesday at 1:45.",
  ],
  ["caller", "wednesday 4 at bend"],
  [
    "agent",
    "Done. Can I get a name, a mobile number, and your email for the confirmation?",
  ],
  [
    "caller",
    "Tobias Lindqvist, 541 728 3095, tobias.lindqvist@fastmail.com",
  ],
  [
    "agent",
    "You are set for Wednesday September 23rd at 4:00 at our Bend office for a free Invisalign consult. Confirmation is on its way to your email and phone. Bring a list of any medications you take.",
  ],
]);

/** A long call. Renders the worst case for the transcript view. */
function longCall(): Message[] {
  const rnd = makeRandom(97);
  const topics = [
    "the crown that came loose",
    "whether the temporary can wait until after the holiday",
    "the cost of the permanent crown",
    "what the insurance already paid this year",
    "the remaining annual maximum",
    "moving the cleaning that is already on the books",
    "whether Dr. Castellanos or Dr. Iyer would be doing it",
    "parking at the Redmond office",
  ];
  const pairs: [Message["role"], string][] = [
    [
      "agent",
      "Thanks for calling Alder Creek Dental, this is Maren. How can I help you today?",
    ],
    [
      "caller",
      "This is Gerald Whitmore. My crown came off last night eating caramel corn, of all the stupid things.",
    ],
  ];
  for (const topic of topics) {
    pairs.push([
      "caller",
      `Alright, and what about ${topic}? My wife is going to ask me and I want to have an answer.`,
    ]);
    pairs.push([
      "agent",
      rnd() > 0.5
        ? `On ${topic}: I can give you the short version now and text you the detail so you have it in writing.`
        : `Let me check that. For ${topic}, here is where you stand as of today, and I will note it on your chart.`,
    ]);
  }
  pairs.push([
    "caller",
    "Okay. Okay, that is what I needed. Put me down for the Tuesday.",
  ]);
  pairs.push([
    "agent",
    "Tuesday September 22nd at 10:05 with Dr. Iyer at Redmond, for a crown recement and evaluation. Confirmation is going to 541 306 4488 now. Keep the crown in a ziplock and bring it with you, Gerald.",
  ]);
  pairs.push(["caller", "Will do. Thanks for your patience."]);
  pairs.push([
    "agent",
    "That is what I am here for. See you Tuesday.",
  ]);
  return turns(pairs);
}

export const conversations: Conversation[] = [
  {
    ...F,
    id: "cv_9481",
    agentId: "ag_frontdesk",
    agentName: "Front Desk",
    channel: "voice",
    contactName: "Nadia Okonkwo",
    contactNumber: "+15414197732",
    startedAt: daysAgo(0, 15, 52),
    durationSeconds: 164,
    outcome: "booked",
    summary:
      "Chipped molar, returning patient after 3 years. Booked Thursday 9:40 with Dr. Castellanos. Insurance updated from Regence to Delta Dental.",
    transcript: bookedCall,
    recordingUrl: "/fixtures/audio/cv_9481.mp3",
    needsReview: false,
    resolved: true,
    costCents: 41,
  },
  {
    ...F,
    id: "cv_9479",
    agentId: "ag_webchat",
    agentName: "Website Chat",
    channel: "chat",
    contactName: "Tobias Lindqvist",
    contactNumber: "+15417283095",
    startedAt: daysAgo(0, 14, 9),
    durationSeconds: 231,
    outcome: "booked",
    summary:
      "Invisalign pricing question. Declined to quote, offered the free consult. Booked Wednesday 4:00 at Bend.",
    transcript: chatQualify,
    recordingUrl: null,
    needsReview: false,
    resolved: true,
    costCents: 9,
  },
  {
    ...F,
    id: "cv_9474",
    agentId: "ag_frontdesk",
    agentName: "Front Desk",
    channel: "voice",
    contactName: "Gerald Whitmore",
    contactNumber: "+15413064488",
    startedAt: daysAgo(0, 11, 26),
    durationSeconds: 612,
    outcome: "booked",
    summary:
      "Crown came loose. Long call covering cost, remaining benefit, and which dentist. Booked Tuesday 10:05 at Redmond.",
    transcript: longCall(),
    recordingUrl: "/fixtures/audio/cv_9474.mp3",
    needsReview: false,
    resolved: true,
    costCents: 153,
  },
  {
    ...F,
    id: "cv_9470",
    agentId: "ag_frontdesk",
    agentName: "Front Desk",
    channel: "voice",
    contactName: null,
    contactNumber: "+15412208817",
    startedAt: daysAgo(1, 20, 3),
    durationSeconds: 78,
    outcome: "transferred",
    summary:
      "Duplicate billing charge of 412 dollars. Transferred to the business office with context passed along.",
    transcript: transferredCall,
    recordingUrl: "/fixtures/audio/cv_9470.mp3",
    needsReview: false,
    resolved: true,
    costCents: 20,
  },
  {
    ...F,
    id: "cv_9466",
    agentId: "ag_afterhours",
    agentName: "After Hours Line",
    channel: "voice",
    contactName: "Marisol Vega",
    contactNumber: "+15415508841",
    startedAt: daysAgo(1, 4, 37),
    durationSeconds: 119,
    outcome: "message",
    summary:
      "Oregon Health Plan coverage for a pediatric patient. Agent did not have current coverage data and escalated. Caller had already left an unreturned message.",
    transcript: missedCall,
    recordingUrl: "/fixtures/audio/cv_9466.mp3",
    needsReview: true,
    resolved: false,
    costCents: 31,
  },
];

// ---------------------------------------------------------------------------
// Numbers, integrations, team
// ---------------------------------------------------------------------------

export const phoneNumbers: PhoneNumber[] = [
  {
    ...F,
    id: "pn_main",
    e164: "+15413882014",
    label: "Main line, Bend",
    city: "Bend",
    state: "OR",
    agentId: "ag_frontdesk",
    status: "active",
    monthlyCents: 200,
    route: [
      { id: "s1", kind: "agent", ref: "ag_frontdesk", ringSeconds: 20 },
      { id: "s2", kind: "person", ref: "ht_desk", ringSeconds: 20 },
      { id: "s3", kind: "voicemail", ref: "", ringSeconds: 0 },
    ],
  },
  {
    ...F,
    id: "pn_afterhours",
    e164: "+15413882071",
    label: "After hours",
    city: "Bend",
    state: "OR",
    agentId: "ag_afterhours",
    status: "active",
    monthlyCents: 200,
    route: [
      { id: "s1", kind: "agent", ref: "ag_afterhours", ringSeconds: 20 },
      { id: "s2", kind: "person", ref: "ht_oncall", ringSeconds: 30 },
      { id: "s3", kind: "voicemail", ref: "", ringSeconds: 0 },
    ],
  },
  {
    ...F,
    id: "pn_redmond",
    e164: "+15415483390",
    label: "Redmond office",
    city: "Redmond",
    state: "OR",
    agentId: null,
    status: "porting",
    monthlyCents: 200,
    route: [
      { id: "s1", kind: "person", ref: "ht_desk", ringSeconds: 20 },
      { id: "s2", kind: "agent", ref: "ag_frontdesk", ringSeconds: 20 },
    ],
  },
];

export const integrations: Integration[] = [
  {
    ...F,
    id: "in_fareharbor",
    key: "fareharbor",
    name: "FareHarbor",
    category: "booking",
    status: "available",
    detail:
      "For tours, activities and tickets. The agent reads live availability and texts a checkout link that books straight into your calendar.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_ezrapro",
    key: "ezra-pro",
    name: "Ezra Pro",
    category: "booking",
    status: "available",
    detail:
      "For activities and events. Availability, group rates, and a checkout link the agent can send while the caller is still on the line.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_curve",
    key: "curve",
    name: "Curve Dental",
    category: "records",
    status: "connected",
    detail: "Writing to 3 operatory schedules. Last sync 6 minutes ago.",
    connectedAt: daysAgo(41, 12, 0),
  },
  {
    ...F,
    id: "in_gcal",
    key: "google-calendar",
    name: "Google Calendar",
    category: "calendar",
    status: "error",
    detail: "Access token expired. Reconnect to resume writing appointments.",
    connectedAt: daysAgo(88, 10, 30),
  },
  {
    ...F,
    id: "in_hubspot",
    key: "hubspot",
    name: "HubSpot",
    category: "crm",
    status: "available",
    detail: "Push qualified leads and call summaries into your pipeline.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_twilio",
    key: "sms",
    name: "Text messaging",
    category: "messaging",
    status: "connected",
    detail: "Confirmations and forms links. 1,284 sent in the last 30 days.",
    connectedAt: daysAgo(41, 12, 4),
  },
  {
    ...F,
    id: "in_stripe",
    key: "stripe",
    name: "Stripe",
    category: "payments",
    status: "available",
    detail: "Take deposits for cosmetic consults over the phone.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_outlook",
    key: "outlook",
    name: "Microsoft Outlook",
    category: "calendar",
    status: "available",
    detail: "Books into Outlook and Microsoft 365 calendars, shared ones included.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_calendly",
    key: "calendly",
    name: "Calendly",
    category: "calendar",
    status: "available",
    detail: "Offers your open Calendly times and books one while the caller waits.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_acuity",
    key: "acuity",
    name: "Acuity Scheduling",
    category: "calendar",
    status: "available",
    detail: "Books by appointment type, with the intake questions you already ask.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_dentrix",
    key: "dentrix",
    name: "Dentrix",
    category: "records",
    status: "available",
    detail: "Finds the patient, books the right chair, and notes why they called.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_opendental",
    key: "open-dental",
    name: "Open Dental",
    category: "records",
    status: "available",
    detail: "Reads the schedule and writes new appointments with the call summary.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_jane",
    key: "jane",
    name: "Jane",
    category: "records",
    status: "available",
    detail: "For clinics on Jane. Books by practitioner and treatment type.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_mindbody",
    key: "mindbody",
    name: "Mindbody",
    category: "records",
    status: "available",
    detail: "Classes, appointments, and memberships for studios and spas.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_vagaro",
    key: "vagaro",
    name: "Vagaro",
    category: "records",
    status: "available",
    detail: "Books the stylist and the service, with the right time for each.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_servicetitan",
    key: "servicetitan",
    name: "ServiceTitan",
    category: "records",
    status: "available",
    detail: "Creates the job with the address, the problem, and an arrival window.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_housecall",
    key: "housecall-pro",
    name: "Housecall Pro",
    category: "records",
    status: "available",
    detail: "Turns a call into a scheduled job and tells the customer when to expect you.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_jobber",
    key: "jobber",
    name: "Jobber",
    category: "records",
    status: "available",
    detail: "Creates the request and the client record, ready to quote.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_clio",
    key: "clio",
    name: "Clio",
    category: "records",
    status: "available",
    detail: "Opens an intake with the caller's details, ready for a conflict check.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_salesforce",
    key: "salesforce",
    name: "Salesforce",
    category: "crm",
    status: "available",
    detail: "Creates or updates the lead and logs the call with its summary.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_teams",
    key: "teams",
    name: "Microsoft Teams",
    category: "messaging",
    status: "available",
    detail: "Posts to a channel when a caller needs a person or a booking lands.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_whatsapp",
    key: "whatsapp",
    name: "WhatsApp",
    category: "messaging",
    status: "available",
    detail: "Answers WhatsApp messages with the same agent as your website chat.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_messenger",
    key: "messenger",
    name: "Facebook Messenger",
    category: "messaging",
    status: "available",
    detail: "Answers messages sent to your Facebook page.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_instagram",
    key: "instagram",
    name: "Instagram",
    category: "messaging",
    status: "available",
    detail: "Answers direct messages sent to your Instagram account.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_square",
    key: "square",
    name: "Square",
    category: "payments",
    status: "available",
    detail: "Takes a deposit through Square and marks the booking paid.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_paypal",
    key: "paypal",
    name: "PayPal",
    category: "payments",
    status: "available",
    detail: "Sends a PayPal link for deposits and prepaid tickets.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_quickbooks",
    key: "quickbooks",
    name: "QuickBooks",
    category: "payments",
    status: "available",
    detail: "Turns a paid booking into an invoice in your books.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_zapier",
    key: "zapier",
    name: "Zapier",
    category: "automation",
    status: "available",
    detail: "Sends calls, bookings, and new contacts on to the apps Zapier connects.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_make",
    key: "make",
    name: "Make",
    category: "automation",
    status: "available",
    detail: "Starts a Make scenario whenever a call ends or a booking lands.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_sheets",
    key: "google-sheets",
    name: "Google Sheets",
    category: "automation",
    status: "available",
    detail: "Adds a row for every call, booking, or message, so you can sort it your way.",
    connectedAt: null,
  },
  {
    ...F,
    id: "in_slack",
    key: "slack",
    name: "Slack",
    category: "messaging",
    status: "connected",
    detail: "Posting to #front-desk when a caller needs a person. 26 alerts in the last 30 days.",
    connectedAt: daysAgo(19, 15, 22),
  },
];

export const members: Member[] = [
  {
    ...F,
    id: "mb_priya",
    name: "Priya Raghunathan",
    email: "priya@aldercreekdental.com",
    role: "owner",
    lastActiveAt: daysAgo(0, 16, 12),
    initials: "PR",
  },
  {
    ...F,
    id: "mb_omar",
    name: "Dr. Omar Castellanos",
    email: "ocastellanos@aldercreekdental.com",
    role: "manager",
    lastActiveAt: daysAgo(3, 18, 44),
    initials: "OC",
  },
  {
    ...F,
    id: "mb_renata",
    name: "Renata Alvarez",
    email: "billing@aldercreekdental.com",
    role: "viewer",
    lastActiveAt: daysAgo(0, 13, 2),
    initials: "RA",
  },
  {
    ...F,
    id: "mb_sunita",
    name: "Dr. Sunita Iyer",
    email: "siyer@aldercreekdental.com",
    role: "manager",
    lastActiveAt: daysAgo(12, 9, 19),
    initials: "SI",
  },
];

// ---------------------------------------------------------------------------
// Dashboard summary
// ---------------------------------------------------------------------------

function buildDaily() {
  const rnd = makeRandom(41);
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(NOW.getTime() - i * DAY);
    const dow = d.getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const base = weekend ? 14 : 52;
    const conversations = Math.round(base + rnd() * (weekend ? 9 : 27));
    const booked = Math.round(conversations * (0.31 + rnd() * 0.16));
    out.push({
      date: d.toISOString().slice(0, 10),
      conversations,
      booked,
      missedBefore: Math.round(conversations * (0.42 + rnd() * 0.12)),
    });
  }
  return out;
}

function buildHourly() {
  const rnd = makeRandom(7);
  const shape = [
    2, 1, 1, 1, 2, 4, 9, 18, 34, 47, 52, 44, 38, 41, 46, 39, 28, 21, 16, 12, 9,
    7, 5, 3,
  ];
  return shape.map((v, hour) => ({
    hour,
    afterHours: hour < 8 || hour >= 17,
    conversations: Math.round(v * (0.85 + rnd() * 0.3)),
  }));
}

export const dashboardSummary: DashboardSummary = {
  ...F,
  handled7d: 408,
  handled7dPrev: 361,
  booked7d: 148,
  booked7dPrev: 119,
  afterHoursShare: 0.386,
  needsReview: 1,
  minutesUsed: 1147,
  minutesIncluded: 1500,
  estimatedValueCents: 4_218_00,
  daily: buildDaily(),
  hourly: buildHourly(),
  outcomes: [
    { outcome: "booked", count: 148 },
    { outcome: "answered", count: 121 },
    { outcome: "message", count: 63 },
    { outcome: "transferred", count: 47 },
    { outcome: "lead", count: 24 },
    { outcome: "missed", count: 5 },
  ],
};

export const voices = [
  {
    id: "vc_maren",
    name: "Maren",
    tone: "Warm, unhurried, Pacific Northwest",
    gender: "female",
  },
  {
    id: "vc_theo",
    name: "Theo",
    tone: "Calm, low, reassuring under pressure",
    gender: "male",
  },
  {
    id: "vc_lucia",
    name: "Lucia",
    tone: "Bright, bilingual, Spanish first",
    gender: "female",
  },
  {
    id: "vc_arun",
    name: "Arun",
    tone: "Crisp, efficient, good for busy lines",
    gender: "male",
  },
];

// ---------------------------------------------------------------------------
// Call forwarding. The lines the business already owns, and where they land.
// One is proven by real calls. One has been set up and nothing has arrived
// through it yet, which is the state most people are in for the first hour.
// ---------------------------------------------------------------------------

export const forwardingRules: ForwardingRule[] = [
  {
    ...F,
    id: "fr_main",
    fromE164: "+15413880610",
    fromLabel: "Front desk line, Bend",
    carrier: "Lumen",
    toNumberId: "pn_main",
    mode: "always",
    route: [
      { id: "s1", kind: "agent", ref: "ag_frontdesk", ringSeconds: 20 },
      { id: "s2", kind: "person", ref: "ht_priya", ringSeconds: 30 },
      { id: "s3", kind: "voicemail", ref: "", ringSeconds: 0 },
    ],
    status: "verified",
    verifiedAt: daysAgo(41, 12, 31),
    calls7d: 213,
  },
  {
    ...F,
    id: "fr_redmond",
    fromE164: "+15415480322",
    fromLabel: "Redmond office",
    carrier: "Spectrum Business",
    toNumberId: "pn_afterhours",
    mode: "after-hours",
    route: [
      { id: "s1", kind: "number", ref: "+15415480399", ringSeconds: 25 },
      { id: "s2", kind: "agent", ref: "ag_afterhours", ringSeconds: 20 },
    ],
    status: "pending",
    verifiedAt: null,
    calls7d: 0,
  },
];

// ---------------------------------------------------------------------------
// Knowledge gaps. Questions callers asked this week that nothing in the
// knowledge base answered. This is where knowledge actually gets added.
// ---------------------------------------------------------------------------

export const knowledgeGaps: KnowledgeGap[] = [
  {
    ...F,
    id: "kg_careoregon",
    question: "Do you take CareOregon?",
    askedCount7d: 6,
    lastAskedAt: daysAgo(0, 15, 2),
    channel: "voice",
    fallback: "message",
  },
  {
    ...F,
    id: "kg_parking",
    question: "Is there parking at the Redmond office?",
    askedCount7d: 4,
    lastAskedAt: daysAgo(1, 10, 47),
    channel: "chat",
    fallback: "declined",
  },
  {
    ...F,
    id: "kg_nightguard",
    question: "How much is a night guard?",
    askedCount7d: 3,
    lastAskedAt: daysAgo(2, 18, 21),
    channel: "voice",
    fallback: "declined",
  },
  {
    ...F,
    id: "kg_thanksgiving",
    question: "Are you open the Friday after Thanksgiving?",
    askedCount7d: 2,
    lastAskedAt: daysAgo(3, 9, 14),
    channel: "voice",
    fallback: "message",
  },
];

/** True today, gone tomorrow. Read on every call until it expires. */
export const dailyNotice: DailyNotice = {
  ...F,
  id: "dn_today",
  text: "Dr. Iyer is out today. Anyone booked with her is being offered Dr. Castellanos today or Dr. Iyer next week.",
  activeUntil: daysAgo(0, 23, 59),
  setBy: "Priya Raghunathan",
  setAt: daysAgo(0, 14, 48),
};

// ---------------------------------------------------------------------------
// Booking links the agent sent by text or chat, and what came of them. The
// weekly totals are the sums of the daily rows; nothing here is asserted on
// its own.
// ---------------------------------------------------------------------------

const dayOf = (n: number) => daysAgo(n).slice(0, 10);

export const bookingLinks: BookingLinkStats = {
  ...F,
  sent7d: 121,
  sent7dPrev: 104,
  opened7d: 88,
  booked7d: 37,
  booked7dPrev: 29,
  daily: [
    { date: dayOf(13), sent: 13, booked: 3 },
    { date: dayOf(12), sent: 15, booked: 4 },
    { date: dayOf(11), sent: 12, booked: 3 },
    { date: dayOf(10), sent: 16, booked: 5 },
    { date: dayOf(9), sent: 14, booked: 4 },
    { date: dayOf(8), sent: 18, booked: 6 },
    { date: dayOf(7), sent: 16, booked: 4 },
    { date: dayOf(6), sent: 15, booked: 4 },
    { date: dayOf(5), sent: 17, booked: 5 },
    { date: dayOf(4), sent: 14, booked: 4 },
    { date: dayOf(3), sent: 19, booked: 6 },
    { date: dayOf(2), sent: 16, booked: 5 },
    { date: dayOf(1), sent: 21, booked: 7 },
    { date: dayOf(0), sent: 19, booked: 6 },
  ],
  byPlatform: [
    {
      platform: "calendar",
      name: "Online booking page, Curve Dental",
      sent: 121,
      booked: 37,
    },
  ],
  byChannel: [
    { channel: "voice", sent: 79, booked: 21 },
    { channel: "chat", sent: 42, booked: 16 },
  ],
};

// ---------------------------------------------------------------------------
// Human handoff
// ---------------------------------------------------------------------------

export const handoffTriggers: HandoffTrigger[] = [
  {
    ...F,
    key: "asks-for-person",
    label: "The caller asks for a person",
    description:
      "Any version of it: a manager, the owner, a real person, someone who works there.",
    enabled: true,
    fired30d: 41,
  },
  {
    ...F,
    key: "emergency",
    label: "It sounds urgent",
    description:
      "Pain, a leak, an injury, someone stranded. Transfers before anything else is asked.",
    enabled: true,
    fired30d: 9,
  },
  {
    ...F,
    key: "upset",
    label: "The caller is upset",
    description: "Raised voice, repeated complaints, or they say they are unhappy.",
    enabled: true,
    fired30d: 14,
  },
  {
    ...F,
    key: "billing",
    label: "It is about money owed",
    description: "A disputed charge, a refund, a bill they do not understand.",
    enabled: true,
    fired30d: 11,
  },
  {
    ...F,
    key: "repeat-caller",
    label: "Third call in a day",
    description:
      "The same number has called twice already today without getting what it needed.",
    enabled: false,
    fired30d: 0,
  },
  {
    ...F,
    key: "agent-unsure",
    label: "The agent is not sure",
    description: "Instead of taking a message, it offers to put them through.",
    enabled: false,
    fired30d: 0,
  },
];

export const handoffTargets: HandoffTarget[] = [
  {
    ...F,
    id: "ht_desk",
    name: "Front desk staff",
    role: "Whoever is at the desk",
    e164: "+15413882014",
    availability: "Mon to Fri, 8am to 5pm",
    availableNow: true,
    transfer: { style: "warm", ringSeconds: 20, ifNoAnswer: "next", textSummary: false },
  },
  {
    ...F,
    id: "ht_priya",
    name: "Priya Raghunathan",
    role: "Office manager",
    e164: "+15415960473",
    availability: "Mon to Fri, 7:30am to 6pm",
    availableNow: true,
    transfer: { style: "warm", ringSeconds: 30, ifNoAnswer: "next", textSummary: true },
  },
  {
    ...F,
    id: "ht_oncall",
    name: "On-call line",
    role: "Rotates weekly",
    e164: "+15413170288",
    availability: "Every day, after hours",
    availableNow: false,
    transfer: { style: "direct", ringSeconds: 45, ifNoAnswer: "message", textSummary: true },
  },
];

/**
 * Per agent: when it puts a caller through to a person, and who it rings.
 * Website Chat has none, because a chat has no call to transfer.
 */
export const agentTransfers: Record<string, AgentTransfer> = {
  ag_frontdesk: {
    enabled: true,
    triggers: ["asks-for-person", "emergency", "upset", "billing"],
    customTriggers: ["Another practice is calling to refer a patient"],
    to: [
      { id: "ts_fd_1", kind: "person", ref: "ht_desk", ringSeconds: 20 },
      { id: "ts_fd_2", kind: "person", ref: "ht_priya", ringSeconds: 30 },
    ],
    style: "warm",
    ifNoAnswer: "message",
    textSummary: true,
    say: "Of course. Let me get someone from the office for you. One moment, please.",
  },
  ag_afterhours: {
    enabled: true,
    triggers: ["asks-for-person", "emergency"],
    customTriggers: [],
    to: [{ id: "ts_ah_1", kind: "person", ref: "ht_oncall", ringSeconds: 45 }],
    style: "direct",
    ifNoAnswer: "callback",
    textSummary: true,
    say: "I am putting you through to our on-call line now. Please stay on the line.",
  },
  ag_recall: {
    enabled: false,
    triggers: ["asks-for-person"],
    customTriggers: [],
    to: [{ id: "ts_rc_1", kind: "person", ref: "ht_desk", ringSeconds: 20 }],
    style: "warm",
    ifNoAnswer: "message",
    textSummary: false,
    say: "Let me pass you to the front desk.",
  },
  ag_spanish: {
    enabled: true,
    triggers: ["asks-for-person", "emergency", "upset"],
    customTriggers: [],
    to: [
      { id: "ts_es_1", kind: "number", ref: "+15417280391", label: "Lucía Ferreira, bilingual coordinator", ringSeconds: 25 },
      { id: "ts_es_2", kind: "person", ref: "ht_desk", ringSeconds: 20 },
    ],
    style: "warm",
    ifNoAnswer: "callback",
    textSummary: true,
    say: "Claro. Le comunico con alguien de la oficina. Un momento, por favor.",
  },
};

export const handoffSettings: HandoffSettings = {
  ...F,
  style: "warm",
  ringSeconds: 20,
  fallback: "message",
  textSummary: true,
};

export const handoffLog: HandoffRecord[] = [
  {
    ...F,
    id: "ho_1",
    conversationId: "cv_9474",
    callerLabel: "(541) 220-8817",
    trigger: "billing",
    at: daysAgo(0, 15, 3),
    answeredBy: "Front desk staff",
    waitSeconds: 11,
    result: "connected",
  },
  {
    ...F,
    id: "ho_2",
    conversationId: null,
    callerLabel: "Delphine Okafor",
    trigger: "asks-for-person",
    at: daysAgo(0, 13, 47),
    answeredBy: "Priya Raghunathan",
    waitSeconds: 23,
    result: "connected",
  },
  {
    ...F,
    id: "ho_3",
    conversationId: null,
    callerLabel: "(458) 201-6634",
    trigger: "emergency",
    at: daysAgo(1, 4, 12),
    answeredBy: null,
    waitSeconds: 41,
    result: "fell-back",
  },
  {
    ...F,
    id: "ho_4",
    conversationId: null,
    callerLabel: "Walt Brenneman",
    trigger: "upset",
    at: daysAgo(2, 20, 26),
    answeredBy: "Front desk staff",
    waitSeconds: 8,
    result: "connected",
  },
  {
    ...F,
    id: "ho_5",
    conversationId: null,
    callerLabel: "(541) 977-1052",
    trigger: "asks-for-person",
    at: daysAgo(3, 22, 51),
    answeredBy: null,
    waitSeconds: 40,
    result: "fell-back",
  },
];

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const messageTemplates: MessageTemplate[] = [
  {
    ...F,
    id: "mt_confirm",
    key: "booking-confirmation",
    name: "Booking confirmation",
    when: "Right after the agent books something",
    channels: ["sms", "email"],
    enabled: true,
    subject: "You are booked with {business}",
    body: "Hi {first_name}, you are booked for {booking_time} at {location}. Reply C to confirm or R to reschedule.",
    sent30d: 612,
  },
  {
    ...F,
    id: "mt_link",
    key: "booking-link",
    name: "Booking link",
    when: "When the caller would rather book themselves",
    channels: ["sms"],
    enabled: true,
    subject: null,
    body: "Here is the link to book with {business}: {booking_link} It holds your spot for 30 minutes.",
    sent30d: 488,
  },
  {
    ...F,
    id: "mt_missed",
    key: "missed-call",
    name: "Missed call text back",
    when: "When a call drops before the agent could help",
    channels: ["sms"],
    enabled: true,
    subject: null,
    body: "Sorry we missed you at {business}. Reply here and we will sort it out, or call back any time on {business_phone}.",
    sent30d: 37,
  },
  {
    ...F,
    id: "mt_reminder",
    key: "reminder",
    name: "Reminder",
    when: "The day before a booking",
    channels: ["sms"],
    enabled: true,
    subject: null,
    body: "Reminder: {booking_time} tomorrow at {location}. Reply R to reschedule.",
    sent30d: 571,
  },
];

export const teamAlerts: TeamAlert[] = [
  {
    ...F,
    id: "ta_needs",
    key: "needs-person",
    name: "A conversation needs a person",
    description:
      "Sent the moment the agent flags something it should not handle alone.",
    channels: ["sms", "email"],
    enabled: true,
    recipients: ["mb_priya", "mb_omar"],
  },
  {
    ...F,
    id: "ta_daily",
    key: "daily-digest",
    name: "Morning summary",
    description:
      "At 7am: what came in overnight, what was booked, what still needs you.",
    channels: ["email"],
    enabled: true,
    recipients: ["mb_priya", "mb_omar", "mb_sunita"],
  },
];

export const sentMessages: SentMessage[] = [
  {
    ...F,
    id: "sm_1",
    templateKey: "booking-confirmation",
    channel: "sms",
    to: "(541) 410-2287",
    sentAt: daysAgo(0, 16, 21),
    status: "delivered",
    failure: null,
  },
  {
    ...F,
    id: "sm_2",
    templateKey: "booking-link",
    channel: "sms",
    to: "(458) 330-9015",
    sentAt: daysAgo(0, 15, 56),
    status: "opened",
    failure: null,
  },
  {
    ...F,
    id: "sm_3",
    templateKey: "booking-confirmation",
    channel: "email",
    to: "m.halvorsen@fastmail.com",
    sentAt: daysAgo(0, 15, 9),
    status: "opened",
    failure: null,
  },
  {
    ...F,
    id: "sm_4",
    templateKey: "missed-call",
    channel: "sms",
    to: "(541) 977-1052",
    sentAt: daysAgo(0, 14, 32),
    status: "failed",
    failure: "That number is a landline and cannot receive texts.",
  },
  {
    ...F,
    id: "sm_6",
    templateKey: "reminder",
    channel: "sms",
    to: "(541) 385-6620",
    sentAt: daysAgo(0, 12, 0),
    status: "queued",
    failure: null,
  },
];

// ---------------------------------------------------------------------------
// Contacts. Everyone who has called or chatted. Phone numbers are 541 and 458,
// which is right for Central Oregon. Emails only where the caller gave one.
// ---------------------------------------------------------------------------

export const contacts: Contact[] = [
  {
    ...F,
    id: "ct_nadia",
    name: "Nadia Okonkwo",
    e164: "+15414197732",
    email: "nadia.okonkwo@gmail.com",
    source: "voice",
    tags: ["Returning patient"],
    firstSeenAt: daysAgo(0, 15, 51),
    lastContactAt: daysAgo(0, 15, 51),
    conversations: 1,
    bookings: 1,
    lastOutcome: "booked",
    followUp: null,
  },
  {
    ...F,
    id: "ct_marisol",
    name: "Marisol Vega",
    e164: "+15415508841",
    email: "mvega.bend@outlook.com",
    source: "voice",
    tags: ["Pediatric", "Insurance question"],
    firstSeenAt: daysAgo(2, 4, 12),
    lastContactAt: daysAgo(2, 4, 12),
    conversations: 1,
    bookings: 0,
    lastOutcome: "message",
    followUp: "Confirm Oregon Health Plan coverage and call back",
  },
  {
    ...F,
    id: "ct_tobias",
    name: "Tobias Lindqvist",
    e164: "+15417283095",
    email: "tobias@lindqvist.io",
    source: "chat",
    tags: ["New patient", "Invisalign"],
    firstSeenAt: daysAgo(0, 13, 49),
    lastContactAt: daysAgo(0, 13, 49),
    conversations: 1,
    bookings: 1,
    lastOutcome: "booked",
    followUp: null,
  },
  {
    ...F,
    id: "ct_gerald",
    name: "Gerald Whitmore",
    e164: "+15413064488",
    email: null,
    source: "voice",
    tags: ["Returning patient"],
    firstSeenAt: daysAgo(214, 16, 2),
    lastContactAt: daysAgo(0, 11, 40),
    conversations: 4,
    bookings: 3,
    lastOutcome: "booked",
    followUp: null,
  },
  {
    ...F,
    id: "ct_unknown_8817",
    name: null,
    e164: "+15412208817",
    email: null,
    source: "voice",
    tags: ["Billing"],
    firstSeenAt: daysAgo(0, 15, 3),
    lastContactAt: daysAgo(0, 15, 3),
    conversations: 1,
    bookings: 0,
    lastOutcome: "transferred",
    followUp: "Refund the duplicate charge of $412",
  },
  {
    ...F,
    id: "ct_delphine",
    name: "Delphine Okafor",
    e164: "+15419273340",
    email: "delphine.okafor@icloud.com",
    source: "voice",
    tags: ["New patient"],
    firstSeenAt: daysAgo(0, 13, 47),
    lastContactAt: daysAgo(0, 13, 47),
    conversations: 1,
    bookings: 0,
    lastOutcome: "answered",
    followUp: "Send the new patient booking link",
  },
  {
    ...F,
    id: "ct_walt",
    name: "Walt Brenneman",
    e164: "+15413851166",
    email: "wbrenneman@bendbroadband.com",
    source: "voice",
    tags: ["Returning patient", "Upset caller"],
    firstSeenAt: daysAgo(380, 9, 15),
    lastContactAt: daysAgo(2, 20, 26),
    conversations: 6,
    bookings: 4,
    lastOutcome: "transferred",
    followUp: null,
  },
  {
    ...F,
    id: "ct_halvorsen",
    name: "Mette Halvorsen",
    e164: "+14583309015",
    email: "m.halvorsen@fastmail.com",
    source: "chat",
    tags: ["Cosmetic consult"],
    firstSeenAt: daysAgo(6, 19, 2),
    lastContactAt: daysAgo(1, 15, 9),
    conversations: 2,
    bookings: 0,
    lastOutcome: "lead",
    followUp: "Never booked. Send the consult booking link",
  },
];

/**
 * What a booking link can point at. The calendar services are this
 * workspace's own. FareHarbor and Ezra Pro carry example services so the
 * picker shows what it looks like once connected; it marks them unavailable
 * while they are not.
 */
export const bookingServices: BookingService[] = [
  { ...F, id: "bs_exam", platform: "calendar", name: "New patient exam and x-ray", durationMinutes: 60 },
  { ...F, id: "bs_clean", platform: "calendar", name: "Cleaning", durationMinutes: 50 },
  { ...F, id: "bs_emerg", platform: "calendar", name: "Emergency visit", durationMinutes: 30 },
  { ...F, id: "bs_consult", platform: "calendar", name: "Cosmetic consult", durationMinutes: 45 },
  { ...F, id: "bs_fh_tour", platform: "fareharbor", name: "Two hour river tour", durationMinutes: 120 },
  { ...F, id: "bs_ep_event", platform: "ezra-pro", name: "Group event booking", durationMinutes: 180 },
];

// ---------------------------------------------------------------------------
// API and webhooks
// ---------------------------------------------------------------------------

const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

export const apiKeys: ApiKey[] = [
  {
    ...F,
    id: "key_sheet",
    name: "Reporting sheet sync",
    last4: "9f3c",
    access: "read",
    createdAt: daysAgo(63, 17, 5),
    createdBy: "Priya Raghunathan",
    lastUsedAt: minutesAgo(18),
  },
  {
    ...F,
    id: "key_site",
    name: "Practice website booking form",
    last4: "a71e",
    access: "write",
    createdAt: daysAgo(12, 10, 48),
    createdBy: "Priya Raghunathan",
    lastUsedAt: daysAgo(2, 9, 41),
  },
];

export const webhookEndpoints: WebhookEndpoint[] = [
  {
    ...F,
    id: "wh_zapier",
    url: "https://hooks.zapier.com/hooks/catch/18423377/b7xk2qa/",
    description: "Zapier: new bookings into the recall spreadsheet",
    events: ["booking.created", "booking.cancelled"],
    status: "active",
    createdAt: daysAgo(34, 11, 2),
    lastDeliveryAt: minutesAgo(7),
    successRate7d: 0.994,
    secretLast4: "4be2",
  },
  {
    ...F,
    id: "wh_ops",
    url: "https://ops.aldercreekdental.com/hooks/ezra",
    description: "Office wallboard",
    events: ["call.completed", "transfer.started", "voicemail.received"],
    status: "failing",
    createdAt: daysAgo(9, 16, 30),
    lastDeliveryAt: minutesAgo(3),
    successRate7d: 0.613,
    secretLast4: "e08d",
  },
];

export const webhookDeliveries: WebhookDelivery[] = [
  { ...F, id: "dl_1", endpointId: "wh_ops", event: "call.completed", at: minutesAgo(3), statusCode: 503, durationMs: 10_000, attempt: 3 },
  { ...F, id: "dl_2", endpointId: "wh_zapier", event: "booking.created", at: minutesAgo(7), statusCode: 200, durationMs: 214, attempt: 1 },
  { ...F, id: "dl_3", endpointId: "wh_ops", event: "transfer.started", at: minutesAgo(11), statusCode: 503, durationMs: 9_872, attempt: 2 },
  { ...F, id: "dl_4", endpointId: "wh_ops", event: "call.completed", at: minutesAgo(26), statusCode: 503, durationMs: 10_000, attempt: 1 },
  { ...F, id: "dl_5", endpointId: "wh_zapier", event: "booking.cancelled", at: minutesAgo(48), statusCode: 200, durationMs: 187, attempt: 1 },
  { ...F, id: "dl_6", endpointId: "wh_ops", event: "voicemail.received", at: minutesAgo(73), statusCode: 200, durationMs: 342, attempt: 1 },
  { ...F, id: "dl_7", endpointId: "wh_zapier", event: "booking.created", at: minutesAgo(96), statusCode: 200, durationMs: 229, attempt: 1 },
  { ...F, id: "dl_8", endpointId: "wh_ops", event: "call.completed", at: minutesAgo(131), statusCode: 200, durationMs: 298, attempt: 1 },
];

// ---------------------------------------------------------------------------
// Website widget and voice
// ---------------------------------------------------------------------------

export const widgetSettings: WidgetSettings = {
  accent: "#0f766e",
  mode: "light",
  corners: "soft",
  font: "modern",
  launcher: { icon: "chat", size: "md", position: "right", label: "", motion: "pulse" },
  greeting: {
    enabled: true,
    text: "Hi! Need a cleaning or a new patient visit? I can book you in right here.",
    delaySeconds: 5,
    onPhones: false,
  },
  assistantName: "Maren",
  subtitle: "Alder Creek Dental",
  welcome: "Hi, I'm Maren. I can answer questions about the practice, check your insurance, or book a visit.",
  quickReplies: ["Book a visit", "Do you take my insurance?", "Opening hours", "I have a toothache"],
  placeholder: "Ask anything about the practice",
  showCallButton: true,
  showBranding: true,
  voice: {
    voiceId: "vc_maren",
    pace: 1,
    warmth: 0.6,
    greeting: "Thanks for calling Alder Creek Dental, this is Maren. How can I help you today?",
    answerAfterRings: 1,
    hold: "piano",
    ambience: "none",
    naturalPauses: true,
    interrupt: true,
    spanish: true,
  },
};

// ---------------------------------------------------------------------------
// Automations: booking link follow-ups and review requests
// ---------------------------------------------------------------------------

const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const hoursAhead = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

export const followUpSettings: FollowUpSettings = {
  ...F,
  enabled: true,
  steps: [
    {
      id: "fu_1",
      afterHours: 2,
      channel: "sms",
      body: "Hi {first_name}, it's {business}. Your {service} is still open to book whenever suits you: {booking_link}",
      emailTemplateId: null,
    },
    {
      id: "fu_2",
      afterHours: 24,
      channel: "sms",
      body: "Morning {first_name}! Times for {service} are filling up this week. Grab one here, or just reply and we'll sort it: {booking_link}",
      emailTemplateId: null,
    },
    {
      id: "fu_3",
      afterHours: 72,
      channel: "email",
      body: "",
      emailTemplateId: "et_fu_gentle",
    },
  ],
  stopWhenReplied: true,
  stopWhenCalled: true,
  quietHours: true,
};

export const followUpResults: FollowUpResults = {
  ...F,
  started: 287,
  tapped: 139,
  booked: 61,
  bookedPrev: 48,
  optedOut: 4,
  bookedValueCents: 1_183_450,
  byStep: [
    { stepId: "fu_1", sent: 287, tapped: 88, booked: 37 },
    { stepId: "fu_2", sent: 231, tapped: 38, booked: 17 },
    { stepId: "fu_3", sent: 176, tapped: 13, booked: 7 },
  ],
  daily: [
    { date: dayOf(13), sent: 9, converted: 2 },
    { date: dayOf(12), sent: 11, converted: 3 },
    { date: dayOf(11), sent: 8, converted: 1 },
    { date: dayOf(10), sent: 12, converted: 4 },
    { date: dayOf(9), sent: 10, converted: 2 },
    { date: dayOf(8), sent: 7, converted: 3 },
    { date: dayOf(7), sent: 5, converted: 1 },
    { date: dayOf(6), sent: 11, converted: 2 },
    { date: dayOf(5), sent: 13, converted: 4 },
    { date: dayOf(4), sent: 9, converted: 3 },
    { date: dayOf(3), sent: 12, converted: 2 },
    { date: dayOf(2), sent: 10, converted: 3 },
    { date: dayOf(1), sent: 8, converted: 2 },
    { date: dayOf(0), sent: 6, converted: 1 },
  ],
};

export const followUpBookings: FollowUpBooking[] = [
  { ...F, id: "fb_1", name: "Delphine Okafor", e164: "+15419273340", service: "Cleaning", stepId: "fu_2", linkSentAt: hoursAgo(26), bookedAt: hoursAgo(1.6), valueCents: 18_900 },
  { ...F, id: "fb_2", name: "Ravi Chandrasekar", e164: "+15413318820", service: "New patient exam and x-ray", stepId: "fu_1", linkSentAt: hoursAgo(9.5), bookedAt: hoursAgo(7.2), valueCents: 26_400 },
  { ...F, id: "fb_3", name: "Corinne Batiste", e164: "+15412093371", service: "Cosmetic consult", stepId: "fu_3", linkSentAt: hoursAgo(97), bookedAt: hoursAgo(22), valueCents: 9_500 },
  { ...F, id: "fb_4", name: "Hollis Varga", e164: "+15417740158", service: "Cleaning", stepId: "fu_1", linkSentAt: hoursAgo(31), bookedAt: hoursAgo(28.4), valueCents: 18_900 },
  { ...F, id: "fb_5", name: "Anneliese Moreau", e164: "+14582261903", service: "Whitening", stepId: "fu_2", linkSentAt: hoursAgo(55), bookedAt: hoursAgo(30.7), valueCents: 42_500 },
  { ...F, id: "fb_6", name: "Tomasz Wierzbicki", e164: "+15413886412", service: "Emergency visit", stepId: "fu_1", linkSentAt: hoursAgo(50), bookedAt: hoursAgo(47.9), valueCents: 21_750 },
];

export const followUpRuns: FollowUpRun[] = [
  { ...F, id: "fr_1", name: "Marisol Vega", e164: "+15415508841", service: "Cleaning", linkSentAt: hoursAgo(1.3), sent: 0, nextAt: hoursAhead(0.7), state: "waiting" },
  { ...F, id: "fr_2", name: "Tobias Lindqvist", e164: "+15417283095", service: "Cosmetic consult", linkSentAt: hoursAgo(19), sent: 1, nextAt: hoursAhead(5), state: "waiting" },
  { ...F, id: "fr_3", name: null, e164: "+15412208817", service: "New patient exam and x-ray", linkSentAt: hoursAgo(50), sent: 2, nextAt: hoursAhead(22), state: "waiting" },
  { ...F, id: "fr_4", name: "Delphine Okafor", e164: "+15419273340", service: "Cleaning", linkSentAt: hoursAgo(26), sent: 2, nextAt: null, state: "booked" },
  { ...F, id: "fr_5", name: "Walt Brenneman", e164: "+15413851166", service: "Emergency visit", linkSentAt: hoursAgo(4), sent: 1, nextAt: null, state: "replied" },
  { ...F, id: "fr_6", name: "Mette Halvorsen", e164: "+14583309015", service: "Cosmetic consult", linkSentAt: hoursAgo(80), sent: 3, nextAt: null, state: "opted-out" },
];

export const reviewSettings: ReviewSettings = {
  ...F,
  enabled: true,
  afterHours: 3,
  channels: ["sms"],
  body: "Hi {first_name}, thanks for visiting {business} today! A quick review helps other people find us: {review_link}",
  emailTemplateId: "et_review",
  reminder: {
    enabled: true,
    afterDays: 2,
    body: "Hi {first_name}, one last nudge from {business}. If you have 30 seconds, we'd really value a review: {review_link}",
  },
  onceEveryDays: 90,
  platforms: [
    { key: "google", url: "https://g.page/r/CbX4tQ9aldercreek/review", enabled: true },
    { key: "facebook", url: "https://www.facebook.com/aldercreekdental/reviews", enabled: true },
    { key: "tripadvisor", url: "", enabled: false },
    { key: "website", url: "", enabled: false },
  ],
};

export const reviewResults: ReviewResults = {
  ...F,
  asked: 412,
  tapped: 171,
  reviewed: 97,
  reviewedPrev: 71,
  reminded: 238,
  reviewedAfterReminder: 29,
  averageRating: 4.79,
  byPlatform: [
    { key: "google", reviews: 84, rating: 4.82 },
    { key: "facebook", reviews: 13, rating: 4.62 },
  ],
  byChannel: [
    { channel: "sms", asked: 389, reviewed: 93 },
    { channel: "email", asked: 23, reviewed: 4 },
  ],
  daily: [
    { date: dayOf(13), sent: 14, converted: 3 },
    { date: dayOf(12), sent: 16, converted: 4 },
    { date: dayOf(11), sent: 13, converted: 2 },
    { date: dayOf(10), sent: 17, converted: 5 },
    { date: dayOf(9), sent: 15, converted: 3 },
    { date: dayOf(8), sent: 6, converted: 2 },
    { date: dayOf(7), sent: 3, converted: 1 },
    { date: dayOf(6), sent: 15, converted: 4 },
    { date: dayOf(5), sent: 18, converted: 3 },
    { date: dayOf(4), sent: 14, converted: 4 },
    { date: dayOf(3), sent: 16, converted: 5 },
    { date: dayOf(2), sent: 13, converted: 2 },
    { date: dayOf(1), sent: 7, converted: 3 },
    { date: dayOf(0), sent: 9, converted: 1 },
  ],
};

export const reviewRuns: ReviewRun[] = [
  { ...F, id: "rr_1", name: "Nadia Okonkwo", e164: "+15414197732", service: "Cleaning", completedAt: hoursAgo(5), askedAt: hoursAgo(2), channel: "sms", state: "reviewed", platform: "google", rating: 5, excerpt: "Dr. Castellanos explained every step and the hygienist was so gentle. In and out in under an hour.", reviewedAt: hoursAgo(1.4) },
  { ...F, id: "rr_2", name: "Gerald Whitmore", e164: "+15413064488", service: "Emergency visit", completedAt: hoursAgo(6.5), askedAt: hoursAgo(3.5), channel: "sms", state: "tapped", platform: null, rating: null, excerpt: null, reviewedAt: null },
  { ...F, id: "rr_3", name: "Priya Raman", e164: "+15419906214", service: "New patient exam and x-ray", completedAt: hoursAgo(28), askedAt: hoursAgo(25), channel: "email", state: "reviewed", platform: "facebook", rating: 4, excerpt: "Friendly front desk and they got me in the same week. Parking at the Bend office is tight.", reviewedAt: hoursAgo(19) },
  { ...F, id: "rr_4", name: "Tobias Lindqvist", e164: "+15417283095", service: "Cleaning", completedAt: hoursAgo(4), askedAt: hoursAgo(1), channel: "sms", state: "asked", platform: null, rating: null, excerpt: null, reviewedAt: null },
  { ...F, id: "rr_5", name: "Marisol Vega", e164: "+15415508841", service: "Cosmetic consult", completedAt: hoursAgo(51), askedAt: hoursAgo(48), channel: "sms", state: "reviewed", platform: "google", rating: 5, excerpt: "Honest about what I actually needed and what I didn't. That's rare.", reviewedAt: hoursAgo(0.6) },
  { ...F, id: "rr_6", name: "Lionel Achterberg", e164: "+15412287759", service: "Crown fitting", completedAt: hoursAgo(53), askedAt: hoursAgo(50), channel: "sms", state: "reminded", platform: null, rating: null, excerpt: null, reviewedAt: null },
];

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

const ALDER_STYLE = { accent: "#0f766e", corners: "soft", font: "modern", header: "band" } as const;

export const emailTemplates: EmailTemplate[] = [
  {
    ...F,
    id: "et_fu_gentle",
    name: "Still thinking it over",
    purpose: "follow-up",
    subject: "Still thinking about your {service}?",
    preheader: "Every open time is one tap away.",
    blocks: [
      { id: "b1", kind: "heading", text: "Your {service} is still open to book" },
      { id: "b2", kind: "text", text: "Hi {first_name}, no pressure at all. If you'd still like to come in, the button below shows every open time across our offices." },
      { id: "b3", kind: "button", label: "See open times", link: "booking_link" },
      { id: "b4", kind: "text", text: "If something held you back, like cost, timing, or a question about the visit, just reply to this email or call us on {business_phone}. A real person reads every reply." },
      { id: "b5", kind: "signoff", text: "Hope to see you soon,", name: "The team at {business}" },
    ],
    style: ALDER_STYLE,
    updatedAt: hoursAgo(26),
  },
  {
    ...F,
    id: "et_fu_week",
    name: "Times filling up",
    purpose: "follow-up",
    subject: "A few {service} times left this week",
    preheader: "Book in under a minute, or reply and we'll find one for you.",
    blocks: [
      { id: "b1", kind: "heading", text: "This week is nearly full" },
      { id: "b2", kind: "text", text: "Hi {first_name}, we still have a handful of {service} times over the next few days. Pick one that suits you and you're done." },
      { id: "b3", kind: "button", label: "Book my visit", link: "booking_link" },
      { id: "b4", kind: "divider" },
      { id: "b5", kind: "text", text: "Rather talk to someone? Call {business_phone} and we'll book it with you." },
      { id: "b6", kind: "signoff", text: "Thanks,", name: "{business}" },
    ],
    style: ALDER_STYLE,
    updatedAt: hoursAgo(212),
  },
  {
    ...F,
    id: "et_review",
    name: "Thanks for coming in",
    purpose: "review",
    subject: "Thanks for visiting {business}, {first_name}",
    preheader: "Thirty seconds that helps other families find a dentist they trust.",
    blocks: [
      { id: "b1", kind: "heading", text: "Thanks for coming in today" },
      { id: "b2", kind: "text", text: "Hi {first_name}, it was good to see you for your {service}. If you have a moment, we'd love to hear how it went." },
      { id: "b3", kind: "stars", prompt: "How was your visit? Tap to leave a review." },
      { id: "b4", kind: "text", text: "Reviews help other people in Bend find a practice they can trust, and every one is read by the whole team." },
      { id: "b5", kind: "signoff", text: "With thanks,", name: "Dr. Omar Castellanos and the team" },
    ],
    style: ALDER_STYLE,
    updatedAt: hoursAgo(74),
  },
  {
    ...F,
    id: "et_review_short",
    name: "Quick review ask",
    purpose: "review",
    subject: "Would you leave us a quick review?",
    preheader: "It takes less than a minute.",
    blocks: [
      { id: "b1", kind: "text", text: "Hi {first_name}, thanks again for choosing {business}. Would you share a few words about your visit?" },
      { id: "b2", kind: "button", label: "Leave a review", link: "review_link" },
      { id: "b3", kind: "signoff", text: "Thank you,", name: "{business}" },
    ],
    style: { ...ALDER_STYLE, header: "plain" },
    updatedAt: hoursAgo(530),
  },
  {
    ...F,
    id: "et_confirm",
    name: "Booking confirmed",
    purpose: "booking",
    subject: "You're booked: {service}, {booking_time}",
    preheader: "Everything you need for your visit.",
    blocks: [
      { id: "b1", kind: "heading", text: "You're all set, {first_name}" },
      { id: "b2", kind: "booking" },
      { id: "b3", kind: "text", text: "Please arrive ten minutes early if this is your first visit. Need to change it? Use the link below or call {business_phone}." },
      { id: "b4", kind: "button", label: "Change or cancel", link: "booking_link" },
      { id: "b5", kind: "signoff", text: "See you soon,", name: "The team at {business}" },
    ],
    style: ALDER_STYLE,
    updatedAt: hoursAgo(1180),
  },
  {
    ...F,
    id: "et_reminder",
    name: "See you tomorrow",
    purpose: "booking",
    subject: "Reminder: {service} tomorrow",
    preheader: "Reply C to confirm, or change it in one tap.",
    blocks: [
      { id: "b1", kind: "heading", text: "See you tomorrow" },
      { id: "b2", kind: "booking" },
      { id: "b3", kind: "button", label: "Reschedule", link: "booking_link" },
      { id: "b4", kind: "signoff", text: "Thanks,", name: "{business}" },
    ],
    style: ALDER_STYLE,
    updatedAt: hoursAgo(860),
  },
];
