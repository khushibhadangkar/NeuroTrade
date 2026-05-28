"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { RSIPoint } from "./chartData";

interface RSIPanelProps {
  data: RSIPoint[];
}

/**
 * RSI (Relative Strength Index) sub-panel.
 * Shows overbought (70) and oversold (30) zones with gradient fills.
 */
export function RSIPanel({ data }: RSIPanelProps) {
  const latestRSI = data[data.length - 1]?.value ?? 50;
  const isOverbought = latestRSI > 70;
  const isOversold = latestRSI < 30;

  return (
    <div className="relative flex h-full items-stretch">
      {/* Label */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center border-r border-border/20 px-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted">RSI</span>
        <span
          className={`mt-0.5 font-mono text-sm font-semibold tabular ${
            isOverbought
              ? "text-accent-red"
              : isOversold
              ? "text-accent-mint"
              : "text-ivory"
          }`}
        >
          {latestRSI.toFixed(1)}
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 60, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(127, 154, 130, 0.2)" />
                <stop offset="100%" stopColor="rgba(127, 154, 130, 0)" />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis
              domain={[0, 100]}
              hide
              ticks={[30, 50, 70]}
            />
            <ReferenceLine
              y={70}
              stroke="rgba(192, 97, 74, 0.3)"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={30}
              stroke="rgba(127, 154, 130, 0.3)"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={50}
              stroke="rgba(244, 239, 229, 0.06)"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="rgba(127, 154, 130, 0.8)"
              strokeWidth={1.5}
              fill="url(#rsiGradient)"
              dot={false}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scale labels */}
      <div className="absolute right-2 top-0 flex h-full flex-col justify-between py-2 text-[8px] tabular text-muted">
        <span>70</span>
        <span>50</span>
        <span>30</span>
      </div>
    </div>
  );
}
