import type { Metadata } from "next";
import { ForecastWorkspace } from "@/components/workspaces/ForecastWorkspace";

export const metadata: Metadata = { title: "Forecast" };

export default function ForecastPage() {
  return <ForecastWorkspace />;
}
