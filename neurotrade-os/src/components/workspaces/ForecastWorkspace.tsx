"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useUniversalForecast } from "@/hooks/useUniversalForecast";
import { SymbolSearch } from "@/components/forecast/SymbolSearch";
import { UniversalForecastResult } from "@/components/forecast/UniversalForecastResult";
import { ForecastLoader } from "@/components/ui/ForecastLoader";
import { ForecastErrorPanel } from "@/components/ui/ForecastErrorPanel";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { ChartSkeleton } from "@/components/ui/Skeleton";

/**
 * Forecast workspace — universal AI market intelligence engine.
 *
 * Replaces the old LSTM-only flow. Works for indices, equities, and
 * commodities through a single endpoint:
 *   detect asset → fetch live data → analyze structure → outlook → narrative
 *
 * URL param: ?symbol=NIFTY (set by command palette and ⌘K navigation).
 */
export function ForecastWorkspace() {
  const searchParams = useSearchParams();
  const initialSymbol = (searchParams.get("symbol") ?? "NIFTY").toUpperCase();
  const startTimeRef = useRef<number>(Date.now());
  const [lastSymbol, setLastSymbol] = useState<string>(initialSymbol);

  const { mutate, isPending, data, error, forecastError, reset } =
    useUniversalForecast();

  // If the URL has a symbol on first mount, auto-run a forecast
  useEffect(() => {
    if (initialSymbol && !data && !isPending && !error) {
      startTimeRef.current = Date.now();
      setLastSymbol(initialSymbol);
      mutate(initialSymbol);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(symbol: string) {
    reset();
    startTimeRef.current = Date.now();
    setLastSymbol(symbol);
    mutate(symbol);
  }

  function handleRetry() {
    if (!lastSymbol) return;
    reset();
    startTimeRef.current = Date.now();
    mutate(lastSymbol);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32">
      <WorkspaceHeader
        label="Forecast"
        title="One asset. Real intelligence."
        description="Technical structure, probabilistic outlook, and AI interpretation for any Indian index, equity, or commodity."
      />

      <div className="space-y-14">
        <SymbolSearch
          onSubmit={handleSubmit}
          loading={isPending}
          initialValue={initialSymbol}
        />

        {/* Error state */}
        {error && !isPending && (
          <ForecastErrorPanel error={error} onRetry={handleRetry} />
        )}

        {/* Empty state */}
        {!data && !isPending && !error && (
          <div className="border border-dashed border-border p-8">
            <p className="font-display text-3xl text-ivory">Awaiting an asset.</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Enter an Indian index, equity, or commodity above. The intelligence
              engine fetches live market data, analyzes the technical structure,
              evaluates volatility and momentum, and returns a probabilistic
              outlook with an asset-aware AI interpretation.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-muted">
              <span className="rounded-os border border-border bg-surface-900/40 px-2.5 py-1">
                Indices
              </span>
              <span className="rounded-os border border-border bg-surface-900/40 px-2.5 py-1">
                Equities
              </span>
              <span className="rounded-os border border-border bg-surface-900/40 px-2.5 py-1">
                Commodities
              </span>
            </div>
          </div>
        )}

        {/* Loading skeleton (visible behind the overlay for layout stability) */}
        {isPending && (
          <div className="grid gap-8 lg:grid-cols-[0.34fr_0.66fr]">
            <div className="space-y-4">
              <div className="h-3 w-20 animate-shimmer rounded-os bg-surface-800" />
              <div className="h-16 w-44 animate-shimmer rounded-os bg-surface-800" />
              <div className="h-32 animate-shimmer rounded-os bg-surface-800" />
            </div>
            <ChartSkeleton height={400} />
          </div>
        )}

        {/* Result */}
        {data && !isPending && (
          <UniversalForecastResult forecast={data} index={0} />
        )}
      </div>

      {/* Cinematic intelligence loader */}
      <AnimatePresence>
        {isPending && (
          <ForecastLoader
            symbol={lastSymbol}
            startTime={startTimeRef.current}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
