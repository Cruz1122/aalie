import type {
  AalieAnalysisSnapshotV1,
  AnalyzeOpenResponse,
  LineCost,
  LoopInvariant,
  SnapshotCase,
  SnapshotGpuCpuComparative,
  SnapshotRecursiveMethod,
  SnapshotRecursiveMethodDetail,
  SnapshotSection,
} from "@aa/types";

import { SNAPSHOT_NOT_IMPLEMENTED_TODOS } from "../domain/constants";
import { isSectionAvailable } from "../domain/section-status";
import { getExportI18n, type ExportI18nBundle } from "../infrastructure/i18n";

export interface DocumentTable {
  title?: string;
  headers: string[];
  rows: string[][];
  align?: Array<"left" | "center" | "right">;
}

export interface DocumentKeyValueEntry {
  label: string;
  value: string;
}

export interface DocumentInstitutionalCodeLine {
  lineNumber?: number;
  text: string;
}

export interface DocumentBlockStatus {
  label: string;
  status: SnapshotSection<unknown>["status"];
  message?: string;
  todos?: string[];
}

export interface DocumentPedagogicalStep {
  index: number;
  title: string;
  status: "complete" | "partial" | "unsupported" | "error";
  formula?: string;
  explanation: string;
  warning?: string;
  supportReason?: string;
}

export interface DocumentExecutionTraceDiagram {
  title: string;
  caseName: SnapshotCase;
  graph: {
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: {
        label: string;
        microseconds?: number;
        tokens?: number;
      };
      parentId?: string;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      label: string;
      type: string;
    }>;
  };
  patternKind?: string;
  classification?: {
    patternKind?: string;
    confidence?: "high" | "medium" | "low";
    evidence?: string[];
  };
  summary?: {
    totalSteps?: number;
    totalCalls?: number;
    maxRecursionDepth?: number;
    algorithmKind?: string;
  };
  diagnostics?: {
    truncated?: boolean;
    truncationReason?: string;
    warnings?: string[];
  };
  stats: {
    totalCalls: number;
    maxDepth: number;
    truncated: boolean;
  };
  renderMode: "mermaid_and_vector_assets";
  assetBasename: string;
  assetSvgPath: string;
  assetPdfPath: string;
}

export type DocumentBlock =
  | {
      kind: "paragraph";
      text: string;
    }
  | {
      kind: "heading";
      text: string;
    }
  | {
      kind: "emphasis";
      text: string;
    }
  | {
      kind: "subsection";
      title: string;
    }
  | {
      kind: "centeredParagraph";
      text: string;
    }
  | {
      kind: "list";
      items: string[];
    }
  | {
      kind: "code";
      code: string;
      language?: string;
    }
  | {
      kind: "institutionalCode";
      title?: string;
      lines: DocumentInstitutionalCodeLine[];
    }
  | {
      kind: "formula";
      formula: string;
      label?: string;
    }
  | {
      kind: "table";
      table: DocumentTable;
    }
  | {
      kind: "keyValue";
      entries: DocumentKeyValueEntry[];
    }
  | {
      kind: "status";
      status: DocumentBlockStatus;
    }
  | {
      kind: "pedagogicalStep";
      step: DocumentPedagogicalStep;
    }
  | {
      kind: "executionTraceDiagram";
      diagram: DocumentExecutionTraceDiagram;
    };

export interface DocumentSection {
  id: string;
  title: string;
  blocks: DocumentBlock[];
}

export interface DocumentInstitutionInfo {
  institutionLineA: string;
  institutionLineB: string;
  institutionLineC: string;
  reportCode: string;
  reportVersion: string;
  reportDate: string;
}

export interface DocumentModel {
  title: string;
  locale: "es" | "en";
  snapshotId: string;
  contentHash: string;
  analysisId: string;
  createdAt: string;
  disclaimer: string;
  institution: DocumentInstitutionInfo;
  sections: DocumentSection[];
}

const CASE_ORDER: SnapshotCase[] = ["worst", "best", "avg"];

const STATUS_LABEL_MAP: Record<string, keyof ExportI18nBundle["statusLabels"]> = {
  "input.normalizedPseudocode": "normalizedPseudocode",
  "input.traceSummary": "traceSummary",
  "iterative.trace": "iterativeTrace",
  "iterative.loopInvariant": "loopInvariant",
  "recursive.recurrence": "recurrence",
  "recursive.selectedMethod": "selectedMethod",
  "recursive.methodsAvailable": "methodsAvailable",
  "recursive.methodDetails": "methodDetails",
  "recursive.rootsAndMultiplicities": "roots",
  "recursive.stepByStep": "methodDetails",
  "recursive.closedForm": "closedForm",
  "recursive.recursionTreeSerializable": "recursionTreeSerializable",
  "recursive.callTrace": "callTrace",
  "comparative.llm": "llm",
  "comparative.gpuCpu": "gpuCpu",
};

function localize(i18n: ExportI18nBundle, esText: string, enText: string): string {
  return i18n.locale === "es" ? esText : enText;
}

function safe(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || typeof value === "undefined") {
    return fallback;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function caseLabel(caseName: SnapshotCase, i18n: ExportI18nBundle): string {
  return i18n.caseLabels[caseName];
}

function methodLabel(method: string, i18n: ExportI18nBundle): string {
  if (
    method === "master" ||
    method === "iteration" ||
    method === "recursion_tree" ||
    method === "characteristic_equation"
  ) {
    return i18n.methodLabels[method];
  }
  return method;
}

const ALL_RECURSIVE_METHODS: SnapshotRecursiveMethod[] = [
  "characteristic_equation",
  "iteration",
  "recursion_tree",
  "master",
];

function methodPrecisionLabel(
  precision: "high" | "medium" | "low",
  i18n: ExportI18nBundle,
): string {
  if (precision === "high") return localize(i18n, "alta", "high");
  if (precision === "medium") return localize(i18n, "media", "medium");
  return localize(i18n, "baja", "low");
}

function getMethodPrecision(
  method: SnapshotRecursiveMethod,
  recurrenceType: string | undefined,
  recommended: boolean,
): "high" | "medium" | "low" {
  if (recommended) return "high";
  if (recurrenceType === "divide_conquer" || recurrenceType === "divide_conquer_multi") {
    if (method === "master" || method === "recursion_tree") return "high";
    if (method === "iteration") return "low";
    return "low";
  }
  if (recurrenceType === "linear_shift") {
    if (method === "characteristic_equation") return "high";
    if (method === "iteration") return "medium";
    return "low";
  }
  if (method === "master" || method === "characteristic_equation") return "medium";
  return "low";
}

function getApplicableMethodReason(
  method: SnapshotRecursiveMethod,
  recurrenceType: string | undefined,
  recommended: boolean,
  recurrenceA: number | undefined,
  i18n: ExportI18nBundle,
): string {
  const divideConquer = recurrenceType === "divide_conquer" || recurrenceType === "divide_conquer_multi";
  const linearShift = recurrenceType === "linear_shift";
  const isSingleBranchDivideConquer = divideConquer && recurrenceA === 1;

  if (recommended) {
    return localize(
      i18n,
      divideConquer
        ? "Dentro de Divide y Vencerás, este método encaja de forma directa con la reducción por escala y permite justificar la cota con menos fricción algebraica."
        : "Dentro de Resta y Vencerás, este método modela directamente la dependencia por desplazamientos y suele dar una derivación más estable.",
      divideConquer
        ? "Within Divide y Vencerás, this method matches scale-based reduction directly and justifies the bound with less algebraic friction."
        : "Within Resta y Vencerás, this method directly models shift-based dependence and usually yields a more stable derivation.",
    );
  }
  if (divideConquer && method === "recursion_tree") {
    return localize(
      i18n,
      "En Divide y Vencerás sí aporta muchísimo: muestra costo por nivel y deja claro si domina la raíz, los niveles intermedios o las hojas.",
      "In Divide y Vencerás it is highly informative: it shows per-level cost and whether the root, middle levels, or leaves dominate.",
    );
  }
  if (divideConquer && method === "iteration") {
    return isSingleBranchDivideConquer
      ? localize(
          i18n,
          "Aplica por despliegue de términos y progresión geométrica en rama única. Aun así, puede hacerse largo si la recurrencia tiene muchos términos auxiliares.",
          "It applies via term unrolling and geometric progression in a single branch. Still, it may become lengthy when the recurrence includes many auxiliary terms.",
        )
      : localize(
          i18n,
          "Puede aplicarse, pero requiere más manipulación simbólica para llegar a una cota limpia. Es útil para aprender la dinámica, no tanto para la vía más corta de resolución.",
          "It can be applied, but it requires heavier symbolic manipulation to reach a clean bound. Useful for understanding dynamics, not usually the shortest solving path.",
        );
  }
  if (linearShift && method === "iteration") {
    return localize(
      i18n,
      "Aplica como alternativa al desplegar la recurrencia paso a paso. Es pedagógico para ver cómo se acumula el costo, aunque la ecuación característica suele cerrar más rápido.",
      "It applies as an alternative by unrolling the recurrence step by step. It is pedagogical to see cost accumulation, though characteristic equation usually closes faster.",
    );
  }
  return localize(
    i18n,
    "Es compatible con la estructura detectada y produce resultados válidos, aunque existe otro método más directo para este caso.",
    "It is compatible with the detected structure and yields valid results, although another method is more direct for this case.",
  );
}

function getNotApplicableMethodReason(
  method: SnapshotRecursiveMethod,
  recurrenceType: string | undefined,
  i18n: ExportI18nBundle,
): string {
  const divideConquer = recurrenceType === "divide_conquer" || recurrenceType === "divide_conquer_multi";
  const linearShift = recurrenceType === "linear_shift";

  if (method === "master" && linearShift) {
    return localize(
      i18n,
      "No aplica: Teorema Maestro es para Divide y Vencerás (subproblemas n/b). Aquí la familia es Resta y Vencerás / Resta y Serás Vencido, con decrementos n-1 o n-k.",
      "It does not apply: Master Theorem is for Divide y Vencerás (n/b subproblems). This case belongs to Resta y Vencerás / Resta y Serás Vencido, with decrements n-1 or n-k.",
    );
  }
  if (method === "characteristic_equation" && divideConquer) {
    return localize(
      i18n,
      "No es la vía natural: ecuación característica describe mejor Resta y Vencerás (desplazamientos constantes). Este caso es Divide y Vencerás, donde Master o árbol explican mejor el crecimiento.",
      "Not the natural route: characteristic equation better describes Resta y Vencerás (constant shifts). This case is Divide y Vencerás, where Master or recursion tree explain growth better.",
    );
  }
  if (method === "recursion_tree" && linearShift) {
    return localize(
      i18n,
      "Aporta poca información adicional en este caso porque casi no hay ramificación: el árbol se vuelve una cadena. Métodos de recurrencia lineal (como ecuación característica) explican el mismo resultado con menos pasos.",
      "It adds little extra information here because there is almost no branching: the tree becomes a chain. Linear-recurrence methods (such as characteristic equation) explain the same result with fewer steps.",
    );
  }
  if (method === "iteration" && divideConquer) {
    return localize(
      i18n,
      "No se prioriza porque el despliegue iterativo crece rápido en complejidad algebraica cuando hay varias ramas recursivas. Master/árbol permiten razonar por niveles o por casos de forma más clara y verificable.",
      "It is not prioritized because iterative unrolling grows algebraically complex when multiple recursive branches exist. Master/tree allow clearer and more verifiable reasoning by levels or theorem cases.",
    );
  }
  return localize(
    i18n,
    "No aplica de forma sólida para la estructura detectada: sus supuestos matemáticos no coinciden con cómo evoluciona el tamaño del subproblema.",
    "It does not apply robustly to the detected structure: its mathematical assumptions do not match how subproblem size evolves.",
  );
}

function parseDateForReport(locale: "es" | "en", createdAt: string): string {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return createdAt;
  }
  return new Intl.DateTimeFormat(locale === "es" ? "es-CO" : "en-US", {
    dateStyle: "long",
  }).format(parsed);
}

function maybeList(items: Array<string | null | undefined>): string[] {
  return items
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0);
}

function normalizeDidacticSummaryText(text: string): string {
  return text
    .replace(/una\s+frontera de revisión/gi, "un límite de elementos revisados")
    .replace(/frontera de revisión/gi, "un límite de elementos revisados")
    .replace(/review boundary/gi, "reviewed-items boundary");
}

function normalizeDominantReasonText(value: string): string {
  return value
    .replace(/\\text\{([^}]*)\}/g, " $1 ")
    .replace(/\\cdot/g, " · ")
    .replace(/\\times/g, " × ")
    .replace(/\\log/g, "log")
    .replace(/\\Theta/g, "Theta")
    .replace(/\\Omega/g, "Omega")
    .replace(/\\mathcal\{O\}/g, "O")
    .replace(/\\left|\\right/g, " ")
    .replace(/\\[A-Za-z]+/g, " ")
    .replace(/\\\\/g, ". ")
    .replace(/\\+/g, " ")
    .replace(/\\[,;!]/g, " ")
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, "$1. $2")
    .replace(/[{}]/g, "")
    .replace(/([0-9])([A-Za-zÁÉÍÓÚáéíóú])/g, "$1. $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeRecursiveFormula(formula: string | undefined): string | undefined {
  if (!formula) return formula;
  const dominantWorkPattern =
    /\\text\{Trabajo en ra[ií]z ?\}\s*([^\\]+?)\s*\\\\\s*\\text\{Trabajo en hojas ?\(\}\s*([^\\]+?)\s*\\text\{\)\}/i;
  const match = dominantWorkPattern.exec(formula);
  if (match) {
    const rootWork = match[1]?.trim() || "N/A";
    const leafWork = match[2]?.trim() || "N/A";
    return `\\text{Trabajo en raíz: } ${rootWork} \\quad \\text{Trabajo en hojas: } ${leafWork}`;
  }

  const dominantLevelCostPatternEs =
    /\\text\{Cada nivel tiene costo ?\}\s*n\s*(?:\\\\\s*)?\\text\{Total ?\}\s*=\s*(.+)$/i;
  const dominantLevelCostPatternEn =
    /\\text\{Each level has cost ?\}\s*n\s*(?:\\\\\s*)?\\text\{Total ?\}\s*=\s*(.+)$/i;

  const dominantLevelCostEs = dominantLevelCostPatternEs.exec(formula);
  if (dominantLevelCostEs) {
    const totalExpr = dominantLevelCostEs[1]?.trim() || "N/A";
    return `\\text{Cada nivel tiene costo: } n \\quad \\text{Total: } ${totalExpr}`;
  }

  const dominantLevelCostEn = dominantLevelCostPatternEn.exec(formula);
  if (dominantLevelCostEn) {
    const totalExpr = dominantLevelCostEn[1]?.trim() || "N/A";
    return `\\text{Each level has cost: } n \\quad \\text{Total: } ${totalExpr}`;
  }

  return formula;
}

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function pickCaseComplexity(snapshot: AalieAnalysisSnapshotV1, caseName: SnapshotCase): string {
  const result = snapshot.globalResult.cases[caseName];
  return (
    result?.big_theta ||
    result?.big_o ||
    result?.big_omega ||
    result?.T_polynomial ||
    result?.T_open ||
    ""
  );
}

