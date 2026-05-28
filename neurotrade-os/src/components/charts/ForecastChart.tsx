"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { PredictionPoint } from "@/lib/finance";
import { formatCurrency } from "@/lib/finance";
import { chartTheme } from "@/lib/tokens";

interface ForecastChartProps {
  series: PredictionPoint[];
  height?: number;
  showGrid?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="border border-border bg-surface-950 px-3 py-2 text-xs shadow-panel"
      style={{ minWidth: 160 }}
    >
      <p className="mb-1.5 text-accent-amber">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="text-muted">{entry.name}</span>
          <span className="font-medium tabular" style={{ color: entry.color }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Dual-line forecast chart — actual (grey) vs predicted (amber).
 * Lifted from the existing CRA PredictionChart and upgraded with
 * a custom tooltip and reference line at the train/test boundary.
 */
export function ForecastChart({
  series,
  height = 360,
  showGrid = true,
}: ForecastChartProps) {
  return (
    <div
      className="w-full border border-border bg-surface-900 p-3 sm:p-5"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          {showGrid && (
            <CartesianGrid
              stroke={chartTheme.grid}
              vertical={false}
              strokeDasharray="0"
            />
          )}
          <XAxis
            dataKey="date"
            tick={{ fill: chartTheme.text, fontSize: 10 }}
            axisLine={{ stroke: "rgba(244,239,229,0.10)" }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: chartTheme.text, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="actual"
            name="Historical"
            stroke={chartTheme.actual}
            strokeWidth={1.6}
            dot={false}
            animationDuration={900}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            name="Forecast"
            stroke={chartTheme.forecast}
            strokeWidth={2.2}
            dot={false}
            animationDuration={1100}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
