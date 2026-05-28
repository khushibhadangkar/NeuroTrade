/**
 * Global OS state — sidebar collapse, active workspace, command palette,
 * and watchlist. Persisted to localStorage via Zustand middleware.
 *
 * Intentionally minimal: server state (predictions, metrics) lives in
 * TanStack Query, not here.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Workspace = "forecast" | "compare" | "watchlist" | "analytics";

interface OSState {
  // Layout
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  // Active workspace (mirrors the URL but useful for non-routing state)
  activeWorkspace: Workspace;
  setActiveWorkspace: (w: Workspace) => void;

  // Command palette
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Watchlist
  watchlist: string[];
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;

  // Last searched symbols (for quick-access)
  recentSymbols: string[];
  pushRecentSymbol: (symbol: string) => void;
}

export const useOSStore = create<OSState>()(
  persist(
    (set, get) => ({
      // ── Layout ──────────────────────────────────────────────────────────
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // ── Workspace ────────────────────────────────────────────────────────
      activeWorkspace: "forecast",
      setActiveWorkspace: (w) => set({ activeWorkspace: w }),

      // ── Command palette ──────────────────────────────────────────────────
      commandPaletteOpen: false,
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),

      // ── Watchlist ────────────────────────────────────────────────────────
      watchlist: ["NIFTY", "BANKNIFTY", "RELIANCE", "HDFCBANK", "GOLD"],
      addToWatchlist: (symbol) =>
        set((s) => ({
          watchlist: s.watchlist.includes(symbol)
            ? s.watchlist
            : [...s.watchlist, symbol],
        })),
      removeFromWatchlist: (symbol) =>
        set((s) => ({ watchlist: s.watchlist.filter((t) => t !== symbol) })),
      isWatched: (symbol) => get().watchlist.includes(symbol),

      // ── Recent symbols ───────────────────────────────────────────────────
      recentSymbols: [],
      pushRecentSymbol: (symbol) =>
        set((s) => ({
          recentSymbols: [
            symbol,
            ...s.recentSymbols.filter((t) => t !== symbol),
          ].slice(0, 8),
        })),
    }),
    {
      name: "neurotrade-os",
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        watchlist: s.watchlist,
        recentSymbols: s.recentSymbols,
      }),
    }
  )
);
