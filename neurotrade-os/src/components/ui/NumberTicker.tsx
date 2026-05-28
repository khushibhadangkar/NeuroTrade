"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  /** Target value to animate to */
  value: number;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix (e.g. "$") */
  prefix?: string;
  /** Suffix (e.g. "%") */
  suffix?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** CSS class */
  className?: string;
}

/**
 * NumberTicker — animates a number from 0 (or previous value) to the target.
 * Used for metrics, prices, and confidence scores.
 */
export function NumberTicker({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  duration = 1.2,
  className,
}: NumberTickerProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) =>
    `${prefix}${v.toFixed(decimals)}${suffix}`
  );
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  // Update DOM directly for performance (avoids re-renders)
  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <motion.span
      ref={ref}
      className={cn("tabular", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {prefix}0{suffix}
    </motion.span>
  );
}
