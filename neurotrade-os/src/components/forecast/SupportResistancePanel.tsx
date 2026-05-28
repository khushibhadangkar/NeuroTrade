"use client";

import { motion } from "framer-motion";
import type { SupportResistance } from "@/lib/indian-market";
import { formatINR } from "@/lib/indian-market";
import { cn } from "@/lib/utils";

interface SupportResistancePanelProps {
  data: SupportResistance;
  currentPrice: number;
}

/**
 * Support & Resistance visualization — shows key levels with
 * strength indicators and the expected trading range.
 */
export function SupportResistancePanel({ data, currentPrice }: SupportResistancePanelProps) {
  // All levels sorted high to low for visual display
  const allLevels = [
    ...data.resistances.map((r) => ({ ...r, type: "resistance" as const })),
    { level: currentPrice, strength: "Strong" as const, type: "current" as const },
    { level: data.pivotPoint, strength: "Moderate" as const, type: "pivot" as const },
    ...data.supports.map((s) => ({ ...s, type: "support" as const })),
  ].sort((a, b) => b.level - a.level);

  return (
    <div className="rounded-panel border border-border/60 bg-surface-900/40 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
          Support & Resistance
        </p>
        <p className="mt-1 text-xs text-muted">Key levels · Pivot analysis</p>
      </div>

      {/* Levels */}
      <div className="space-y-1.5">
        {allLevels.map((level, i) => {
          const isResistance = level.type === "resistance";
          const isSupport = level.type === "support";
          const isCurrent = level.type === "current";
          const isPivot = level.type === "pivot";

          return (
            <motion.div
              key={`${level.type}-${level.level}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={cn(
                "flex items-center justify-between rounded-os px-3 py-2 text-xs",
                isCurrent && "border border-accent-amber/30 bg-accent-amber/10",
                isPivot && "border border-border/40 bg-surface-800/40",
                isResistance && "border border-accent-red/10 bg-accent-red/5",
                isSupport && "border border-accent-mint/10 bg-accent-mint/5"
              )}
            >
              <div className="flex items-center gap-2">
                {/* Level indicator */}
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isCurrent && "bg-accent-amber",
                    isPivot && "bg-muted",
                    isResistance && "bg-accent-red",
                    isSupport && "bg-accent-mint"
                  )}
                />
                <span className="text-muted">
                  {isCurrent ? "Current Price" :
                   isPivot ? "Pivot Point" :
                   isResistance ? `R${data.resistances.indexOf(level as any) + 1}` :
                   `S${data.supports.indexOf(level as any) + 1}`}
                </span>
                {!isCurrent && !isPivot && (
                  <span className="text-[9px] text-muted/60">
                    ({level.strength})
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-mono font-semibold tabular",
                  isCurrent && "text-accent-amber",
                  isPivot && "text-ivory",
                  isResistance && "text-accent-red",
                  isSupport && "text-accent-mint"
                )}
              >
                {formatINR(level.level)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Expected range */}
      <div className="mt-4 rounded-os border border-border/40 bg-surface-950/60 p-3">
        <p className="text-[9px] uppercase tracking-wider text-muted mb-2">Expected Range</p>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-accent-mint">{formatINR(data.expectedRange.low)}</span>
          <div className="mx-3 h-px flex-1 bg-gradient-to-r from-accent-mint/40 via-accent-amber/40 to-accent-red/40" />
          <span className="font-mono text-xs text-accent-red">{formatINR(data.expectedRange.high)}</span>
        </div>
      </div>
    </div>
  );
}
