"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { springSheet } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Sheet móvil con drag-to-dismiss; en desktop renderiza como panel centrado.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: BottomSheetProps) {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex",
            isDesktop ? "items-center justify-center p-6" : "items-end",
          )}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {isDesktop ? (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={cn(
                "card bg-noise relative w-full max-w-md max-h-[85vh] overflow-y-auto p-6",
                className,
              )}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={springSheet}
            >
              <SheetHeader title={title} onClose={onClose} />
              {children}
            </motion.div>
          ) : (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={cn(
                "bg-noise relative w-full max-h-[90dvh] overflow-y-auto rounded-t-sheet bg-surface-1 border-t border-x border-[color-mix(in_oklab,white_8%,transparent)] px-5 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
                className,
              )}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={springSheet}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 500) onClose();
              }}
            >
              <div className="mx-auto mb-3 mt-1 h-1 w-10 rounded-full bg-surface-3" />
              <SheetHeader title={title} onClose={onClose} />
              {children}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function SheetHeader({
  title,
  onClose,
}: {
  title?: string;
  onClose: () => void;
}) {
  if (!title) return null;
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-h2 font-bold">{title}</h2>
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="tap-target flex items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <X size={20} />
      </button>
    </div>
  );
}
