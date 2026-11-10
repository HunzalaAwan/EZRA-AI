"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Form controls. Every boundary here uses rule-control, never rule, because
 * WCAG 2.2 1.4.11 requires 3:1 on interactive edges. Errors sit next to the
 * field and name both the problem and the recovery.
 */

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "block text-sm font-medium text-ink select-none",
      "peer-disabled:opacity-45",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

/**
 * Field passes its id and description wiring down through context rather than
 * cloneElement. Cloning looked simpler, but a Server Component passing <Input>
 * into <Field> sends the child across the client boundary already serialized,
 * so the cloned props survived the server render and vanished on hydration.
 * Context crosses that boundary correctly.
 */
interface FieldWiring {
  id: string;
  describedBy?: string;
  invalid: boolean;
}
const FieldContext = React.createContext<FieldWiring | null>(null);

function useFieldWiring() {
  const ctx = React.useContext(FieldContext);
  if (!ctx) return {};
  return {
    id: ctx.id,
    "aria-describedby": ctx.describedBy,
    "aria-invalid": ctx.invalid || undefined,
  };
}

const controlBase = [
  "w-full rounded-sm border bg-surface px-3 text-base text-ink",
  "border-rule-control",
  "placeholder:text-ink-faint",
  "transition-[border-color,box-shadow] duration-150 ease-out-quart",
  "hover:border-ink-faint",
  "focus:border-primary focus:outline-none focus-visible:outline-none",
  "focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-canvas",
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-60",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger",
].join(" ");

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    {...useFieldWiring()}
    className={cn(controlBase, "h-9.5", className)}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    {...useFieldWiring()}
    className={cn(controlBase, "min-h-24 py-2 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    {...useFieldWiring()}
    className={cn(controlBase, "h-9.5 cursor-pointer pr-8", className)}
    {...props}
  />
));
Select.displayName = "Select";

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 ease-out-quart",
      "border-rule-control bg-sunken",
      "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
      "disabled:cursor-not-allowed disabled:opacity-45",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 translate-x-0.5 rounded-full bg-surface shadow-raised transition-transform duration-150 ease-out-quart data-[state=checked]:translate-x-4.5" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

/**
 * Wraps a control with its label, helper text, and error. Helper text sits
 * under the label so it is read before the field, not after the mistake.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {hint ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      <FieldContext.Provider
        value={{
          id: htmlFor,
          describedBy: [hintId, errorId].filter(Boolean).join(" ") || undefined,
          invalid: Boolean(error),
        }}
      >
        {children}
      </FieldContext.Provider>
      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-xs text-danger"
        >
          <WarningCircleIcon className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
