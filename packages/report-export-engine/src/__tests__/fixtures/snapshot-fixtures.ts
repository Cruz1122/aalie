import type {
  AnalyzeOpenResponse,
  CharacteristicStepKind,
  IterationStepKind,
  MasterStepKind,
  RecursionTreeStepKind,
  LoopInvariant,
  Program,
  RecursiveMethodStepBundle,
  SnapshotRecursiveMethod,
} from "@aa/types";

import { buildSnapshot, type TraceResponseLike } from "../../domain/snapshot-builder";

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

function iterativeFactorialCase(): AnalyzeOpenResponse {
  return {
    ok: true,
    byLine: [
      {
        line: 2,
        kind: "assign",
        ck: "C_{1}",
        count: "1",
        count_raw: "1",
        ops: 1,
        procedure: ["1"],
      },
      {
        line: 3,
        kind: "for",
        ck: "C_{2}",
        count: "n",
        count_raw: "n",
        note: "Cabecera de for i=2..n",
        ops: 3,
        procedure: ["n"],
      },
      {
        line: 4,
        kind: "assign",
        ck: "C_{3}",
        count: "n - 1",
        count_raw: "\\sum_{i=2}^{n} 1",
        ops: 2,
        procedure: [
          "\\sum_{i=2}^{n} 1",
          "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1",
        ],
      },
      {
        line: 6,
        kind: "return",
        ck: "C_{4}",
        count: "1",
        count_raw: "1",
        ops: 1,
        procedure: ["1"],
      },
    ],
    totals: {
      T_open: "5 n",
      T_polynomial:
        "(C_{3}) \\cdot 2 n + (C_{2}) \\cdot 3 n + (C_{3}) \\cdot -2 + (C_{1} + C_{4})",
      big_o: "O(n)",
      big_omega: "\\Omega(n)",
      big_theta: "\\Theta(n)",
      procedure: [
        "Se suman los aportes por línea y se obtiene T(n)=5n.",
        "El término dominante es lineal en n.",
      ],
      notes: ["El crecimiento asintótico es lineal."],
    },
  };
}

const ITERATIVE_LOOP_INVARIANT: LoopInvariant = {
  status: "ok",
  reason: null,
  selectedLoop: {
    nodeType: "FOR",
    lineStart: 3,
    lineEnd: 4,
    depth: 0,
    score: 1.7,
    patternType: "accumulation",
    controlVariables: ["i"],
    stateVariables: ["resultado"],
    boundVariables: ["n"],
    collectionVariables: [],
    targetVariables: [],
    keyUpdates: [
      "i <- i + 1 (implicit FOR update)",
      "resultado <- (resultado) * (i)",
    ],
    keyConditions: ["i <= n"],
  },
  invariant: {
    propertyStatement:
      "Al inicio de cada iteración, resultado contiene el producto correcto de los valores ya incorporados por el ciclo.",
    initialization:
      "Inicialización: resultado = 1, el neutro multiplicativo para comenzar sin contribuciones previas.",
    maintenance:
      "Mantenimiento: en cada paso, resultado se multiplica por el siguiente valor del rango, y así preserva el producto parcial correcto.",
    finalization:
      "Finalización: al terminar el ciclo, resultado coincide con el producto final de todos los valores procesados.",
  },
  didacticSummary:
    "El ciclo mantiene en resultado un producto parcial exacto, sin depender de acceso a arreglos.",
  evidence: {
    conditionReads: ["i", "n"],
    bodyWrites: ["resultado"],
    bodyReads: ["i", "resultado"],
    detectedFeatures: [
      "confidence:0.840",
      "has_accumulator_update",
      "has_multiplicative_accumulator",
      "pattern:accumulation",
      "rule:partial aggregate maintained each iteration",
      "rule:self-referential accumulator update",
      "template:product_scalar",
    ],
    classificationConfidence: 0.84,
    templateVariant: "product_scalar",
  },
};

