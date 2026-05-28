import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "NeuroTrade OS — AI Financial Intelligence",
  description: "Real-time AI-powered stock market prediction and financial intelligence platform.",
};

export default function Landing() {
  return <LandingPage />;
}
