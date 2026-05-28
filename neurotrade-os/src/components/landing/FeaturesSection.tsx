"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, BarChart2, Star, Activity, Cpu, LineChart } from "lucide-react";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Forecast Engine",
    description:
      "128-unit LSTM with dropout regularization. Trained on live market data with Huber loss optimization.",
    accent: "amber",
  },
  {
    icon: BarChart2,
    title: "Multi-Symbol Compare",
    description:
      "Run up to 5 symbols simultaneously. Side-by-side forecast comparison with unified metrics.",
    accent: "mint",
  },
  {
    icon: LineChart,
    title: "Technical Analysis",
    description:
      "Moving averages, volume trends, and directional signals computed alongside every prediction.",
    accent: "cyan",
  },
  {
    icon: Star,
    title: "Watchlist",
    description:
      "Persistent symbol tracking with one-click forecast access. Your portfolio, always ready.",
    accent: "amber",
  },
  {
    icon: Activity,
    title: "Risk Analytics",
    description:
      "Correlation matrices, daily return distributions, and risk-vs-return scatter analysis.",
    accent: "mint",
  },
  {
    icon: Cpu,
    title: "Model Transparency",
    description:
      "Full metric disclosure: RMSE, MAE, R², directional accuracy. No black boxes.",
    accent: "cyan",
  },
];

const accentMap = {
  amber: {
    border: "border-accent-amber/20",
    bg: "bg-accent-amber/5",
    icon: "text-accent-amber",
    glow: "group-hover:shadow-glow-amber",
  },
  mint: {
    border: "border-accent-mint/20",
    bg: "bg-accent-mint/5",
    icon: "text-accent-mint",
    glow: "group-hover:shadow-glow-mint",
  },
  cyan: {
    border: "border-accent-cyan/20",
    bg: "bg-accent-cyan/5",
    icon: "text-accent-cyan",
    glow: "",
  },
};

/**
 * Features grid — glassmorphism cards with hover glow and staggered reveal.
 */
export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative px-6 py-32">
      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <div className="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent-amber">
              Capabilities
            </p>
            <div>
              <h2 className="font-display text-4xl text-ivory sm:text-5xl">
                Built for depth, not noise.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
                Every workspace is designed around a single principle: surface the
                signal, suppress the noise, and let the data speak.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            const colors = accentMap[feature.accent as keyof typeof accentMap];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.08 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`group relative overflow-hidden rounded-panel border ${colors.border} ${colors.bg} p-6 backdrop-blur-sm transition-all duration-500 hover:border-border-strong ${colors.glow}`}
              >
                {/* Icon */}
                <div className={`mb-4 inline-flex rounded-os border ${colors.border} p-2.5`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>

                <h3 className="text-base font-semibold text-ivory">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>

                {/* Corner accent */}
                <div
                  className="absolute -right-8 -top-8 h-16 w-16 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle, rgba(183,155,98,0.12), transparent 70%)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
