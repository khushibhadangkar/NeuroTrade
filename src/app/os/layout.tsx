import { OSShell } from "@/components/shell/OSShell";

/**
 * OS shell layout — wraps every workspace route with the sidebar,
 * topbar, and ambient background layer.
 */
export default function OSLayout({ children }: { children: React.ReactNode }) {
  return <OSShell>{children}</OSShell>;
}
