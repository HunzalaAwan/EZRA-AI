/**
 * Accessibility gate. Axe across every route in both themes, WCAG 2.2 AA.
 * Zero violations is the bar, per PRODUCT.md.
 *
 * Usage: node scripts/a11y.mjs
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const ROUTES = [
  "/",
  "/pricing",
  "/product/voice",
  "/product/chat",
  "/product/scheduling",
  "/product/reporting",
  "/dashboard",
  "/agents",
  "/agents/ag_frontdesk",
  "/agents/ag_frontdesk?section=transfer",
  "/agents/new",
  "/knowledge",
  "/messages",
  "/conversations",
  "/contacts",
  "/conversations/cv_9474",
  "/dashboard?view=performance",
  "/dashboard?view=links",
  "/dashboard?view=patterns",
  "/phone",
  "/customize",
  "/integrations",
  "/integrations?tab=developers",
  "/billing",
  "/settings",
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

let total = 0;
const report = [];

for (const theme of ["light", "dark"]) {
  for (const route of ROUTES) {
    // A 404 page has no violations, so a dead or stale server used to make
    // every route "pass". Refuse to audit anything that did not load.
    const res = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    if (!res || !res.ok()) {
      throw new Error(
        `${route} returned ${res ? res.status() : "no response"}. Is the dev server running this project?`,
      );
    }

    // Measure the resting state, not a frame mid-transition. Flipping the
    // theme starts colour transitions all over the page, and axe sampling one
    // of those in flight reports a blended value that no user ever sees at
    // rest. Zeroing durations makes the audit deterministic.
    await page.addStyleTag({
      content:
        "*,*::before,*::after{transition-duration:0s !important;animation-duration:0s !important;animation-delay:0s !important;}",
    });
    await page.evaluate((t) => {
      document.documentElement.setAttribute("data-theme", t);
    }, theme);
    await page.waitForTimeout(400);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    if (results.violations.length) {
      total += results.violations.length;
      report.push(`\n${route} [${theme}]`);
      for (const v of results.violations) {
        report.push(
          `  ${v.impact ?? "unknown"}: ${v.id} — ${v.help}`.replace(/—/g, "-"),
        );
        for (const n of v.nodes.slice(0, 3)) {
          report.push(`      ${n.target.join(" ")}`);
          const msg = (n.failureSummary ?? "").split("\n")[1];
          if (msg) report.push(`        ${msg.trim()}`);
        }
      }
    }
  }
}

await browser.close();

if (total) {
  console.log(report.join("\n"));
  console.log(`\n${total} violation type(s) across ${ROUTES.length} routes, both themes.`);
  process.exit(1);
}
console.log(
  `No axe violations across ${ROUTES.length} routes in light and dark (WCAG 2.2 AA).`,
);
