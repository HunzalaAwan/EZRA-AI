---
name: EZRA AI
description: An operations console. Charcoal ground, elevated panels, one emerald that means go and one orange that means a line is live.
colors:
  canvas: "#0A0C0B"
  surface: "#121615"
  raised: "#171C1A"
  sunken: "#070908"
  panel: "#0E1110"
  rule: "#1E2422"
  rule-control: "#606B66"
  ink: "#EEF2F0"
  ink-muted: "#96A09B"
  ink-faint: "#7C867F"
  primary: "#A78BFA"
  primary-hover: "#C4B5FD"
  primary-wash: "#1E1638"
  on-primary: "#140B2E"
  signal: "#FF6B3D"
  signal-live: "#FF6B3D"
  signal-wash: "#2D130A"
  on-signal: "#1A0700"
  media: "#060807"
  on-media: "#F4F7F5"
  on-media-muted: "#C3CCC7"
  on-media-accent: "#C4B5FD"
  success: "#00D492"
  success-wash: "#072B21"
  warning: "#FFC53D"
  warning-wash: "#2E2408"
  danger: "#FF4D6A"
  danger-wash: "#2E0F16"
  series-1: "#8B6CF0"
  series-2: "#2AA3B8"
  series-3: "#A88A2A"
  series-4: "#D2589A"
  light-canvas: "#FFFFFF"
  light-surface: "#FFFFFF"
  light-sunken: "#F2F2F1"
  light-panel: "#F6F6F5"
  light-rule: "#E7E7E5"
  light-rule-control: "#8A8A86"
  light-ink: "#0A0A0A"
  light-ink-muted: "#555553"
  light-ink-faint: "#6B6B68"
  light-primary: "#6D28D9"
  light-on-primary: "#FFFFFF"
  light-primary-wash: "#F1EBFF"
  light-signal: "#C2400F"
  light-warning: "#7A5600"
  light-warning-wash: "#F9F0DA"
  light-danger: "#C22A44"
  light-series-1: "#6A4BD6"
  light-series-2: "#0083A3"
  light-series-3: "#8A6A00"
  light-series-4: "#B03D7C"
  band-violet: "#2A1659"
  band-violet-ink: "#E2D6FF"
  band-indigo: "#1E2A6B"
  band-indigo-ink: "#D3DBFF"
  band-claret: "#5A1736"
  band-claret-ink: "#F8D3E1"
typography:
  display:
    fontFamily: "Sora, Inter, ui-sans-serif, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  heading:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.018em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-0.01em"
rounded:
  xs: "5px"
  sm: "8px"
  md: "11px"
  lg: "15px"
  xl: "20px"
  pill: "999px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
    typography: "{typography.label}"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
    typography: "{typography.label}"
    height: "36px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 12px"
    typography: "{typography.body}"
    height: "38px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  sidebar:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    width: "244px"
  live-badge:
    backgroundColor: "{colors.signal-wash}"
    textColor: "{colors.signal}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
    typography: "{typography.label}"
---
## Overview

**The world: an operations console.**

EZRA answers the phone for a business that cannot. The interface is the room that work is watched from:
charcoal ground, panels that sit above it under a light from overhead, one emerald that means go, and one
orange that means a line is live right now.

**Dark is the default.** Light is fully designed and re-verified against the same floors, not an inverted
flip, because the same office manager who reviews calls at 9am also checks the overnight queue at 11pm.

Impeccable mode is **Operate** on every surface. The tool disappears into the task. Expression lives in
precise details and in motion, not in decoration.

**Dials:** variance 5, motion 7, density 5.

### Defaults deliberately rejected

Recorded so later work does not quietly reinstate them.

- **AI purple and violet gradients.** The category default. Emerald says connected and running; purple says
  nothing about answering a phone.
- **Warm cream and paper neutrals.** The first direction for this product. Rejected on appeal: it read as
  low-energy and dated next to the tools this audience already admires.
- **Monospace as a display face.** JetBrains Mono appears only where the content is literally a measurement.
- **Pure black.** The ground is `#0A0C0B`, a charcoal with a trace of green. Pure black flattens every panel
  above it because there is nothing left to step down to.
- **Glass and blur as decoration.** Used only on the top bar, where content genuinely scrolls beneath.

## Colors

Restrained is the floor. Colour earns its place by carrying state, never decoration.

**The ground steps up, never down.** `canvas` is the page, `panel` is the sidebar and toolbars, `surface` is a
card, `raised` is a card under the pointer or a nested well, `sunken` is a recess. Each step is small. On a
dark ground the difference between a panel and the page is a few percent of lightness plus a hairline, and
that is enough.

