import type { Transition, Variants } from "motion/react";

/** Indicadores layoutId, feedback de tap */
export const springFast: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 40,
};

/** Transiciones de página y cards */
export const springUI: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 34,
};

/** BottomSheet */
export const springSheet: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 38,
};

/** Entrada escalonada de secciones/listas */
export const enterStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.05 },
  },
};

export const enterItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: springUI },
};
