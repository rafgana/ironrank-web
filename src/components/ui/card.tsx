import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative overflow-hidden rounded-xl border bg-[var(--color-surface-1)] text-[var(--color-fg)] transition-all",
  {
    variants: {
      tier: {
        default: "border-[var(--color-border-subtle)]",
        bronze:
          "border-[var(--color-bronze)]/40 shadow-[0_0_30px_-10px] shadow-[var(--color-bronze)]/30",
        silver:
          "border-[var(--color-silver)]/40 shadow-[0_0_30px_-10px] shadow-[var(--color-silver)]/30",
        gold:
          "border-[var(--color-gold)]/50 shadow-[0_0_40px_-10px] shadow-[var(--color-gold)]/40",
        platinum:
          "border-[var(--color-platinum)]/50 shadow-[0_0_40px_-10px] shadow-[var(--color-platinum)]/40",
        emerald:
          "border-[var(--color-emerald)]/50 shadow-[0_0_40px_-10px] shadow-[var(--color-emerald)]/40",
        diamond:
          "border-[var(--color-diamond)]/50 shadow-[0_0_50px_-10px] shadow-[var(--color-diamond)]/50",
        challenger:
          "border-[var(--color-challenger)]/60 shadow-[0_0_60px_-10px] shadow-[var(--color-challenger)]/50",
      },
      elevation: {
        flat: "",
        raised: "bg-[var(--color-surface-2)]",
        elevated:
          "bg-[var(--color-surface-2)] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]",
      },
    },
    defaultVariants: {
      tier: "default",
      elevation: "flat",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tier, elevation, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ tier, elevation }), className)}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-display text-xl font-semibold tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-[var(--color-fg-muted)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
