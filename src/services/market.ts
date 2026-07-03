/**
 * Real-time market data service.
 *
 * Connects to the Flask backend's /market/* endpoints which fetch
 * live data from yfinance. Data is 15-min delayed (free tier).
 */

const BASE = typeof window === "undefined"
  ? (process.env.NEUROTRADE_API_URL ?? "http://127.0.0.1:5001")
  : (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5001");

// ─── Types ────────────────────────────────────────────────────────────────

export interface IndexQuote {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  prevClose: number;
}

export interface EquityQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
}

export interface CommodityQuote {
  symbol: string;
  name: string;
  priceUSD: number;
  priceINR: number;
  changePct: number;
  unit: string;
}

export interface MarketOverview {
  timestamp: string;
  indices: IndexQuote[];
  gainers: EquityQuote[];
  losers: EquityQuote[];
  commodities: CommodityQuote[];
}

// ─── Fetch helpers ────────────────────────────────────────────────────────

async function marketFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true",
    },
  });
  if (!res.ok) {
    throw new Error(`Market data request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function fetchMarketOverview(): Promise<MarketOverview> {
  return marketFetch<MarketOverview>("/market/overview");
}

export async function fetchIndices(): Promise<IndexQuote[]> {
  const data = await marketFetch<{ indices: IndexQuote[] }>("/market/indices");
  return data.indices;
}

export async function fetchEquities(symbols?: string[]): Promise<EquityQuote[]> {
  const query = symbols ? `?symbols=${symbols.join(",")}` : "";
  const data = await marketFetch<{ equities: EquityQuote[] }>(`/market/equities${query}`);
  return data.equities;
}

export async function fetchCommodities(): Promise<CommodityQuote[]> {
  const data = await marketFetch<{ commodities: CommodityQuote[] }>("/market/commodities");
  return data.commodities;
}

// ─── Technicals ───────────────────────────────────────────────────────────

export interface TechnicalAnalysisResult {
  symbol: string;
  price: number;
  structure: string;
  trendConfidence: number;
  volatilityRegime: string;
  momentumStable: boolean;
  rsi: { value: number; overbought: boolean; oversold: boolean };
  macd: { value: number; signal: number; histogram: number; bullish: boolean; expanding: boolean };
  ema: { ema20: number; ema50: number; ema200: number; priceAbove20: boolean; priceAbove50: boolean; aligned: boolean };
  atr: { value: number; percent: number };
  bollinger: { position: number; upper: number; lower: number };
  priceAction: { change5d: number; change20d: number };
  explanation: string;
}

export async function fetchTechnicals(symbol: string): Promise<TechnicalAnalysisResult | null> {
  try {
    return await marketFetch<TechnicalAnalysisResult>(`/market/technicals/${symbol}`);
  } catch {
    return null;
  }
}

export async function fetchQuote(symbol: string): Promise<EquityQuote | null> {
  try {
    return await marketFetch<EquityQuote>(`/market/quote/${symbol}`);
  } catch {
    return null;
  }
}