function pushBlockIfPresent(blocks: DocumentBlock[], block: DocumentBlock | null): void {
  if (block) {
    blocks.push(block);
  }
}

function localizeStatusLabel(label: string, i18n: ExportI18nBundle): string {
  const mapped = STATUS_LABEL_MAP[label];
  if (!mapped) {
    return label;
  }
  return i18n.statusLabels[mapped];
}

function localizeTodos(todos: string[] | undefined, i18n: ExportI18nBundle): string[] {
  return (
    todos?.map((todo) => {
      if (todo === SNAPSHOT_NOT_IMPLEMENTED_TODOS.normalizedPseudocode) {
        return i18n.todos.normalizedPseudocode;
      }
      if (todo === SNAPSHOT_NOT_IMPLEMENTED_TODOS.loopInvariant) {
        return i18n.todos.loopInvariant;
      }
      if (todo === SNAPSHOT_NOT_IMPLEMENTED_TODOS.symbolicRecurrenceTree) {
        return i18n.todos.symbolicRecurrenceTree;
      }
      return todo;
    }) || []
  );
}

function buildStatusBlock(
  label: string,
  section: SnapshotSection<unknown>,
  i18n: ExportI18nBundle,
): DocumentBlock | null {
  if (section.status === "not_requested" || section.status === "available") {
    return null;
  }

  return {
    kind: "status",
    status: {
      label: localizeStatusLabel(label, i18n),
      status: section.status,
      message: i18n.sectionStatusLabels[section.status],
      todos: localizeTodos(section.todos, i18n),
    },
  };
}

function buildMetadataSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection {
  const entries: DocumentKeyValueEntry[] = [
    {
      label: localize(i18n, "Identificador del snapshot", "Snapshot identifier"),
      value: snapshot.snapshotId,
    },
    {
      label: localize(i18n, "Hash de contenido", "Content hash"),
      value: snapshot.contentHash,
    },
    {
      label: localize(i18n, "Identificador del análisis", "Analysis identifier"),
      value: snapshot.meta.analysisId,
    },
    {
      label: localize(i18n, "Fecha de creación", "Creation date"),
      value: snapshot.createdAt,
    },
    {
      label: localize(i18n, "Tipo de algoritmo", "Algorithm type"),
      value: i18n.algorithmTypeLabels[snapshot.algorithmType],
    },
    {
      label: localize(i18n, "Algoritmo", "Algorithm"),
      value: snapshot.meta.algorithm.name,
    },
    {
      label: localize(i18n, "Parámetros", "Parameters"),
      value: snapshot.meta.algorithm.parameters.join(", ") || i18n.notAvailable,
    },
    {
      label: i18n.methodsAppliedLabel,
      value:
        snapshot.meta.methodsApplied
          .map((method) => methodLabel(method, i18n))
          .join(", ") || i18n.notAvailable,
    },
    {
      label: i18n.methodsAvailableLabel,
      value:
        snapshot.meta.methodsAvailable
          .map((method) => methodLabel(method, i18n))
          .join(", ") || i18n.notAvailable,
    },
    {
      label: localize(i18n, "Origen de entrada", "Input origin"),
      value: snapshot.meta.sourceOrigin,
    },
  ];

  return {
    id: "metadata",
    title: i18n.metadataTitle,
    blocks: [
      {
        kind: "paragraph",
        text: `${i18n.generatedFromSnapshot}: ${snapshot.snapshotId}`,
      },
      {
        kind: "keyValue",
        entries,
      },
    ],
  };
}

function buildExecutiveSummarySection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection {
  const blocks: DocumentBlock[] = [];
  const loopInvariant =
    snapshot.algorithmType === "iterative" &&
    isSectionAvailable(snapshot.iterative) &&
    isSectionAvailable(snapshot.iterative.data.loopInvariant)
      ? snapshot.iterative.data.loopInvariant.data
      : null;
  if (snapshot.algorithmType === "iterative") {
    const algName = snapshot.meta.algorithm.name || "iterativo";
    const behaviour =
      typeof loopInvariant?.behaviour === "string"
        ? loopInvariant.behaviour.trim().replace("{}", algName)
        : "";

    if (behaviour) {
      blocks.push({
        kind: "paragraph",
        text: localize(i18n, behaviour, behaviour),
      });
    } else {
      blocks.push({
        kind: "paragraph",
        text: localize(
            i18n,
            "La evidencia disponible describe un comportamiento lineal estable por caso.",
            "Available evidence describes stable linear behavior across cases.",
          ),
      });
    }
  } else {
    blocks.push({
      kind: "paragraph",
      text:
        i18n.locale === "es"
          ? `Este reporte describe de forma pedagógica el análisis de ${snapshot.meta.algorithm.name}.`
          : `This report presents a pedagogical walkthrough of the analysis for ${snapshot.meta.algorithm.name}.`,
    });
  }
  blocks.push({
    kind: "paragraph",
    text: i18n.parseSummaryOk,
  });

  const availableCases = CASE_ORDER.filter((caseName) => Boolean(snapshot.globalResult.cases[caseName]));
  if (availableCases.length > 0) {
    const complexityByCase = availableCases.map((caseName) => ({
      caseName,
      complexity: pickCaseComplexity(snapshot, caseName) || i18n.notAvailable,
    }));
    const complexitySet = new Set(complexityByCase.map((entry) => entry.complexity));

    blocks.push({
      kind: "table",
      table: {
        title: localize(i18n, "Resumen comparativo por caso", "Comparative summary by case"),
        headers: [
          localize(i18n, "Caso", "Case"),
          localize(i18n, "Complejidad final", "Final complexity"),
        ],
        rows: complexityByCase.map((entry) => [caseLabel(entry.caseName, i18n), entry.complexity]),
        align: ["center", "center"],
      },
    });

    if (complexitySet.size === 1 && availableCases.length === 3) {
      const value = [...complexitySet][0];
      blocks.push({
        kind: "paragraph",
        text: localize(
          i18n,
          `La complejidad final es la misma para peor, mejor y promedio: ${value}.`,
          `Final complexity is the same for worst, best, and average cases: ${value}.`,
        ),
      });
    }
  }

  const warningItems = maybeList([
    ...snapshot.meta.warnings.map((warning) => warning.message),
  ]);

  if (warningItems.length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Advertencias detectadas:", "Detected warnings:"),
    });
    blocks.push({ kind: "list", items: warningItems });
  }

  return {
    id: "executive-summary",
    title: i18n.executiveSummaryTitle,
    blocks,
  };
}

function buildPseudocodeSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection {
  return {
    id: "pseudocode",
    title: snapshot.meta.algorithm.name,
    blocks: [
      {
        kind: "code",
        language: "text",
        code: snapshot.input.originalPseudocode,
      },
    ],
  };
}

function buildTraceSummaryItems(
  traceByCase:
    | {
        case: SnapshotCase;
        kind?: "iterative" | "recursive" | "hybrid" | "unknown";
        totalSteps?: number;
        totalCalls?: number;
        maxRecursionDepth?: number;
        truncated?: boolean;
      }[]
    | undefined,
  i18n: ExportI18nBundle,
): string[] {
  if (!traceByCase || traceByCase.length === 0) {
    return [];
  }

  return traceByCase.map((item) => {
    const truncatedText = item.truncated
      ? localize(i18n, "trazado truncado", "trace truncated")
      : localize(i18n, "trazado completo", "trace complete");

    return localize(
      i18n,
      `${caseLabel(item.case, i18n)}: ${safe(item.totalSteps, "0")} pasos, ${safe(item.totalCalls, "0")} llamadas, profundidad máxima ${safe(item.maxRecursionDepth, "0")} (${truncatedText}).`,
      `${caseLabel(item.case, i18n)}: ${safe(item.totalSteps, "0")} steps, ${safe(item.totalCalls, "0")} calls, max depth ${safe(item.maxRecursionDepth, "0")} (${truncatedText}).`,
    );
  });
}

function buildParsingSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection {
  const entries: DocumentKeyValueEntry[] = [
    {
      label: localize(i18n, "Parseo exitoso", "Parsing successful"),
      value: String(snapshot.input.parsingObservations.ok),
    },
    {
      label: localize(i18n, "Parser disponible", "Parser available"),
      value: safe(snapshot.input.parsingObservations.available, i18n.notAvailable),
    },
    {
      label: localize(i18n, "Entorno de parseo", "Parsing runtime"),
      value: safe(snapshot.input.parsingObservations.runtime, i18n.notAvailable),
    },
    {
      label: localize(i18n, "Error principal de parseo", "Main parsing error"),
      value: safe(snapshot.input.parsingObservations.error, i18n.notAvailable),
    },
    {
      label: localize(i18n, "Variación entre casos", "Case variability"),
      value: String(snapshot.input.analysisSummary.hasCaseVariability),
    },
    {
      label: localize(i18n, "Casos disponibles", "Available cases"),
      value:
        snapshot.input.analysisSummary.availableCases
          .map((caseName) => caseLabel(caseName, i18n))
          .join(", ") || i18n.notAvailable,
    },
  ];

  const blocks: DocumentBlock[] = [
    {
      kind: "keyValue",
      entries,
    },
  ];

  blocks.push({
    kind: "paragraph",
    text: isSectionAvailable(snapshot.internal.ast)
      ? localize(
          i18n,
          "La estructura interna del algoritmo pudo representarse correctamente para el análisis.",
          "The algorithm internal structure could be represented correctly for the analysis.",
        )
      : localize(
          i18n,
          "La estructura interna no está disponible para este caso.",
          "Internal structure is not available for this case.",
        ),
  });

  pushBlockIfPresent(
    blocks,
    buildStatusBlock("input.normalizedPseudocode", snapshot.input.normalizedPseudocode, i18n),
  );

  if (isSectionAvailable(snapshot.input.traceSummary)) {
    const items = buildTraceSummaryItems(snapshot.input.traceSummary.data, i18n);
    if (items.length > 0) {
      blocks.push({
        kind: "paragraph",
        text: i18n.pedagogicalTraceTitle,
      });
      blocks.push({ kind: "list", items });
    }
  } else {
    pushBlockIfPresent(
      blocks,
      buildStatusBlock("input.traceSummary", snapshot.input.traceSummary, i18n),
    );
  }

  if (snapshot.input.parsingObservations.errors && snapshot.input.parsingObservations.errors.length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Errores de parseo detectados:", "Detected parsing errors:"),
    });

    blocks.push({
      kind: "list",
      items: snapshot.input.parsingObservations.errors.map((err) =>
        i18n.locale === "es"
          ? `línea ${err.line}, columna ${err.column}: ${err.message}`
          : `line ${err.line}, column ${err.column}: ${err.message}`,
      ),
    });
  }

  return {
    id: "parsing",
    title: i18n.parsingTitle,
    blocks,
  };
}

function buildGlobalResultSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection {
  const blocks: DocumentBlock[] = [];
  const availableCases = CASE_ORDER.filter((caseName) => Boolean(snapshot.globalResult.cases[caseName]));
  const complexityByCase = availableCases.map((caseName) => ({
    caseName,
    complexity: pickCaseComplexity(snapshot, caseName) || i18n.notAvailable,
  }));
  const sameComplexityAcrossCases =
    availableCases.length === 3 &&
    new Set(complexityByCase.map((entry) => entry.complexity)).size === 1;

  if (sameComplexityAcrossCases) {
    const value = complexityByCase[0]?.complexity || i18n.notAvailable;
    blocks.push({
      kind: "subsection",
      title: localize(
        i18n,
        "Complejidad final (peor/mejor/promedio)",
        "Final complexity (worst/best/average)",
      ),
    });
    blocks.push({
      kind: "formula",
      label: i18n.pedagogicalFinalComplexityLabel,
      formula: value,
    });
    blocks.push({
      kind: "paragraph",
      text: localize(
        i18n,
        "Esta complejidad aplica por igual a los tres casos.",
        "This complexity applies equally to all three cases.",
      ),
    });
    return {
      id: "global-result",
      title: i18n.globalResultTitle,
      blocks,
    };
  }

  for (const caseName of CASE_ORDER) {
    const result = snapshot.globalResult.cases[caseName];
    if (!result) continue;

    blocks.push({
      kind: "subsection",
      title: `${i18n.pedagogicalCaseTitle}: ${caseLabel(caseName, i18n)}`,
    });

    const asymptotic = result.big_theta || result.big_o || result.big_omega || result.T_polynomial;
    if (asymptotic) {
      blocks.push({
        kind: "formula",
        label: i18n.pedagogicalFinalComplexityLabel,
        formula: asymptotic,
      });
    }

    const steps = maybeList(result.explanationSteps || []);
    if (steps.length > 0) {
      blocks.push({
        kind: "paragraph",
        text: localize(
          i18n,
          "Desarrollo paso a paso:",
          "Step-by-step development:",
        ),
      });
      blocks.push({ kind: "list", items: steps });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ kind: "paragraph", text: i18n.pedagogicalNoData });
  }

  return {
    id: "global-result",
    title: i18n.globalResultTitle,
    blocks,
  };
}

function buildHybridProcessSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection {
  const blocks: DocumentBlock[] = [];
  const availableCases = CASE_ORDER.filter((caseName) => Boolean(snapshot.globalResult.cases[caseName]));

  blocks.push({
    kind: "paragraph",
    text: localize(
      i18n,
      "El algoritmo híbrido combina una estructura de control iterativa con decisiones/llamadas recursivas. Para evitar duplicidad, este reporte prioriza el desarrollo recursivo completo y resume la interacción híbrida en una sola capa de proceso.",
      "This hybrid algorithm combines iterative control flow with recursive calls/decisions. To avoid duplication, this report prioritizes the full recursive walkthrough and summarizes hybrid interaction in a single process layer.",
    ),
  });

  blocks.push({
    kind: "subsection",
    title: localize(i18n, "Proceso de análisis híbrido", "Hybrid analysis process"),
  });
  blocks.push({
    kind: "list",
    items: [
      localize(
        i18n,
        "Se identifica la parte iterativa como mecanismo de recorrido/control.",
        "The iterative part is identified as the traversal/control mechanism.",
      ),
      localize(
        i18n,
        "Se identifica la parte recursiva como el núcleo de complejidad y derivación formal.",
        "The recursive part is identified as the core of complexity and formal derivation.",
      ),
      localize(
        i18n,
        "Se valida el método recursivo seleccionado y su trazabilidad paso a paso.",
        "The selected recursive method and its step-by-step traceability are validated.",
      ),
      localize(
        i18n,
        "Se reporta la complejidad final por caso y advertencias de cobertura.",
        "Final complexity is reported by case along with coverage warnings.",
      ),
    ],
  });

  if (availableCases.length > 0) {
    blocks.push({
      kind: "subsection",
      title: localize(i18n, "Complejidad por caso", "Case complexity"),
    });
    blocks.push({
      kind: "table",
      table: {
        headers: [i18n.caseHeaderLabel, i18n.pedagogicalFinalComplexityLabel],
        rows: availableCases.map((caseName) => [
          caseLabel(caseName, i18n),
          pickCaseComplexity(snapshot, caseName) || i18n.notAvailable,
        ]),
        align: ["left", "left"],
      },
    });
  }

  if (isSectionAvailable(snapshot.recursive) && isSectionAvailable(snapshot.recursive.data.selectedMethod)) {
    blocks.push({
      kind: "paragraph",
      text: localize(
        i18n,
        `Método recursivo priorizado: ${methodLabel(snapshot.recursive.data.selectedMethod.data, i18n)}.`,
        `Prioritized recursive method: ${methodLabel(snapshot.recursive.data.selectedMethod.data, i18n)}.`,
      ),
    });
  }

  return {
    id: "hybrid-process",
    title: localize(i18n, "Proceso Híbrido", "Hybrid Process"),
    blocks,
  };
}

