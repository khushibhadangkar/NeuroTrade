import { cn } from "@/lib/utils";

/**
 * Skeleton — animated shimmer placeholder for loading states.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-os bg-surface-800",
        className
      )}
      {...props}
    />
  );
}

/** Pre-composed skeleton for a metric card */
export function MetricSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-32" />
    </div>
  );
}

/** Pre-composed skeleton for a chart area */
export function ChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <Skeleton
      className="w-full rounded-panel"
      style={{ height }}
    />
  );
}
