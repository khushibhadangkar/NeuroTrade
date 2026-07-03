import type { Config } from "tailwindcss";

// ─── Design Token Reference ──────────────────────────────────────────────────
//
//  Surface scale  (near-black backgrounds, layered depth)
//  Ivory          (primary text / high-contrast foreground)
//  Muted          (secondary text)
//  Accent amber   (brand highlight, interactive states)
//  Accent mint    (positive / bullish)
//  Accent red     (negative / bearish)
//  Accent cyan    (informational / neutral)
//
//  These tokens are intentionally carried forward from the existing CRA
//  frontend so both apps share a visual language.
// ─────────────────────────────────────────────────────────────────────────────

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Colors ──────────────────────────────────────────────────────────
      colors: {
        // Surfaces — layered depth from near-black to dark-grey
        surface: {
          950: "#070706",
          900: "#0d0c0b",
          800: "#151311",
          700: "#211f1a",
          600: "#2e2b24",
        },
        // Foreground
        ivory: "#f4efe5",
        muted: "#9c9588",
        // Accent palette
        accent: {
          amber: "#b79b62",
          "amber-light": "#d4b87a",
          mint: "#7f9a82",
          red: "#c0614a",
          cyan: "#7a9ba8",
          blue: "#9d9587",
          pink: "#c9b98f",
        },
        // Semantic aliases
        border: "rgba(244, 239, 229, 0.12)",
        "border-strong": "rgba(244, 239, 229, 0.22)",
      },

      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-playfair)",
          "Georgia",
          "ui-serif",
          "serif",
        ],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },

      // ── Spacing / Sizing ─────────────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "sidebar": "15rem",
        "sidebar-collapsed": "3.5rem",
        "topbar": "3.5rem",
      },

      // ── Border radius ────────────────────────────────────────────────────
      borderRadius: {
        "os": "2px",   // sharp, terminal-like
        "panel": "4px",
        "card": "6px",
      },

      // ── Shadows ──────────────────────────────────────────────────────────
      boxShadow: {
        editorial: "0 18px 70px rgba(0, 0, 0, 0.24)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.34)",
        "glow-amber": "0 0 24px rgba(183, 155, 98, 0.18)",
        "glow-mint": "0 0 24px rgba(127, 154, 130, 0.18)",
        "glow-red": "0 0 24px rgba(192, 97, 74, 0.18)",
        "inset-top": "inset 0 1px 0 rgba(244, 239, 229, 0.08)",
      },

      // ── Background images ────────────────────────────────────────────────
      backgroundImage: {
        "grid-fine":
          "linear-gradient(rgba(244,239,229,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,229,0.05) 1px, transparent 1px)",
        "grid-coarse":
          "linear-gradient(rgba(244,239,229,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(244,239,229,0.08) 1px, transparent 1px)",
        "radial-amber":
          "radial-gradient(circle at 50% 0%, rgba(183,155,98,0.16), transparent 55%)",
        "radial-mint":
          "radial-gradient(circle at 80% 50%, rgba(127,154,130,0.10), transparent 50%)",
        "noise":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },

      // ── Background sizes ─────────────────────────────────────────────────
      backgroundSize: {
        "grid-fine": "48px 48px",
        "grid-coarse": "96px 96px",
      },

      // ── Keyframes & animations ───────────────────────────────────────────
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.48", transform: "scale(1)" },
          "50%": { opacity: "0.88", transform: "scale(1.04)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        floatAmbient: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.3s linear infinite",
        pulseGlow: "pulseGlow 5s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
        fadeUp: "fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        fadeIn: "fadeIn 0.4s ease forwards",
        ticker: "ticker 30s linear infinite",
        blink: "blink 1.2s step-end infinite",
        float: "floatAmbient 6s ease-in-out infinite",
      },

      // ── Transitions ──────────────────────────────────────────────────────
      transitionTimingFunction: {
        "os": "cubic-bezier(0.22, 1, 0.36, 1)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