interface IterativeTraceStep {
  stepNumber: number;
  line: number | null;
  eventKind: string;
  description: string;
  variables: Record<string, unknown>;
  variablesChanged: Record<string, unknown> | null;
  iteration: {
    loopVar?: string;
    currentValue?: number;
    maxValue?: number;
    iteration?: number;
  } | null;
  cost?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeIterativeTraceSteps(steps: unknown[]): IterativeTraceStep[] {
  const normalized: IterativeTraceStep[] = [];
  for (let index = 0; index < steps.length; index += 1) {
    const raw = asRecord(steps[index]);
    if (!raw) continue;

    const iterationRaw = asRecord(raw.iteration);
    let iteration: IterativeTraceStep["iteration"] = null;
    if (iterationRaw) {
      const iterationData: NonNullable<IterativeTraceStep["iteration"]> = {};
      if (typeof iterationRaw.loopVar === "string" && iterationRaw.loopVar.trim()) {
        iterationData.loopVar = iterationRaw.loopVar;
      }
      const currentValue = asNumber(iterationRaw.currentValue);
      if (currentValue !== null) {
        iterationData.currentValue = currentValue;
      }
      const maxValue = asNumber(iterationRaw.maxValue);
      if (maxValue !== null) {
        iterationData.maxValue = maxValue;
      }
      const iterationIndex = asNumber(iterationRaw.iteration ?? iterationRaw.index);
      if (iterationIndex !== null) {
        iterationData.iteration = iterationIndex;
      }
      iteration = iterationData;
    }

    const step: IterativeTraceStep = {
      stepNumber: asNumber(raw.step_number || raw.stepNumber) ?? index + 1,
      line: asNumber(raw.line),
      eventKind: String(raw.eventKind || raw.kind || "other"),
      description: String(raw.description || "").trim(),
      variables: asRecord(raw.variablesSnapshot || raw.variables) || {},
      variablesChanged: asRecord(raw.variables_changed || raw.variablesChanged) || null,
      iteration,
      cost: typeof raw.cost === "string" ? raw.cost : undefined,
    };
    normalized.push(step);
  }

  return normalized.sort((a, b) => a.stepNumber - b.stepNumber);
}

function formatStateValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "undefined") return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const preview = value.slice(0, 5).map((item) => formatStateValue(item));
    const suffix = value.length > 5 ? ", ..." : "";
    return `[${preview.join(", ")}${suffix}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 3);
    const preview = entries.map(([key, nested]) => `${key}:${formatStateValue(nested)}`);
    const suffix = Object.keys(value as Record<string, unknown>).length > 3 ? ", ..." : "";
    return `{${preview.join(", ")}${suffix}}`;
  }
  return String(value);
}

function eventLabel(eventKind: string, i18n: ExportI18nBundle): string {
  const labels: Record<string, [string, string]> = {
    assign: ["Actualización", "Assignment"],
    condition_eval: ["Evaluación de condición", "Condition evaluation"],
    loop_enter: ["Entrada al ciclo", "Loop entry"],
    loop_iter_enter: ["Inicio de iteración", "Iteration start"],
    loop_iter_exit: ["Fin de iteración", "Iteration end"],
    loop_exit: ["Salida del ciclo", "Loop exit"],
    return_emit: ["Return", "Return"],
    call_enter: ["Entrada a llamada", "Call enter"],
    call_exit: ["Salida de llamada", "Call exit"],
    print: ["Impresión", "Print"],
    enter_block: ["Entrada a bloque", "Block entry"],
    end: ["Fin", "End"],
  };
  const picked = labels[eventKind];
  if (!picked) {
    return eventKind;
  }
  return localize(i18n, picked[0], picked[1]);
}

function buildChanges(
  step: IterativeTraceStep,
  previous: IterativeTraceStep | null,
): Array<{ name: string; before: unknown; after: unknown }> {
  const changesRaw: Record<string, unknown> = step.variablesChanged || {};
  const entries = Object.entries(changesRaw);
  if (entries.length > 0) {
    return entries.map(([name, after]) => ({
      name,
      before: previous?.variables[name],
      after,
    }));
  }
  return [];
}

function pickRelevantStateVariableNames(
  selectedLoop: Record<string, unknown> | null,
  steps: IterativeTraceStep[],
): string[] {
  const preferred = new Set<string>();
  const controlVariables = Array.isArray(selectedLoop?.controlVariables)
    ? selectedLoop.controlVariables
    : [];
  const stateVariables = Array.isArray(selectedLoop?.stateVariables)
    ? selectedLoop.stateVariables
    : [];

  for (const name of [...controlVariables, ...stateVariables]) {
    if (typeof name === "string" && name.trim()) {
      preferred.add(name.trim());
    }
  }

  const changeFrequency = new Map<string, number>();
  for (let index = 0; index < steps.length; index += 1) {
    const previous = index > 0 ? steps[index - 1] : null;
    const changes = buildChanges(steps[index], previous);
    for (const change of changes) {
      changeFrequency.set(change.name, (changeFrequency.get(change.name) || 0) + 1);
    }
  }

  const orderedByChange = [...changeFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  for (const name of orderedByChange) {
    preferred.add(name);
    if (preferred.size >= 3) break;
  }

  if (preferred.size === 0 && steps.length > 0) {
    for (const name of Object.keys(steps[0].variables)) {
      preferred.add(name);
      if (preferred.size >= 2) break;
    }
  }

  return [...preferred].slice(0, 3);
}

function buildRelevantStateSnapshot(
  step: IterativeTraceStep,
  relevantNames: string[],
  previous: IterativeTraceStep | null,
): string {
  const values = relevantNames
    .filter((name) => Object.prototype.hasOwnProperty.call(step.variables, name))
    .map((name) => `${name}=${formatStateValue(step.variables[name])}`);
  if (values.length === 0) return "-";
  const current = values.join(", ");
  if (!previous) return current;

  const previousValues = relevantNames
    .filter((name) => Object.prototype.hasOwnProperty.call(previous.variables, name))
    .map((name) => `${name}=${formatStateValue(previous.variables[name])}`);
  const previousSnapshot = previousValues.join(", ");
  return current === previousSnapshot ? "-" : current;
}

function stableValueFingerprint(value: unknown): string {
  if (typeof value === "undefined") return "__undefined__";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function pickStableTraceInputs(
  steps: IterativeTraceStep[],
  excludedNames: Set<string>,
): Array<{ name: string; value: unknown }> {
  if (steps.length === 0) return [];
  const firstVariables = steps[0].variables || {};
  const keys = Object.keys(firstVariables);
  const stable: Array<{ name: string; value: unknown }> = [];

  for (const key of keys) {
    if (excludedNames.has(key)) continue;
    const initialValue = firstVariables[key];
    const fingerprint = stableValueFingerprint(initialValue);
    let isStable = true;
    for (const step of steps) {
      if (!Object.prototype.hasOwnProperty.call(step.variables, key)) {
        isStable = false;
        break;
      }
      if (stableValueFingerprint(step.variables[key]) !== fingerprint) {
        isStable = false;
        break;
      }
    }
    if (isStable) {
      stable.push({ name: key, value: initialValue });
    }
  }

  return stable;
}

function buildStepContext(
  step: IterativeTraceStep,
  i18n: ExportI18nBundle,
): string {
  if (step.eventKind === "loop_enter" && step.iteration?.loopVar) {
    const min = typeof step.iteration.currentValue === "number"
      ? String(step.iteration.currentValue)
      : "?";
    const max = typeof step.iteration.maxValue === "number"
      ? String(step.iteration.maxValue)
      : "?";
    return `${step.iteration.loopVar}=${min}..${max}`;
  }
  if (
    (step.eventKind === "loop_iter_enter" || step.eventKind === "loop_iter_exit") &&
    step.iteration?.loopVar
  ) {
    const iterationLabel = step.iteration.iteration
      ? String(step.iteration.iteration)
      : "?";
    const currentValue = typeof step.iteration.currentValue === "number"
      ? String(step.iteration.currentValue)
      : "?";
    return localize(
      i18n,
      `iteración ${iterationLabel} (${step.iteration.loopVar}=${currentValue})`,
      `iteration ${iterationLabel} (${step.iteration.loopVar}=${currentValue})`,
    );
  }
  if (step.description) return step.description;
  return "-";
}

function buildStateChangeText(
  step: IterativeTraceStep,
  previous: IterativeTraceStep | null,
  i18n: ExportI18nBundle,
): string {
  const changes = buildChanges(step, previous)
    .slice(0, 3)
    .map((change) =>
      `${change.name}: ${formatStateValue(change.before)} -> ${formatStateValue(change.after)}`,
    );
  return changes.length > 0 ? changes.join(", ") : "-";
}

function buildCaseTraceExecutiveItems(
  snapshot: AalieAnalysisSnapshotV1,
  steps: IterativeTraceStep[],
  selectedLoop: Record<string, unknown> | null,
  caseName: SnapshotCase,
  i18n: ExportI18nBundle,
): { header: string; items: string[] } {
  const firstStepN = asNumber(steps[0]?.variables.n);
  const inputN = typeof firstStepN === "number" ? String(firstStepN) : i18n.notAvailable;

  const loopEnterStep = steps.find((step) => step.eventKind === "loop_enter");
  const iterationSteps = steps.filter((step) => step.eventKind === "loop_iter_enter");
  const firstIteration = iterationSteps[0];
  const lastIteration = iterationSteps[iterationSteps.length - 1];
  const controlVariable =
    (typeof loopEnterStep?.iteration?.loopVar === "string" && loopEnterStep.iteration.loopVar) ||
    (typeof firstIteration?.iteration?.loopVar === "string" && firstIteration.iteration.loopVar) ||
    (Array.isArray(selectedLoop?.controlVariables) && typeof selectedLoop?.controlVariables[0] === "string"
      ? String(selectedLoop.controlVariables[0])
      : i18n.notAvailable);

  const minControl =
    loopEnterStep?.iteration?.currentValue ?? firstIteration?.iteration?.currentValue;
  const maxControl =
    loopEnterStep?.iteration?.maxValue ??
    lastIteration?.iteration?.currentValue ??
    firstIteration?.iteration?.maxValue;
  const controlRange =
    typeof minControl === "number" && typeof maxControl === "number"
      ? localize(i18n, `${controlVariable} de ${minControl} a ${maxControl}`, `${controlVariable} from ${minControl} to ${maxControl}`)
      : i18n.notAvailable;

  const returnStep = [...steps].reverse().find((step) => step.eventKind === "return_emit");
  const returnValue = returnStep?.description
    ? returnStep.description.replace(/^RETURN\s*/i, "").trim() || returnStep.description
    : i18n.notAvailable;

  const excludedNames = new Set<string>();
  if (controlVariable && controlVariable !== i18n.notAvailable) {
    excludedNames.add(controlVariable);
  }
  const stableInputs = pickStableTraceInputs(steps, excludedNames);
  const scalarInputs = stableInputs.filter(
    (entry) =>
      !Array.isArray(entry.value) &&
      (entry.value === null || typeof entry.value !== "object"),
  );
  const tabulatedInputs = stableInputs.filter((entry) => Array.isArray(entry.value));
  const scalarInputSummary =
    scalarInputs.length > 0
      ? scalarInputs.map((entry) => `${entry.name}=${formatStateValue(entry.value)}`).join(", ")
      : i18n.notAvailable;
  const tabulatedSummary =
    tabulatedInputs.length > 0
      ? tabulatedInputs
          .map((entry) => `${entry.name}=${formatStateValue(entry.value)}`)
          .join(", ")
      : localize(i18n, "no reportados en el trace", "not reported in trace");

  const header = localize(
    i18n,
    `Seguimiento de ejecución (caso ${caseLabel(caseName, i18n)}, entrada n=${inputN})`,
    `Execution trace (${caseLabel(caseName, i18n)} case, input n=${inputN})`,
  );

  return {
    header,
    items: [
      snapshot.meta.algorithm.name,
      `${localize(i18n, "Total de pasos observados", "Total observed steps")}: ${String(steps.length)}`,
      `${localize(i18n, "Total de iteraciones observadas del FOR", "Observed FOR iterations")}: ${String(iterationSteps.length)}`,
      `${localize(i18n, "Variable de control", "Control variable")}: ${controlRange}`,
      `${localize(i18n, "Valores de entrada detectados", "Detected input values")}: ${scalarInputSummary}`,
      `${localize(i18n, "Valores tabulados detectados", "Detected tabulated values")}: ${tabulatedSummary}`,
      `${localize(i18n, "Valor retornado", "Returned value")}: ${returnValue}`,
    ],
  };
}

function buildIterativeTraceTable(
  steps: IterativeTraceStep[],
  relevantStateVariables: string[],
  lineCostByLine: Map<number, string>,
  i18n: ExportI18nBundle,
): DocumentTable {
  const headers = i18n.locale === "es"
    ? ["Paso", "Línea", "Evento", "Contexto", "Cambio de estado", "Estado relevante", "Costo"]
    : ["Step", "Line", "Event", "Context", "State change", "Relevant state", "Cost"];

  return {
    headers,
    rows: steps.map((step, index) => {
      const previous = index > 0 ? steps[index - 1] : null;
      return [
        String(step.stepNumber),
        step.line === null ? "-" : String(step.line),
        eventLabel(step.eventKind, i18n),
        buildStepContext(step, i18n),
        buildStateChangeText(step, previous, i18n),
        buildRelevantStateSnapshot(step, relevantStateVariables, previous),
        step.line !== null && lineCostByLine.has(step.line)
          ? (lineCostByLine.get(step.line) as string)
          : (step.cost || "-"),
      ];
    }),
  };
}

function buildLineCostMap(
  lineCosts: Array<{ line?: number | null; ck?: string | null }>,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const row of lineCosts) {
    const line = typeof row.line === "number" ? row.line : null;
    const ck = typeof row.ck === "string" ? row.ck.trim() : "";
    if (line === null || !ck) continue;
    if (!map.has(line)) {
      map.set(line, ck);
    }
  }
  return map;
}

function summarizeStepForTimeline(
  step: IterativeTraceStep,
  previous: IterativeTraceStep | null,
): string | null {
  if (step.eventKind === "assign") {
    const changes = buildChanges(step, previous);
    if (changes.length > 0) {
      const head = changes[0];
      return `${head.name} <- ${formatStateValue(head.after)}`;
    }
  }
  if (step.eventKind === "return_emit") {
    return step.description || "RETURN";
  }
  if (step.eventKind === "condition_eval") {
    return step.description || null;
  }
  return null;
}

function buildIterativeGroupedTimelineBlocks(
  steps: IterativeTraceStep[],
  i18n: ExportI18nBundle,
): DocumentBlock[] {
  if (steps.length === 0) return [];

  const blocks: DocumentBlock[] = [];
  const firstLoopEnterIndex = steps.findIndex((step) => step.eventKind === "loop_enter");
  const initializationSlice =
    firstLoopEnterIndex > 0 ? steps.slice(0, firstLoopEnterIndex) : [];

  const initializationItems: string[] = [];
  if (initializationSlice.length > 0) {
    for (let index = 0; index < initializationSlice.length; index += 1) {
      const step = initializationSlice[index];
      const previous = index > 0 ? initializationSlice[index - 1] : null;
      const summary = summarizeStepForTimeline(step, previous);
      if (summary) initializationItems.push(summary);
    }
    if (initializationItems.length > 0) {
      blocks.push({
        kind: "heading",
        text: localize(i18n, "Nivel 1: Inicialización", "Level 1: Initialization"),
      });
      blocks.push({ kind: "list", items: initializationItems });
    }
  }

  const loopEnterStep = firstLoopEnterIndex >= 0 ? steps[firstLoopEnterIndex] : null;
  if (loopEnterStep) {
    const loopVar = loopEnterStep.iteration?.loopVar || "i";
    const min = typeof loopEnterStep.iteration?.currentValue === "number"
      ? String(loopEnterStep.iteration?.currentValue)
      : "?";
    const max = typeof loopEnterStep.iteration?.maxValue === "number"
      ? String(loopEnterStep.iteration?.maxValue)
      : "?";
    blocks.push({
      kind: "heading",
      text: localize(
        i18n,
        `Nivel 1: Bucle FOR ${loopVar} <- ${min} TO ${max}`,
        `Level 1: FOR loop ${loopVar} <- ${min} TO ${max}`,
      ),
    });

    const outerLoopBodyItems: string[] = [];
    const iterationGroups: Array<{ title: string; items: string[] }> = [];
    let currentIteration: { title: string; items: string[] } | null = null;

    for (let index = firstLoopEnterIndex + 1; index < steps.length; index += 1) {
      const step = steps[index];
      if (step.eventKind === "loop_iter_enter") {
        if (currentIteration) {
          iterationGroups.push(currentIteration);
        }
        const iterationLabel = step.iteration?.iteration ?? "?";
        const controlValue = step.iteration?.currentValue ?? "?";
        currentIteration = {
          title: localize(
            i18n,
            `Nivel 2: Iteración ${iterationLabel} (${step.iteration?.loopVar || "i"} = ${String(controlValue)})`,
            `Level 2: Iteration ${iterationLabel} (${step.iteration?.loopVar || "i"} = ${String(controlValue)})`,
          ),
          items: [],
        };
        continue;
      }
      if (step.eventKind === "loop_iter_exit" || step.eventKind === "loop_exit") {
        continue;
      }
      if (step.eventKind === "return_emit") {
        break;
      }
      const summary = summarizeStepForTimeline(step, index > 0 ? steps[index - 1] : null);
      if (!summary) continue;
      if (currentIteration) {
        currentIteration.items.push(summary);
      } else {
        outerLoopBodyItems.push(summary);
      }
    }

    if (currentIteration) {
      iterationGroups.push(currentIteration);
    }

    if (outerLoopBodyItems.length > 0) {
      blocks.push({
        kind: "heading",
        text: localize(
          i18n,
          "Nivel 2: Cuerpo general del ciclo",
          "Level 2: General loop body",
        ),
      });
      blocks.push({ kind: "list", items: outerLoopBodyItems });
    }

    for (const iterationGroup of iterationGroups) {
      blocks.push({ kind: "heading", text: iterationGroup.title });
      blocks.push({
        kind: "list",
        items:
          iterationGroup.items.length > 0
            ? iterationGroup.items
            : [localize(i18n, "Sin cambios relevantes", "No relevant changes")],
      });
    }
  }

  const returnStep = [...steps].reverse().find((step) => step.eventKind === "return_emit");
  if (returnStep) {
    blocks.push({
      kind: "heading",
      text: localize(i18n, "Nivel 1: Retorno", "Level 1: Return"),
    });
    blocks.push({
      kind: "list",
      items: [returnStep.description || "RETURN"],
    });
  }

  return blocks;
}

function buildLineCostTable(lineCosts: LineCost[], i18n: ExportI18nBundle): DocumentTable {
  const headers = i18n.locale === "es"
    ? ["Línea", "Tipo", "Costo base", "Conteo (sumatoria)", "Conteo simplificado"]
    : ["Line", "Kind", "Base cost", "Count (summation)", "Simplified count"];

  return {
    headers,
    rows: lineCosts.map((line) => [
      String(line.line),
      line.kind,
      line.ck,
      line.count_raw || "-",
      line.count || "-",
    ]),
  };
}

function normalizeMathExpression(expression: string): string {
  return expression.replace(/\s+/g, " ").trim();
}

function wrapSummationTerm(expression: string): string {
  const normalized = normalizeMathExpression(expression);
  if (!normalized) return "0";
  if (/^[A-Za-z0-9_{}\\]+$/.test(normalized)) {
    return normalized;
  }
  return `(${normalized})`;
}

type LinearInN = { nCoeff: number; constant: number };

function parseLinearCountExpression(rawExpression: string): LinearInN | null {
  let expression = rawExpression.trim();
  if (!expression) return null;

  while (expression.startsWith("(") && expression.endsWith(")")) {
    const inner = expression.slice(1, -1).trim();
    if (!inner || inner === expression) break;
    expression = inner;
  }

  const compact = expression.replace(/\s+/g, "");
  if (/^[-+]?\d+$/.test(compact)) {
    return { nCoeff: 0, constant: Number(compact) };
  }
  if (compact === "n" || compact === "+n") {
    return { nCoeff: 1, constant: 0 };
  }
  if (compact === "-n") {
    return { nCoeff: -1, constant: 0 };
  }
  const coeffOnly = compact.match(/^([-+]?\d*)\*?n$/);
  if (coeffOnly) {
    const token = coeffOnly[1];
    const coeff = token === "" || token === "+" ? 1 : token === "-" ? -1 : Number(token);
    if (!Number.isNaN(coeff)) {
      return { nCoeff: coeff, constant: 0 };
    }
  }
  const coeffAndConstant = compact.match(/^([-+]?\d*)\*?n([+-]\d+)$/);
  if (coeffAndConstant) {
    const coeffToken = coeffAndConstant[1];
    const coeff =
      coeffToken === "" || coeffToken === "+" ? 1 : coeffToken === "-" ? -1 : Number(coeffToken);
    const constant = Number(coeffAndConstant[2]);
    if (!Number.isNaN(coeff) && !Number.isNaN(constant)) {
      return { nCoeff: coeff, constant };
    }
  }
  const nLeading = compact.match(/^n([+-]\d+)$/);
  if (nLeading) {
    const constant = Number(nLeading[1]);
    if (!Number.isNaN(constant)) {
      return { nCoeff: 1, constant };
    }
  }
  return null;
}

function formatLinearExpression(value: LinearInN): string {
  const pieces: string[] = [];
  if (value.nCoeff !== 0) {
    if (value.nCoeff === 1) {
      pieces.push("n");
    } else if (value.nCoeff === -1) {
      pieces.push("-n");
    } else {
      pieces.push(`${value.nCoeff}n`);
    }
  }
  if (value.constant !== 0 || pieces.length === 0) {
    const constant = String(Math.abs(value.constant));
    if (pieces.length === 0) {
      pieces.push(value.constant < 0 ? `-${constant}` : constant);
    } else {
      pieces.push(value.constant < 0 ? `- ${constant}` : `+ ${constant}`);
    }
  }
  return pieces.join(" ");
}

function buildCountSummationExpression(lineCosts: LineCost[]): { structural: string; simplified: string | null } {
  const terms = lineCosts.map((line) => normalizeMathExpression(line.count || line.count_raw || "0"));
  const structural = terms.length > 0 ? terms.map((term) => wrapSummationTerm(term)).join(" + ") : "0";
  const parsed = terms.map((term) => parseLinearCountExpression(term));
  if (parsed.some((item) => item === null)) {
    return { structural, simplified: null };
  }
  const linear = parsed.reduce(
    (acc, item) => ({
      nCoeff: (acc?.nCoeff || 0) + (item?.nCoeff || 0),
      constant: (acc?.constant || 0) + (item?.constant || 0),
    }),
    { nCoeff: 0, constant: 0 } as LinearInN,
  );
  const simplified = formatLinearExpression(linear as LinearInN);
  return { structural, simplified: simplified === structural ? null : simplified };
}

function buildTotalCostExpression(lineCosts: LineCost[]): string {
  if (lineCosts.length === 0) {
    return "T(n) = 0";
  }
  const terms = lineCosts.map((line) => {
    const count = normalizeMathExpression(line.count || line.count_raw || "0");
    const baseCost = normalizeMathExpression(line.ck || "C");
    return `${baseCost}\\left(${count}\\right)`;
  });
  return `T(n) = ${terms.join(" + ")}`;
}

function ensureTnPrefix(expression: string): string {
  const normalized = expression.trim();
  if (!normalized) return normalized;
  if (/^T\s*\(\s*n\s*\)\s*=/.test(normalized)) {
    return normalized;
  }
  return `T(n) = ${normalized}`;
}

function extractSelectedLoopLines(
  pseudocode: string,
  selectedLoop: Record<string, unknown> | null,
): DocumentInstitutionalCodeLine[] {
  const lineStart = asNumber(selectedLoop?.lineStart);
  const lineEnd = asNumber(selectedLoop?.lineEnd);
  if (lineStart === null || lineEnd === null || lineEnd < lineStart) {
    return [];
  }

  const lines = pseudocode.split(/\r?\n/);
  const picked: DocumentInstitutionalCodeLine[] = [];
  for (let line = lineStart; line <= lineEnd; line += 1) {
    const source = lines[line - 1];
    if (typeof source !== "string") continue;
    picked.push({
      lineNumber: line,
      text: source.trimEnd(),
    });
  }
  return picked;
}

function stripLeadingLabel(value: string, labels: string[]): string {
  let normalized = value.trim();
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(new RegExp(`^${escaped}\\s*:\\s*`, "i"), "");
  }
  return normalized.trim();
}

function buildIterativeInvariantBlocks(
  snapshot: AalieAnalysisSnapshotV1,
  loopInvariantSection: SnapshotSection<LoopInvariant>,
  i18n: ExportI18nBundle,
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];

  if (!isSectionAvailable(loopInvariantSection)) {
    pushBlockIfPresent(blocks, buildStatusBlock("iterative.loopInvariant", loopInvariantSection, i18n));
    return blocks;
  }

  const payload = loopInvariantSection.data;
  const selectedLoop = asRecord(payload.selectedLoop);
  const selectedLoopLines = extractSelectedLoopLines(
    snapshot.input.originalPseudocode,
    selectedLoop,
  );

  blocks.push({
    kind: "subsection",
    title: localize(i18n, "Ciclo seleccionado", "Selected loop"),
  });

  if (selectedLoopLines.length > 0) {
    blocks.push({
      kind: "institutionalCode",
      lines: selectedLoopLines,
    });
  } else {
    blocks.push({
      kind: "paragraph",
      text: localize(
        i18n,
        "No fue posible serializar el ciclo seleccionado con las líneas esperadas.",
        "The selected loop could not be serialized with the expected line range.",
      ),
    });
  }

  blocks.push({
    kind: "subsection",
    title: localize(i18n, "Propiedad del invariante", "Invariant property"),
  });
  blocks.push({
    kind: "paragraph",
    text: safe(payload.invariant?.propertyStatement, i18n.notAvailable),
  });

  blocks.push({
    kind: "subsection",
    title: localize(i18n, "Demostración pedagógica", "Pedagogical proof"),
  });
  const initializationLabel = localize(i18n, "Inicialización", "Initialization");
  const maintenanceLabel = localize(i18n, "Mantenimiento", "Maintenance");
  const finalizationLabel = localize(i18n, "Finalización", "Finalization");
  blocks.push({
    kind: "list",
    items: [
      `${initializationLabel}: ${stripLeadingLabel(
        safe(payload.invariant?.initialization, i18n.notAvailable),
        ["Inicialización", "Initialization"],
      )}`,
      `${maintenanceLabel}: ${stripLeadingLabel(
        safe(payload.invariant?.maintenance, i18n.notAvailable),
        ["Mantenimiento", "Maintenance"],
      )}`,
      `${finalizationLabel}: ${stripLeadingLabel(
        safe(payload.invariant?.finalization, i18n.notAvailable),
        ["Finalización", "Finalization"],
      )}`,
    ],
  });

  blocks.push({
    kind: "emphasis",
    text: normalizeDidacticSummaryText(safe(payload.didacticSummary, i18n.notAvailable)),
  });

  const evidence = payload.evidence;
  blocks.push({
    kind: "subsection",
    title: localize(i18n, "Resumen técnico", "Technical summary"),
  });
  blocks.push({
    kind: "list",
    items: [
      `${localize(i18n, "Patrón detectado", "Detected pattern")}: ${safe(selectedLoop?.patternType, i18n.notAvailable)}`,
      `${localize(i18n, "Tipo de ciclo", "Loop type")}: ${safe(selectedLoop?.nodeType, i18n.notAvailable)}`,
      `${localize(i18n, "Líneas seleccionadas", "Selected lines")}: ${safe(selectedLoop?.lineStart, "?")} - ${safe(selectedLoop?.lineEnd, "?")}`,
      `${localize(i18n, "Variante", "Variant")}: ${safe(evidence.templateVariant, i18n.notAvailable)}`,
      `${localize(i18n, "Confianza", "Confidence")}: ${safe(evidence.classificationConfidence, i18n.notAvailable)}`,
    ],
  });

  return blocks;
}

function buildIterativeInvariantSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection | null {
  if (!isSectionAvailable(snapshot.iterative)) {
    const statusBlock = buildStatusBlock("iterative", snapshot.iterative, i18n);
    if (!statusBlock) return null;
    return {
      id: "iterative-invariant",
      title: localize(i18n, "Invariante del Ciclo", "Loop Invariant"),
      blocks: [statusBlock],
    };
  }

  const blocks = buildIterativeInvariantBlocks(snapshot, snapshot.iterative.data.loopInvariant, i18n);
  if (blocks.length === 0) {
    blocks.push({ kind: "paragraph", text: i18n.pedagogicalNoData });
  }

  return {
    id: "iterative-invariant",
    title: localize(i18n, "Invariante del Ciclo", "Loop Invariant"),
    blocks,
  };
}

function buildIterativeCaseAnalysisBlocks(
  caseName: SnapshotCase,
  lineCosts: LineCost[],
  globalCase:
    | {
        T_open?: string;
        T_polynomial?: string;
        big_theta?: string;
        big_o?: string;
        big_omega?: string;
      }
    | null
    | undefined,
  asymptoticProcedure: string[],
  i18n: ExportI18nBundle,
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const normalizedLineCosts = lineCosts || [];
  const countSum = buildCountSummationExpression(normalizedLineCosts);
  const countFormula = countSum.simplified
    ? `${countSum.structural} = ${countSum.simplified}`
    : countSum.structural;
  const finalComplexity = globalCase?.big_theta || globalCase?.big_o || globalCase?.big_omega || null;
  const simplifiedCost = globalCase?.T_polynomial || globalCase?.T_open || null;

  blocks.push({
    kind: "subsection",
    title: caseLabel(caseName, i18n),
  });

  blocks.push({
    kind: "heading",
    text: localize(
      i18n,
      "Conteo por línea y procedimiento",
      "Per-line count and procedure",
    ),
  });
  if (normalizedLineCosts.length === 0) {
    blocks.push({ kind: "paragraph", text: i18n.pedagogicalNoData });
  } else {
    blocks.push({ kind: "table", table: buildLineCostTable(normalizedLineCosts, i18n) });
  }

  blocks.push({
    kind: "heading",
    text: localize(
      i18n,
      "Suma de conteos por línea",
      "Sum of per-line counts",
    ),
  });
  blocks.push({
    kind: "formula",
    formula: countFormula,
  });

  blocks.push({
    kind: "heading",
    text: localize(
      i18n,
      "Costo total T(n)",
      "Total cost T(n)",
    ),
  });
  blocks.push({
    kind: "formula",
    formula: buildTotalCostExpression(normalizedLineCosts),
  });

  blocks.push({
    kind: "heading",
    text: localize(
      i18n,
      "Forma simplificada del costo",
      "Simplified cost form",
    ),
  });
  blocks.push({
    kind: "formula",
    formula: simplifiedCost ? ensureTnPrefix(simplifiedCost) : i18n.notAvailable,
  });

  blocks.push({
    kind: "heading",
    text: localize(
      i18n,
      "Paso a complejidad asintótica",
      "Asymptotic transition",
    ),
  });
  const asymptoticSteps = asymptoticProcedure.length > 0
    ? asymptoticProcedure
    : [
        localize(
          i18n,
          "Se identifica el término dominante del costo simplificado para obtener la clase asintótica.",
          "The dominant term from the simplified cost determines the asymptotic class.",
        ),
      ];
  blocks.push({ kind: "list", items: asymptoticSteps });

  blocks.push({
    kind: "heading",
    text: localize(
      i18n,
      "Complejidad final",
      "Final complexity",
    ),
  });
  blocks.push({
    kind: "formula",
    formula: finalComplexity ? ensureTnPrefix(finalComplexity) : i18n.notAvailable,
  });

  return blocks;
}

function buildIterativeCaseAnalysisSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection | null {
  if (!isSectionAvailable(snapshot.iterative)) {
    const statusBlock = buildStatusBlock("iterative", snapshot.iterative, i18n);
    if (!statusBlock) return null;
    return {
      id: "iterative-cases",
      title: localize(i18n, "Análisis por Casos", "Case Analysis"),
      blocks: [statusBlock],
    };
  }

  const data = snapshot.iterative.data;
  const blocks: DocumentBlock[] = [];

  for (const caseName of CASE_ORDER) {
    const lineCosts = data.lineCostTable[caseName] || [];
    const asymptoticProcedure = maybeList(data.asymptoticProcedure[caseName] || []);
    const globalCase = snapshot.globalResult.cases[caseName];
    if (!globalCase && lineCosts.length === 0 && asymptoticProcedure.length === 0) {
      continue;
    }

    blocks.push(
      ...buildIterativeCaseAnalysisBlocks(
        caseName,
        lineCosts,
        globalCase,
        asymptoticProcedure,
        i18n,
      ),
    );
  }

  if (blocks.length === 0) {
    blocks.push({ kind: "paragraph", text: i18n.pedagogicalNoData });
  }

  return {
    id: "iterative-cases",
    title: localize(i18n, "Análisis por Casos", "Case Analysis"),
    blocks,
  };
}

function buildIterativeTraceSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection | null {
  if (!isSectionAvailable(snapshot.iterative)) {
    const statusBlock = buildStatusBlock("iterative", snapshot.iterative, i18n);
    if (!statusBlock) return null;
    return {
      id: "iterative-trace",
      title: i18n.traceTitle,
      blocks: [statusBlock],
    };
  }

  const data = snapshot.iterative.data;
  const blocks: DocumentBlock[] = [];

  if (!isSectionAvailable(data.trace)) {
    pushBlockIfPresent(blocks, buildStatusBlock("iterative.trace", data.trace, i18n));
    return {
      id: "iterative-trace",
      title: i18n.traceTitle,
      blocks: blocks.length > 0 ? blocks : [{ kind: "paragraph", text: i18n.pedagogicalNoData }],
    };
  }

  const traceCases = CASE_ORDER
    .map((caseName) => ({
      caseName,
      trace: data.trace.data?.[caseName],
    }))
    .filter((entry) => Boolean(entry.trace?.steps && entry.trace.steps.length > 0))
    .map((entry) => ({
      caseName: entry.caseName,
      steps: normalizeIterativeTraceSteps(entry.trace?.steps || []),
    }));

  if (traceCases.length === 0) {
    blocks.push({ kind: "paragraph", text: i18n.pedagogicalNoData });
    return {
      id: "iterative-trace",
      title: i18n.traceTitle,
      blocks,
    };
  }

  const representative = traceCases.find((entry) => entry.caseName === "worst");
  if (!representative) {
    blocks.push({
      kind: "paragraph",
      text: localize(
        i18n,
        "Seguimiento del peor caso no disponible.",
        "Worst-case trace is not available.",
      ),
    });
    return {
      id: "iterative-trace",
      title: i18n.traceTitle,
      blocks,
    };
  }
  const loopInvariantPayload = isSectionAvailable(data.loopInvariant)
    ? data.loopInvariant.data
    : null;
  const selectedLoop = asRecord(loopInvariantPayload?.selectedLoop);
  const relevantStateVariables = pickRelevantStateVariableNames(selectedLoop, representative.steps);
  const worstLineCosts = data.lineCostTable?.worst || [];
  const lineCostByLine = buildLineCostMap(worstLineCosts);
  const executive = buildCaseTraceExecutiveItems(
    snapshot,
    representative.steps,
    selectedLoop,
    representative.caseName,
    i18n,
  );

  blocks.push({
    kind: "subsection",
    title: localize(i18n, "Capa 1: Resumen ejecutivo", "Layer 1: Executive summary"),
  });
  blocks.push({
    kind: "paragraph",
    text: localize(
      i18n,
      `Caso analizado en detalle: ${caseLabel("worst", i18n)}.`,
      `Case analyzed in detail: ${caseLabel("worst", i18n)}.`,
    ),
  });
  blocks.push({ kind: "list", items: executive.items });

  blocks.push({
    kind: "subsection",
    title: localize(
      i18n,
      "Capa 2: Tabla cronológica pedagógica",
      "Layer 2: Pedagogical chronological table",
    ),
  });
  blocks.push({
    kind: "table",
    table: buildIterativeTraceTable(
      representative.steps,
      relevantStateVariables,
      lineCostByLine,
      i18n,
    ),
  });

  blocks.push({
    kind: "subsection",
    title: localize(
      i18n,
      "Capa 3: Vista agrupada por estructura de control",
      "Layer 3: Control-structure grouped view",
    ),
  });
  blocks.push({
    kind: "paragraph",
    text: localize(
      i18n,
      "La vista agrupada organiza la ejecución por inicialización, iteraciones y retorno para facilitar la trazabilidad.",
      "The grouped view organizes execution by initialization, iterations, and return for traceability.",
    ),
  });
  blocks.push(...buildIterativeGroupedTimelineBlocks(representative.steps, i18n));

  return {
    id: "iterative-trace",
    title: i18n.traceTitle,
    blocks,
  };
}

function buildIterativeSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection | null {
  if (!isSectionAvailable(snapshot.iterative)) {
    const statusBlock = buildStatusBlock("iterative", snapshot.iterative, i18n);
    if (!statusBlock) return null;
    return {
      id: "iterative",
      title: i18n.iterativeTitle,
      blocks: [statusBlock],
    };
  }

  const data = snapshot.iterative.data;
  const blocks: DocumentBlock[] = [];
  const loopInvariantPayload = isSectionAvailable(data.loopInvariant)
    ? data.loopInvariant.data
    : null;
  const selectedLoop = asRecord(loopInvariantPayload?.selectedLoop);

  blocks.push(...buildIterativeInvariantBlocks(snapshot, data.loopInvariant, i18n));

  for (const caseName of CASE_ORDER) {
    const lineCosts = data.lineCostTable[caseName] || [];
    const summation = data.summations[caseName];
    const simplification = maybeList(data.simplificationSteps[caseName] || []);
    const asymptoticProcedure = maybeList(data.asymptoticProcedure[caseName] || []);
    const globalCase = snapshot.globalResult.cases[caseName];
    const caseTrace =
      isSectionAvailable(data.trace) && data.trace.data
        ? data.trace.data[caseName]
        : null;

    if (
      !lineCosts.length &&
      !summation &&
      simplification.length === 0 &&
      asymptoticProcedure.length === 0 &&
      !globalCase &&
      !caseTrace
    ) {
      continue;
    }

    blocks.push({
      kind: "paragraph",
      text: `${i18n.pedagogicalCaseTitle}: ${caseLabel(caseName, i18n)}.`,
    });

    if (lineCosts.length > 0) {
      blocks.push({
        kind: "paragraph",
        text: localize(
          i18n,
          "Costos por línea (sumatorias y procedimiento):",
          "Per-line costs (summations and procedure):",
        ),
      });
      blocks.push({ kind: "table", table: buildLineCostTable(lineCosts, i18n) });
    }

    if (summation) {
      blocks.push({
        kind: "formula",
        label: localize(
          i18n,
          `Suma final de costos (${caseLabel(caseName, i18n)})`,
          `Final cost sum (${caseLabel(caseName, i18n)})`,
        ),
        formula: summation,
      });
    }

    if (globalCase?.T_polynomial) {
      blocks.push({
        kind: "formula",
        label: localize(
          i18n,
          `Forma polinómica (${caseLabel(caseName, i18n)})`,
          `Polynomial form (${caseLabel(caseName, i18n)})`,
        ),
        formula: globalCase.T_polynomial,
      });
    }

    const finalComplexity =
      globalCase?.big_theta || globalCase?.big_o || globalCase?.big_omega || null;
    if (finalComplexity) {
      blocks.push({
        kind: "formula",
        label: `${i18n.pedagogicalFinalComplexityLabel} (${caseLabel(caseName, i18n)})`,
        formula: finalComplexity,
      });
    }

    if (simplification.length > 0) {
      blocks.push({ kind: "paragraph", text: i18n.pedagogicalSimplificationTitle });
      blocks.push({ kind: "list", items: simplification });
    }

    if (asymptoticProcedure.length > 0) {
      blocks.push({ kind: "paragraph", text: i18n.pedagogicalAsymptoticTitle });
      blocks.push({ kind: "list", items: asymptoticProcedure });
    }

    if (caseTrace?.steps && caseTrace.steps.length > 0) {
      const normalizedSteps = normalizeIterativeTraceSteps(caseTrace.steps);
      const relevantStateVariables = pickRelevantStateVariableNames(
        selectedLoop,
        normalizedSteps,
      );
      const lineCostByLine = buildLineCostMap(lineCosts);
      const executive = buildCaseTraceExecutiveItems(
        snapshot,
        normalizedSteps,
        selectedLoop,
        caseName,
        i18n,
      );
      blocks.push({
        kind: "paragraph",
        text: localize(i18n, "Seguimiento en 3 capas", "Trace in 3 layers"),
      });
      blocks.push({
        kind: "paragraph",
        text: localize(i18n, "Capa 1: Resumen ejecutivo", "Layer 1: Executive summary"),
      });
      blocks.push({ kind: "paragraph", text: executive.header });
      blocks.push({ kind: "list", items: executive.items });

      blocks.push({
        kind: "paragraph",
        text: localize(
          i18n,
          "Capa 2: Tabla cronológica pedagógica",
          "Layer 2: Pedagogical chronological table",
        ),
      });
      blocks.push({
        kind: "table",
        table: buildIterativeTraceTable(
          normalizedSteps,
          relevantStateVariables,
          lineCostByLine,
          i18n,
        ),
      });

      const groupedTimelineBlocks = buildIterativeGroupedTimelineBlocks(normalizedSteps, i18n);
      if (groupedTimelineBlocks.length > 0) {
        blocks.push({
          kind: "paragraph",
          text: localize(
            i18n,
            "Capa 3: Vista agrupada por estructura de control",
            "Layer 3: Control-structure grouped view",
          ),
        });
        blocks.push(...groupedTimelineBlocks);
      }
    } else {
      blocks.push({
        kind: "paragraph",
        text: localize(
          i18n,
          `Seguimiento de ejecución (${caseLabel(caseName, i18n)}): no disponible.`,
          `Execution trace (${caseLabel(caseName, i18n)}): not available.`,
        ),
      });
    }
  }

  if (!isSectionAvailable(data.trace)) {
    pushBlockIfPresent(blocks, buildStatusBlock("iterative.trace", data.trace, i18n));
  }

  blocks.push({
    kind: "paragraph",
    text: localize(
      i18n,
      "Comparación GPU/CPU y comparación con LLM: consulte la sección Análisis Comparativo.",
      "GPU/CPU and LLM comparisons: see Comparative Analysis section.",
    ),
  });

  if (blocks.length === 0) {
    return null;
  }

  return {
    id: "iterative",
    title: i18n.iterativeTitle,
    blocks,
  };
}

function buildMasterBlocks(
  detail: NonNullable<AnalyzeOpenResponse["totals"]["master"]>,
  i18n: ExportI18nBundle,
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [
    {
      kind: "paragraph",
      text: localize(
        i18n,
        "Aplicamos el Teorema Maestro comparando el término recursivo con el término no recursivo.",
        "We apply the Master Theorem by comparing the recursive term with the non-recursive term.",
      ),
    },
    {
      kind: "list",
      items: [
        `${localize(i18n, "Caso", "Case")}: ${safe(detail.case, "N/A")}`,
        `n^{log_b a}: ${safe(detail.nlogba, "N/A")}`,
        `${localize(i18n, "Comparación", "Comparison")}: ${safe(detail.comparison, "N/A")}`,
        `${localize(i18n, "Regularidad", "Regularity")}: ${safe(detail.regularity?.note, "N/A")}`,
      ],
    },
  ];

  if (detail.theta) {
    blocks.push({
      kind: "formula",
      label: i18n.pedagogicalFinalComplexityLabel,
      formula: detail.theta,
    });
  }

  return blocks;
}

function buildIterationBlocks(
  detail: NonNullable<AnalyzeOpenResponse["totals"]["iteration"]>,
  i18n: ExportI18nBundle,
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [
    {
      kind: "paragraph",
      text: localize(
        i18n,
        "Expandimos la recurrencia paso a paso hasta alcanzar el caso base.",
        "We expand the recurrence step by step until reaching the base case.",
      ),
    },
    {
      kind: "formula",
      label: "g(n)",
      formula: detail.g_function,
    },
    {
      kind: "formula",
      label: localize(i18n, "Forma general", "General form"),
      formula: detail.general_form,
    },
    {
      kind: "formula",
      label: localize(i18n, "Condición de caso base", "Base case condition"),
      formula: detail.base_case.condition,
    },
    {
      kind: "formula",
      label: localize(i18n, "Valor de k", "Value of k"),
      formula: detail.base_case.k,
    },
    {
      kind: "formula",
      label: localize(i18n, "Sumatoria", "Summation"),
      formula: detail.summation.expression,
    },
    {
      kind: "formula",
      label: localize(i18n, "Sumatoria evaluada", "Evaluated summation"),
      formula: detail.summation.evaluated,
    },
    {
      kind: "formula",
      label: i18n.pedagogicalFinalComplexityLabel,
      formula: detail.theta,
    },
  ];

  if (detail.expansions.length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Expansiones intermedias:", "Intermediate expansions:"),
    });
    blocks.push({ kind: "list", items: detail.expansions });
  }

  return blocks;
}

function buildRecursionTreeBlocks(
  detail: NonNullable<AnalyzeOpenResponse["totals"]["recursion_tree"]>,
  i18n: ExportI18nBundle,
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [
    {
      kind: "paragraph",
      text: localize(
        i18n,
        "Modelamos la recurrencia como árbol para estimar costo por nivel y costo total.",
        "We model the recurrence as a tree to estimate per-level and total cost.",
      ),
    },
    {
      kind: "formula",
      label: i18n.formulas.recurrenceTreeHeight,
      formula: detail.height,
    },
    {
      kind: "formula",
      label: i18n.formulas.recurrenceTreeSummation,
      formula: detail.summation.expression,
    },
    {
      kind: "formula",
      label: localize(i18n, "Sumatoria evaluada", "Evaluated summation"),
      formula: detail.summation.evaluated,
    },
    {
      kind: "formula",
      label: i18n.pedagogicalFinalComplexityLabel,
      formula: detail.theta,
    },
  ];

  if (detail.levels.length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Lectura por niveles del árbol:", "Tree levels interpretation:"),
    });

    blocks.push({
      kind: "list",
      items: detail.levels.map((level) =>
        localize(
          i18n,
          `Nivel ${level.level}: nodos ${level.num_nodes_latex}, tamaño subproblema ${level.subproblem_size_latex}, costo por nodo ${level.cost_per_node_latex}, costo total ${level.total_cost_latex}.`,
          `Level ${level.level}: nodes ${level.num_nodes_latex}, subproblem size ${level.subproblem_size_latex}, cost per node ${level.cost_per_node_latex}, total cost ${level.total_cost_latex}.`,
        ),
      ),
    });
  }

  blocks.push({
    kind: "paragraph",
    text: localize(
      i18n,
      `Nivel dominante: ${safe(detail.dominating_level.level, "N/A")}. Razón: ${normalizeDominantReasonText(safe(detail.dominating_level.reason, "N/A"))}.`,
      `Dominant level: ${safe(detail.dominating_level.level, "N/A")}. Reason: ${normalizeDominantReasonText(safe(detail.dominating_level.reason, "N/A"))}.`,
    ),
  });

  return blocks;
}

function buildCharacteristicBlocks(
  detail: NonNullable<AnalyzeOpenResponse["totals"]["characteristic_equation"]>,
  i18n: ExportI18nBundle,
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [
    {
      kind: "paragraph",
      text: localize(
        i18n,
        "Transformamos la recurrencia lineal en una ecuación característica y resolvemos sus raíces.",
        "We transform the linear recurrence into a characteristic equation and solve its roots.",
      ),
    },
    {
      kind: "formula",
      label: i18n.formulas.characteristicEquation,
      formula: detail.equation,
    },
    {
      kind: "formula",
      label: i18n.formulas.homogeneousSolution,
      formula: detail.homogeneous_solution,
    },
    {
      kind: "formula",
      label: i18n.formulas.closedForm,
      formula: detail.closed_form,
    },
    {
      kind: "formula",
      label: i18n.pedagogicalFinalComplexityLabel,
      formula: detail.theta,
    },
  ];

  if (detail.particular_solution) {
    blocks.push({
      kind: "formula",
      label: i18n.formulas.particularSolution,
      formula: detail.particular_solution,
    });
  }

  if (detail.general_solution) {
    blocks.push({
      kind: "formula",
      label: i18n.formulas.generalSolution,
      formula: detail.general_solution,
    });
  }

  if (detail.roots.length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Raíces encontradas:", "Computed roots:"),
    });
    blocks.push({
      kind: "table",
      table: {
        headers: i18n.headers.roots,
        rows: detail.roots.map((root) => [safe(root.root, "N/A"), String(root.multiplicity ?? "N/A")]),
        align: ["left", "center"],
      },
    });
  }

  if (detail.base_cases && Object.keys(detail.base_cases).length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Condiciones base usadas:", "Base conditions used:"),
    });
    blocks.push({
      kind: "list",
      items: Object.entries(detail.base_cases).map(([label, value]) => `${label}: ${String(value)}`),
    });
  }

  return blocks;
}

function buildRecursiveMethodBlocks(
  detail: SnapshotRecursiveMethodDetail,
  i18n: ExportI18nBundle,
): DocumentBlock[] {
  const blocks: DocumentBlock[] = [
    {
      kind: "paragraph",
      text: `${i18n.pedagogicalMethodDetails}: ${methodLabel(detail.method, i18n)}.`,
    },
  ];

  if (detail.method === "master") {
    blocks.push(...buildMasterBlocks(detail.detail, i18n));
    return blocks;
  }

  if (detail.method === "iteration") {
    blocks.push(...buildIterationBlocks(detail.detail, i18n));
    return blocks;
  }

  if (detail.method === "recursion_tree") {
    blocks.push(...buildRecursionTreeBlocks(detail.detail, i18n));
    return blocks;
  }

  blocks.push(...buildCharacteristicBlocks(detail.detail, i18n));
  return blocks;
}

function shouldIncludeIterative(snapshot: AalieAnalysisSnapshotV1): boolean {
  return snapshot.algorithmType === "iterative" || snapshot.algorithmType === "hybrid";
}

function shouldIncludeRecursive(snapshot: AalieAnalysisSnapshotV1): boolean {
  return snapshot.algorithmType === "recursive" || snapshot.algorithmType === "hybrid";
}

function buildRecursiveCallTraceSummary(
  trace:
    | Record<
        SnapshotCase,
        {
          steps: unknown[];
          summary?: {
            totalSteps?: number;
            totalCalls?: number;
            maxRecursionDepth?: number;
          };
          diagnostics?: {
            truncated?: boolean;
          };
        } | null
      >
    | undefined,
  i18n: ExportI18nBundle,
): string[] {
  if (!trace) return [];

  return CASE_ORDER.flatMap((caseName) => {
    const data = trace[caseName];
    if (!data) return [];

    const truncated = data.diagnostics?.truncated
      ? localize(i18n, "trazado truncado", "trace truncated")
      : localize(i18n, "trazado completo", "trace complete");

    return [
      localize(
        i18n,
        `${caseLabel(caseName, i18n)}: ${safe(data.summary?.totalSteps, "0")} pasos, ${safe(data.summary?.totalCalls, "0")} llamadas, profundidad máxima ${safe(data.summary?.maxRecursionDepth, "0")} (${truncated}).`,
        `${caseLabel(caseName, i18n)}: ${safe(data.summary?.totalSteps, "0")} steps, ${safe(data.summary?.totalCalls, "0")} calls, max depth ${safe(data.summary?.maxRecursionDepth, "0")} (${truncated}).`,
      ),
    ];
  });
}

function buildRecursiveStepExplanation(
  summary: string | undefined,
  conceptNote: string | undefined,
  i18n: ExportI18nBundle,
): string {
  const unwrapNarrativeMathFence = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
      const inner = trimmed.slice(2, -2).trim();
      if (/[A-Za-zÀ-ÿ]/.test(inner) && inner.includes(" ")) return inner;
      return trimmed;
    }
    if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 2) {
      const inner = trimmed.slice(1, -1).trim();
      if (/[A-Za-zÀ-ÿ]/.test(inner) && inner.includes(" ")) return inner;
      return trimmed;
    }
    return trimmed;
  };

  const summaryText = unwrapNarrativeMathFence(String(summary || ""));
  const conceptText = unwrapNarrativeMathFence(String(conceptNote || ""));
  if (summaryText && conceptText) return `${summaryText} ${conceptText}`;
  if (summaryText) return summaryText;
  if (conceptText) return conceptText;
  return i18n.pedagogicalNoData;
}

function normalizeExecutionTraceGraphPayload(
  traceCase:
    | {
        reportTraceGraph?: {
          graph?: {
            nodes?: Array<{
              id?: string;
              type?: string;
              position?: { x?: number; y?: number };
              data?: { label?: string; microseconds?: number; tokens?: number };
              parentId?: string;
            }>;
            edges?: Array<{
              id?: string;
              source?: string;
              target?: string;
              label?: string;
              type?: string;
            }>;
          };
          patternKind?: string;
          classification?: {
            patternKind?: string;
            confidence?: "high" | "medium" | "low";
            evidence?: string[];
          };
          summary?: {
            totalSteps?: number;
            totalCalls?: number;
            maxRecursionDepth?: number;
            algorithmKind?: string;
          };
          diagnostics?: {
            truncated?: boolean;
            truncationReason?: string;
            warnings?: string[];
          };
        };
        summary?: {
          totalCalls?: number;
          maxRecursionDepth?: number;
        };
        diagnostics?: {
          truncated?: boolean;
          truncationReason?: string;
          warnings?: string[];
        };
      }
    | null
    | undefined,
): DocumentExecutionTraceDiagram | null {
  const reportTrace = traceCase?.reportTraceGraph;
  const graph = reportTrace?.graph;
  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    return null;
  }

  const nodes = graph.nodes
    .map((node) => ({
      id: String(node?.id || "").trim(),
      type: String(node?.type || "default"),
      position: {
        x: typeof node?.position?.x === "number" ? node.position.x : 0,
        y: typeof node?.position?.y === "number" ? node.position.y : 0,
      },
      data: {
        label: String(node?.data?.label || "").trim(),
        microseconds: typeof node?.data?.microseconds === "number" ? node.data.microseconds : undefined,
        tokens: typeof node?.data?.tokens === "number" ? node.data.tokens : undefined,
      },
      parentId: typeof node?.parentId === "string" ? node.parentId : undefined,
    }))
    .filter((node) => node.id.length > 0);

  if (nodes.length === 0) {
    return null;
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = (Array.isArray(graph.edges) ? graph.edges : [])
    .map((edge, index) => ({
      id: String(edge?.id || `edge_${index}`),
      source: String(edge?.source || "").trim(),
      target: String(edge?.target || "").trim(),
      label: String(edge?.label || ""),
      type: String(edge?.type || "smoothstep"),
    }))
    .filter((edge) => edge.source.length > 0 && edge.target.length > 0)
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  const stats = {
    totalCalls:
      typeof reportTrace?.summary?.totalCalls === "number"
        ? reportTrace.summary.totalCalls
        : typeof traceCase?.summary?.totalCalls === "number"
          ? traceCase.summary.totalCalls
          : nodes.length,
    maxDepth:
      typeof reportTrace?.summary?.maxRecursionDepth === "number"
        ? reportTrace.summary.maxRecursionDepth
        : typeof traceCase?.summary?.maxRecursionDepth === "number"
          ? traceCase.summary.maxRecursionDepth
          : 0,
    truncated: Boolean(reportTrace?.diagnostics?.truncated || traceCase?.diagnostics?.truncated),
  };

  return {
    title: "Seguimiento de ejecución recursiva",
    caseName: "worst",
    graph: { nodes, edges },
    patternKind: reportTrace?.patternKind,
    classification: reportTrace?.classification,
    summary: reportTrace?.summary || traceCase?.summary,
    diagnostics: reportTrace?.diagnostics || traceCase?.diagnostics,
    stats,
    renderMode: "mermaid_and_vector_assets",
    assetBasename: "trace-diagram-worst",
    assetSvgPath: "assets/trace-diagram-worst.svg",
    assetPdfPath: "assets/trace-diagram-worst.pdf",
  };
}

function buildRecursiveWarnings(snapshot: AalieAnalysisSnapshotV1): string[] {
  const sectionWarning = isSectionAvailable(snapshot.recursive)
    ? snapshot.recursive.data.presentation?.warning
    : undefined;
  const metaWarnings = snapshot.meta.warnings.map((warning) => warning.message);
  const warnings = [sectionWarning, ...metaWarnings]
    .map((warning) => String(warning || "").trim())
    .filter((warning) => warning.length > 0);
  return Array.from(new Set(warnings));
}

function cleanSentence(value: string): string {
  return String(value || "")
    .trim()
    .replace(/\s{2,}/g, " ")
    .replace(/\.\.+/g, ".")
    .replace(/\s+\./g, ".");
}

function confidenceDescriptor(
  confidence: "high" | "medium" | "low",
  i18n: ExportI18nBundle,
): string {
  if (confidence === "high") {
    return localize(i18n, "señal fuerte", "strong signal");
  }
  if (confidence === "medium") {
    return localize(i18n, "señal moderada", "moderate signal");
  }
  return localize(i18n, "señal inicial", "early signal");
}

function explainPatternName(
  patternName: string,
  confidence: number,
  i18n: ExportI18nBundle,
): string {
  const pct = `${(confidence * 100).toFixed(0)}%`;
  const key = String(patternName || "").toLowerCase();
  if (key === "reduction") {
    return localize(
      i18n,
      `Se detectó un patrón de reducción/acumulación (${pct}): parte del trabajo puede reagruparse para ejecutar combinaciones en paralelo por bloques.`,
      `A reduction/accumulation pattern was detected (${pct}): part of the work can be regrouped to combine results in parallel blocks.`,
    );
  }
  if (key === "divide_conquer") {
    return localize(
      i18n,
      `Se detectó estructura divide y vencerás (${pct}): puede abrir oportunidades de paralelismo por subproblemas independientes.`,
      `A divide-and-conquer structure was detected (${pct}): it can open parallelism opportunities across independent subproblems.`,
    );
  }
  return localize(
    i18n,
    `Se detectó el patrón "${patternName}" (${pct}), útil como señal estructural para orientar la decisión hardware.`,
    `Pattern "${patternName}" was detected (${pct}), providing structural evidence to guide hardware decisions.`,
  );
}

function pedagogicalHardwareReason(raw: string, i18n: ExportI18nBundle): string {
  const cleaned = cleanSentence(raw);
  const lowered = cleaned.toLowerCase();

  if (lowered.includes("loop-carried dependency")) {
    return localize(
      i18n,
      "Cada iteración depende del resultado de la iteración anterior. Esa dependencia secuencial reduce el beneficio de paralelizar en GPU.",
      "Each iteration depends on the previous iteration result. This sequential dependency reduces the benefit of GPU parallelization.",
    );
  }

  if (lowered.includes("scalar reduction")) {
    return localize(
      i18n,
      "Se detecta una acumulación/reducción escalar: puede optimizarse con una reducción paralela en árbol por bloques.",
      "A scalar accumulation/reduction pattern is present: it can be optimized with a tree-style parallel reduction in blocks.",
    );
  }

  return cleaned;
}

function buildGpuCpuBlocks(
  gpuCpu: SnapshotGpuCpuComparative,
  i18n: ExportI18nBundle,
): DocumentBlock[] {
  const confidenceLabel = {
    high: localize(i18n, "Alta", "High"),
    medium: localize(i18n, "Media", "Medium"),
    low: localize(i18n, "Baja", "Low"),
  }[gpuCpu.confidence] ?? gpuCpu.confidence;
  const recommendationLabel = {
    cpu: "CPU",
    gpu: "GPU",
    hybrid: localize(i18n, "Híbrido", "Hybrid"),
  }[gpuCpu.primaryRecommendation] ?? gpuCpu.primaryRecommendation;

  const primaryNegative =
    gpuCpu.reasons.blockers[0] ||
    gpuCpu.reasons.negative[0] ||
    null;
  const primaryPositive = gpuCpu.reasons.positive[0] || null;
  const primaryOpportunity = gpuCpu.reasons.opportunities[0] || null;
  const topPattern = gpuCpu.detectedPatterns[0] || null;

  const narrativeParts = [
    ensureSentence(cleanSentence(gpuCpu.summary)),
    primaryNegative
      ? ensureSentence(
          localize(
            i18n,
            `La principal limitación observada fue: ${pedagogicalHardwareReason(primaryNegative, i18n)}`,
            `The main limitation observed was: ${pedagogicalHardwareReason(primaryNegative, i18n)}`,
          ),
        )
      : "",
    localize(
      i18n,
      `Con este patrón de ejecución, se recomienda priorizar ${recommendationLabel} para este algoritmo.`,
      `Given this execution pattern, ${recommendationLabel} is the recommended target for this algorithm.`,
    ),
    localize(
      i18n,
      gpuCpu.confidence === "low"
        ? "Aun así, la evidencia disponible es limitada y la recomendación debe tomarse con cautela."
        : gpuCpu.confidence === "medium"
          ? "La recomendación tiene señales consistentes, aunque todavía hay espacio para validación empírica."
          : "La recomendación está respaldada por señales fuertes y consistentes en la estructura del algoritmo.",
      gpuCpu.confidence === "low"
        ? "Still, available evidence is limited, so this recommendation should be treated with caution."
        : gpuCpu.confidence === "medium"
          ? "The recommendation is supported by consistent signals, though empirical validation is still advised."
          : "The recommendation is backed by strong, consistent structural signals.",
    ),
  ]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");

  const blocks: DocumentBlock[] = [
    {
      kind: "subsection",
      title: localize(i18n, "Análisis de Idoneidad Hardware (GPU vs CPU)", "Hardware Suitability Analysis (GPU vs CPU)"),
    },
    {
      kind: "emphasis",
      text: localize(
        i18n,
        `Recomendación principal: ${recommendationLabel} (confianza ${confidenceLabel.toLowerCase()}).`,
        `Primary recommendation: ${recommendationLabel} (confidence: ${confidenceLabel.toLowerCase()}).`,
      ),
    },
    {
      kind: "paragraph",
      text: narrativeParts,
    },
    {
      kind: "subsection",
      title: localize(i18n, "Lectura pedagógica", "Pedagogical interpretation"),
    },
  ];

  const interpretationItems: string[] = [];
  if (primaryPositive) {
    interpretationItems.push(
      localize(
        i18n,
        `Qué favorece esta recomendación: ${pedagogicalHardwareReason(primaryPositive, i18n)}`,
        `What supports this recommendation: ${pedagogicalHardwareReason(primaryPositive, i18n)}`,
      ),
    );
  }
  if (primaryNegative) {
    interpretationItems.push(
      localize(
        i18n,
        `Qué limita la alternativa opuesta: ${pedagogicalHardwareReason(primaryNegative, i18n)}`,
        `What limits the opposite alternative: ${pedagogicalHardwareReason(primaryNegative, i18n)}`,
      ),
    );
  }
  if (primaryOpportunity) {
    interpretationItems.push(
      localize(
        i18n,
        `Cómo mejorar: ${pedagogicalHardwareReason(primaryOpportunity, i18n)}`,
        `How to improve: ${pedagogicalHardwareReason(primaryOpportunity, i18n)}`,
      ),
    );
  }
  if (topPattern) {
    interpretationItems.push(
      localize(
        i18n,
        `${explainPatternName(topPattern.name, topPattern.confidence, i18n)} (${confidenceDescriptor(gpuCpu.confidence, i18n)}).`,
        `${explainPatternName(topPattern.name, topPattern.confidence, i18n)} (${confidenceDescriptor(gpuCpu.confidence, i18n)}).`,
      ),
    );
  }

  if (interpretationItems.length > 0) {
    blocks.push({ kind: "list", items: interpretationItems });
  }

  return blocks;
}

function buildRecursiveSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection | null {
  if (!isSectionAvailable(snapshot.recursive)) return null;

  const data = snapshot.recursive.data;
  const blocks: DocumentBlock[] = [];

  if (isSectionAvailable(data.recurrence)) {
    blocks.push({
      kind: "subsection",
      title: i18n.recurrenceLabel,
    });
    blocks.push({
      kind: "formula",
      formula: data.recurrence.data.form,
    });
  }

  if (isSectionAvailable(data.selectedMethod)) {
    blocks.push({
      kind: "subsection",
      title: localize(i18n, "Método seleccionado", "Selected method"),
    });
    blocks.push({
      kind: "centeredParagraph",
      text: methodLabel(data.selectedMethod.data, i18n),
    });
  }

  if (isSectionAvailable(data.methodsAvailable) && data.methodsAvailable.data.length > 0) {
    const recurrenceType = isSectionAvailable(data.recurrence)
      ? data.recurrence.data.type
      : undefined;
    const strategyFamily = recurrenceType === "divide_conquer" || recurrenceType === "divide_conquer_multi"
      ? localize(i18n, "Divide y Vencerás", "Divide y Conquer")
      : recurrenceType === "linear_shift"
        ? localize(i18n, "Resta y Vencerás / Resta y Serás Vencido", "Decrease and Conquer / Decrease and Get Defeated")
        : localize(i18n, "Familia no determinada", "Undetermined family");
    const recurrenceA = isSectionAvailable(data.recurrence) && "a" in data.recurrence.data
      ? Number(data.recurrence.data.a)
      : undefined;
    const selected = isSectionAvailable(data.selectedMethod)
      ? data.selectedMethod.data
      : data.methodsAvailable.data[0];
    const availableSet = new Set(data.methodsAvailable.data);
    const availableMethods = ALL_RECURSIVE_METHODS.filter((method) => availableSet.has(method));
    const unavailableMethods = ALL_RECURSIVE_METHODS.filter((method) => !availableSet.has(method));

    blocks.push({
      kind: "subsection",
      title: localize(i18n, "Métodos disponibles", "Available methods"),
    });
    blocks.push({
      kind: "emphasis",
      text: localize(
        i18n,
        `Método recomendado: ${methodLabel(selected, i18n)}.`,
        `Recommended method: ${methodLabel(selected, i18n)}.`,
      ),
    });
    blocks.push({
      kind: "paragraph",
      text: localize(
        i18n,
        `Familia de recurrencia detectada: ${strategyFamily}.`,
        `Detected recurrence family: ${strategyFamily}.`,
      ),
    });
    blocks.push({
      kind: "paragraph",
      text: localize(
        i18n,
        "Por qué sí aplican en este problema:",
        "Why they do apply to this problem:",
      ),
    });
    blocks.push({
      kind: "list",
      items: availableMethods.map((method) => {
        const precision = getMethodPrecision(method, recurrenceType, method === selected);
        const reason = getApplicableMethodReason(
          method,
          recurrenceType,
          method === selected,
          Number.isFinite(recurrenceA) ? recurrenceA : undefined,
          i18n,
        );
        return `${methodLabel(method, i18n)} (${localize(i18n, "precisión", "precision")} ${methodPrecisionLabel(precision, i18n)}): ${reason}`;
      }),
    });
    blocks.push({
      kind: "subsection",
      title: localize(i18n, "Métodos no disponibles", "Unavailable methods"),
    });
    blocks.push({
      kind: "paragraph",
      text: localize(
        i18n,
        "Por qué no convienen (o no aplican formalmente) en este caso:",
        "Why they are not advisable (or formally applicable) in this case:",
      ),
    });
    blocks.push({
      kind: "list",
      items:
        unavailableMethods.length > 0
          ? unavailableMethods.map((method) => {
              const reason = getNotApplicableMethodReason(method, recurrenceType, i18n);
              return `${methodLabel(method, i18n)}: ${reason}`;
            })
          : [localize(i18n, "No hay métodos descartados para este patrón.", "No methods were ruled out for this pattern.")],
    });
  }

  if (isSectionAvailable(data.stepByStep)) {
    const walkthrough = data.stepByStep.data;
    if (walkthrough && walkthrough.steps.length > 0) {
      blocks.push({
        kind: "subsection",
        title: localize(i18n, "Desarrollo paso a paso", "Step-by-step walkthrough"),
      });

      for (const step of walkthrough.steps) {
        blocks.push({
          kind: "pedagogicalStep",
          step: {
            index: step.index,
            title: step.title,
            status: step.status,
            formula: normalizeRecursiveFormula(step.math.primaryLatex),
            explanation: buildRecursiveStepExplanation(step.summary, step.conceptNote, i18n),
            warning: step.warning || undefined,
            supportReason: step.derivation?.supportReason || undefined,
          },
        });
      }
    }
  }

  if (isSectionAvailable(data.rootsAndMultiplicities) && data.rootsAndMultiplicities.data.length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Raíces y multiplicidades:", "Roots and multiplicities:"),
    });
    blocks.push({
      kind: "table",
      table: {
        headers: i18n.headers.roots,
        rows: data.rootsAndMultiplicities.data.map((item) => [
          safe(item.root, "N/A"),
          String(item.multiplicity ?? "N/A"),
        ]),
        align: ["left", "center"],
      },
    });
  }

  if (isSectionAvailable(data.closedForm)) {
    const hasStepByStepWalkthrough =
      isSectionAvailable(data.stepByStep) &&
      Array.isArray(data.stepByStep.data?.steps) &&
      data.stepByStep.data.steps.length > 0;
    const closedForm = data.closedForm.data;
    if (!hasStepByStepWalkthrough && closedForm.homogeneousSolution) {
      blocks.push({
        kind: "formula",
        label: i18n.formulas.homogeneousSolution,
        formula: closedForm.homogeneousSolution,
      });
    }
    if (!hasStepByStepWalkthrough && closedForm.particularSolution) {
      blocks.push({
        kind: "formula",
        label: i18n.formulas.particularSolution,
        formula: closedForm.particularSolution,
      });
    }
    if (!hasStepByStepWalkthrough && closedForm.generalSolution) {
      blocks.push({
        kind: "formula",
        label: i18n.formulas.generalSolution,
        formula: closedForm.generalSolution,
      });
    }
    if (!hasStepByStepWalkthrough && closedForm.closedForm) {
      blocks.push({
        kind: "formula",
        label: i18n.formulas.closedForm,
        formula: closedForm.closedForm,
      });
    }
    if (!hasStepByStepWalkthrough && closedForm.theta) {
      blocks.push({
        kind: "formula",
        label: i18n.pedagogicalFinalComplexityLabel,
        formula: closedForm.theta,
      });
    }
  }

  if (isSectionAvailable(data.callTrace)) {
    const traceItems = buildRecursiveCallTraceSummary(data.callTrace.data, i18n);
    if (traceItems.length > 0) {
      blocks.push({
        kind: "subsection",
        title: i18n.pedagogicalTraceTitle,
      });
      blocks.push({ kind: "list", items: traceItems });
    }

    const worstTrace = data.callTrace.data?.worst || null;
    const diagramPayload = normalizeExecutionTraceGraphPayload(worstTrace);
    if (diagramPayload) {
      blocks.push({
        kind: "subsection",
        title: localize(
          i18n,
          "Seguimiento de ejecución recursiva",
          "Recursive execution trace tracking",
        ),
      });
      blocks.push({
        kind: "executionTraceDiagram",
        diagram: {
          ...diagramPayload,
          title: localize(
            i18n,
            "Seguimiento de ejecución recursiva",
            "Recursive execution trace tracking",
          ),
        },
      });
    }
  }

  if (isSectionAvailable(snapshot.comparative.gpuCpu)) {
    blocks.push(...buildGpuCpuBlocks(snapshot.comparative.gpuCpu.data, i18n));
  }

  const warnings = buildRecursiveWarnings(snapshot);
  if (warnings.length > 0) {
    blocks.push({
      kind: "subsection",
      title: localize(i18n, "Advertencias", "Warnings"),
    });
    blocks.push({
      kind: "list",
      items: warnings,
    });
  }

  const thetaFromClosedForm = isSectionAvailable(data.closedForm) ? data.closedForm.data.theta : undefined;
  const finalTheta = thetaFromClosedForm || pickCaseComplexity(snapshot, "worst");
  if (finalTheta) {
    blocks.push({
      kind: "subsection",
      title: localize(i18n, "Conclusión asintótica", "Asymptotic conclusion"),
    });
    blocks.push({
      kind: "formula",
      label: i18n.pedagogicalFinalComplexityLabel,
      formula: finalTheta,
    });
  }

  if (blocks.length === 0) {
    return null;
  }

  return {
    id: "recursive",
    title: i18n.recursiveTitle,
    blocks,
  };
}

function buildComparativeSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
  options: { includeGpuCpu?: boolean } = {},
): DocumentSection | null {
  const blocks: DocumentBlock[] = [];
  const includeGpuCpu = options.includeGpuCpu ?? true;

  if (includeGpuCpu && isSectionAvailable(snapshot.comparative.gpuCpu)) {
    blocks.push(...buildGpuCpuBlocks(snapshot.comparative.gpuCpu.data, i18n));
  } else if (includeGpuCpu) {
    pushBlockIfPresent(blocks, buildStatusBlock("comparative.gpuCpu", snapshot.comparative.gpuCpu, i18n));
  }

  if (isSectionAvailable(snapshot.comparative.llm)) {
    const llmData = snapshot.comparative.llm.data;
    blocks.push({
      kind: "subsection",
      title: localize(i18n, "Comparación con LLM", "LLM comparison"),
    });

    if (llmData.normalized) {
      const normalized = llmData.normalized;
      const llmItems = maybeList([
        normalized.verdict
          ? `${localize(i18n, "Veredicto", "Verdict")}: ${normalized.verdict}`
          : null,
        typeof normalized.confidence === "number"
          ? `${localize(i18n, "Confianza", "Confidence")}: ${normalized.confidence}`
          : null,
        normalized.note
          ? `${localize(i18n, "Nota", "Note")}: ${normalized.note}`
          : null,
      ]);

      if (llmItems.length > 0) {
        blocks.push({ kind: "list", items: llmItems });
      }

      if (normalized.matches && normalized.matches.length > 0) {
        blocks.push({
          kind: "paragraph",
          text: localize(i18n, "Coincidencias principales:", "Main matches:"),
        });
        blocks.push({ kind: "list", items: normalized.matches });
      }

      if (normalized.differences && normalized.differences.length > 0) {
        blocks.push({
          kind: "paragraph",
          text: localize(i18n, "Diferencias principales:", "Main differences:"),
        });
        blocks.push({ kind: "list", items: normalized.differences });
      }
    } else {
      blocks.push({ kind: "paragraph", text: i18n.pedagogicalNoData });
    }
  } else {
    pushBlockIfPresent(blocks, buildStatusBlock("comparative.llm", snapshot.comparative.llm, i18n));
  }

  if (blocks.length === 0) {
    return null;
  }

  return {
    id: "comparative",
    title: i18n.comparativeTitle,
    blocks,
  };
}

function buildConclusionsSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection {
  if (snapshot.algorithmType === "iterative") {
    const items: string[] = [];
    const complexityItems = CASE_ORDER
      .map((caseName) => {
        const complexity = pickCaseComplexity(snapshot, caseName);
        return complexity ? `${caseLabel(caseName, i18n)}: ${complexity}` : null;
      })
      .filter((item): item is string => Boolean(item));
    if (complexityItems.length > 0) {
      items.push(...complexityItems);
    }

    const invariantAvailable =
      isSectionAvailable(snapshot.iterative) && isSectionAvailable(snapshot.iterative.data.loopInvariant);
    items.push(
      invariantAvailable
        ? localize(
            i18n,
            "El invariante del ciclo es consistente con la evolución del estado y respalda la corrección del recorrido.",
            "The loop invariant is consistent with state evolution and supports traversal correctness.",
          )
        : localize(
            i18n,
            "La validación del invariante quedó limitada por disponibilidad de datos.",
            "Invariant validation remained limited due to data availability.",
          ),
    );

    const traceAvailable =
      isSectionAvailable(snapshot.iterative) && isSectionAvailable(snapshot.iterative.data.trace);
    items.push(
      traceAvailable
        ? localize(
            i18n,
            "El seguimiento de ejecución mantiene trazabilidad completa mediante resumen, cronología y vista agrupada.",
            "Execution tracing preserves full traceability through summary, chronology, and grouped view.",
          )
        : localize(
            i18n,
            "No fue posible construir un seguimiento completo de ejecución para todos los casos.",
            "A full execution trace could not be built for all cases.",
          ),
    );

    if (isSectionAvailable(snapshot.comparative.gpuCpu)) {
      const hw = snapshot.comparative.gpuCpu.data;
      const recLabel = { cpu: "CPU", gpu: "GPU", hybrid: localize(i18n, "Híbrido", "Hybrid") }[hw.primaryRecommendation] ?? hw.primaryRecommendation;
      const confLabel = { high: localize(i18n, "alta", "high"), medium: localize(i18n, "media", "medium"), low: localize(i18n, "baja", "low") }[hw.confidence] ?? hw.confidence;
      items.push(
        localize(
          i18n,
          `Recomendación de hardware: ${recLabel} (confianza ${confLabel})`,
          `Hardware recommendation: ${recLabel} (confidence: ${confLabel})`,
        ),
      );
    }

    return {
      id: "conclusions",
      title: i18n.conclusionsTitle,
      blocks: items.length > 0 ? [{ kind: "list", items }] : [{ kind: "paragraph", text: i18n.pedagogicalNoData }],
    };
  }

  const items = CASE_ORDER
    .map((caseName) => {
      const complexity = pickCaseComplexity(snapshot, caseName);
      if (!complexity) return null;
      return `${caseLabel(caseName, i18n)}: ${complexity}`;
    })
    .filter((item): item is string => Boolean(item));

  if (snapshot.algorithmType === "hybrid") {
    const selectedMethod =
      isSectionAvailable(snapshot.recursive) && isSectionAvailable(snapshot.recursive.data.selectedMethod)
        ? snapshot.recursive.data.selectedMethod.data
        : null;

    items.push(
      localize(
        i18n,
        "El comportamiento híbrido se reporta sin duplicar narrativas: control iterativo + derivación recursiva formal.",
        "Hybrid behavior is reported without duplicated narratives: iterative control + formal recursive derivation.",
      ),
    );

    if (selectedMethod) {
      items.push(
        localize(
          i18n,
          `La conclusión principal se fundamenta en ${methodLabel(selectedMethod, i18n)} como método recursivo de referencia.`,
          `The main conclusion is grounded on ${methodLabel(selectedMethod, i18n)} as the reference recursive method.`,
        ),
      );
    }
  }

  if (snapshot.meta.warnings.length > 0) {
    items.push(
      localize(
        i18n,
        `Advertencias detectadas: ${snapshot.meta.warnings.length}.`,
        `Detected warnings: ${snapshot.meta.warnings.length}.`,
      ),
    );
  }

  return {
    id: "conclusions",
    title: i18n.conclusionsTitle,
    blocks: items.length > 0 ? [{ kind: "list", items }] : [{ kind: "paragraph", text: i18n.pedagogicalNoData }],
  };
}

export function buildDocumentModel(snapshot: AalieAnalysisSnapshotV1): DocumentModel {
  const i18n = getExportI18n(snapshot.locale);

  const institution: DocumentInstitutionInfo = {
    institutionLineA: i18n.institutionLineA,
    institutionLineB: i18n.institutionLineB,
    institutionLineC: i18n.institutionLineC,
    reportCode: `AALIE-EXP-${snapshot.snapshotId.slice(0, 8).toUpperCase()}`,
    reportVersion: `snapshot-${snapshot.schemaVersion}`,
    reportDate: parseDateForReport(snapshot.locale, snapshot.createdAt),
  };

  const sections: Array<DocumentSection | null> =
    snapshot.algorithmType === "iterative"
      ? [
          buildExecutiveSummarySection(snapshot, i18n),
          buildPseudocodeSection(snapshot, i18n),
          buildIterativeInvariantSection(snapshot, i18n),
          buildIterativeCaseAnalysisSection(snapshot, i18n),
          buildIterativeTraceSection(snapshot, i18n),
          buildComparativeSection(snapshot, i18n, { includeGpuCpu: true }),
          buildConclusionsSection(snapshot, i18n),
        ]
      : snapshot.algorithmType === "hybrid"
        ? [
            buildExecutiveSummarySection(snapshot, i18n),
            buildPseudocodeSection(snapshot, i18n),
            buildHybridProcessSection(snapshot, i18n),
            isSectionAvailable(snapshot.iterative) &&
            isSectionAvailable(snapshot.iterative.data.loopInvariant)
              ? buildIterativeInvariantSection(snapshot, i18n)
              : null,
            shouldIncludeRecursive(snapshot)
              ? buildRecursiveSection(snapshot, i18n)
              : shouldIncludeIterative(snapshot)
                ? buildIterativeSection(snapshot, i18n)
                : null,
            buildComparativeSection(snapshot, i18n, { includeGpuCpu: false }),
            buildConclusionsSection(snapshot, i18n),
          ]
        : [
            buildExecutiveSummarySection(snapshot, i18n),
            buildPseudocodeSection(snapshot, i18n),
            buildGlobalResultSection(snapshot, i18n),
            shouldIncludeIterative(snapshot) ? buildIterativeSection(snapshot, i18n) : null,
            shouldIncludeRecursive(snapshot) ? buildRecursiveSection(snapshot, i18n) : null,
            buildComparativeSection(snapshot, i18n, { includeGpuCpu: false }),
            buildConclusionsSection(snapshot, i18n),
          ];

  return {
    title: snapshot.meta.algorithm.name || i18n.documentTitle,
    locale: snapshot.locale,
    snapshotId: snapshot.snapshotId,
    contentHash: snapshot.contentHash,
    analysisId: snapshot.meta.analysisId,
    createdAt: snapshot.createdAt,
    disclaimer: snapshot.institutional.disclaimer,
    institution,
    sections: sections.filter((section): section is DocumentSection => Boolean(section)),
  };
}
