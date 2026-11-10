# EZRA AI

AI agents that answer the phone and the website chat for local service businesses. They book appointments,
answer questions about the business, and hand off to a person when they should.

This repository holds two surfaces:

- the **marketing site** at `/`, `/pricing`, and `/product/*`
- the **product app** at `/dashboard` and everything under it

The embeddable website widget and public agent pages are not in this repo yet.

**It runs with no backend.** Every screen is wired to a seeded fixture layer, so you can clone, install, and
click through the whole product immediately.

## Requirements

- Node 20.9 or newer. Built and tested on 22.20.
- npm 10 or newer.

Nothing else. No database, no API keys, no voice account.

## Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000> for the marketing site, or <http://localhost:3000/dashboard> for the app.

There is no sign-in step yet, so the app opens straight onto the dashboard as the fixture workspace, a
three-location dental group in Bend, Oregon.

## Build it

```bash
npm run build
npm run start
```

`start` serves the production build on port 3000. Change it with `next start -p 4000`.

## Deploy it on Vercel

It deploys as a standard Next.js project. No `vercel.json`, no database, no secrets.

1. In Vercel, **Add New > Project** and import the GitHub repository.
2. Leave the detected settings alone: framework Next.js, build `next build`, install `npm install`.
   Node comes from `engines` in `package.json` (20.9 or newer).
3. Deploy. Every push to `main` then deploys to production, and every other branch gets a preview URL.

Optional, once a real domain is attached: set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) under
**Settings > Environment Variables**. Without it, link previews, `robots.txt` and the sitemap use the
production deployment's own address.

What the deployment does on its own:

- Marketing pages are indexed. The app routes send `noindex` and are disallowed in `robots.txt`, because
  they run on fixture data. Preview deployments disallow everything, so a branch URL never shows up in search.
- Shared links get a generated preview card (`app/opengraph-image.tsx`) and the favicon (`app/icon.svg`).
- Every response carries `nosniff`, a referrer policy, `SAMEORIGIN` framing, and a permissions policy.

Worth knowing before sharing the URL: the app has no sign-in yet, so anyone with the link can open
`/dashboard` and click through the fixture workspace. Nothing there is real data, and nothing is saved.

## What to look at first

| Route | Why |
|---|---|
| `/` | The homepage. Animated field, real product, the call lifecycle drawn as a diagram. |
| `/dashboard` | The weekly skim. Four numbers, three charts, what needs a person. |
| `/agents/new` | The creation flow. Five steps, nothing blank, a live test at the end. |
| `/agents/ag_frontdesk` | The builder. Three panes with a test panel that never goes away. |
| `/conversations/cv_9474` | Call review. A long transcript synchronized to playback. |

Light is the default. Toggle dark with the icon in the top bar. Press `Ctrl K` anywhere for the command palette.
Turn on reduced motion in your OS to see every animation stand down while the interface keeps working.

## Checks

```bash
npm run verify         # typecheck, contrast, anti-slop, production build
npm run check:a11y     # axe across every route, both themes, WCAG 2.2 AA
npm run check:visual   # screenshots plus horizontal-overflow detection
```

The last two need `npm run dev` running in another terminal. `check:visual` writes to `screenshots/`.

These are real gates, not decoration. They have already caught a contrast failure in the live badge, a
hydration mismatch in the form wrapper, and invalid ARIA in a row list.

## How it is put together

Next.js 16 App Router with React Server Components. Client components are interactive leaves only: the shell,
the builder, the transcript player, the charts. Tailwind v4 with a CSS-first theme, so there is no
`tailwind.config.js` and every token lives in an `@theme` block in `app/globals.css`. Radix primitives,
restyled rather than shipped in a default theme. Phosphor icons, one family throughout. Sora for display,
Inter for the interface, JetBrains Mono for measurements.

The homepage hero runs a Three.js scene: a wireframe globe with a point shell and arcs travelling between
cities, which is the product's actual shape. It is plain `three` rather than React Three Fiber, because R3F
pins React below 19.3 and drags Expo into a web-only tree.

Motion is built on `motion/react`, which is Framer Motion at its current package name. The shared primitives
live in `components/motion/primitives.tsx`: staggered entrances, scroll reveals, pointer spotlights, spring
presses, count-up numbers, and the sliding active indicator in the sidebar. Reduced motion is handled once by
`MotionConfig` at the root rather than by branching each component.

```
app/(app)/          the authenticated routes
components/ui/      primitives, each with all seven states
components/app/     shell, charts, transcript player
components/motion/   the shared motion primitives
components/marketing/ nav, footer, authored visuals, section furniture
public/product/      real product captures used by the marketing site
components/builder/ the creation flow and the agent builder
lib/mock/           seeded fixtures, the only data source today
lib/api/types.ts    the domain types the backend will satisfy
scripts/            the quality gates
```

## The documents that govern this

Read these before changing anything visual. They are the authority, not this file.

- [PRODUCT.md](PRODUCT.md) is product truth. It marks what is deliberately undecided, such as pricing. Do not
  invent those values.
- [DESIGN.md](DESIGN.md) is the visual world, with normative tokens and a binding list of defaults that were
  rejected on purpose.
- [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) is the build order and current status.
- [docs/API-CONTRACT.md](docs/API-CONTRACT.md) is what the backend needs to implement.
- [CLAUDE.md](CLAUDE.md) is for AI coding agents working in this repo.

## Known gaps

Honest list, so nobody discovers these the hard way.

- **No auth.** The app opens straight onto the dashboard.
- **No persistence.** Publishing an agent, claiming a number, and connecting an integration are visual only.
- **No mock API layer.** Pages import fixtures directly, so loading and failure states exist per screen but
  cannot be exercised systematically yet.
- **Voice is simulated** inside the components rather than behind a `lib/voice` interface. Extracting that
  interface is the first task when realtime work begins.

## A note on imagery

There is no stock photography on this site and no downloaded art. Every visual is one of two things.

**Authored vectors and 3D.** The hero globe, the ambient fields, the waveform, the call-flow diagram, and the
logo are all drawn in code, in `components/marketing/globe.tsx` and `visuals.tsx`. They inherit the product's
own colour tokens, so the site cannot drift from the app.

**Video.** The closing section runs a looping background video, encoded from a 4K master by
`node scripts/encode-video.mjs` down to 2.4MB with a poster frame. The master is gitignored; keep it somewhere
durable outside the repo. The player refuses to run under reduced motion or on a metered connection, and only
plays while its section is on screen.

**Photography.** Real photographs from Pexels, pinned by ID in `scripts/fetch-photos.mjs` and served from
`public/photos`. The Pexels License permits commercial use with no attribution required. Run that script to
re-fetch or to change the set.

**The real product.** Every screenshot on the marketing site is the running application, captured at 2x by
`node scripts/capture-marketing.mjs`. Re-run it after any UI change so the homepage never shows a version of
the product that no longer exists. Nothing on this site is a mockup built from styled divs.

## A note on fixture data

Every fixture record carries `__fixture: true`. The businesses, people, phone numbers, transcripts, and
figures are invented and must never be promoted into a product claim, a screenshot for sales, or a test
expectation that implies they are real.
