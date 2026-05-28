"use client";

import { motion } from "framer-motion";
import { Activity, TrendingUp, Zap, Users } from "lucide-react";
import type { MarketBias } from "@/lib/indian-market";
import { cn } from "@/lib/utils";

interface MarketBiasCardProps {
  bias: MarketBias;
  symbol: string;
}

const DIRECTION_CONFIG = {
  "Strongly Bullish": { color: "text-accent-mint", bg: "bg-accent-mint/10", border: "border-accent-mint/30" },
  "Moderately Bullish": { color: "text-accent-mint", bg: "bg-accent-mint/5", border: "border-accent-mint/20" },
  "Neutral": { color: "text-muted", bg: "bg-surface-800", border: "border-border" },
  "Moderately Bearish": { color: "text-accent-red", bg: "bg-accent-red/5", border: "border-accent-red/20" },
  "Strongly Bearish": { color: "text-accent-red", bg: "bg-accent-red/10", border: "border-accent-red/30" },
};

const VOLATILITY_CONFIG = {
  "Low": { color: "text-accent-mint", label: "Low Vol" },
  "Moderate": { color: "text-accent-amber", label: "Moderate Vol" },
  "High": { color: "text-accent-red", label: "High Vol" },
  "Extreme": { color: "text-accent-red", label: "Extreme Vol" },
};

/**
 * Market Bias Card — displays directional sentiment, volatility status,
 * momentum analysis, and institutional flow in a compact glassmorphism card.
 */
export function MarketBiasCard({ bias, symbol }: MarketBiasCardProps) {
  const dirConfig = DIRECTION_CONFIG[bias.direction];
  const volConfig = VOLATILITY_CONFIG[bias.volatility];

  const metrics = [
    { icon: TrendingUp, label: "Direction", value: bias.direction, color: dirConfig.color },
    { icon: Activity, label: "Volatility", value: bias.volatility, color: volConfig.color },
    { icon: Zap, label: "Momentum", value: bias.momentum, color: "text-accent-amber" },
    { icon: Users, label: "Flow", value: bias.flow, color: "text-accent-cyan" },
  ];

  return (
    <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
            Market Bias
          </p>
          <p className="mt-1 text-xs text-muted">{symbol} · Current session</p>
        </div>
        <div className={cn("rounded-os border px-3 py-1.5 text-xs font-semibold", dirConfig.border, dirConfig.bg, dirConfig.color)}>
          {bias.direction}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-os border border-border/40 bg-surface-950/60 p-3"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={cn("h-3 w-3", m.color)} />
                <span className="text-[9px] uppercase tracking-wider text-muted">{m.label}</span>
              </div>
              <p className={cn("text-xs font-semibold", m.color)}>{m.value}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
