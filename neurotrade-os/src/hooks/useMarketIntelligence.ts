/**
 * Hook that fetches NIFTY and BANKNIFTY universal forecasts
 * to power the Market Intelligence Home.
 *
 * These two forecasts drive:
 * - Market sentiment classification
 * - Probabilistic outlook
 * - Confidence layer
 * - AI narrative
 */

import { useQueries } from "@tanstack/react-query";
import {
  fetchUniversalForecast,
  type UniversalForecast,
} from "@/services/forecast";

export function useMarketIntelligence() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["universal-forecast", "NIFTY"],
        queryFn: () => fetchUniversalForecast("NIFTY"),
        staleTime: 5 * 60_000,
        refetchInterval: 5 * 60_000,
        retry: 1,
      },
      {
        queryKey: ["universal-forecast", "BANKNIFTY"],
        queryFn: () => fetchUniversalForecast("BANKNIFTY"),
        staleTime: 5 * 60_000,
        refetchInterval: 5 * 60_000,
        retry: 1,
      },
    ],
  });

  return {
    niftyForecast: queries[0].data as UniversalForecast | undefined,
    bankNiftyForecast: queries[1].data as UniversalForecast | undefined,
    isLoading: queries[0].isLoading || queries[1].isLoading,
    errors: {
      nifty: queries[0].error,
      bankNifty: queries[1].error,
    },
  };
}
