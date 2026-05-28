"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "NIFTY",
  "BANKNIFTY",
  "RELIANCE",
  "HDFCBANK",
  "GOLD",
  "COPPER",
  "CRUDE",
];
// Accepts: NIFTY, RELIANCE.NS, ^NSEI, GC=F, GOLD, etc.
const TICKER_RE = /^[A-Z\^][A-Z0-9&.\-_=]{0,19}$/;

interface SymbolSearchProps {
  onSubmit: (symbol: string) => void;
  loading?: boolean;
  initialValue?: string;
}

/**
 * Single-symbol search input — the primary entry point for the Forecast workspace.
 * Accepts a URL-driven initial value so ⌘K → symbol navigation works.
 */
export function SymbolSearch({
  onSubmit,
  loading = false,
  initialValue = "^NSEI",
}: SymbolSearchProps) {
  const [symbol, setSymbol] = useState(initialValue.toUpperCase());
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValue) setSymbol(initialValue.toUpperCase());
  }, [initialValue]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = symbol.trim().toUpperCase();
    if (!TICKER_RE.test(normalized)) {
      setError("Enter a valid ticker (e.g. NIFTY, RELIANCE, GOLD, COPPER).");
      return;
    }
    setError("");
    onSubmit(normalized);
  }

  return (
    <form onSubmit={handleSubmit} className="border-y border-border py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block">
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
            Ticker
          </span>
          <input
            aria-label="Ticker symbol"
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value.toUpperCase());
              setError("");
            }}
            disabled={loading}
            className={cn(
              "mt-3 w-full border-0 border-b bg-transparent px-0 pb-4",
              "font-display text-5xl uppercase leading-none text-ivory",
              "outline-none transition placeholder:text-muted/40",
              "focus:border-accent-amber sm:text-6xl",
              error ? "border-accent-red" : "border-border"
            )}
            placeholder="NIFTY"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 px-6"
          aria-label="Run forecast"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Run forecast
        </Button>
      </div>

      {/* Example chips */}
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span>Examples</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setSymbol(ex)}
            className={cn(
              "border-b border-transparent text-ivory/70 transition",
              "hover:border-accent-amber hover:text-accent-amber",
              "focus:outline-none focus:ring-2 focus:ring-accent-amber"
            )}
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-accent-red">{error}</p>}
    </form>
  );
}
