import type { Metadata, Viewport } from "next";
import { Figtree, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

/**
 * Inter carries the whole interface. It is the product-UI standard for a
 * reason: it holds up at 11px in a dense table and still has presence at 36px
 * with tight tracking. The variable axis lets one file cover every weight.
 *
 * JetBrains Mono is for measurement only: call durations, phone numbers,
 * timestamps, cost. Never for prose, never as a costume for "technical".
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  axes: ["opsz"],
});

/**
 * Figtree carries the display voice: a round geometric sans that holds very
 * tight tracking at very large sizes and stays friendly doing it. It is the
 * open-licence answer to the geometric display faces the reference sites use,
 * which are commercial and cannot be shipped here. Inter keeps every interface
 * label and paragraph, so the site and the product still read as one thing.
 */
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EZRA AI",
    template: "%s · EZRA AI",
  },
  description:
    "Agents that answer your phone and your website chat, book appointments, and hand off when they should.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${figtree.variable} ${jetbrains.variable}`}
    >
      <head>
        {/*
          Runs synchronously as the browser parses the HTML, so a stored theme
          applies before the first paint. Per the Next guide on preventing
          flash before hydration, this stays inline in the layout head rather
          than inside a component, and <html> carries the server default.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("ezra-theme");if(t==="system"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
