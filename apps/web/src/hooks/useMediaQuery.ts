"use client";

import { useEffect, useState } from "react";

/**
 * Hook para detectar media queries (ej. mobile vs desktop).
 * @param query - Media query string (ej. "(min-width: 640px)")
 * @returns true si la query coincide
 * @author AALIE
 * @version 0.1.0
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