**Primary is emerald `#00D492`.** Primary actions, current selection, focus. It is a working colour, not a
brand splash. Large fills are rare and deliberate.

**Signal orange `#FF6B3D` means one thing: a line is live.** An in-progress call, a connected test session, a
recording in flight. Nothing else may use it, which is why the chart palette contains no orange at all.

**Chart series are their own four slots**, validated by the dataviz six-checks script against both grounds:
emerald `#00A87A`, blue `#4785E0`, gold `#A88A2A`, plum `#B562C9`. Assign in fixed order, never cycled. A
fifth series folds into Other or the chart is the wrong form.

**Semantic pairs.** Success, warning, danger, primary, and signal each have a `-wash` for tinted backgrounds
and a matching border at 25 to 30 percent. Text on a wash uses the solid colour, never gray.

**`ink-faint` is text and needs 4.5:1.** It carries 11px metadata. It sits near `rule-control` in value but
they are different tokens with different floors and must never be swapped.

**Borders split by purpose.** `rule` is a decorative separator and is exempt from contrast rules.
`rule-control` is the boundary of anything interactive, and clears 3:1 in both themes, which WCAG 2.2 1.4.11
requires.

Every pair is verified by `npm run check:contrast`, which reads these tokens and fails the build on anything
below its floor. A value cannot move without being rechecked.

## Typography

**Three faces, each with one job.**

**Figtree** is the display voice: page titles, section headings, and the very large marketing headlines. A
round geometric sans that holds very tight tracking at very large sizes and stays friendly doing it. Weight
600 at display sizes, tracking from -0.03em at card titles down to -0.058em on the hero. It replaced Sora on
2026-10-12 as the open-licence equivalent of the geometric display faces the user admired.

**Inter** carries everything else, in the app and on the site: body, labels, buttons, table cells, navigation.
Using one UI face across both surfaces is what stops the marketing site and the product reading as two
different products.

**JetBrains Mono** is for measurement only: call duration, phone numbers, timestamps, message counts, cost and
ID strings. Never for prose, never for labels, never to make something look technical.

All three are loaded through `next/font/google`, which self-hosts them. No stylesheet link to Google Fonts.

**Fixed rem scale, not fluid**, and it lives only in the `@theme` block in `app/globals.css`. Nothing anywhere
hardcodes a px font size, so that block is the single point of change for the whole product.

| Token | Size | Used for |
|---|---|---|
| `text-2xs` | 12px | metadata, timestamps, captions |
| `text-xs` | 13px | dense secondary labels |
| `text-sm` | 14px | interface labels, table cells, nav |
| `text-base` | 16px | body |
| `text-lg` | 18px | lead-in body, card intros |
| `text-xl` | 22px | small headings |
| `text-2xl` | 26px | panel headings |
| `text-3xl` | 32px | page titles |
| `text-4xl` | 38px | the largest in-app heading |

**16px body, 14px labels, and that is deliberate.** An earlier ladder topped out at 14px for `base` and put
most interface text between 11 and 13px. That density is borrowed from developer tooling and it is wrong for
this buyer. The person reading this runs a front office: often at arm's length, between appointments, on
whatever screen is already on the desk. Small type is not a signal of sophistication when the reader is not
looking for one.

Raising the ladder is not free and the costs are paid where they show. Every dense surface has to be
re-measured afterwards, and the sidebar had to widen from 244px to 280px because the workspace name it exists
to display no longer fit.

The marketing display ladder is separate: `.display-1` through `.display-4` plus `.lede`, fluid by design,
because a marketing headline should fill the viewport it is given while a product heading inside a sidebar
should not. `.display-4` and `.lede` both sit just above `text-lg`, so raising the body scale means raising
them too or the step between body and heading disappears.

Body measure caps at 70ch for prose. Tables and dense panels may run wider. Headings use `text-wrap: balance`
with a bounded `max-inline-size`, never a hardcoded line break tag.

Tabular numerals (`font-variant-numeric: tabular-nums`) on every column of numbers so digits do not shift
between rows.

## Layout

**App shell:** fixed sidebar at 244px on `panel`, a 56px top bar carrying page title and page-level actions,
content on `paper` with a 24px gutter and a 1280px max content width. The sidebar collapses to icons at `lg`
and becomes a sheet below `md`.

Breakpoints are the Tailwind defaults: 640, 768, 1024, 1280, 1536.

Responsive behavior here is **structural**, not fluid. Sidebar collapses, tables become stacked rows, the
three-pane builder becomes tabs. Type size does not change with viewport.

Full-height regions use `min-h-[100dvh]`, never `h-screen`.

