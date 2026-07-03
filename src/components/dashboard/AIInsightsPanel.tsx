"use client";

import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Activity,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion";

// ─── Mock data ────────────────────────────────────────────────────────────

const INSIGHTS = [
  {
    type: "signal" as const,
    icon: TrendingUp,
    title: "NIFTY Bullish Momentum",
    description: "LSTM predicts upward continuation. Directional accuracy: 58%. Banking sector leading.",
    time: "2m ago",
    accent: "mint",
  },
  {
    type: "alert" as const,
    icon: AlertTriangle,
    title: "BANKNIFTY Volatility Spike",
    description: "Normalized RMSE exceeds 6%. Momentum weakening. Consider hedging positions.",
    time: "5m ago",
    accent: "amber",
  },
  {
    type: "sentiment" as const,
    icon: MessageSquare,
    title: "FII Flow Update",
    description: "Net FII buying ₹2,840 Cr in cash segment. Institutional accumulation in banking.",
    time: "12m ago",
    accent: "cyan",
  },
  {
    type: "signal" as const,
    icon: TrendingDown,
    title: "IT Sector Weakness",
    description: "INFY, TCS showing bearish divergence. Sector rotation toward financials.",
    time: "18m ago",
    accent: "red",
  },
  {
    type: "signal" as const,
    icon: Zap,
    title: "RELIANCE Breakout",
    description: "Volume surge above 20-DMA. Moving averages bullish. OI buildup at ₹2,950 CE.",
    time: "24m ago",
    accent: "mint",
  },
  {
    type: "alert" as const,
    icon: Activity,
    title: "Options Expiry Alert",
    description: "Weekly expiry tomorrow. Max pain at 24,800. Expected range: 24,650–25,050.",
    time: "31m ago",
    accent: "amber",
  },
];

const accentColors = {
  mint: {
    border: "border-accent-mint/20",
    bg: "bg-accent-mint/5",
    icon: "text-accent-mint",
    dot: "bg-accent-mint",
  },
  amber: {
    border: "border-accent-amber/20",
    bg: "bg-accent-amber/5",
    icon: "text-accent-amber",
    dot: "bg-accent-amber",
  },
  cyan: {
    border: "border-accent-cyan/20",
    bg: "bg-accent-cyan/5",
    icon: "text-accent-cyan",
    dot: "bg-accent-cyan",
  },
  red: {
    border: "border-accent-red/20",
    bg: "bg-accent-red/5",
    icon: "text-accent-red",
    dot: "bg-accent-red",
  },
};

/**
 * Right panel — AI insights stream with live signals, sentiment,
 * and volatility alerts. Glassmorphism container with staggered items.
 */
export function AIInsightsPanel() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-panel border border-border/60 bg-surface-900/40 backdrop-blur-xl">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-panel"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(183,155,98,0.04), transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent-amber" />
          <h3 className="text-sm font-semibold text-ivory">AI Insights</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-mint opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-mint" />
          </span>
          <span className="text-[10px] text-accent-mint">Live</span>
        </div>
      </div>

      {/* Insights stream */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex-1 overflow-y-auto p-3 space-y-2"
      >
        {INSIGHTS.map((insight, i) => {
          const Icon = insight.icon;
          const colors = accentColors[insight.accent as keyof typeof accentColors];
          return (
            <motion.div
              key={i}
              variants={staggerItem}
              whileHover={{ scale: 1.01, x: 2 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "group relative overflow-hidden rounded-os border p-3 transition-all duration-300",
                "cursor-pointer hover:bg-surface-800/40",
                colors.border,
                colors.bg
              )}
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 0% 50%, rgba(183,155,98,0.06), transparent 60%)`,
                  }}
                />
              </div>

              <div className="relative flex gap-3">
                <div className={cn("mt-0.5 shrink-0", colors.icon)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-ivory">
                      {insight.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted">{insight.time}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted truncate-2">
                    {insight.description}
                  </p>
                </div>
              </div>

              {/* Bottom accent line */}
              <motion.div
                className={cn("absolute inset-x-0 bottom-0 h-px", colors.bg)}
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: "left" }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Footer stats */}
      <div className="relative z-10 border-t border-border/40 px-4 py-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Signals", value: "12", color: "text-accent-mint" },
            { label: "Alerts", value: "3", color: "text-accent-amber" },
            { label: "Models", value: "8", color: "text-ivory" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className={cn("font-mono text-lg font-medium", stat.color)}>
                {stat.value}
              </p>
              <p className="text-[9px] uppercase tracking-wider text-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
