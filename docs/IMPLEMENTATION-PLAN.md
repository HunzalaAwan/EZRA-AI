# EZRA AI: Frontend Implementation Plan

Scope now covers two surfaces: the **marketing site** and the **authenticated product app**. The embeddable
website widget and public agent pages are still deferred. Nothing here requires a backend to run.

The marketing site was added after the app, at the user's direction, modelled on Calendly's homepage rhythm
and carrying the app's own charcoal and emerald world.

Read [PRODUCT.md](../PRODUCT.md) for product truth and [DESIGN.md](../DESIGN.md) for the visual world before
writing any component. Those two files are the authority. This file is the build order.

---

## 1. Decisions already made

| Decision | Value | Consequence |
|---|---|---|
| Buyer | Local service SMB owner or office manager | Zero-jargon copy, light mode default, setup under 5 minutes |
| Voice runtime | Ours, behind `lib/voice` | Simulator in the frontend phase, no third-party SDK in the UI |
| Brand | Name only, visual world designed here | DESIGN.md is the source of truth, not a brand guide |
| Framework | Next.js 15 App Router, TypeScript strict | Server Components by default, client leaves for interactivity |
| Styling | Tailwind v4, CSS-first `@theme` | No `tailwind.config.js`, tokens live in CSS |
| Components | shadcn/ui, retuned to DESIGN.md | Never shipped in default state |
| Impeccable mode | Operate | Familiarity is the bar, expression lives in details |

## 2. Dependency set

Install in this order. Verify each against `package.json` before importing anything from it.

**Core**
```
next@15 react react-dom typescript
tailwindcss@4 @tailwindcss/postcss
```

**UI and interaction**
```
@phosphor-icons/react          icons, one family, regular weight
motion                          animation, import from "motion/react"
cmdk                            command palette
sonner                          toasts
vaul                            mobile sheets
react-aria-components           only where Radix lacks a primitive
```
shadcn/ui components are added with `npx shadcn@latest add <name>` and then edited in place.

**Data and forms**
```
@tanstack/react-query          server state in client components
@tanstack/react-table          conversations and calls tables
zustand                         agent builder draft state only
react-hook-form zod @hookform/resolvers
nuqs                            filter and tab state in the URL
date-fns                        never moment
```

**Voice**
```
wavesurfer.js                   recording scrubber with transcript sync
```
No third-party voice SDK. The realtime layer is our own interface in `lib/voice`, backed by a simulator.

**Charts**
```
recharts
```
Charts follow the `dataviz` skill. Load it before writing the first chart.

**Mocking and quality**
```
msw                             mock API, dev and test
@faker-js/faker                 fixture generation, seeded
vitest @testing-library/react
@playwright/test
@axe-core/playwright            accessibility gate in CI
eslint prettier
```

Explicitly not installed: `lucide-react`, `framer-motion` (use `motion`), `moment`, any component library
other than shadcn/ui primitives.

## 3. Repository shape

```
app/
  (auth)/          sign-in, sign-up, verify, reset
  (onboarding)/    the 5-step create flow, no app chrome
  (app)/           authenticated shell: sidebar, top bar
    dashboard/
    agents/
      [id]/        builder: identity, knowledge, actions, voice, guardrails, deploy
    conversations/
      [id]/        transcript and recording review
    numbers/
    analytics/
    integrations/
    settings/
    billing/
  api/             route handlers only where the client cannot call out directly
components/
  ui/              shadcn primitives, retuned
  app/             composed product components
  builder/         agent builder panes
  voice/           call bar, waveform, live indicator, transcript
lib/
  api/             typed client, one module per resource
  mock/            MSW handlers and seeded fixtures
  voice/           our realtime session interface plus the simulator
  format/          duration, phone, currency, relative time
styles/
  theme.css        the @theme block, generated from DESIGN.md tokens
```

## 3a. Marketing site

Ten routes: the homepage, pricing, four product pages, and four vertical landing pages.

| Decision | Why |
|---|---|
| Dark, same tokens as the app | The site and the product cannot drift if they share one theme |
| Real product captures, no stock photography | Calendly leads with its own product. `scripts/capture-marketing.mjs` re-captures at 2x. |
| Authored SVG and gradients for everything else | Sharp at any density, inherits the palette, carries no licence |
| No testimonials, logos, ratings, or statistics | EZRA has no customers. Fabricating them on a public page is a false claim, not a placeholder. |
| No published plan price | Pricing is undecided in PRODUCT.md. The surface ships; the numbers drop in later. |