Multi-column layouts use CSS Grid. No flexbox percentage math.

**Every multi-column layout declares its own sub-768px collapse in the same component.** No assuming Tailwind
handles it.

## Elevation & Depth

Four levels, and shadows always carry both an offset and a soft blur. A zero-offset colored halo is
decoration, not depth.

- **Flat.** Content on paper. No shadow. A `rule` border where separation is needed.
- **Raised.** Cards, panels. `0 1px 2px rgba(31,27,22,0.05), 0 1px 1px rgba(31,27,22,0.04)` plus a `rule`
  border. The border carries the edge, the shadow carries the lift.
- **Floating.** Dropdowns, popovers, command palette. `0 8px 24px rgba(31,27,22,0.10), 0 2px 6px
  rgba(31,27,22,0.06)`.
- **Overlay.** Dialogs and sheets. `0 24px 60px rgba(31,27,22,0.18)` over a `rgba(31,27,22,0.32)` scrim.

In dark mode shadows lose most of their work. Depth comes from surface lightness steps plus a 1px `dark-rule`
border. Do not scale up shadow opacity to compensate.

## Shapes

Radii are small and consistent. `xs 4px` for the smallest chips and checkboxes, `sm 6px` for buttons, inputs,
and menu items, `md 10px` for popovers and small panels, `lg 14px` for cards and dialogs, `pill` for status
badges and avatars only.

No radius above 14px on a rectangular container. Nothing is a squircle. Corners are quiet.

Border width is 1px everywhere. A 2px border appears only on a focused or selected control.

## Components

Every interactive component ships all seven states: default, hover, focus-visible, active, disabled, loading,
error. A component missing any of them is not done.

**Focus** is a 2px `primary` ring at a 2px offset, on `:focus-visible` only. Never removed, never replaced by
a background change alone.

**Loading** is a skeleton shaped like the content it replaces. Not a centered spinner in a content region.
Spinners are permitted only inside a button that was just pressed.

**Empty states teach the interface.** Each one names what goes here, why it is empty, and the one action that
fills it. "No data" is not an empty state.

**Overlays escape their container.** Dropdowns, popovers, and tooltips render through a portal. An absolutely
positioned menu inside an `overflow: auto` ancestor gets clipped.

**Modals are a last resort.** Exhaust inline editing, an expanding row, a side sheet, and a dedicated route
first. A modal is justified only by genuine interruption or protected focus, such as a destructive
confirmation.

**Tables** get sticky headers on `sunken`, row hover on `panel`, zebra striping never, and a bottom `rule`
between rows only. No top and bottom border on the same row.

**The live indicator** is the one animated element in the system: a 1.4s opacity pulse on `signal-live`,
paired with the word "Live" and a duration in DM Mono. It is disabled entirely under
`prefers-reduced-motion: reduce`, where the dot renders solid.

**Icons** are Phosphor (`@phosphor-icons/react`), regular weight, 20px in navigation and buttons, 16px inline.
One family, one weight, project-wide. Never hand-drawn SVG paths. Never emoji.

**Browser surfaces are themed**, not left at defaults: text selection uses `primary-wash`, the caret uses
`primary`, scrollbars are tinted from `rule`, focus rings are `primary`, and link underlines carry an offset.

## The marketing site

**2026-10-12: the brand moved from emerald to violet**, at the user's direction. This overrides the earlier
rejection of purple as the AI default; the violet chosen is deeper than that default (`#6D28D9` light,
`#A78BFA` dark). `success` deliberately stays green: it means Connected, Answered and Working on status
badges, and a purple success would read as a selection. Chart series were re-validated with the dataviz
script in both themes (purple, teal, gold, pink; all six checks pass) because purple beside the old violet
series would have been the same colour twice.

**The 2026-10-12 restyle.** Light is the default: white canvas, near-black ink, soft grey layers. The primary
button is ink on canvas, a pill, and there is one per view; `primary` emerald stays for links, selection and
brand marks, so the action and the brand never compete. Radii went up a step (cards 20px, marketing panels
32 to 48px, controls fully round). The homepage leads with a very large tight headline, a black pill, and a
wide rounded media panel; it closes on a black rounded panel with an inverted pill. The scroll-stacked
section is three deep marketing bands, `band-violet`, `band-indigo` and `band-claret`, each with its own pale
display tint (all 9.5:1 or better, gated). Bands are theme-independent like media.

The site and the app share one set of tokens and never diverge. What differs is register: the app is Operate
mode and recedes, the site is Persuade mode and is allowed to be loud.

