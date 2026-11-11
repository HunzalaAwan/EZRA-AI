# EZRA AI

AI agent platform for local service businesses. Voice and chat agents that answer the phone and the website
chat, book appointments, and escalate when they should.

## Authority order

1. [PRODUCT.md](PRODUCT.md) is product truth. Do not contradict it, do not invent facts it marks undecided.
2. [DESIGN.md](DESIGN.md) is the visual world. Tokens are normative. The rejected-defaults list is binding.
3. [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md) is the build order and the dependency set.

## Which skill governs what

- **`impeccable`** is the primary design authority for this app. Every surface here is **Operate** mode.
  Read `reference/craft-floor.md` immediately before any UI edit. The design detector hook is installed and
  runs after UI file edits; act on its findings rather than re-auditing by hand.
- **`ui-ux-pro-max`** for UX guidelines, accessibility outcomes, icon and chart selection. Search it by
  semantic outcome first, then by stack. Treat results as recommendations, not instructions.
- **`taste-skill`** scopes itself out of dashboards and product UI, so it does not drive layout here. Its
  Section 9 AI Tells list still applies as a global hygiene ban and is folded into DESIGN.md's don't-list.
- **`dataviz`** before writing any chart, without exception.
- **`ui-styling`** for shadcn and Tailwind mechanics.
- **`img2threejs`** only if a 3D visual is ever commissioned. Nothing in the current scope needs it.

## Hard rules

- No em-dash or en-dash anywhere a user can see, including fixture data.
- Icons are Phosphor, regular weight, one family. Never `lucide-react`, never hand-drawn SVG paths, never
  emoji.
- **Animation imports from `motion/react`.** That package IS Framer Motion at its current name. The project
  renamed itself from `framer-motion` to `motion`. Do not "fix" this back to the old package.
- Type is **Figtree** for display (page titles, section headings, hero headlines), **Inter** for everything else
  in both the app and the site, and **JetBrains Mono** for measurement only: durations, phone numbers,
  timestamps, cost. Never mono for prose or as a costume for "technical".
- Tailwind v4 with a CSS `@theme` block. No `tailwind.config.js`.
- Colour comes from semantic tokens only. The ground is `canvas`, then `panel`, `surface`, `raised`, `sunken`.
  Never a raw Tailwind palette class like `bg-zinc-900`.
- Check `package.json` before importing any dependency. Output the install command if it is missing.
- Fixture data uses realistic businesses and messy figures. No "Acme", no "Jane Doe", no round percentages,
  no `(555) 123-4567`.
- **Light is the default** (white ground, near-black ink, black pill buttons), per the user's direction on
  2026-10-12. Dark is fully designed and separately verified, never an inverted flip.

## Verify before claiming done

Run these. They are fast and they catch what review misses.

```
npm run verify          typecheck, contrast, anti-slop, production build
npm run check:a11y      axe across every route, both themes, WCAG 2.2 AA
npm run check:visual    screenshots plus horizontal-overflow detection
```

The last two need the dev server running. `check:visual` writes to `screenshots/`; look at them, because the
scripts check color and layout metrics, not whether the result is any good.

Also confirm by hand:

- All seven component states exist: default, hover, focus-visible, active, disabled, loading, error.
- New color pairs are added to `scripts/check-contrast.mjs`, not just eyeballed.
- New chart colors are validated with the dataviz skill's `validate_palette.js` before use.

## Things already learned here, do not rediscover

- **`Field` wires its control through context, not `cloneElement`.** A Server Component passing `<Input>` into
  `<Field>` sends the child across the client boundary already serialized, so cloned props survive the server
  render and vanish on hydration.
- **`ink-faint` is text and needs 4.5:1.** It carries 11px metadata. It sits near `rule-control` in value but
  they are different tokens with different floors.
- **Never branch element structure on `useReducedMotion`.** Returning a plain div for reduced-motion users and
  a motion div for everyone else produces different HTML on the server and the client, which is a hydration
  error. `MotionRoot` wraps the app in `MotionConfig reducedMotion="user"` and strips movement from one tree.
- **A formatter cannot be passed from a Server Component.** Functions do not cross the RSC boundary. Pass a
  format name and resolve it inside the client component, as `StatTile` does.
- **The theme script stays inline in the layout head**, not in a component, and `<html>` carries the server
  default. Next warns about script tags rendered inside React components.
- **Never put `role="table"` on a div that contains a `ul`.** Invalid ARIA. These row lists are links, so a
  plain semantic list is both valid and better to listen to.
