import type { AnalyzeOpenResponse, Program, SnapshotRecursiveMethod } from "@aa/types";

import { buildSnapshot } from "../../domain/snapshot-builder";

const FIXTURE_CREATED_AT = "2026-03-19T12:00:00.000Z";

function makeProgram(name: string): Program {
  return {
    type: "Program",
    pos: { line: 1, column: 1 },
    body: [
      {
        type: "ProcDef",
        pos: { line: 1, column: 1 },
        name,
        params: [
          {
            type: "Param",
            pos: { line: 1, column: 15 },
            name: "n",
          },
        ],
        body: {
          type: "Block",
          pos: { line: 1, column: 1 },
          body: [],
        },
      },
    ],
  };
}

function baseCase(theta: string): AnalyzeOpenResponse {
  return {
    ok: true,
    byLine: [
      {
        line: 1,
        kind: "for",
        ck: "C_1",
        count: "n",
        count_raw: "\\sum_{i=1}^{n} 1",
        note: "fixture",
      },
    ],
    totals: {
      T_open: "C_1 n + C_0",
      T_polynomial: "C_1 n + C_0",
      big_o: "O(n)",
      big_omega: "\\Omega(n)",
      big_theta: theta,
      procedure: ["Paso 1", "Paso 2"],
      notes: ["Nota 1"],
    },
  };
}

function recursiveCase(
  method: SnapshotRecursiveMethod,
  recurrenceType: "divide_conquer" | "divide_conquer_multi" | "linear_shift",
): AnalyzeOpenResponse {
  const totals = baseCase("\\Theta(n)").totals;
  const divideMethod =
    method === "master" || method === "iteration" || method === "recursion_tree"
      ? method
      : "master";

  if (recurrenceType === "divide_conquer") {
    totals.recurrence = {
      type: "divide_conquer",
      form: "T(n)=2T(n/2)+n",
      a: 2,
      b: 2,
      f: "n",
      n0: 1,
      applicable: true,
      notes: ["divide_conquer"],
      method: divideMethod,
    };
  } else if (recurrenceType === "divide_conquer_multi") {
    totals.recurrence = {
      type: "divide_conquer_multi",
      form: "T(n)=T(n/2)+T(n/3)+n",
      terms: [
        { a: 1, b: 2 },
        { a: 1, b: 3 },
      ],
      a: 2,
      f: "n",
      n0: 1,
      applicable: true,
      notes: ["divide_conquer_multi"],
      method: divideMethod,
    };
  } else {
    totals.recurrence = {
      type: "linear_shift",
      form: "T(n)=T(n-1)+T(n-2)+1",
      order: 2,
      shifts: [1, 2],
      coefficients: [1, 1],
      "g(n)": "1",
      n0: 1,
      applicable: true,
      notes: ["linear_shift"],
      method: "characteristic_equation",
    };
  }

  if (method === "master") {
    totals.master = {
      case: 2,
      nlogba: "n",
      comparison: "equal",
      regularity: {
        checked: true,
        note: "ok",
      },
      theta: "\\Theta(n \\log n)",
    };
    totals.big_theta = "\\Theta(n \\log n)";
  }

  if (method === "iteration") {
    totals.iteration = {
      method: "iteration",
      g_function: "n/2",
      expansions: ["T(n)=2T(n/2)+n", "T(n)=4T(n/4)+2n"],
      general_form: "T(n)=2^k T(n/2^k)+kn",
      base_case: {
        condition: "n/2^k=1",
        k: "\\log_2 n",
      },
      summation: {
        expression: "\\sum_{i=0}^{k-1} n",
        evaluated: "n \\log n",
      },
      theta: "\\Theta(n \\log n)",
    };
    totals.big_theta = "\\Theta(n \\log n)";
  }

  if (method === "recursion_tree") {
    totals.recursion_tree = {
      method: "recursion_tree",
      recurrence_type: "divide_conquer",
      levels: [
        {
          level: 0,
          num_nodes: 1,
          num_nodes_latex: "1",
          subproblem_size_latex: "n",
          cost_per_node_latex: "n",
          total_cost_latex: "n",
        },
        {
          level: 1,
          num_nodes: 2,
          num_nodes_latex: "2",
          subproblem_size_latex: "n/2",
          cost_per_node_latex: "n/2",
          total_cost_latex: "n",
        },
      ],
      height: "\\log_2 n",
      summation: {
        expression: "\\sum_{i=0}^{\\log_2 n} n",
        evaluated: "n \\log n",
        theta: "\\Theta(n \\log n)",
      },
      dominating_level: {
        level: "all",
        reason: "all levels have same cost",
      },
      table_by_levels: [
        {
          level: 0,
          num_nodes: "1",
          subproblem_size: "n",
          cost_per_node: "n",
          total_cost: "n",
        },
      ],
      theta: "\\Theta(n \\log n)",
    };
    totals.big_theta = "\\Theta(n \\log n)";
  }

  if (method === "characteristic_equation") {
    totals.characteristic_equation = {
      method: "characteristic_equation",
      is_dp_linear: true,
      equation: "r^2-r-1=0",
      roots: [
        { root: "\\phi", multiplicity: 1 },
        { root: "1-\\phi", multiplicity: 1 },
      ],
      dominant_root: "\\phi",
      growth_rate: 1.618,
      solved_by: "characteristic_equation",
      homogeneous_solution: "A\\phi^n + B(1-\\phi)^n",
      particular_solution: "0",
      general_solution: "A\\phi^n + B(1-\\phi)^n",
      base_cases: {
        "T(0)": 0,
        "T(1)": 1,
      },
      closed_form: "\\frac{\\phi^n}{\\sqrt{5}}",
      dp_equivalence: "equivalent",
      theta: "\\Theta(\\phi^n)",
    };
    totals.big_theta = "\\Theta(\\phi^n)";
  }

  return {
    ...baseCase(totals.big_theta || "\\Theta(n)"),
    totals,
  };
}