**The hero carries a real 3D scene**, not a flat gradient, in `components/marketing/globe.tsx`. It shows the
product's actual shape: a world of places with calls arriving into it. A globe with a fresnel atmosphere, a
point shell, latitude rings, arcs travelling between eighteen real cities in four colours, and a ring that
pulses out of each destination as a call lands.

The atmosphere is a back-facing sphere at 1.1 radius with a fourth-power fresnel falloff. Both numbers matter:
a wider shell with a softer falloff stops being a rim and becomes a green blob sitting behind the headline.

It caps the frame rate at 30 and device pixel ratio at 2, pauses entirely when scrolled out of view, renders
one static frame under reduced motion, and returns quietly if WebGL is unavailable. An uncapped loop starves
the main thread on integrated graphics, which is not theoretical: it made the page unresponsive during
development.

**The hero headline assembles word by word**, each word rising and unblurring on its own beat, and three live
call chips drift over the globe so the page is doing the thing it describes. A single slow sweep of light
crosses the stage. That is one authored moment, not a decoration on every element.

**One display ladder, used everywhere on the site.** `.display-1` through `.display-4` plus `.lede`, defined
in globals.css. They are fluid, which is the deliberate exception to the app's fixed scale: a marketing
headline should fill the viewport it is given, while a product heading inside a sidebar should not. Never
write a one-off arbitrary heading size on a marketing page; if a size is missing, add it to the ladder.

**Backgrounds are composable utilities**, not per-section gradients: `.bg-mesh` for the main coloured field,
`.bg-spot` for a single emerald spotlight, `.bg-ember` for a warm one, `.bg-alarm` for the uncovered
state (danger and gold, never signal), `.bg-grid` for structure, and
`.bg-grain` to stop large flat gradients banding. Every colour in them is mixed from a token, and each has a
light-mode override, because the same percentage over white reads far weaker than over near-black. That
asymmetry is the whole reason the first light-mode pass looked washed out.

**Photography is real and it is carried, not pasted.** Every photograph renders at full strength behind a
hairline border, under a scrim that is dark in both themes, with light type over it. It is not dimmed and not
desaturated: an earlier pass mixed the scrim from the page background, which reads acceptably on near-black
and takes the image to fog on white. A photo card therefore looks the same in light and dark, which is
correct, because the photograph is content and not a surface. Images come from Pexels under a licence
permitting commercial use with no attribution, are pinned by ID in `scripts/fetch-photos.mjs`, and are served
from `public/photos`.

**Product screenshots are the running application**, captured at 2x by `scripts/capture-marketing.mjs`. Never
a dashboard mocked up from styled divs.

**Nothing on a public page may be invented.** No customers, testimonials, logos, ratings, or statistics, and
no plan price. EZRA has no customers yet, and pricing is undecided in PRODUCT.md. A fabricated one is a claim,
not a placeholder.

**The argument is drawn, not photographed.** The homepage claim that missed calls have a shape in time is
made by plotting that shape, in `components/marketing/call-pattern.tsx`: an illustrative week of calls against
the hours a front desk is staffed, with a switch to the same week under EZRA and an agent unit at the foot of
the card that the covered calls visibly drop into. It replaced a bento of six stock photographs. A photograph
of somebody holding a phone asserts the problem and cannot show it.

A call's state is carried by three redundant channels, in this order: position, because a mark outside the lit
band is uncovered and geometry survives any colour vision; shape, because answered marks are filled discs and
missed marks are open rings; and only then colour. That order is not a preference. dataviz's validator scores
`success` against `danger` at deutan delta-E 8.3 on the dark surface and 8.0 on the light one, which is the
floor of the legal band and permitted only when something other than hue also carries the meaning. The
grey-versus-red alternative measures worse, at protan 4.4.

**The colour of a section can be the state of the thing it shows.** The call-pattern band owns its own
section shell rather than sitting inside the generic one, because the mood has to reach the edges of the band
and not stop at the card. Two fields stay mounted across the whole section and crossfade on the switch: `.bg-alarm`
for the uncovered week, `.bg-mesh` for the covered one. `.bg-alarm` is mixed from `danger` and the gold series
and never from `signal`, because signal means a live line and a whole band of it would say the opposite of
what the uncovered state means. The card's edge and shadow, the coverage fills, the marks' halos and the agent
unit all take the same state colour, so the plot is lit from the same source as the field behind it.

