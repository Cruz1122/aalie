import type { BuildSnapshotInput } from "@aa/exporter";
import type { SnapshotCase, SnapshotRecursiveMethod } from "@aa/types";

import { buildGpuCpuComparative } from "./gpu-cpu-adapter";
import { normalizeLlmComparativePayload, requestLlmComparison } from "./llm-adapter";

type AlgorithmKind = "iterative" | "recursive" | "hybrid" | "dummy" | "unknown";

export interface CollectArtifactsInput {
  source: string;
  locale: "es" | "en";
  sourceOrigin?: BuildSnapshotInput["sourceOrigin"];
  analysisId?: string;
  includeTraceCases?: SnapshotCase[];
  includeLlm?: boolean;
  llmPayload?: unknown;
  includeGpuCpu?: boolean;
  preferredMethod?: SnapshotRecursiveMethod;
  algorithmKindHint?: AlgorithmKind;
  apiKey?: string;
  requestOrigin?: string;
}

function getApiBase(): string {
  const internal = process.env.API_INTERNAL_BASE_URL?.replace(/\/+$/, "");
  if (internal) {
    return internal.startsWith("http://") || internal.startsWith("https://")
      ? internal
      : `https://${internal}`;
  }

  const external = process.env.API_BASE_URL?.replace(/\/+$/, "");
  if (external) {
    return external.startsWith("http://") || external.startsWith("https://")
      ? external
      : `https://${external}`;
  }

  return process.env.DOCKER ? "http://api:8000" : "http://localhost:8000";
}

async function postJson<T>(
  baseUrl: string,
  endpoint: string,
  payload: unknown,
): Promise<T | null> {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    return (await response.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}

function normalizeAlgorithmKind(kind: unknown): AlgorithmKind {
  const normalized = String(kind || "").toLowerCase();
  if (
    normalized === "iterative" ||
    normalized === "recursive" ||
    normalized === "hybrid" ||
    normalized === "dummy"
  ) {
    return normalized;
  }
  return "unknown";
}

function buildTraceInputs(
  source: string,
  caseName: SnapshotCase,
): { inputSize: number; initialVariables: Record<string, unknown> | null } {
  const defaultN = 5;
  const usesX = /(^|[^A-Za-z0-9_])x([^A-Za-z0-9_]|$)/i.test(source);
  const usesArrayA = /(^|[^A-Za-z0-9_])A\s*\[/.test(source);
  const hasZeroCheck =
    /n\s*[=<>]=\s*0|n\s*=\s*0|IF\s*\(\s*n\s*[=<>]=\s*0/i.test(source);
  const isSortingLike =
    /(merge|quick|heap|bubble|insertion|selection|sort|ordenar|mezclar|particionar)/i.test(
      source,
    );

  const n = caseName === "worst" && hasZeroCheck ? 0 : defaultN;
  const safeN = Math.max(1, n);
  const ascArray = Array.from({ length: safeN }, (_, index) => index + 1);
  const descArray = [...ascArray].reverse();
  const selectedArray = isSortingLike
    ? caseName === "best"
      ? ascArray
      : descArray
    : ascArray;

  const variables: Record<string, unknown> = {};
  if (usesArrayA && n > 0) {
    variables.A = selectedArray;
  }

  if (usesX && n > 0) {
    if (caseName === "best") {
      variables.x = selectedArray[0];
    } else if (caseName === "avg") {
      variables.x = selectedArray[Math.floor(selectedArray.length / 2)];
    } else {
      // Worst-case aligned with frontend trace logic: match on the last iteration.
      variables.x = selectedArray[selectedArray.length - 1];
    }
  }

  return {
    inputSize: n,
    initialVariables: Object.keys(variables).length > 0 ? variables : null,
  };
}

export async function collectArtifactsForSnapshot(
  input: CollectArtifactsInput,
): Promise<BuildSnapshotInput> {
  const apiBase = getApiBase();

  const parse = await postJson<BuildSnapshotInput["parse"]>(apiBase, "/grammar/parse", {
    source: input.source,
  });

  const classify = await postJson<BuildSnapshotInput["classify"]>(apiBase, "/classify", {
    source: input.source,
  });

  const algorithmKind = normalizeAlgorithmKind(
    input.algorithmKindHint || classify?.kind,
  );
  const traceCases: SnapshotCase[] =
    input.includeTraceCases && input.includeTraceCases.length > 0
      ? input.includeTraceCases
      : algorithmKind === "iterative" || algorithmKind === "hybrid"
        ? ["worst", "best", "avg"]
        : ["worst"];

  const analyze = await postJson<BuildSnapshotInput["analyze"]>(apiBase, "/analyze/open", {
    source: input.source,
    mode: "all",
    avgModel: { mode: "uniform", predicates: {} },
    algorithm_kind: algorithmKind,
    preferred_method: input.preferredMethod,
    locale: input.locale,
  });

  let detectMethods: BuildSnapshotInput["detectMethods"] = null;
  if (algorithmKind === "recursive" || algorithmKind === "hybrid") {
    detectMethods = await postJson<BuildSnapshotInput["detectMethods"]>(
      apiBase,
      "/analyze/detect-methods",
      {
        source: input.source,
        algorithm_kind: algorithmKind,
      },
    );
  }

  const traceByCase: BuildSnapshotInput["traceByCase"] = {};
  await Promise.all(
    traceCases.map(async (caseName) => {
      const traceInput = buildTraceInputs(input.source, caseName);
      const trace = await postJson<NonNullable<BuildSnapshotInput["traceByCase"]>[SnapshotCase]>(
        apiBase,
        "/analyze/trace",
        {
          source: input.source,
          case: caseName,
          input_size: traceInput.inputSize,
          initial_variables: traceInput.initialVariables,
          locale: input.locale,
        },
      );
      traceByCase[caseName] = trace || null;
    }),
  );

  const llmSourcePayload =
    typeof input.llmPayload !== "undefined"
      ? input.llmPayload
      : input.includeLlm
        ? await requestLlmComparison({
            source: input.source,
            locale: input.locale,
            apiKey: input.apiKey,
            requestOrigin: input.requestOrigin,
            analysis: analyze || undefined,
          })
        : null;

  const llm = llmSourcePayload
    ? normalizeLlmComparativePayload(llmSourcePayload)
    : null;

  const gpuCpu = input.includeGpuCpu !== false
    ? buildGpuCpuComparative(parse?.ok ? parse.ast : null, input.locale)
    : null;

  return {
    source: input.source,
    locale: input.locale,
    sourceOrigin: input.sourceOrigin,
    analysisId: input.analysisId,
    parse,
    classify,
    analyze,
    detectMethods,
    traceByCase,
    llm,
    gpuCpu,
  };
}
