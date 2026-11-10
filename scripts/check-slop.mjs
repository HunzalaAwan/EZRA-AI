/**
 * Anti-slop gate. Mechanical checks against the don't-list in DESIGN.md.
 *
 * These are the rules a reviewer forgets and a model reintroduces. Each one is
 * cheap to check and expensive to notice by eye, which is exactly what belongs
 * in a script.
 *
 * Usage: npm run check:slop
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["app", "components", "lib"];
const EXTS = new Set([".ts", ".tsx", ".css"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTS.has(extname(full))) out.push(full);
  }
  return out;
}

const RULES = [
  {
    id: "em-dash",
    why: "Em-dash and en-dash are banned everywhere a user can see, including fixture data.",
    re: /[—–]/g,
  },
  {
    id: "raw-tailwind-palette",
    why: "Colors come from the semantic theme. Raw palette classes bypass the token system and break dark mode.",
    re: /\b(?:text|bg|border|ring|fill|stroke|from|to|via)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
  },
  {
    id: "wrong-icon-library",
    why: "Icons are Phosphor, one family project-wide.",
    re: /from\s+["']lucide-react["']|from\s+["']react-icons/g,
  },
  {
    id: "legacy-motion-import",
    why: "Animation imports from motion/react, never the framer-motion alias.",
    re: /from\s+["']framer-motion["']/g,
  },
  {
    id: "h-screen",
    why: "Full-height regions use min-h-dvh. h-screen jumps when the mobile address bar moves.",
    re: /\bh-screen\b/g,
  },
  {
    id: "pure-black",
    why: "Ink is warm. Pure black is never used.",
    re: /#000000\b|#000\b(?!-)/g,
    // In a mask, black is an alpha value meaning "fully opaque", not ink.
    // Same for a scrim, where the colour is the darkness itself.
    // In a mask, black is an alpha value meaning "fully opaque", not ink. A
    // multi-line gradient puts the mask-image key several lines above the
    // colour stop, so look back a few lines rather than one.
    skip: (_f, line, lines, i) => {
      const near = lines.slice(Math.max(0, i - 3), i + 1).join(" ");
      return (
        line.includes("Never #000") ||
        /rgb\(0 0 0/.test(line) ||
        /mask-?image|maskImage/i.test(near)
      );
    },
  },
  {
    id: "gradient-text",
    why: "Emphasis comes from weight or size, never gradient text.",
    re: /bg-clip-text/g,
  },
  {
    id: "placeholder-names",
    why: "Fixture data uses realistic businesses and people. No Acme, no Jane Doe, no 555 numbers.",
    re: /\bAcme\b|\bJohn Doe\b|\bJane Doe\b|\(555\)\s?\d{3}-\d{4}|\b555-01\d{2}\b|\bexample\.com\b/gi,
    // A comment naming the banned term is stating the rule, not breaking it.
    skip: (_f, line) => /^\s*(?:\/\/|\*|\/\*)/.test(line),
  },
  {
    id: "suspiciously-round-stat",
    why: "Fake-perfect numbers are a tell. Use organic figures.",
    re: /\b99\.9{1,2}%|\b100% (?:uptime|accurate|accuracy)/gi,
  },
  {
    id: "internal-vocabulary",
    why: "No model, prompt, token, temperature, webhook, or endpoint vocabulary in user-visible copy.",
    // Only flags these words inside JSX text, not in identifiers or imports.
    re: /(?<=>)[^<>{}]*\b(?:system prompt|LLM|temperature setting|webhook URL|API key)\b[^<>{}]*(?=<)/gi,
  },
];

const files = ROOTS.flatMap((r) => {
  try {
    return walk(r);
  } catch {
    return [];
  }
});

const hits = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  for (const rule of RULES) {
    lines.forEach((line, i) => {
      rule.re.lastIndex = 0;
      const m = rule.re.exec(line);
      if (!m) return;
      if (rule.skip?.(file, line, lines, i)) return;
      hits.push({
        rule: rule.id,
        why: rule.why,
        file,
        line: i + 1,
        match: m[0].trim().slice(0, 70),
      });
    });
  }
}

if (hits.length) {
  const byRule = new Map();
  for (const h of hits) {
    if (!byRule.has(h.rule)) byRule.set(h.rule, []);
    byRule.get(h.rule).push(h);
  }
  for (const [rule, list] of byRule) {
    console.log(`\n${rule}  (${list.length})`);
    console.log(`  ${list[0].why}`);
    for (const h of list.slice(0, 8)) {
      console.log(`    ${h.file}:${h.line}  ${h.match}`);
    }
    if (list.length > 8) console.log(`    and ${list.length - 8} more`);
  }
  console.log(`\n${hits.length} finding(s) across ${files.length} files.`);
  process.exit(1);
}

console.log(
  `Clean. ${RULES.length} rules checked across ${files.length} files.`,
);