Two structural constraints found while building it, both now in CLAUDE.md. An icon component cannot cross the
React Server Component boundary, so `FeatureCard` is a Server Component that delegates only its hover to a
client leaf. And the ambient hero field has to paint at `z-0` with content at `z-10`, because a negative
z-index put it behind the layout's own background fill.

## 3b. Status

Phases 0 through 9 are built and verified. The app runs end to end against the fixture layer with no backend.

| Phase | State | Note |
|---|---|---|
| 0 Foundation | done | Next 16, Tailwind v4 CSS-first theme, three self-hosted faces, contrast gate |
| 1 Data layer | partial | Typed domain and seeded fixtures are in. MSW handlers are not; the app imports fixtures directly. `docs/API-CONTRACT.md` is written. |
| 2 Design system | done | Primitives with all seven states. The kitchen-sink route is still outstanding. |
| 3 App shell | partial | Shell, sidebar, top bar, command palette, theme toggle. Auth screens are not built. |
| 4 Creation flow | done | Five steps, nothing blank, live test at the end |
| 5 Agent builder | done | Three panes, six sections, persistent test panel, version history |
| 6 Conversations | done | Filtered inbox plus synced transcript review |
| 7 Dashboard | done | Four stat tiles, three charts, agent health, recent activity |
| 8 Numbers and integrations | done | Includes the plain-language forwarding walkthrough |
| 9 Settings, team, billing | done | No invented pricing, per PRODUCT.md |
| 10 Hardening | not started | Error and empty states exist per screen; no systematic pass yet |
| 11 Quality gates | partial | Contrast, accessibility, anti-slop, and visual gates all pass across 21 routes. Impeccable audit not run. |
| Marketing site | done | 10 routes, animated, real product imagery, no fabricated proof |

### Gates

```
npm run verify          typecheck, contrast, anti-slop, production build
npm run check:a11y      axe across 11 routes, both themes, WCAG 2.2 AA
npm run check:visual    screenshots plus horizontal-overflow detection
```

All currently pass: 44 of 44 contrast pairs, zero axe violations across 21 routes in both themes, zero
overflow, zero console errors.

### Known gaps

- No auth screens. The app opens straight onto the dashboard.
- No MSW layer. Pages import fixtures directly, so failure and loading states are not yet exercisable.
- No kitchen-sink route, so the component states are not reviewable in one place.
- Interactions are visual. Publishing, claiming a number, and connecting an integration do not persist.
- The voice layer is simulated in the components rather than behind `lib/voice`. Extracting that interface is
  the first task when realtime work starts.

---

## 4. Build order

Eleven phases. Each one ends in something runnable and reviewable. Do not start a phase before its
predecessor passes its exit check.

---

### Phase 0: Foundation

Scaffold Next.js 15 with TypeScript strict and Tailwind v4. Translate every token in the DESIGN.md frontmatter
into a `@theme` block in `styles/theme.css`, including the dark variants under a `[data-theme="dark"]`
selector and a `prefers-color-scheme` media query. Wire `next/font` for Bricolage Grotesque, DM Sans, and DM
Mono, self-hosted. Set up ESLint, Prettier, Vitest, and Playwright.

Add a `scripts/check-contrast.ts` that reads the DESIGN.md frontmatter and fails the build if any named pair
drops below its floor. The palette was verified once by hand; this keeps it verified.

**Exit check:** a blank page renders on warm paper in the right typeface, light and dark both correct, and the
contrast script passes.

---

### Phase 1: Mock data layer

This is the enabler for everything after it. The app must run with no backend.

Define the domain types first, in `lib/api/types.ts`: `Workspace`, `Agent`, `AgentVersion`, `KnowledgeSource`,
`Action`, `Conversation`, `Message`, `Call`, `PhoneNumber`, `Integration`, `Member`, `UsageRecord`.

Write MSW handlers for every endpoint the app will call, with realistic latency and a switchable failure mode
so error states can be developed rather than imagined. Generate fixtures with a fixed faker seed: real-sounding
local businesses, believable US numbers, transcripts of varying length including one 40-turn call, and messy
figures. No "Acme", no "Jane Doe", no round percentages.

Export the handler signatures as `docs/API-CONTRACT.md`. That file becomes the backend's specification.

**Exit check:** every endpoint returns typed fixture data, and toggling failure mode produces errors the UI
will later have to handle.

---

### Phase 2: Design system and primitives

Add the shadcn/ui components the app needs and retune each one to DESIGN.md: radii, the 1px border language,
the four elevation levels, focus rings, and the seven states. A component is not done until default, hover,
focus-visible, active, disabled, loading, and error all exist.

