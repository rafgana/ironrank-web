import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Empty state compartido por todas las páginas */
export function EmptyState({
  icon: Icon,
  title,
  body,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("card bg-noise p-8 text-center md:p-12", className)}>
      <div className="mb-4 flex justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-(--tier-soft) text-(--tier)">
          <Icon size={28} />
        </div>
      </div>
      <h3 className="font-display mx-auto max-w-md text-h2 font-bold">
        {title}
      </h3>
      {body && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
          {body}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
