# EZRA AI: API contract

Written for the engineers building the EZRA backend.

This is the surface the frontend already consumes. Every shape here is live in
[lib/api/types.ts](../lib/api/types.ts) and every field is rendered somewhere in the app, so the contract is
derived from working UI rather than proposed ahead of it. Implementing these endpoints against these shapes
replaces the fixture layer with no frontend changes.

Two rules before the details.

**Nothing in the UI knows about a third-party vendor.** EZRA is its own platform. The realtime voice layer sits
behind our own interface in `lib/voice`. If a vendor ends up underneath it, that stays a backend fact.

**Fixture records carry `__fixture: true`.** Real responses must not. That flag is how the app can tell seeded
content from customer data, and it exists so no placeholder value is ever promoted into a product claim.

## Conventions

- JSON over HTTPS. All times are ISO 8601 with an offset. All money is integer cents. All durations are
  integer seconds.
- Phone numbers are E.164 on the wire (`+15413882014`). The UI formats them for display.
- Every collection endpoint returns `{ data: T[], nextCursor: string | null }`.
- Every single-record endpoint returns the record or a 404.
- Errors return `{ error: { code: string, message: string, field?: string } }`. `message` is shown to a
  non-technical business owner, so it names the problem and the recovery in plain words.
- The workspace is resolved from the session. No endpoint takes a workspace id in the path.

## Endpoints

### Workspace

| Method | Path | Returns |
|---|---|---|
| GET | `/workspace` | `Workspace` |
| PATCH | `/workspace` | `Workspace` |

`Workspace` carries `plan`, `minutesIncluded`, and `minutesUsed`. Plan names and limits come from
configuration, never from the frontend. The billing screen renders whatever it is given and shows "Set on your
account" where a price would go, because pricing is undecided per PRODUCT.md.

### Agents

| Method | Path | Returns |
|---|---|---|
| GET | `/agents` | `Agent[]` |
| POST | `/agents` | `Agent` |
| GET | `/agents/:id` | `Agent` |
| PATCH | `/agents/:id` | `Agent` (draft changes, not published) |
| POST | `/agents/:id/publish` | `AgentVersion` |
| POST | `/agents/:id/rollback` | `AgentVersion`, body `{ version: number }` |
| GET | `/agents/:id/versions` | `AgentVersion[]` |

`PATCH` saves a draft. The builder tracks unpublished changes and only `publish` makes them reachable by a
caller. `version` is `0` until the first publish, which the UI renders as "Never published. Nobody can reach
this agent yet."

The analytics fields on `Agent` (`conversations7d`, `bookings7d`, `containmentRate`, `avgHandleSeconds`) are
server-computed. `containmentRate` is a fraction, not a percentage, and the UI formats it to one decimal
place. Do not round it to a clean number.

### Website scan

| Method | Path | Returns |
|---|---|---|
| POST | `/scan` | `{ jobId: string }`, body `{ url: string }` |
| GET | `/scan/:jobId` | `{ status, pagesRead: string[], profile }` |

This is the endpoint the whole product positioning rests on. `profile` must return `businessName`,
`services`, `hours`, `serviceArea`, and `phone`, each with a `confidence` and the source page it came from.

**Anything the scan cannot determine comes back named, with a suggested value, never as an empty string.**
The creation flow treats a blank required field as a defect, so a missing value must arrive as
`{ value: null, reason: "Not found on the site", suggestion: "..." }` and the UI explains it rather than
showing the owner an empty box.

### Knowledge

| Method | Path | Returns |
|---|---|---|
| GET | `/agents/:id/knowledge` | `KnowledgeSource[]` |
| POST | `/agents/:id/knowledge` | `KnowledgeSource` |
| POST | `/knowledge/:id/refresh` | `KnowledgeSource` |
| DELETE | `/knowledge/:id` | 204 |
| GET | `/knowledge` | `KnowledgeSource[]`, every source in the workspace |
| GET | `/knowledge/gaps` | `KnowledgeGap[]` |
| POST | `/knowledge/gaps/:id/answer` | `KnowledgeSource`, body `{ answer }` |
| GET | `/knowledge/notice` | `DailyNotice`, or 204 when nothing is set |
| PUT | `/knowledge/notice` | `DailyNotice`, body `{ text, activeUntil }` |
| DELETE | `/knowledge/notice` | 204 |

`status` is one of `ready`, `reading`, `stale`, `failed`. `failed` needs a plain-language reason: the UI
renders "Could not be read. The file is password protected", not an error code.

A gap is a question a caller asked that no source answered, with what the agent did instead (`message`,
`transfer`, `declined`). Answering one creates an `faq` source and removes the gap. The notice is one sentence
that is true until `activeUntil`; every agent reads it while it is active and the server drops it on expiry.
The knowledge page leads with the gaps because that is where knowledge actually gets added.

