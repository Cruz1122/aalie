"use client";

import { useEffect, useCallback } from "react";

const TRACE_REFRESH_EVENT = "traceRefreshRequested";

/**
 * Hook que reacciona cuando el usuario analiza estando en vista trace.
 * Escucha el evento traceRefreshRequested y ejecuta refresh.
 *
 * @author Plan refactor subsistema trace
 * Version: 0.1.0
 */
export function useTraceRefreshOnAnalysis(refresh: () => void) {
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener(TRACE_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(TRACE_REFRESH_EVENT, handleRefresh);
  }, [handleRefresh]);
}

/**
 * Dispara el evento para que la vista trace se refresque.
 * Llamar cuando el análisis complete con éxito y el usuario pueda estar en trace.
 */
export function requestTraceRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TRACE_REFRESH_EVENT));
  }
}
