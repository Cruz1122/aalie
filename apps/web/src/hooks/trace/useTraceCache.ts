"use client";

import { useCallback } from "react";

import {
  buildTraceCacheKey,
  TRACE_CACHE_TTL_MS,
  type TraceCacheKeyParams,
} from "@/lib/trace-cache-utils";
import type { TraceApiResponse } from "@/types/trace";

export interface TraceCacheEntry {
  data: TraceApiResponse;
  ts: number;
}

/**
 * Hook para cache del trace: clave, TTL, serialización e invalidación.
 * Política: invalida cuando cambie source, case, inputSize, variables editadas,
 * locale, flags o versión del contrato.
 *
 * @author Plan refactor subsistema trace (Bloque H)
 * @version 0.1.0
 */
export function useTraceCache() {
  const getKey = useCallback((params: TraceCacheKeyParams): string => {
    return buildTraceCacheKey(params);
  }, []);

  const get = useCallback((key: string): TraceCacheEntry | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as TraceCacheEntry;
      if (!entry?.data || typeof entry.ts !== "number") return null;
      if (Date.now() - entry.ts >= TRACE_CACHE_TTL_MS) return null;
      return entry;
    } catch {
      return null;
    }
  }, []);

  const set = useCallback((key: string, data: TraceApiResponse): void => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({ data, ts: Date.now() } as TraceCacheEntry),
      );
    } catch {
      // Ignorar si sessionStorage está lleno
    }
  }, []);

  const invalidate = useCallback((key: string): void => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignorar
    }
  }, []);

  /** Invalida todas las entradas de cache de trace (por prefijo). */
  const invalidateAll = useCallback((): void => {
    if (typeof window === "undefined") return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("analyzerTraceCache:")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // Ignorar
    }
  }, []);

  return {
    getKey,
    get,
    set,
    invalidate,
    invalidateAll,
    ttlMs: TRACE_CACHE_TTL_MS,
  };
}
