"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart2,
  Brain,
  Compass,
  Newspaper,
  Sparkles,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
  { message: "DETECTING ASSET CLASS", icon: Compass, end: 800 },
  { message: "FETCHING LIVE MARKET DATA", icon: Activity, end: 2200 },
  { message: "ANALYZING TECHNICAL STRUCTURE", icon: BarChart2, end: 4000 },
  { message: "EVALUATING VOLATILITY & MOMENTUM", icon: Waves, end: 5800 },
  { message: "SCANNING RELEVANT THEMES", icon: Newspaper, end: 7400 },
  { message: "SYNTHESIZING AI INTERPRETATION", icon: Sparkles, end: 9000 },
] as const;

const TOTAL_DURATION = PHASES[PHASES.length - 1].end;

interface ForecastLoaderProps {
  symbol: string;
  startTime?: number;
}

/**
 * Cinematic loader for the universal AI forecast pipeline.
 *
 * Replaces the old LSTM-specific PredictionLoader with messaging that
 * reflects the new intelligence engine flow:
 *   detect → fetch → analyze structure → momentum → themes → synthesize.
 *
 * Sub-second backend response means this overlay typically appears
 * briefly, but the phase animation makes the work feel intentional.
 */
export function ForecastLoader({ symbol, startTime }: ForecastLoaderProps) {
  const [elapsed, setElapsed] = useState(0);
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    const start = startTime ?? Date.now();
    const interval = setInterval(() => {
      const ms = Date.now() - start;
      setElapsed(ms);
      const idx = PHASES.findIndex((p) => ms < p.end);
      setActivePhase(idx === -1 ? PHASES.length - 1 : idx);
    }, 80);

    return () => clearInterval(interval);
  }, [startTime]);

  const current = PHASES[activePhase];
  const Icon = current.icon;
  const progress = Math.min((elapsed / TOTAL_DURATION) * 100, 95);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[70] grid place-items-center bg-surface-950/88 px-5 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label={`Generating intelligence for ${symbol}`}
    >
      <div className="w-full max-w-lg">
        <div className="relative overflow-hidden border border-border/60 bg-surface-900/80 p-8 shadow-panel backdrop-blur-xl">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(183,155,98,0.06), transparent 60%)",
            }}
          />

          {/* Scanning line */}
          <motion.div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(183,155,98,0.6), transparent)",
            }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-amber/30 bg-accent-amber/10"
              >
                <Brain className="h-5 w-5 text-accent-amber" />
              </motion.div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent-amber">
                  AI Intelligence Engine
                </p>
                <p className="text-sm font-medium text-ivory">
                  Generating insights for {symbol}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activePhase}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 flex items-center gap-3"
              >
                <Icon className="h-4 w-4 shrink-0 text-accent-amber" />
                <span className="font-mono text-xs tracking-[0.1em] text-ivory">
                  {current.message}
                </span>
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-accent-amber"
                >
                  _
                </motion.span>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 space-y-2">
              <div className="h-px w-full overflow-hidden bg-surface-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-amber/60 via-accent-amber to-accent-amber/60"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "linear" }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>{(elapsed / 1000).toFixed(1)}s elapsed</span>
                <span className="tabular">{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1.5">
              {PHASES.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-500",
                    i < activePhase
                      ? "bg-accent-amber"
                      : i === activePhase
                      ? "bg-accent-amber/50"
                      : "bg-surface-700"
                  )}
                />
              ))}
            </div>

            <p className="mt-5 text-[10px] leading-relaxed text-muted">
              Combining live market data, technical structure, momentum,
              volatility regime, and asset-specific context.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
