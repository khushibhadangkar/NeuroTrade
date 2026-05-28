"use client";

import { motion } from "framer-motion";

interface NeuralRingsProps {
  phase: "loading" | "complete" | "exit";
}

/**
 * Concentric rotating rings with glowing nodes — represents the
 * neural network processing data. Speeds up on completion.
 */
export function NeuralRings({ phase }: NeuralRingsProps) {
  const isComplete = phase === "complete";

  return (
    <div className="relative h-48 w-48 sm:h-56 sm:w-56">
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-accent-amber/20"
        animate={{ rotate: 360 }}
        transition={{
          duration: isComplete ? 1 : 8,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Nodes on outer ring */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`outer-${i}`}
            className="absolute h-2 w-2 rounded-full bg-accent-amber"
            style={{
              top: `${50 + 48 * Math.sin((i / 8) * Math.PI * 2)}%`,
              left: `${50 + 48 * Math.cos((i / 8) * Math.PI * 2)}%`,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 8px rgba(183,155,98,0.6)",
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Middle ring */}
      <motion.div
        className="absolute inset-6 rounded-full border border-accent-mint/15"
        animate={{ rotate: -360 }}
        transition={{
          duration: isComplete ? 0.8 : 6,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`mid-${i}`}
            className="absolute h-1.5 w-1.5 rounded-full bg-accent-mint"
            style={{
              top: `${50 + 46 * Math.sin((i / 6) * Math.PI * 2)}%`,
              left: `${50 + 46 * Math.cos((i / 6) * Math.PI * 2)}%`,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 6px rgba(127,154,130,0.5)",
            }}
            animate={{
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Inner ring */}
      <motion.div
        className="absolute inset-12 rounded-full border border-accent-cyan/10"
        animate={{ rotate: 360 }}
        transition={{
          duration: isComplete ? 0.5 : 4,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`inner-${i}`}
            className="absolute h-1 w-1 rounded-full bg-accent-cyan"
            style={{
              top: `${50 + 44 * Math.sin((i / 4) * Math.PI * 2)}%`,
              left: `${50 + 44 * Math.cos((i / 4) * Math.PI * 2)}%`,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 4px rgba(122,155,168,0.5)",
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.25,
            }}
          />
        ))}
      </motion.div>

      {/* Center core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          animate={
            isComplete
              ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
              : { scale: [1, 1.1, 1] }
          }
          transition={{
            duration: isComplete ? 0.4 : 3,
            repeat: isComplete ? 2 : Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Core glow */}
          <div
            className="h-12 w-12 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(183,155,98,0.4) 0%, rgba(183,155,98,0.1) 50%, transparent 70%)",
              boxShadow: "0 0 40px rgba(183,155,98,0.3), 0 0 80px rgba(183,155,98,0.1)",
            }}
          />
          {/* Core dot */}
          <div
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-amber"
            style={{ boxShadow: "0 0 12px rgba(183,155,98,0.8)" }}
          />
        </motion.div>
      </div>

      {/* Connection lines (decorative) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 200 200"
      >
        <motion.circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="rgba(183,155,98,0.1)"
          strokeWidth="0.5"
          strokeDasharray="4 8"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "center" }}
        />
      </svg>
    </div>
  );
}
