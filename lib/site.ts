/**
 * The site's public address, for link previews, robots, and the sitemap.
 *
 * Set NEXT_PUBLIC_SITE_URL once the real domain is attached. Until then, on
 * Vercel, the production deployment's own address is used, then the preview
 * deployment's, then localhost for development.
 */
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL_ENV === "production" && production) return `https://${production}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

/** Public marketing pages. Everything else is the product app. */
export const MARKETING_ROUTES = [
  "/",
  "/pricing",
  "/product/voice",
  "/product/chat",
  "/product/scheduling",
  "/product/reporting",
] as const;

/** The product app. Fixture data for now, so it stays out of search results. */
export const APP_ROUTES = [
  "/dashboard",
  "/agents",
  "/knowledge",
  "/conversations",
  "/contacts",
  "/automations",
  "/phone",
  "/customize",
  "/numbers",
  "/handoff",
  "/analytics",
  "/integrations",
  "/billing",
  "/settings",
] as const;
