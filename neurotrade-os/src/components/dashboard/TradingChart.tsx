"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Brain, TrendingUp, Clock, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/finance";
import { formatINR } from "@/lib/indian-market";
import { chartTheme } from "@/lib/tokens";

// Simulated price data for the chart
function generateChartData() {
  const data = [];
  let price = 24750;
  let predicted = 24800;
  const now = Date.now();

  for (let i = 0; i < 60; i++) {
    price += (Math.random() - 0.48) * 80;
    predicted += (Math.random() - 0.45) * 70;
    const isPrediction = i > 44;

    data.push({
      time: new Date(now - (60 - i) * 86400000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      actual: isPrediction ? null : Math.round(price * 100) / 100,
      predicted: i > 40 ? Math.round(predicted * 100) / 100 : null,
      volume: Math.floor(Math.random() * 50 + 20),
    });
  }
  return data;
}

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y"] as const;

/**
 * Massive trading chart with AI prediction overlay.
 * Glassmorphism container with floating metric badges.
 */
export function TradingChart() {
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]>("1M");
  const data = useMemo(generateChartData, []);

  const latestActual = data.filter((d) => d.actual !== null).pop()?.actual ?? 0;
  const latestPredicted = data.filter((d) => d.predicted !== null).pop()?.predicted ?? 0;
  const change = ((latestPredicted - latestActual) / latestActual) * 100;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-panel border border-border/60 bg-surface-900/40 backdrop-blur-xl">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-panel"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(183,155,98,0.04), transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/40 px-5 py-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl text-ivory">NIFTY 50</h2>
              <span className="rounded-sm bg-accent-amber/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-amber">
                AI
              </span>
            </div>
            <p className="text-xs text-muted">NSE Index · ^NSEI</p>
          </div>

          {/* Price */}
          <div className="ml-6 border-l border-border/40 pl-6">
            <p className="font-mono text-xl font-medium tabular text-ivory">
              {formatINR(latestActual)}
            </p>
            <p
              className={cn(
                "text-xs font-medium tabular",
                change >= 0 ? "text-accent-mint" : "text-accent-red"
              )}
            >
              {formatPercent(change)} predicted
            </p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 rounded-os border border-border/40 bg-surface-950/60 p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "rounded-os px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber",
                tf === timeframe
                  ? "bg-accent-amber/15 text-accent-amber"
                  : "text-muted hover:text-ivory"
              )}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="rounded-os p-2 text-muted transition hover:bg-surface-800/60 hover:text-ivory">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating confidence badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-6 top-20 z-20 rounded-panel border border-accent-amber/20 bg-surface-900/80 px-4 py-3 backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent-amber" />
          <span className="text-[10px] uppercase tracking-wider text-muted">
            AI Confidence
          </span>
        </div>
        <p className="mt-1 font-mono text-2xl font-medium text-accent-amber">67%</p>
        <p className="text-[10px] text-muted">Bullish · 30d window</p>
      </motion.div>

      {/* Chart */}
      <div className="relative z-10 flex-1 px-2 pb-2 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(156,149,136,0.2)" />
                <stop offset="100%" stopColor="rgba(156,149,136,0)" />
              </linearGradient>
              <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(183,155,98,0.25)" />
                <stop offset="100%" stopColor="rgba(183,155,98,0)" />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="rgba(244,239,229,0.04)"
              vertical={false}
              strokeDasharray="0"
            />
            <XAxis
              dataKey="time"
              tick={{ fill: chartTheme.text, fontSize: 10 }}
              axisLine={{ stroke: "rgba(244,239,229,0.08)" }}
              tickLine={false}
              minTickGap={50}
            />
            <YAxis
              tick={{ fill: chartTheme.text, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={50}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(13,12,11,0.95)",
                border: "1px solid rgba(244,239,229,0.14)",
                borderRadius: "4px",
                color: "#f4efe5",
                boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#b79b62" }}
              formatter={(value: number, name: string) => [
                formatINR(value),
                name === "actual" ? "Historical" : "AI Forecast",
              ]}
            />
            {/* Prediction zone indicator */}
            <ReferenceLine
              x={data[44]?.time}
              stroke="rgba(183,155,98,0.3)"
              strokeDasharray="4 4"
              label={{
                value: "AI Zone",
                position: "top",
                fill: "#b79b62",
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="rgba(156,149,136,0.7)"
              strokeWidth={1.5}
              fill="url(#actualGradient)"
              dot={false}
              animationDuration={1200}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#b79b62"
              strokeWidth={2.5}
              fill="url(#predictedGradient)"
              dot={false}
              animationDuration={1500}
              strokeDasharray="6 3"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom metrics bar */}
      <div className="relative z-10 flex items-center gap-6 border-t border-border/40 px-5 py-2.5">
        {[
          { icon: TrendingUp, label: "Trend", value: "Bullish", color: "text-accent-mint" },
          { icon: Brain, label: "Model", value: "LSTM 128→64", color: "text-accent-amber" },
          { icon: Clock, label: "Updated", value: "2m ago", color: "text-muted" },
        ].map((metric) => (
          <div key={metric.label} className="flex items-center gap-2 text-xs">
            <metric.icon className={cn("h-3.5 w-3.5", metric.color)} />
            <span className="text-muted">{metric.label}:</span>
            <span className={cn("font-medium", metric.color)}>{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
