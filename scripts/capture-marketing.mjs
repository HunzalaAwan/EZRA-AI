/**
 * Captures the real product at 2x for use on the marketing site.
 *
 * The homepage leads with the actual application, the way Calendly leads with
 * its own scheduler. No stock photography, no invented dashboard mockup built
 * from styled divs. What a visitor sees on the homepage is what they get.
 *
 * Needs the dev server running. Writes into public/product/.
 * Usage: node scripts/capture-marketing.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "public/product";

/** [file, route, viewport, theme, optional clip height] */
const SHOTS = [
  ["dashboard-dark", "/dashboard", [1440, 900], "dark"],
  ["dashboard-light", "/dashboard", [1440, 900], "light"],
  ["builder-dark", "/agents/ag_frontdesk", [1440, 900], "dark"],
  ["conversation-dark", "/conversations/cv_9474", [1440, 900], "dark"],
  ["analytics-dark", "/dashboard?view=performance", [1440, 900], "dark"],
  ["create-dark", "/agents/new", [1440, 900], "dark"],
  ["numbers-dark", "/phone", [1440, 900], "dark"],
  ["messages-dark", "/messages", [1440, 900], "dark"],
  ["dashboard-phone", "/dashboard", [390, 844], "dark"],
  ["conversation-phone", "/conversations/cv_9474", [390, 844], "dark"],
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let n = 0;

for (const [name, route, [width, height], theme] of SHOTS) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
    // The dev overlay is not part of the product.
    document
      .querySelectorAll("nextjs-portal, [data-nextjs-toast]")
      .forEach((el) => el.remove());
  }, theme);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  n++;
  console.log(`  ${name}.png  ${width}x${height} @2x  ${theme}`);
}

await browser.close();
console.log(`\nCaptured ${n} product images into ${OUT}/`);
