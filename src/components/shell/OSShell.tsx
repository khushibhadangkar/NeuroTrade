"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AmbientBackground } from "./AmbientBackground";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useOSStore } from "@/store/useOSStore";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

/**
 * The OS shell — persistent chrome that wraps every workspace.
 *
 * Layout:
 *   ┌─────────────────────────────────────────┐
 *   │  Topbar (fixed, full-width)             │
 *   ├──────────┬──────────────────────────────┤
 *   │ Sidebar  │  Main content area           │
 *   │ (fixed)  │  (scrollable per workspace)  │
 *   └──────────┴──────────────────────────────┘
 */
export function OSShell({ children }: { children: React.ReactNode }) {
  const collapsed = useOSStore((s) => s.sidebarCollapsed);

  return (
    <div className="relative min-h-screen bg-surface-950 text-ivory overflow-hidden">
      {/* Ambient atmospheric background */}
      <AmbientBackground />

      {/* Fixed topbar */}
      <Topbar />

      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main content — offset by sidebar and topbar */}
      <motion.main
        className={cn(
          "relative z-10 min-h-screen pt-topbar transition-[padding-left] duration-300 ease-os",
          collapsed ? "pl-sidebar-collapsed" : "pl-sidebar"
        )}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={typeof window !== "undefined" ? window.location.pathname : "page"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* Global command palette overlay */}
      <CommandPalette />
    </div>
  );
}
