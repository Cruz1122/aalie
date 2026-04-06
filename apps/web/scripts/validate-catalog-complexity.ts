/**
 * Valida complejidad (mejor / promedio / peor) de cada ejemplo del catálogo
 * contra expected-by-slug.json vía POST /analyze/open? mode=all.
 *
 * Requisito: API en API_BASE_URL (default http://localhost:8000).
 *
 * Salidas principales:
 * - scripts/output/catalog-complexity-snapshot.json
 * - scripts/output/catalog-complexity-report-technical.md
 * - scripts/output/catalog-complexity-report-executive.md
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  examplesCatalog,
  isRecursiveCategory,
  type ExampleCatalogItem,
} from "@/lib/examples/catalog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const OUTPUT_DIR = path.join(__dirname, "output");
const EXPECTED_PATH = path.join(
  __dirname,
  "catalog-validation",
  "expected-by-slug.json",
);

const SIZE_META_PATH = path.join(
  __dirname,
  "catalog-validation",
  "size-metadata-by-slug.json",
);

const SYMPY_EQUIV_PY = path.join(
  __dirname,
  "catalog-validation",
  "sympy-equiv-complexity-inner.py",
);

type ExpectedRow = {
  catalogTitleEs: string;
  best: string;
  avg: string;
  worst: string;
  note?: string;
  expectedConfidence?: string;
};

type ExpectedFile = {
  version: number;
  entries: Record<string, ExpectedRow>;
};

type SizeMetaRow = {
  primarySize: string;
  auxSizes?: string[];
  enginePrimarySize?: string;
  notes?: string;
};

type SizeMetaFile = {
  version: number;
  entries: Record<string, SizeMetaRow>;
};

type AnalyzeCase = {
  ok?: boolean;
  byLine?: unknown[];
  totals?: Record<string, unknown>;
  errors?: unknown[];
};

type AnalyzeAllJson = {
  ok?: boolean;
  has_case_variability?: boolean;
  worst?: AnalyzeCase;
  best?: AnalyzeCase | "same_as_worst";
  avg?: AnalyzeCase | "same_as_worst";
  errors?: unknown[];
};

type DetectMethodsJson = {
  ok: boolean;
  default_method?: string;
  applicable_methods?: string[];
  errors?: unknown[];
};

function loadExpected(): ExpectedFile {
  const raw = readFileSync(EXPECTED_PATH, "utf8");
  return JSON.parse(raw) as ExpectedFile;
}

function loadSizeMeta(): SizeMetaFile {
  const raw = readFileSync(SIZE_META_PATH, "utf8");
  return JSON.parse(raw) as SizeMetaFile;
}

async function detectMethods(source: string): Promise<DetectMethodsJson> {
  return (await fetchJsonWithRetry(`${API_BASE}/analyze/detect-methods`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source, algorithm_kind: "recursive" }),
  })) as DetectMethodsJson;
}

async function analyzeOpenAll(
  source: string,
  options: {
    preferredMethod?: string;
    algorithmKind?: string;
  },
): Promise<AnalyzeAllJson> {
  const body: Record<string, unknown> = {
    source,
    mode: "all",
    locale: "es",
  };
  if (options.algorithmKind) {
    body.algorithm_kind = options.algorithmKind;
  }
  if (options.preferredMethod) {
    body.preferred_method = options.preferredMethod;
  }

  // Análisis abierto puede tardar (SymPy, ecuación característica, etc.); 30s provoca abort en algunos slugs.
  return (await fetchJsonWithRetry(
    `${API_BASE}/analyze/open`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    { timeoutMs: 120000 },
  )) as AnalyzeAllJson;
}

async function fetchJsonWithRetry(
  url: string,
  init: RequestInit,
  opts?: {
    timeoutMs?: number;
    retries?: number;
    retryDelayMs?: number;
  },
): Promise<unknown> {
  const timeoutMs = opts?.timeoutMs ?? 30000;
  const retries = opts?.retries ?? 4;
  const retryDelayMs = opts?.retryDelayMs ?? 500;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`,
        );
      }
      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new Error(`Invalid JSON: ${text.slice(0, 500)}`);
      }
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) break;
      const backoff = retryDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function resolveCase(
  bundle: AnalyzeCase | "same_as_worst" | undefined,
  worst: AnalyzeCase | undefined,
): AnalyzeCase | undefined {
  if (bundle === "same_as_worst" || bundle === undefined) {
    return worst;
  }
  return bundle;
}

/**
 * Para comparar con tablas pedagógicas O/Θ/Ω: el motor suele dejar la forma abierta en
 * `T_open` en iterativos; las cotas cerradas están en `big_theta` / `big_o`.
 */