const ITERATIVE_TRACE_STEPS = [
  {
    id: "step_1",
    step_number: 1,
    line: 2,
    kind: "assign",
    variables: { n: 4, resultado: 1 },
    cost: "C_1",
    accumulated_cost: "C_1",
    description: "Assignment: resultado = 1",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "assign",
  },
  {
    id: "step_2",
    step_number: 2,
    line: 3,
    kind: "loop_enter",
    variables: { n: 4, resultado: 1 },
    iteration: { loopVar: "i", currentValue: 2, maxValue: 4 },
    cost: "C_2",
    accumulated_cost: "C_1 + C_2",
    description: "FOR i = 2..4",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "loop_enter",
  },
  {
    id: "step_3",
    step_number: 3,
    line: 3,
    kind: "loop_iter_enter",
    variables: { n: 4, resultado: 1, i: 2 },
    variables_changed: { i: 2 },
    iteration: { loopVar: "i", currentValue: 2, maxValue: 4, iteration: 1 },
    cost: "C_3",
    accumulated_cost: "C_1 + C_2 + C_3",
    description: "Iteration 1: i = 2",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "loop_iter_enter",
  },
  {
    id: "step_4",
    step_number: 4,
    line: 4,
    kind: "assign",
    variables: { n: 4, resultado: 2, i: 2 },
    variables_changed: { resultado: 2 },
    cost: "C_4",
    accumulated_cost: "C_1 + C_2 + C_3 + C_4",
    description: "Assignment: resultado = 2",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "assign",
  },
  {
    id: "step_5",
    step_number: 5,
    line: 3,
    kind: "loop_iter_exit",
    variables: { n: 4, resultado: 2, i: 2 },
    iteration: { loopVar: "i", currentValue: 2, maxValue: 4, iteration: 1 },
    cost: "C_5",
    accumulated_cost: "C_1 + C_2 + C_3 + C_4 + C_5",
    description: "Fin iter 1",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "loop_iter_exit",
  },
  {
    id: "step_6",
    step_number: 6,
    line: 3,
    kind: "loop_iter_enter",
    variables: { n: 4, resultado: 2, i: 3 },
    variables_changed: { i: 3 },
    iteration: { loopVar: "i", currentValue: 3, maxValue: 4, iteration: 2 },
    cost: "C_6",
    accumulated_cost: "C_1 + C_2 + C_3 + C_4 + C_5 + C_6",
    description: "Iteration 2: i = 3",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "loop_iter_enter",
  },
  {
    id: "step_7",
    step_number: 7,
    line: 4,
    kind: "assign",
    variables: { n: 4, resultado: 6, i: 3 },
    variables_changed: { resultado: 6 },
    cost: "C_7",
    accumulated_cost: "C_1 + C_2 + C_3 + C_4 + C_5 + C_6 + C_7",
    description: "Assignment: resultado = 6",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "assign",
  },
  {
    id: "step_8",
    step_number: 8,
    line: 3,
    kind: "loop_iter_exit",
    variables: { n: 4, resultado: 6, i: 3 },
    iteration: { loopVar: "i", currentValue: 3, maxValue: 4, iteration: 2 },
    cost: "C_8",
    accumulated_cost: "C_1 + C_2 + C_3 + C_4 + C_5 + C_6 + C_7 + C_8",
    description: "Fin iter 2",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "loop_iter_exit",
  },
  {
    id: "step_9",
    step_number: 9,
    line: 3,
    kind: "loop_iter_enter",
    variables: { n: 4, resultado: 6, i: 4 },
    variables_changed: { i: 4 },
    iteration: { loopVar: "i", currentValue: 4, maxValue: 4, iteration: 3 },
    cost: "C_9",
    accumulated_cost: "C_1 + C_2 + C_3 + C_4 + C_5 + C_6 + C_7 + C_8 + C_9",
    description: "Iteration 3: i = 4",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "loop_iter_enter",
  },
  {
    id: "step_10",
    step_number: 10,
    line: 4,
    kind: "assign",
    variables: { n: 4, resultado: 24, i: 4 },
    variables_changed: { resultado: 24 },
    cost: "C_10",
    accumulated_cost:
      "C_1 + C_2 + C_3 + C_4 + C_5 + C_6 + C_7 + C_8 + C_9 + C_10",
    description: "Assignment: resultado = 24",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "assign",
  },
  {
    id: "step_11",
    step_number: 11,
    line: 3,
    kind: "loop_iter_exit",
    variables: { n: 4, resultado: 24, i: 4 },
    iteration: { loopVar: "i", currentValue: 4, maxValue: 4, iteration: 3 },
    cost: "C_11",
    accumulated_cost:
      "C_1 + C_2 + C_3 + C_4 + C_5 + C_6 + C_7 + C_8 + C_9 + C_10 + C_11",
    description: "Fin iter 3",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "loop_iter_exit",
  },
  {
    id: "step_12",
    step_number: 12,
    line: 3,
    kind: "loop_exit",
    variables: { n: 4, resultado: 24, i: 4 },
    iteration: { loopVar: "i", currentValue: 4, maxValue: 4 },
    cost: "C_12",
    accumulated_cost:
      "C_1 + C_2 + C_3 + C_4 + C_5 + C_6 + C_7 + C_8 + C_9 + C_10 + C_11 + C_12",
    description: "Salida FOR i",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "loop_exit",
  },
  {
    id: "step_13",
    step_number: 13,
    line: 6,
    kind: "return_emit",
    variables: { n: 4, resultado: 24, i: 4 },
    cost: "C_13",
    accumulated_cost:
      "C_1 + C_2 + C_3 + C_4 + C_5 + C_6 + C_7 + C_8 + C_9 + C_10 + C_11 + C_12 + C_13",
    description: "RETURN 24",
    microseconds: 3.0,
    tokens: 1,
    eventKind: "return_emit",
  },
];

