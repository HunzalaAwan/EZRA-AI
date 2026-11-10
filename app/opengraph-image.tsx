import { ImageResponse } from "next/og";

/**
 * The card a shared link shows. The homepage headline on the dark stage, with
 * the mark, in the brand's violet. Generated at build time, so nothing extra
 * ships to the browser.
 */
export const alt = "EZRA AI. Never miss another call.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(120% 90% at 50% 120%, #4c1d95 0%, #140b2e 55%, #0a0a0a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6D28D9" />
            <path
              d="M8.5 17.5c0-4.14 2.46-7 5.5-7s5.5 2.86 5.5 7"
              stroke="#FFFFFF"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <circle cx="14" cy="20.2" r="1.6" fill="#FFFFFF" />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>EZRA</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 96, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>
            <span>Never miss another&nbsp;</span>
            <span style={{ color: "#c4b5fd" }}>call.</span>
          </div>
          <div style={{ fontSize: 34, color: "#d6d3e8", maxWidth: 900, lineHeight: 1.35 }}>
            Agents that answer your phone and your website chat, and book the appointment.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
