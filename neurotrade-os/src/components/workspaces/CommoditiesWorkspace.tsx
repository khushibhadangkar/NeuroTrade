"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart2,
  ChevronRight,
  Compass,
  Flame,
  Gauge,
  Globe,
  Layers,
  Newspaper,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { useCommodityIntelligence } from "@/hooks/useCommodityIntelligence";
import type { UniversalForecast } from "@/services/forecast";
import { dominantOutlook } from "@/services/forecast";
import { staggerContainer, staggerItem, fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

const COMMODITY_SYMBOLS = ["GOLD", "SILVER", "CRUDE", "NATGAS", "COPPER"] as const;

// ─── Macro context data ───────────────────────────────────────────────────

const MACRO_EVENTS = [
  { event: "Fed rate decision", impact: "Gold, Silver", direction: "Dovish = bullish metals" },
  { event: "OPEC+ production meeting", impact: "Crude Oil, NatGas", direction: "Cuts = bullish energy" },
  { event: "China PMI release", impact: "Copper, Crude", direction: "Expansion = bullish industrials" },
  { event: "US CPI inflation data", impact: "Gold, Silver", direction: "Hot CPI = bullish precious metals" },
  { event: "Dollar Index (DXY) trend", impact: "All commodities", direction: "Weak dollar = bullish commodities" },
  { event: "India RBI policy", impact: "Gold (INR)", direction: "Rate cuts = bullish gold demand" },
];

const INTERMARKET = [
  { pair: "Dollar ↔ Gold", relationship: "Inverse", note: "Weak dollar supports gold prices" },
  { pair: "Crude ↔ Airlines", relationship: "Inverse", note: "Lower crude benefits IndiGo, SpiceJet" },
  { pair: "Inflation ↔ Metals", relationship: "Positive", note: "Rising inflation drives safe-haven demand" },
  { pair: "Bond Yields ↔ Gold", relationship: "Inverse", note: "Higher real yields pressure gold" },
  { pair: "China Growth ↔ Copper", relationship: "Positive", note: "Industrial demand drives copper" },
];

/**
 * Commodities Terminal — AI-powered macroeconomic intelligence.
 *
 * Fetches real data from the universal forecast engine for each commodity,
 * then presents macro narrative, heatmap, detailed cards, and an
 * expandable intelligence report per asset.
 */
export function CommoditiesWorkspace() {
  const { data, isLoading, errors } = useCommodityIntelligence(COMMODITY_SYMBOLS);
  const [expanded, setExpanded] = useState<string | null>(null);

  const expandedForecast = expanded ? data[expanded] ?? null : null;

  // Generate macro narrative from real data
  const macroNarrative = generateMacroNarrative(data);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32">
      <WorkspaceHeader
        label="Commodities"
        title="Macro intelligence terminal."
        description="Real-time commodity analysis powered by technical structure, volatility regime, momentum, and macroeconomic context. Gold, Silver, Crude Oil, Natural Gas, Copper."
      />

      {/* ── Macro Market Narrative ─────────────────────────────────── */}
      <MacroNarrativePanel narrative={macroNarrative} isLoading={isLoading} />

      {/* ── Commodity Heatmap ──────────────────────────────────────── */}
      <section className="mt-10">
        <SectionLabel icon={Flame} label="Commodity Heatmap" />
        <CommodityHeatmap data={data} isLoading={isLoading} />
      </section>

      {/* ── Detailed Commodity Cards ─────────────────────────────── */}
      <section className="mt-10">
        <SectionLabel icon={Layers} label="Asset Intelligence" />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {COMMODITY_SYMBOLS.map((sym) => (
            <CommodityCard
              key={sym}
              symbol={sym}
              forecast={data[sym] ?? null}
              isLoading={isLoading}
              onExpand={() => setExpanded(sym)}
            />
          ))}
        </motion.div>
      </section>

      {/* ── Macro Context (progressive disclosure) ─────────────────── */}
      <section className="mt-10 border-t border-border/40 pt-6">
        <button
          onClick={() => setExpanded(expanded === "__macro" ? null : "__macro")}
          className="flex items-center gap-2 text-xs text-muted hover:text-ivory transition mb-4"
        >
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded === "__macro" && "rotate-90")} />
          {expanded === "__macro" ? "Hide" : "View"} macro context & intermarket relationships
        </button>

        {expanded === "__macro" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div>
              <SectionLabel icon={Globe} label="Macro Events & Drivers" />
              <MacroEventsGrid />
            </div>
            <div>
              <SectionLabel icon={Compass} label="Intermarket Relationships" />
              <IntermarketPanel />
            </div>
          </motion.div>
        )}
      </section>

      {/* ── Expanded Intelligence Report (modal-like overlay) ──────── */}
      <AnimatePresence>
        {expandedForecast && expanded && (
          <ExpandedReport
            forecast={expandedForecast}
            onClose={() => setExpanded(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: typeof Flame; label: string }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-accent-amber" />
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
        {label}
      </span>
    </div>
  );
}

// ─── Macro Narrative ──────────────────────────────────────────────────────

function MacroNarrativePanel({
  narrative,
  isLoading,
}: {
  narrative: string;
  isLoading: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-panel border border-border/60 bg-surface-900/40 p-6 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-accent-amber" />
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
          AI Macro Narrative
        </span>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-shimmer rounded bg-surface-800" />
          <div className="h-4 w-full animate-shimmer rounded bg-surface-800" />
          <div className="h-4 w-2/3 animate-shimmer rounded bg-surface-800" />
        </div>
      ) : (
        <p className="text-sm leading-7 text-ivory/90">{narrative}</p>
      )}
    </motion.div>
  );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────

