/**
 * Contrast gate. Reads the color tokens out of DESIGN.md's frontmatter and
 * checks every pair the interface actually renders.
 *
 * The palette was verified by hand once. This keeps it verified when a value
 * moves. Run with: npm run check:contrast
 *
 * Floors, from WCAG 2.2:
 *   4.5:1  body text and placeholders
 *   3.0:1  large text, and the boundary of any interactive control (1.4.11)
 *   Decorative separators are exempt, which is why `rule` and `rule-control`
 *   are separate tokens.
 */
import { readFileSync } from "node:fs";

const md = readFileSync("DESIGN.md", "utf8");
const fm = md.slice(4, md.indexOf("\n---", 4));

const colors = {};
let inColors = false;
for (const line of fm.split("\n")) {
  if (/^colors:/.test(line)) {
    inColors = true;
    continue;
  }
  if (inColors && /^\S/.test(line)) break;
  const m = line.match(/^\s+([a-z0-9-]+):\s*"(#[0-9a-fA-F]{6})"/);
  if (inColors && m) colors[m[1]] = m[2];
}

function lin(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function lum(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** [description, foreground token, background token, floor] */
const PAIRS = [
  // Dark, the default theme.
  ["body on canvas", "ink", "canvas", 4.5],
  ["body on surface", "ink", "surface", 4.5],
  ["muted on canvas", "ink-muted", "canvas", 4.5],
  ["muted on surface", "ink-muted", "surface", 4.5],
  ["muted on raised", "ink-muted", "raised", 4.5],
  ["muted on panel", "ink-muted", "panel", 4.5],
  ["faint on canvas", "ink-faint", "canvas", 4.5],
  ["faint on surface", "ink-faint", "surface", 4.5],
  ["faint on panel", "ink-faint", "panel", 4.5],
  ["primary text on canvas", "primary", "canvas", 4.5],
  ["primary text on surface", "primary", "surface", 4.5],
  ["primary on its wash", "primary", "primary-wash", 4.5],
  ["body on the primary wash", "ink", "primary-wash", 4.5],
  ["on-primary over primary", "on-primary", "primary", 4.5],
  ["body on panel", "ink", "panel", 4.5],
  ["signal on canvas", "signal", "canvas", 4.5],
  ["signal on surface", "signal", "surface", 4.5],
  ["signal on its wash", "signal", "signal-wash", 4.5],
  ["success on its wash", "success", "success-wash", 4.5],
  ["warning on its wash", "warning", "warning-wash", 4.5],
  ["body on the warning wash", "ink", "warning-wash", 4.5],
  ["danger on its wash", "danger", "danger-wash", 4.5],
  ["danger text on canvas", "danger", "canvas", 4.5],
  ["missed-call mark on surface", "danger", "surface", 3.0],
  ["answered-call mark on surface", "primary", "surface", 3.0],
  ["control border on canvas", "rule-control", "canvas", 3.0],
  ["control border on surface", "rule-control", "surface", 3.0],
  ["control border on raised", "rule-control", "raised", 3.0],
  ["control border on sunken", "rule-control", "sunken", 3.0],
  ["body on sunken", "ink", "sunken", 4.5],
  ["faint on sunken", "ink-faint", "sunken", 4.5],
  ["muted on sunken", "ink-muted", "sunken", 4.5],
  ["primary text on sunken", "primary", "sunken", 4.5],
  ["focus ring on canvas", "primary", "canvas", 3.0],
  ["live dot on surface", "signal-live", "surface", 3.0],
  ["series 1 on canvas", "series-1", "canvas", 3.0],
  ["series 2 on canvas", "series-2", "canvas", 3.0],
  ["series 3 on canvas", "series-3", "canvas", 3.0],
  ["series 4 on canvas", "series-4", "canvas", 3.0],
  ["series 1 mark on surface", "series-1", "surface", 3.0],
  ["icon on filled series 1", "on-primary", "series-1", 3.0],
  ["series 2 mark on surface", "series-2", "surface", 3.0],
  ["icon on filled series 2", "on-primary", "series-2", 3.0],
  ["series 3 mark on surface", "series-3", "surface", 3.0],
  ["icon on filled series 3", "on-primary", "series-3", 3.0],
  ["series 4 mark on surface", "series-4", "surface", 3.0],
  ["icon on filled series 4", "on-primary", "series-4", 3.0],
  // Over media. These do not flip with the theme.
  ["text over media", "on-media", "media", 4.5],
  ["muted text over media", "on-media-muted", "media", 4.5],
  ["accent over media", "on-media-accent", "media", 4.5],
  // Light, selected values rather than an inverted flip.
  ["light body", "light-ink", "light-canvas", 4.5],
  ["light body on surface", "light-ink", "light-surface", 4.5],
  ["light body on panel", "light-ink", "light-panel", 4.5],
  ["light muted on panel", "light-ink-muted", "light-panel", 4.5],
  ["light faint on panel", "light-ink-faint", "light-panel", 4.5],
  ["light muted on canvas", "light-ink-muted", "light-canvas", 4.5],
  ["light muted on surface", "light-ink-muted", "light-surface", 4.5],
  ["light muted on sunken", "light-ink-muted", "light-sunken", 4.5],
  ["light faint on canvas", "light-ink-faint", "light-canvas", 4.5],
  ["light faint on surface", "light-ink-faint", "light-surface", 4.5],
  ["light faint on sunken", "light-ink-faint", "light-sunken", 4.5],
  ["light primary text", "light-primary", "light-canvas", 4.5],
  ["light on-primary", "light-on-primary", "light-primary", 4.5],
  ["light primary on its wash", "light-primary", "light-primary-wash", 4.5],
  ["light body on the primary wash", "light-ink", "light-primary-wash", 4.5],
  ["light signal text", "light-signal", "light-canvas", 4.5],
  ["light signal on surface", "light-signal", "light-surface", 4.5],
  ["light warning text", "light-warning", "light-canvas", 4.5],
  ["light warning on its wash", "light-warning", "light-warning-wash", 4.5],
  ["light body on the warning wash", "light-ink", "light-warning-wash", 4.5],
  ["light danger text", "light-danger", "light-canvas", 4.5],
  ["light missed-call mark on surface", "light-danger", "light-surface", 3.0],
  ["light answered-call mark on surface", "light-primary", "light-surface", 3.0],
  ["light control border on canvas", "light-rule-control", "light-canvas", 3.0],
  ["light control border on surface", "light-rule-control", "light-surface", 3.0],
  ["light control border on sunken", "light-rule-control", "light-sunken", 3.0],
  ["light body on sunken", "light-ink", "light-sunken", 4.5],
  ["light primary text on sunken", "light-primary", "light-sunken", 4.5],
  ["light focus ring", "light-primary", "light-canvas", 3.0],
  ["light primary button", "light-canvas", "light-ink", 4.5],
  // Marketing bands. Deep ground, pale display type, white body. Theme-independent.
  ["violet band display", "band-violet-ink", "band-violet", 4.5],
  ["indigo band display", "band-indigo-ink", "band-indigo", 4.5],
  ["claret band display", "band-claret-ink", "band-claret", 4.5],
  ["violet band body", "on-media", "band-violet", 4.5],
  ["violet band muted", "on-media-muted", "band-violet", 4.5],
  ["indigo band body", "on-media", "band-indigo", 4.5],
  ["claret band body", "on-media", "band-claret", 4.5],
  ["dark primary button", "canvas", "ink", 4.5],
  ["light series 1 mark on surface", "light-series-1", "light-surface", 3.0],
  ["light icon on filled series 1", "light-on-primary", "light-series-1", 3.0],
  ["light series 2 mark on surface", "light-series-2", "light-surface", 3.0],
  ["light icon on filled series 2", "light-on-primary", "light-series-2", 3.0],
  ["light series 3 mark on surface", "light-series-3", "light-surface", 3.0],
  ["light icon on filled series 3", "light-on-primary", "light-series-3", 3.0],
  ["light series 4 mark on surface", "light-series-4", "light-surface", 3.0],
  ["light icon on filled series 4", "light-on-primary", "light-series-4", 3.0],
];

let failed = 0;
const rows = [];

for (const [label, fg, bg, floor] of PAIRS) {
  if (!colors[fg] || !colors[bg]) {
    console.error(`MISSING TOKEN: ${label} needs ${fg} and ${bg}`);
    failed++;
    continue;
  }
  const r = ratio(colors[fg], colors[bg]);
  const ok = r >= floor;
  if (!ok) failed++;
  rows.push(
    `${ok ? "pass" : "FAIL"}  ${label.padEnd(32)} ${colors[fg]} on ${colors[bg]}  ${r.toFixed(2)}:1  (floor ${floor})`,
  );
}

console.log(rows.join("\n"));
console.log(
  `\n${PAIRS.length - failed}/${PAIRS.length} pairs pass across ${Object.keys(colors).length} tokens.`,
);

if (failed) {
  console.error(`\n${failed} pair(s) below floor. Fix DESIGN.md before shipping.`);
  process.exit(1);
}
