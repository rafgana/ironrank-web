/**
 * Debounce y throttle utilities.
 * - `debounce(fn, ms)`: ejecuta fn después de ms de inactividad
 * - `throttle(fn, ms)`: ejecuta fn máximo una vez cada ms
 */

/** Debounce: ejecuta fn después de `ms` de inactividad. */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, ms);
  };
}

/** Throttle: ejecuta fn máximo una vez cada `ms`. */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}