function getNotationForCompare(c: AnalyzeCase | undefined): string {
  if (!c?.totals || typeof c.totals !== "object") {
    return "";
  }
  const totals = c.totals;
  const bt = totals.big_theta;
  if (typeof bt === "string" && bt.trim()) {
    return bt;
  }
  const bo = totals.big_o;
  if (typeof bo === "string" && bo.trim()) {
    return bo;
  }
  const bw = totals.big_omega;
  if (typeof bw === "string" && bw.trim()) {
    return bw;
  }
  const t = totals.T_open;
  return typeof t === "string" ? t : "";
}

/** Quita delimitadores LaTeX comunes y espacios externos. */
function stripMathDelims(s: string): string {
  return s.trim().replace(/^\$+/, "").replace(/\$+$/, "").trim();
}

/**
 * Extrae el contenido interno de la primera envoltura asintótica O/Θ/Ω
 * (paréntesis balanceados). Si no hay patrón, devuelve el string normalizado completo.
 */
function extractAsymptoticInnerRaw(s: string): string {
  const t = stripMathDelims(s);
  const head = /^(?:\\Theta|\\Omega|Θ|Ω|O)\s*\(/;
  const m = t.match(head);
  if (!m || m.index === undefined) {
    return t;
  }
  const openIdx = m.index + m[0].length - 1;
  let depth = 0;
  for (let i = openIdx; i < t.length; i++) {
    const ch = t[i];
    if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth === 0) {
        return t.slice(openIdx + 1, i).trim();
      }
    }
  }
  return t;
}

function extractAsymptoticInner(s: string): string {
  return normalizeInner(extractAsymptoticInnerRaw(s));
}

/**
 * Normalización para comparación relajada: espacios, llaves en potencias,
 * logs, raíces, constantes numéricas aproximadas.
 */
function normalizeInner(s: string): string {
  let u = stripMathDelims(s)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\\cdot/g, "*")
    .replace(/\\times/g, "*")
    .replace(/\\log/g, "log")
    .replace(/\\ln/g, "ln")
    .replace(/\\sqrt\{n\}/g, "sqrt(n)")
    .replace(/√n/g, "sqrt(n)")
    .replace(/\\varphi/g, "phi")
    .replace(/φ/g, "phi")
    .replace(/\^{([^}]+)}/g, "^$1")
    .replace(/n\^\{2\}/g, "n^2")
    .replace(/n\^\{1\.5\}/g, "n^1.5")
    .replace(/n\^\{3\}/g, "n^3");

  // 1.8393^n ≈ tribonacci root
  u = u.replace(/1\.839286755/g, "1.8393");
  u = u.replace(/1\.8393/g, "1.8393");

  u = u.replace(/\\?log\s*\(\s*n\s*\)/g, "logn");
  u = u.replace(/\\?log\s+n/g, "logn");
  u = u.replace(/n\s*\\?log\s*n/g, "nlogn");
  u = u.replace(/n\s*\\?log\s*\(\s*n\s*\)/g, "nlogn");

  return u;
}

/**
 * Comparación estricta: misma notación completa tras `normalizeInner`
 * (incluye prefijo O vs Θ vs Ω; unifica n^{2} con n^2).
 */
function strictMatch(expected: string, obtained: string): boolean {
  if (!obtained) {
    return false;
  }
  return (
    normalizeInner(stripMathDelims(expected)) ===
    normalizeInner(stripMathDelims(obtained))
  );
}

/**
 * Relajada: mismo interior asintótico tras normalizar, u O/Θ/Ω equivalentes
 * sobre la misma expresión interna.
 */
