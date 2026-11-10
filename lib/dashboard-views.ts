/**
 * The dashboard's views, in a server-safe module.
 *
 * This lives outside components/app/dashboard-views.tsx because that file is
 * "use client", and a Server Component importing a value from a client module
 * receives a client reference rather than the value. The page read
 * `VIEWS.includes` off that reference and crashed with a 500. Same lesson as
 * lib/labels.ts.
 */
export const VIEWS = ["overview", "performance", "links", "patterns"] as const;
export type View = (typeof VIEWS)[number];

export function toView(value: string | undefined): View {
  return (VIEWS as readonly string[]).includes(value ?? "")
    ? (value as View)
    : "overview";
}
