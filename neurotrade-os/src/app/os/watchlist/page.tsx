import type { Metadata } from "next";
import { WatchlistWorkspace } from "@/components/workspaces/WatchlistWorkspace";

export const metadata: Metadata = { title: "Watchlist" };

export default function WatchlistPage() {
  return <WatchlistWorkspace />;
}
