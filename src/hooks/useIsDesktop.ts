import { useEffect, useState } from "react";

/** true cuando el viewport es ≥ breakpoint md/lg indicado */
export function useIsDesktop(breakpoint = 768) {
  const [desktop, setDesktop] = useState(
    () => window.matchMedia(`(min-width: ${breakpoint}px)`).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const cb = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, [breakpoint]);
  return desktop;
}
