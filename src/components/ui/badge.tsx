import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      tier: {
        default: "bg-[var(--color-surface-2)] text-[var(--color-fg)]",
        bronze: "bg-[var(--color-bronze)]/15 text-[var(--color-bronze)] border border-[var(--color-bronze)]/30",
        silver: "bg-[var(--color-silver)]/15 text-[var(--color-silver)] border border-[var(--color-silver)]/30",
        gold: "bg-[var(--color-gold)]/15 text-[var(--color-gold)] border border-[var(--color-gold)]/30",
        platinum: "bg-[var(--color-platinum)]/15 text-[var(--color-platinum)] border border-[var(--color-platinum)]/30",
        emerald: "bg-[var(--color-emerald)]/15 text-[var(--color-emerald)] border border-[var(--color-emerald)]/30",
        diamond: "bg-[var(--color-diamond)]/15 text-[var(--color-diamond)] border border-[var(--color-diamond)]/30",
        challenger: "bg-[var(--color-challenger)]/15 text-[var(--color-challenger)] border border-[var(--color-challenger)]/30",
        brand: "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] border border-[var(--color-brand-500)]/30",
        success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        destructive: "bg-red-500/15 text-red-400 border border-red-500/30",
      },
    },
    defaultVariants: { tier: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tier, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ tier }), className)} {...props} />;
}

export { Badge, badgeVariants };
