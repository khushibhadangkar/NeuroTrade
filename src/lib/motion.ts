/**
 * Motion system — shared Framer Motion variants and transition presets.
 *
 * All animations in NeuroTrade OS should pull from this file so the
 * motion language stays consistent across workspaces and components.
 */

import type { Variants, Transition } from "framer-motion";

// ─── Easing curves ────────────────────────────────────────────────────────
export const ease = {
  /** Smooth deceleration — default for most UI transitions */
  os: [0.22, 1, 0.36, 1] as [number, number, number, number],
  /** Slight overshoot — for interactive elements that need energy */
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  /** Linear — for continuous animations (tickers, scanlines) */
  linear: [0, 0, 1, 1] as [number, number, number, number],
} as const;

// ─── Transition presets ───────────────────────────────────────────────────
export const transition = {
  fast: { duration: 0.2, ease: ease.os } satisfies Transition,
  default: { duration: 0.45, ease: ease.os } satisfies Transition,
  slow: { duration: 0.7, ease: ease.os } satisfies Transition,
  spring: { type: "spring", stiffness: 300, damping: 28 } satisfies Transition,
  springGentle: { type: "spring", stiffness: 180, damping: 24 } satisfies Transition,
} as const;

// ─── Shared variants ──────────────────────────────────────────────────────

/** Fade + slide up — used for page and panel entrances */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: ease.os },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.25, ease: ease.os },
  },
};

/** Fade only — for overlays and modals */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.default },
  exit: { opacity: 0, transition: transition.fast },
};

/** Scale + fade — for cards and panels popping in */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: ease.os },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.2, ease: ease.os },
  },
};

/** Slide in from the left — for sidebar */
export const slideInLeft: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: ease.os },
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: { duration: 0.3, ease: ease.os },
  },
};

/** Stagger container — wraps lists of animated children */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

/** Stagger item — child of staggerContainer */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: ease.os },
  },
};

/** Loading bar sweep */
export const loadingBar: Variants = {
  animate: {
    x: ["-100%", "220%"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/** Number counter — used with useMotionValue + useTransform */
export const counterTransition: Transition = {
  duration: 0.8,
  ease: ease.os,
};
