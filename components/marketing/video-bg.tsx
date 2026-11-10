"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A looping video background.
 *
 * A background video is easy to ship badly, so this is deliberate about five
 * things:
 *
 *   It never plays for anyone who asked for reduced motion. The poster frame
 *   stands in, and the section still reads exactly the same.
 *
 *   It never plays on a metered or slow connection, or when the browser says
 *   the user wants to save data. The Network Information API is not
 *   universally supported, so this treats its absence as "go ahead" and its
 *   presence as authoritative.
 *
 *   It only starts once the section is actually near the viewport, and it
 *   pauses the moment it leaves. Decoding video for a section nobody is
 *   looking at is pure waste of battery.
 *
 *   It is muted, inline and loops, which is what browsers require before they
 *   will autoplay anything at all. autoPlay is deliberately NOT set: the play
 *   call is made from the observer instead, so the decision stays in one place.
 *
 *   The poster carries the look on its own, so a failed or blocked video is
 *   invisible rather than a black hole in the page.
 *
 * The video is decoration. It is hidden from assistive technology, and nothing
 * it shows is information the copy does not already carry.
 */
export function VideoBackground({
  src,
  poster,
  className,
  /** 0 to 1. The video sits under a scrim, so it is never full strength. */
  opacity = 0.55,
}: {
  src: string;
  poster: string;
  className?: string;
  opacity?: number;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Respect an explicit data-saver signal or a genuinely slow connection.
    const conn = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          // A rejected play promise is normal, not an error: a browser may
          // simply decline. The poster is already showing, so there is
          // nothing to recover from.
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
        className="size-full object-cover"
        style={{ opacity }}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
