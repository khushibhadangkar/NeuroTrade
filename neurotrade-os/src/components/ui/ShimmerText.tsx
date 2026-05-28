"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerTextProps {
  text: string;
  /** Animation duration in seconds */
  duration?: number;
  className?: string;
}

/**
 * ShimmerText — text with a sweeping highlight animation.
 * Used for loading states and premium label effects.
 */
export function ShimmerText({ text, duration = 2.5, className }: ShimmerTextProps) {
  return (
    <span className={cn("relative inline-block overflow-hidden", className)}>
      <span className="relative">
        {text}
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
          style={{ WebkitBackgroundClip: "text" }}
        />
      </span>
    </span>
  );
}
