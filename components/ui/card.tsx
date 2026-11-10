import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * On a charcoal ground a panel reads as a physical surface through three
 * things together: a lighter fill, a hairline border, and a 1px top highlight
 * that suggests a light source above. The `edge-light` utility carries the
 * last one. A drop shadow alone just makes a dark rectangle look blurry.
 *
 * Never nest a Card inside a Card.
 */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Soft, offset depth on light; the hairline and edge light carry it
        // on dark, where a shadow would only blur a dark rectangle.
        "rounded-2xl border border-rule bg-surface edge-light",
        "shadow-[0_1px_2px_rgb(10_10_10/0.04),0_14px_34px_-20px_rgb(10_10_10/0.16)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 pt-5 pb-3",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-lg font-semibold leading-snug tracking-[-0.018em] text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-0.5 text-sm text-ink-muted", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t border-rule px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}
