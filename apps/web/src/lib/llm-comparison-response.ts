type JsonRecord = Record<string, unknown>;

const CASE_ALIASES = {
  worst: ["worst", "worst_case", "worstCase", "peor", "peor_caso"],
  best: ["best", "best_case", "bestCase", "mejor", "mejor_caso"],
  avg: [
    "avg",
    "average",
    "average_case",
    "averageCase",
    "avg_case",
    "avgCase",
    "promedio",
    "caso_promedio",
  ],
} as const;

const FIELD_ALIASES = {
  T_open: [
    "T_open",
    "t_open",
    "tOpen",
    "Topen",
    "efficiency_equation",
    "efficiencyEquation",
    "full_efficiency_equation",
    "fullEfficiencyEquation",
  ],
  T_polynomial: [
    "T_polynomial",
    "t_polynomial",
    "tPolynomial",
    "Tpolynomial",
    "polynomial_form",
    "polynomialForm",
  ],
  big_o: ["big_o", "big_O", "bigO", "BigO", "O"],
  big_omega: ["big_omega", "big_Omega", "bigOmega", "BigOmega", "Omega"],
  big_theta: ["big_theta", "bigTheta", "BigTheta", "Theta", "theta"],
} as const;

const STRUCTURAL_ALIASES = {
  recurrence: ["recurrence", "recurrence_relation", "recurrenceRelation"],
  characteristic_equation: [
    "characteristic_equation",
    "characteristicEquation",
  ],
  recursion_tree: ["recursion_tree", "recursionTree"],
  step_by_step: ["step_by_step", "stepByStep", "walkthrough"],
  method_details: ["method_details", "methodDetails"],
  iteration_details: ["iteration_details", "iterationDetails"],
} as const;

const NOTE_ALIASES = [
  "note",
  "observation",
  "observacion",
  "observación",
  "comment",
  "commentary",
  "feedback",
];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, keys: readonly string[]): JsonRecord | null {
  if (!isRecord(value)) return null;

  for (const key of keys) {
    const candidate = value[key];
    if (isRecord(candidate)) return candidate;
  }

  return null;
}

function hasAnyKey(value: JsonRecord, keys: readonly string[]): boolean {
  return keys.some((key) => key in value);
}

function readText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;

  if (!isRecord(value)) return undefined;

  for (const key of [
    "value",
    "text",
    "latex",
    "formula",
    "expression",
    "notation",
    "result",
  ]) {
    const nested = value[key];
    if (typeof nested === "string" && nested.trim()) return nested;
  }

  return undefined;
}

function hasCaseFields(value: JsonRecord): boolean {
  return (
    Object.values(FIELD_ALIASES).some((aliases) => hasAnyKey(value, aliases)) ||
    Object.values(STRUCTURAL_ALIASES).some((aliases) =>
      hasAnyKey(value, aliases),
    )
  );
}

function unwrapCase(value: unknown): JsonRecord | null {
  let current = isRecord(value) ? value : null;

  for (let depth = 0; current && depth < 4; depth += 1) {
    if (hasCaseFields(current)) return current;

    const nested = getRecord(current, [
      "time_complexity",
      "timeComplexity",
      "complexity",
      "analysis",
      "result",
      "data",
    ]);

    if (!nested || nested === current) break;
    current = nested;
  }

  return current;
}

function normalizeCase(value: unknown): JsonRecord | null {
  const source = unwrapCase(value);
  if (!source) return null;

  const normalized: JsonRecord = { ...source };

  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const text = readText(source[alias]);
      if (text) {
        normalized[canonical] = text;
        break;
      }
    }
  }

  for (const [canonical, aliases] of Object.entries(STRUCTURAL_ALIASES)) {
    for (const alias of aliases) {
      if (source[alias] !== undefined) {
        normalized[canonical] = source[alias];
        break;
      }
    }
  }

  return normalized;
}

function unwrapAnalysis(value: unknown): JsonRecord | null {
  let current = isRecord(value) ? value : null;

  for (let depth = 0; current && depth < 4; depth += 1) {
    const record = current;
    if (
      CASE_ALIASES.worst.some((key) => key in record) ||
      CASE_ALIASES.best.some((key) => key in record) ||
      CASE_ALIASES.avg.some((key) => key in record) ||
      hasCaseFields(record)
    ) {
      return record;
    }

    const nested = getRecord(record, [
      "analysis",
      "time_complexity",
      "timeComplexity",
      "complexity",
      "result",
      "data",
    ]);

    if (!nested || nested === record) break;
    current = nested;
  }

  return current;
}

function readNote(value: JsonRecord): string | undefined {
  for (const key of NOTE_ALIASES) {
    const text = readText(value[key]);
    if (text) return text;
  }

  return undefined;
}

/**
 * Adapts the small set of response-shape variations seen from LLM providers
 * to the comparison contract consumed by the analyzer page.
 *
 * The provider response remains otherwise untouched so recursive fields and
 * walkthrough details can continue through the existing compatibility parser.
 */
export function normalizeLlmComparisonResponse(value: unknown): JsonRecord {
  if (!isRecord(value)) return {};

  const normalized: JsonRecord = { ...value };
  const rootAnalysis = isRecord(value.analysis)
    ? value.analysis
    : (value.time_complexity ?? value.timeComplexity ?? value);
  const analysis = unwrapAnalysis(rootAnalysis);

  if (analysis) {
    const normalizedAnalysis: JsonRecord = { ...analysis };

    for (const [canonical, aliases] of Object.entries(CASE_ALIASES)) {
      for (const alias of aliases) {
        const caseValue = analysis[alias];
        if (caseValue === undefined) continue;

        const normalizedCase = normalizeCase(caseValue);
        if (normalizedCase) normalizedAnalysis[canonical] = normalizedCase;
        break;
      }
    }

    normalized.analysis = normalizedAnalysis;
  }

  const noteSources = [
    value,
    value.analysis,
    value.time_complexity,
    value.timeComplexity,
    analysis,
  ];
  const note = noteSources.reduce<string | undefined>(
    (found, source) =>
      found ?? (isRecord(source) ? readNote(source) : undefined),
    undefined,
  );
  if (note) normalized.note = note;

  return normalized;
}
