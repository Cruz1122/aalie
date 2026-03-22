import type {
  AalieAnalysisSnapshotV1,
  AnalyzeOpenResponse,
  LineCost,
  SnapshotCase,
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
}

export interface DocumentKeyValueEntry {
  label: string;
  value: string;
}

export interface DocumentBlockStatus {
  label: string;
  status: SnapshotSection<unknown>["status"];
  message?: string;
  todos?: string[];
}

export type DocumentBlock =
  | {
      kind: "paragraph";
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
      label: localize(i18n, "Nombre del algoritmo", "Algorithm name"),
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
  const blocks: DocumentBlock[] = [
    {
      kind: "paragraph",
      text:
        i18n.locale === "es"
          ? `Este reporte describe de forma pedagógica el análisis de ${snapshot.meta.algorithm.name}.`
          : `This report presents a pedagogical walkthrough of the analysis for ${snapshot.meta.algorithm.name}.`,
    },
    {
      kind: "paragraph",
      text:
        snapshot.meta.validity.parseOk && snapshot.meta.validity.analysisOk
          ? i18n.parseSummaryOk
          : i18n.parseSummaryIssues,
    },
  ];

  const availableCases = CASE_ORDER.filter((caseName) => Boolean(snapshot.globalResult.cases[caseName]));
  if (availableCases.length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(
        i18n,
        "Complejidad por caso (resumen):",
        "Complexity by case (summary):",
      ),
    });

    blocks.push({
      kind: "list",
      items: availableCases.map(
        (caseName) => `${caseLabel(caseName, i18n)}: ${pickCaseComplexity(snapshot, caseName) || i18n.notAvailable}`,
      ),
    });
  }

  const warningItems = maybeList([
    snapshot.meta.validity.parseOk ? null : "parseOk=false",
    snapshot.meta.validity.analysisOk ? null : "analysisOk=false",
    snapshot.meta.validity.traceOk ? null : "traceOk=false",
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
    title: i18n.pseudocodeTitle,
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

  for (const caseName of CASE_ORDER) {
    const result = snapshot.globalResult.cases[caseName];
    if (!result) continue;

    blocks.push({
      kind: "paragraph",
      text: `${i18n.pedagogicalCaseTitle}: ${caseLabel(caseName, i18n)}.`,
    });

    if (result.T_open) {
      blocks.push({
        kind: "formula",
        label: `${i18n.pedagogicalCostLabel} (${caseLabel(caseName, i18n)})`,
        formula: result.T_open,
      });
    }

    const asymptotic = result.big_theta || result.big_o || result.big_omega || result.T_polynomial;
    if (asymptotic) {
      blocks.push({
        kind: "formula",
        label: `${i18n.pedagogicalFinalComplexityLabel} (${caseLabel(caseName, i18n)})`,
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

function buildLineCostNarrative(line: LineCost, i18n: ExportI18nBundle): string {
  const lineLabel = localize(i18n, "Línea", "Line");
  const parts = maybeList([
    `${lineLabel} ${line.line}${line.kind ? ` (${line.kind})` : ""}`,
    line.ck ? `${localize(i18n, "costo base", "base cost")}: ${line.ck}` : null,
    line.count ? `${localize(i18n, "repeticiones", "repetitions")}: ${line.count}` : null,
    line.count_raw
      ? localize(
          i18n,
          "la sumatoria detallada se desarrolla en la expresion de costo",
          "the detailed summation is developed in the cost expression",
        )
      : null,
    line.note ? `${localize(i18n, "nota", "note")}: ${line.note}` : null,
  ]);

  return parts.join("; ");
}

function buildIterativeTraceSummary(
  trace:
    | Record<
        SnapshotCase,
        {
          steps: unknown[];
          summary?: {
            totalSteps?: number;
            totalCalls?: number;
            maxRecursionDepth?: number;
            algorithmKind?: string;
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

    const truncatedText = data.diagnostics?.truncated
      ? localize(i18n, "trazado truncado", "trace truncated")
      : localize(i18n, "trazado completo", "trace complete");

    return [
      localize(
        i18n,
        `${caseLabel(caseName, i18n)}: ${safe(data.summary?.totalSteps, "0")} pasos, ${safe(data.summary?.totalCalls, "0")} llamadas, profundidad máxima ${safe(data.summary?.maxRecursionDepth, "0")} (${truncatedText}).`,
        `${caseLabel(caseName, i18n)}: ${safe(data.summary?.totalSteps, "0")} steps, ${safe(data.summary?.totalCalls, "0")} calls, max depth ${safe(data.summary?.maxRecursionDepth, "0")} (${truncatedText}).`,
      ),
    ];
  });
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

  for (const caseName of CASE_ORDER) {
    const lineCosts = data.lineCostTable[caseName] || [];
    const summation = data.summations[caseName];
    const simplification = maybeList(data.simplificationSteps[caseName] || []);
    const asymptoticProcedure = maybeList(data.asymptoticProcedure[caseName] || []);

    if (!lineCosts.length && !summation && simplification.length === 0 && asymptoticProcedure.length === 0) {
      continue;
    }

    blocks.push({
      kind: "paragraph",
      text: localize(
        i18n,
        `Desarrollo del ${caseLabel(caseName, i18n).toLowerCase()}.`,
        `${caseLabel(caseName, i18n)} development.`,
      ),
    });

    if (lineCosts.length > 0) {
      blocks.push({
        kind: "paragraph",
        text: i18n.pedagogicalLineCostTitle,
      });
      blocks.push({ kind: "list", items: lineCosts.map((line) => buildLineCostNarrative(line, i18n)) });
    }

    if (summation) {
      blocks.push({
        kind: "formula",
        label: `${i18n.pedagogicalCostLabel} (${caseLabel(caseName, i18n)})`,
        formula: summation,
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
  }

  if (isSectionAvailable(data.trace)) {
    const traceItems = buildIterativeTraceSummary(data.trace.data, i18n);
    if (traceItems.length > 0) {
      blocks.push({ kind: "paragraph", text: i18n.pedagogicalTraceTitle });
      blocks.push({ kind: "list", items: traceItems });
    }
  } else {
    pushBlockIfPresent(blocks, buildStatusBlock("iterative.trace", data.trace, i18n));
  }

  pushBlockIfPresent(blocks, buildStatusBlock("iterative.loopInvariant", data.loopInvariant, i18n));

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
      `Nivel dominante: ${safe(detail.dominating_level.level, "N/A")}. Razón: ${safe(detail.dominating_level.reason, "N/A")}.`,
      `Dominant level: ${safe(detail.dominating_level.level, "N/A")}. Reason: ${safe(detail.dominating_level.reason, "N/A")}.`,
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
      kind: "list",
      items: detail.roots.map(
        (root) =>
          `${localize(i18n, "raíz", "root")}: ${root.root}; ${localize(i18n, "multiplicidad", "multiplicity")}: ${root.multiplicity}`,
      ),
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

function buildRecursiveSection(
  snapshot: AalieAnalysisSnapshotV1,
  i18n: ExportI18nBundle,
): DocumentSection | null {
  if (!isSectionAvailable(snapshot.recursive)) {
    const statusBlock = buildStatusBlock("recursive", snapshot.recursive, i18n);
    if (!statusBlock) return null;
    return {
      id: "recursive",
      title: i18n.recursiveTitle,
      blocks: [statusBlock],
    };
  }

  const data = snapshot.recursive.data;
  const blocks: DocumentBlock[] = [];

  pushBlockIfPresent(blocks, buildStatusBlock("recursive.recurrence", data.recurrence, i18n));
  if (isSectionAvailable(data.recurrence)) {
    blocks.push({
      kind: "formula",
      label: i18n.recurrenceLabel,
      formula: data.recurrence.data.form,
    });
  }

  pushBlockIfPresent(blocks, buildStatusBlock("recursive.selectedMethod", data.selectedMethod, i18n));
  if (isSectionAvailable(data.selectedMethod)) {
    blocks.push({
      kind: "paragraph",
      text: `${i18n.selectedMethodLabel}: ${methodLabel(data.selectedMethod.data, i18n)}`,
    });
  }

  pushBlockIfPresent(blocks, buildStatusBlock("recursive.methodsAvailable", data.methodsAvailable, i18n));
  if (isSectionAvailable(data.methodsAvailable) && data.methodsAvailable.data.length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Métodos disponibles para este caso:", "Available methods for this case:"),
    });
    blocks.push({
      kind: "list",
      items: data.methodsAvailable.data.map((method) => methodLabel(method, i18n)),
    });
  }

  pushBlockIfPresent(blocks, buildStatusBlock("recursive.methodDetails", data.methodDetails, i18n));
  if (isSectionAvailable(data.methodDetails)) {
    for (const detail of data.methodDetails.data) {
      blocks.push(...buildRecursiveMethodBlocks(detail, i18n));
    }
  }

  if (isSectionAvailable(data.rootsAndMultiplicities) && data.rootsAndMultiplicities.data.length > 0) {
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Raíces y multiplicidades:", "Roots and multiplicities:"),
    });
    blocks.push({
      kind: "list",
      items: data.rootsAndMultiplicities.data.map(
        (item) =>
          `${localize(i18n, "raíz", "root")}: ${item.root}; ${localize(i18n, "multiplicidad", "multiplicity")}: ${item.multiplicity}`,
      ),
    });
  } else {
    pushBlockIfPresent(
      blocks,
      buildStatusBlock("recursive.rootsAndMultiplicities", data.rootsAndMultiplicities, i18n),
    );
  }

  if (isSectionAvailable(data.closedForm)) {
    const closedForm = data.closedForm.data;
    if (closedForm.homogeneousSolution) {
      blocks.push({
        kind: "formula",
        label: i18n.formulas.homogeneousSolution,
        formula: closedForm.homogeneousSolution,
      });
    }
    if (closedForm.particularSolution) {
      blocks.push({
        kind: "formula",
        label: i18n.formulas.particularSolution,
        formula: closedForm.particularSolution,
      });
    }
    if (closedForm.generalSolution) {
      blocks.push({
        kind: "formula",
        label: i18n.formulas.generalSolution,
        formula: closedForm.generalSolution,
      });
    }
    if (closedForm.closedForm) {
      blocks.push({
        kind: "formula",
        label: i18n.formulas.closedForm,
        formula: closedForm.closedForm,
      });
    }
    if (closedForm.theta) {
      blocks.push({
        kind: "formula",
        label: i18n.pedagogicalFinalComplexityLabel,
        formula: closedForm.theta,
      });
    }
  } else {
    pushBlockIfPresent(blocks, buildStatusBlock("recursive.closedForm", data.closedForm, i18n));
  }

  pushBlockIfPresent(
    blocks,
    buildStatusBlock("recursive.recursionTreeSerializable", data.recursionTreeSerializable, i18n),
  );

  if (isSectionAvailable(data.callTrace)) {
    const traceItems = buildRecursiveCallTraceSummary(data.callTrace.data, i18n);
    if (traceItems.length > 0) {
      blocks.push({ kind: "paragraph", text: i18n.pedagogicalTraceTitle });
      blocks.push({ kind: "list", items: traceItems });
    }
  } else {
    pushBlockIfPresent(blocks, buildStatusBlock("recursive.callTrace", data.callTrace, i18n));
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
): DocumentSection | null {
  const blocks: DocumentBlock[] = [];

  if (isSectionAvailable(snapshot.comparative.llm)) {
    const llmData = snapshot.comparative.llm.data;
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Comparación con LLM:", "LLM comparison:"),
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
          text: localize(i18n, "Coincidencias:", "Matches:"),
        });
        blocks.push({ kind: "list", items: normalized.matches });
      }

      if (normalized.differences && normalized.differences.length > 0) {
        blocks.push({
          kind: "paragraph",
          text: localize(i18n, "Diferencias:", "Differences:"),
        });
        blocks.push({ kind: "list", items: normalized.differences });
      }
    } else {
      blocks.push({
        kind: "paragraph",
        text: i18n.pedagogicalNoData,
      });
    }
  } else {
    pushBlockIfPresent(blocks, buildStatusBlock("comparative.llm", snapshot.comparative.llm, i18n));
  }

  if (isSectionAvailable(snapshot.comparative.gpuCpu)) {
    const gpuCpu = snapshot.comparative.gpuCpu.data;
    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Análisis GPU vs CPU:", "GPU vs CPU analysis:"),
    });
    blocks.push({
      kind: "list",
      items: [
        `${localize(i18n, "Perfil recomendado", "Recommended profile")}: ${gpuCpu.profile}`,
        `${localize(i18n, "Resumen", "Summary")}: ${gpuCpu.summary}`,
        `${localize(i18n, "Recomendación", "Recommendation")}: ${gpuCpu.recommendation}`,
        `${localize(i18n, "Puntaje GPU", "GPU score")}: ${String(gpuCpu.gpuScore)}`,
        `${localize(i18n, "Puntaje CPU", "CPU score")}: ${String(gpuCpu.cpuScore)}`,
      ],
    });

    blocks.push({ kind: "paragraph", text: gpuCpu.explanation });

    blocks.push({
      kind: "paragraph",
      text: localize(i18n, "Métricas de soporte:", "Supporting metrics:"),
    });

    blocks.push({
      kind: "list",
      items: [
        `${localize(i18n, "Total de ciclos", "Total loops")}: ${String(gpuCpu.metrics.totalLoops)}`,
        `${localize(i18n, "Profundidad máxima de ciclos", "Maximum loop depth")}: ${String(gpuCpu.metrics.maxLoopDepth)}`,
        `${localize(i18n, "Condicionales en ciclos", "Conditionals in loops")}: ${String(gpuCpu.metrics.conditionalsInLoops)}`,
        `${localize(i18n, "Es recursivo", "Is recursive")}: ${String(gpuCpu.metrics.isRecursive)}`,
        `${localize(i18n, "Cantidad de llamadas recursivas", "Recursive call count")}: ${String(gpuCpu.metrics.recursiveCallCount)}`,
        `${localize(i18n, "Accesos a arreglos", "Array access count")}: ${String(gpuCpu.metrics.arrayAccessCount)}`,
        `${localize(i18n, "Llamadas dentro de ciclos", "Calls inside loops")}: ${String(gpuCpu.metrics.callsInsideLoops)}`,
      ],
    });
  } else {
    pushBlockIfPresent(blocks, buildStatusBlock("comparative.gpuCpu", snapshot.comparative.gpuCpu, i18n));
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
  const items = CASE_ORDER
    .map((caseName) => {
      const complexity = pickCaseComplexity(snapshot, caseName);
      if (!complexity) return null;
      return `${caseLabel(caseName, i18n)}: ${complexity}`;
    })
    .filter((item): item is string => Boolean(item));

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

  const sections: Array<DocumentSection | null> = [
    buildMetadataSection(snapshot, i18n),
    buildExecutiveSummarySection(snapshot, i18n),
    buildPseudocodeSection(snapshot, i18n),
    buildParsingSection(snapshot, i18n),
    buildGlobalResultSection(snapshot, i18n),
    shouldIncludeIterative(snapshot) ? buildIterativeSection(snapshot, i18n) : null,
    shouldIncludeRecursive(snapshot) ? buildRecursiveSection(snapshot, i18n) : null,
    buildComparativeSection(snapshot, i18n),
    buildConclusionsSection(snapshot, i18n),
  ];

  return {
    title: i18n.documentTitle,
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
