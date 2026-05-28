/**
 * React Query hooks for real-time market data.
 *
 * These hooks auto-refresh at intervals to keep the UI current.
 * Data comes from yfinance via the Flask backend (15-min delayed).
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchMarketOverview,
  fetchIndices,
  fetchEquities,
  fetchCommodities,
  fetchQuote,
  fetchTechnicals,
  type MarketOverview,
  type IndexQuote,
  type EquityQuote,
  type CommodityQuote,
  type TechnicalAnalysisResult,
} from "@/services/market";

/** Full market overview — refreshes every 60s */
export function useMarketOverview() {
  return useQuery<MarketOverview>({
    queryKey: ["market", "overview"],
    queryFn: fetchMarketOverview,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2,
  });
}

/** Indian indices — refreshes every 30s */
export function useIndices() {
  return useQuery<IndexQuote[]>({
    queryKey: ["market", "indices"],
    queryFn: fetchIndices,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 2,
  });
}

/** Equity quotes — refreshes every 60s */
export function useEquities(symbols?: string[]) {
  return useQuery<EquityQuote[]>({
    queryKey: ["market", "equities", symbols?.join(",") ?? "all"],
    queryFn: () => fetchEquities(symbols),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2,
  });
}

/** Commodities — refreshes every 60s */
export function useCommodities() {
  return useQuery<CommodityQuote[]>({
    queryKey: ["market", "commodities"],
    queryFn: fetchCommodities,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2,
  });
}

/** Single quote */
export function useQuote(symbol: string) {
  return useQuery<EquityQuote | null>({
    queryKey: ["market", "quote", symbol],
    queryFn: () => fetchQuote(symbol),
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: !!symbol,
  });
}

/** Technical analysis — refreshes every 5 min (computationally expensive) */
export function useTechnicals(symbol: string) {
  return useQuery<TechnicalAnalysisResult | null>({
    queryKey: ["market", "technicals", symbol],
    queryFn: () => fetchTechnicals(symbol),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    enabled: !!symbol,
    retry: 1,
  });
}
