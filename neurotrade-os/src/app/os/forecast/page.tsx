import type { Metadata } from "next";
import { Suspense } from "react";
import { ForecastWorkspace } from "@/components/workspaces/ForecastWorkspace";

export const metadata: Metadata = { title: "Forecast" };

export default function ForecastPage() {
  return (
    <Suspense>
      <ForecastWorkspace />
    </Suspense>
  );
}