**Spare height belongs with the subject, not under the footer.** A card beside a long list is taller than any
one thing it shows. When that happens the flexible block is the one the visitor came for (on the call card, the
caller's own words in the lit half), sized to hold the space. The first two versions of that card left a third
of it empty beneath the footer and were rebuilt for this reason twice.

**Any new chart colour is measured, not chosen.** Run the dataviz skill's `validate_palette.js` against the
real surface for both themes before the colour ships, and record what it returned next to the code that uses
it. Both of the numbers above came from that script, not from judgement.

**Colour on the site does a job, and the job is identity or state.** Every trade in the picker carries one of
the four chart hues, and the hue travels: the tile disc, the badge on the call card, the outcome strip, and a
large soft field behind the card all take it, so the band recolours as the visitor moves down the list. The hue
reaches the DOM as one custom property, `--hue`, set on the tile and on the card, and every colour rule is
written once against it. That is what lets a plain `transition-colors` animate a change of trade: the computed
value moves and the transition follows, with no script animating colour. Text never takes the hue. Text stays
`ink`, `ink-muted`, `signal` or `primary`, whose pairs were already gated, and every hue is registered in the
contrast script as a mark on `surface` and as the ground under an `on-primary` icon, both themes.

The four hues are the chart series because those are the only identity colours this system has. `primary` is
actions and selection, `signal` is a live line, and the status colours are status. Twelve trades over four hues
repeat each hue three times, which is fine for a picker: neighbours never share one and the hue is redundant
with the label and the icon rather than carrying identity alone.

**A list someone has to search holds still.** The trades EZRA serves are a tablist beside a panel, in
`components/marketing/trades.tsx`, not a ticker. Choosing a trade plays back the call that trade misses: the
hour it lands, what the caller says, what EZRA says back, and what the business finds waiting afterwards. This
replaced two rows of chips scrolling in opposite directions, which could not be read at the speed it moved and
so could not answer the only question the section exists to answer, and which had nothing to give a visitor
who had already answered it. Full tablist keyboard behaviour is required: one tab stop, arrows on both axes
because the list is a column at desktop and two columns on a phone, plus Home and End.

**Stacking cards** fill most of the viewport, pin with sticky positioning, and are driven by two separate
scroll trackers: one for climbing into place from below, one for receding as the next card covers them. The
receding card shrinks, tips back in perspective, blurs and dims. Both trackers run through a spring, because
raw scroll progress from a trackpad is jittery enough to be visible.

Three things about it are not obvious and were all found the hard way. Every card must share one parent, or
sticky releases it the moment its own wrapper scrolls past and the effect simply does not happen. There must
be no gap between cards, or you watch a gap close before anything overlaps. And because the cards scale from
their top edge, the receding card's bottom rises and opens a band of page background, so each card overlaps
the one before it by about 9vh to close that band.

## Do's and Don'ts

**Do**

- Pre-fill every field the platform can derive. Blank required inputs in the creation flow are defects.
- Write controls that name their action: "Publish agent", not "Submit". Write errors that name the problem and
  the recovery.
- Keep transitions between 150ms and 250ms with an ease-out curve. Motion reports state and nothing else.
- Use `signal` for live lines only, and use `primary` for actions and selection only.
- Give recordings a synchronized transcript. Never communicate state by color or audio alone.
- Run real fixture content at every breakpoint and fix what overflows. Long business names, 40-message
  transcripts, and 11-digit international numbers are the real test.

**Don't**

- No em-dash or en-dash anywhere visible. Use a hyphen, a comma, a colon, or two sentences. This applies to UI
  copy, empty states, error messages, tooltips, and fixture data.
- No eyebrows or kickers above headings. The heading carries itself.
- No section numbering, no decorative status dots, no scroll cues, no version stamps in the UI.
- No gradient text, no neon glow, no glassmorphism, no custom cursors, no pure black.
- No nested cards. A card inside a card is always wrong. A row of identical icon-heading-text cards is the lazy
  page structure.
- No fake product UI built from styled divs to stand in for a screenshot.
- No model, prompt, token, temperature, webhook, or endpoint vocabulary in default views.
- No "Jane Doe", no "Acme", no `99.9%`, no `(555) 123-4567`. Fixture data uses realistic business names,
  believable US numbers, and messy real-looking figures.
- No stock photograph standing in for an argument the page can draw. A picture of a person mid-task asserts a
  situation; a plot of that situation shows it, and can be checked. Photography earns its place where the
  subject is the point, which on this site is the vertical pages, not the homepage.
- No marquee or ticker carrying anything a visitor has to read. A logo wall, a trade ticker, or a scrolling
  list of names is the default filler of an AI-written landing page, and moving text cannot be scanned. A
  marquee is allowed only for a set nobody needs to search, where the impression of quantity is the entire
  point.
- No orchestrated page-load animation. The app loads into a task.
