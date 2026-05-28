"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/finance";
import { staggerContainer, staggerItem } from "@/lib/motion";

// ─── Mock data ────────────────────────────────────────────────────────────

const SECTORS = [
  { name: "Banking", change: 1.42, symbols: ["HDFC", "ICICI", "SBI"] },
  { name: "IT", change: -0.68, symbols: ["INFY", "TCS", "WIPRO"] },
  { name: "FMCG", change: 0.34, symbols: ["HUL", "ITC", "NESTLE"] },
  { name: "Pharma", change: 0.87, symbols: ["SUN", "DRREDDY", "CIPLA"] },
  { name: "Auto", change: -0.45, symbols: ["MARUTI", "TATA", "M&M"] },
];

const TOP_MOVERS = [
  { symbol: "HDFCBANK", price: 1685.4, change: 1.42 },
  { symbol: "ICICIBANK", price: 1298.6, change: 1.87 },
  { symbol: "RELIANCE", price: 2945.8, change: -0.34 },
  { symbol: "INFY", price: 1542.7, change: 0.91 },
  { symbol: "TCS", price: 3890.2, change: 0.56 },
  { symbol: "SBIN", price: 842.3, change: -0.62 },
  { symbol: "BHARTIARTL", price: 1720.5, change: 0.44 },
  { symbol: "BAJFINANCE", price: 7245.8, change: 2.14 },
];

/**
 * Bottom section — market heatmap, top movers, and sector performance.
 * Glassmorphism container with animated cells.
 */
export function MarketHeatmap() {
  return (
    <div className="relative flex h-full gap-3 overflow-hidden">
      {/* Sector heatmap */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-1 flex-col overflow-hidden rounded-panel border border-border/60 bg-surface-900/40 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
          <h3 className="text-xs font-semibold text-ivory">Sector Performance</h3>
          <span className="text-[10px] text-muted">Today</span>
        </div>

        {/* Heatmap grid */}
        <div className="flex flex-1 items-stretch gap-1 p-2">
          {SECTORS.map((sector, i) => {
            const intensity = Math.min(Math.abs(sector.change) / 2, 1);
            const isPositive = sector.change >= 0;
            return (
              <motion.div
                key={sector.name}
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -2 }}
                className={cn(
                  "group relative flex flex-1 flex-col items-center justify-center rounded-os border transition-all duration-300",
                  "cursor-pointer overflow-hidden",
                  isPositive
                    ? "border-accent-mint/20 hover:border-accent-mint/40"
                    : "border-accent-red/20 hover:border-accent-red/40"
                )}
                style={{
                  background: isPositive
                    ? `rgba(127, 154, 130, ${intensity * 0.15})`
                    : `rgba(192, 97, 74, ${intensity * 0.15})`,
                }}
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: isPositive
                      ? "radial-gradient(circle, rgba(127,154,130,0.12), transparent 70%)"
                      : "radial-gradient(circle, rgba(192,97,74,0.12), transparent 70%)",
                  }}
                />

                <span className="relative text-[10px] font-medium text-ivory">
                  {sector.name}
                </span>
                <span
                  className={cn(
                    "relative mt-1 font-mono text-sm font-semibold tabular",
                    isPositive ? "text-accent-mint" : "text-accent-red"
                  )}
                >
                  {formatPercent(sector.change)}
                </span>
                <span className="relative mt-0.5 text-[9px] text-muted">
                  {sector.symbols.join(" · ")}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Top movers */}
      <div className="w-72 shrink-0 overflow-hidden rounded-panel border border-border/60 bg-surface-900/40 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
          <h3 className="text-xs font-semibold text-ivory">Top Movers</h3>
          <span className="text-[10px] text-accent-amber">8 active</span>
        </div>

        {/* Movers list */}
        <div className="overflow-y-auto p-2">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-0.5"
          >
            {TOP_MOVERS.map((mover) => (
              <motion.div
                key={mover.symbol}
                variants={staggerItem}
                whileHover={{ x: 3 }}
                className="group flex items-center justify-between rounded-os px-3 py-1.5 transition-colors hover:bg-surface-800/40"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      mover.change >= 0 ? "bg-accent-mint" : "bg-accent-red"
                    )}
                  />
                  <span className="text-xs font-semibold text-ivory">
                    {mover.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs tabular">
                  <span className="text-muted">${mover.price}</span>
                  <span
                    className={cn(
                      "w-14 text-right font-medium",
                      mover.change >= 0 ? "text-accent-mint" : "text-accent-red"
                    )}
                  >
                    {formatPercent(mover.change)}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
