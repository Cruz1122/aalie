import { createHash, randomUUID } from "node:crypto";

import type {
  AalieAnalysisSnapshotV1,
  AnalyzeOpenResponse,
  LoopInvariant,
  Program,
  RecursiveMethodStepBundle,
  SnapshotReportTraceGraph,
  SnapshotCase,
  SnapshotGpuCpuComparative,
  SnapshotLlmComparative,
  SnapshotRecursiveMethod,
  SnapshotWarning,
} from "@aa/types";
import {
  SNAPSHOT_SCHEMA_VERSION,
} from "@aa/types";

import {
  DEFAULT_GENERAL_LIMITATIONS_EN,
  DEFAULT_GENERAL_LIMITATIONS_ES,
  DEFAULT_SOURCE_ORIGIN,
  INSTITUTIONAL_DISCLAIMER_TEXT,
  SNAPSHOT_NOT_IMPLEMENTED_TODOS,
} from "./constants";
import { createSection, markNotImplemented } from "./section-status";
import {
  normalizeLocale,
  normalizeRecurrence,
  resolveSameAsWorst,
  stripUndefinedDeep,
} from "./snapshot-normalizers";

export interface ParseResponseLike {
  ok: boolean;
  available?: boolean;
  runtime?: string;
  error?: string;
  ast?: Program;
  errors?: Array<{ line: number; column: number; message: string }>;
}

export interface AnalyzeAllResponseLike {
  ok: boolean;
  has_case_variability?: boolean;
  loopInvariant?: LoopInvariant | null;
  worst?: AnalyzeOpenResponse | null;
  best?: AnalyzeOpenResponse | "same_as_worst" | null;
  avg?: AnalyzeOpenResponse | "same_as_worst" | null;
  errors?: Array<{ message: string; line?: number; column?: number }>;
}

