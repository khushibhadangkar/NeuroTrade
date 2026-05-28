"use client";

import { motion } from "framer-motion";
import type { ModelMetrics, TechnicalAnalysis } from "@/lib/finance";
import {
  formatCurrency,
  formatPercent,
  deriveConfidence,
  changeTailwind,
} from "@/lib/finance";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MetricCellProps {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral" | "amber";
}

function MetricCell({ label, value, tone = "neutral" }: MetricCellProps) {
  const valueClass = {
    positive: "text-accent-mint",
    negative: "text-accent-red",
    neutral: "text-ivory",
    amber: "text-accent-amber",
  }[tone];

  return (
    <div className="bg-surface-950 p-4">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</dt>
      <dd className={cn("mt-2 text-sm font-medium tabular", valueClass)}>{value}</dd>
    </div>
  );
}

interface MetricsGridProps {
  metrics: ModelMetrics;
  technical: TechnicalAnalysis;
  latestActual?: number;
  latestForecast?: number;
  windowChange?: number;
}

/**
 * 2×3 grid of key model metrics — mirrors the existing CRA detail panel
 * but with motion and the full metric set from Phase 0.
 */
export function MetricsGrid({
  metrics,
  technical,
  latestActual,
  latestForecast,
  windowChange = 0,
}: MetricsGridProps) {
  const confidence = deriveConfidence(metrics);

  return (
    <motion.dl
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-px border border-border bg-border"
    >
      {[
        {
          label: "Latest actual",
          value: latestActual != null ? formatCurrency(latestActual) : "—",
          tone: "neutral" as const,
        },
        {
          label: "Forecast close",
          value: latestForecast != null ? formatCurrency(latestForecast) : "—",
          tone: "amber" as const,
        },
        {
          label: "Window move",
          value: formatPercent(windowChange),
          tone: windowChange >= 0 ? ("positive" as const) : ("negative" as const),
        },
        {
          label: "Directional acc.",
          value: formatPercent(metrics.directional_accuracy ?? 0),
          tone: "neutral" as const,
        },
        {
          label: "RMSE",
          value: formatCurrency(metrics.rmse ?? 0),
          tone: "neutral" as const,
        },
        {
          label: "Confidence",
          value: `${confidence}%`,
          tone: confidence >= 60 ? ("positive" as const) : ("neutral" as const),
        },
        {
          label: "R² score",
          value: (metrics.r2 ?? 0).toFixed(4),
          tone:
            (metrics.r2 ?? 0) > 0 ? ("positive" as const) : ("negative" as const),
        },
        {
          label: "Trend",
          value: technical.price_trend ?? "—",
          tone:
            technical.price_trend === "Upward"
              ? ("positive" as const)
              : technical.price_trend === "Downward"
              ? ("negative" as const)
              : ("neutral" as const),
        },
      ].map((cell) => (
        <motion.div key={cell.label} variants={staggerItem}>
          <MetricCell {...cell} />
        </motion.div>
      ))}
    </motion.dl>
  );
}
