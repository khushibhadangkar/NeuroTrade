"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { MACDPoint } from "./chartData";

interface MACDPanelProps {
  data: MACDPoint[];
}

/**
 * MACD (Moving Average Convergence Divergence) sub-panel.
 * Shows MACD line, signal line, and histogram bars.
 */
export function MACDPanel({ data }: MACDPanelProps) {
  const latest = data[data.length - 1];
  const isBullish = latest ? latest.macd > latest.signal : false;

  return (
    <div className="relative flex h-full items-stretch">
      {/* Label */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center border-r border-border/20 px-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted">MACD</span>
        <span
          className={`mt-0.5 font-mono text-[10px] font-semibold tabular ${
            isBullish ? "text-accent-mint" : "text-accent-red"
          }`}
        >
          {latest?.histogram?.toFixed(2) ?? "0.00"}
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 60, left: 0, bottom: 5 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <ReferenceLine y={0} stroke="rgba(244, 239, 229, 0.08)" />

            {/* Histogram bars */}
            <Bar
              dataKey="histogram"
              fill="rgba(183, 155, 98, 0.4)"
              stroke="none"
              animationDuration={600}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const isPositive = payload.histogram >= 0;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={Math.abs(height)}
                    fill={
                      isPositive
                        ? "rgba(127, 154, 130, 0.5)"
                        : "rgba(192, 97, 74, 0.5)"
                    }
                    rx={0.5}
                  />
                );
              }}
            />

            {/* MACD line */}
            <Line
              type="monotone"
              dataKey="macd"
              stroke="rgba(183, 155, 98, 0.9)"
              strokeWidth={1.3}
              dot={false}
              animationDuration={800}
            />

            {/* Signal line */}
            <Line
              type="monotone"
              dataKey="signal"
              stroke="rgba(122, 155, 168, 0.7)"
              strokeWidth={1}
              strokeDasharray="3 2"
              dot={false}
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="absolute right-2 top-2 flex flex-col gap-1 text-[8px]">
        <span className="flex items-center gap-1">
          <span className="h-px w-3 bg-accent-amber" /> MACD
        </span>
        <span className="flex items-center gap-1">
          <span className="h-px w-3 bg-accent-cyan opacity-70" style={{ borderTop: "1px dashed" }} /> Signal
        </span>
      </div>
    </div>
  );
}
