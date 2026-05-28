/**
 * Hook that fetches universal forecasts for all watchlist symbols in parallel.
 *
 * Similar to useCommodityIntelligence but accepts a dynamic list of symbols
 * from the Zustand store. Refreshes every 5 minutes.
 */

import { useQueries } from "@tanstack/react-query";
import {
  fetchUniversalForecast,
  type UniversalForecast,
} from "@/services/forecast";

export function useWatchlistIntelligence(symbols: string[]) {
  const queries = useQueries({
    queries: symbols.map((sym) => ({
      queryKey: ["universal-forecast", sym.toUpperCase()],
      queryFn: () => fetchUniversalForecast(sym),
      staleTime: 5 * 60_000,
      refetchInterval: 5 * 60_000,
      retry: 1,
      enabled: Boolean(sym),
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const data: Record<string, UniversalForecast | undefined> = {};
  const errors: Record<string, Error | null> = {};

  symbols.forEach((sym, i) => {
    data[sym] = queries[i]?.data ?? undefined;
    errors[sym] = queries[i]?.error ?? null;
  });

  return { data, isLoading, errors };
}
