import type {
  AnalyzeOpenResponse,
  SnapshotCase,
  SnapshotRecurrence,
  SnapshotRecurrenceType,
} from "@aa/types";

export type AnalyzeCaseWithAlias = "worst" | "best" | "avg" | "average";

export function normalizeCase(caseType: AnalyzeCaseWithAlias): SnapshotCase {
  if (caseType === "average") return "avg";
  return caseType;
}

export function normalizeLocale(locale: string | null | undefined): "es" | "en" {
  return String(locale || "en").toLowerCase().startsWith("es") ? "es" : "en";
}

export function resolveSameAsWorst(
  allCases: {
    worst: AnalyzeOpenResponse | null;
    best: AnalyzeOpenResponse | "same_as_worst" | null;
    avg?: AnalyzeOpenResponse | "same_as_worst" | null;
  },
): Record<SnapshotCase, AnalyzeOpenResponse | null> {
  const worst = allCases.worst;
  const best = allCases.best === "same_as_worst" ? worst : allCases.best;
  const avgRaw = allCases.avg ?? null;
  const avg = avgRaw === "same_as_worst" ? worst : avgRaw;
  return { worst, best, avg };
}

export function normalizeRecurrenceType(type: string | undefined): SnapshotRecurrenceType | null {
  if (type === "divide_conquer" || type === "divide_conquer_multi" || type === "linear_shift") {
    return type;
  }
  return null;
}

export function normalizeRecurrence(input: unknown): SnapshotRecurrence | null {
  if (!input || typeof input !== "object") return null;
  const recurrence = input as Record<string, unknown>;
  const type = normalizeRecurrenceType(String(recurrence.type || ""));
  if (!type) return null;

  if (type === "divide_conquer") {
    return {
      type,
      form: String(recurrence.form || ""),
      a: Number(recurrence.a || 0),
      b: Number(recurrence.b || 0),
      f: String(recurrence.f || ""),
      n0: Number(recurrence.n0 || 0),
      method: recurrence.method as SnapshotRecurrence["method"],
      notes: Array.isArray(recurrence.notes) ? recurrence.notes.map(String) : [],
    };
  }

  if (type === "divide_conquer_multi") {
    const rawTerms = Array.isArray(recurrence.terms) ? recurrence.terms : [];
    return {
      type,
      form: String(recurrence.form || ""),
      terms: rawTerms
        .filter((term): term is { a?: unknown; b?: unknown } => Boolean(term && typeof term === "object"))
        .map((term) => ({ a: Number(term.a || 0), b: Number(term.b || 0) })),
      a: Number(recurrence.a || 0),
      f: String(recurrence.f || ""),
      n0: Number(recurrence.n0 || 0),
      method: recurrence.method as SnapshotRecurrence["method"],
      notes: Array.isArray(recurrence.notes) ? recurrence.notes.map(String) : [],
    };
  }

  return {
    type,
    form: String(recurrence.form || ""),
    order: Number(recurrence.order || 0),
    shifts: Array.isArray(recurrence.shifts) ? recurrence.shifts.map((v) => Number(v)) : [],
    coefficients: Array.isArray(recurrence.coefficients)
      ? recurrence.coefficients.map((v) => Number(v))
      : [],
    "g(n)": typeof recurrence["g(n)"] === "string" ? recurrence["g(n)"] : undefined,
    n0: Number(recurrence.n0 || 0),
    method: recurrence.method as SnapshotRecurrence["method"],
    notes: Array.isArray(recurrence.notes) ? recurrence.notes.map(String) : [],
  };
}

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (typeof nested === "undefined") continue;
      output[key] = stripUndefinedDeep(nested);
    }
    return output as T;
  }
  return value;
}
