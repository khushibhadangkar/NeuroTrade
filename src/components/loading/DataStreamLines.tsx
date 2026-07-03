"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface StreamLine {
  id: number;
  x: string;
  width: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

/**
 * Animated data stream lines — vertical lines that flow downward
 * like data being processed through the system.
 */
export function DataStreamLines() {
  const lines = useMemo<StreamLine[]>(() => {
    const colors = [
      "rgba(183, 155, 98, 0.4)",
      "rgba(183, 155, 98, 0.2)",
      "rgba(127, 154, 130, 0.3)",
      "rgba(122, 155, 168, 0.2)",
      "rgba(244, 239, 229, 0.1)",
    ];

    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: `${5 + Math.random() * 90}%`,
      width: Math.random() > 0.7 ? 2 : 1,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      opacity: 0.1 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden="true">
      {lines.map((line) => (
        <motion.div
          key={line.id}
          className="absolute top-0"
          style={{
            left: line.x,
            width: line.width,
            height: "30%",
            background: `linear-gradient(180deg, transparent, ${line.color}, transparent)`,
          }}
          animate={{
            top: ["-30%", "130%"],
            opacity: [0, line.opacity, line.opacity, 0],
          }}
          transition={{
            duration: line.duration,
            delay: line.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Horizontal data bursts */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute left-0 h-px"
          style={{
            top: `${15 + i * 14}%`,
            width: "40%",
            background:
              "linear-gradient(90deg, transparent, rgba(183,155,98,0.3), transparent)",
          }}
          animate={{
            left: ["-40%", "140%"],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            delay: 1 + i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
