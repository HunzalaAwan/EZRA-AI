import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Empty states teach the interface. Each one names what goes here, why it is
 * empty, and the single action that fills it. "No data" is not an empty state,
 * so `title` and `body` are both required.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string; weight?: "regular" }>;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-md bg-sunken text-ink-faint">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="mt-1.5 max-w-[46ch] text-sm text-ink-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
