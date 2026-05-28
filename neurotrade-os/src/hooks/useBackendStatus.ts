/**
 * Backend connection status hook.
 *
 * Polls the /health endpoint every 60 seconds to verify the Flask
 * backend is reachable. Provides a status indicator for the UI.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

export type BackendStatus = "connected" | "disconnected" | "checking";

export function useBackendStatus() {
  const query = useQuery({
    queryKey: ["backend-health"],
    queryFn: () => api.health(),
    retry: 2,
    retryDelay: 3000,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const status: BackendStatus = query.isLoading
    ? "checking"
    : query.isSuccess
    ? "connected"
    : "disconnected";

  return {
    status,
    version: query.data?.version,
    isConnected: status === "connected",
    isChecking: status === "checking",
    error: query.error,
    refetch: query.refetch,
  };
}