### Actions

| Method | Path | Returns |
|---|---|---|
| GET | `/agents/:id/actions` | `AgentAction[]` |
| PATCH | `/actions/:id` | `AgentAction` |

`kind` is one of `book`, `message`, `transfer`, `sms`, `callback`. These are product concepts, not tool
definitions. The UI never exposes a schema, a function name, or a webhook.

### Conversations

| Method | Path | Returns |
|---|---|---|
| GET | `/conversations` | `Conversation[]` |
| GET | `/conversations/:id` | `Conversation` |
| PATCH | `/conversations/:id` | `Conversation` (resolve, flag, note) |

Query parameters, all optional and all mirrored in the URL by the UI so a filtered view is shareable:
`channel`, `outcome`, `agent`, `review`, `from`, `to`, `cursor`.

`transcript` is an ordered `Message[]` where `atSeconds` is the offset from the start of the conversation.
The transcript is the primary representation and the recording is secondary, so **`transcript` is required
even when `recordingUrl` is null**. Chats have no recording and must still return a full transcript.

`outcome` is one of `booked`, `lead`, `answered`, `transferred`, `message`, `missed`.

### Phone numbers

| Method | Path | Returns |
|---|---|---|
| GET | `/numbers` | `PhoneNumber[]` |
| GET | `/numbers/available` | `PhoneNumber[]`, query `areaCode` |
| POST | `/numbers` | `PhoneNumber` (claim) |
| PATCH | `/numbers/:id` | `PhoneNumber` (assign to an agent) |
| POST | `/numbers/:id/port` | `PhoneNumber` |

Every `PhoneNumber` and every `ForwardingRule` carries `route: RouteStep[]`, the places a call goes in
priority order. A step is `{ id, kind, ref, ringSeconds }` where `kind` is `agent` (ref is an agent id),
`person` (ref is a handoff target id), `number` (ref is any E.164 number) or `voicemail` (no ref, and only ever
the last step). Each step rings for `ringSeconds`; if unanswered, the next runs. `PATCH /numbers/:id` and
`PATCH /numbers/forwarding/:id` accept `{ route }`.

`status` is one of `active`, `porting`, `forwarding`. Porting is a real multi-day state with its own
explanation in the UI, not an edge case.

| Method | Path | Returns |
|---|---|---|
| GET | `/numbers/forwarding` | `ForwardingRule[]` |
| POST | `/numbers/forwarding` | `ForwardingRule`, body `{ fromE164, fromLabel, carrier, toNumberId, mode }` |
| POST | `/numbers/forwarding/:id/test` | 202. The rule turns `verified` when the call lands. |
| DELETE | `/numbers/forwarding/:id` | 204 |

A rule pairs a line the business already owns with one EZRA number. `mode` is one of `always`,
`after-hours`, `busy`, `no-answer`. `status` is `pending` until a call has arrived through the rule and
`verified` after. The test endpoint places an outbound call to `fromE164` so that the first call arrives while
the user is watching; the UI never asks them to trust that forwarding is on.

### Human handoff

| Method | Path | Returns |
|---|---|---|
| GET | `/handoff` | `{ triggers: HandoffTrigger[], targets: HandoffTarget[], settings: HandoffSettings }` |
| PUT | `/handoff` | same shape, saved as one unit |
| POST | `/handoff/targets/:id/test` | 202, rings the target |
| GET | `/handoff/log` | `HandoffRecord[]` |

Each target carries its own `transfer` settings: `style` (`warm` or `direct`), `ringSeconds`, `ifNoAnswer` (`next`, `message`, `callback`, `voicemail`) and `textSummary`. A `next` on the last target falls through to `message`. Handoff is workspace-wide so every agent transfers the same way. An agent may add extra situations on top;
it can never switch off a shared one. `asks-for-person` is always on: a caller who asks for a person gets one.
Targets outside their hours are skipped. `style: "warm"` means the agent tells the person who is calling and
why before connecting. When nobody answers, `fallback` runs and the `handoff-missed` team alert fires.

### Messages

| Method | Path | Returns |
|---|---|---|
| GET | `/messages/templates` | `MessageTemplate[]` |
| PATCH | `/messages/templates/:id` | `MessageTemplate` |
| POST | `/messages/templates/:id/test` | 202, sends to the signed-in member |
| GET | `/messages/alerts` | `TeamAlert[]` |
| PATCH | `/messages/alerts/:id` | `TeamAlert` |
| GET | `/messages/sent` | `SentMessage[]`, query `from`, `status` |

