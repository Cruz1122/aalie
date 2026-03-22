import assert from "node:assert";
import { describe, it } from "node:test";

import { buildSnapshot } from "../domain/snapshot-builder";
import {
  createHybridSnapshot,
  createIterativeSnapshot,
  createRecursiveSnapshot,
} from "./fixtures/snapshot-fixtures";

describe("snapshot-builder", () => {
  it("normaliza best/avg cuando llegan como same_as_worst", () => {
    const snapshot = buildSnapshot({
      source: "iterative(n) BEGIN PRINT n; END",
      locale: "es",
      analysisId: "same-as-worst",
      snapshotId: "00000000-0000-4000-8000-000000000111",
      createdAt: "2026-03-19T12:00:00.000Z",
      classify: { kind: "iterative", method: "ast" },
      parse: {
        ok: true,
        available: true,
        runtime: "python",
        ast: {
          type: "Program",
          pos: { line: 1, column: 1 },
          body: [],
        },
        errors: [],
      },
      analyze: {
        ok: true,
        has_case_variability: false,
        worst: {
          ok: true,
          byLine: [],
          totals: {
            T_open: "C_1 n",
            T_polynomial: "C_1 n",
            big_o: "O(n)",
            big_omega: "\\Omega(n)",
            big_theta: "\\Theta(n)",
          },
        },
        best: "same_as_worst",
        avg: "same_as_worst",
      },
    });

    assert.ok(snapshot.globalResult.cases.worst);
    assert.strictEqual(snapshot.globalResult.cases.best?.T_open, "C_1 n");
    assert.strictEqual(snapshot.globalResult.cases.avg?.T_open, "C_1 n");
  });

  it("mapea recurrencias divide_conquer_multi y linear_shift", () => {
    const hybrid = createHybridSnapshot();
    const characteristic = createRecursiveSnapshot("characteristic_equation");

    assert.strictEqual(hybrid.internal.recurrence.status, "available");
    assert.strictEqual(hybrid.internal.recurrence.data?.type, "divide_conquer_multi");

    assert.strictEqual(characteristic.internal.recurrence.status, "available");
    assert.strictEqual(characteristic.internal.recurrence.data?.type, "linear_shift");
  });

  it("mantiene pseudocodigo normalizado pendiente y conserva invariante cuando existe", () => {
    const snapshot = createIterativeSnapshot();

    assert.strictEqual(snapshot.input.normalizedPseudocode.status, "not_implemented");
    assert.strictEqual(snapshot.iterative.status, "available");
    if (snapshot.iterative.status !== "available" || !snapshot.iterative.data) {
      assert.fail("iterative section should be available");
    }
    assert.strictEqual(snapshot.iterative.data.loopInvariant.status, "available");
    assert.strictEqual(snapshot.iterative.data.loopInvariant.data?.status, "ok");
  });
});
