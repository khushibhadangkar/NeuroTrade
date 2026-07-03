"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanningGrid } from "./ScanningGrid";
import { NeuralRings } from "./NeuralRings";
import { DataStreamLines } from "./DataStreamLines";
import { SystemText } from "./SystemText";
import { ProgressArc } from "./ProgressArc";

interface CinematicLoaderProps {
  /** Minimum display time in ms (default 4000) */
  minDuration?: number;
  /** Called when the loader completes */
  onComplete?: () => void;
  /** External loading state — loader stays until this is true AND minDuration elapsed */
  ready?: boolean;
}

const INIT_MESSAGES = [
  { text: "INITIALIZING NEURAL ENGINE", delay: 0 },
  { text: "CONNECTING TO MARKET FEEDS", delay: 800 },
  { text: "PROCESSING GLOBAL DATA STREAMS", delay: 1800 },
  { text: "CALIBRATING LSTM ARCHITECTURE", delay: 2800 },
  { text: "RUNNING PREDICTIVE MODELS", delay: 3600 },
  { text: "SYSTEM READY", delay: 4400 },
];

/**
 * Cinematic fullscreen loading experience.
 *
 * Phases:
 * 1. Grid materializes + rings spin up
 * 2. Data streams flow + system messages type
 * 3. Progress arc fills
 * 4. Final flash + fade out
 */
export function CinematicLoader({
  minDuration = 5000,
  onComplete,
  ready = true,
}: CinematicLoaderProps) {
  const [phase, setPhase] = useState<"loading" | "complete" | "exit">("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / minDuration, 1);
      setProgress(p);

      if (p >= 1 && ready) {
        clearInterval(interval);
        setPhase("complete");
        setTimeout(() => {
          setPhase("exit");
          setTimeout(() => onComplete?.(), 600);
        }, 800);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [minDuration, ready, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-surface-950"
        >
          {/* Background layers */}
          <ScanningGrid />
          <DataStreamLines />

          {/* Center content */}
          <div className="relative z-20 flex flex-col items-center">
            {/* Neural rings */}
            <NeuralRings phase={phase} />

            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 text-center"
            >
              <h1 className="font-display text-3xl font-bold tracking-wide text-ivory sm:text-4xl">
                <span className="text-glow-amber">NEURO</span>
                <span className="text-ivory">TRADE</span>
                <span className="ml-2 text-sm font-normal tracking-[0.3em] text-muted">
                  OS
                </span>
              </h1>
            </motion.div>

            {/* Progress arc */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8"
            >
              <ProgressArc progress={progress} phase={phase} />
            </motion.div>

            {/* System messages */}
            <div className="mt-8 h-20">
              <SystemText messages={INIT_MESSAGES} phase={phase} />
            </div>
          </div>

          {/* Final flash on complete */}
          <AnimatePresence>
            {phase === "complete" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-50 bg-accent-amber"
              />
            )}
          </AnimatePresence>

          {/* Vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(7,7,6,0.7) 100%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
