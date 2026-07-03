"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, BarChart2, Star, Activity, X } from "lucide-react";
import { useOSStore } from "@/store/useOSStore";
import { cn } from "@/lib/utils";
import { fade, scaleIn } from "@/lib/motion";

const WORKSPACE_COMMANDS = [
  { label: "Home", href: "/os/home", icon: Activity, description: "Market intelligence" },
  { label: "Forecast", href: "/os/forecast", icon: TrendingUp, description: "AI forecast engine" },
  { label: "Compare", href: "/os/compare", icon: BarChart2, description: "Multi-asset comparison" },
  { label: "Watchlist", href: "/os/watchlist", icon: Star, description: "Saved assets" },
];

const TICKER_RE = /^[A-Z]{1,5}$/;

/**
 * Global command palette — ⌘K to open.
 * Supports workspace navigation and quick symbol search.
 */
export function CommandPalette() {
  const open = useOSStore((s) => s.commandPaletteOpen);
  const close = useOSStore((s) => s.closeCommandPalette);
  const recentSymbols = useOSStore((s) => s.recentSymbols);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open ? close() : useOSStore.getState().openCommandPalette();
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [open]);

  const upperQuery = query.trim().toUpperCase();
  const isSymbol = TICKER_RE.test(upperQuery);

  const filteredWorkspaces = WORKSPACE_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(href: string) {
    router.push(href);
    close();
  }

  function handleSymbolSearch() {
    if (!isSymbol) return;
    router.push(`/os/forecast?symbol=${upperQuery}`);
    close();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={fade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[80] bg-surface-950/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Palette */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "fixed left-1/2 top-[20vh] z-[90] w-full max-w-lg -translate-x-1/2",
              "border border-border bg-surface-900 shadow-panel"
            )}
            role="dialog"
            aria-label="Command palette"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSymbolSearch();
                }}
                placeholder="Search workspace or enter ticker…"
                className="flex-1 bg-transparent text-sm text-ivory placeholder:text-muted focus:outline-none"
                aria-label="Command palette search"
              />
              <button
                onClick={close}
                className="text-muted transition hover:text-ivory focus:outline-none"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto p-2">
              {/* Symbol shortcut */}
              {isSymbol && (
                <button
                  onClick={handleSymbolSearch}
                  className="flex w-full items-center gap-3 rounded-os px-3 py-2.5 text-left text-sm hover:bg-surface-800 focus:outline-none focus:bg-surface-800"
                >
                  <TrendingUp className="h-4 w-4 text-accent-amber" />
                  <span className="text-ivory">
                    Forecast <strong>{upperQuery}</strong>
                  </span>
                  <span className="ml-auto text-xs text-muted">↵ Enter</span>
                </button>
              )}

              {/* Workspace navigation */}
              {filteredWorkspaces.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted">
                    Workspaces
                  </p>
                  {filteredWorkspaces.map(({ href, label, icon: Icon, description }) => (
                    <button
                      key={href}
                      onClick={() => handleSelect(href)}
                      className="flex w-full items-center gap-3 rounded-os px-3 py-2.5 text-left text-sm hover:bg-surface-800 focus:outline-none focus:bg-surface-800"
                    >
                      <Icon className="h-4 w-4 text-muted" />
                      <span className="text-ivory">{label}</span>
                      <span className="ml-2 text-xs text-muted">{description}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Recent symbols */}
              {recentSymbols.length > 0 && !query && (
                <div>
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted">
                    Recent
                  </p>
                  {recentSymbols.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => {
                        router.push(`/os/forecast?symbol=${symbol}`);
                        close();
                      }}
                      className="flex w-full items-center gap-3 rounded-os px-3 py-2.5 text-left text-sm hover:bg-surface-800 focus:outline-none focus:bg-surface-800"
                    >
                      <TrendingUp className="h-4 w-4 text-muted" />
                      <span className="font-medium text-ivory">{symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
