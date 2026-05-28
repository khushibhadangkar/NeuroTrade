"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  /** Glow color (default amber) */
  glowColor?: string;
  /** Enable 3D tilt on hover */
  tilt?: boolean;
  /** Tilt intensity in degrees (default 4) */
  tiltDegrees?: number;
  /** Enable border glow animation */
  borderGlow?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * GlowCard — a glassmorphism panel with:
 * - Mouse-tracking radial glow
 * - Optional 3D perspective tilt
 * - Animated border gradient
 * - Depth shadow on hover
 */
export function GlowCard({
  glowColor = "rgba(183, 155, 98, 0.12)",
  tilt = true,
  tiltDegrees = 4,
  borderGlow = true,
  className,
  children,
  ...props
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [tiltDegrees, -tiltDegrees]), {
    stiffness: 200,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-tiltDegrees, tiltDegrees]), {
    stiffness: 200,
    damping: 30,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setHovered(false);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: tilt ? rotateX : 0,
        rotateY: tilt ? rotateY : 0,
        transformPerspective: 800,
      }}
      className={cn(
        "group relative overflow-hidden rounded-panel border border-border/60",
        "bg-surface-900/40 backdrop-blur-xl transition-shadow duration-500",
        hovered && "shadow-panel border-border-strong",
        className
      )}
    >
      {/* Mouse-tracking glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mouseX.get() * 100}% ${mouseY.get() * 100}%, ${glowColor}, transparent 60%)`,
        }}
      />

      {/* Animated border glow */}
      {borderGlow && (
        <div className="pointer-events-none absolute inset-0 z-0 rounded-panel opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div
            className="absolute inset-[-1px] rounded-panel"
            style={{
              background: `conic-gradient(from 180deg at 50% 50%, transparent 0deg, rgba(183,155,98,0.15) 60deg, transparent 120deg, rgba(127,154,130,0.1) 240deg, transparent 360deg)`,
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "1px",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
