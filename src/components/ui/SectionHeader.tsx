import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  className?: string;
}

/** Cabecera de sección estándar: eyebrow condensado + título display */
export function SectionHeader({
  eyebrow,
  title,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h2 className="font-display text-h2 font-bold">{title}</h2>
      </div>
      {action}
    </div>
  );
}
