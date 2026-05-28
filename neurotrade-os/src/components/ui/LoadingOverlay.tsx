"use client";

import { motion } from "framer-motion";
import { loadingBar } from "@/lib/motion";

interface LoadingOverlayProps {
  symbols?: string[];
}

/**
 * Full-screen loading overlay shown while the LSTM pipeline runs.
 * Lifted from the existing CRA frontend and upgraded with GSAP-ready
 * structure for future progress streaming.
 */
export function LoadingOverlay({ symbols = [] }: LoadingOverlayProps) {
  const label = symbols.length
    ? symbols.join(", ")
    : "market behavior";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[70] grid place-items-center bg-surface-950/85 px-5 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={`Calculating forecast for ${label}`}
    >
      <div className="w-full max-w-md border border-border bg-surface-900 p-8 shadow-panel">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent-amber">
          Calculating
        </p>
        <h2 className="mt-4 font-display text-3xl leading-tight text-ivory">
          Reading {label}.
        </h2>
        <p className="mt-2 text-sm text-muted">
          Training LSTM model — this takes 30–90 seconds.
        </p>

        {/* Progress bar */}
        <div className="mt-8 h-px overflow-hidden bg-surface-700">
          <motion.div
            className="h-full w-1/2 bg-accent-amber"
            variants={loadingBar}
            animate="animate"
          />
        </div>

        {/* Symbol chips */}
        {symbols.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {symbols.map((s) => (
              <span
                key={s}
                className="rounded-os border border-accent-amber/20 bg-accent-amber/10 px-2 py-0.5 text-xs font-medium text-accent-amber"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
