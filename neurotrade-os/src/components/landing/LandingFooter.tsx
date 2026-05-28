"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Cpu } from "lucide-react";

/**
 * Landing page footer — minimal, editorial, with a final ambient glow.
 */
export function LandingFooter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer ref={ref} className="relative border-t border-border/40 px-6 py-24">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            "radial-gradient(ellipse 50% 80% at 50% 100%, rgba(183,155,98,0.06), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-6xl"
      >
        <div className="grid gap-12 lg:grid-cols-[1fr_auto]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-accent-amber" />
              <span className="font-display text-xl text-ivory">NeuroTrade OS</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              AI-powered financial intelligence. Built on LSTM neural networks,
              trained on live market data, and designed for clarity over noise.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "LSTM", label: "Architecture" },
              { value: "30", label: "Day Forecast" },
              { value: "v1.0", label: "Model Version" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl text-ivory">{stat.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex items-center justify-between border-t border-border/40 pt-6">
          <p className="text-xs text-muted">
            © 2024 NeuroTrade · Flask API preserved · Phase 0 backend
          </p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-mint opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-mint" />
            </span>
            <span className="text-xs text-accent-mint">System Online</span>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
