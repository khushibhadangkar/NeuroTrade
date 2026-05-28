"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Brain,
  MessageSquare,
  BarChart2,
  Briefcase,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: TrendingUp, label: "Markets", active: false },
  { icon: Brain, label: "AI Forecasts", active: false },
  { icon: MessageSquare, label: "Sentiment", active: false },
  { icon: BarChart2, label: "Analytics", active: false },
  { icon: Briefcase, label: "Portfolio", active: false },
  { icon: Settings, label: "Settings", active: false },
] as const;

/**
 * Dashboard-specific sidebar — vertical icon nav with glassmorphism.
 */
export function DashboardSidebar() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="relative flex h-full w-16 flex-col items-center rounded-panel border border-border/60 bg-surface-900/40 py-4 backdrop-blur-xl">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-panel opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, rgba(183,155,98,0.06), transparent 70%)",
        }}
      />

      <nav className="relative flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const isActive = i === activeIdx;
          return (
            <button
              key={item.label}
              onClick={() => setActiveIdx(i)}
              title={item.label}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-os transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber",
                isActive
                  ? "bg-accent-amber/10 text-accent-amber"
                  : "text-muted hover:bg-surface-800/60 hover:text-ivory"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="dashboard-nav-active"
                  className="absolute -left-[1px] top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-amber"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              )}

              <Icon className="h-4 w-4" />

              {/* Tooltip */}
              <div
                className={cn(
                  "pointer-events-none absolute left-full ml-3 z-50",
                  "flex items-center gap-1.5 rounded-os border border-border bg-surface-800 px-2.5 py-1.5",
                  "text-xs font-medium text-ivory opacity-0 shadow-panel",
                  "transition-opacity duration-200 group-hover:opacity-100"
                )}
              >
                {item.label}
                <ChevronRight className="h-3 w-3 text-muted" />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom pulse indicator */}
      <div className="relative mt-auto flex flex-col items-center gap-2">
        <div className="h-px w-6 bg-border" />
        <div className="relative flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-mint opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-mint" />
        </div>
        <span className="text-[8px] uppercase tracking-wider text-muted">Live</span>
      </div>
    </div>
  );
}
