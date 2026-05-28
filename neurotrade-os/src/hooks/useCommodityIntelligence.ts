/**
 * Hook that fetches universal forecasts for all commodities in parallel.
 *
 * Uses TanStack Query's useQueries to fire concurrent requests to the
 * /forecast/:symbol endpoint for each commodity, then aggregates results
 * into a single record keyed by symbol.
 */

import { useQueries } from "@tanstack/react-query";
import {
  fetchUniversalForecast,
  type UniversalForecast,
} from "@/services/forecast";

export function useCommodityIntelligence(
  symbols: readonly string[]
) {
  const queries = useQueries({
    queries: symbols.map((sym) => ({
      queryKey: ["universal-forecast", sym],
      queryFn: () => fetchUniversalForecast(sym),
      staleTime: 5 * 60_000,
      refetchInterval: 5 * 60_000,
      retry: 1,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const data: Record<string, UniversalForecast | undefined> = {};
  const errors: Record<string, Error | null> = {};

  symbols.forEach((sym, i) => {
    data[sym] = queries[i].data ?? undefined;
    errors[sym] = queries[i].error ?? null;
  });

  return { data, isLoading, errors };
}
