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
    const iteration = createRecursiveSnapshot("iteration");
    const master = createRecursiveSnapshot("master");
    const recursionTree = createRecursiveSnapshot("recursion_tree");

    assert.strictEqual(hybrid.internal.recurrence.status, "available");
    assert.strictEqual(hybrid.internal.recurrence.data?.type, "divide_conquer_multi");

    assert.strictEqual(characteristic.internal.recurrence.status, "available");
    assert.strictEqual(characteristic.internal.recurrence.data?.type, "linear_shift");
    assert.strictEqual(
      characteristic.internal.intermediateMath.data?.characteristicEquationStepByStep?.steps.length,
      12,
    );
    assert.strictEqual(characteristic.recursive.status, "available");
    if (characteristic.recursive.status !== "available" || !characteristic.recursive.data) {
      assert.fail("recursive section should be available");
    }
    assert.strictEqual(characteristic.recursive.data.stepByStep.status, "available");
    assert.strictEqual(characteristic.recursive.data.stepByStep.data?.steps.length, 12);

    assert.strictEqual(iteration.internal.recurrence.status, "available");
    assert.strictEqual(iteration.internal.recurrence.data?.method, "iteration");
    assert.strictEqual(iteration.recursive.status, "available");
    if (iteration.recursive.status !== "available" || !iteration.recursive.data) {
      assert.fail("recursive section should be available");
    }
    assert.strictEqual(iteration.recursive.data.stepByStep.status, "available");
    assert.strictEqual(iteration.recursive.data.stepByStep.data?.steps.length, 11);

    assert.strictEqual(master.internal.recurrence.status, "available");
    assert.strictEqual(master.internal.recurrence.data?.method, "master");
    assert.strictEqual(
      master.internal.intermediateMath.data?.masterStepByStep?.steps.length,
      10,
    );
    assert.strictEqual(master.recursive.status, "available");
    if (master.recursive.status !== "available" || !master.recursive.data) {
      assert.fail("recursive section should be available for master");
    }
    assert.strictEqual(master.recursive.data.stepByStep.status, "available");
    assert.strictEqual(master.recursive.data.stepByStep.data?.steps.length, 10);

    assert.strictEqual(recursionTree.internal.recurrence.status, "available");
    assert.strictEqual(recursionTree.internal.recurrence.data?.method, "recursion_tree");
    assert.strictEqual(
      recursionTree.internal.intermediateMath.data?.recursionTreeStepByStep?.steps.length,
      11,
    );
    assert.strictEqual(recursionTree.recursive.status, "available");
    if (recursionTree.recursive.status !== "available" || !recursionTree.recursive.data) {
      assert.fail("recursive section should be available for recursion tree");
    }
    assert.strictEqual(recursionTree.recursive.data.stepByStep.status, "available");
    assert.strictEqual(recursionTree.recursive.data.stepByStep.data?.steps.length, 11);
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
