"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BarChart2,
  Brain,
  ChevronDown,
  Globe,
  Gauge,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMarketOverview, useCommodities, useTechnicals } from "@/hooks/useMarketData";
import { useMarketIntelligence } from "@/hooks/useMarketIntelligence";
import { useMarketNews } from "@/hooks/useNews";
import { formatINR, getMarketSession } from "@/lib/indian-market";
import { formatPercent } from "@/lib/finance";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { UniversalForecast } from "@/services/forecast";

/**
 * Market Intelligence Home — clean, calm, daily-use workspace.
 *
 * Progressive disclosure:
 *   Level 1 (default): Sentiment + indices + outlook summary
 *   Level 2 (expandable): Technical details, confidence layer, drivers
 *
 * All data driven by real computed technicals from the backend.
 */
export function MarketHome() {
  const { data: marketData, isLoading: marketLoading, refetch } = useMarketOverview();
  const { data: commoditiesData } = useCommodities();
  const { data: niftyTechnicals } = useTechnicals("NIFTY");
  const { niftyForecast, bankNiftyForecast, isLoading: intelLoading } = useMarketIntelligence();
  const { data: newsData } = useMarketNews();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const session = getMarketSession();
  const sessionLabel = { pre: "Pre-Market", open: "Market Open", post: "Post-Market", closed: "Market Closed" }[session];

  const indices = marketData?.indices ?? [];
  const commodities = commoditiesData ?? [];
  const hasLiveData = indices.length > 0;

  const sentiment = deriveSentiment(niftyForecast, bankNiftyForecast);
  const outlook = deriveOutlook(niftyForecast);
  const confidence = deriveConfidenceLayer(niftyForecast);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="pt-10 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold",
            session === "open" ? "bg-accent-mint/10 text-accent-mint border border-accent-mint/20" :
            session === "pre" ? "bg-accent-amber/10 text-accent-amber border border-accent-amber/20" :
            "bg-surface-800 text-muted border border-border"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", session === "open" ? "bg-accent-mint animate-pulse" : "bg-muted")} />
            {sessionLabel}
          </span>
          {hasLiveData && (
            <span className="flex items-center gap-1 text-[10px] text-accent-mint">
              <span className="h-1 w-1 rounded-full bg-accent-mint animate-pulse" />
              Live
            </span>
          )}
          <span className="text-[10px] text-muted ml-auto">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </span>
          <button onClick={() => refetch()} className="text-muted hover:text-ivory transition" title="Refresh">
            <RefreshCw className={cn("h-3 w-3", marketLoading && "animate-spin")} />
          </button>
        </div>

        {/* Sentiment headline */}
        {sentiment ? (
          <div>
            <h1 className="font-display text-3xl text-ivory sm:text-4xl leading-tight">
              Market is{" "}
              <span className={cn(
                sentiment.color === "mint" ? "text-accent-mint" :
                sentiment.color === "red" ? "text-accent-red" : "text-accent-amber"
              )}>
                {sentiment.label}
              </span>
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted max-w-2xl">{sentiment.narrative}</p>
          </div>
        ) : (
          <div>
            <div className="h-9 w-64 bg-surface-800 animate-shimmer rounded mb-3" />
            <div className="h-4 w-96 bg-surface-800 animate-shimmer rounded" />
          </div>
        )}
      </div>

      {/* ─── Indices (always visible) ──────────────────────────────── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {indices.length > 0 ? indices.map((idx) => (
          <motion.div key={idx.symbol} variants={staggerItem} className="rounded-panel border border-border/60 bg-surface-900/40 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-medium text-muted mb-1">{idx.name ?? idx.symbol}</p>
            <p className="font-mono text-lg font-bold tabular text-ivory">{idx.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
            <p className={cn("text-xs font-medium tabular mt-0.5", idx.changePct >= 0 ? "text-accent-mint" : "text-accent-red")}>
              {idx.changePct >= 0 ? "+" : ""}{formatPercent(idx.changePct)}
            </p>
          </motion.div>
        )) : (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} variants={staggerItem} className="rounded-panel border border-border/60 bg-surface-900/40 p-4 backdrop-blur-sm">
              <div className="h-3 w-16 bg-surface-800 animate-shimmer rounded mb-2" />
              <div className="h-6 w-24 bg-surface-800 animate-shimmer rounded" />
            </motion.div>
          ))
        )}
      </motion.div>

      {/* ─── Probabilistic Outlook (essential view) ────────────────── */}
      {outlook && (
        <section className="mb-8">
          <div className="rounded-panel border border-border/60 bg-surface-900/40 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <Brain className="h-4 w-4 text-accent-amber" />
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">NIFTY Outlook</span>
              <span className="ml-auto text-[10px] text-muted">Confidence {outlook.confidence}%</span>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
              {/* Probability bars */}
              <div className="space-y-3">
                {[
                  { label: "Bullish", value: outlook.bullish, color: "bg-accent-mint", text: "text-accent-mint" },
                  { label: "Range-Bound", value: outlook.consolidation, color: "bg-accent-amber", text: "text-accent-amber" },
                  { label: "Bearish", value: outlook.bearish, color: "bg-accent-red", text: "text-accent-red" },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted">{bar.label}</span>
                      <span className={cn("font-mono text-xs font-bold", bar.text)}>{bar.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-700 overflow-hidden">
                      <motion.div className={cn("h-full rounded-full", bar.color)} initial={{ width: 0 }} animate={{ width: `${bar.value}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* AI reasoning */}
              <div>
                <p className="text-xs leading-6 text-muted">{outlook.reasoning}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {outlook.drivers.map((d) => (
                    <span key={d} className="rounded-os border border-accent-amber/20 bg-accent-amber/5 px-2 py-0.5 text-[9px] text-accent-amber">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Commodities strip (compact) ──────────────────────────── */}
      {commodities.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-3.5 w-3.5 text-muted" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted">Commodities</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {commodities.map((c) => (
              <div key={c.symbol} className="rounded-os border border-border/40 bg-surface-900/30 px-3 py-2.5">
                <p className="text-[10px] text-muted">{c.name}</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-xs text-ivory">{formatINR(c.priceINR)}</span>
                  <span className={cn("text-[10px] font-medium tabular", c.changePct >= 0 ? "text-accent-mint" : "text-accent-red")}>
                    {formatPercent(c.changePct)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Advanced Analysis (progressive disclosure) ────────────── */}
      <div className="border-t border-border/40 pt-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs text-muted hover:text-ivory transition mb-4"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")} />
          {showAdvanced ? "Hide" : "Show"} advanced analysis
        </button>

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Confidence Layer */}
            {confidence && (
              <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="h-3.5 w-3.5 text-accent-amber" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted">Confidence Layer</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ConfidenceMetric label="Trend" value={`${confidence.trendConfidence}%`} color={confidence.trendConfidence >= 70 ? "text-accent-mint" : confidence.trendConfidence >= 50 ? "text-accent-amber" : "text-accent-red"} />
                  <ConfidenceMetric label="Volatility" value={confidence.volatilityRegime} color={confidence.volatilityRegime === "Low" || confidence.volatilityRegime === "Normal" ? "text-accent-mint" : "text-accent-red"} />
                  <ConfidenceMetric label="Momentum" value={confidence.momentumStable ? "Stable" : "Weak"} color={confidence.momentumStable ? "text-accent-mint" : "text-accent-red"} />
                  <ConfidenceMetric label="Direction" value={confidence.directional} color={confidence.directional === "Strong" ? "text-accent-mint" : confidence.directional === "Moderate" ? "text-accent-amber" : "text-accent-red"} />
                </div>
              </div>
            )}

            {/* NIFTY Technicals */}
            {niftyTechnicals && (
              <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="h-3.5 w-3.5 text-accent-amber" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted">NIFTY Technical Structure</span>
                </div>
                <div className={cn("rounded-os border px-3 py-2 mb-3 text-xs font-semibold inline-block",
                  niftyTechnicals.structure.includes("Bullish") ? "border-accent-mint/20 bg-accent-mint/5 text-accent-mint" :
                  niftyTechnicals.structure.includes("Bearish") ? "border-accent-red/20 bg-accent-red/5 text-accent-red" :
                  "border-accent-amber/20 bg-accent-amber/5 text-accent-amber"
                )}>
                  {niftyTechnicals.structure}
                </div>
                <p className="text-xs leading-6 text-muted mb-4">{niftyTechnicals.explanation}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <TechCell label="RSI" value={String(niftyTechnicals.rsi.value)} />
                  <TechCell label="MACD" value={niftyTechnicals.macd.bullish ? "Bullish" : "Bearish"} />
                  <TechCell label="EMA" value={niftyTechnicals.ema.aligned ? "Aligned" : "Mixed"} />
                  <TechCell label="ATR%" value={`${niftyTechnicals.atr.percent}%`} />
                  <TechCell label="Support" value={niftyTechnicals.ema.ema20.toLocaleString("en-IN")} />
                  <TechCell label="Resistance" value={niftyTechnicals.bollinger.upper.toLocaleString("en-IN")} />
                </div>
              </div>
            )}

            {/* BANKNIFTY summary */}
            {bankNiftyForecast && (
              <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-3.5 w-3.5 text-accent-amber" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted">BANKNIFTY</span>
                </div>
                <div className={cn("rounded-os border px-3 py-2 mb-3 text-xs font-semibold inline-block",
                  bankNiftyForecast.structure.includes("Bullish") ? "border-accent-mint/20 bg-accent-mint/5 text-accent-mint" :
                  bankNiftyForecast.structure.includes("Bearish") ? "border-accent-red/20 bg-accent-red/5 text-accent-red" :
                  "border-accent-amber/20 bg-accent-amber/5 text-accent-amber"
                )}>
                  {bankNiftyForecast.structure}
                </div>
                <p className="text-xs leading-6 text-muted">
                  {bankNiftyForecast.narrative.split(". ").slice(0, 2).join(". ")}.
                </p>
              </div>
            )}

            {/* News Intelligence */}
            {newsData && newsData.length > 0 && (
              <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-3.5 w-3.5 text-accent-amber" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted">Market News</span>
                  <span className="text-[9px] text-accent-mint ml-auto">Live</span>
                </div>
                <div className="space-y-3">
                  {newsData.slice(0, 5).map((item, i) => (
                    <div key={i} className="border-b border-border/20 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs font-medium text-ivory leading-snug line-clamp-2">{item.headline}</h4>
                        <span className={cn("shrink-0 rounded-os px-1.5 py-0.5 text-[8px] font-semibold",
                          item.sentiment === "bullish" ? "bg-accent-mint/10 text-accent-mint" :
                          item.sentiment === "bearish" ? "bg-accent-red/10 text-accent-red" :
                          "bg-surface-800 text-muted"
                        )}>
                          {item.sentiment}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-muted">
                        <span>{item.source}</span>
                        <span>·</span>
                        <span>{item.affectedSectors.join(", ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <p className="mt-8 text-[8px] text-muted/40 italic text-center">
        Derived from real technical indicators via yfinance. Not investment advice.
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ConfidenceMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center rounded-os bg-surface-950/60 p-3">
      <p className="text-[9px] uppercase tracking-wider text-muted mb-1">{label}</p>
      <p className={cn("text-sm font-bold", color)}>{value}</p>
    </div>
  );
}

function TechCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-os bg-surface-950/60 p-2.5">
      <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
      <p className="text-xs font-semibold text-ivory mt-0.5">{value}</p>
    </div>
  );
}

// ─── Intelligence Derivation ──────────────────────────────────────────────

interface SentimentResult { label: string; narrative: string; color: "mint" | "red" | "amber"; }

function deriveSentiment(nifty: UniversalForecast | undefined, bankNifty: UniversalForecast | undefined): SentimentResult | null {
  if (!nifty) return null;
  const nStructure = nifty.structure;
  const bStructure = bankNifty?.structure ?? "Neutral";
  const nOutlook = nifty.outlook;
  const momentum = nifty.momentumStable;
  const vol = nifty.volatilityRegime;
  const change5d = nifty.technicals.priceAction.change5d;

  let label: string;
  let color: SentimentResult["color"];

  if (nStructure.includes("Strong Bullish") && bStructure.includes("Bullish")) { label = "Strong Bullish"; color = "mint"; }
  else if (nStructure.includes("Bullish") && momentum) { label = "Moderately Bullish"; color = "mint"; }
  else if (nStructure.includes("Bullish") && !momentum) { label = vol === "High" || vol === "Elevated" ? "Volatile Bullish" : "Mildly Bullish"; color = "amber"; }
  else if (nStructure.includes("Strong Bearish")) { label = "Strong Bearish"; color = "red"; }
  else if (nStructure.includes("Bearish") && !momentum) { label = vol === "High" || vol === "Elevated" ? "Volatile Bearish" : "Weak Bearish"; color = "red"; }
  else if (nStructure.includes("Bearish")) { label = "Moderately Bearish"; color = "red"; }
  else if (nStructure.includes("Consolidating") || nStructure.includes("Neutral")) { label = "Consolidating"; color = "amber"; }
  else { label = "Neutral"; color = "amber"; }

  const parts: string[] = [];
  if (label.includes("Bullish")) {
    parts.push(`NIFTY is in a ${nStructure.toLowerCase()} structure with ${nOutlook.bullish}% bullish probability`);
    if (bStructure.includes("Bullish")) parts.push("BANKNIFTY confirms with financial sector strength");
    if (change5d > 0) parts.push(`gaining ${change5d.toFixed(1)}% over 5 sessions`);
  } else if (label.includes("Bearish")) {
    parts.push(`NIFTY is showing ${nStructure.toLowerCase()} characteristics with ${nOutlook.bearish}% bearish probability`);
    if (change5d < 0) parts.push(`declining ${Math.abs(change5d).toFixed(1)}% over 5 sessions`);
    if (!momentum) parts.push("momentum is deteriorating");
  } else {
    parts.push(`NIFTY is in a ${nStructure.toLowerCase()} phase — consolidation probability at ${nOutlook.consolidation}%`);
  }
  return { label, color, narrative: parts.join(". ") + "." };
}

interface OutlookResult { bullish: number; bearish: number; consolidation: number; confidence: number; reasoning: string; drivers: string[]; }

function deriveOutlook(nifty: UniversalForecast | undefined): OutlookResult | null {
  if (!nifty) return null;
  const o = nifty.outlook;
  const structure = nifty.structure;
  const macd = nifty.technicals.macd;
  const ema = nifty.technicals.ema;

  const parts: string[] = [];
  if (structure.includes("Bullish")) {
    parts.push(`${structure} structure with ${ema.aligned ? "aligned" : "mixed"} EMA stack supports continuation`);
  } else if (structure.includes("Bearish")) {
    parts.push(`${structure} structure — price below key moving averages suggests weakness`);
  } else {
    parts.push("Range-bound with mixed signals — no clear directional edge");
  }
  if (macd.bullish && macd.expanding) parts.push("MACD expanding bullish — momentum building");
  else if (!macd.bullish && macd.expanding) parts.push("MACD expanding bearish — selling pressure increasing");

  return { bullish: o.bullish, bearish: o.bearish, consolidation: o.consolidation, confidence: o.confidence, reasoning: parts.join(". ") + ".", drivers: nifty.keyDrivers.slice(0, 4) };
}

interface ConfidenceResult { trendConfidence: number; volatilityRegime: string; momentumStable: boolean; directional: string; }

function deriveConfidenceLayer(nifty: UniversalForecast | undefined): ConfidenceResult | null {
  if (!nifty) return null;
  return { trendConfidence: nifty.trendConfidence, volatilityRegime: nifty.volatilityRegime, momentumStable: nifty.momentumStable, directional: nifty.outlook.directionalConfidence };
}