function snapshotId(seed: string): string {
  return `00000000-0000-4000-8000-${seed.padEnd(12, "0").slice(0, 12)}`;
}

export function createIterativeSnapshot() {
  return buildSnapshot({
    source: "iterative(n) BEGIN FOR i <- 1 TO n DO PRINT i; END",
    locale: "es",
    sourceOrigin: "editor",
    analysisId: "fixture-iterative",
    snapshotId: snapshotId("iterative"),
    createdAt: FIXTURE_CREATED_AT,
    parse: {
      ok: true,
      available: true,
      runtime: "python",
      ast: makeProgram("iterative"),
      errors: [],
    },
    classify: { kind: "iterative", method: "ast" },
    analyze: {
      ok: true,
      has_case_variability: false,
      worst: baseCase("\\Theta(n)"),
      best: "same_as_worst",
      avg: "same_as_worst",
    },
    traceByCase: {},
  });
}

export function createRecursiveSnapshot(method: SnapshotRecursiveMethod) {
  const recurrenceType =
    method === "characteristic_equation" ? "linear_shift" : "divide_conquer";
  return buildSnapshot({
    source: "recursive(n) BEGIN IF n <= 1 THEN RETURN 1; RETURN recursive(n/2)+n; END",
    locale: "en",
    sourceOrigin: "editor",
    analysisId: `fixture-${method}`,
    snapshotId: snapshotId(method),
    createdAt: FIXTURE_CREATED_AT,
    parse: {
      ok: true,
      available: true,
      runtime: "python",
      ast: makeProgram(`recursive_${method}`),
      errors: [],
    },
    classify: { kind: "recursive", method: "ast" },
    analyze: {
      ok: true,
      has_case_variability: false,
      worst: recursiveCase(method, recurrenceType),
      best: "same_as_worst",
      avg: "same_as_worst",
    },
    detectMethods: {
      ok: true,
      applicable_methods: [
        "master",
        "iteration",
        "recursion_tree",
        "characteristic_equation",
      ],
      default_method: method,
    },
    traceByCase: {},
  });
}

export function createHybridSnapshot() {
  return buildSnapshot({
    source: "hybrid(n) BEGIN FOR i <- 1 TO n DO x <- recursive(i); END",
    locale: "es",
    sourceOrigin: "editor",
    analysisId: "fixture-hybrid",
    snapshotId: snapshotId("hybrid"),
    createdAt: FIXTURE_CREATED_AT,
    parse: {
      ok: true,
      available: true,
      runtime: "python",
      ast: makeProgram("hybrid"),
      errors: [],
    },
    classify: { kind: "hybrid", method: "ast" },
    analyze: {
      ok: true,
      has_case_variability: true,
      worst: recursiveCase("master", "divide_conquer_multi"),
      best: baseCase("\\Theta(n)"),
      avg: recursiveCase("iteration", "divide_conquer"),
    },
    detectMethods: {
      ok: true,
      applicable_methods: ["master", "iteration", "recursion_tree"],
      default_method: "master",
    },
    traceByCase: {},
  });
}
