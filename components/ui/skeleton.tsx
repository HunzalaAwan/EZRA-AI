import { cn } from "@/lib/utils";

/**
 * Skeletons are shaped like the content they replace. Never a centered spinner
 * in a content region. Spinners are permitted only inside a pressed button.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("skeleton rounded-sm", className)}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ width: i === lines - 1 ? "62%" : "100%" }}
        />
      ))}
    </div>
  );
}

/** Matches the shape of a StatTile so the dashboard does not jump on load. */
export function SkeletonStat() {
  return (
    <div className="rounded-lg border border-rule bg-surface p-5 shadow-raised">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-8 w-20" />
      <Skeleton className="mt-3 h-3 w-36" />
    </div>
  );
}

/** Matches a table row, including the column rhythm. */
export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-rule px-4 py-3.5">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ flex: i === 0 ? "2 1 0%" : "1 1 0%" }}
        />
      ))}
    </div>
  );
}
