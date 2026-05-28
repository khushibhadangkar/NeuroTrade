"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ProbabilisticScenario } from "@/lib/indian-market";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface ProbabilityPanelProps {
  scenario: ProbabilisticScenario;
  symbol: string;
}

/**
 * Probabilistic scenario display — shows bullish/bearish/consolidation
 * probabilities as animated bars with percentage labels.
 */
export function ProbabilityPanel({ scenario, symbol }: ProbabilityPanelProps) {
  const scenarios = [
    {
      label: "Bullish Continuation",
      value: scenario.bullish,
      icon: TrendingUp,
      color: "accent-mint",
      barColor: "bg-accent-mint",
      bgColor: "bg-accent-mint/10",
    },
    {
      label: "Range-Bound / Consolidation",
      value: scenario.consolidation,
      icon: Minus,
      color: "accent-amber",
      barColor: "bg-accent-amber",
      bgColor: "bg-accent-amber/10",
    },
    {
      label: "Bearish Reversal",
      value: scenario.bearish,
      icon: TrendingDown,
      color: "accent-red",
      barColor: "bg-accent-red",
      bgColor: "bg-accent-red/10",
    },
  ];

  const dominant = scenarios.reduce((a, b) => (a.value > b.value ? a : b));

  return (
    <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
            Probabilistic Outlook
          </p>
          <p className="mt-1 text-xs text-muted">
            {symbol} · 30-day scenario analysis
          </p>
        </div>
        <div
          className={cn(
            "rounded-os border px-2.5 py-1 text-[10px] font-semibold",
            `border-${dominant.color}/30 bg-${dominant.color}/10 text-${dominant.color}`
          )}
          style={{
            borderColor: `var(--color-${dominant.color.replace("accent-", "accent-")})`,
          }}
        >
          {dominant.label.split(" ")[0]} Bias
        </div>
      </div>

      {/* Probability bars */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {scenarios.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} variants={staggerItem}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", `text-${s.color}`)} />
                  <span className="text-xs text-muted">{s.label}</span>
                </div>
                <span className={cn("font-mono text-sm font-bold tabular", `text-${s.color}`)}>
                  {s.value}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-700">
                <motion.div
                  className={cn("h-full rounded-full", s.barColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.value}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Disclaimer */}
      <p className="mt-4 text-[9px] text-muted/60 leading-relaxed">
        Probabilities derived from LSTM directional accuracy, trend signals, and volatility metrics.
        Not investment advice.
      </p>
    </div>
  );
}