function CommodityHeatmap({
  data,
  isLoading,
}: {
  data: Record<string, UniversalForecast | undefined>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-shimmer rounded-os bg-surface-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {COMMODITY_SYMBOLS.map((sym) => {
        const f = data[sym];
        if (!f) return <div key={sym} className="h-24 rounded-os bg-surface-800/40" />;
        const change5d = f.technicals.priceAction.change5d;
        const isBullish = change5d > 0;
        const intensity = Math.min(Math.abs(change5d) / 5, 1);
        const bg = isBullish
          ? `rgba(74, 222, 128, ${0.05 + intensity * 0.2})`
          : `rgba(248, 113, 113, ${0.05 + intensity * 0.2})`;
        const border = isBullish
          ? `rgba(74, 222, 128, ${0.15 + intensity * 0.3})`
          : `rgba(248, 113, 113, ${0.15 + intensity * 0.3})`;

        return (
          <motion.div
            key={sym}
            variants={staggerItem}
            className="rounded-os p-3 text-center"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted">
              {f.displayName}
            </p>
            <p className={cn(
              "mt-1 font-mono text-lg font-bold tabular",
              isBullish ? "text-accent-mint" : "text-accent-red"
            )}>
              {change5d >= 0 ? "+" : ""}{change5d.toFixed(2)}%
            </p>
            <p className="mt-1 text-[9px] text-muted">{f.structure}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Commodity Card ───────────────────────────────────────────────────────

function CommodityCard({
  symbol,
  forecast,
  isLoading,
  onExpand,
}: {
  symbol: string;
  forecast: UniversalForecast | null;
  isLoading: boolean;
  onExpand: () => void;
}) {
  if (isLoading || !forecast) {
    return (
      <motion.div variants={staggerItem} className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="h-5 w-24 animate-shimmer rounded bg-surface-800" />
          <div className="h-8 w-32 animate-shimmer rounded bg-surface-800" />
          <div className="h-20 animate-shimmer rounded bg-surface-800" />
        </div>
      </motion.div>
    );
  }

  const { outlook, technicals, structure, volatilityRegime, momentumStable } = forecast;
  const dominant = dominantOutlook(outlook);
  const change5d = technicals.priceAction.change5d;
  const isBullish = structure.includes("Bullish");
  const isBearish = structure.includes("Bearish");

  const stanceColor = isBullish
    ? "text-accent-mint"
    : isBearish
    ? "text-accent-red"
    : "text-accent-amber";
  const stanceBorder = isBullish
    ? "border-accent-mint/30 bg-accent-mint/5"
    : isBearish
    ? "border-accent-red/30 bg-accent-red/5"
    : "border-accent-amber/30 bg-accent-amber/5";

  return (
    <motion.div
      variants={staggerItem}
      className="group cursor-pointer rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border-strong hover:shadow-panel"
      onClick={onExpand}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display text-xl text-ivory">{forecast.displayName}</h3>
          <p className="text-[10px] text-muted">{symbol} · {forecast.assetType}</p>
        </div>
        <div className={cn("rounded-os border px-2 py-1 text-[10px] font-semibold", stanceBorder, stanceColor)}>
          {structure}
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        <p className="font-mono text-2xl font-bold tabular text-ivory">
          ${forecast.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={cn("text-sm font-medium tabular", change5d >= 0 ? "text-accent-mint" : "text-accent-red")}>
          {change5d >= 0 ? "+" : ""}{change5d.toFixed(2)}% (5D)
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <MetricCell label="Volatility" value={volatilityRegime} color={
          volatilityRegime === "High" || volatilityRegime === "Elevated" ? "text-accent-red" :
          volatilityRegime === "Normal" ? "text-accent-amber" : "text-accent-mint"
        } />
        <MetricCell label="Momentum" value={momentumStable ? "Stable" : "Deteriorating"} color={
          momentumStable ? "text-accent-mint" : "text-accent-red"
        } />
        <MetricCell label="RSI" value={technicals.rsi.value.toFixed(0)} color={
          technicals.rsi.overbought ? "text-accent-red" :
          technicals.rsi.oversold ? "text-accent-mint" :
          technicals.rsi.value > 50 ? "text-accent-mint" : "text-accent-red"
        } />
        <MetricCell label="Confidence" value={`${outlook.confidence}%`} color="text-ivory" />
      </div>

      {/* Probability mini-bars */}
      <div className="space-y-1.5 mb-3">
        <ProbBar label="Bull" value={outlook.bullish} color="bg-accent-mint" />
        <ProbBar label="Range" value={outlook.consolidation} color="bg-accent-amber" />
        <ProbBar label="Bear" value={outlook.bearish} color="bg-accent-red" />
      </div>

      {/* AI snippet */}
      <p className="text-[11px] leading-5 text-muted line-clamp-2">
        {forecast.narrative.split(". ").slice(0, 2).join(". ")}.
      </p>

      {/* Expand hint */}
      <div className="mt-3 flex items-center gap-1 text-[10px] text-accent-amber opacity-0 transition-opacity group-hover:opacity-100">
        <span>Full intelligence report</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </motion.div>
  );
}

function MetricCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-os bg-surface-950/60 p-2">
      <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("text-xs font-semibold mt-0.5", color)}>{value}</p>
    </div>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[9px] text-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-700">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-7 text-right font-mono text-[10px] text-muted tabular">{value}%</span>
    </div>
  );
}

// ─── Macro Events Grid ────────────────────────────────────────────────────

function MacroEventsGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {MACRO_EVENTS.map((ev) => (
        <div
          key={ev.event}
          className="rounded-os border border-border/40 bg-surface-900/40 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-3 w-3 text-accent-amber" />
            <span className="text-xs font-medium text-ivory">{ev.event}</span>
          </div>
          <p className="text-[11px] text-muted">
            <span className="text-ivory/80">Impacts:</span> {ev.impact}
          </p>
          <p className="mt-1 text-[11px] text-accent-amber/80">{ev.direction}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Intermarket Panel ────────────────────────────────────────────────────

function IntermarketPanel() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {INTERMARKET.map((rel) => (
        <div
          key={rel.pair}
          className="rounded-os border border-border/40 bg-surface-900/40 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-ivory">{rel.pair}</span>
            <span className={cn(
              "rounded-os border px-2 py-0.5 text-[9px] font-semibold",
              rel.relationship === "Inverse"
                ? "border-accent-red/30 bg-accent-red/5 text-accent-red"
                : "border-accent-mint/30 bg-accent-mint/5 text-accent-mint"
            )}>
              {rel.relationship}
            </span>
          </div>
          <p className="text-[11px] text-muted">{rel.note}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Expanded Intelligence Report ─────────────────────────────────────────

function ExpandedReport({
  forecast,
  onClose,
}: {
  forecast: UniversalForecast;
  onClose: () => void;
}) {
  const { technicals, outlook } = forecast;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] overflow-y-auto bg-surface-950/92 px-5 py-12 backdrop-blur-md"
    >
      <div className="mx-auto max-w-4xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="mb-6 flex items-center gap-2 rounded-os border border-border px-3 py-1.5 text-xs text-muted transition hover:bg-surface-800 hover:text-ivory"
        >
          <X className="h-3.5 w-3.5" />
          Close report
        </button>

        {/* Header */}
        <div className="mb-8 border-b border-border pb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent-amber">
            Intelligence Report
          </p>
          <h2 className="mt-3 font-display text-5xl text-ivory sm:text-6xl">
            {forecast.displayName}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-os border border-border bg-surface-900/60 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted">
              Commodity
            </span>
            <span className={cn(
              "rounded-os border px-2.5 py-1 text-[10px] font-semibold",
              forecast.structure.includes("Bullish")
                ? "border-accent-mint/30 bg-accent-mint/5 text-accent-mint"
                : forecast.structure.includes("Bearish")
                ? "border-accent-red/30 bg-accent-red/5 text-accent-red"
                : "border-accent-amber/30 bg-accent-amber/5 text-accent-amber"
            )}>
              {forecast.structure}
            </span>
            <span className="text-xs text-muted">
              ${forecast.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* AI Narrative */}
        <section className="mb-8 rounded-panel border border-border/60 bg-surface-900/40 p-6 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent-amber" />
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
              AI Interpretation
            </span>
          </div>
          <p className="text-sm leading-7 text-ivory/90">{forecast.narrative}</p>
        </section>

        {/* Three-column grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {/* Probabilistic Outlook */}
          <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-accent-amber" />
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
                Probabilistic Outlook
              </span>
            </div>
            <div className="space-y-3">
              <ProbBarLarge label="Bullish" value={outlook.bullish} color="bg-accent-mint" textColor="text-accent-mint" />
              <ProbBarLarge label="Range-Bound" value={outlook.consolidation} color="bg-accent-amber" textColor="text-accent-amber" />
              <ProbBarLarge label="Bearish" value={outlook.bearish} color="bg-accent-red" textColor="text-accent-red" />
            </div>
            <div className="mt-4 border-t border-border/40 pt-3 text-[11px] text-muted">
              <div className="flex justify-between"><span>Confidence</span><span className="text-ivory">{outlook.confidence}%</span></div>
              <div className="mt-1 flex justify-between"><span>Directional</span><span className="text-ivory">{outlook.directionalConfidence}</span></div>
              <div className="mt-1 flex justify-between"><span>Vol expectation</span><span className="text-ivory">{outlook.volatilityExpectation}</span></div>
            </div>
          </div>

          {/* Technical Structure */}
          <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart2 className="h-3.5 w-3.5 text-accent-amber" />
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
                Technical Structure
              </span>
            </div>
            <div className="space-y-3 text-[11px]">
              <Row label="RSI(14)" value={technicals.rsi.value.toFixed(1)} hint={technicals.rsi.overbought ? "Overbought" : technicals.rsi.oversold ? "Oversold" : "Neutral"} />
              <Row label="MACD" value={technicals.macd.bullish ? "Bullish" : "Bearish"} hint={technicals.macd.expanding ? "Expanding" : "Contracting"} />
              <Row label="EMA Stack" value={technicals.ema.aligned ? "Aligned" : "Mixed"} hint={`20: ${technicals.ema.ema20.toFixed(2)}`} />
              <Row label="ATR%" value={`${technicals.atr.percent.toFixed(2)}%`} hint={forecast.volatilityRegime} />
              <Row label="Bollinger" value={`${(technicals.bollinger.position * 100).toFixed(0)}%`} hint={`${technicals.bollinger.lower.toFixed(2)} – ${technicals.bollinger.upper.toFixed(2)}`} />
            </div>
          </div>

          {/* Key Drivers & Themes */}
          <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <Newspaper className="h-3.5 w-3.5 text-accent-amber" />
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
                Key Drivers
              </span>
            </div>
            <ul className="space-y-2">
              {forecast.keyDrivers.map((d) => (
                <li key={d} className="flex items-start gap-2 text-xs text-ivory/85">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-amber" />
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border/40 pt-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">Themes to watch</p>
              <div className="flex flex-wrap gap-1.5">
                {forecast.relevantThemes.map((t) => (
                  <span key={t} className="rounded-os border border-border bg-surface-950/60 px-2 py-0.5 text-[10px] text-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Price Action */}
        <section className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-accent-amber" />
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
              Price Action & Momentum
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatBlock label="5-Day Change" value={`${technicals.priceAction.change5d >= 0 ? "+" : ""}${technicals.priceAction.change5d.toFixed(2)}%`} positive={technicals.priceAction.change5d >= 0} />
            <StatBlock label="20-Day Change" value={`${technicals.priceAction.change20d >= 0 ? "+" : ""}${technicals.priceAction.change20d.toFixed(2)}%`} positive={technicals.priceAction.change20d >= 0} />
            <StatBlock label="Trend Confidence" value={`${forecast.trendConfidence}%`} positive={forecast.trendConfidence >= 60} />
            <StatBlock label="Momentum" value={forecast.momentumStable ? "Stable" : "Deteriorating"} positive={forecast.momentumStable} />
          </div>
        </section>

        <p className="mt-6 text-center text-[9px] text-muted/60">
          Analysis derived from real market data and technical indicators. Not investment advice.
        </p>
      </div>
    </motion.div>
  );
}

function ProbBarLarge({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className={cn("font-mono text-sm font-bold tabular", textColor)}>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-700">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 pb-2">
      <span className="text-muted">{label}</span>
      <div className="text-right">
        <span className="text-ivory/90">{value}</span>
        <span className="ml-2 text-[10px] text-muted">{hint}</span>
      </div>
    </div>
  );
}

function StatBlock({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="rounded-os bg-surface-950/60 p-3 text-center">
      <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("mt-1 font-mono text-sm font-bold tabular", positive ? "text-accent-mint" : "text-accent-red")}>
        {value}
      </p>
    </div>
  );
}

// ─── Macro Narrative Generator ────────────────────────────────────────────

function generateMacroNarrative(data: Record<string, UniversalForecast | undefined>): string {
  const forecasts = Object.values(data).filter(Boolean) as UniversalForecast[];
  if (forecasts.length === 0) return "Loading commodity intelligence...";

  const bullishCount = forecasts.filter((f) => f.structure.includes("Bullish")).length;
  const bearishCount = forecasts.filter((f) => f.structure.includes("Bearish")).length;

  const gold = data["GOLD"];
  const crude = data["CRUDE"];
  const copper = data["COPPER"];

  const parts: string[] = [];

  // Overall sentiment
  if (bullishCount > bearishCount) {
    parts.push("Commodity markets are showing broad bullish momentum with the majority of tracked assets in positive technical structures");
  } else if (bearishCount > bullishCount) {
    parts.push("Commodity markets are under pressure with bearish technical structures dominating across most asset classes");
  } else {
    parts.push("Commodity markets are mixed with no clear directional consensus across asset classes");
  }

  // Gold context
  if (gold) {
    if (gold.structure.includes("Bullish")) {
      parts.push("Gold remains well-bid, suggesting persistent safe-haven demand and potential dollar weakness");
    } else if (gold.structure.includes("Bearish")) {
      parts.push("Gold is under pressure — rising real yields and dollar strength are weighing on precious metals");
    }
  }

  // Crude context
  if (crude) {
    if (crude.structure.includes("Bullish")) {
      parts.push("Energy prices are firming on supply discipline and improving demand expectations");
    } else if (crude.structure.includes("Bearish")) {
      parts.push("Crude oil weakness reflects demand concerns and potential OPEC+ compliance issues");
    }
  }

  // Copper context
  if (copper) {
    if (copper.structure.includes("Bullish")) {
      parts.push("Copper strength signals improving global industrial demand — positive for the growth outlook");
    } else if (copper.structure.includes("Bearish")) {
      parts.push("Copper weakness suggests industrial demand concerns, particularly from China");
    }
  }

  // India impact
  if (crude && crude.structure.includes("Bearish")) {
    parts.push("For India, lower crude prices reduce the import bill — positive for OMCs, airlines, and the current account deficit");
  } else if (crude && crude.structure.includes("Bullish")) {
    parts.push("Rising crude prices increase India's import costs — watch for INR pressure and OMC margin compression");
  }

  return parts.join(". ") + ".";
}
