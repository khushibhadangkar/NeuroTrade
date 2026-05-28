"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Floating dashboard preview — a stylized mockup of the OS interface
 * that parallax-scrolls into view with a cinematic reveal.
 */
export function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [8, 0, -4]);

  return (
    <section ref={ref} className="relative px-6 py-32">
      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent-amber">
            Interface
          </p>
          <h2 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">
            Designed for restraint.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Fewer widgets, clearer hierarchy, and a chart-first reading experience.
          </p>
        </motion.div>

        {/* Dashboard mockup with perspective */}
        <motion.div
          style={{ y, rotateX, perspective: 1200 }}
          className="relative mx-auto max-w-5xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-panel border border-border/60 bg-surface-900/80 shadow-panel backdrop-blur-xl"
          >
            {/* Topbar mockup */}
            <div className="flex h-10 items-center border-b border-border/60 px-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-accent-red/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-accent-amber/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-accent-mint/60" />
              </div>
              <div className="ml-4 flex items-center gap-2">
                <div className="h-3 w-16 rounded-sm bg-surface-700" />
                <div className="h-3 w-8 rounded-sm bg-accent-amber/20" />
              </div>
            </div>

            {/* Content mockup */}
            <div className="grid grid-cols-[200px_1fr] divide-x divide-border/40">
              {/* Sidebar mockup */}
              <div className="space-y-2 p-4">
                {["Forecast", "Compare", "Watchlist", "Analytics"].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 rounded-os px-3 py-2 text-xs ${
                      i === 0
                        ? "bg-surface-800 text-ivory"
                        : "text-muted"
                    }`}
                  >
                    <div className={`h-2 w-2 rounded-sm ${i === 0 ? "bg-accent-amber" : "bg-surface-700"}`} />
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content mockup */}
              <div className="p-6">
                {/* Symbol header */}
                <div className="mb-4 flex items-baseline gap-3">
                  <span className="font-display text-3xl text-ivory">NVDA</span>
                  <span className="text-sm text-accent-mint">+2.91%</span>
                </div>

                {/* Chart mockup */}
                <div className="relative h-48 overflow-hidden rounded-os border border-border/40 bg-surface-950/60">
                  {/* Fake chart lines */}
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 400 150"
                    preserveAspectRatio="none"
                  >
                    {/* Grid */}
                    {[30, 60, 90, 120].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="400"
                        y2={y}
                        stroke="rgba(244,239,229,0.05)"
                        strokeWidth="0.5"
                      />
                    ))}
                    {/* Actual line */}
                    <motion.path
                      d="M0,100 C50,95 100,90 150,85 C200,80 250,70 300,75 C350,80 380,65 400,60"
                      fill="none"
                      stroke="rgba(156,149,136,0.6)"
                      strokeWidth="1.5"
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : {}}
                      transition={{ duration: 2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {/* Predicted line */}
                    <motion.path
                      d="M0,95 C50,88 100,82 150,78 C200,74 250,60 300,55 C350,50 380,42 400,38"
                      fill="none"
                      stroke="rgba(183,155,98,0.8)"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : {}}
                      transition={{ duration: 2.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </svg>

                  {/* Legend */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-4 text-[10px]">
                    <span className="flex items-center gap-1.5 text-muted">
                      <span className="h-px w-4 bg-muted" /> Historical
                    </span>
                    <span className="flex items-center gap-1.5 text-accent-amber">
                      <span className="h-px w-4 bg-accent-amber" /> Forecast
                    </span>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: "RMSE", value: "$7.99" },
                    { label: "Dir. Acc", value: "51.0%" },
                    { label: "R²", value: "0.3144" },
                    { label: "Trend", value: "Upward" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-os bg-surface-800/60 p-2.5">
                      <p className="text-[9px] uppercase tracking-wider text-muted">{m.label}</p>
                      <p className="mt-1 text-xs font-medium tabular text-ivory">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ambient glow overlay */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 40% at 70% 30%, rgba(183,155,98,0.04), transparent 70%)",
              }}
            />
          </motion.div>

          {/* Floating glow behind the card */}
          <div
            className="absolute -inset-8 -z-10 opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(183,155,98,0.12), transparent 60%)",
            }}
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 text-center"
        >
          <Link href="/os/forecast">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-os border border-accent-amber/30 bg-accent-amber/10 px-6 py-3 text-sm font-semibold text-accent-amber transition-all hover:border-accent-amber/50 hover:bg-accent-amber/20"
            >
              Launch NeuroTrade OS
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
