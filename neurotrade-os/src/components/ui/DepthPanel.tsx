"use client";

import { useRef, useCallback, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface DepthPanelProps {
  /** Parallax depth factor (default 0.02) */
  depth?: number;
  /** Enable subtle float animation */
  float?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * DepthPanel — a panel that responds to mouse position with subtle
 * parallax movement, creating a layered 3D depth effect.
 * Combines with a gentle floating animation for an "alive" feel.
 */
export function DepthPanel({
  depth = 0.02,
  float = true,
  className,
  children,
}: DepthPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const translateX = useTransform(springX, (v) => v * depth * 20);
  const translateY = useTransform(springY, (v) => v * depth * 20);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: translateX, y: translateY }}
      animate={
        float
          ? { y: [0, -3, 0] }
          : undefined
      }
      transition={
        float
          ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
