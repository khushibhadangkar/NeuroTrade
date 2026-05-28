"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonPulseProps {
  className?: string;
  /** Variant determines the visual style */
  variant?: "default" | "glow" | "wave";
  /** Optional inline style */
  style?: React.CSSProperties;
}

/**
 * SkeletonPulse — premium loading skeleton with multiple animation styles.
 *
 * Variants:
 * - default: standard shimmer sweep
 * - glow: pulsing opacity with amber tint
 * - wave: cascading wave effect
 */
export function SkeletonPulse({
  className,
  variant = "default",
  style,
}: SkeletonPulseProps) {
  if (variant === "glow") {
    return (
      <motion.div
        className={cn("rounded-os bg-surface-800", className)}
        style={style}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          boxShadow: [
            "0 0 0 rgba(183,155,98,0)",
            "0 0 12px rgba(183,155,98,0.08)",
            "0 0 0 rgba(183,155,98,0)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  if (variant === "wave") {
    return (
      <div className={cn("relative overflow-hidden rounded-os bg-surface-800", className)} style={style}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-700/50 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
        />
      </div>
    );
  }

  // Default shimmer
  return (
    <div className={cn("relative overflow-hidden rounded-os bg-surface-800", className)} style={style}>
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(244,239,229,0.04), transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
        transition={{ duration: 2.3, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/**
 * Pre-composed skeleton layouts for common patterns.
 */
export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonPulse variant="glow" className="h-8 w-24" />
        <SkeletonPulse variant="glow" className="h-5 w-16" />
      </div>
      <SkeletonPulse variant="wave" className="w-full" style={{ height }} />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-12 flex-1" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="space-y-2">
      <SkeletonPulse className="h-3 w-16" />
      <SkeletonPulse variant="glow" className="h-7 w-28" />
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
        >
          <SkeletonPulse className="h-10 w-full" />
        </motion.div>
      ))}
    </div>
  );
}
