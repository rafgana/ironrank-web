import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex w-full rounded-md px-3 py-2 text-sm outline-none transition-colors",
          "bg-[var(--color-surface-2)] text-[var(--color-fg)]",
          "border border-[var(--color-border-subtle)]",
          "placeholder:text-[var(--color-fg-dim)]",
          "focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)]",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
