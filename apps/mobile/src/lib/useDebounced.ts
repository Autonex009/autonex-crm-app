import { useEffect, useState } from "react";

/**
 * Debounced mirror of a value. Used by the search fields so a query fires once
 * the typing pauses rather than on every keystroke — the same helper the web
 * app has at apps/web/src/app/lib/useDebounced.ts.
 */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
