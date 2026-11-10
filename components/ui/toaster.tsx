"use client";

import { Toaster as Sonner } from "sonner";

/** Toasts themed to the front desk world. Floating elevation, quiet radius. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface !border !border-rule !text-ink !shadow-floating !rounded-md !font-sans",
          title: "!text-ink !text-sm !font-medium",
          description: "!text-ink-muted !text-xs",
          actionButton: "!bg-primary !text-on-primary !rounded-sm",
          cancelButton: "!bg-sunken !text-ink-muted !rounded-sm",
          error: "!text-danger",
          success: "!text-success",
        },
      }}
    />
  );
}

export { toast } from "sonner";