const sympyEquivCache = new Map<string, boolean>();
function relaxedMatch(expected: string, obtained: string): boolean {
  if (!obtained) {
    return false;
  }
  const ieRaw = extractAsymptoticInnerRaw(expected);
  const ioRaw = extractAsymptoticInnerRaw(obtained);

  // Cheap textual normalization first.
  if (normalizeInner(ieRaw) === normalizeInner(ioRaw)) {
    return true;
  }

  // SymPy fallback: equivalencia simbólica para formas canónicas.
  const cacheKey = `${ieRaw}||${ioRaw}`;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (sympyEquivCache.has(cacheKey)) {
    return sympyEquivCache.get(cacheKey) as boolean;
  }

  try {
    const out = execFileSync("python3", [SYMPY_EQUIV_PY, ieRaw, ioRaw], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });
    const v = out.trim().toLowerCase() === "true";
    sympyEquivCache.set(cacheKey, v);
    return v;
  } catch {
    sympyEquivCache.set(cacheKey, false);
    return false;
  }
}

type CaseKey = "best" | "avg" | "worst";

type DiscrepancyClass =
  | "exact_match"
  | "symbolic_equivalent"
  | "notation_mismatch_only"
  | "expected_dataset_issue"
  | "engine_bug_likely"
  | "unsupported_or_inconclusive_expected"
  | "parameterization_mismatch"
  | "policy_best_mismatch"
  | "size_parameter_mismatch"
  | "model_dependent_expected"
  | "engine_approximation_gap";

type RowResult = {
  case: CaseKey;
  expected: string;
  obtained: string;
  discrepancyClass: DiscrepancyClass;
  /** Interior de O/Θ/Ω normalizado (equivalente a “nivel 2” del plan: O(n²) ~ Θ(n²)). */
  contentMatch: boolean;
  /** Cadena completa normalizada; exige mismo prefijo O/Θ/Ω (suele fallar si la tabla usa O y el motor Θ). */
  literalMatch: boolean;
  sizeMetaNote?: string;
};

function stripBackticksOrMath(s: string): string {
  // En algunos artefactos podríamos recibir strings con `$...$` o backticks.
  return s.replace(/^`+/, "").replace(/`+$/, "").trim();
}

function looksUnsupported(obtained: string): boolean {
  if (!obtained) return true;
  const o = obtained.toLowerCase().trim();
  return (
    o === "" ||
    o.includes("n/a") ||
    o.includes("na") ||
    o.includes("unsupported") ||
    o.includes("unknown") ||
    o.includes("not_proven")
  );
}

function detectMainSizeVarRaw(
  s: string,
): "n" | "N" | "k" | "t" | "min(a,b)" | null {
  const raw = stripMathDelims(stripBackticksOrMath(s));

  // Nota: aquí NO normalizamos a minúsculas para no perder N vs n.
  if (/\bN\b/.test(raw)) return "N";
  if (/\bk\b/.test(raw)) return "k";
  if (/\bt\b/.test(raw)) return "t";
  if (
    /\\min\s*\(\s*a\s*,\s*b\s*\)/.test(raw) ||
    /min\s*\(\s*a\s*,\s*b\s*\)/.test(raw)
  ) {
    return "min(a,b)";
  }
  // n aparece mucho en expresiones; usar límites básicos.
  if (/\bn\b/.test(raw)) return "n";
  return null;
}

function isPhiDominantSpecialEq(expected: string, obtained: string): boolean {
  const e = stripMathDelims(expected).toLowerCase();
  const o = stripMathDelims(obtained).toLowerCase();
  const eHasPhi =
    e.includes("\\varphi") ||
    e.includes("varphi") ||
    e.includes("\\phi") ||
    e.includes("phi");
  const oHasSqrt5 =
    o.includes("sqrt{5}") ||
    o.includes("\\sqrt{5}".toLowerCase()) ||
    o.includes("sqrt(5)");
  // Ambos suelen incluir potencia ^n.
  const bothHavePowN = /\\?\^\{?n\}?/.test(o) && /\\?\^\{?n\}?/.test(e);
  return eHasPhi && oHasSqrt5 && bothHavePowN;
}

