import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

// ─── Fonts ────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

// ─── Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "NeuroTrade OS",
    template: "%s · NeuroTrade OS",
  },
  description:
    "AI-powered stock market prediction and financial intelligence platform.",
  keywords: ["stock prediction", "LSTM", "AI trading", "financial analysis"],
  authors: [{ name: "NeuroTrade" }],
  robots: { index: false, follow: false }, // private platform
};

export const viewport: Viewport = {
  themeColor: "#070706",
  colorScheme: "dark",
};

// ─── Root layout ──────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${playfair.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-surface-950 text-ivory antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
