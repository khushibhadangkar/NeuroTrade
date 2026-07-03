"use client";

import { motion } from "framer-motion";

const TICKER_DATA = [
  { symbol: "NIFTY", price: "24,850.60", change: "+0.72%", positive: true },
  { symbol: "BANKNIFTY", price: "53,420.30", change: "+1.14%", positive: true },
  { symbol: "SENSEX", price: "81,640.20", change: "+0.65%", positive: true },
  { symbol: "RELIANCE", price: "2,945.80", change: "-0.34%", positive: false },
  { symbol: "HDFCBANK", price: "1,685.40", change: "+1.42%", positive: true },
  { symbol: "INFY", price: "1,542.70", change: "+0.91%", positive: true },
  { symbol: "TCS", price: "3,890.20", change: "+0.56%", positive: true },
  { symbol: "ICICIBANK", price: "1,298.60", change: "+1.87%", positive: true },
  { symbol: "SBIN", price: "842.30", change: "-0.62%", positive: false },
  { symbol: "BAJFINANCE", price: "7,245.80", change: "+2.14%", positive: true },
];

// Duplicate for seamless infinite scroll
const ITEMS = [...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA];

/**
 * Animated stock ticker tape at the bottom of the hero.
 * Infinite horizontal scroll with live-looking market data.
 */
export function HeroTicker() {
  return (
    <div className="relative flex h-12 items-center overflow-hidden">
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 z-10 h-full w-16 bg-gradient-to-r from-surface-950 to-transparent" />

      <motion.div
        className="flex items-center gap-10 whitespace-nowrap"
        animate={{ x: ["0%", "-33.33%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {ITEMS.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-xs tabular">
            {/* Pulse dot */}
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                item.positive ? "bg-accent-mint" : "bg-accent-red"
              }`}
            />
            <span className="font-semibold text-ivory">{item.symbol}</span>
            <span className="text-muted">${item.price}</span>
            <span
              className={
                item.positive ? "text-accent-mint" : "text-accent-red"
              }
            >
              {item.change}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 z-10 h-full w-16 bg-gradient-to-l from-surface-950 to-transparent" />
    </div>
  );
}
