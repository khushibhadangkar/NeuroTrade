"use client";

import { motion } from "framer-motion";
import { useMarketOverview } from "@/hooks/useMarketData";
import { formatINR } from "@/lib/indian-market";
import { formatPercent, changeTailwind } from "@/lib/finance";

// Fallback data shown while real data loads
const FALLBACK = [
  { symbol: "NIFTY", price: 0, change: 0 },
  { symbol: "BANKNIFTY", price: 0, change: 0 },
  { symbol: "SENSEX", price: 0, change: 0 },
];

/**
 * Market ticker strip — shows real index and commodity prices
 * from the backend. Falls back to loading state if unavailable.
 */
export function MarketTicker() {
  const { data } = useMarketOverview();

  // Build ticker items from real data
  const items: Array<{ symbol: string; price: number; change: number }> = [];

  if (data?.indices) {
    for (const idx of data.indices) {
      items.push({ symbol: idx.symbol ?? idx.name, price: idx.value, change: idx.changePct });
    }
  }
  if (data?.gainers) {
    for (const eq of data.gainers.slice(0, 3)) {
      items.push({ symbol: eq.symbol, price: eq.price, change: eq.changePct });
    }
  }
  if (data?.commodities) {
    for (const c of data.commodities) {
      items.push({ symbol: c.symbol, price: c.priceINR, change: c.changePct });
    }
  }

  const tickerItems = items.length > 0 ? items : FALLBACK;
  // Triple for seamless loop
  const loopItems = [...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <div
      className="relative flex h-full items-center overflow-hidden"
      aria-label="Indian market ticker"
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 z-10 h-full w-8 bg-gradient-to-r from-surface-950/88 to-transparent" />

      <motion.div
        className="flex items-center gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-33.33%"] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      >
        {loopItems.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-xs tabular">
            <span className="font-medium text-ivory">{item.symbol}</span>
            {item.price > 0 ? (
              <>
                <span className="text-muted">{formatINR(item.price)}</span>
                <span className={changeTailwind(item.change)}>
                  {formatPercent(item.change)}
                </span>
              </>
            ) : (
              <span className="text-muted/40">—</span>
            )}
          </span>
        ))}
      </motion.div>

      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 z-10 h-full w-8 bg-gradient-to-l from-surface-950/88 to-transparent" />
    </div>
  );
}
