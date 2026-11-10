import Link from "next/link";
import type { Route } from "next";
import { HoverLift } from "./hover-lift";
import { cn } from "@/lib/utils";

/**
 * A photograph with copy over it.
 *
 * The first version of this dimmed the image and washed it through a scrim
 * mixed from the page background. That reads acceptably on a near-black
 * ground and destroys the photograph on a white one, which is exactly what
 * happened in light mode: the images went to fog.
 *
 * The fix is to stop treating the photo as a background tint. It renders at
 * full strength in both themes, and legibility comes from a dark scrim that
 * is dark in both themes, with light type over it. A photo card therefore
 * looks the same in light and dark, which is correct: the photograph is the
 * content, not a surface.
 *
 * Images are Pexels, downloaded by scripts/fetch-photos.mjs. That licence
 * permits commercial use with no attribution required.
 */
export function PhotoCard({
  src,
  alt,
  title,
  body,
  href,
  className,
  tall,
  tone = "primary",
}: {
  src: string;
  alt: string;
  title: string;
  body?: string;
  href?: Route;
  className?: string;
  tall?: boolean;
  /** Tints the edge glow so a grid of these is not four identical tiles. */
  tone?: "primary" | "accent" | "signal" | "violet";
}) {
  const glow = {
    primary: "group-hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_55%,transparent),0_18px_50px_-18px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]",
    accent: "group-hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-series-2)_55%,transparent),0_18px_50px_-18px_color-mix(in_oklab,var(--color-series-2)_60%,transparent)]",
    signal: "group-hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-signal)_55%,transparent),0_18px_50px_-18px_color-mix(in_oklab,var(--color-signal)_60%,transparent)]",
    violet: "group-hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-series-4)_55%,transparent),0_18px_50px_-18px_color-mix(in_oklab,var(--color-series-4)_60%,transparent)]",
  }[tone];

  const card = (
    <HoverLift
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border border-rule transition-shadow duration-300",
        tall ? "min-h-[26rem]" : "min-h-[19rem]",
        glow,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-out-quart group-hover:scale-[1.05]"
      />
      {/* Legibility scrim. Dark in both themes, because the type over it is
          always light. Two stops so the top of the image stays visible. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-media/95 via-media/55 to-media/10"
      />
      <div className="relative flex h-full flex-col justify-end p-6">
        <h3 className="display-4 text-on-media">{title}</h3>
        {body ? (
          <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-on-media-muted">
            {body}
          </p>
        ) : null}
        {href ? (
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Learn more
            <span
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </span>
        ) : null}
      </div>
    </HoverLift>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full rounded-xl">
        {card}
      </Link>
    );
  }
  return card;
}

/** A number that matters, sized to be read from across the room. */
export function BigStat({
  value,
  label,
  className,
  onDark,
}: {
  value: string;
  label: string;
  className?: string;
  /** Set when the tile sits over the video, which is dark in both themes. */
  onDark?: boolean;
}) {
  return (
    <div className={cn("text-center", className)}>
      {/* Solid, not a gradient. Colour on this page comes from the section
          backgrounds and the photography, never from tinted type. */}
      <p
        data-numeric
        className={cn("display-2", onDark ? "text-on-media-accent" : "text-primary")}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed",
          onDark ? "text-on-media-muted" : "text-ink-muted",
        )}
      >
        {label}
      </p>
    </div>
  );
}
