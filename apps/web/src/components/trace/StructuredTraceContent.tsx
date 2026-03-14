"use client";

import type { Program, ProcDef, ParamNode } from "@aa/types";
import { useTranslations } from "next-intl";
import { useRef, useEffect, useMemo } from "react";

import type {
  CaseType,
  TraceApiResponse,
  TraceConfig,
  TraceGraph,
} from "@/types/trace";

import DiagramSection from "./DiagramSection";
import InputSizeControl from "./InputSizeControl";
import PseudocodeViewer from "./PseudocodeViewer";
import StepControls from "./StepControls";
import StepInfo from "./StepInfo";
import TraceToolbar from "./TraceToolbar";
import VariablesPanel from "./VariablesPanel";

interface StructuredDiagram {
  graph: TraceGraph;
  patternKind: string;
  classification: { evidence: string[] };
}

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
  structuredDiagram: StructuredDiagram | null;
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
  const t = useTranslations("analyzer.executionTrace");
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputSizeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepRef = useRef<number>(currentStep);

  const isIterative = traceConfig.kind === "iterative";

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    if (inputSizeDebounceRef.current) {
      clearTimeout(inputSizeDebounceRef.current);
    }
    inputSizeDebounceRef.current = setTimeout(() => {
      setDebouncedInputSize(inputSize);
    }, isIterative ? 500 : 800);
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

  const paramNames = useMemo(() => {
    if (!ast) return { all: [] as string[], array: [] as string[], scalar: [] as string[], length: [] as string[], editableScalar: [] as string[] };
    const proc = ast.body.find(
      (node): node is ProcDef => node.type === "ProcDef",
    );
    if (!proc) return { all: [] as string[], array: [] as string[], scalar: [] as string[], length: [] as string[], editableScalar: [] as string[] };

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
    const lengthNames = array.length > 0 ? scalar.filter((s) => ["n", "length", "size", "len"].includes(s.toLowerCase())) : [];
    const editableScalar = scalar.filter((s) => !lengthNames.includes(s));
    return { all, array, scalar, length: lengthNames, editableScalar };
  }, [ast]);

  const initialVariablesForNote = useMemo(() => {
    if (initialVariablesOverride && Object.keys(initialVariablesOverride).length > 0) {
      return initialVariablesOverride;
    }
    const firstStepVars =
      trace?.ok && trace.trace?.steps?.[0]?.variables
        ? (trace.trace.steps[0].variables as Record<string, unknown>)
        : null;
    return firstStepVars && Object.keys(firstStepVars).length > 0
      ? firstStepVars
      : null;
  }, [initialVariablesOverride, trace]);

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
                    <span className="material-symbols-outlined text-base">timeline</span>
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
                      onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
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
                    <span className="material-symbols-outlined text-base">tune</span>
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
                        trace?.ok && trace.trace?.steps?.[0]?.variables
                          ? (trace.trace.steps[0].variables as Record<string, unknown>)
                          : undefined
                      }
                      finalVariables={
                        trace?.ok &&
                        trace.trace?.steps &&
                        trace.trace.steps.length > 0
                          ? (trace.trace.steps[trace.trace.steps.length - 1]
                              .variables as Record<string, unknown>)
                          : undefined
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="glass-card p-2 rounded-lg bg-slate-800/60 border border-white/10">
                      <div className="text-[11px] text-slate-400 mb-1 font-semibold">
                        {t("explanation")}
                      </div>
                      <div className="min-h-[120px] text-[11px] text-slate-400 whitespace-pre-wrap">
                        {t("explanationPlaceholder")}
                      </div>
                    </div>
                  </div>
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
              <section className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 shadow-sm space-y-4">
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
                  initialVariables={
                    trace?.ok && trace.trace?.steps?.[0]?.variables
                      ? (trace.trace.steps[0].variables as Record<string, unknown>)
                      : undefined
                  }
                  finalVariables={
                    trace?.ok &&
                    trace.trace?.steps &&
                    trace.trace.steps.length > 0
                      ? (trace.trace.steps[trace.trace.steps.length - 1]
                          .variables as Record<string, unknown>)
                      : undefined
                  }
                />

                <div className="flex flex-col gap-2">
                  <div className="text-xs text-slate-400 font-semibold">
                    {t("explanation")}
                  </div>
                  <div className="overflow-y-auto scrollbar-custom glass-card p-4 rounded-lg h-[180px]">
                    {structuredDiagram?.classification?.evidence?.length ? (
                      <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                        {structuredDiagram.classification.evidence.map((e, i) => (
                          <li key={`${e}-${i}`}>{e}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">
                        {t("explanationPlaceholder")}
                      </p>
                    )}
                  </div>
                </div>
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
                      trace?.ok && trace.trace?.steps?.[0]?.variables
                        ? (trace.trace.steps[0].variables as Record<string, unknown>)
                        : undefined
                    }
                    finalVariables={
                      trace?.ok &&
                      trace.trace?.steps &&
                      trace.trace.steps.length > 0
                        ? (trace.trace.steps[trace.trace.steps.length - 1]
                            .variables as Record<string, unknown>)
                        : undefined
                    }
                  />

                  {isIterative && stepsToUse.length > 0 && (
                    <>
                      <StepControls
                        currentStep={currentStep}
                        totalSteps={stepsToUse.length}
                        onPrevious={() => setCurrentStep(Math.max(0, currentStep - 1))}
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

                  {!isIterative && structuredDiagram?.classification?.evidence && (
                    <div className="flex flex-col gap-2 mt-2 flex-1 min-h-0">
                      <div className="text-xs text-slate-400 font-semibold">
                        {t("explanation")}
                      </div>
                      <div className="flex-1 overflow-y-auto scrollbar-custom glass-card p-4 rounded-lg">
                        <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                          {structuredDiagram.classification.evidence.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
