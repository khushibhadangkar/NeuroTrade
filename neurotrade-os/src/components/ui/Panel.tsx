import { cn } from "@/lib/utils";

/**
 * Panel — the primary surface container for workspace content.
 * Provides consistent border, background, and padding.
 */
export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-panel border border-border bg-surface-900",
        "shadow-panel",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * PanelHeader — label row at the top of a Panel.
 */
export function PanelHeader({
  label,
  title,
  action,
  className,
}: {
  label?: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between border-b border-border px-5 py-4",
        className
      )}
    >
      <div>
        {label && (
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-accent-amber">
            {label}
          </p>
        )}
        <h2 className="font-display text-xl text-ivory">{title}</h2>
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  );
}

/**
 * PanelBody — padded content area inside a Panel.
 */
export function PanelBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}
