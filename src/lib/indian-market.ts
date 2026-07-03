/**
 * Indian Market Intelligence — constants, types, and utilities
 * specialized for NSE/BSE index and equity analysis.
 */

// ─── Indian Indices ───────────────────────────────────────────────────────

export const INDICES = {
  NIFTY: { symbol: "^NSEI", name: "NIFTY 50", exchange: "NSE" },
  BANKNIFTY: { symbol: "^NSEBANK", name: "BANK NIFTY", exchange: "NSE" },
  FINNIFTY: { symbol: "NIFTY_FIN_SERVICE.NS", name: "FIN NIFTY", exchange: "NSE" },
  SENSEX: { symbol: "^BSESN", name: "SENSEX", exchange: "BSE" },
} as const;

export type IndexKey = keyof typeof INDICES;

// ─── Top Indian Equities ──────────────────────────────────────────────────

export const EQUITIES = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking" },
  { symbol: "INFY.NS", name: "Infosys", sector: "IT" },
  { symbol: "TCS.NS", name: "TCS", sector: "IT" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom" },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Banking" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG" },
  { symbol: "ITC.NS", name: "ITC", sector: "FMCG" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Banking" },
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Banking" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "Finance" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", sector: "Auto" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharma", sector: "Pharma" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Auto" },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "IT" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "IT" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", sector: "Conglomerate" },
  { symbol: "TITAN.NS", name: "Titan Company", sector: "Consumer" },
] as const;

// ─── Indian Sectors ───────────────────────────────────────────────────────

