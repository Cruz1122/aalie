"use client";

import type { ParseError, Program } from "@aa/types";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ParseWorkerRequest,
  ParseWorkerResponse,
} from "../workers/parser.worker";

export interface ParseResult {
  ok: boolean;
  ast?: Program;
  errors?: ParseError[];
  isParsing: boolean;
}

/**
 * Hook para parsear código usando Web Worker
 * Incluye debounce de 150ms y cancelación automática de requests antiguos
 */
export function useParseWorker(code: string, debounceMs = 150): ParseResult {
  const [result, setResult] = useState<ParseResult>({
    ok: true,
    isParsing: false,
  });

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar worker
  useEffect(() => {
    // Crear worker
    workerRef.current = new Worker(
      new URL("../workers/parser.worker.ts", import.meta.url),
      { type: "module" }
    );

    // Escuchar respuestas
    workerRef.current.onmessage = (
      event: MessageEvent<ParseWorkerResponse>
    ) => {
      const response = event.data;
      
      // Solo procesar si es la versión más reciente
      if (response.id === requestIdRef.current) {
        setResult({
          ok: response.ok,
          ast: response.ast,
          errors: response.errors,
          isParsing: false,
        });
      }
    };

    // Manejar errores del worker
    workerRef.current.onerror = (error) => {
      console.error("Parser worker error:", error);
      setResult({
        ok: false,
        errors: [{ line: 1, column: 0, message: "Worker error" }],
        isParsing: false,
      });
    };

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Parsear código con debounce
  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Si el código está vacío, no parsear
    if (!code.trim()) {
      setResult({ ok: true, isParsing: false });
      return;
    }

    // Marcar como parseando inmediatamente
    setResult((prev) => ({ ...prev, isParsing: true }));

    // Debounce
    timeoutRef.current = setTimeout(() => {
      if (workerRef.current) {
        // Incrementar ID para cancelar requests antiguos
        requestIdRef.current += 1;

        const request: ParseWorkerRequest = {
          id: requestIdRef.current,
          code,
        };

        workerRef.current.postMessage(request);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [code, debounceMs]);

  return result;
}

/**
 * Hook alternativo para parsear bajo demanda (sin debounce automático)
 */
export function useParseWorkerOnDemand() {
  const [result, setResult] = useState<ParseResult>({
    ok: true,
    isParsing: false,
  });

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  // Inicializar worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/parser.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (
      event: MessageEvent<ParseWorkerResponse>
    ) => {
      const response = event.data;
      
      if (response.id === requestIdRef.current) {
        setResult({
          ok: response.ok,
          ast: response.ast,
          errors: response.errors,
          isParsing: false,
        });
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Parser worker error:", error);
      setResult({
        ok: false,
        errors: [{ line: 1, column: 0, message: "Worker error" }],
        isParsing: false,
      });
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const parse = useCallback((code: string) => {
    if (!workerRef.current) return;

    requestIdRef.current += 1;
    setResult((prev) => ({ ...prev, isParsing: true }));

    const request: ParseWorkerRequest = {
      id: requestIdRef.current,
      code,
    };

    workerRef.current.postMessage(request);
  }, []);

  return { result, parse };
}

