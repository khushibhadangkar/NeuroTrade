"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

interface Particle {
  id: number;
  x: string;
  y: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

/**
 * Floating market particles — small glowing dots that drift upward
 * like data points ascending through the atmosphere.
 */
export function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const particles = useMemo<Particle[]>(() => {
    if (!mounted) return [];
    const colors = [
      "rgba(183, 155, 98, 0.6)",
      "rgba(127, 154, 130, 0.5)",
      "rgba(122, 155, 168, 0.4)",
      "rgba(244, 239, 229, 0.3)",
    ];

    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${80 + Math.random() * 30}%`,
      size: Math.random() * 3 + 1,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      opacity: 0.2 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          animate={{
            y: [0, typeof window !== "undefined" ? -window.innerHeight : -800],
            opacity: [0, p.opacity, p.opacity, 0],
            scale: [0.5, 1, 1, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
