import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-os",
    "text-sm font-semibold transition-all duration-200 ease-os",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-ivory text-surface-950 shadow-editorial hover:bg-[#ded2bd] active:scale-[0.98]",
        secondary:
          "border border-border bg-transparent text-ivory hover:border-border-strong hover:bg-surface-800/60",
        ghost:
          "text-muted hover:bg-surface-800/60 hover:text-ivory",
        amber:
          "border border-accent-amber/30 bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20",
        danger:
          "border border-accent-red/30 bg-accent-red/10 text-accent-red hover:bg-accent-red/20",
        outline:
          "border border-border text-muted hover:border-border-strong hover:text-ivory",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-5 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
