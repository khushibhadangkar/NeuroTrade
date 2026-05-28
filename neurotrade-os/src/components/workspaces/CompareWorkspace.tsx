"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart2,
  Gauge,
  Loader2,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  X,
} from "lucide-react";
import { useCompareIntelligence } from "@/hooks/useCompareIntelligence";
import type { UniversalForecast } from "@/services/forecast";
import { dominantOutlook } from "@/services/forecast";
import { ForecastLoader } from "@/components/ui/ForecastLoader";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TICKER_RE = /^[A-Z\^][A-Z0-9&.\-_=]{0,19}$/;
const MAX_SYMBOLS = 5;

/**
 * Compare workspace — side-by-side AI intelligence for multiple assets.
 *
 * Uses the universal forecast engine to fetch real-time technical structure,
 * probabilistic outlook, and AI narrative for up to 5 assets simultaneously.
 * Replaces the old LSTM-based comparison.
 */
export function CompareWorkspace() {
  const [symbols, setSymbols] = useState<string[]>(["NIFTY", "BANKNIFTY", "GOLD"]);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [running, setRunning] = useState(false);
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);

  const { data, isLoading, errors } = useCompareIntelligence(compareSymbols);

  function addSymbol() {
    const s = input.trim().toUpperCase();
    if (!TICKER_RE.test(s)) {
      setInputError("Enter a valid ticker (e.g. NIFTY, RELIANCE, GOLD).");
      return;
    }
    if (symbols.includes(s)) {
      setInputError(`${s} is already in the list.`);
      return;
    }
    if (symbols.length >= MAX_SYMBOLS) {
      setInputError(`Maximum ${MAX_SYMBOLS} symbols.`);
      return;
    }
    setSymbols((prev) => [...prev, s]);
    setInput("");
    setInputError("");
  }

  function removeSymbol(s: string) {
    setSymbols((prev) => prev.filter((t) => t !== s));
  }

  function handleRun() {
    if (symbols.length === 0) return;
    setCompareSymbols([...symbols]);
    setRunning(true);
  }

  const hasResults = compareSymbols.length > 0 && !isLoading;
  const forecasts = compareSymbols
    .map((sym) => data[sym])
    .filter(Boolean) as UniversalForecast[];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32">
      <WorkspaceHeader
        label="Compare"
        title="Side by side intelligence."
        description="Compare technical structure, probabilistic outlook, and AI interpretation across multiple assets simultaneously."
      />

      {/* Symbol builder */}
      <div className="mb-10 space-y-4 border-b border-border pb-8">
        <div className="flex flex-wrap gap-2">
          {symbols.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 rounded-os border border-border bg-surface-800 px-3 py-1.5 text-sm font-medium text-ivory"
            >
              {s}
              <button
                onClick={() => removeSymbol(s)}
                className="text-muted transition hover:text-accent-red focus:outline-none"
                aria-label={`Remove ${s}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setInputError(""); }}
            onKeyDown={(e) => e.key === "Enter" && addSymbol()}
            placeholder="Add asset…"
            className="w-48 border-b border-border bg-transparent pb-1 text-sm text-ivory placeholder:text-muted focus:border-accent-amber focus:outline-none"
            disabled={symbols.length >= MAX_SYMBOLS}
          />
          <Button variant="ghost" size="icon-sm" onClick={addSymbol} disabled={symbols.length >= MAX_SYMBOLS} aria-label="Add symbol">
            <Plus className="h-4 w-4" />
          </Button>
          <Button onClick={handleRun} disabled={isLoading || symbols.length === 0} className="ml-auto">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Run comparison
          </Button>
        </div>
        {inputError && <p className="text-xs text-accent-red">{inputError}</p>}
      </div>

      {/* Loading state */}
      {isLoading && compareSymbols.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {compareSymbols.map((s) => (
            <div key={s} className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
              <div className="space-y-3">
                <div className="h-5 w-24 animate-shimmer rounded bg-surface-800" />
                <div className="h-8 w-32 animate-shimmer rounded bg-surface-800" />
                <div className="h-32 animate-shimmer rounded bg-surface-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {hasResults && forecasts.length > 0 && (
        <>
          {/* Summary comparison table */}
          <ComparisonTable forecasts={forecasts} />

          {/* Individual cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {forecasts.map((f) => (
              <CompareCard key={f.symbol} forecast={f} />
            ))}
          </motion.div>
        </>
      )}

      {/* Empty state */}
      {!running && (
        <div className="border border-dashed border-border p-8">
          <p className="font-display text-2xl text-ivory">Add assets and run.</p>
          <p className="mt-2 text-sm text-muted">
            Up to {MAX_SYMBOLS} assets can be compared. Works across indices, equities, and commodities.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Comparison Table ─────────────────────────────────────────────────────

function ComparisonTable({ forecasts }: { forecasts: UniversalForecast[] }) {
  return (
    <div className="overflow-x-auto rounded-panel border border-border/60 bg-surface-900/40 backdrop-blur-sm">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/40">
            <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted">Asset</th>
            <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-muted">Type</th>
            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-muted">Price</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-muted">Structure</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-muted">Bull%</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-muted">Bear%</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-muted">Conf</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-muted">RSI</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-muted">5D</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-muted">Vol</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map((f) => {
            const change5d = f.technicals.priceAction.change5d;
            const isBullish = f.structure.includes("Bullish");
            const isBearish = f.structure.includes("Bearish");
            return (
              <tr key={f.symbol} className="border-b border-border/20 hover:bg-surface-800/30 transition-colors">
                <td className="px-4 py-3 font-medium text-ivory">{f.displayName}</td>
                <td className="px-4 py-3 text-muted capitalize">{f.assetType}</td>
                <td className="px-4 py-3 text-right font-mono tabular text-ivory">
                  {f.assetType === "commodity" ? `$${f.currentPrice.toFixed(2)}` : f.currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("text-[10px] font-semibold", isBullish ? "text-accent-mint" : isBearish ? "text-accent-red" : "text-accent-amber")}>
                    {f.structure}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-mono tabular text-accent-mint">{f.outlook.bullish}%</td>
                <td className="px-4 py-3 text-center font-mono tabular text-accent-red">{f.outlook.bearish}%</td>
                <td className="px-4 py-3 text-center font-mono tabular text-ivory">{f.outlook.confidence}%</td>
                <td className="px-4 py-3 text-center font-mono tabular text-ivory">{f.technicals.rsi.value.toFixed(0)}</td>
                <td className={cn("px-4 py-3 text-center font-mono tabular", change5d >= 0 ? "text-accent-mint" : "text-accent-red")}>
                  {change5d >= 0 ? "+" : ""}{change5d.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-center text-muted">{f.volatilityRegime}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Compare Card ─────────────────────────────────────────────────────────

function CompareCard({ forecast }: { forecast: UniversalForecast }) {
  const { outlook, technicals, structure, volatilityRegime, momentumStable } = forecast;
  const dominant = dominantOutlook(outlook);
  const isBullish = structure.includes("Bullish");
  const isBearish = structure.includes("Bearish");
  const stanceColor = isBullish ? "text-accent-mint" : isBearish ? "text-accent-red" : "text-accent-amber";
  const stanceBorder = isBullish
    ? "border-accent-mint/30 bg-accent-mint/5"
    : isBearish
    ? "border-accent-red/30 bg-accent-red/5"
    : "border-accent-amber/30 bg-accent-amber/5";

  return (
    <motion.div
      variants={staggerItem}
      className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display text-xl text-ivory">{forecast.displayName}</h3>
          <p className="text-[10px] text-muted">{forecast.symbol} · {forecast.assetType}</p>
        </div>
        <div className={cn("rounded-os border px-2 py-1 text-[10px] font-semibold", stanceBorder, stanceColor)}>
          {structure}
        </div>
      </div>

      {/* Probability outlook */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3 w-3 text-accent-mint" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-700">
            <div className="h-full rounded-full bg-accent-mint" style={{ width: `${outlook.bullish}%` }} />
          </div>
          <span className="w-8 text-right font-mono text-[10px] text-accent-mint tabular">{outlook.bullish}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Waves className="h-3 w-3 text-accent-amber" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-700">
            <div className="h-full rounded-full bg-accent-amber" style={{ width: `${outlook.consolidation}%` }} />
          </div>
          <span className="w-8 text-right font-mono text-[10px] text-accent-amber tabular">{outlook.consolidation}%</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-3 w-3 text-accent-red" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-700">
            <div className="h-full rounded-full bg-accent-red" style={{ width: `${outlook.bearish}%` }} />
          </div>
          <span className="w-8 text-right font-mono text-[10px] text-accent-red tabular">{outlook.bearish}%</span>
        </div>
      </div>

      {/* Technical metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-os bg-surface-950/60 p-2 text-center">
          <p className="text-[8px] uppercase tracking-wider text-muted">RSI</p>
          <p className={cn("text-xs font-semibold", technicals.rsi.value > 50 ? "text-accent-mint" : "text-accent-red")}>
            {technicals.rsi.value.toFixed(0)}
          </p>
        </div>
        <div className="rounded-os bg-surface-950/60 p-2 text-center">
          <p className="text-[8px] uppercase tracking-wider text-muted">MACD</p>
          <p className={cn("text-xs font-semibold", technicals.macd.bullish ? "text-accent-mint" : "text-accent-red")}>
            {technicals.macd.bullish ? "Bullish" : "Bearish"}
          </p>
        </div>
        <div className="rounded-os bg-surface-950/60 p-2 text-center">
          <p className="text-[8px] uppercase tracking-wider text-muted">Volatility</p>
          <p className="text-xs font-semibold text-muted">{volatilityRegime}</p>
        </div>
        <div className="rounded-os bg-surface-950/60 p-2 text-center">
          <p className="text-[8px] uppercase tracking-wider text-muted">Momentum</p>
          <p className={cn("text-xs font-semibold", momentumStable ? "text-accent-mint" : "text-accent-red")}>
            {momentumStable ? "Stable" : "Weak"}
          </p>
        </div>
      </div>

      {/* AI narrative snippet */}
      <div className="rounded-os border border-border/40 bg-surface-950/40 p-3">
        <div className="mb-1 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-accent-amber" />
          <span className="text-[9px] uppercase tracking-wider text-accent-amber">AI</span>
        </div>
        <p className="text-[11px] leading-5 text-muted line-clamp-3">
          {forecast.narrative.split(". ").slice(0, 2).join(". ")}.
        </p>
      </div>
    </motion.div>
  );
}