function iterativeTraceFixture(): TraceResponseLike {
  return {
    ok: true,
    algorithmKind: "iterative",
    trace: {
      kind: "iterative",
      steps: ITERATIVE_TRACE_STEPS,
      summary: {
        totalSteps: 13,
        totalCalls: 0,
        maxRecursionDepth: 0,
        algorithmKind: "iterative",
      },
      diagnostics: {
        truncated: false,
        warnings: [],
      },
    },
  };
}

function recursiveTraceFixture(): TraceResponseLike {
  return {
    ok: true,
    algorithmKind: "recursive",
    trace: {
      kind: "recursive",
      steps: [
        {
          id: "step_1",
          step_number: 1,
          line: 1,
          kind: "call_enter",
          eventKind: "call_enter",
          variables: { n: 4 },
          recursion: { depth: 0, callId: "call_1", params: { n: 4 }, procedure: "factorial" },
        },
      ],
      summary: {
        totalSteps: 7,
        totalCalls: 4,
        maxRecursionDepth: 3,
        algorithmKind: "recursive",
      },
      diagnostics: {
        truncated: false,
        warnings: [],
      },
      callTreeSource: {
        root_calls: ["call_1"],
        calls: [
          { id: "call_1", depth: 0, params: { n: 4 }, children: ["call_2"], return_value: 24 },
          { id: "call_2", depth: 1, params: { n: 3 }, children: ["call_3"], return_value: 6 },
          { id: "call_3", depth: 2, params: { n: 2 }, children: ["call_4"], return_value: 2 },
          { id: "call_4", depth: 3, params: { n: 1 }, children: [], return_value: 1 },
        ],
      },
    },
    derived: {
      structuredTrace: {
        patternKind: "tail_recursive_linear",
        graph: {
          nodes: [
            { id: "call_1", type: "default", position: { x: 0, y: 0 }, data: { label: "factorial(n=4)\n→ 24" } },
            { id: "call_2", type: "default", position: { x: 0, y: 0 }, data: { label: "factorial(n=3)\n→ 6" } },
            { id: "call_3", type: "default", position: { x: 0, y: 0 }, data: { label: "factorial(n=2)\n→ 2" } },
            { id: "call_4", type: "default", position: { x: 0, y: 0 }, data: { label: "factorial(n=1)\n→ 1" } },
          ],
          edges: [
            { id: "e1", source: "call_1", target: "call_2", label: "", type: "smoothstep" },
            { id: "e2", source: "call_2", target: "call_3", label: "", type: "smoothstep" },
            { id: "e3", source: "call_3", target: "call_4", label: "", type: "smoothstep" },
          ],
        },
        classification: {
          patternKind: "tail_recursive_linear",
          confidence: "high",
          evidence: ["fixture"],
        },
      },
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
    const isIterationLinearShift = method === "iteration";
    totals.recurrence = {
      type: "linear_shift",
      form: isIterationLinearShift ? "T(n)=T(n-1)+n" : "T(n)=T(n-1)+T(n-2)+1",
      order: isIterationLinearShift ? 1 : 2,
      shifts: isIterationLinearShift ? [1] : [1, 2],
      coefficients: isIterationLinearShift ? [1] : [1, 1],
      "g(n)": isIterationLinearShift ? "n" : "1",
      n0: isIterationLinearShift ? 0 : 1,
      applicable: true,
      notes: ["linear_shift"],
      method: isIterationLinearShift ? "iteration" : "characteristic_equation",
    };
  }

  if (method === "master") {
    const masterStepKinds: MasterStepKind[] = [
      "recurrence_detected",
      "master_form_validated",
      "master_parameters_extracted",
      "critical_exponent_computed",
      "reference_growth_built",
      "growth_comparison_performed",
      "master_case_evaluated",
      "regularity_checked",
      "master_applicability_decided",
      "asymptotic_conclusion",
    ];
    const masterStepBundle: RecursiveMethodStepBundle = {
      method: "master",
      version: "master_steps_v1",
      overallStatus: "complete",
      steps: masterStepKinds.map((kind, index) => ({
        id: `master_s${index + 1}`,
        index: index + 1,
        kind,
        title: `Master Step ${index + 1}`,
        status: "complete",
        math: {
          primaryLatex: index === 9 ? "T(n)=\\Theta(n \\log n)" : undefined,
          items: [],
        },
        summary: `Fixture summary for master step ${index + 1}`,
        conceptNote: `Fixture concept for ${kind}`,
        teachingNote: `Fixture concept for ${kind}`,
        warning: null,
        confidence: "high",
        payload: {},
        template: {
          summaryKey: "fixture.summary",
          conceptKey: "fixture.concept",
          params: {},
        },
        audit: {
          codes: [],
          assumptions: [],
          blockedBy: [],
        },
      })),
    };
    totals.master = {
      method: "master",
      case: 2,
      nlogba: "n",
      comparison: "equal",
      regularity: {
        checked: true,
        note: "ok",
      },
      theta: "\\Theta(n \\log n)",
      step_by_step: masterStepBundle,
    };
    totals.big_theta = "\\Theta(n \\log n)";
  }

  if (method === "iteration") {
    const iterationStepKinds: IterationStepKind[] = [
      "recurrence_detected",
      "applicability_validated",
      "base_case_identified",
      "initial_unrolling_built",
      "k_pattern_generalized",
      "k_value_solved",
      "summation_built",
      "summation_simplified",
      "final_expression_built",
      "dominant_term_identified",
      "asymptotic_concluded",
    ];
    const iterationStepBundle: RecursiveMethodStepBundle = {
      method: "iteration",
      version: "iter_steps_v1",
      overallStatus: "complete",
      steps: iterationStepKinds.map((kind, index) => ({
        id: `iter_s${index + 1}`,
        index: index + 1,
        kind,
        title: `Step ${index + 1}`,
        status: "complete",
        math: {
          primaryLatex: index === 10 ? "T(n)=\\Theta(n)" : undefined,
          items: [],
        },
        summary: `Fixture summary for step ${index + 1}`,
        conceptNote: `Fixture concept for ${kind}`,
        teachingNote: `Fixture concept for ${kind}`,
        warning: null,
        confidence: "high",
        payload: {},
        template: {
          summaryKey: "fixture.summary",
          conceptKey: "fixture.concept",
          params: {},
        },
        audit: {
          codes: [],
          assumptions: [],
          blockedBy: [],
        },
      })),
    };
    totals.iteration = {
      method: "iteration",
      g_function: "n-1",
      expansions: ["T(n)=T(n-1)+n", "T(n)=T(n-2)+(n-1)+n"],
      general_form: "T(n)=T(n-k)+\\sum_{j=0}^{k-1} g(n-j)",
      base_case: {
        condition: "n-k=0",
        k: "n",
      },
      summation: {
        expression: "T(n)=T(0)+\\sum_{i=1}^{n} i",
        evaluated: "\\sum_{i=1}^{n} i=\\frac{n(n+1)}{2}",
      },
      theta: "\\Theta(n^2)",
      step_by_step: iterationStepBundle,
    };
    totals.big_theta = "\\Theta(n^2)";
  }

  if (method === "recursion_tree") {
    const treeStepKinds: RecursionTreeStepKind[] = [
      "recurrence_detected",
      "recursion_tree_applicability_check",
      "tree_parameters_extracted",
      "level_model_built",
      "level_cost_computed",
      "tree_height_determined",
      "leaf_cost_computed",
      "total_tree_sum_built",
      "total_tree_sum_simplified",
      "dominant_term_identified",
      "asymptotic_conclusion",
    ];
    const treeStepBundle: RecursiveMethodStepBundle = {
      method: "recursion_tree",
      version: "rt_steps_v1",
      overallStatus: "complete",
      steps: treeStepKinds.map((kind, index) => ({
        id: `rt_s${index + 1}`,
        index: index + 1,
        kind,
        title: `Tree Step ${index + 1}`,
        status: "complete",
        math: {
          primaryLatex: index === 10 ? "T(n)=\\Theta(n \\log n)" : undefined,
          items: [],
        },
        summary: `Fixture summary for recursion tree step ${index + 1}`,
        conceptNote: `Fixture concept for ${kind}`,
        teachingNote: `Fixture concept for ${kind}`,
        warning: null,
        confidence: "high",
        payload: {},
        template: {
          summaryKey: "fixture.summary",
          conceptKey: "fixture.concept",
          params: {},
        },
        audit: {
          codes: [],
          assumptions: [],
          blockedBy: [],
        },
      })),
    };
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
      step_by_step: treeStepBundle,
    };
    totals.big_theta = "\\Theta(n \\log n)";
  }

  if (method === "characteristic_equation") {
    const characteristicStepKinds: CharacteristicStepKind[] = [
      "recurrence_detected",
      "applicability_validated",
      "homogeneity_classified",
      "homogeneous_part_extracted",
      "characteristic_polynomial_built",
      "roots_computed",
      "homogeneous_solution_built",
      "particular_solution_built",
      "general_solution_built",
      "base_conditions_applied",
      "closed_form_simplified",
      "dominant_term_concluded",
    ];
    const stepBundle: RecursiveMethodStepBundle = {
      method: "characteristic_equation",
      version: "ceq_steps_v1",
      overallStatus: "complete",
      steps: characteristicStepKinds.map((kind, index) => ({
        id: `ceq_s${index + 1}`,
        index: index + 1,
        kind,
        title: `Step ${index + 1}`,
        status: "complete",
        math: {
          primaryLatex: index === 4 ? "r^2-r-1=0" : undefined,
          items: [],
        },
        summary: `Fixture summary for step ${index + 1}`,
        conceptNote: `Fixture concept for ${kind}`,
        teachingNote: `Fixture concept for ${kind}`,
        warning: null,
        confidence: "high",
        payload: {},
        template: {
          summaryKey: "fixture.summary",
          conceptKey: "fixture.concept",
          params: {},
        },
        audit: {
          codes: [],
          assumptions: [],
          blockedBy: [],
        },
      })),
    };

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
      step_by_step: stepBundle,
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
  const source = [
    "factorial(n) BEGIN",
    "    resultado <- 1;",
    "    FOR i <- 2 TO n DO BEGIN",
    "        resultado <- resultado * i;",
    "    END;",
    "    RETURN resultado;",
    "END",
  ].join("\n");

  return buildSnapshot({
    source,
    locale: "es",
    sourceOrigin: "editor",
    analysisId: "fixture-iterative",
    snapshotId: snapshotId("iterative"),
    createdAt: FIXTURE_CREATED_AT,
    parse: {
      ok: true,
      available: true,
      runtime: "python",
      ast: makeProgram("factorial"),
      errors: [],
    },
    classify: { kind: "iterative", method: "ast" },
    analyze: {
      ok: true,
      has_case_variability: false,
      loopInvariant: ITERATIVE_LOOP_INVARIANT,
      worst: iterativeFactorialCase(),
      best: "same_as_worst",
      avg: "same_as_worst",
    },
    traceByCase: {
      worst: iterativeTraceFixture(),
      best: iterativeTraceFixture(),
      avg: iterativeTraceFixture(),
    },
    llm: {
      raw: { provider: "fixture", model: "fixture-llm" },
      normalized: {
        verdict: "coincide",
        confidence: 0.93,
        matches: [
          "Coincide en Theta(n)",
          "Coincide en la recurrencia iterativa por acumulación",
        ],
        differences: ["Sin diferencias críticas."],
        note: "Comparación LLM de fixture.",
      },
    },
    gpuCpu: {
      primaryRecommendation: "cpu",
      internalVerdict: "cpu",
      confidence: "high",
      scores: { cpu: 78, gpu: 35, hybrid: 48 },
      summary: "The algorithm accumulates state between iterations, introducing sequential dependency. CPU is recommended.",
      reasons: {
        positive: [],
        negative: ["The algorithm accumulates state between iterations, introducing sequential dependency."],
        blockers: ["Loop-carried dependency: 1 occurrence(s) — iteration N+1 depends on N"],
        opportunities: ["Scalar reduction detected; parallelizable with a parallel reduction scheme."],
      },
      detectedPatterns: [
        { name: "reduction", confidence: 0.8, evidence: ["1 scalar reduction(s) detected", "Accumulator pattern in loop body"] },
      ],
      evidence: [
        { kind: "veto", message: "Loop-carried dependency: 1 occurrence(s) — iteration N+1 depends on N" },
      ],
      diagnostics: {
        controlRegularity: "regular",
        memoryRegularity: "unknown",
        dependencyStrength: "weak",
        parallelismType: "limited",
      },
    },
  });
}

export function createRecursiveSnapshot(method: SnapshotRecursiveMethod) {
  const recurrenceType =
    method === "characteristic_equation" || method === "iteration"
      ? "linear_shift"
      : "divide_conquer";
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
    traceByCase: {
      worst: recursiveTraceFixture(),
    },
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
