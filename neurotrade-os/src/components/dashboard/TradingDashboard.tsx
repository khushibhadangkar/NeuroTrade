"use client";

import { motion } from "framer-motion";
import { DashboardSidebar } from "./DashboardSidebar";
import { TradingChart } from "./TradingChart";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { MarketHeatmap } from "./MarketHeatmap";
import { staggerContainer, staggerItem } from "@/lib/motion";

/**
 * Premium AI Trading Dashboard — full-screen immersive layout.
 *
 * Layout:
 *   ┌──────────┬────────────────────────────────┬──────────────┐
 *   │ Sidebar  │  Center: Trading Chart + AI    │  Right Panel │
 *   │ (nav)    │  prediction overlay            │  (insights)  │
 *   │          │                                │              │
 *   │          ├────────────────────────────────┤              │
 *   │          │  Bottom: Heatmap + Movers      │              │
 *   └──────────┴────────────────────────────────┴──────────────┘
 */
export function TradingDashboard() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex h-[calc(100vh-var(--topbar-height))] gap-3 overflow-hidden p-3"
    >
      {/* Left sidebar navigation */}
      <motion.div variants={staggerItem} className="hidden lg:block">
        <DashboardSidebar />
      </motion.div>

      {/* Center + Bottom */}
      <motion.div variants={staggerItem} className="flex flex-1 flex-col gap-3 overflow-hidden">
        {/* Main chart area */}
        <div className="flex-1 min-h-0">
          <TradingChart />
        </div>

        {/* Bottom section */}
        <div className="h-52 shrink-0">
          <MarketHeatmap />
        </div>
      </motion.div>

      {/* Right panel */}
      <motion.div variants={staggerItem} className="hidden xl:block w-80 shrink-0">
        <AIInsightsPanel />
      </motion.div>
    </motion.div>
  );
}
