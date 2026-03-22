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

export async function collectArtifactsForSnapshot(
  input: CollectArtifactsInput,
): Promise<BuildSnapshotInput> {
  const apiBase = getApiBase();
  const traceCases: SnapshotCase[] =
    input.includeTraceCases && input.includeTraceCases.length > 0
      ? input.includeTraceCases
      : ["worst"];

  const parse = await postJson<BuildSnapshotInput["parse"]>(apiBase, "/grammar/parse", {
    source: input.source,
  });

  const classify = await postJson<BuildSnapshotInput["classify"]>(apiBase, "/classify", {
    source: input.source,
  });

  const algorithmKind = normalizeAlgorithmKind(
    input.algorithmKindHint || classify?.kind,
  );

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
      const trace = await postJson<NonNullable<BuildSnapshotInput["traceByCase"]>[SnapshotCase]>(
        apiBase,
        "/analyze/trace",
        {
          source: input.source,
          case: caseName,
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