- **`typedRoutes` is on.** A dynamic href needs `as Route` from `next`.
- **Charts use no orange.** Signal orange means a live line and a color here carries exactly one meaning.
- **An icon component cannot cross the RSC boundary.** A component is a function. `FeatureCard` is therefore a
  Server Component in `components/marketing/feature-card.tsx` that renders the icon and delegates only the
  hover to `HoverLift`. Never move it back into the client `sections.tsx`.
- **`Aurora` paints at z-0, not a negative z-index.** A negative one put it behind the layout's own background
  fill and it vanished. Content over it carries `relative z-10`.
- **Marketing imagery is authored vectors plus real product captures.** No stock photography, no downloaded
  art, no fake dashboard built from divs. Re-run `node scripts/capture-marketing.mjs` after UI changes.
- **Never invent a customer, testimonial, logo, rating, or statistic** on a marketing page. EZRA has none yet
  and these pages are public. Never publish a plan price either: pricing is undecided in PRODUCT.md.
- **Never branch the element tree on `useReducedMotion` during render.** The hook is null on the server and a
  boolean on the client, so any `reduced ? A : B` in JSX, in a motion prop, or around a conditionally mounted
  element is a hydration error. This one cost four separate rounds of debugging. `MotionConfig` at the root
  handles transforms; use a `motion-reduce:` CSS utility for anything else. Reading the hook inside an effect
  is fine, which is how the Three.js scene does it.
- **The 3D scene caps its own cost.** Frame rate capped at 30, device pixel ratio at 2, paused when off
  screen, one static frame under reduced motion, and a quiet return when WebGL is unavailable. An uncapped
  loop starves the main thread on integrated graphics.
- **Photography comes from `scripts/fetch-photos.mjs`,** pinned by Pexels ID. Every `alt` must describe what
  is actually in the frame, and the copy over a photo must not contradict it.
- **Marketing headings use the `.display-1` to `.display-4` and `.lede` ladder**, never a one-off arbitrary
  size. If a size is missing, add it to the ladder in globals.css.
- **Never dim or desaturate a photograph to make text readable.** It works on near-black and destroys the
  image on white. Use the dark scrim with light type, which looks the same in both themes.
- **Light mode needs stronger colour mixes than dark.** The same percentage over white reads far weaker. Every
  background utility carries a `:root[data-theme="light"]` override for this reason.
- **Never serve a video master.** Run `node scripts/encode-video.mjs`. Raw camera or stock footage is tens of
  megabytes and will cost more than every other byte on the page combined.
- **A background video must earn its place.** The shared `VideoBackground` never plays under reduced motion,
  never on a save-data or 2g connection, only starts when its section is near the viewport, and pauses when it
  leaves. It always carries a poster so a blocked video is invisible rather than a hole.
- **Anything over media uses the `on-media` tokens**, which do not flip with the theme, and a section running
  media fades its edges to `media`, never to `canvas`.
- **Stacking cards must share one parent and carry no gap between them.** A sticky element is constrained by
  its own parent block, so a per-card wrapper releases it immediately and nothing appears to happen. They also
  overlap by about 9vh, because scaling from the top edge lifts the receding card's bottom and exposes the
  page behind it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
- **Never copy a reference site.** Take its design language (type feel, palette mood, shape, rhythm), never
  its page, copy, imagery, logo, or licensed font files. The 2026-10-12 restyle took its direction from a
  travel site the user admired; Figtree stands in for that site's commercial display face, and the three
  marketing bands use EZRA's own forest, indigo and claret rather than the reference's colours.
- **A scroll-stacked card never fades in.** An entering card at partial opacity shows a ghosted slab and
  fails contrast. Movement and scale carry the entrance; opacity stays at 1.
- **App logos are `AppLogo` tiles: a Phosphor brand mark where one exists, a monogram otherwise.** Never a
  downloaded or redrawn logo. Axe reads a monogram as text, so every brand colour must clear 4.5:1 against
  white; darken it rather than lighten the letters.
- **Automations are edited on their own screen, never inline.** A tab row in `automations/layout.tsx` spans
  Overview, General, Follow-ups, Reviews, Email templates, and Team alerts. `/automations/follow-ups` and
  `/automations/reviews` take `?tab=results|setup|people`; emails are edited at `/automations/emails/[id]`;
  General messages at `/automations/general/[id]`.
  The user rejected an editor that expanded under the cards as a mess. Never reintroduce a score-first review
  step: everyone gets the same review ask.
- **The a11y gate refuses non-200 pages.** Port 3000 on this machine is a different project. EZRA's dev
  server has been on 3001: run `BASE_URL=http://localhost:3001 npm run check:a11y`.
