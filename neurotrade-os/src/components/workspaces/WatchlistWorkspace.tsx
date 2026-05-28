"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Gauge,
  Plus,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useOSStore } from "@/store/useOSStore";
import { useWatchlistIntelligence } from "@/hooks/useWatchlistIntelligence";
import type { UniversalForecast } from "@/services/forecast";
import { dominantOutlook } from "@/services/forecast";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TICKER_RE = /^[A-Z\^][A-Z0-9&.\-_=]{0,19}$/;

const SUGGESTIONS = [
  "NIFTY", "BANKNIFTY", "RELIANCE", "HDFCBANK",
  "TCS", "INFY", "GOLD", "SILVER", "CRUDE", "COPPER",
];

/**
 * Watchlist workspace — personalized asset intelligence dashboard.
 *
 * Each watched symbol shows live price, technical structure, momentum,
 * AI rating, and probability outlook from the universal forecast engine.
 */
export function WatchlistWorkspace() {
  const watchlist = useOSStore((s) => s.watchlist);
  const addToWatchlist = useOSStore((s) => s.addToWatchlist);
  const removeFromWatchlist = useOSStore((s) => s.removeFromWatchlist);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useWatchlistIntelligence(watchlist);

  function handleAdd() {
    const s = input.trim().toUpperCase();
    if (!TICKER_RE.test(s)) {
      setError("Enter a valid ticker (e.g. NIFTY, RELIANCE, GOLD).");
      return;
    }
    if (watchlist.includes(s)) {
      setError(`${s} is already in your watchlist.`);
      return;
    }
    addToWatchlist(s);
    setInput("");
    setError("");
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32">
      <WorkspaceHeader
        label="Watchlist"
        title="Your assets. Live intelligence."
        description="Personalized market intelligence for your tracked assets. Real-time structure, momentum, volatility, and AI outlook."
      />

      {/* Add symbol bar */}
      <div className="mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add asset…"
            className="w-48 border-b border-border bg-transparent pb-1 text-sm text-ivory placeholder:text-muted focus:border-accent-amber focus:outline-none"
          />
          <Button variant="ghost" size="icon-sm" onClick={handleAdd} aria-label="Add">
            <Plus className="h-4 w-4" />
          </Button>
          {error && <p className="ml-2 text-xs text-accent-red">{error}</p>}
        </div>

        {/* Quick-add suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted">Quick add:</span>
          {SUGGESTIONS.filter((s) => !watchlist.includes(s)).slice(0, 6).map((s) => (
            <button
              key={s}
              onClick={() => addToWatchlist(s)}
              className="rounded-os border border-border/60 bg-surface-900/40 px-2 py-0.5 text-[10px] text-muted transition hover:border-accent-amber hover:text-accent-amber"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Watchlist grid */}
      {watchlist.length === 0 ? (
        <div className="border border-dashed border-border p-8">
          <p className="font-display text-2xl text-ivory">No assets tracked.</p>
          <p className="mt-2 text-sm text-muted">
            Add Indian indices, equities, or commodities above to build your watchlist.
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {watchlist.map((symbol) => (
            <WatchlistCard
              key={symbol}
              symbol={symbol}
              forecast={data[symbol] ?? null}
              isLoading={isLoading}
              onRemove={() => removeFromWatchlist(symbol)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Watchlist Card ───────────────────────────────────────────────────────

function WatchlistCard({
  symbol,
  forecast,
  isLoading,
  onRemove,
}: {
  symbol: string;
  forecast: UniversalForecast | null;
  isLoading: boolean;
  onRemove: () => void;
}) {
  if (isLoading || !forecast) {
    return (
      <motion.div variants={staggerItem} className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="h-5 w-24 animate-shimmer rounded bg-surface-800" />
          <div className="h-8 w-32 animate-shimmer rounded bg-surface-800" />
          <div className="h-16 animate-shimmer rounded bg-surface-800" />
        </div>
      </motion.div>
    );
  }

  const { outlook, technicals, structure, volatilityRegime, momentumStable } = forecast;
  const dominant = dominantOutlook(outlook);
  const change5d = technicals.priceAction.change5d;
  const isBullish = structure.includes("Bullish");
  const isBearish = structure.includes("Bearish");

  const stanceColor = isBullish ? "text-accent-mint" : isBearish ? "text-accent-red" : "text-accent-amber";
  const stanceBorder = isBullish
    ? "border-accent-mint/30 bg-accent-mint/5"
    : isBearish
    ? "border-accent-red/30 bg-accent-red/5"
    : "border-accent-amber/30 bg-accent-amber/5";

  // AI rating
  const rating = outlook.confidence >= 70 && isBullish
    ? "Strong Buy"
    : outlook.confidence >= 60 && isBullish
    ? "Buy"
    : outlook.confidence >= 70 && isBearish
    ? "Strong Sell"
    : outlook.confidence >= 60 && isBearish
    ? "Sell"
    : "Hold";

  const ratingColor = rating.includes("Buy")
    ? "text-accent-mint"
    : rating.includes("Sell")
    ? "text-accent-red"
    : "text-accent-amber";

  return (
    <motion.div
      variants={staggerItem}
      className="group rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border-strong hover:shadow-panel"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-accent-amber" />
            <h3 className="font-display text-xl text-ivory">{forecast.displayName}</h3>
          </div>
          <p className="mt-0.5 text-[10px] text-muted">
            {symbol} · {forecast.assetType}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="rounded-os p-1 text-muted opacity-0 transition group-hover:opacity-100 hover:text-accent-red"
          aria-label={`Remove ${symbol}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Price + change */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-mono text-2xl font-bold tabular text-ivory">
            {formatWatchlistPrice(forecast.currentPrice, forecast.assetType)}
          </p>
          <p className={cn("text-sm font-medium tabular", change5d >= 0 ? "text-accent-mint" : "text-accent-red")}>
            {change5d >= 0 ? "+" : ""}{change5d.toFixed(2)}% (5D)
          </p>
        </div>
        <div className={cn("rounded-os border px-2 py-1 text-[10px] font-semibold", stanceBorder, stanceColor)}>
          {structure}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <MiniMetric icon={Activity} label="RSI" value={technicals.rsi.value.toFixed(0)} color={
          technicals.rsi.value > 50 ? "text-accent-mint" : "text-accent-red"
        } />
        <MiniMetric icon={Gauge} label="Vol" value={volatilityRegime} color={
          volatilityRegime === "High" || volatilityRegime === "Elevated" ? "text-accent-red" : "text-accent-mint"
        } />
        <MiniMetric icon={TrendingUp} label="Mom" value={momentumStable ? "Stable" : "Weak"} color={
          momentumStable ? "text-accent-mint" : "text-accent-red"
        } />
        <MiniMetric icon={Sparkles} label="AI" value={rating} color={ratingColor} />
      </div>

      {/* Probability mini-bars */}
      <div className="space-y-1 mb-3">
        <MiniBar label="Bull" value={outlook.bullish} color="bg-accent-mint" />
        <MiniBar label="Bear" value={outlook.bearish} color="bg-accent-red" />
      </div>

      {/* Action */}
      <Link href={`/os/forecast?symbol=${symbol}`} className="block">
        <div className="flex items-center justify-center gap-2 rounded-os border border-border/60 bg-surface-950/60 py-2 text-xs text-muted transition hover:border-accent-amber hover:text-accent-amber">
          <TrendingUp className="h-3 w-3" />
          Full intelligence report
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function MiniMetric({ icon: Icon, label, value, color }: { icon: typeof Activity; label: string; value: string; color: string }) {
  return (
    <div className="rounded-os bg-surface-950/60 p-1.5 text-center">
      <p className="text-[8px] uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("text-[10px] font-semibold mt-0.5", color)}>{value}</p>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-[9px] text-muted">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-700">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-6 text-right font-mono text-[9px] text-muted tabular">{value}%</span>
    </div>
  );
}

function formatWatchlistPrice(price: number, assetType: string): string {
  if (assetType === "commodity") {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (assetType === "index") {
    return price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
