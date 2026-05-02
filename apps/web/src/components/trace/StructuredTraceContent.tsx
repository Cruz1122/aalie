"use client";

import type { Program, ProcDef, ParamNode } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useEffect, useMemo, useState } from "react";

import { getApiKey } from "@/hooks/useApiKey";
import { translateLlmError } from "@/lib/llm-error-translator";
import { getNormalizedLlmText } from "@/lib/llm-response";
import type {
  CaseType,
  TraceApiResponse,
  TraceConfig,
  StructuredTrace,
} from "@/types/trace";

import AALIEIcon from "../AALIEIcon";
import { GlobalLoader } from "../GlobalLoader";
import MarkdownRenderer from "../MarkdownRenderer";
import DiagramSection from "./DiagramSection";
import InputSizeControl from "./InputSizeControl";
import PseudocodeViewer from "./PseudocodeViewer";
import StepControls from "./StepControls";
import StepInfo from "./StepInfo";
import TraceToolbar from "./TraceToolbar";
import VariablesPanel from "./VariablesPanel";

interface StructuredTraceContentProps {
  ast?: Program | null;
  source: string;
  caseType: CaseType;
  onCaseChange: (caseType: CaseType) => void;
  traceConfig: TraceConfig;
  inputSize: number;
  setInputSize: (value: number) => void;
  debouncedInputSize: number;
  setDebouncedInputSize: (value: number) => void;
  trace: TraceApiResponse | null;
  loading: boolean;
  structuredDiagram: StructuredTrace | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playSpeed: number;
  isDiagramExpanded: boolean;
  setIsDiagramExpanded: (expanded: boolean) => void;
  onLoadTrace: (forceRefresh?: boolean) => void;
  initialVariablesOverride?: Record<string, unknown> | null;
  onVariablesChange?: (vars: Record<string, unknown>) => void;
  onResetToAuto?: () => void;
  exampleArray: number[];
  setExampleArray: (arr: number[]) => void;
  variant?: "modal" | "dedicated";
  fetchCompleted?: boolean;
}

