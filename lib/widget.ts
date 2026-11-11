import type { WidgetSettings } from "@/lib/api/types";

/**
 * Everything about the website widget that is not a React component: the
 * palettes, the readability maths, and the install snippet. Server-safe.
 *
 * The widget wears the business's colours, not EZRA's, so its colours are
 * data. What is fixed is that text on the brand colour is always chosen for
 * contrast: a business can pick a pale yellow and its buttons stay readable.
 */

export const PALETTES = [
  { name: "Lagoon", hex: "#0f766e" },
  { name: "Violet", hex: "#6d28d9" },
  { name: "Ocean", hex: "#0369a1" },
  { name: "Forest", hex: "#15803d" },
  { name: "Coral", hex: "#e0573f" },
  { name: "Berry", hex: "#be185d" },
  { name: "Midnight", hex: "#1e293b" },
  { name: "Sunshine", hex: "#f5b301" },
] as const;

export const HEX = /^#[0-9a-f]{6}$/i;

function lin(c: number) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** WCAG contrast ratio between two #rrggbb colours. */
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** White or near-black, whichever reads better on the colour. */
export function inkOn(hex: string) {
  return contrast(hex, "#ffffff") >= contrast(hex, "#0a0a0a") ? "#ffffff" : "#0a0a0a";
}

/** The widget's own surfaces, by theme. Fixed, so only the accent varies. */
export const WIDGET_THEME = {
  light: { bg: "#ffffff", surface: "#f4f4f6", ink: "#0a0a0a", muted: "#55555c", line: "#e4e4e9" },
  dark: { bg: "#17171b", surface: "#24242a", ink: "#f4f4f5", muted: "#a5a5ae", line: "#33333a" },
} as const;

export const RADIUS = { sharp: 6, soft: 16, round: 26 } as const;

export const FONT = {
  modern: "var(--font-inter), system-ui, sans-serif",
  friendly: "var(--font-figtree), var(--font-inter), sans-serif",
  classic: "Georgia, 'Times New Roman', serif",
} as const;

export const LAUNCHER_PX = { sm: 48, md: 56, lg: 64 } as const;

/** Two letters from the assistant's name, for the initials launcher. */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "EZ";
  return (parts.length > 1 ? parts[0]![0]! + parts[1]![0]! : parts[0]!.slice(0, 2)).toUpperCase();
}

/**
 * Where the widget loads from. A placeholder until the backend names its host;
 * it only appears on the Install tab.
 */
export const WIDGET_SCRIPT = "https://widget.ezra.ai/v1/loader.js";

/** The snippet a business pastes before </body>. Only the workspace id is required. */
export function installSnippet(workspaceId: string, s: WidgetSettings) {
  return `<script
  src="${WIDGET_SCRIPT}"
  data-workspace="${workspaceId}"
  data-accent="${s.accent}"
  data-position="${s.launcher.position}"
  async
></script>`;
}
