"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Cpu, Zap } from "lucide-react";
import { NeuralBackground } from "./NeuralBackground";
import { NeuralScene } from "@/components/three";
import { FloatingParticles } from "./FloatingParticles";
import { HeroTicker } from "./HeroTicker";

/**
 * Fullscreen hero — neural network canvas, floating particles,
 * mouse-reactive glow, and cinematic typography.
 */
export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for reactive glow
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  // Transform mouse position to glow position
  const glowX = useTransform(springX, [0, 1], ["20%", "80%"]);
  const glowY = useTransform(springY, [0, 1], ["20%", "80%"]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
    >
      {/* Neural network animated background — React Three Fiber */}
      <NeuralScene
        nodeCount={100}
        connectionDistance={3}
        mouseRadius={3}
        className="z-0"
      />

      {/* Fallback 2D canvas for reduced-motion or SSR */}
      <NeuralBackground />

      {/* Floating market particles */}
      <FloatingParticles />

      {/* Mouse-reactive radial glow */}
      <motion.div
        className="pointer-events-none absolute h-[600px] w-[600px] rounded-full opacity-30"
        style={{
          left: glowX,
          top: glowY,
          x: "-50%",
          y: "-50%",
          background:
            "radial-gradient(circle, rgba(183,155,98,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Content */}
      <div className="relative z-30 flex flex-col items-center px-6 text-center">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center gap-2 rounded-full border border-accent-amber/20 bg-accent-amber/5 px-4 py-2 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-mint opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-mint" />
          </span>
          <span className="text-xs font-medium tracking-wide text-accent-amber">
            LSTM Neural Engine Active
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-7xl font-bold leading-[0.9] tracking-tight text-ivory sm:text-8xl md:text-9xl lg:text-[10rem]"
        >
          <span className="block text-glow-amber">NEURO</span>
          <span className="block bg-gradient-to-r from-ivory via-accent-amber to-ivory bg-clip-text text-transparent">
            TRADE OS
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl"
        >
          Real-Time AI Financial Intelligence
        </motion.p>

        {/* Metric indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex items-center gap-6 text-xs font-medium uppercase tracking-[0.2em] text-muted"
        >
          <span className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-accent-amber" />
            LSTM 128→64
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-accent-mint" />
            NIFTY · BANKNIFTY
          </span>
          <span className="h-3 w-px bg-border" />
          <span>NSE Live</span>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link href="/os/forecast">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(183,155,98,0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center gap-3 overflow-hidden rounded-os border border-accent-amber/40 bg-accent-amber/10 px-8 py-4 text-sm font-semibold text-accent-amber backdrop-blur-sm transition-all hover:border-accent-amber/60 hover:bg-accent-amber/20"
            >
              {/* Glow sweep */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent-amber/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Enter Platform</span>
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>

          <Link href="/os/forecast?symbol=^NSEI">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-os border border-border px-6 py-4 text-sm font-medium text-muted backdrop-blur-sm transition-all hover:border-border-strong hover:text-ivory"
            >
              Try NIFTY Forecast
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Bottom ticker tape */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute inset-x-0 bottom-0 z-30 border-t border-border/50 bg-surface-950/60 backdrop-blur-md"
      >
        <HeroTicker />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-accent-amber/60 to-transparent" />
        </motion.div>
      </motion.div>
    </div>
  );
}