export interface DetectMethodsResponseLike {
  ok: boolean;
  applicable_methods?: SnapshotRecursiveMethod[];
  default_method?: SnapshotRecursiveMethod;
  recurrence_info?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

export interface TraceResponseLike {
  ok: boolean;
  algorithmKind?: string;
  derived?: {
    structuredTrace?: {
      patternKind?: string;
      graph?: {
        nodes?: Array<{
          id: string;
          type: string;
          position?: { x?: number; y?: number };
          data?: {
            label?: string;
            microseconds?: number;
            tokens?: number;
            [key: string]: unknown;
          };
          parentId?: string;
        }>;
        edges?: Array<{
          id: string;
          source: string;
          target: string;
          label?: string;
          type?: string;
        }>;
      };
      classification?: {
        patternKind?: string;
        confidence?: "high" | "medium" | "low";
        evidence?: string[];
      };
    };
  };
  trace?: {
    kind?: "iterative" | "recursive" | "hybrid" | "unknown";
    steps?: unknown[];
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
    callTreeSource?: unknown;
    recursionTree?: unknown;
  };
  errors?: Array<{ message: string }>;
}

export interface BuildSnapshotInput {
  source: string;
  locale?: string;
  sourceOrigin?: "editor" | "example" | "chatbot" | "txt" | "api";
  analysisId?: string;
  snapshotId?: string;
  createdAt?: string;
  parse?: ParseResponseLike | null;
  classify?: { kind?: string; method?: string } | null;
  analyze?: AnalyzeAllResponseLike | null;
  detectMethods?: DetectMethodsResponseLike | null;
  traceByCase?: Partial<Record<SnapshotCase, TraceResponseLike | null>>;
  llm?: SnapshotLlmComparative | null;
  gpuCpu?: SnapshotGpuCpuComparative | null;
}

type CallTreeLike = {
  calls?: unknown[];
  root_calls?: unknown[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeTraceGraphFromStructured(trace: TraceResponseLike): SnapshotReportTraceGraph | null {
  const structured = trace.derived?.structuredTrace;
  const graph = structured?.graph;
  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    return null;
  }

  const nodes = graph.nodes
    .map((node) => {
      const id = String(node?.id || "").trim();
      if (!id) return null;
      return {
        id,
        type: String(node?.type || "default"),
        position: {
          x: asNumber(node?.position?.x, 0),
          y: asNumber(node?.position?.y, 0),
        },
        data: {
          label: String(node?.data?.label || id),
          microseconds: typeof node?.data?.microseconds === "number" ? node.data.microseconds : undefined,
          tokens: typeof node?.data?.tokens === "number" ? node.data.tokens : undefined,
        },
        parentId: typeof node?.parentId === "string" ? node.parentId : undefined,
      };
    })
    .filter(Boolean) as SnapshotReportTraceGraph["graph"]["nodes"];

  if (nodes.length === 0) {
    return null;
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = (Array.isArray(graph.edges) ? graph.edges : [])
    .map((edge, index) => {
      const source = String(edge?.source || "").trim();
      const target = String(edge?.target || "").trim();
      if (!source || !target || !nodeIds.has(source) || !nodeIds.has(target)) {
        return null;
      }
      return {
        id: String(edge?.id || `edge_${index}`),
        source,
        target,
        label: String(edge?.label || ""),
        type: String(edge?.type || "smoothstep"),
      };
    })
    .filter(Boolean) as SnapshotReportTraceGraph["graph"]["edges"];

  return {
    graph: { nodes, edges },
    patternKind: structured?.patternKind,
    classification: structured?.classification
      ? {
          patternKind: structured.classification.patternKind,
          confidence: structured.classification.confidence,
          evidence: structured.classification.evidence || [],
        }
      : undefined,
    summary: trace.trace?.summary,
    diagnostics: trace.trace?.diagnostics,
  };
}

function normalizeTraceGraphFromCallTree(trace: TraceResponseLike): SnapshotReportTraceGraph | null {
  const callTreeRaw = (trace.trace?.callTreeSource || trace.trace?.recursionTree) as CallTreeLike | undefined;
  if (!callTreeRaw || !Array.isArray(callTreeRaw.calls) || callTreeRaw.calls.length === 0) {
    return null;
  }

  const calls = callTreeRaw.calls
    .map((item) => asRecord(item))
    .filter(Boolean) as Record<string, unknown>[];

  if (calls.length === 0) return null;

  const nodes = calls.map((call) => {
    const id = String(call.id || "");
    const fn = String(call.function_name || call.functionName || call.procedure || "call");
    const depth = asNumber(call.depth, 0);
    const params = asRecord(call.params) || {};
    const ret = typeof call.return_value === "undefined" ? undefined : call.return_value;
    const paramsStr = Object.keys(params).length > 0
      ? Object.entries(params).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(", ")
      : "";
    const label = paramsStr ? `${fn}(${paramsStr})` : `${fn}(...)`;
    const returnLine = typeof ret !== "undefined" ? `\n→ ${JSON.stringify(ret)}` : "";

    return {
      id,
      type: "default",
      position: { x: depth * 240, y: 0 },
      data: {
        label: `${label}${returnLine}`,
      },
      parentId: typeof call.parent_id === "string" ? call.parent_id : undefined,
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: SnapshotReportTraceGraph["graph"]["edges"] = [];

  for (const call of calls) {
    const parent = String(call.id || "").trim();
    if (!parent || !nodeIds.has(parent)) continue;
    const children = Array.isArray(call.children) ? call.children : [];
    for (const childId of children) {
      const child = String(childId || "").trim();
      if (!child || !nodeIds.has(child)) continue;
      edges.push({
        id: `edge_${parent}_${child}`,
        source: parent,
        target: child,
        label: "",
        type: "smoothstep",
      });
    }
  }

  return {
    graph: { nodes, edges },
    patternKind: "generic_recursive",
    classification: {
      patternKind: "generic_recursive",
      confidence: "low",
      evidence: ["fallback_from_call_tree_source"],
    },
    summary: trace.trace?.summary,
    diagnostics: trace.trace?.diagnostics,
  };
}

function resolveReportTraceGraph(trace: TraceResponseLike | null | undefined): SnapshotReportTraceGraph | undefined {
  if (!trace || !trace.ok) return undefined;
  return normalizeTraceGraphFromStructured(trace) || normalizeTraceGraphFromCallTree(trace) || undefined;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`);
  return `{${entries.join(",")}}`;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
  }
  return value;
}

function extractAlgorithmFromAst(ast: Program | undefined): { name: string; parameters: string[] } {
  const proc = ast?.body?.find(
    (node): node is Program["body"][number] & { type: "ProcDef"; name: string; params?: Array<{ name?: string }> } =>
      Boolean(node && typeof node === "object" && (node as { type?: string }).type === "ProcDef"),
  ) as ({ name?: string; params?: Array<{ name?: string }> } | undefined);

  const name = proc?.name || "UnknownProcedure";
  const parameters = Array.isArray(proc?.params)
    ? proc.params
        .map((param) => String(param?.name || "").trim())
        .filter(Boolean)
    : [];

  return { name, parameters };
}

function pickFirstAvailableCase(
  cases: Record<SnapshotCase, AnalyzeOpenResponse | null>,
): AnalyzeOpenResponse | null {
  return cases.worst || cases.best || cases.avg || null;
}

function buildCaseResult(caseName: SnapshotCase, data: AnalyzeOpenResponse | null) {
  if (!data?.ok) return null;
  return {
    case: caseName,
    T_open: data.totals?.T_open,
    T_polynomial: data.totals?.T_polynomial,
    big_o: data.totals?.big_o,
    big_omega: data.totals?.big_omega,
    big_theta: data.totals?.big_theta,
    explanationSteps: data.totals?.procedure || [],
    raw: data,
  };
}

function collectWarnings(input: BuildSnapshotInput): SnapshotWarning[] {
  const warnings: SnapshotWarning[] = [];

  if (input.parse && !input.parse.ok) {
    warnings.push({
      code: "PARSE_FAILED",
      message: input.parse.error || "Parsing failed",
      severity: "critical",
      source: "parse",
    });
  }

  if (input.analyze && !input.analyze.ok) {
    warnings.push({
      code: "ANALYSIS_FAILED",
      message: input.analyze.errors?.[0]?.message || "Analysis failed",
      severity: "critical",
      source: "analysis",
    });
  }

  for (const [caseName, trace] of Object.entries(input.traceByCase || {})) {
    if (!trace || !trace.ok) {
      warnings.push({
        code: `TRACE_FAILED_${caseName.toUpperCase()}`,
        message: trace?.errors?.[0]?.message || `Trace unavailable for ${caseName}`,
        severity: "warning",
        source: "trace",
      });
      continue;
    }

    if (trace.trace?.diagnostics?.truncated) {
      warnings.push({
        code: `TRACE_TRUNCATED_${caseName.toUpperCase()}`,
        message:
          trace.trace.diagnostics.truncationReason
            ? `Trace truncated (${trace.trace.diagnostics.truncationReason}) for ${caseName}`
            : `Trace truncated for ${caseName}`,
        severity: "warning",
        source: "trace",
      });
    }
  }

  return warnings;
}

function inferAlgorithmType(input: BuildSnapshotInput): AalieAnalysisSnapshotV1["algorithmType"] {
  const kind = String(input.classify?.kind || "").toLowerCase();
  if (kind === "iterative" || kind === "recursive" || kind === "hybrid" || kind === "dummy") {
    return kind;
  }

  const worst = input.analyze?.worst;
  if (worst?.ok && worst.totals?.recurrence) {
    return "recursive";
  }

  return "unknown";
}

function buildRecursivePresentation(stepByStep: RecursiveMethodStepBundle | null | undefined): {
  summary?: string;
  conceptNote?: string;
  warning?: string;
  supportReason?: string;
  renderHints: {
    stepExplanationStyle: "italic";
    latexExplanationSize: "footnotesize";
    markdownExplanationStyle: "italic";
  };
} | undefined {
  if (!stepByStep || !Array.isArray(stepByStep.steps) || stepByStep.steps.length === 0) {
    return undefined;
  }

  const firstStep = stepByStep.steps[0];
  const firstSummary = firstStep?.summary?.trim();
  const firstConceptNote = firstStep?.conceptNote?.trim();
  const warningFromSteps = stepByStep.steps.find((step) => step.warning)?.warning?.trim();
  const supportReason = stepByStep.steps.find((step) => step.derivation?.supportReason)
    ?.derivation?.supportReason?.trim();

  return {
    summary: firstSummary || undefined,
    conceptNote: firstConceptNote || undefined,
    warning: warningFromSteps || undefined,
    supportReason: supportReason || undefined,
    renderHints: {
      stepExplanationStyle: "italic",
      latexExplanationSize: "footnotesize",
      markdownExplanationStyle: "italic",
    },
  };
}

export function buildSnapshot(input: BuildSnapshotInput): AalieAnalysisSnapshotV1 {
  const locale = normalizeLocale(input.locale);
  const analysisId = input.analysisId || randomUUID();
  const createdAt = input.createdAt || new Date().toISOString();
  const snapshotId = input.snapshotId || randomUUID();

  const parseAst = input.parse?.ok ? input.parse.ast : undefined;
  const algorithmInfo = extractAlgorithmFromAst(parseAst);

  const normalizedCases = resolveSameAsWorst({
    worst: input.analyze?.worst || null,
    best: input.analyze?.best || null,
    avg: input.analyze?.avg || null,
  });

  const selectedCase = pickFirstAvailableCase(normalizedCases);
  const loopInvariant = input.analyze?.loopInvariant || selectedCase?.loopInvariant || null;
  const normalizedRecurrence = normalizeRecurrence(selectedCase?.totals?.recurrence);

  const methodDetails = [
    selectedCase?.totals?.characteristic_equation
      ? {
          method: "characteristic_equation" as const,
          detail: selectedCase.totals.characteristic_equation,
        }
      : null,
    selectedCase?.totals?.iteration
      ? {
          method: "iteration" as const,
          detail: selectedCase.totals.iteration,
        }
      : null,
    selectedCase?.totals?.recursion_tree
      ? {
          method: "recursion_tree" as const,
          detail: selectedCase.totals.recursion_tree,
        }
      : null,
    selectedCase?.totals?.master
      ? {
          method: "master" as const,
          detail: selectedCase.totals.master,
        }
      : null,
  ].filter(Boolean);

  const selectedStepByStep =
    normalizedRecurrence?.method === "iteration"
      ? selectedCase?.totals?.iteration?.step_by_step ||
        selectedCase?.totals?.characteristic_equation?.step_by_step
      : normalizedRecurrence?.method === "characteristic_equation"
        ? selectedCase?.totals?.characteristic_equation?.step_by_step ||
          selectedCase?.totals?.iteration?.step_by_step
        : normalizedRecurrence?.method === "recursion_tree"
          ? selectedCase?.totals?.recursion_tree?.step_by_step ||
            selectedCase?.totals?.master?.step_by_step ||
            selectedCase?.totals?.characteristic_equation?.step_by_step ||
            selectedCase?.totals?.iteration?.step_by_step
        : normalizedRecurrence?.method === "master"
          ? selectedCase?.totals?.master?.step_by_step ||
            selectedCase?.totals?.characteristic_equation?.step_by_step ||
            selectedCase?.totals?.iteration?.step_by_step
        : selectedCase?.totals?.characteristic_equation?.step_by_step ||
          selectedCase?.totals?.iteration?.step_by_step ||
          selectedCase?.totals?.master?.step_by_step ||
          selectedCase?.totals?.recursion_tree?.step_by_step;
  const recursivePresentation = buildRecursivePresentation(selectedStepByStep);

  const methodsApplied = [
    normalizedRecurrence?.method,
    ...methodDetails.map((detail) => detail?.method),
  ].filter((value): value is SnapshotRecursiveMethod => Boolean(value));

  const methodsAvailable = input.detectMethods?.ok
    ? input.detectMethods.applicable_methods || methodsApplied
    : methodsApplied;

  const warnings = collectWarnings(input);
  const traceSummaryData = (Object.entries(input.traceByCase || {})
    .map(([caseName, trace]) => {
      if (!trace) return null;
      return {
        case: caseName as SnapshotCase,
        kind: trace.trace?.kind || (trace.algorithmKind as "iterative" | "recursive" | "hybrid" | "unknown"),
        totalSteps: trace.trace?.summary?.totalSteps,
        totalCalls: trace.trace?.summary?.totalCalls,
        maxRecursionDepth: trace.trace?.summary?.maxRecursionDepth,
        truncated: trace.trace?.diagnostics?.truncated,
        warnings: trace.trace?.diagnostics?.warnings || [],
      };
    })
    .filter(Boolean) as Array<{
    case: SnapshotCase;
    kind?: "iterative" | "recursive" | "hybrid" | "unknown";
    totalSteps?: number;
    totalCalls?: number;
    maxRecursionDepth?: number;
    truncated?: boolean;
    warnings?: string[];
  }>);

  const algorithmType = inferAlgorithmType(input);

  const snapshotWithoutHash = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    snapshotId,
    createdAt,
    locale,
    algorithmType,
    meta: {
      analysisId,
      sourceOrigin: input.sourceOrigin || DEFAULT_SOURCE_ORIGIN,
      algorithm: algorithmInfo,
      algorithmTypeDetected: algorithmType,
      methodsApplied,
      methodsAvailable,
      hasCaseVariability: Boolean(input.analyze?.has_case_variability),
      validity: {
        parseOk: Boolean(input.parse?.ok),
        analysisOk: Boolean(input.analyze?.ok),
        traceOk: Object.values(input.traceByCase || {}).every((trace) => (trace ? trace.ok : true)),
      },
      warnings,
      limitations: warnings.map((warning) => warning.message),
    },
    input: {
      originalPseudocode: input.source,
      normalizedPseudocode: markNotImplemented<string>(
        SNAPSHOT_NOT_IMPLEMENTED_TODOS.normalizedPseudocode,
      ),
      procedureName: algorithmInfo.name,
      parameters: algorithmInfo.parameters,
      parsingObservations: {
        ok: Boolean(input.parse?.ok),
        available: input.parse?.available,
        runtime: input.parse?.runtime,
        error: input.parse?.error,
        errors: input.parse?.errors,
      },
      analysisSummary: {
        hasCaseVariability: Boolean(input.analyze?.has_case_variability),
        availableCases: (Object.entries(normalizedCases)
          .filter(([, value]) => Boolean(value))
          .map(([caseName]) => caseName) as SnapshotCase[]),
      },
      traceSummary:
        traceSummaryData.length > 0
          ? createSection("available", traceSummaryData)
          : createSection("not_requested"),
    },
    internal: {
      ast: parseAst ? createSection("available", parseAst) : createSection("missing_data"),
      classification: input.classify?.kind
        ? createSection("available", {
            kind: inferAlgorithmType(input),
            method: input.classify.method,
          })
        : createSection("missing_data"),
      recurrence: normalizedRecurrence
        ? createSection("available", normalizedRecurrence)
        : createSection("not_supported"),
      intermediateMath: selectedCase
        ? createSection("available", {
            proof: selectedCase.totals?.proof,
            characteristicEquation: selectedCase.totals?.characteristic_equation,
            characteristicEquationStepByStep:
              selectedCase.totals?.characteristic_equation?.step_by_step,
            iteration: selectedCase.totals?.iteration,
            iterationStepByStep: selectedCase.totals?.iteration?.step_by_step,
            master: selectedCase.totals?.master,
            masterStepByStep: selectedCase.totals?.master?.step_by_step,
            recursionTree: selectedCase.totals?.recursion_tree,
            recursionTreeStepByStep: selectedCase.totals?.recursion_tree?.step_by_step,
          })
        : createSection("missing_data"),
    },
    globalResult: {
      cases: {
        worst: buildCaseResult("worst", normalizedCases.worst),
        best: buildCaseResult("best", normalizedCases.best),
        avg: buildCaseResult("avg", normalizedCases.avg),
      },
    },
    iterative: createSection("available", {
      lineCostTable: {
        worst: normalizedCases.worst?.byLine || null,
        best: normalizedCases.best?.byLine || null,
        avg: normalizedCases.avg?.byLine || null,
      },
      summations: {
        worst: normalizedCases.worst?.totals?.T_open || null,
        best: normalizedCases.best?.totals?.T_open || null,
        avg: normalizedCases.avg?.totals?.T_open || null,
      },
      simplificationSteps: {
        worst: normalizedCases.worst?.totals?.procedure || null,
        best: normalizedCases.best?.totals?.procedure || null,
        avg: normalizedCases.avg?.totals?.procedure || null,
      },
      asymptoticProcedure: {
        worst: normalizedCases.worst?.totals?.notes || null,
        best: normalizedCases.best?.totals?.notes || null,
        avg: normalizedCases.avg?.totals?.notes || null,
      },
      trace:
        traceSummaryData.length > 0
          ? createSection("available", {
              worst: input.traceByCase?.worst?.trace
                ? {
                    steps: input.traceByCase.worst.trace.steps || [],
                    summary: input.traceByCase.worst.trace.summary,
                    diagnostics: input.traceByCase.worst.trace.diagnostics,
                    callTreeSource:
                      input.traceByCase.worst.trace.callTreeSource ||
                      input.traceByCase.worst.trace.recursionTree,
                    reportTraceGraph: resolveReportTraceGraph(input.traceByCase.worst),
                  }
                : null,
              best: input.traceByCase?.best?.trace
                ? {
                    steps: input.traceByCase.best.trace.steps || [],
                    summary: input.traceByCase.best.trace.summary,
                    diagnostics: input.traceByCase.best.trace.diagnostics,
                    callTreeSource:
                      input.traceByCase.best.trace.callTreeSource ||
                      input.traceByCase.best.trace.recursionTree,
                    reportTraceGraph: resolveReportTraceGraph(input.traceByCase.best),
                  }
                : null,
              avg: input.traceByCase?.avg?.trace
                ? {
                    steps: input.traceByCase.avg.trace.steps || [],
                    summary: input.traceByCase.avg.trace.summary,
                    diagnostics: input.traceByCase.avg.trace.diagnostics,
                    callTreeSource:
                      input.traceByCase.avg.trace.callTreeSource ||
                      input.traceByCase.avg.trace.recursionTree,
                    reportTraceGraph: resolveReportTraceGraph(input.traceByCase.avg),
                  }
                : null,
            })
          : createSection("not_requested"),
      loopInvariant: loopInvariant
        ? createSection("available", loopInvariant)
        : markNotImplemented(SNAPSHOT_NOT_IMPLEMENTED_TODOS.loopInvariant),
    }),
    recursive: normalizedRecurrence
      ? createSection("available", {
          recurrence: createSection("available", normalizedRecurrence),
          selectedMethod: normalizedRecurrence.method
            ? createSection("available", normalizedRecurrence.method)
            : createSection("missing_data"),
          methodsAvailable:
            methodsAvailable.length > 0
              ? createSection("available", methodsAvailable)
              : createSection("missing_data"),
          methodDetails:
            methodDetails.length > 0
              ? createSection("available", methodDetails)
              : createSection("missing_data"),
          presentation: recursivePresentation,
          rootsAndMultiplicities: selectedCase?.totals?.characteristic_equation?.roots
            ? createSection("available", selectedCase.totals.characteristic_equation.roots)
            : createSection("not_supported"),
          stepByStep: selectedStepByStep
            ? createSection("available", selectedStepByStep)
            : createSection("not_supported"),
          closedForm: selectedCase?.totals?.characteristic_equation
            ? createSection("available", {
                homogeneousSolution:
                  selectedCase.totals.characteristic_equation.homogeneous_solution,
                particularSolution:
                  selectedCase.totals.characteristic_equation.particular_solution,
                generalSolution: selectedCase.totals.characteristic_equation.general_solution,
                closedForm: selectedCase.totals.characteristic_equation.closed_form,
                theta: selectedCase.totals.characteristic_equation.theta,
                baseCases: selectedCase.totals.characteristic_equation.base_cases,
              })
            : createSection("not_supported"),
          recursionTreeSerializable: selectedCase?.totals?.recursion_tree
            ? createSection("available", selectedCase.totals.recursion_tree)
            : createSection("not_implemented", undefined, undefined, [
                SNAPSHOT_NOT_IMPLEMENTED_TODOS.symbolicRecurrenceTree,
              ]),
          callTrace:
            traceSummaryData.length > 0
              ? createSection("available", {
                  worst: input.traceByCase?.worst?.trace
                    ? {
                        steps: input.traceByCase.worst.trace.steps || [],
                        callTreeSource:
                          input.traceByCase.worst.trace.callTreeSource ||
                          input.traceByCase.worst.trace.recursionTree,
                        summary: input.traceByCase.worst.trace.summary,
                        diagnostics: input.traceByCase.worst.trace.diagnostics,
                        reportTraceGraph: resolveReportTraceGraph(input.traceByCase.worst),
                      }
                    : null,
                  best: input.traceByCase?.best?.trace
                    ? {
                        steps: input.traceByCase.best.trace.steps || [],
                        callTreeSource:
                          input.traceByCase.best.trace.callTreeSource ||
                          input.traceByCase.best.trace.recursionTree,
                        summary: input.traceByCase.best.trace.summary,
                        diagnostics: input.traceByCase.best.trace.diagnostics,
                        reportTraceGraph: resolveReportTraceGraph(input.traceByCase.best),
                      }
                    : null,
                  avg: input.traceByCase?.avg?.trace
                    ? {
                        steps: input.traceByCase.avg.trace.steps || [],
                        callTreeSource:
                          input.traceByCase.avg.trace.callTreeSource ||
                          input.traceByCase.avg.trace.recursionTree,
                        summary: input.traceByCase.avg.trace.summary,
                        diagnostics: input.traceByCase.avg.trace.diagnostics,
                        reportTraceGraph: resolveReportTraceGraph(input.traceByCase.avg),
                      }
                    : null,
                })
              : createSection("not_requested"),
        })
      : createSection("not_supported"),
    comparative: {
      llm: input.llm
        ? createSection("available", input.llm)
        : createSection("not_requested"),
      gpuCpu: input.gpuCpu
        ? createSection("available", input.gpuCpu)
        : createSection("not_requested"),
    },
    institutional: {
      disclaimer: INSTITUTIONAL_DISCLAIMER_TEXT[locale],
      caseLimitations: warnings.map((warning) => warning.message),
      generalLimitations:
        locale === "es" ? DEFAULT_GENERAL_LIMITATIONS_ES : DEFAULT_GENERAL_LIMITATIONS_EN,
    },
  } as Omit<AalieAnalysisSnapshotV1, "contentHash">;

  const normalized = stripUndefinedDeep(snapshotWithoutHash);
  const contentHash = createHash("sha256")
    .update(stableStringify(normalized))
    .digest("hex");

  const snapshot: AalieAnalysisSnapshotV1 = deepFreeze({
    ...snapshotWithoutHash,
    contentHash,
  } as AalieAnalysisSnapshotV1);

  return snapshot;
}