function isKaratsubaLogSpecialEq(expected: string, obtained: string): boolean {
  const e = stripMathDelims(expected).toLowerCase();
  const o = stripMathDelims(obtained).toLowerCase();
  const eHasLogBase2 =
    e.includes("log_2") || e.includes("log{2}") || e.includes("log2");
  const oHasLogRatio =
    o.includes("log") &&
    (o.includes("log{") || o.includes("log(") || o.includes("\\log")) &&
    o.includes("3") &&
    o.includes("2") &&
    (o.includes(")/") || o.includes("}{") || o.includes("/"));
  return eHasLogBase2 && oHasLogRatio;
}

function classifyDiscrepancy(args: {
  caseKey: CaseKey;
  exp: ExpectedRow;
  expected: string;
  obtained: string;
  contentMatch: boolean;
  literalMatch: boolean;
  sizeMeta?: SizeMetaRow;
}): DiscrepancyClass {
  const {
    exp,
    expected,
    obtained,
    contentMatch,
    literalMatch,
    sizeMeta,
    caseKey,
  } = args;

  if (looksUnsupported(obtained)) {
    return "unsupported_or_inconclusive_expected";
  }

  if (literalMatch) {
    return "exact_match";
  }

  // Equivalencias simbólicas conocidas (sin canonicalizador completo todavía).
  if (
    contentMatch ||
    isPhiDominantSpecialEq(expected, obtained) ||
    isKaratsubaLogSpecialEq(expected, obtained)
  ) {
    return "symbolic_equivalent";
  }

  // Parámetros/tamaño principal inconsistente (n vs N / k / t).
  const expVar = detectMainSizeVarRaw(expected);
  const gotVar = detectMainSizeVarRaw(obtained);
  const expKnown = expVar && expVar !== "min(a,b)";
  const gotKnown = gotVar && gotVar !== "min(a,b)";
  if (expVar && gotVar && expKnown && gotKnown && expVar !== gotVar) {
    return "size_parameter_mismatch";
  }

  // Errores “visibles” de engine: infty o símbolos iterativos sin cierre.
  const o = obtained.toLowerCase();
  if (o.includes("\\infty") || o.includes("infty")) {
    return "engine_bug_likely";
  }
  // Símbolos de while “parciales” que aparecen cuando el cierre no está resuelto.
  if (
    o.includes("i_{while") ||
    o.includes("i_while") ||
    o.includes("t_{while") ||
    o.includes("t_while") ||
    o.includes("t_{repeat") ||
    o.includes("t_repeat")
  ) {
    return "engine_bug_likely";
  }

  // Cierre absurdo: best-case constante donde expected no es constante (hard_oracle).
  const expInner = normalizeInner(extractAsymptoticInner(expected));
  const gotInner = normalizeInner(extractAsymptoticInner(obtained));
  const expIsConst = expInner === "1" || expInner === "0";
  const gotIsConst = gotInner === "1" || gotInner === "0";
  if (!expIsConst && gotIsConst) {
    const conf = exp.expectedConfidence || "hard_oracle";
    if (conf === "hard_oracle") {
      return "engine_bug_likely";
    }
    return "expected_dataset_issue";
  }

  // Política: best-case esperado constante (O(1)) pero el motor devuelve crecimiento no-constante.
  if (caseKey === "best" && expIsConst && !gotIsConst) {
    const conf = exp.expectedConfidence || "hard_oracle";
    if (conf === "hard_oracle") {
      return "policy_best_mismatch";
    }
    return "expected_dataset_issue";
  }

  // Si el expected no es hard oracle, el mismatch puede ser del oráculo o de forma.
  const conf = exp.expectedConfidence || "hard_oracle";
  if (conf === "approx_symbolic") {
    // expected define un rango “aproximado”; si el match relaxado ya falló, asumimos gap del motor.
    return "engine_approximation_gap";
  }
  if (conf !== "hard_oracle") {
    return "model_dependent_expected";
  }

  // Por defecto: mismatch de notación o engine (sin evidencia extra).
  return "notation_mismatch_only";
}

