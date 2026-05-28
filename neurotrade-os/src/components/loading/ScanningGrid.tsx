"use client";

import { motion } from "framer-motion";

/**
 * Animated scanning grid background — perspective grid with
 * a sweeping scanline and pulsing intersections.
 */
export function ScanningGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Perspective grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(244,239,229,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,229,0.12) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          perspective: "800px",
          transform: "rotateX(45deg) scale(2.5)",
          transformOrigin: "center 120%",
        }}
      />

      {/* Flat overlay grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(183,155,98,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(183,155,98,0.2) 1px, transparent 1px)",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Horizontal scanline */}
      <motion.div
        className="absolute inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(183,155,98,0.4), rgba(183,155,98,0.8), rgba(183,155,98,0.4), transparent)",
          boxShadow: "0 0 20px rgba(183,155,98,0.3), 0 0 60px rgba(183,155,98,0.1)",
        }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Vertical scanline */}
      <motion.div
        className="absolute inset-y-0 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(127,154,130,0.3), rgba(127,154,130,0.6), rgba(127,154,130,0.3), transparent)",
          boxShadow: "0 0 15px rgba(127,154,130,0.2)",
        }}
        animate={{ left: ["0%", "100%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1 }}
      />

      {/* Radial pulse from center */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-amber/20"
        animate={{
          width: [0, 800],
          height: [0, 800],
          opacity: [0.4, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-mint/15"
        animate={{
          width: [0, 600],
          height: [0, 600],
          opacity: [0.3, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
      />

      {/* Corner accents */}
      {[
        "top-0 left-0",
        "top-0 right-0 rotate-90",
        "bottom-0 right-0 rotate-180",
        "bottom-0 left-0 -rotate-90",
      ].map((pos, i) => (
        <motion.div
          key={i}
          className={`absolute ${pos}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.3] }}
          transition={{ delay: 0.5 + i * 0.2, duration: 1.5 }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <path
              d="M0 20V0H20"
              stroke="rgba(183,155,98,0.4)"
              strokeWidth="1"
            />
            <path
              d="M0 10V0H10"
              stroke="rgba(183,155,98,0.6)"
              strokeWidth="1.5"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
