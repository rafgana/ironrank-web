import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--tier) focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-brand-500 text-black hover:bg-brand-400 shadow-[0_4px_14px_-4px_oklch(0.72_0.22_50/0.5)]",
        outline:
          "border border-border-subtle bg-surface-1 text-fg hover:bg-surface-2 hover:border-fg-dim",
        ghost: "text-fg hover:bg-surface-2",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        /* CTA principal: gradiente del tier ambiental + glow */
        cta: "h-14 px-8 text-base font-display font-bold bg-(image:--tier-gradient) text-(--tier-contrast) shadow-(--shadow-glow-tier) hover:brightness-110",
        tier: "bg-(image:--tier-gradient) text-(--tier-contrast) font-display uppercase tracking-wider shadow-(--shadow-glow-tier) hover:brightness-110",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
