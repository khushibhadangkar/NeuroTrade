"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Activity, Brain, Shield, Zap } from "lucide-react";

const STREAMS = [
  {
    icon: Brain,
    label: "Neural Processing",
    value: "128→64→32→1",
    sublabel: "LSTM Architecture",
    color: "text-accent-amber",
    glow: "shadow-glow-amber",
  },
  {
    icon: Activity,
    label: "Directional Accuracy",
    value: "55.1%",
    sublabel: "30-Day Window",
    color: "text-accent-mint",
    glow: "shadow-glow-mint",
  },
  {
    icon: Zap,
    label: "Training Epochs",
    value: "100",
    sublabel: "Early Stopping",
    color: "text-accent-cyan",
    glow: "",
  },
  {
    icon: Shield,
    label: "Data Points",
    value: "365",
    sublabel: "Days Historical",
    color: "text-ivory",
    glow: "",
  },
];

/**
 * Animated data streams section — glassmorphism cards that reveal
 * on scroll with staggered entrance animations.
 */
export function DataStreams() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative px-6 py-32"
    >
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-950/0 via-surface-950/95 to-surface-950" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent-amber">
            Live Intelligence
          </p>
          <h2 className="mt-4 font-display text-4xl text-ivory sm:text-5xl">
            Data streams in motion.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted">
            Every prediction flows through a multi-layer LSTM neural network,
            trained on real market data and evaluated against live prices.
          </p>
        </motion.div>

        {/* Stream cards — glassmorphism */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STREAMS.map((stream, i) => {
            const Icon = stream.icon;
            return (
              <motion.div
                key={stream.label}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.15 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`group relative overflow-hidden rounded-panel border border-border/60 bg-surface-900/40 p-6 backdrop-blur-xl transition-all duration-500 hover:border-border-strong hover:bg-surface-800/60 ${stream.glow}`}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, rgba(183,155,98,0.06), transparent 70%)`,
                    }}
                  />
                </div>

                <div className="relative">
                  <Icon className={`h-5 w-5 ${stream.color} mb-4`} />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                    {stream.label}
                  </p>
                  <p className="mt-2 font-mono text-2xl font-medium text-ivory">
                    {stream.value}
                  </p>
                  <p className="mt-1 text-xs text-muted">{stream.sublabel}</p>
                </div>

                {/* Animated border pulse */}
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-amber/40 to-transparent"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
