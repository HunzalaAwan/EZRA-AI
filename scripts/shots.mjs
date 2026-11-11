/**
 * Screenshot every route at every breakpoint, light and dark, and report any
 * horizontal overflow. Visual verification is a gate, not a nicety: the
 * contrast script checks color, this checks layout.
 *
 * Usage: node scripts/shots.mjs [--full]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "screenshots";
const FULL = process.argv.includes("--full");
// ROUTES=dashboard,agents limits the run while pages are still landing.
const ONLY = process.env.ROUTES ? new Set(process.env.ROUTES.split(",")) : null;

const ROUTES = [
  // Marketing
  ["home", "/"],
  ["pricing", "/pricing"],
  ["voice", "/product/voice"],
  ["chat", "/product/chat"],
  ["scheduling", "/product/scheduling"],
  ["reporting", "/product/reporting"],
  // Product app
  ["dashboard", "/dashboard"],
  ["agents", "/agents"],
  ["agent-builder", "/agents/ag_frontdesk"],
  ["agent-new", "/agents/new"],
  ["knowledge", "/knowledge"],
  ["automations", "/automations"],
  ["follow-ups", "/automations/follow-ups"],
  ["follow-ups-setup", "/automations/follow-ups?tab=setup"],
  ["reviews", "/automations/reviews"],
  ["reviews-setup", "/automations/reviews?tab=setup"],
  ["emails", "/automations/emails"],
  ["email-editor", "/automations/emails/et_fu_gentle"],
  ["conversations", "/conversations"],
  ["contacts", "/contacts"],
  ["conversation", "/conversations/cv_9474"],
  ["dashboard-performance", "/dashboard?view=performance"],
  ["phone", "/phone"],
  ["integrations", "/integrations"],
  ["billing", "/billing"],
  ["settings", "/settings"],
];

const SIZES = [
  ["mobile", 375, 812],
  ["tablet", 768, 1024],
  ["laptop", 1024, 768],
  ["desktop", 1440, 900],
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const problems = [];

for (const [themeName, theme] of [
  ["light", "light"],
  ["dark", "dark"],
]) {
  for (const [sizeName, width, height] of SIZES) {
    // Only the desktop pass runs in dark, to keep the set reviewable.
    if (theme === "dark" && sizeName !== "desktop") continue;

    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();

    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    for (const [name, route] of ROUTES) {
      if (ONLY && !ONLY.has(name)) continue;
      const url = `${BASE}${route}`;
      let status = 0;
      try {
        const res = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        status = res?.status() ?? 0;
      } catch (e) {
        problems.push(`${name} ${sizeName} ${themeName}: navigation failed, ${e.message}`);
        continue;
      }

      if (status >= 400) {
        problems.push(`${name} ${sizeName} ${themeName}: HTTP ${status}`);
      }

      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-theme", t);
      }, theme);
      await page.evaluate(() =>
        Promise.all(
          [...document.images].map((i) =>
            i.complete ? null : i.decode().catch(() => null),
          ),
        ),
      );
      await page.waitForTimeout(600);

      // Horizontal overflow is a hard fail. Report the widest offender.
      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        if (de.scrollWidth <= de.clientWidth + 1) return null;
        let worst = null;
        for (const el of document.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.right > de.clientWidth + 1 && r.width > 0) {
            const over = r.right - de.clientWidth;
            if (!worst || over > worst.over) {
              worst = {
                over: Math.round(over),
                tag: el.tagName.toLowerCase(),
                cls: String(el.className).slice(0, 90),
              };
            }
          }
        }
        return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, worst };
      });

      if (overflow) {
        problems.push(
          `${name} ${sizeName} ${themeName}: horizontal scroll ${overflow.scrollWidth} > ${overflow.clientWidth}` +
            (overflow.worst
              ? `, worst <${overflow.worst.tag} class="${overflow.worst.cls}"> by ${overflow.worst.over}px`
              : ""),
        );
      }

      await page.screenshot({
        path: `${OUT}/${name}--${sizeName}--${themeName}.png`,
        fullPage: FULL,
      });
    }

    if (errors.length) {
      problems.push(
        `${sizeName} ${themeName}: ${errors.length} console/page error(s): ${errors.slice(0, 3).join(" | ")}`,
      );
    }
    await ctx.close();
  }
}

await browser.close();

console.log(`\nWrote screenshots to ${OUT}/`);
if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log("\nNo overflow, no HTTP errors, no console errors.");
