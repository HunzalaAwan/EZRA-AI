import Link from "next/link";
import type { Route } from "next";
import { HoverLift } from "./hover-lift";
import { cn } from "@/lib/utils";

/**
 * A feature card, and a deliberate Server Component.
 *
 * It takes an icon *component* as a prop, and a component is a function, which
 * cannot cross the React Server Component boundary. So the card itself stays on
 * the server, renders the icon there, and hands the finished markup to a tiny
 * client leaf that owns nothing but the hover spring. Children cross the
 * boundary as already-rendered elements, which is allowed.
 *
 * The alternative, marking every marketing page "use client", would ship the
 * whole page as a bundle to animate one card edge.
 */
export function FeatureCard({
  icon: Icon,
  title,
  body,
  href,
  className,
  tone = 1,
}: {
  /** Which chart hue tints this card. Identity only; text stays ink. */
  tone?: 1 | 2 | 3 | 4;
  icon: React.ComponentType<{
    className?: string;
    weight?: "regular" | "fill";
  }>;
  title: string;
  body: string;
  href?: Route;
  className?: string;
}) {
  const style = { "--tone": `var(--color-series-${tone})` } as React.CSSProperties;
  const card = (
    <HoverLift
      style={style}
      className={cn(
        "group h-full rounded-[1.75rem] bg-[color-mix(in_oklab,var(--tone)_8%,var(--color-surface))] p-7 ring-1 ring-rule transition-shadow duration-300 hover:shadow-[0_22px_48px_-26px_var(--tone)]",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--tone)] text-on-primary shadow-[0_10px_24px_-12px_var(--tone)] light:bg-[color-mix(in_oklab,var(--tone)_80%,black)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="display-4 mt-5 text-ink">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
      {href ? (
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          Learn more
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </span>
      ) : null}
    </HoverLift>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full rounded-lg">
        {card}
      </Link>
    );
  }
  return card;
}
