/**
 * Hook that fetches universal forecasts for the Compare workspace.
 *
 * Fires parallel requests for all symbols in the comparison set.
 * Only enabled when symbols array is non-empty (triggered by "Run comparison").
 */

import { useQueries } from "@tanstack/react-query";
import {
  fetchUniversalForecast,
  type UniversalForecast,
} from "@/services/forecast";

export function useCompareIntelligence(symbols: string[]) {
  const queries = useQueries({
    queries: symbols.map((sym) => ({
      queryKey: ["universal-forecast", sym.toUpperCase()],
      queryFn: () => fetchUniversalForecast(sym),
      staleTime: 5 * 60_000,
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