Build the EZRA-specific primitives that shadcn does not have:

- `LiveIndicator` with the pulse, the "Live" word, and the reduced-motion solid fallback
- `StatusBadge` for agent and conversation states
- `EmptyState` that takes a heading, an explanation, and exactly one action
- `DataTable` wrapper over TanStack Table with sticky header, row hover, and the mobile stacked-row collapse
- `Duration`, `PhoneNumber`, `Timestamp`, `Money` formatters that render in DM Mono with tabular numerals
- `PageHeader` for the top bar
- `Skeleton` variants shaped like each real content block

Assemble them into a `/kitchen-sink` route rendering every component in every state, light and dark. Keep it
permanently. It is where the Phase 11 audit runs.

**Exit check:** the kitchen sink shows all seven states for every interactive component, in both themes,
keyboard navigable end to end.

---

### Phase 3: Auth and app shell

Sign in, sign up, email verification, password reset, and the workspace switcher. Auth is mocked at this
stage; swap in the real provider later behind `lib/api/auth.ts`.

Build the shell: 244px sidebar on panel, 56px top bar, content on paper. Implement the three responsive
states (full sidebar, icon rail at `lg`, sheet below `md`). Add the command palette on `cmd+k` because this
audience benefits from one path to everything.

**Exit check:** a user can sign in, land in the shell, navigate every top-level route, and use the app at
375px, 768px, 1024px, and 1440px without horizontal scroll.

---

### Phase 4: The creation flow

The product's whole positioning lives here. Five steps, no blank required fields, target under 5 minutes.

1. **Paste your website.** One input. On submit, show a real scan in progress with the pages being read. Return
   a derived profile: business name, services, hours, service area, phone, and an FAQ drawn from the site.
2. **Confirm what we found.** Everything pre-filled and editable inline. The owner corrects, never authors.
   Anything the scan could not find is called out plainly with a suggested value, never left empty.
3. **What should it do?** A choice between concrete goals: book appointments, qualify leads, answer questions,
   take orders, route urgent calls. Choosing one sets the agent's behavior and required actions.
4. **Pick a voice and a name.** Voice samples play inline, each one speaking a line built from this business's
   own details rather than generic sample text.
5. **Try it.** A live test call in the browser through our own voice layer, transcript streaming beside it.
   Deploy is the only action that follows.

Resumable at any step. Progress persists. Back never loses work.

**Exit check:** a first-time user reaches a working test conversation in under 5 minutes without typing into a
single empty required field.

---

### Phase 5: Agent builder

Three panes on desktop, tabs below `lg`. Left: section nav. Center: the editing surface. Right: a persistent
test panel that is always available, chat and voice both.

Sections:

- **Identity.** Name, greeting, tone, business facts. Plain language, no prompt editor in the default view.
- **Knowledge.** Sources list: the website scan, uploaded documents, pasted text, and per-source recrawl. Each
  source shows what it contributed and when it was last read.
- **Actions.** What the agent can do: book into a calendar, take a message, transfer to a human, send a text,
  collect a callback. Each action is a card with its own settings, not a JSON tool definition.
- **Voice.** Voice selection, speaking rate, interruption handling, and the greeting preview.
- **Guardrails.** Topics to avoid, when to escalate, hours of operation, and what to say when it does not know.
- **Deploy.** Attach a phone number, get the website snippet, set the status.

Advanced settings, including the raw instruction text, live behind disclosure on each section. Never the
default view.

Unsaved changes are explicit. Publishing creates a version, and versions are listed with a diff and a rollback.

**Exit check:** an agent can be edited, tested in the right pane without leaving the page, published, and
rolled back.

---

### Phase 6: Conversations and call review

A unified inbox across voice and chat. Filters for channel, outcome, date, and agent, all held in the URL via
`nuqs` so a filtered view is shareable.

Detail view: the recording with a waveform scrubber, the transcript synchronized to playback with the active
turn highlighted, a summary of what happened, the outcome, and any action the agent took. Human follow-up
lives here: mark resolved, add a note, flag for training.

Accessibility is load-bearing on this screen. Playback is fully keyboard operable, the transcript is the
primary representation and the audio is secondary, and no outcome is conveyed by color alone.

**Exit check:** a 40-turn call renders, scrubs, and stays synchronized, and the screen is fully usable with
audio muted.

---

### Phase 7: Dashboard

Built after conversations, not before, because it summarizes them. The owner's weekly skim.

Answers four questions in order: how many calls did the agent handle, how many became appointments or leads,
what did it fail to handle, and what needs me. Recent conversations, agent health, and the numbers in use.

