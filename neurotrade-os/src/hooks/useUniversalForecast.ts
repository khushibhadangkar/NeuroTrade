/**
 * TanStack Query hook for the universal AI forecast endpoint.
 *
 * Replaces the old LSTM-based usePrediction hook on the Forecast workspace.
 * Works for any supported asset (index/equity/commodity) with sub-second
 * response times — no model training required.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUniversalForecast,
  ForecastError,
  type UniversalForecast,
} from "@/services/forecast";
import { useOSStore } from "@/store/useOSStore";

// ─── Phase messages for the cinematic loader ──────────────────────────────

export const FORECAST_PHASES = [
  "DETECTING ASSET CLASS",
  "FETCHING LIVE MARKET DATA",
  "ANALYZING TECHNICAL STRUCTURE",
  "EVALUATING VOLATILITY & MOMENTUM",
  "COMPUTING PROBABILISTIC OUTLOOK",
  "SYNTHESIZING AI INTERPRETATION",
] as const;

// ─── Query key factory ────────────────────────────────────────────────────

export const forecastKey = (symbol: string) => [
  "universal-forecast",
  symbol.toUpperCase(),
];

// ─── Mutation-style hook (for the Run Forecast button) ────────────────────

/**
 * Mutation hook for triggering a forecast on demand.
 * Use this when the user clicks "Run forecast" — fires the request,
 * surfaces loading/error states, caches the result.
 */
export function useUniversalForecast() {
  const queryClient = useQueryClient();
  const pushRecentSymbol = useOSStore((s) => s.pushRecentSymbol);

  const mutation = useMutation<UniversalForecast, ForecastError, string>({
    mutationFn: (symbol) => fetchUniversalForecast(symbol),
    onSuccess: (data, symbol) => {
      queryClient.setQueryData(forecastKey(symbol), data);
      pushRecentSymbol(symbol);
    },
  });

  return {
    ...mutation,
    forecastError: mutation.error as ForecastError | null,
    phases: FORECAST_PHASES,
  };
}

// ─── Query-style hook (for auto-loading by URL) ───────────────────────────

/**
 * Query hook for fetching a forecast by symbol — used when the workspace
 * is opened with ?symbol= in the URL.
 */
export function useForecastQuery(symbol: string | null) {
  return useQuery<UniversalForecast, ForecastError>({
    queryKey: symbol ? forecastKey(symbol) : ["universal-forecast", "none"],
    queryFn: () => fetchUniversalForecast(symbol!),
    enabled: Boolean(symbol),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000, // refresh every 5 min
    retry: 1,
  });
}
