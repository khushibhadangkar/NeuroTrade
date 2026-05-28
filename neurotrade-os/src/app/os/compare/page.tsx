import type { Metadata } from "next";
import { CompareWorkspace } from "@/components/workspaces/CompareWorkspace";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage() {
  return <CompareWorkspace />;
}
