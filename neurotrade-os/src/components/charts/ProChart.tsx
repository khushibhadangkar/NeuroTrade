"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Clock,
  Maximize2,
  Minus,
  Plus,
  Eye,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/finance";
import { CandlestickCanvas } from "./CandlestickCanvas";
import { RSIPanel } from "./RSIPanel";
import { MACDPanel } from "./MACDPanel";
import { generateMarketData, type CandleData } from "./chartData";

// ─── Types ────────────────────────────────────────────────────────────────

type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";
type Indicator = "rsi" | "macd" | "ma" | "prediction";

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

// ─── Component ────────────────────────────────────────────────────────────

interface ProChartProps {
  symbol?: string;
  className?: string;
}

/**
 * Professional cinematic trading chart — TradingView-style interface
 * with AI prediction overlay, confidence zones, and technical indicators.
 */
export function ProChart({ symbol = "AAPL", className }: ProChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("3M");
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(
    new Set(["prediction", "ma"])
  );
  const [zoom, setZoom] = useState(1);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [showIndicatorPanel, setShowIndicatorPanel] = useState(true);

  const data = useMemo(() => generateMarketData(timeframe), [timeframe]);

  const latestCandle = data.candles[data.candles.length - 1];
  const prevCandle = data.candles[data.candles.length - 2];
  const dayChange = latestCandle
    ? ((latestCandle.close - (prevCandle?.close ?? latestCandle.open)) /
        (prevCandle?.close ?? latestCandle.open)) *
      100
    : 0;

  const toggleIndicator = useCallback((ind: Indicator) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind);
      else next.add(ind);
      return next;
    });
  }, []);

  const displayCandle = hoveredCandle ?? latestCandle;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-panel border border-border/60",
        "bg-surface-900/40 backdrop-blur-xl",
        className
      )}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-panel"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 50% 0%, rgba(183,155,98,0.03), transparent 60%)",
        }}
      />

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between border-b border-border/40 px-4 py-2.5">
        {/* Symbol + Price */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-xl font-semibold text-ivory">{symbol}</h2>
            <span className="rounded-sm bg-accent-amber/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-accent-amber">
              AI
            </span>
          </div>

          {/* OHLC display */}
          {displayCandle && (
            <motion.div
              key={displayCandle.date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4 text-xs tabular"
            >
              <span className="text-muted">
                O <span className="text-ivory">{formatCurrency(displayCandle.open)}</span>
              </span>
              <span className="text-muted">
                H{" "}
                <span className="text-accent-mint">
                  {formatCurrency(displayCandle.high)}
                </span>
              </span>
              <span className="text-muted">
                L{" "}
                <span className="text-accent-red">
                  {formatCurrency(displayCandle.low)}
                </span>
              </span>
              <span className="text-muted">
                C <span className="text-ivory">{formatCurrency(displayCandle.close)}</span>
              </span>
              <span
                className={cn(
                  "font-medium",
                  dayChange >= 0 ? "text-accent-mint" : "text-accent-red"
                )}
              >
                {formatPercent(dayChange)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center gap-0.5 rounded-os border border-border/40 bg-surface-950/60 p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "rounded-os px-2.5 py-1 text-[10px] font-semibold transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-amber",
                  tf === timeframe
                    ? "bg-accent-amber/15 text-accent-amber shadow-glow-amber"
                    : "text-muted hover:text-ivory"
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicator toggle */}
          <button
            onClick={() => setShowIndicatorPanel(!showIndicatorPanel)}
            className={cn(
              "rounded-os border border-border/40 p-1.5 transition-all",
              showIndicatorPanel
                ? "bg-accent-amber/10 text-accent-amber"
                : "text-muted hover:text-ivory"
            )}
            title="Toggle indicators"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>

          {/* Zoom */}
          <div className="flex items-center gap-0.5 rounded-os border border-border/40 bg-surface-950/60 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="rounded-os p-1 text-muted transition hover:text-ivory"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-[10px] tabular text-muted">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="rounded-os p-1 text-muted transition hover:text-ivory"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <button className="rounded-os p-1.5 text-muted transition hover:text-ivory">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Indicator toolbar ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showIndicatorPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 overflow-hidden border-b border-border/30"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-[10px] uppercase tracking-wider text-muted">
                Overlays
              </span>
              {(
                [
                  { id: "prediction" as Indicator, label: "AI Prediction", color: "amber" },
                  { id: "ma" as Indicator, label: "MA 20/50", color: "cyan" },
                  { id: "rsi" as Indicator, label: "RSI", color: "mint" },
                  { id: "macd" as Indicator, label: "MACD", color: "amber" },
                ] as const
              ).map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => toggleIndicator(ind.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-os border px-2.5 py-1 text-[10px] font-medium transition-all duration-200",
                    activeIndicators.has(ind.id)
                      ? ind.color === "amber"
                        ? "border-accent-amber/30 bg-accent-amber/10 text-accent-amber"
                        : ind.color === "mint"
                        ? "border-accent-mint/30 bg-accent-mint/10 text-accent-mint"
                        : "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan"
                      : "border-border/40 text-muted hover:border-border-strong hover:text-ivory"
                  )}
                >
                  <Eye className="h-3 w-3" />
                  {ind.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Floating AI confidence badge ───────────────────────────────── */}
      {activeIndicators.has("prediction") && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute right-5 top-24 z-30 rounded-panel border border-accent-amber/20 bg-surface-950/80 px-4 py-3 shadow-panel backdrop-blur-md"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="h-3.5 w-3.5 text-accent-amber" />
            <span className="text-[9px] uppercase tracking-wider text-muted">
              AI Confidence
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-accent-amber">
              {data.confidence}%
            </span>
            <span
              className={cn(
                "text-[10px] font-medium",
                data.stance === "Bullish" ? "text-accent-mint" : "text-accent-red"
              )}
            >
              {data.stance}
            </span>
          </div>
          {/* Confidence bar */}
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent-amber/60 to-accent-amber"
              initial={{ width: 0 }}
              animate={{ width: `${data.confidence}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* ─── Main chart canvas ──────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 min-h-0">
        <CandlestickCanvas
          data={data}
          zoom={zoom}
          showPrediction={activeIndicators.has("prediction")}
          showMA={activeIndicators.has("ma")}
          onHoverCandle={setHoveredCandle}
        />
      </div>

      {/* ─── Sub-indicators ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeIndicators.has("rsi") && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 100, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 border-t border-border/30"
          >
            <RSIPanel data={data.rsi} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeIndicators.has("macd") && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 100, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 border-t border-border/30"
          >
            <MACDPanel data={data.macd} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom status bar ──────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between border-t border-border/40 px-4 py-2">
        <div className="flex items-center gap-5 text-[10px]">
          <span className="flex items-center gap-1.5 text-muted">
            <TrendingUp className="h-3 w-3 text-accent-mint" />
            Trend: <span className="text-accent-mint font-medium">{data.stance}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Brain className="h-3 w-3 text-accent-amber" />
            Model: <span className="text-ivory font-medium">LSTM 128→64</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Clock className="h-3 w-3" />
            Window: <span className="text-ivory font-medium">30 days</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-mint opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-mint" />
          </span>
          <span className="text-[10px] text-accent-mint">Live</span>
        </div>
      </div>
    </div>
  );
}
