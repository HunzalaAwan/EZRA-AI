"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { SPRING } from "@/components/motion/primitives";
import { cn } from "@/lib/utils";

/**
 * Seven states, all present: default, hover, focus-visible, active, disabled,
 * loading, error (the danger variant).
 *
 * The press is a spring, not a transition, because a press is something the
 * user caused and should feel physical. Colour still moves on a plain ease.
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full font-medium cursor-pointer select-none",
    "transition-[background-color,border-color,color,box-shadow] duration-200 ease-out-quart",
    "disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /* The action is ink on canvas: black on white, white on black. One
           strong button per view, and it never competes with the colour the
           page uses for meaning. */
        primary: [
          "bg-ink text-canvas font-semibold",
          "hover:bg-[color-mix(in_oklab,var(--color-ink)_82%,var(--color-canvas))]",
          "active:scale-[0.98]",
        ].join(" "),
        secondary: [
          "bg-canvas text-ink border border-rule-control/60",
          "hover:border-ink hover:bg-canvas",
          "active:scale-[0.98]",
        ].join(" "),
        ghost: "bg-transparent text-ink-muted hover:bg-raised hover:text-ink",
        danger:
          "bg-danger text-on-signal font-semibold hover:brightness-110 shadow-raised",
        quiet: "bg-transparent text-ink-muted hover:text-ink hover:bg-raised",
      },
      size: {
        sm: "h-8 px-3.5 text-sm [&_svg]:size-4",
        md: "h-10 px-5 text-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-base [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-5",
        "icon-sm": "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild,
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size }), className);
    const body = loading ? (
      <>
        <CircleNotchIcon className="animate-spin" aria-hidden />
        {children}
      </>
    ) : (
      children
    );

    // asChild wraps a Link, which cannot take motion props.
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={classes}
          aria-busy={loading || undefined}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        whileHover={{ y: -1 }}
        whileTap={{ y: 0, scale: 0.97 }}
        transition={SPRING}
        {...props}
      >
        {body}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
