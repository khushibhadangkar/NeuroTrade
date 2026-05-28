"use client";

import { motion } from "framer-motion";

interface ProgressArcProps {
  progress: number; // 0 to 1
  phase: "loading" | "complete" | "exit";
}

/**
 * Circular progress arc with percentage display.
 * Fills smoothly as the system initializes.
 */
export function ProgressArc({ progress, phase }: ProgressArcProps) {
  const size = 80;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const isComplete = phase === "complete";

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(244, 239, 229, 0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isComplete ? "rgba(127, 154, 130, 0.9)" : "rgba(183, 155, 98, 0.8)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: isComplete
              ? "drop-shadow(0 0 6px rgba(127,154,130,0.5))"
              : "drop-shadow(0 0 6px rgba(183,155,98,0.4))",
          }}
        />
      </svg>

      {/* Center percentage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className={`font-mono text-sm font-medium tabular ${
            isComplete ? "text-accent-mint" : "text-accent-amber"
          }`}
          animate={isComplete ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {Math.round(progress * 100)}%
        </motion.span>
      </div>
    </div>
  );
}
