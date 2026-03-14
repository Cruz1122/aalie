/**
 * Tests para trace-cache-utils.
 * Valida normalización y que la clave de cache invalida cuando cambia la config.
 *
 * @author Plan refactor subsistema trace (Bloque H)
 */
import assert from "node:assert";
import { describe, it } from "node:test";

import {
  normalizeSource,
  buildTraceCacheKey,
  TRACE_CONTRACT_VERSION,
} from "../trace-cache-utils";

describe("trace-cache-utils", () => {
  describe("normalizeSource", () => {
    it("colapsa espacios múltiples", () => {
      assert.strictEqual(
        normalizeSource("fact(  n  )  BEGIN"),
        "fact( n ) BEGIN",
      );
    });

    it("normaliza saltos de línea", () => {
      assert.strictEqual(
        normalizeSource("a\n\n\nb"),
        "a b",
      );
    });

    it("remueve comentarios de línea", () => {
      assert.strictEqual(
        normalizeSource("fact(n) BEGIN\n  // caso base\n  RETURN 1;\nEND"),
        "fact(n) BEGIN RETURN 1; END",
      );
    });

    it("remueve comentarios de bloque", () => {
      assert.strictEqual(
        normalizeSource("fact(n) BEGIN /* comentario */ RETURN 1; END"),
        "fact(n) BEGIN RETURN 1; END",
      );
    });

    it("fuentes semánticamente iguales (solo whitespace) producen mismo resultado", () => {
      const a = "  fact(n)\n  BEGIN\n    RETURN 1;\n  END  ";
      const b = "fact(n) BEGIN RETURN 1; END";
      assert.strictEqual(normalizeSource(a), normalizeSource(b));
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
      assert.strictEqual(k1, k2);
    });

    it("source distinto produce clave distinta", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey({ ...baseParams, source: "fact(n) BEGIN RETURN 2; END" });
      assert.notStrictEqual(k1, k2);
    });

    it("case distinto produce clave distinta", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey({ ...baseParams, case: "best" });
      assert.notStrictEqual(k1, k2);
    });

    it("inputSize distinto produce clave distinta", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey({ ...baseParams, inputSize: 8 });
      assert.notStrictEqual(k1, k2);
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
      assert.notStrictEqual(k1, k2);
      assert.notStrictEqual(k2, k3);
    });

    it("locale distinto produce clave distinta", () => {
      const k1 = buildTraceCacheKey(baseParams);
      const k2 = buildTraceCacheKey({ ...baseParams, locale: "en" });
      assert.notStrictEqual(k1, k2);
    });

    it("incluye versión del contrato", () => {
      assert.ok(TRACE_CONTRACT_VERSION);
      const k = buildTraceCacheKey(baseParams);
      assert.ok(k.startsWith("analyzerTraceCache:"));
    });
  });
});
