/**
 * React Query hook for real financial news.
 * Refreshes every 5 minutes.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchMarketNews, type NewsItem } from "@/services/news";

export function useMarketNews() {
  return useQuery<NewsItem[]>({
    queryKey: ["market", "news"],
    queryFn: fetchMarketNews,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
}
