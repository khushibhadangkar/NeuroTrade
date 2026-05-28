import { redirect } from "next/navigation";

/**
 * Root route — redirect to the cinematic landing page.
 * The OS shell lives at /os/* and the landing at /landing.
 */
export default function RootPage() {
  redirect("/landing");
}
