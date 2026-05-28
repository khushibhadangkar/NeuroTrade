"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart2,
  Star,
  Activity,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Gem,
} from "lucide-react";
import { useOSStore } from "@/store/useOSStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/os/home",
    label: "Home",
    icon: LayoutDashboard,
    description: "Market intelligence",
  },
  {
    href: "/os/forecast",
    label: "Forecast",
    icon: TrendingUp,
    description: "AI prediction engine",
  },

  {
    href: "/os/commodities",
    label: "Commodities",
    icon: Gem,
    description: "Gold, Silver, Crude",
  },
  {
    href: "/os/watchlist",
    label: "Watchlist",
    icon: Star,
    description: "Saved instruments",
  },
  {
    href: "/os/compare",
    label: "Compare",
    icon: BarChart2,
    description: "Multi-index comparison",
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useOSStore((s) => s.sidebarCollapsed);
  const toggle = useOSStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-topbar z-30 flex h-[calc(100vh-var(--topbar-height))] flex-col",
        "border-r border-border bg-surface-950/90 backdrop-blur-md",
        "transition-[width] duration-300 ease-os"
      )}
      style={{ width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)" }}
      aria-label="Main navigation"
    >
      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 p-2 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, description }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-os px-3 py-2.5",
                "text-sm transition-all duration-200 ease-os",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber",
                active
                  ? "bg-surface-800 text-ivory"
                  : "text-muted hover:bg-surface-800/60 hover:text-ivory"
              )}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-amber"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              )}

              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-accent-amber" : "text-muted group-hover:text-ivory"
                )}
              />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden whitespace-nowrap font-medium"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div
                  className={cn(
                    "pointer-events-none absolute left-full ml-2 z-50",
                    "rounded-os border border-border bg-surface-800 px-2 py-1",
                    "text-xs text-ivory opacity-0 shadow-panel",
                    "transition-opacity group-hover:opacity-100"
                  )}
                >
                  <p className="font-medium">{label}</p>
                  <p className="text-muted">{description}</p>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-os px-3 py-2.5",
            "text-sm text-muted transition-all duration-200",
            "hover:bg-surface-800/60 hover:text-ivory",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="overflow-hidden whitespace-nowrap">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
