"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PulseRingProps {
  /** Color of the pulse */
  color?: "amber" | "mint" | "red" | "cyan";
  /** Size of the center dot */
  size?: "sm" | "md" | "lg";
  /** Whether to show the pulse animation */
  active?: boolean;
  className?: string;
}

const colorMap = {
  amber: { ring: "bg-accent-amber", dot: "bg-accent-amber" },
  mint: { ring: "bg-accent-mint", dot: "bg-accent-mint" },
  red: { ring: "bg-accent-red", dot: "bg-accent-red" },
  cyan: { ring: "bg-accent-cyan", dot: "bg-accent-cyan" },
};

const sizeMap = {
  sm: { dot: "h-1.5 w-1.5", ring: "h-1.5 w-1.5" },
  md: { dot: "h-2 w-2", ring: "h-2 w-2" },
  lg: { dot: "h-3 w-3", ring: "h-3 w-3" },
};

/**
 * PulseRing — animated status indicator with expanding ring.
 * Used for live status, active connections, and alert states.
 */
export function PulseRing({
  color = "mint",
  size = "sm",
  active = true,
  className,
}: PulseRingProps) {
  const colors = colorMap[color];
  const sizes = sizeMap[size];

  return (
    <span className={cn("relative inline-flex", className)}>
      {active && (
        <motion.span
          className={cn(
            "absolute inline-flex rounded-full opacity-60",
            colors.ring,
            sizes.ring
          )}
          animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span
        className={cn("relative inline-flex rounded-full", colors.dot, sizes.dot)}
      />
    </span>
  );
}
