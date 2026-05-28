"use client";

import Link from "next/link";
import { Search, Cpu } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { MarketTicker } from "@/components/ui/MarketTicker";
import { cn } from "@/lib/utils";

/**
 * Fixed topbar — brand, market ticker tape, backend status, and command palette trigger.
 */
export function Topbar() {
  const openCommandPalette = useOSStore((s) => s.openCommandPalette);
  const { status, version } = useBackendStatus();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex h-topbar items-center",
        "border-b border-border bg-surface-950/88 backdrop-blur-md"
      )}
    >
      {/* Brand */}
      <div className="flex h-full w-sidebar shrink-0 items-center border-r border-border px-4">
        <Link
          href="/os/forecast"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
        >
          <Cpu className="h-4 w-4 text-accent-amber" />
          <span className="font-display text-base tracking-wide text-ivory">
            NeuroTrade
          </span>
          <span className="rounded-sm bg-surface-700 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-muted">
            OS
          </span>
        </Link>
      </div>

      {/* Market ticker tape */}
      <div className="flex-1 overflow-hidden">
        <MarketTicker />
      </div>

      {/* Backend status indicator */}
      <div className="flex h-full items-center border-l border-border px-3">
        <div className="flex items-center gap-1.5" title={`Backend: ${status}${version ? ` (${version})` : ""}`}>
          <span className="relative flex h-2 w-2">
            {status === "connected" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-mint opacity-50" />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                status === "connected"
                  ? "bg-accent-mint"
                  : status === "checking"
                  ? "bg-accent-amber"
                  : "bg-accent-red"
              )}
            />
          </span>
          <span
            className={cn(
              "hidden text-[10px] font-medium sm:inline",
              status === "connected"
                ? "text-accent-mint"
                : status === "checking"
                ? "text-accent-amber"
                : "text-accent-red"
            )}
          >
            {status === "connected" ? "API" : status === "checking" ? "..." : "Offline"}
          </span>
        </div>
      </div>

      {/* Command palette trigger */}
      <div className="flex h-full items-center border-l border-border px-4">
        <button
          onClick={openCommandPalette}
          className={cn(
            "flex items-center gap-2 rounded-os border border-border px-3 py-1.5",
            "text-xs text-muted transition-all duration-200",
            "hover:border-border-strong hover:text-ivory",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          )}
          aria-label="Open command palette"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded bg-surface-700 px-1.5 py-0.5 text-[10px] text-muted sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
