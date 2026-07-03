"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Clock, RefreshCw, WifiOff, XCircle } from "lucide-react";
import { ForecastError } from "@/services/forecast";
import { cn } from "@/lib/utils";

interface ForecastErrorPanelProps {
  error: Error | ForecastError;
  onRetry?: () => void;
}

const ERROR_VISUALS = {
  asset_unsupported: {
    icon: AlertTriangle,
    color: "text-accent-amber",
    border: "border-accent-amber/20",
    bg: "bg-accent-amber/5",
    title: "Asset not supported",
  },
  no_data: {
    icon: AlertTriangle,
    color: "text-accent-amber",
    border: "border-accent-amber/20",
    bg: "bg-accent-amber/5",
    title: "No market data",
  },
  network_error: {
    icon: WifiOff,
    color: "text-accent-red",
    border: "border-accent-red/20",
    bg: "bg-accent-red/5",
    title: "Connection lost",
  },
  timeout: {
    icon: Clock,
    color: "text-accent-amber",
    border: "border-accent-amber/20",
    bg: "bg-accent-amber/5",
    title: "Request timeout",
  },
  server_error: {
    icon: AlertTriangle,
    color: "text-accent-red",
    border: "border-accent-red/20",
    bg: "bg-accent-red/5",
    title: "Engine error",
  },
  unknown: {
    icon: XCircle,
    color: "text-accent-red",
    border: "border-accent-red/20",
    bg: "bg-accent-red/5",
    title: "Forecast unavailable",
  },
} as const;

/**
 * Cinematic error display for the universal forecast workspace.
 */
export function ForecastErrorPanel({ error, onRetry }: ForecastErrorPanelProps) {
  const isApi = error instanceof ForecastError;
  const code = (isApi ? error.code : "unknown") as keyof typeof ERROR_VISUALS;
  const visual = ERROR_VISUALS[code] ?? ERROR_VISUALS.unknown;
  const Icon = visual.icon;
  const message = isApi ? error.displayMessage : error.message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-panel border p-6 backdrop-blur-sm",
        visual.border,
        "bg-surface-900/60"
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${
            visual.color.includes("amber")
              ? "rgba(183,155,98,0.4)"
              : "rgba(192,97,74,0.4)"
          }, transparent)`,
        }}
      />

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
            visual.border,
            visual.bg
          )}
        >
          <Icon className={cn("h-5 w-5", visual.color)} />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-lg text-ivory">{visual.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{message}</p>

          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className={cn(
                "mt-4 inline-flex items-center gap-2 rounded-os border px-4 py-2",
                "text-xs font-medium transition-all duration-200",
                "hover:bg-surface-800/60",
                visual.border,
                visual.color
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
