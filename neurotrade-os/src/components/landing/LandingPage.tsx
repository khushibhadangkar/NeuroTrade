"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { DashboardPreview } from "./DashboardPreview";
import { DataStreams } from "./DataStreams";
import { LandingFooter } from "./LandingFooter";

/**
 * Cinematic landing page — fullscreen hero with neural network background,
 * floating particles, parallax scroll, and glassmorphism sections.
 */
export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  // Parallax transforms for layered depth
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[500vh] bg-surface-950 text-ivory overflow-x-hidden"
    >
      {/* Fixed ambient background that persists through scroll */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-surface-950" />
        {/* Radial amber glow — top center */}
        <div
          className="absolute inset-x-0 top-0 h-[80vh]"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(183,155,98,0.08), transparent 70%)",
          }}
        />
        {/* Radial cyan glow — bottom right */}
        <div
          className="absolute bottom-0 right-0 h-[60vh] w-[60vw]"
          style={{
            background:
              "radial-gradient(circle at 80% 80%, rgba(122,155,168,0.06), transparent 60%)",
          }}
        />
        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(244,239,229,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,229,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Hero — fixed position with parallax fade */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="fixed inset-0 z-10"
      >
        <HeroSection />
      </motion.div>

      {/* Scroll spacer for hero */}
      <div className="h-[100vh]" />

      {/* Content sections — scroll over the hero */}
      <div className="relative z-20">
        <DataStreams />
        <FeaturesSection />
        <DashboardPreview />
        <LandingFooter />
      </div>
    </div>
  );
}