export const SECTORS = [
  { id: "banking", name: "Banking", color: "amber", symbols: ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS"] },
  { id: "it", name: "IT", color: "cyan", symbols: ["INFY.NS", "TCS.NS", "WIPRO.NS", "HCLTECH.NS"] },
  { id: "fmcg", name: "FMCG", color: "mint", symbols: ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS"] },
  { id: "pharma", name: "Pharma", color: "mint", symbols: ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS"] },
  { id: "auto", name: "Auto", color: "amber", symbols: ["MARUTI.NS", "TATAMOTORS.NS", "M&M.NS"] },
  { id: "energy", name: "Energy", color: "red", symbols: ["RELIANCE.NS", "ONGC.NS", "NTPC.NS"] },
] as const;

export type SectorId = (typeof SECTORS)[number]["id"];

// ─── Probabilistic Analysis Types ─────────────────────────────────────────

export interface ProbabilisticScenario {
  bullish: number;    // 0-100
  bearish: number;    // 0-100
  consolidation: number; // 0-100
}

export interface MarketBias {
  direction: "Strongly Bullish" | "Moderately Bullish" | "Neutral" | "Moderately Bearish" | "Strongly Bearish";
  volatility: "Low" | "Moderate" | "High" | "Extreme";
  momentum: "Strengthening" | "Stable" | "Weakening" | "Reversing";
  flow: "Institutional Accumulation" | "Retail Driven" | "Mixed" | "Institutional Distribution";
}

export interface SupportResistance {
  supports: Array<{ level: number; strength: "Strong" | "Moderate" | "Weak" }>;
  resistances: Array<{ level: number; strength: "Strong" | "Moderate" | "Weak" }>;
  pivotPoint: number;
  expectedRange: { low: number; high: number };
}

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Derive probabilistic scenario from model metrics and technical analysis.
 */
export function deriveProbabilities(
  metrics: { directional_accuracy?: number; r2?: number; normalized_rmse?: number } | null,
  technical: { price_trend?: string; moving_averages?: string } | null
): ProbabilisticScenario {
  if (!metrics || !technical) {
    return { bullish: 33, bearish: 33, consolidation: 34 };
  }

  const dirAcc = metrics.directional_accuracy ?? 50;
  const isBullishTrend = technical.price_trend === "Upward";
  const isBullishMA = technical.moving_averages === "Bullish";
  const volatility = metrics.normalized_rmse ?? 5;

  let bullish: number;
  let bearish: number;

  if (isBullishTrend && isBullishMA) {
    bullish = Math.min(75, 40 + dirAcc * 0.4);
    bearish = Math.max(10, 30 - dirAcc * 0.2);
  } else if (!isBullishTrend && !isBullishMA) {
    bearish = Math.min(75, 40 + dirAcc * 0.4);
    bullish = Math.max(10, 30 - dirAcc * 0.2);
  } else {
    bullish = 35 + (isBullishTrend ? 10 : -5);
    bearish = 35 + (!isBullishTrend ? 10 : -5);
  }

  // Higher volatility increases consolidation probability
  const consolidation = Math.max(10, Math.min(40, volatility * 3));

  // Normalize to 100
  const total = bullish + bearish + consolidation;
  return {
    bullish: Math.round((bullish / total) * 100),
    bearish: Math.round((bearish / total) * 100),
    consolidation: Math.round((consolidation / total) * 100),
  };
}

/**
 * Derive market bias from metrics and technical signals.
 */
export function deriveMarketBias(
  metrics: { directional_accuracy?: number; normalized_rmse?: number } | null,
  technical: { price_trend?: string; moving_averages?: string; volume_trend?: string } | null
): MarketBias {
  const isBullishTrend = technical?.price_trend === "Upward";
  const isBullishMA = technical?.moving_averages === "Bullish";
  const highVolume = technical?.volume_trend === "High";
  const volatility = metrics?.normalized_rmse ?? 5;

  let direction: MarketBias["direction"];
  if (isBullishTrend && isBullishMA) direction = "Strongly Bullish";
  else if (isBullishTrend || isBullishMA) direction = "Moderately Bullish";
  else if (!isBullishTrend && !isBullishMA) direction = "Strongly Bearish";
  else direction = "Neutral";

  let vol: MarketBias["volatility"];
  if (volatility > 15) vol = "Extreme";
  else if (volatility > 8) vol = "High";
  else if (volatility > 4) vol = "Moderate";
  else vol = "Low";

  const momentum: MarketBias["momentum"] =
    isBullishTrend && highVolume ? "Strengthening" :
    !isBullishTrend && highVolume ? "Reversing" :
    isBullishTrend ? "Stable" : "Weakening";

  const flow: MarketBias["flow"] =
    highVolume && isBullishTrend ? "Institutional Accumulation" :
    highVolume && !isBullishTrend ? "Institutional Distribution" :
    "Mixed";

  return { direction, volatility: vol, momentum, flow };
}

/**
 * Generate support/resistance levels from prediction data.
 */
export function deriveSupportResistance(
  predictions: Array<{ actual: number; predicted: number }>,
): SupportResistance {
  if (!predictions.length) {
    return { supports: [], resistances: [], pivotPoint: 0, expectedRange: { low: 0, high: 0 } };
  }

  const prices = predictions.map((p) => p.actual).filter(Boolean);
  const predicted = predictions.map((p) => p.predicted).filter(Boolean);
  const allPrices = [...prices, ...predicted];

  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const close = prices[prices.length - 1] ?? 0;
  const pivot = (high + low + close) / 3;

  const r1 = 2 * pivot - low;
  const r2 = pivot + (high - low);
  const s1 = 2 * pivot - high;
  const s2 = pivot - (high - low);

  const lastPredicted = predicted[predicted.length - 1] ?? close;
  const range = high - low;

  return {
    pivotPoint: Math.round(pivot * 100) / 100,
    supports: [
      { level: Math.round(s1 * 100) / 100, strength: "Strong" },
      { level: Math.round(s2 * 100) / 100, strength: "Moderate" },
    ],
    resistances: [
      { level: Math.round(r1 * 100) / 100, strength: "Strong" },
      { level: Math.round(r2 * 100) / 100, strength: "Moderate" },
    ],
    expectedRange: {
      low: Math.round((lastPredicted - range * 0.3) * 100) / 100,
      high: Math.round((lastPredicted + range * 0.3) * 100) / 100,
    },
  };
}

/**
 * Format Indian number system (lakhs, crores).
 */
export function formatIndianNumber(value: number): string {
  if (Math.abs(value) >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (Math.abs(value) >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(2)} L`;
  }
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/**
 * Format price in INR.
 */
export function formatINR(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "—";
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// ─── Default Watchlist ────────────────────────────────────────────────────

export const DEFAULT_WATCHLIST = [
  "^NSEI",        // NIFTY 50
  "^NSEBANK",     // BANK NIFTY
  "RELIANCE.NS",
  "HDFCBANK.NS",
  "INFY.NS",
  "TCS.NS",
  "ICICIBANK.NS",
];

// ─── Ticker examples for search ──────────────────────────────────────────

export const TICKER_EXAMPLES = ["RELIANCE.NS", "HDFCBANK.NS", "INFY.NS", "TCS.NS", "^NSEI"];

// ─── Market session info ──────────────────────────────────────────────────

export function getMarketSession(): "pre" | "open" | "post" | "closed" {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const time = hours * 60 + minutes;
  const day = ist.getDay();

  if (day === 0 || day === 6) return "closed";
  if (time < 9 * 60) return "pre";
  if (time < 9 * 60 + 15) return "pre";
  if (time <= 15 * 60 + 30) return "open";
  if (time <= 16 * 60) return "post";
  return "closed";
}
