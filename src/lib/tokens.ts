/**
 * Design tokens as typed constants.
 *
 * These mirror the Tailwind config so they can be used in:
 *  - Framer Motion `style` props
 *  - GSAP animations
 *  - Recharts / lightweight-charts theme objects
 *  - Inline styles where Tailwind classes aren't available
 */

export const colors = {
  surface: {
    950: "#070706",
    900: "#0d0c0b",
    800: "#151311",
    700: "#211f1a",
    600: "#2e2b24",
  },
  ivory: "#f4efe5",
  muted: "#9c9588",
  accent: {
    amber: "#b79b62",
    amberLight: "#d4b87a",
    mint: "#7f9a82",
    red: "#c0614a",
    cyan: "#7a9ba8",
  },
  border: "rgba(244, 239, 229, 0.12)",
  borderStrong: "rgba(244, 239, 229, 0.22)",
} as const;

export const typography = {
  fontSans: "var(--font-inter)",
  fontDisplay: "var(--font-playfair)",
  fontMono: "var(--font-jetbrains)",
} as const;

export const layout = {
  sidebarWidth: "15rem",
  sidebarCollapsedWidth: "3.5rem",
  topbarHeight: "3.5rem",
} as const;

/** Recharts-compatible theme object */
export const chartTheme = {
  background: colors.surface[900],
  text: colors.muted,
  grid: "rgba(244, 239, 229, 0.06)",
  actual: colors.muted,
  forecast: colors.accent.amber,
  positive: colors.accent.mint,
  negative: colors.accent.red,
  tooltip: {
    background: colors.surface[950],
    border: colors.border,
    text: colors.ivory,
    label: colors.accent.amber,
  },
} as const;
