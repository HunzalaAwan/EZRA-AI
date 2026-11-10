"use client";

import { motion } from "motion/react";

/**
 * The smallest possible client leaf: a surface that lifts under the pointer.
 * It owns no content, only the spring, so a Server Component can render
 * everything inside it and hand the result across the boundary.
 */
export function HoverLift({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  /** Lets a card pass its tone down as a CSS variable. */
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
