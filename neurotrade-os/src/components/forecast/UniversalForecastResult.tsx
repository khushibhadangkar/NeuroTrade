"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart2,
  ChevronDown,
  Compass,
  Gauge,
  Layers,
  Newspaper,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import {
  type UniversalForecast,
  assetTypeLabel,
  dominantOutlook,
} from "@/services/forecast";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface UniversalForecastResultProps {
  forecast: UniversalForecast;
  index?: number;
}

/**
 * The universal forecast result — replaces the LSTM-shaped result block.
 * Adapts dynamically to asset type (index/equity/commodity) and shows:
 *   - Header with asset metadata and current price
 *   - AI narrative (asset-aware)
 *   - Probabilistic outlook (bullish/bearish/range-bound bars)
 *   - Technical structure card
 *   - Key drivers and relevant themes
 */
export function UniversalForecastResult({
  forecast,
  index = 0,
}: UniversalForecastResultProps) {
  const [showTechnicals, setShowTechnicals] = useState(false);
  const dominant = dominantOutlook(forecast.outlook);

  const stanceColor =
    forecast.structure.includes("Bullish")
      ? "text-accent-mint"
      : forecast.structure.includes("Bearish")
      ? "text-accent-red"
      : "text-accent-amber";

  const stanceBorder =
    forecast.structure.includes("Bullish")
      ? "border-accent-mint/30 bg-accent-mint/5"
      : forecast.structure.includes("Bearish")
      ? "border-accent-red/30 bg-accent-red/5"
      : "border-accent-amber/30 bg-accent-amber/5";

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.06 }}
      className="space-y-8"
    >
      {/* ── Header band ─────────────────────────────────────────────── */}
      <header className="grid gap-6 border-y border-border py-8 lg:grid-cols-[0.45fr_0.55fr] lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent-amber">
              AI Intelligence
            </span>
            <span className="rounded-os border border-border bg-surface-900/60 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-muted">
              {assetTypeLabel(forecast.assetType)}
            </span>
          </div>

          <h3 className="mt-4 font-display text-6xl text-ivory sm:text-7xl">
            {forecast.displayName}
          </h3>
          <p className="mt-1 font-mono text-xs text-muted">
            {forecast.symbol} · {forecast.yfSymbol}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-os border px-3 py-1.5 text-xs font-medium",
                stanceBorder,
                stanceColor
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  stanceColor.replace("text-", "bg-")
                )}
              />
              {forecast.structure}
            </span>
            <span className="rounded-os border border-border bg-surface-900/40 px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted">
              Confidence: {forecast.outlook.directionalConfidence}
            </span>
            <span className="rounded-os border border-border bg-surface-900/40 px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted">
              Volatility: {forecast.volatilityRegime}
            </span>
          </div>
        </div>

        <div className="lg:text-right">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
            Current price
          </p>
          <p className="mt-2 font-display text-5xl text-ivory tabular sm:text-6xl">
            {formatPrice(forecast.currentPrice, forecast.assetType)}
          </p>
          <div className="mt-2 flex items-center gap-3 lg:justify-end">
            <ChangeChip
              label="5D"
              value={forecast.technicals.priceAction.change5d}
            />
            <ChangeChip
              label="20D"
              value={forecast.technicals.priceAction.change20d}
            />
          </div>
        </div>
      </header>

      {/* ── AI Narrative ────────────────────────────────────────────── */}
      <section className="rounded-panel border border-border/60 bg-surface-900/40 p-6 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-accent-amber" />
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
            AI Interpretation
          </span>
        </div>
        <p className="text-sm leading-7 text-ivory/90">{forecast.narrative}</p>
      </section>

      {/* ── Advanced Analysis (progressive disclosure) ──────────────── */}
      <div className="border-t border-border/40 pt-5">
        <button
          onClick={() => setShowTechnicals(!showTechnicals)}
          className="flex items-center gap-2 text-xs text-muted hover:text-ivory transition mb-4"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showTechnicals && "rotate-180")} />
          {showTechnicals ? "Hide" : "View"} detailed analysis
        </button>

        {showTechnicals && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Three-column intelligence panels */}
            <div className="grid gap-4 lg:grid-cols-3">
              <ProbabilisticOutlookPanel forecast={forecast} dominant={dominant} />
              <TechnicalStructurePanel forecast={forecast} />
              <ConfidencePanel forecast={forecast} />
            </div>

            {/* Key drivers + themes */}
            <div className="grid gap-4 lg:grid-cols-2">
              <DriversPanel
                icon={Compass}
                title="Key Drivers"
                subtitle="What moves this asset"
                items={forecast.keyDrivers}
              />
              <DriversPanel
                icon={Newspaper}
                title="Relevant Themes"
                subtitle="What to watch this week"
                items={forecast.relevantThemes}
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.article>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ChangeChip({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-os border px-2 py-0.5 text-[11px] tabular",
        positive
          ? "border-accent-mint/30 bg-accent-mint/5 text-accent-mint"
          : "border-accent-red/30 bg-accent-red/5 text-accent-red"
      )}
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {label}: {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

function ProbabilisticOutlookPanel({
  forecast,
  dominant,
}: {
  forecast: UniversalForecast;
  dominant: "Bullish" | "Bearish" | "Range-Bound";
}) {
  const outlook = forecast.outlook;
  const rows = [
    {
      label: "Bullish",
      value: outlook.bullish,
      color: "bg-accent-mint",
      text: "text-accent-mint",
      icon: TrendingUp,
    },
    {
      label: "Range-Bound",
      value: outlook.consolidation,
      color: "bg-accent-amber",
      text: "text-accent-amber",
      icon: Waves,
    },
    {
      label: "Bearish",
      value: outlook.bearish,
      color: "bg-accent-red",
      text: "text-accent-red",
      icon: TrendingDown,
    },
  ];

  return (
    <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
            Probabilistic Outlook
          </p>
          <p className="mt-1 text-xs text-muted">
            {forecast.displayName} · {dominant} bias
          </p>
        </div>
        <span className="rounded-os border border-border bg-surface-950/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted">
          {outlook.confidence}% conf
        </span>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <motion.div key={r.label} variants={staggerItem}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", r.text)} />
                  <span className="text-xs text-muted">{r.label}</span>
                </div>
                <span className={cn("font-mono text-sm font-bold tabular", r.text)}>
                  {r.value}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-700">
                <motion.div
                  className={cn("h-full rounded-full", r.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${r.value}%` }}
                  transition={{
                    duration: 0.9,
                    delay: 0.2,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <p className="mt-4 text-[9px] leading-relaxed text-muted/60">
        Probabilities derived from trend alignment, momentum, recent action,
        and volatility regime. Not investment advice.
      </p>
    </div>
  );
}

function TechnicalStructurePanel({ forecast }: { forecast: UniversalForecast }) {
  const t = forecast.technicals;
  const items = [
    {
      icon: Activity,
      label: "RSI(14)",
      value: t.rsi.value.toFixed(1),
      hint: t.rsi.overbought
        ? "Overbought"
        : t.rsi.oversold
        ? "Oversold"
        : t.rsi.value > 50
        ? "Bullish bias"
        : "Bearish bias",
      color:
        t.rsi.overbought || t.rsi.oversold
          ? "text-accent-amber"
          : t.rsi.value > 50
          ? "text-accent-mint"
          : "text-accent-red",
    },
    {
      icon: Zap,
      label: "MACD",
      value: t.macd.bullish ? "Bullish" : "Bearish",
      hint: t.macd.expanding ? "Expanding" : "Contracting",
      color: t.macd.bullish ? "text-accent-mint" : "text-accent-red",
    },
    {
      icon: Layers,
      label: "EMA Stack",
      value: t.ema.aligned
        ? "Aligned"
        : t.ema.priceAbove20
        ? "Above 20"
        : "Below 20",
      hint: `20: ${t.ema.ema20.toLocaleString()} · 50: ${t.ema.ema50.toLocaleString()}`,
      color: t.ema.aligned ? "text-accent-mint" : "text-muted",
    },
    {
      icon: BarChart2,
      label: "ATR%",
      value: `${t.atr.percent.toFixed(2)}%`,
      hint: `${forecast.volatilityRegime} volatility`,
      color:
        t.atr.percent > 2.5
          ? "text-accent-red"
          : t.atr.percent > 1.5
          ? "text-accent-amber"
          : "text-muted",
    },
  ];

  return (
    <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
      <div className="mb-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
          Technical Structure
        </p>
        <p className="mt-1 text-xs text-muted">{forecast.structure}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-os border border-border/40 bg-surface-950/60 p-3"
            >
              <div className="mb-1 flex items-center gap-1.5">
                <Icon className={cn("h-3 w-3", item.color)} />
                <span className="text-[9px] uppercase tracking-wider text-muted">
                  {item.label}
                </span>
              </div>
              <p className={cn("text-xs font-semibold", item.color)}>
                {item.value}
              </p>
              <p className="mt-0.5 text-[10px] text-muted">{item.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border/40 pt-3 text-[10px] text-muted">
        <div className="flex justify-between">
          <span>Bollinger position</span>
          <span className="tabular text-ivory/80">
            {(forecast.technicals.bollinger.position * 100).toFixed(0)}%
          </span>
        </div>
        <div className="mt-1 flex justify-between">
          <span>Range</span>
          <span className="tabular text-ivory/80">
            {forecast.technicals.bollinger.lower.toLocaleString()} ·{" "}
            {forecast.technicals.bollinger.upper.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function ConfidencePanel({ forecast }: { forecast: UniversalForecast }) {
  const trendConf = forecast.trendConfidence;
  const directional = forecast.outlook.directionalConfidence;
  const momentum = forecast.momentumStable ? "Stable" : "Deteriorating";
  const volExp = forecast.outlook.volatilityExpectation;

  return (
    <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-accent-amber" />
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
          Conviction Layer
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-muted">Trend confidence</span>
            <span className="font-mono text-sm font-bold text-ivory tabular">
              {trendConf}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-700">
            <motion.div
              className={cn(
                "h-full rounded-full",
                trendConf >= 70
                  ? "bg-accent-mint"
                  : trendConf >= 50
                  ? "bg-accent-amber"
                  : "bg-accent-red"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${trendConf}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <Row label="Directional confidence" value={directional} />
        <Row label="Momentum" value={momentum} />
        <Row label="Volatility expectation" value={volExp} />
        <Row
          label="20-day move"
          value={`${forecast.technicals.priceAction.change20d >= 0 ? "+" : ""}${forecast.technicals.priceAction.change20d.toFixed(2)}%`}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border/40 pt-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs text-ivory/90">{value}</span>
    </div>
  );
}

function DriversPanel({
  icon: Icon,
  title,
  subtitle,
  items,
}: {
  icon: typeof Compass;
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-accent-amber" />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
            {title}
          </p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item, i) => (
          <motion.li
            key={item}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex items-start gap-3 rounded-os border border-border/40 bg-surface-950/60 px-3 py-2 text-xs text-ivory/85"
          >
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent-amber" />
            <span>{item}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatPrice(price: number, assetType: string): string {
  if (assetType === "commodity") {
    // Commodities are USD-based with 2 decimals
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (assetType === "index") {
    return price.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  // Equity in INR
  return `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
