"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  /** Magnetic pull strength (default 0.3) */
  strength?: number;
  /** Glow color on hover */
  glowColor?: string;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
}

/**
 * Magnetic button — follows the cursor within its bounds with spring physics,
 * creating a "pulled toward you" feel. Includes a reactive glow that follows
 * the mouse position within the button.
 */
export function MagneticButton({
  strength = 0.3,
  glowColor = "rgba(183, 155, 98, 0.15)",
  className,
  children,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    x.set(deltaX);
    y.set(deltaY);
    glowX.set(((e.clientX - rect.left) / rect.width) * 100);
    glowY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.97 }}
      className={cn("relative overflow-hidden", className)}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
      type={props.type}
    >
      {/* Reactive glow that follows cursor within the button */}
      {hovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-100 transition-opacity"
          style={{
            background: `radial-gradient(circle at ${glowX.get()}% ${glowY.get()}%, ${glowColor}, transparent 70%)`,
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
