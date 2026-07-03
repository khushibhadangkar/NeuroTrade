/**
 * Financial formatting and computation utilities.
 * Ported and extended from the existing CRA frontend's lib/finance.js.
 */

// ─── Formatters ───────────────────────────────────────────────────────────

export function formatCurrency(
  value: number | string | null | undefined,
  opts?: { digits?: number; compact?: boolean }
): string {
  const n = Number(value);
  if (!isFinite(n)) return "—";
  if (opts?.compact && Math.abs(n) >= 1_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: opts.digits ?? 2,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: opts?.digits ?? 2,
  }).format(n);
}

export function formatPercent(
  value: number | string | null | undefined,
  digits = 2
): string {
  const n = Number(value);
  if (!isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function formatNumber(
  value: number | string | null | undefined,
  digits = 2
): string {
  const n = Number(value);
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(n);
}

// ─── Clamp ────────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Series helpers ───────────────────────────────────────────────────────

export interface PredictionPoint {
  date: string;
  actual: number;
  predicted: number;
}

export function getLatestPoint(series: PredictionPoint[]): PredictionPoint | null {
  return series[series.length - 1] ?? null;
}

export function getFirstPoint(series: PredictionPoint[]): PredictionPoint | null {
  return series[0] ?? null;
}

export interface ChangeResult {
  absolute: number;
  percent: number;
}

export function calculateChange(series: PredictionPoint[]): ChangeResult {
  const first = getFirstPoint(series);
  const latest = getLatestPoint(series);
  if (!first || !latest) return { absolute: 0, percent: 0 };
  const start = first.actual ?? first.predicted ?? 0;
  const end = latest.predicted ?? latest.actual ?? 0;
  if (!start) return { absolute: 0, percent: 0 };
  return {
    absolute: end - start,
    percent: ((end - start) / start) * 100,
  };
}

// ─── Confidence score ─────────────────────────────────────────────────────

export interface ModelMetrics {
  rmse?: number;
  normalized_rmse?: number;
  mae?: number;
  r2?: number;
  directional_accuracy?: number;
  final_loss?: number;
}

/**
 * Derive a 1–99 confidence score from model metrics.
 * Weights: directional accuracy 55%, R² 35%, error penalty 10%.
 */
export function deriveConfidence(metrics: ModelMetrics | null | undefined): number {
  if (!metrics) return 0;
  const accuracy = Number(metrics.directional_accuracy ?? 0);
  const r2 = clamp(Number(metrics.r2 ?? 0), 0, 1) * 100;
  const errorPenalty = clamp(Number(metrics.normalized_rmse ?? 0), 0, 100);
  return clamp(
    Math.round(accuracy * 0.55 + r2 * 0.35 + (100 - errorPenalty) * 0.1),
    1,
    99
  );
}

// ─── Insight builder ──────────────────────────────────────────────────────

export interface TechnicalAnalysis {
  moving_averages?: string;
  volume_trend?: string;
  price_trend?: string;
}

export interface StockInsight {
  symbol: string;
  change: ChangeResult;
  confidence: number;
  volatility: number;
  stance: "Bullish" | "Bearish";
  summary: string;
}

export function buildInsight(
  symbol: string,
  prediction: PredictionPoint[],
  metrics: ModelMetrics | null | undefined,
  technical: TechnicalAnalysis
): StockInsight {
  const change = calculateChange(prediction);
  const confidence = deriveConfidence(metrics);
  const bullish =
    technical.moving_averages === "Bullish" ||
    technical.price_trend === "Upward";
  const volatility = clamp(
    Math.round(Number(metrics?.normalized_rmse ?? 0) * 1.8),
    5,
    95
  );

  return {
    symbol,
    change,
    confidence,
    volatility,
    stance: bullish ? "Bullish" : "Bearish",
    summary: bullish
      ? `${symbol} is showing constructive momentum with ${technical.price_trend ?? "mixed"} projected price action.`
      : `${symbol} is showing caution signals with ${technical.price_trend ?? "mixed"} projected price action.`,
  };
}

// ─── Color helpers ────────────────────────────────────────────────────────

/** Return the appropriate accent color for a numeric change. */
export function changeColor(value: number): string {
  if (value > 0) return "var(--color-accent-mint)";
  if (value < 0) return "var(--color-accent-red)";
  return "var(--color-muted)";
}

/** Return a Tailwind class for a numeric change. */
export function changeTailwind(value: number): string {
  if (value > 0) return "text-accent-mint";
  if (value < 0) return "text-accent-red";
  return "text-muted";
}
