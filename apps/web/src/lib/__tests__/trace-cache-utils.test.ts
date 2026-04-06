/**
 * Tests para trace-cache-utils.
 * Valida normalización y que la clave de cache invalida cuando cambia la config.
 *
 * @author Plan refactor subsistema trace (Bloque H)
 */
import { describe, expect, it } from "vitest";

import {
  normalizeSource,
  buildTraceCacheKey,
  TRACE_CONTRACT_VERSION,
} from "../trace-cache-utils";

describe("trace-cache-utils", () => {
  describe("normalizeSource", () => {
    it("colapsa espacios múltiples", () => {
      expect(normalizeSource("fact(  n  )  BEGIN")).toBe("fact( n ) BEGIN");
    });

    it("normaliza saltos de línea", () => {
      expect(normalizeSource("a\n\n\nb")).toBe("a b");
    });

    it("remueve comentarios de línea", () => {
      expect(
        normalizeSource("fact(n) BEGIN\n  // caso base\n  RETURN 1;\nEND"),
      ).toBe("fact(n) BEGIN RETURN 1; END");
    });

    it("remueve comentarios de bloque", () => {
      expect(
        normalizeSource("fact(n) BEGIN /* comentario */ RETURN 1; END"),
      ).toBe("fact(n) BEGIN RETURN 1; END");
    });

    it("fuentes semánticamente iguales (solo whitespace) producen mismo resultado", () => {
      const a = "  fact(n)\n  BEGIN\n    RETURN 1;\n  END  ";
      const b = "fact(n) BEGIN RETURN 1; END";
      expect(normalizeSource(a)).toBe(normalizeSource(b));
    });
  });

  describe("buildTraceCacheKey", () => {
    const baseParams = {
      source: "fact(n) BEGIN RETURN 1; END",
      case: "worst" as const,
      inputSize: 4,
      locale: "es",
      includeExecutionDiagram: true,
      includeCallTree: true,
    };

    it("misma config produce misma clave", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey(baseParams);
      expect(k1).toBe(k2);
    });

    it("source distinto produce clave distinta", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey({
        ...baseParams,
        source: "fact(n) BEGIN RETURN 2; END",
      });
      expect(k1).not.toBe(k2);
    });

    it("case distinto produce clave distinta", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey({ ...baseParams, case: "best" });
      expect(k1).not.toBe(k2);
    });

    it("inputSize distinto produce clave distinta", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey({ ...baseParams, inputSize: 8 });
      expect(k1).not.toBe(k2);
    });

    it("initialVariablesOverride distinto produce clave distinta", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey({
        ...baseParams,
        initialVariablesOverride: { A: [1, 2, 3], x: 2 },
      });
      const k3 = buildTraceCacheKey({
        ...baseParams,
        initialVariablesOverride: { A: [1, 2, 3, 4], x: 4 },
      });
      expect(k1).not.toBe(k2);
      expect(k2).not.toBe(k3);
    });

    it("locale distinto produce clave distinta", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey({ ...baseParams, locale: "en" });
      expect(k1).not.toBe(k2);
    });

    it("incluye versión del contrato", () => {
      expect(TRACE_CONTRACT_VERSION).toBeTruthy();
      const k = buildTraceCacheKey(baseParams);
      expect(k.startsWith("analyzerTraceCache:")).toBe(true);
    });
  });
});