Follow the `dataviz` skill for every chart. No sparklines or progress rings standing in for content, no
hero-metric template of big number plus small label as the page structure.

**Exit check:** the dashboard is readable in under 15 seconds and every tile links to the detail behind it.

---

### Phase 8: Numbers, integrations, and embed

Phone numbers: search and claim a local number, view assignments, and the porting and forwarding flow for the
number the business already advertises. Forwarding instructions are per carrier and written in plain steps.

Integrations: calendar and CRM connection cards with real connected, error, and disconnected states.

Embed: the website snippet with a copy button, a live preview of the chat bubble, and per-channel toggles.
This ships the settings surface only. The widget bundle itself is a later phase.

**Exit check:** the forwarding flow is followable by someone who has never seen a carrier admin panel.

---

### Phase 9: Settings, team, billing

Workspace settings, business profile, hours and holidays, team members and roles, notification preferences,
and the billing surface: plan, usage against included minutes, invoices, and payment method.

Plan names, prices, and limits are undecided per PRODUCT.md. Build the surface against the fixture shape and
leave the values to configuration. Do not invent pricing.

**Exit check:** every setting persists against the mock layer and reflects immediately.

---

### Phase 10: Hardening

Run `/impeccable harden` across the app. Every error state, every empty state, every loading state, every
boundary. Offline behavior. Long business names. Missing avatars. A workspace with 400 conversations and a
workspace with zero. Expired sessions. Failed test calls, which is the highest-stakes failure in the product
because it happens during onboarding.

Add i18n scaffolding with Spanish as the second locale, per the PRODUCT.md operating context note. Strings
extracted, not translated yet.

**Exit check:** failure mode on in MSW, and no screen in the app renders a raw error or an unstyled blank.

---

### Phase 11: Quality gates

Four gates, all blocking.

1. **Impeccable audit and polish.** `/impeccable audit` then `/impeccable polish` on the kitchen sink and each
   route. Act on findings from the design detector hook, which is already installed and runs after UI edits.
2. **Accessibility.** Axe via Playwright across every route in both themes, zero violations. Manual keyboard
   pass. Screen reader pass on the conversation detail and the creation flow.
3. **Anti-slop pass.** Mechanical greps against the DESIGN.md don't-list: em-dash and en-dash anywhere visible,
   emoji in markup, `lucide-react` imports, hand-rolled SVG icon paths, nested cards, `h-screen`, `#000000`,
   gradient text, and fixture names on the banned list.
4. **Performance.** Lighthouse on the dashboard and the conversation detail. INP under 200ms, CLS under 0.1.
   The waveform and the live call bar are the two likely offenders.

---

## 5. Cross-cutting rules

**Server versus client.** Server Components by default. `'use client'` only on interactive leaves. Anything
touching the voice layer, `motion`, scroll, or pointer state is a client leaf. Providers are wrapped in a single
client boundary.

**Never `useState` for continuous values.** Pointer position, scroll progress, waveform playhead, and call
volume use motion values or refs. `useState` re-renders the tree on every frame and collapses on mobile.

**The voice interface is ours.** All realtime contact goes through `lib/voice/`. The app imports an interface
with `startSession`, `endSession`, `onTranscript`, `onStatus`, `onLevel`, and `setMuted`. A simulator backs it
during the frontend phase, so the whole app runs with no media stack behind it. Whatever we build or buy for
production implements that same interface and no UI code changes.

**Fixture data is marked.** Everything from the mock layer carries a discriminator so no fixture value can be
mistaken for a real one or promoted into a product claim.

**Copy is product copy.** Controls name their action. Errors name the problem and the recovery. No model,
prompt, token, temperature, webhook, or endpoint vocabulary in default views.

## 6. Open items

These block nothing right now. They need answers before the phase that consumes them.

| Item | Needed by | Note |
|---|---|---|
| Auth provider | Phase 3 | Clerk, Auth.js, or Supabase. Mocked until chosen. |
| Production media stack | After frontend | Our own SFU and STT/TTS, or vendors under our interface. UI is unaffected. |
| Which calendar integration ships first | Phase 8 | Determines the booking action's fields |
| Plan names, prices, included minutes | Phase 9 | Do not invent. Surface is built against fixtures. |
| HIPAA posture for dental and veterinary | Phase 10 | Changes recording retention and consent copy |
| DesignMD MCP key | Optional, any phase | `claude mcp add designmd --transport http https://www.designmd.co/api/mcp --header "Authorization: Bearer KEY"`. Only needed to browse their catalog. DESIGN.md here is already written. |
