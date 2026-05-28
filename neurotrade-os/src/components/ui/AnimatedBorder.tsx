"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBorderProps {
  /** Duration of one full rotation in seconds */
  duration?: number;
  /** Border width in pixels */
  width?: number;
  /** Gradient colors */
  colors?: [string, string, string];
  /** Border radius class */
  radius?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * AnimatedBorder — a rotating conic gradient border that creates
 * a premium "scanning" effect around any container.
 */
export function AnimatedBorder({
  duration = 4,
  width = 1,
  colors = ["rgba(183,155,98,0.6)", "rgba(127,154,130,0.3)", "transparent"],
  radius = "rounded-panel",
  className,
  children,
}: AnimatedBorderProps) {
  return (
    <div className={cn("relative", radius, className)}>
      {/* Rotating gradient border */}
      <motion.div
        className={cn("absolute inset-0", radius)}
        style={{
          padding: width,
          background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[2]}, ${colors[1]}, ${colors[0]})`,
          mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      />

      {/* Content */}
      <div className={cn("relative", radius, "overflow-hidden")}>
        {children}
      </div>
    </div>
  );
}