/** Ajusta la cadena obtenida solo para comparación cuando el catálogo y el motor usan distinto símbolo de tamaño (p. ej. N vs n). */
function applySizeAliasForCompare(
  obtained: string,
  sizeMeta?: SizeMetaRow,
): string {
  if (!sizeMeta?.primarySize || !sizeMeta?.enginePrimarySize) return obtained;
  if (sizeMeta.primarySize === "N" && sizeMeta.enginePrimarySize === "n") {
    let s = obtained;
    s = s.replace(/\(\s*n\s*\\log\s*k/gi, "(N \\log k");
    s = s.replace(/\(\s*n\s*\\log\s*N/gi, "(N \\log N");
    return s;
  }
  return obtained;
}

function compareCases(
  exp: ExpectedRow,
  sizeMeta: SizeMetaRow | undefined,
  bestT: string,
  avgT: string,
  worstT: string,
): RowResult[] {
  const obtained: Record<CaseKey, string> = {
    best: bestT,
    avg: avgT,
    worst: worstT,
  };
  const keys: CaseKey[] = ["best", "avg", "worst"];
  return keys.map((k) => {
    const obtNorm = applySizeAliasForCompare(obtained[k], sizeMeta);
    return {
      case: k,
      expected: exp[k],
      obtained: obtained[k],
      contentMatch: relaxedMatch(exp[k], obtNorm),
      literalMatch: strictMatch(exp[k], obtained[k]),
      discrepancyClass: classifyDiscrepancy({
        caseKey: k,
        exp,
        expected: exp[k],
        obtained: obtNorm,
        contentMatch: relaxedMatch(exp[k], obtNorm),
        literalMatch: strictMatch(exp[k], obtained[k]),
        sizeMeta,
      }),
      sizeMetaNote: sizeMeta?.notes,
    };
  });
}

function mdEscapeCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

const BYLINE_JSON_MAX_LINES = 400;

function formatByLineJson(byLine: unknown[] | undefined): string {
  if (!byLine || byLine.length === 0) {
    return "_sin byLine_";
  }
  const text = JSON.stringify(byLine, null, 2);
  const lines = text.split("\n");
  if (lines.length <= BYLINE_JSON_MAX_LINES) {
    return "```json\n" + text + "\n```";
  }
  const head = lines.slice(0, BYLINE_JSON_MAX_LINES).join("\n");
  return (
    `_truncado a ${BYLINE_JSON_MAX_LINES} líneas; ver snapshot JSON completo._\n\n` +
    "```json\n" +
    head +
    "\n…\n```"
  );
}

async function main(): Promise<void> {
  const expectedFile = loadExpected();
  const { entries: expectedBySlug } = expectedFile;
  const sizeMetaFile = loadSizeMeta();
  const sizeMetaBySlug = sizeMetaFile.entries || {};

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const snapshot: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    apiBase: API_BASE,
    items: {} as Record<string, unknown>,
  };

  const itemsOut = snapshot.items as Record<string, unknown>;

  type ReportEntry = {
    example: ExampleCatalogItem;
    expected: ExpectedRow;
    preferredMethod?: string;
    analyzeOk: boolean;
    analyzeError?: string;
    rowResults: RowResult[];
    response: AnalyzeAllJson;
  };

  const reportRows: ReportEntry[] = [];

  for (const example of examplesCatalog) {
    console.log(`Analyze ${example.slug}...`);
    const exp = expectedBySlug[example.slug];
    if (!exp) {
      console.error(`Missing expected entry for slug=${example.slug}`);
      process.exit(1);
    }
    const sizeMeta = sizeMetaBySlug[example.slug];

    let preferredMethod: string | undefined;
    if (isRecursiveCategory(example.category)) {
      const dm = await detectMethods(example.sourceCodeByLocale.es);
      if (dm.ok && dm.default_method) {
        preferredMethod = dm.default_method;
      } else {
        itemsOut[example.slug] = {
          slug: example.slug,
          category: example.category,
          titleEs: example.copy.es.title,
          error: "detect-methods failed",
          detectMethods: dm,
        };
        reportRows.push({
          example,
          expected: exp,
          analyzeOk: false,
          analyzeError: `detect-methods: ${JSON.stringify(dm.errors ?? dm)}`,
          rowResults: [],
          response: {},
        });
        continue;
      }
    }

    let response: AnalyzeAllJson = {};
    try {
      response = await analyzeOpenAll(example.sourceCodeByLocale.es, {
        algorithmKind: isRecursiveCategory(example.category)
          ? "recursive"
          : undefined,
        preferredMethod,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      itemsOut[example.slug] = {
        slug: example.slug,
        category: example.category,
        titleEs: example.copy.es.title,
        preferredMethod,
        ok: false,
        error: `analyze/open failed: ${msg}`,
      };
      reportRows.push({
        example,
        expected: exp,
        preferredMethod,
        analyzeOk: false,
        analyzeError: `analyze/open failed: ${msg}`,
        rowResults: [],
        response: {},
      });
      continue;
    }

    if (!response.ok || !response.worst) {
      itemsOut[example.slug] = {
        slug: example.slug,
        category: example.category,
        titleEs: example.copy.es.title,
        preferredMethod,
        ok: false,
        response,
      };
      reportRows.push({
        example,
        expected: exp,
        preferredMethod,
        analyzeOk: false,
        analyzeError: JSON.stringify(response.errors ?? response),
        rowResults: [],
        response,
      });
      continue;
    }

    const worst = response.worst;
    const bestC = resolveCase(response.best, worst);
    const avgC = resolveCase(response.avg, worst);

    const bestT = getNotationForCompare(bestC);
    const avgT = getNotationForCompare(avgC);
    const worstT = getNotationForCompare(worst);

    const rowResults = compareCases(exp, sizeMeta, bestT, avgT, worstT);

    itemsOut[example.slug] = {
      slug: example.slug,
      category: example.category,
      titleEs: example.copy.es.title,
      preferredMethod,
      ok: true,
      has_case_variability: response.has_case_variability,
      worst: worst.totals,
      bestTotals: bestC?.totals,
      avgTotals: avgC?.totals,
      notationCompared: { best: bestT, avg: avgT, worst: worstT },
      comparison: rowResults,
      sizeMeta,
    };

    reportRows.push({
      example,
      expected: exp,
      preferredMethod,
      analyzeOk: true,
      rowResults,
      response,
    });
  }

  const snapshotPath = path.join(
    OUTPUT_DIR,
    "catalog-complexity-snapshot.json",
  );
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), "utf8");

  let caseAll = 0;
  let contentFail = 0;
  let literalFail = 0;
  let apiErrors = 0;
  const classOrder: DiscrepancyClass[] = [
    "exact_match",
    "symbolic_equivalent",
    "notation_mismatch_only",
    "expected_dataset_issue",
    "engine_bug_likely",
    "unsupported_or_inconclusive_expected",
    "parameterization_mismatch",
    "policy_best_mismatch",
    "size_parameter_mismatch",
    "model_dependent_expected",
    "engine_approximation_gap",
  ];
  const classCounts: Record<DiscrepancyClass, number> = {
    exact_match: 0,
    symbolic_equivalent: 0,
    notation_mismatch_only: 0,
    expected_dataset_issue: 0,
    engine_bug_likely: 0,
    unsupported_or_inconclusive_expected: 0,
    parameterization_mismatch: 0,
    policy_best_mismatch: 0,
    size_parameter_mismatch: 0,
    model_dependent_expected: 0,
    engine_approximation_gap: 0,
  };

  for (const r of reportRows) {
    if (!r.analyzeOk) {
      apiErrors++;
      continue;
    }
    for (const c of r.rowResults) {
      caseAll++;
      classCounts[c.discrepancyClass]++;
      if (!c.contentMatch) {
        contentFail++;
      }
      if (!c.literalMatch) {
        literalFail++;
      }
    }
  }

  const md: string[] = [];
  md.push("# Informe: catálogo vs motor de análisis");
  md.push("");
  md.push(`- Generado: ${snapshot.generatedAt}`);
  md.push(`- API: \`${API_BASE}\``);
  md.push(
    `- Comparaciones por caso: **${caseAll}** evaluaciones en total (3 casos × ${examplesCatalog.length} algoritmos).`,
  );
  md.push(`- Errores de API / detect-methods: ${apiErrors}.`);
  md.push("");
  md.push("## Resumen por clase de discrepancia");
  for (const cls of classOrder) {
    md.push(`- ${cls}: ${classCounts[cls]}`);
  }
  md.push("");
  md.push("## Política de comparación");
  md.push("");
  md.push(
    "1. **Contenido asintótico**: se extrae el interior de `O(·)`, `\\Theta(·)` o `\\Omega(·)` y se normaliza (espacios, `\\log`, potencias `^{}`, `\\sqrt{n}`, `\\varphi`, etc.). Equivale a tratar `O(n^2)` y `\\Theta(n^2)` como alineados cuando el interior coincide.",
  );
  md.push(
    "2. **Literal**: misma cadena completa normalizada; si la tabla espera `O(...)` y el motor devuelve `\\Theta(...)`, cuenta como fallo literal aunque el interior coincida.",
  );
  md.push(
    "3. Bases exponenciales distintas (`\\varphi^n` vs `2^n`) **no** se unifican en contenido: siguen siendo discrepancia.",
  );
  md.push("");

  const categoryOrder = [
    "iterativos",
    "divide-y-venceras",
    "resta-y-venceras",
    "resta-y-seras-vencido",
  ] as const;

  for (const cat of categoryOrder) {
    const inCat = reportRows.filter((r) => r.example.category === cat);
    if (inCat.length === 0) {
      continue;
    }
    md.push(`## ${cat.replace(/-/g, " ")}`);
    md.push("");
    md.push(
      "| Algoritmo (catálogo) | Caso | Esperado | Obtenido (big_Θ / big_O / …) | Clase | Contenido | Literal |",
    );
    md.push("| --- | --- | --- | --- | --- | --- | --- |");

    for (const r of inCat) {
      const title = r.example.copy.es.title;
      if (!r.analyzeOk) {
        md.push(
          `| ${mdEscapeCell(title)} | — | — | _error: ${mdEscapeCell(r.analyzeError ?? "")}_ | — | — |`,
        );
        continue;
      }
      for (const c of r.rowResults) {
        const cOk = c.contentMatch ? "sí" : "no";
        const lOk = c.literalMatch ? "sí" : "no";
        md.push(
          `| ${mdEscapeCell(title)} | ${c.case} | ${mdEscapeCell(c.expected)} | ${mdEscapeCell(c.obtained || "(vacío)")} | ${mdEscapeCell(
            c.discrepancyClass,
          )} | ${cOk} | ${lOk} |`,
        );
      }
    }
    md.push("");
  }

  md.push("## Detalle: discrepancias y pseudocódigo");
  md.push("");
  md.push(
    "Para cada algoritmo con al menos un fallo **relajado**, o error de API, se incluye el pseudocódigo analizado (`sourceCode`). Si es **iterativo** y hubo discrepancia, se adjunta también `byLine` del peor caso (si existe).",
  );
  md.push("");

  for (const r of reportRows) {
    const needsDetail =
      !r.analyzeOk ||
      (r.analyzeOk &&
        r.rowResults.some((c) => c.discrepancyClass !== "exact_match"));
    if (!needsDetail) {
      continue;
    }

    const ex = r.example;
    md.push(`### ${ex.copy.es.title} (\`${ex.slug}\`)`);
    md.push("");
    if (r.expected.note) {
      md.push(`_Nota esperada_: ${r.expected.note}`);
      md.push("");
    }
    if (r.expected.expectedConfidence) {
      md.push(`_Confianza expected_: ${r.expected.expectedConfidence}`);
      md.push("");
    }
    const sizeMetaNote = r.rowResults.find((x) => x.sizeMetaNote)?.sizeMetaNote;
    if (sizeMetaNote) {
      md.push(`_Parametrización de tamaño (nota)_: ${sizeMetaNote}`);
      md.push("");
    }
    if (!r.analyzeOk) {
      md.push(`**Error**: ${r.analyzeError}`);
      md.push("");
    } else {
      md.push("| Caso | Esperado | Obtenido | Clase | Contenido | Literal |");
      md.push("| --- | --- | --- | --- | --- | --- | --- |");
      for (const c of r.rowResults) {
        md.push(
          `| ${c.case} | ${mdEscapeCell(c.expected)} | ${mdEscapeCell(c.obtained)} | ${mdEscapeCell(
            c.discrepancyClass,
          )} | ${c.contentMatch ? "sí" : "no"} | ${c.literalMatch ? "sí" : "no"} |`,
        );
      }
      md.push("");
      if (r.preferredMethod) {
        md.push(`_preferred_method_: \`${r.preferredMethod}\``);
        md.push("");
      }
    }

    md.push("#### Pseudocódigo analizado");
    md.push("");
    md.push("```text");
    md.push(ex.sourceCodeByLocale.es);
    md.push("```");
    md.push("");

    const isIter = !isRecursiveCategory(ex.category);
    const worst = r.response.worst;
    if (
      isIter &&
      r.analyzeOk &&
      r.rowResults.some((c) => c.discrepancyClass !== "exact_match") &&
      worst?.byLine
    ) {
      md.push("#### byLine (peor caso, iterativo)");
      md.push("");
      md.push(formatByLineJson(worst.byLine));
      md.push("");
    }

    md.push("---");
    md.push("");
  }

  // Vista ejecutiva: top 10 bugs probables (engine_bug_likely + policy_best_mismatch)
  // vs top 10 mismatch de oráculo.
  const perExample = reportRows.map((r) => {
    const bugCases = r.analyzeOk
      ? r.rowResults.filter(
          (c) =>
            c.discrepancyClass === "engine_bug_likely" ||
            c.discrepancyClass === "policy_best_mismatch",
        ).length
      : 3;
    const oracleMismatchCases = r.analyzeOk
      ? r.rowResults.filter(
          (c) =>
            c.discrepancyClass === "expected_dataset_issue" ||
            c.discrepancyClass === "unsupported_or_inconclusive_expected",
        ).length
      : 0;
    return {
      slug: r.example.slug,
      title: r.example.copy.es.title,
      category: r.example.category,
      bugCases,
      oracleMismatchCases,
    };
  });

  const topEngineBugs = [...perExample]
    .sort((a, b) => b.bugCases - a.bugCases)
    .slice(0, 10);
  const topOracleMismatches = [...perExample]
    .sort((a, b) => b.oracleMismatchCases - a.oracleMismatchCases)
    .slice(0, 10);

  const mdExecutive: string[] = [];
  mdExecutive.push("# Informe ejecutivo: catálogo vs motor de análisis");
  mdExecutive.push("");
  mdExecutive.push(`- Generado: ${snapshot.generatedAt}`);
  mdExecutive.push(`- API: \`${API_BASE}\``);
  mdExecutive.push(
    `- Comparaciones por caso: **${caseAll}** evaluaciones (3 casos × ${examplesCatalog.length} algoritmos).`,
  );
  mdExecutive.push(`- Errores de API/detect-methods: ${apiErrors}.`);
  mdExecutive.push("");

  mdExecutive.push("## Resumen por clase de discrepancia");
  mdExecutive.push("");
  for (const cls of classOrder) {
    mdExecutive.push(`- ${cls}: ${classCounts[cls]}`);
  }
  mdExecutive.push("");

  mdExecutive.push(
    "## Top 10 bugs reales (engine_bug_likely + policy_best_mismatch)",
  );
  mdExecutive.push("");
  mdExecutive.push(
    "| Algoritmo | Categoria | Casos engine_bug_likely+policy_best_mismatch |",
  );
  mdExecutive.push("| --- | --- | --- |");
  for (const row of topEngineBugs) {
    mdExecutive.push(
      `| ${mdEscapeCell(row.title)} (\`${row.slug}\`) | ${mdEscapeCell(
        row.category,
      )} | ${row.bugCases} |`,
    );
  }
  mdExecutive.push("");

  mdExecutive.push(
    "## Top 10 mismatches de oráculo (expected_dataset_issue + unsupported_or_inconclusive_expected)",
  );
  mdExecutive.push("");
  mdExecutive.push("| Algoritmo | Categoria | Casos mismatch de oráculo |");
  mdExecutive.push("| --- | --- | --- |");
  for (const row of topOracleMismatches) {
    mdExecutive.push(
      `| ${mdEscapeCell(row.title)} (\`${row.slug}\`) | ${mdEscapeCell(
        row.category,
      )} | ${row.oracleMismatchCases} |`,
    );
  }
  mdExecutive.push("");

  const reportTechnicalPath = path.join(
    OUTPUT_DIR,
    "catalog-complexity-report-technical.md",
  );
  const reportExecutivePath = path.join(
    OUTPUT_DIR,
    "catalog-complexity-report-executive.md",
  );

  writeFileSync(reportTechnicalPath, md.join("\n"), "utf8");
  writeFileSync(reportExecutivePath, mdExecutive.join("\n"), "utf8");
}

// Fix: exp.note should be r.expected.note in loop
void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