Template bodies use `{variable}` placeholders: `first_name`, `business`, `booking_time`, `location`,
`booking_link`, `business_phone`, `callback_window`, `call_date`. A text over 160 characters is billed in
153-character parts. `failure` on a sent message is a plain sentence ("That number is a landline and cannot
receive texts"), never a carrier error code.

### Contacts and outbound

| Method | Path | Returns |
|---|---|---|
| GET | `/contacts` | `Contact[]`, query `q`, `filter` (`follow-up`, `booked`, `never-booked`) |
| GET | `/contacts/:id` | `Contact` with its conversations |
| POST | `/calls` | `{ callId }`, body `{ to, fromNumberId, mode: "you" or "agent", goal? }` |
| POST | `/calls/:id/hangup` | 204 |
| POST | `/booking-links` | `{ url, code }`, body `{ platform, serviceId, contactId? }` |
| POST | `/messages/send` | `SentMessage`, body `{ to, channel, subject?, body, linkCodes[], sendAt? }` |

An outbound call is a conversation like any other: it is recorded, transcribed and appears in Conversations.
`mode: "agent"` places the call with the chosen agent and a `goal` (`confirm`, `reschedule`, `follow-up`,
`recall`). A booking link is minted per send with a short code (no 0, O, 1 or l) so a booking made through it
can be attributed; those attributions are what `/analytics/booking-links` counts. A platform that is not
connected cannot mint a link; the UI offers to connect it instead.

### Integrations, team, billing

| Method | Path | Returns |
|---|---|---|
| GET | `/integrations` | `Integration[]` |
| POST | `/integrations/:key/connect` | `{ redirectUrl: string }` |
| DELETE | `/integrations/:key` | 204 |
| GET | `/members` | `Member[]` |
| POST | `/members/invite` | `Member`, body `{ email, role }` |
| PATCH | `/members/:id` | `Member` |
| DELETE | `/members/:id` | 204 |
| GET | `/billing/invoices` | invoice list |
| GET | `/billing/payment-method` | card on file |

Integration `status` is one of `connected`, `error`, `available`. An `error` needs a recovery sentence the
person running the front office can act on. The UI will not say "token expired"; it says the connection needs
signing in again.

`category` is one of `booking`, `calendar`, `records` (practice and job software), `crm`, `messaging`,
`payments`, `automation`. It includes `booking` for tour, activity and ticket platforms. Known keys are `fareharbor` and
`ezra-pro`. A connected booking platform is where the agent's checkout links point.

### API keys and webhooks

| Method | Path | Returns |
|---|---|---|
| GET | `/api-keys` | `ApiKey[]` |
| POST | `/api-keys` | `{ key: ApiKey, secret: string }`, body `{ name, access: "read" \| "write" }` |
| DELETE | `/api-keys/:id` | 204 |
| GET | `/webhooks` | `WebhookEndpoint[]` |
| POST | `/webhooks` | `WebhookEndpoint`, body `{ url, description?, events: WebhookEventKey[] }` |
| PATCH | `/webhooks/:id` | `WebhookEndpoint`, body `{ status?: "active" \| "paused", events?, url? }` |
| DELETE | `/webhooks/:id` | 204 |
| POST | `/webhooks/:id/test` | `WebhookDelivery` |
| GET | `/webhooks/deliveries?limit=` | `WebhookDelivery[]`, newest first |

A key's `secret` is returned once, by the create call, and never again. Only `last4` is stored for display.
Webhook URLs must be `https`. Failed deliveries retry for 3 days, then the endpoint moves to `paused`.
Events, with the plain sentence the UI shows for each, are listed in `lib/webhooks.ts`.

### Analytics

| Method | Path | Returns |
|---|---|---|
| GET | `/analytics/summary` | `DashboardSummary` |
| GET | `/analytics/booking-links` | `BookingLinkStats` |

Server-computed. `daily` is 14 points, `hourly` is 24. `afterHoursShare` is a fraction. The dashboard and the
analytics page both read this one endpoint.

`BookingLinkStats` counts links the agent sent by text or chat and the bookings made through them. `booked7d`
is a subset of `sent7d`, `daily[].booked <= daily[].sent` always, and the weekly totals are the sums of the
daily rows. `byPlatform` names the system each booking landed in.

## Realtime voice

Not HTTP. The frontend imports an interface from `lib/voice` with `startSession`, `endSession`,
`onTranscript`, `onStatus`, `onLevel`, and `setMuted`. A simulator backs it today so the whole app runs with
no media stack behind it.

Whatever powers this in production implements that same interface. No UI file changes when it lands. The
transcript stream must emit partial and final turns separately so the test panel can show text arriving
rather than appearing all at once.

## What is deliberately absent

These are undecided per PRODUCT.md. Do not infer them from this document.

- Pricing, plan names, plan limits, and per-minute rates.
- Which calendar and CRM integrations ship first.
- Whether tenancy is per workspace or per business location.
- Data residency, retention periods, and HIPAA posture. The dental and veterinary segments make this likely to
  matter, but nobody has confirmed it.
