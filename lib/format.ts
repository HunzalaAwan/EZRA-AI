/**
 * Formatters. Everything numeric renders in DM Mono with tabular numerals,
 * because these are measurements. Prose never uses the mono face.
 */

/** 187 -> "3:07". 612 -> "10:12". */
export function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** 187 -> "3m 7s". For places where a colon reads as a time of day. */
export function durationWords(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

/** "+15413882014" -> "(541) 388-2014". Leaves anything unexpected alone. */
export function phone(e164: string | null): string {
  if (!e164) return "";
  const d = e164.replace(/\D/g, "");
  const n = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (n.length !== 10) return e164;
  return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
}

/** 4218_00 -> "$4,218". Cents in, dollars out, no trailing zeros. */
export function money(cents: number, opts?: { cents?: boolean }): string {
  const showCents = opts?.cents ?? false;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(cents / 100);
}

export function count(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** 0.847 -> "84.7%". Never rounds to a suspiciously clean number. */
export function percent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** Signed change for a trend. 408 vs 361 -> "+13.0%". */
export function delta(current: number, previous: number): {
  text: string;
  direction: "up" | "down" | "flat";
} {
  if (previous === 0) return { text: "new", direction: "flat" };
  const change = (current - previous) / previous;
  const direction = change > 0.001 ? "up" : change < -0.001 ? "down" : "flat";
  const sign = change > 0 ? "+" : "";
  return { text: `${sign}${(change * 100).toFixed(1)}%`, direction };
}

const RELATIVE_STEPS: [limit: number, divisor: number, unit: Intl.RelativeTimeFormatUnit][] = [
  [60_000, 1_000, "second"],
  [3_600_000, 60_000, "minute"],
  [86_400_000, 3_600_000, "hour"],
  [604_800_000, 86_400_000, "day"],
  [2_629_800_000, 604_800_000, "week"],
  [31_557_600_000, 2_629_800_000, "month"],
];

const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

/** "12 minutes ago". Pass `now` so server and client agree. */
export function relative(iso: string, now: Date): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  for (const [limit, divisor, unit] of RELATIVE_STEPS) {
    if (abs < limit) return rtf.format(Math.round(diff / divisor), unit);
  }
  return rtf.format(Math.round(diff / 31_557_600_000), "year");
}

const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
});

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/Los_Angeles",
});

const DATETIME_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
});

export function time(iso: string): string {
  return TIME_FMT.format(new Date(iso));
}

export function date(iso: string): string {
  return DATE_FMT.format(new Date(iso));
}

export function dateTime(iso: string): string {
  return DATETIME_FMT.format(new Date(iso));
}

/** Short day label for chart axes. "2026-09-18" -> "Fri". */
export function weekday(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

/** 0 -> "12a", 13 -> "1p". Compact hour axis. */
export function hourLabel(hour: number): string {
  const suffix = hour < 12 ? "a" : "p";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

export function initials(name: string): string {
  return name
    .replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