export default function StructuredTraceContent({
  ast = null,
  source,
  caseType,
  onCaseChange,
  traceConfig,
  inputSize,
  setInputSize,
  debouncedInputSize,
  setDebouncedInputSize,
  trace,
  loading,
  structuredDiagram,
  currentStep,
  setCurrentStep,
  isPlaying,
  setIsPlaying,
  playSpeed,
  isDiagramExpanded: _isDiagramExpanded,
  setIsDiagramExpanded,
  onLoadTrace,
  initialVariablesOverride,
  onVariablesChange,
  onResetToAuto,
  exampleArray: _exampleArray,
  setExampleArray: _setExampleArray,
  variant = "modal",
  fetchCompleted = false,
}: StructuredTraceContentProps) {
  const locale = useLocale();
  const t = useTranslations("analyzer.executionTrace");
  const tMessages = useTranslations("analyzer.messages");
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputSizeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepRef = useRef<number>(currentStep);
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanationMd, setAiExplanationMd] = useState("");
  const [explainError, setExplainError] = useState<string | null>(null);

  const isIterative = traceConfig.kind === "iterative";

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    if (inputSizeDebounceRef.current) {
      clearTimeout(inputSizeDebounceRef.current);
    }
    inputSizeDebounceRef.current = setTimeout(
      () => {
        setDebouncedInputSize(inputSize);
      },
      isIterative ? 500 : 800,
    );
    return () => {
      if (inputSizeDebounceRef.current) {
        clearTimeout(inputSizeDebounceRef.current);
      }
    };
  }, [inputSize, setDebouncedInputSize, isIterative]);

  useEffect(
    () => () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    },
    [],
  );

  const stepsToUse = useMemo(
    () => (trace?.ok && trace.trace ? trace.trace.steps : []),
    [trace],
  );
  const currentStepData = useMemo(
    () => (currentStep < stepsToUse.length ? stepsToUse[currentStep] : null),
    [currentStep, stepsToUse],
  );

  const paramNames = useMemo(() => {
    if (!ast)
      return {
        all: [] as string[],
        array: [] as string[],
        scalar: [] as string[],
        length: [] as string[],
        editableScalar: [] as string[],
      };
    const proc = ast.body.find(
      (node): node is ProcDef => node.type === "ProcDef",
    );
    if (!proc)
      return {
        all: [] as string[],
        array: [] as string[],
        scalar: [] as string[],
        length: [] as string[],
        editableScalar: [] as string[],
      };

    const all: string[] = [];
    const array: string[] = [];
    const scalar: string[] = [];
    proc.params.forEach((param: ParamNode) => {
      const name = (param as { name?: string }).name;
      if (!name) return;
      all.push(name);
      if (param.type === "ArrayParam") {
        array.push(name);
      } else {
        scalar.push(name);
      }
    });
    // n (o length, size) como longitud del array: no editable, se fija a len(A)
    const lengthNames =
      array.length > 0
        ? scalar.filter((s) =>
            ["n", "length", "size", "len"].includes(s.toLowerCase()),
          )
        : [];
    const editableScalar = scalar.filter((s) => !lengthNames.includes(s));
    return { all, array, scalar, length: lengthNames, editableScalar };
  }, [ast]);

  const initialVariablesForNote = useMemo(() => {
    const filterByParams = (vars: Record<string, unknown> | null) => {
      if (!vars) return null;
      if (traceConfig.kind !== "recursive" && traceConfig.kind !== "hybrid") {
        return vars;
      }
      if (paramNames.all.length === 0) {
        return vars;
      }
      const allowed = new Set(paramNames.all);
      const filtered = Object.fromEntries(
        Object.entries(vars).filter(([key]) => allowed.has(key)),
      );
      return Object.keys(filtered).length > 0 ? filtered : vars;
    };

    if (
      initialVariablesOverride &&
      Object.keys(initialVariablesOverride).length > 0
    ) {
      return filterByParams(initialVariablesOverride);
    }
    const firstStepVars =
      trace?.ok && trace.trace?.steps?.[0]?.variables
        ? (trace.trace.steps[0].variables as Record<string, unknown>)
        : null;
    return firstStepVars && Object.keys(firstStepVars).length > 0
      ? filterByParams(firstStepVars)
      : null;
  }, [initialVariablesOverride, trace, traceConfig.kind, paramNames.all]);

  const variableSummary = useMemo(() => {
    if (!initialVariablesForNote) return null;
    const entries = Object.entries(initialVariablesForNote)
      .filter(([key]) => key && key !== "_")
      .slice(0, 3)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          const preview = value.slice(0, 5).map((item) => String(item));
          const suffix = value.length > 5 ? ", ..." : "";
          return `${key}=[${preview.join(", ")}${suffix}]`;
        }
        return `${key}=${String(value)}`;
      });
    return entries.length > 0 ? entries.join(", ") : null;
  }, [initialVariablesForNote]);

  const hasN = useMemo(() => {
    if (!initialVariablesForNote) return false;
    return Object.prototype.hasOwnProperty.call(initialVariablesForNote, "n");
  }, [initialVariablesForNote]);

  const recursiveInitialVariables = useMemo(() => {
    if (
      initialVariablesOverride &&
      Object.keys(initialVariablesOverride).length > 0
    ) {
      return initialVariablesOverride;
    }
    if (!trace?.ok || !trace.trace) return undefined;
    const steps = trace.trace.steps ?? [];
    const rootFromSteps = steps.find(
      (step) =>
        step.recursion &&
        step.recursion.depth === 0 &&
        step.recursion.params &&
        Object.keys(step.recursion.params).length > 0,
    );
    if (rootFromSteps?.recursion?.params) {
      return rootFromSteps.recursion.params as Record<string, unknown>;
    }
    const rootCallId = trace.trace.callTreeSource?.root_calls?.[0];
    const rootCall = trace.trace.callTreeSource?.calls?.find(
      (c) => c.id === rootCallId,
    );
    if (rootCall?.params && Object.keys(rootCall.params).length > 0) {
      return rootCall.params as Record<string, unknown>;
    }
    return (
      (steps[0]?.variables as Record<string, unknown> | undefined) ?? undefined
    );
  }, [trace, initialVariablesOverride]);

  const recursiveFinalVariables = useMemo(() => {
    if (!trace?.ok || !trace.trace) return undefined;
    const steps = trace.trace.steps ?? [];
    for (let i = steps.length - 1; i >= 0; i -= 1) {
      const step = steps[i];
      if (
        step.eventKind === "call_exit" &&
        step.recursion &&
        step.recursion.depth === 0 &&
        step.recursion.params
      ) {
        return step.recursion.params as Record<string, unknown>;
      }
    }
    return (
      (steps[steps.length - 1]?.variables as
        | Record<string, unknown>
        | undefined) ?? undefined
    );
  }, [trace]);

  useEffect(() => {
    setAiExplanationMd("");
    setExplainError(null);
    setIsExplaining(false);
  }, [source, caseType, traceConfig.kind]);

  const handleExplainWithAI = async () => {
    if (isExplaining) return;
    setIsExplaining(true);
    setExplainError(null);

    const safeLocale = locale === "en" ? "en" : "es";
    const clientApiKey = getApiKey();
    const contextualPayload = {
      traceKind: traceConfig.kind,
      caseType,
      currentStep: currentStepData
        ? {
            stepNumber: currentStepData.step_number,
            line: currentStepData.line,
            kind: currentStepData.kind,
            eventKind: currentStepData.eventKind,
            description: currentStepData.description,
          }
        : null,
      totalSteps: stepsToUse.length,
      evidence: structuredDiagram?.classification?.evidence ?? [],
      initialVariables:
        trace?.ok && trace.trace?.steps?.[0]?.variables
          ? trace.trace.steps[0].variables
          : null,
      finalVariables:
        trace?.ok && trace.trace?.steps && trace.trace.steps.length > 0
          ? trace.trace.steps[trace.trace.steps.length - 1].variables
          : null,
      source,
    };

    const userPrompt = [
      "Genera una explicacion siguiendo estrictamente el formato solicitado.",
      "Usa la informacion del contexto sin inventar datos.",
      safeLocale === "es"
        ? "IDIOMA OBLIGATORIO: TODO el contenido debe estar en ESPANOL."
        : "MANDATORY LANGUAGE: ALL content must be in ENGLISH.",
      "",
      "CONTEXTO JSON:",
      JSON.stringify(contextualPayload),
    ].join("\n");

    const languageHints =
      safeLocale === "es"
        ? {
            primary: [
              " de ",
              " la ",
              " el ",
              " para ",
              " con ",
              " algoritmo ",
              " paso ",
              " llamada ",
            ],
            secondary: [
              " the ",
              " this ",
              " with ",
              " for ",
              " call ",
              " step ",
              " recursive ",
            ],
          }
        : {
            primary: [
              " the ",
              " this ",
              " with ",
              " for ",
              " call ",
              " step ",
              " recursive ",
              " algorithm ",
            ],
            secondary: [
              " de ",
              " la ",
              " el ",
              " para ",
              " con ",
              " algoritmo ",
              " paso ",
              " llamada ",
            ],
          };

    const hasLanguageMismatch = (text: string) => {
      const normalized = ` ${text.toLowerCase()} `;
      const primaryScore = languageHints.primary.reduce(
        (score, token) => score + (normalized.includes(token) ? 1 : 0),
        0,
      );
      const secondaryScore = languageHints.secondary.reduce(
        (score, token) => score + (normalized.includes(token) ? 1 : 0),
        0,
      );
      return secondaryScore >= 3 && secondaryScore > primaryScore;
    };

    const requestExplain = async (prompt: string) => {
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: "explain",
          prompt,
          locale: safeLocale,
          ...(clientApiKey ? { apiKey: clientApiKey } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData?.error || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }

      const result = await response.json();
      if (!result?.ok) {
        throw new Error(result?.error || tMessages("unknownLlmError"));
      }

      const content = getNormalizedLlmText(result);
      const normalizedContent = String(content).trim();
      if (!normalizedContent) {
        throw new Error(tMessages("emptyLlmResponse"));
      }
      return normalizedContent;
    };

    try {
      let normalizedContent = await requestExplain(userPrompt);

      if (hasLanguageMismatch(normalizedContent)) {
        const rewritePrompt = [
          safeLocale === "es"
            ? "Reescribe el siguiente texto en ESPANOL neutro."
            : "Rewrite the following text in natural ENGLISH.",
          safeLocale === "es"
            ? "Mantén exactamente el mismo formato Markdown y secciones."
            : "Keep exactly the same Markdown format and section structure.",
          "",
          "TEXTO A REESCRIBIR:",
          normalizedContent,
        ].join("\n");
        normalizedContent = await requestExplain(rewritePrompt);
      }

      setAiExplanationMd(normalizedContent);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      const translatedKey = translateLlmError(rawMessage);
      setExplainError(
        translatedKey === "unknownLlmError"
          ? t("explanationAIFallback")
          : tMessages(translatedKey),
      );
    } finally {
      setIsExplaining(false);
    }
  };

  const renderExplanationPanel = () => {
    const actionLabel = aiExplanationMd
      ? t("regenerateAIExplanation")
      : t("explainWithAI");

    return (
      <div className="flex flex-col gap-2 mt-2">
        <div className="text-xs text-slate-400 font-semibold">
          {t("explanation")}
        </div>

        <div className="glass-card p-3 rounded-lg h-[220px] min-h-[220px] max-h-[220px] overflow-y-auto scrollbar-custom">
          {isExplaining ? (
            <div className="h-full flex items-center justify-center">
              <GlobalLoader
                variant="pulse"
                size="sm"
                message={t("explainingWithAI")}
              />
            </div>
          ) : explainError ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-red-300">{explainError}</p>
              <button
                type="button"
                onClick={handleExplainWithAI}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <AALIEIcon size={26} className="text-indigo-300" />
                <span>{actionLabel}</span>
              </button>
            </div>
          ) : aiExplanationMd ? (
            <div className="flex h-full flex-col gap-3">
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom">
                <MarkdownRenderer content={aiExplanationMd} />
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleExplainWithAI}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <AALIEIcon size={20} className="text-indigo-300" />
                  <span>{actionLabel}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-3">
              <p className="text-base sm:text-lg font-semibold text-slate-200">
                {t("explanationPrompt")}
              </p>
              <button
                type="button"
                onClick={handleExplainWithAI}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <AALIEIcon size={20} className="text-indigo-300" />
                <span>{t("explainWithAI")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handlePlay = () => {
    if (stepsToUse.length === 0) return;
    setIsPlaying(true);
    playIntervalRef.current = setInterval(() => {
      const maxSteps = stepsToUse.length;
      const current = currentStepRef.current;
      if (current >= maxSteps - 1) {
        setIsPlaying(false);
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
        }
      } else {
        setCurrentStep(current + 1);
      }
    }, playSpeed);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
  };

  const handleRegenerate = () => {
    onLoadTrace(true);
  };

  const recursionDiagramForVariables = structuredDiagram
    ? {
        graph: structuredDiagram.graph,
        explanation:
          structuredDiagram.classification.evidence?.join("\n") ?? "",
      }
    : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div
        className={`flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-custom ${
          variant === "dedicated"
            ? "flex flex-col gap-4"
            : "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {variant === "modal" && <PseudocodeViewer source={source} />}

        {variant === "dedicated" && isIterative ? (
          <>
            <div className="flex flex-col min-h-0 min-w-0 flex-1 gap-4">
              <section className="rounded-xl border border-amber-500/20 bg-slate-900/40 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      timeline
                    </span>
                    {t("stepByStepTrace")}
                  </h3>
                  {traceConfig.controls?.scenario && (
                    <TraceToolbar
                      caseType={caseType}
                      onCaseChange={onCaseChange}
                      onReload={handleRegenerate}
                      onExpand={() => setIsDiagramExpanded(true)}
                      loading={loading}
                      traceConfig={traceConfig}
                      showActions={false}
                    />
                  )}
                </div>
                {stepsToUse.length > 0 && (
                  <>
                    <StepControls
                      currentStep={currentStep}
                      totalSteps={stepsToUse.length}
                      onPrevious={() =>
                        setCurrentStep(Math.max(0, currentStep - 1))
                      }
                      onNext={() =>
                        setCurrentStep(
                          Math.min(stepsToUse.length - 1, currentStep + 1),
                        )
                      }
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onReset={() => {
                        setCurrentStep(0);
                        setIsPlaying(false);
                      }}
                      isPlaying={isPlaying}
                      loading={loading}
                    />
                    {currentStep < stepsToUse.length && (
                      <StepInfo
                        stepData={stepsToUse[currentStep]}
                        loading={loading}
                        trace={trace}
                        currentStep={currentStep}
                      />
                    )}
                  </>
                )}
              </section>

              <section className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      tune
                    </span>
                    {t("controlsAndVariables")}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <InputSizeControl
                      value={inputSize}
                      min={1}
                      max={20}
                      onChange={setInputSize}
                      noMargin
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <VariablesPanel
                      mode={isIterative ? "iterative" : "recursive"}
                      recursionDiagram={recursionDiagramForVariables}
                      editable={traceConfig.controls?.arrayEditable ?? false}
                      onVariablesChange={onVariablesChange}
                      onResetToAuto={onResetToAuto}
                      paramNames={paramNames.all}
                      arrayParamNames={paramNames.array}
                      scalarParamNames={paramNames.editableScalar}
                      lengthParamNames={paramNames.length}
                      initialVariables={
                        isIterative
                          ? trace?.ok && trace.trace?.steps?.[0]?.variables
                            ? (trace.trace.steps[0].variables as Record<
                                string,
                                unknown
                              >)
                            : undefined
                          : recursiveInitialVariables
                      }
                      finalVariables={
                        isIterative
                          ? trace?.ok &&
                            trace.trace?.steps &&
                            trace.trace.steps.length > 0
                            ? (trace.trace.steps[trace.trace.steps.length - 1]
                                .variables as Record<string, unknown>)
                            : undefined
                          : recursiveFinalVariables
                      }
                    />
                  </div>
                  <div className="min-w-0">{renderExplanationPanel()}</div>
                </div>

                <div>
                  <DiagramSection
                    structuredDiagram={structuredDiagram}
                    loading={loading}
                    inputSize={debouncedInputSize}
                    initialVariablesSummary={variableSummary ?? undefined}
                    hasN={hasN}
                    onRegenerate={handleRegenerate}
                    onExpand={() => setIsDiagramExpanded(true)}
                    traceConfig={traceConfig}
                    fetchCompleted={fetchCompleted}
                    frameStyle="border"
                  />
                </div>
              </section>
            </div>
          </>
        ) : (
          <>
            {variant === "dedicated" && !isIterative ? (
              <section className="space-y-4">
                <div>
                  <DiagramSection
                    structuredDiagram={structuredDiagram}
                    loading={loading}
                    inputSize={debouncedInputSize}
                    initialVariablesSummary={variableSummary ?? undefined}
                    hasN={hasN}
                    onRegenerate={handleRegenerate}
                    onExpand={() => setIsDiagramExpanded(true)}
                    traceConfig={traceConfig}
                    fetchCompleted={fetchCompleted}
                    frameStyle="border"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <InputSizeControl
                      value={inputSize}
                      min={1}
                      max={20}
                      onChange={setInputSize}
                      noMargin
                    />
                  </div>
                </div>

                <VariablesPanel
                  mode="recursive"
                  recursionDiagram={recursionDiagramForVariables}
                  editable={traceConfig.controls?.arrayEditable ?? false}
                  onVariablesChange={onVariablesChange}
                  onResetToAuto={onResetToAuto}
                  paramNames={paramNames.all}
                  arrayParamNames={paramNames.array}
                  scalarParamNames={paramNames.editableScalar}
                  lengthParamNames={paramNames.length}
                  initialVariables={recursiveInitialVariables}
                  finalVariables={recursiveFinalVariables}
                />

                {renderExplanationPanel()}
              </section>
            ) : (
              <>
                <div className="flex flex-col min-w-0 flex-1 min-h-[280px] overflow-hidden">
                  <DiagramSection
                    structuredDiagram={structuredDiagram}
                    loading={loading}
                    inputSize={debouncedInputSize}
                    initialVariablesSummary={variableSummary ?? undefined}
                    hasN={hasN}
                    onRegenerate={handleRegenerate}
                    onExpand={() => setIsDiagramExpanded(true)}
                    traceConfig={traceConfig}
                    fetchCompleted={fetchCompleted}
                  />
                </div>

                <div className="flex flex-col min-h-0 min-w-0 flex-1">
                  {isIterative && traceConfig.controls?.scenario && (
                    <TraceToolbar
                      caseType={caseType}
                      onCaseChange={onCaseChange}
                      onReload={handleRegenerate}
                      onExpand={() => setIsDiagramExpanded(true)}
                      loading={loading}
                      traceConfig={traceConfig}
                    />
                  )}

                  <InputSizeControl
                    value={inputSize}
                    min={1}
                    max={20}
                    onChange={setInputSize}
                  />

                  <VariablesPanel
                    mode={isIterative ? "iterative" : "recursive"}
                    recursionDiagram={recursionDiagramForVariables}
                    editable={traceConfig.controls?.arrayEditable ?? false}
                    onVariablesChange={onVariablesChange}
                    onResetToAuto={onResetToAuto}
                    paramNames={paramNames.all}
                    arrayParamNames={paramNames.array}
                    scalarParamNames={paramNames.editableScalar}
                    lengthParamNames={paramNames.length}
                    initialVariables={
                      isIterative
                        ? trace?.ok && trace.trace?.steps?.[0]?.variables
                          ? (trace.trace.steps[0].variables as Record<
                              string,
                              unknown
                            >)
                          : undefined
                        : recursiveInitialVariables
                    }
                    finalVariables={
                      isIterative
                        ? trace?.ok &&
                          trace.trace?.steps &&
                          trace.trace.steps.length > 0
                          ? (trace.trace.steps[trace.trace.steps.length - 1]
                              .variables as Record<string, unknown>)
                          : undefined
                        : recursiveFinalVariables
                    }
                  />

                  {isIterative && stepsToUse.length > 0 && (
                    <>
                      <StepControls
                        currentStep={currentStep}
                        totalSteps={stepsToUse.length}
                        onPrevious={() =>
                          setCurrentStep(Math.max(0, currentStep - 1))
                        }
                        onNext={() =>
                          setCurrentStep(
                            Math.min(stepsToUse.length - 1, currentStep + 1),
                          )
                        }
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onReset={() => {
                          setCurrentStep(0);
                          setIsPlaying(false);
                        }}
                        isPlaying={isPlaying}
                        loading={loading}
                      />
                      {currentStep < stepsToUse.length && (
                        <StepInfo
                          stepData={stepsToUse[currentStep]}
                          loading={loading}
                          trace={trace}
                          currentStep={currentStep}
                        />
                      )}
                    </>
                  )}

                  {renderExplanationPanel()}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
