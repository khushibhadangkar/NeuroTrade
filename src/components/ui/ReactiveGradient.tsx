"use client";

import { useRef, useCallback, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReactiveGradientProps {
  /** Primary gradient color */
  color?: string;
  /** Secondary gradient color */
  secondaryColor?: string;
  /** Gradient size in pixels */
  size?: number;
  /** Intensity (0-1) */
  intensity?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * ReactiveGradient — a container with a mouse-following gradient
 * background that creates a spotlight/aurora effect.
 */
export function ReactiveGradient({
  color = "rgba(183, 155, 98, 0.12)",
  secondaryColor = "rgba(127, 154, 130, 0.06)",
  size = 500,
  intensity = 1,
  className,
  children,
}: ReactiveGradientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const rawX = useMotionValue(50);
  const rawY = useMotionValue(50);
  const x = useSpring(rawX, { stiffness: 80, damping: 30 });
  const y = useSpring(rawY, { stiffness: 80, damping: 30 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      rawX.set(((e.clientX - rect.left) / rect.width) * 100);
      rawY.set(((e.clientY - rect.top) / rect.height) * 100);
    },
    [rawX, rawY]
  );

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Primary gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity: active ? intensity : 0,
          background: `radial-gradient(${size}px circle at ${x.get()}% ${y.get()}%, ${color}, transparent 60%)`,
        }}
      />

      {/* Secondary offset gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-700"
        style={{
          opacity: active ? intensity * 0.5 : 0,
          background: `radial-gradient(${size * 0.6}px circle at ${100 - x.get()}% ${100 - y.get()}%, ${secondaryColor}, transparent 50%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
