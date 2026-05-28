import type { Metadata } from "next";
import { CommoditiesWorkspace } from "@/components/workspaces/CommoditiesWorkspace";

export const metadata: Metadata = { title: "Commodities" };

export default function CommoditiesPage() {
  return <CommoditiesWorkspace />;
}
