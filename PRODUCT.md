# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Next.js 15 (App Router, React Server Components) + TypeScript strict + Tailwind v4 + shadcn/ui.
Chosen because the product app is an authenticated, data-heavy Operate surface with long-lived sessions,
because Vapi ships a first-class browser SDK that needs a client-side runtime, and because shadcn/ui gives
owned component source that can be tuned to a custom visual world rather than shipped in its default state.
Deploy target not yet decided; nothing in this stack constrains it to a single host.

## Users

**Primary: the owner or office manager of a local service business.** Dental practices, salons and med-spas,
HVAC and plumbing contractors, law firms, veterinary clinics, real estate offices. Typically 2 to 40 staff.

**Also confirmed: tour operators, visitor attractions, and amusement parks.** Added at the user's direction. The job is the
same, a missed call is a lost booking, but three things differ and the product must respect them. Demand is
seasonal and spiky rather than steady. The person who would answer is out running the product, on a boat or
leading a group, not behind a desk. And a large share of callers are visitors from another region or time
zone, which raises the value of out-of-hours answering and of a second language.

Their situation: the phone rings while they are with a customer, mid-procedure, on a job site, or closed for
the night. Every unanswered call is a booking that goes to a competitor. They have no receptionist, or one
receptionist who cannot cover evenings and weekends.

Their job: stop losing revenue to missed calls and unanswered website chats, without hiring, without learning
software, and without reading documentation. They are not technical. They will not write a prompt. They will
abandon a setup flow that asks them questions they cannot answer.

They use the product on a laptop in a lit office during business hours, and on a phone between appointments.

Secondary users are not confirmed. Do not design for agencies, developers, or enterprise buyers.

## Product Purpose

EZRA AI lets a local service business create, deploy, and supervise AI agents that answer its phone and its
website chat. The agents book appointments, qualify leads, answer questions about the business, and escalate
to a human when they should.

Success is measured by the business, not by the software: calls answered instead of missed, appointments
booked outside office hours, and revenue attributable to conversations the owner was not present for. A
customer who logs in once a week to skim what the agent handled is a successful customer.

## Positioning

The differentiator is the creation process, not the model. A competing product asks the owner to write a
system prompt, upload documents, and configure tools. EZRA derives the agent from the business's own website:
the owner pastes a URL, and the platform proposes the business name, services, hours, service area, tone, and
an FAQ, all pre-filled and editable. The owner corrects rather than authors.

The claim a neighbor cannot truthfully copy without rebuilding their product: a working, testable agent in
under five minutes with no blank text fields.

## Operating Context

- The business already has a website. It is the primary source of truth about the business and the input to
  agent creation.
- The business already has a phone number that customers know. Number porting and call forwarding are part of
  the real workflow, not an edge case. [inferred from the buyer profile]
- Appointments live in an external calendar or practice-management system. The agent's value depends on
  writing into it. [inferred]
- The owner reviews what happened rather than supervising live. Recordings, transcripts, and summaries are the
  main surface they return to.
- Conversations are bilingual in many of these markets, especially Spanish. [inferred, unconfirmed]
- For tours and attractions, a daily operating status (weather, tides, closures) is a real input the agent
  needs and the business already maintains. [inferred from the vertical]
- The business's vocabulary is not the product's. The app says customer, caller and booking; a workspace's
  own data says patient, guest or rider. The dashboard must read correctly for a dental group and a boat tour
  without changing a label. [user's direction, 2026-09-21]
- Seasonal businesses make a flat annual rate a poor fit. This matters for pricing, which is still undecided.

## Capabilities and Constraints

Confirmed for this build:

- EZRA is its own platform, not a reseller or a wrapper. Vapi, Retell, and similar products are competitive
  reference points for what the category has taught users to expect, never a dependency and never a runtime we
  build against. The agent runtime, call transport, transcription, and number provisioning are ours to own.
- The realtime voice layer is defined by an internal interface (`lib/voice`). During the frontend phase it is
  backed by a simulator. Whatever powers it in production, whether our own media stack or a carrier and model
  vendor underneath it, is a backend decision that does not reach the UI.
- The frontend phase covers the **authenticated product app only**. Marketing site, embeddable website widget,
  and public agent pages are explicitly out of scope for now.
- Two agent channels: voice and chat. They share one agent definition.
- Booking platform integrations for tours, activities and events: **FareHarbor** and **Ezra Pro**, both named
  by the user on 2026-09-21. The agent reads availability and sends a checkout link, and the product reports
  how many links it sent and how many became bookings. The order in which calendar and CRM integrations ship
  remains open below.
- A public API and webhooks, added at the user's direction on 2026-11-09. They live on their own "API and
  webhooks" tab of Integrations, never the default view, so principle 4 still holds for the owner. The
  Integrations directory lists many apps as connectable; which ones actually ship first is still open below.
- **Automations** (renamed from Messages at the user's direction on 2026-11-11, route `/automations`, with
  `/messages` redirecting): booking link follow-ups and review requests each have their own screen with
  Results, Setup, and People, plus a shared library of block-built email templates. Review requests send the
  same ask and link to everyone; there is no score-first step and no filtering by satisfaction, also at the
  user's direction. Automations is one row of tabs: Overview, General (booking confirmation, booking link,
  missed call text back, reminder, each edited on its own screen), Follow-ups, Reviews, Email templates, and
  Team alerts.
- The app must run end to end with no backend, against a typed mock data layer.

Explicitly undecided, do not invent:

- Pricing, plan names, plan limits, and per-minute rates.
- Which calendar and CRM integrations ship first.
- Whether the product is multi-tenant per workspace or per business.
- Data residency, retention periods, and compliance posture. HIPAA is likely to matter for the dental and
  veterinary segments but has not been confirmed.
- Any customer count, logo, testimonial, or usage statistic. None exist yet.

## Brand Commitments

The name **EZRA AI** is fixed. The company behind it is Ellington Technologies.

No logo, palette, typeface, voice guide, or visual reference exists. The visual world is unconstrained and is
established in DESIGN.md as part of this work.

## Evidence on Hand

None. There are no customers, no case studies, no testimonials, no press, no usage data, and no screenshots of
a prior version. Every number, name, quote, and logo that appears in the interface during this phase is
fixture data and must be recognizable as such in the codebase. Future work must not promote fixture content
into a claim.

## Product Principles

1. **The owner corrects, never authors.** Every field the product can derive from the website arrives
   pre-filled. A blank required text input in the creation flow is a defect.
2. **Testable before deployable.** The owner must be able to talk to the agent inside the app before it is
   ever pointed at a real customer. Confidence comes from hearing it work, not from reading a config.
3. **Review over supervision.** The product respects that nobody is watching. It reports what happened in the
   business's own terms, and it surfaces only what needs a human.
4. **Plain language, always.** No prompt, token, model, temperature, webhook, or endpoint appears in the
   default interface. Advanced controls exist, behind disclosure, named in the product's own words.
5. **Boring where it counts.** This is a tool used under time pressure by someone who did not choose to learn
   it. Standard affordances, predictable layout, and no motion that does not report state.

## Accessibility & Inclusion

Target is WCAG 2.2 AA across the app. Two product-specific needs drive this beyond compliance:

- Both themes are fully designed and separately verified, because the same office manager reviews calls at a
  bright reception counter at 9am and checks the overnight queue at 11pm. Dark is the default. Body text
  clears well above the 4.5:1 floor in both.
- Call and conversation review is an audio-first surface. Every recording ships with a synchronized transcript,
  and no state is communicated by color or by audio alone.
