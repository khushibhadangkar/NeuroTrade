"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HoverExpandProps {
  /** Expand direction */
  direction?: "up" | "down" | "scale";
  /** Expand amount in pixels (for up/down) or scale factor */
  amount?: number;
  /** Shadow on hover */
  shadow?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * HoverExpand — wraps any element with a smooth lift/scale on hover.
 * Creates depth by adding dynamic shadow and subtle translation.
 */
export function HoverExpand({
  direction = "up",
  amount = 4,
  shadow = true,
  className,
  children,
}: HoverExpandProps) {
  const variants = {
    rest: {
      y: 0,
      scale: 1,
      boxShadow: "0 0 0 rgba(0,0,0,0)",
    },
    hover: {
      y: direction === "up" ? -amount : direction === "down" ? amount : 0,
      scale: direction === "scale" ? 1 + amount / 100 : 1,
      boxShadow: shadow
        ? "0 12px 40px rgba(0,0,0,0.3), 0 0 20px rgba(183,155,98,0.08)"
        : "0 0 0 rgba(0,0,0,0)",
    },
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={variants}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
