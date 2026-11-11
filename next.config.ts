import type { NextConfig } from "next";

/**
 * Safe defaults for every response. No Content-Security-Policy yet: the theme
 * script is inline in the layout head on purpose, and a CSP would need a nonce
 * for it first.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  async redirects() {
    // The section was called Messages until it grew follow-ups and reviews.
    return [
      { source: "/messages", destination: "/automations", permanent: true },
      { source: "/messages/:path*", destination: "/automations/:path*", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
