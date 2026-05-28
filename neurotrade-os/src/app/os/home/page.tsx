import type { Metadata } from "next";
import { MarketHome } from "@/components/workspaces/MarketHome";

export const metadata: Metadata = { title: "Market Intelligence" };

export default function HomePage() {
  return <MarketHome />;
}
