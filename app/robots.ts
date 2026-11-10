import type { MetadataRoute } from "next";
import { APP_ROUTES, SITE_URL } from "@/lib/site";

/**
 * Marketing pages are public. The app runs on fixture data, so it is kept out
 * of search results. Preview deployments are kept out entirely, so a branch
 * URL never competes with the real site.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...APP_ROUTES] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
