"use client";

import type { Program } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";

import { useTraceController } from "@/hooks/trace/useTraceController";
import { useTraceRefreshOnAnalysis } from "@/hooks/trace/useTraceRefreshOnAnalysis";
import { buildTraceFocusedPanelContext } from "@/lib/assistant/trace-focused-panel";
import type { AssistantFocusedPanelContext } from "@/lib/assistant/types";
import type { CaseType } from "@/types/trace";

import ExecutionGraphView from "./ExecutionGraphView";
import StructuredTraceContent from "./trace/StructuredTraceContent";
import TraceChatPanel from "./trace/TraceChatPanel";
import TraceStatusBanner from "./trace/TraceStatusBanner";

/**
 * Vista dedicada de seguimiento de pseudocódigo (iterativo y recursivo).
 * Layout: panel izquierdo tipo chat (pseudocódigo con progreso) + área principal.
 *
 * @author AALIE
 * @version 0.1.0
 */
interface TraceDedicatedViewProps {
  source: string;
  ast: Program | null;
  caseType: CaseType;
  onCaseChange: (caseType: CaseType) => void;
  onBack: () => void;
  hasApiKey?: boolean;
  onAssistantFocusedPanelChange?: (
    panel: AssistantFocusedPanelContext | null,
  ) => void;
}

export default function TraceDedicatedView({
  source,
  ast,
  caseType,
  onCaseChange,
  onBack,
  hasApiKey: _hasApiKey = false,
  onAssistantFocusedPanelChange,
}: TraceDedicatedViewProps) {
  const locale = useLocale();
  const t = useTranslations("analyzer.executionTrace");
  const tCases = useTranslations("analyzer.cases");
  const [inputSize, setInputSize] = useState<number>(4);
  const [debouncedInputSize, setDebouncedInputSize] = useState<number>(4);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed] = useState(1000);
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(false);
  const [initialVariablesOverride, setInitialVariablesOverride] =
    useState<Record<string, unknown> | null>(null);

  const {
    trace,
    loading,
    error,
    truncated,
    truncationReason,
    structuredDiagram,
    algorithmKind,
    traceConfig,
    loadTrace,
    setAlgorithmKind,
    setExampleArray,
    exampleArray,
    fetchCompleted,
  } = useTraceController(
    {
      source,
      caseType,
      inputSize,
      debouncedInputSize,
      locale: locale === "es" ? "es" : "en",
      initialVariablesOverride,
    },
    t,
  );

  const loadTraceWithReset = useCallback(
    async (
      forceRefresh?: boolean,
      effectiveOverride?: Record<string, unknown> | null,
    ) => {
      setCurrentStep(0);
      setIsPlaying(false);
      await loadTrace(forceRefresh, effectiveOverride);
    },
    [loadTrace],
  );

  useTraceRefreshOnAnalysis(() => loadTraceWithReset(true));

  const loadedParamsRef = useRef<string | null>(null);
  const previousSourceKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Evita arrastrar overrides de una ejecución/fuente anterior.
    setInitialVariablesOverride(null);
    loadedParamsRef.current = null;
  }, [source]);

  useEffect(() => {
    if (!source) return;
    const overrideKey = initialVariablesOverride
      ? JSON.stringify(initialVariablesOverride)
      : "auto";
    const paramsKey = `${caseType}-${debouncedInputSize}-${source.substring(0, 100)}-${overrideKey}`;
    if (loadedParamsRef.current === paramsKey) return;
    loadedParamsRef.current = paramsKey;
    const sourceKey = source.substring(0, 100);
    if (previousSourceKeyRef.current !== sourceKey) {
      previousSourceKeyRef.current = sourceKey;
      setAlgorithmKind(null);
    }
    loadTraceWithReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseType, debouncedInputSize, source, locale, initialVariablesOverride]);
  // Cuando hay error, resetear el guard para que el usuario pueda reintentar
  useEffect(() => {
    if (error) {
      loadedParamsRef.current = null;
    }
  }, [error]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isDiagramExpanded && structuredDiagram) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDiagramExpanded, structuredDiagram]);

  const isRecursiveOrHybrid =
    algorithmKind === "recursive" || algorithmKind === "hybrid";

  const stepsToUse = trace?.ok && trace?.trace?.steps ? trace.trace.steps : [];
  const currentStepData =
    stepsToUse.length > 0 && currentStep < stepsToUse.length
      ? stepsToUse[currentStep]
      : null;
  const currentLine = currentStepData?.line || 0;
  const totalSteps = stepsToUse.length;

  const assistantInitialVariables = useMemo(() => {
    if (
      initialVariablesOverride &&
      Object.keys(initialVariablesOverride).length > 0
    ) {
      return initialVariablesOverride;
    }

    const rootCallId = trace?.ok
      ? trace.trace?.callTreeSource?.root_calls?.[0]
      : null;
    const rootCall =
      rootCallId && trace?.ok
        ? trace.trace?.callTreeSource?.calls?.find(
            (call) => call.id === rootCallId,
          )
        : null;
    if (rootCall?.params && Object.keys(rootCall.params).length > 0) {
      return rootCall.params as Record<string, unknown>;
    }

    const firstStepVariables =
      trace?.ok && trace.trace?.steps?.[0]?.variables
        ? (trace.trace.steps[0].variables as Record<string, unknown>)
        : null;
    return firstStepVariables && Object.keys(firstStepVariables).length > 0
      ? firstStepVariables
      : null;
  }, [initialVariablesOverride, trace]);

  const assistantFocusedPanel = useMemo(
    () =>
      buildTraceFocusedPanelContext({
        locale,
        caseLabel: tCases(caseType),
        traceKind: algorithmKind ?? traceConfig.kind,
        inputSize: debouncedInputSize,
        currentStepIndex: currentStep,
        totalSteps,
        currentStep: currentStepData,
        initialVariables: assistantInitialVariables,
        structuredTrace: structuredDiagram,
        traceSummary: trace?.ok ? trace.trace?.summary : undefined,
        loading,
        error,
        fetchCompleted,
      }),
    [
      algorithmKind,
      assistantInitialVariables,
      caseType,
      currentStep,
      currentStepData,
      debouncedInputSize,
      error,
      fetchCompleted,
      loading,
      locale,
      structuredDiagram,
      tCases,
      totalSteps,
      trace,
      traceConfig.kind,
    ],
  );

  useEffect(() => {
    onAssistantFocusedPanelChange?.(assistantFocusedPanel);
  }, [assistantFocusedPanel, onAssistantFocusedPanelChange]);

  useEffect(
    () => () => {
      onAssistantFocusedPanelChange?.(null);
    },
    [onAssistantFocusedPanelChange],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Content - misma estructura de grid y cards que la pantalla de análisis; sin loader al cambiar de vista */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna izquierda: pseudocódigo - misma estructura que análisis (glass-card) */}
        <section className="lg:col-span-4 h-full">
          <div className="glass-card !shadow-none p-4 rounded-lg h-full flex flex-col">
            <TraceChatPanel
              source={source}
              currentLine={isRecursiveOrHybrid ? undefined : currentLine}
              currentStep={currentStep}
              totalSteps={isRecursiveOrHybrid ? 0 : totalSteps}
              onBack={onBack}
            />
          </div>
        </section>

        {/* Columna derecha: contenido principal - misma estructura que análisis */}
        <section className="lg:col-span-8 h-full min-h-[420px]">
          <div className="glass-card !shadow-none p-4 rounded-lg h-full flex flex-col min-h-0 overflow-hidden">
            <TraceStatusBanner
              loading={loading}
              error={error}
              truncated={truncated}
              truncationReason={truncationReason}
              showLoading={false}
            />
            {algorithmKind === null ? (
              <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full animate-ping" />
                  <div className="absolute w-6 h-6 bg-purple-500 rounded-full" />
                </div>
                <p className="text-xs text-slate-400">
                  {t("detectingAlgorithm")}
                </p>
              </div>
            ) : (
              <StructuredTraceContent
                ast={ast}
                source={source}
                caseType={caseType}
                onCaseChange={onCaseChange}
                traceConfig={traceConfig}
                inputSize={inputSize}
                setInputSize={setInputSize}
                debouncedInputSize={debouncedInputSize}
                setDebouncedInputSize={setDebouncedInputSize}
                trace={trace}
                loading={loading}
                structuredDiagram={structuredDiagram}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playSpeed={playSpeed}
                isDiagramExpanded={isDiagramExpanded}
                setIsDiagramExpanded={setIsDiagramExpanded}
                onLoadTrace={loadTraceWithReset}
                initialVariablesOverride={initialVariablesOverride}
                onVariablesChange={(vars) => {
                  setInitialVariablesOverride(vars);
                  if (vars.A && Array.isArray(vars.A) && vars.A.length > 0) {
                    const len = vars.A.length;
                    setInputSize(len);
                    setDebouncedInputSize(len);
                  }
                  loadTraceWithReset(true, vars);
                }}
                onResetToAuto={() => {
                  setInitialVariablesOverride(null);
                  loadTraceWithReset(true, null);
                }}
                exampleArray={exampleArray}
                setExampleArray={setExampleArray}
                variant="dedicated"
                fetchCompleted={fetchCompleted}
              />
            )}
          </div>
        </section>
      </div>

      {/* Expanded diagram modal - portal a body para overlay en toda la pantalla (evita cuadrado de blur por transform en ancestros) */}
      {isDiagramExpanded &&
        structuredDiagram &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div
              className="absolute inset-0 glass-modal-overlay"
              onClick={() => setIsDiagramExpanded(false)}
              role="button"
              tabIndex={0}
              aria-label={t("closeExpandedDiagram")}
            />
            <div className="relative z-10 w-[96vw] max-w-[96vw] h-[96vh] max-h-[96dvh] rounded-xl glass-modal-container !shadow-none flex flex-col overflow-hidden">
              <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 glass-modal-header !shadow-none rounded-t-xl">
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-400 text-lg">
                    {isRecursiveOrHybrid ? "account_tree" : "schema"}
                  </span>
                  <span>
                    {isRecursiveOrHybrid
                      ? t("callTreeTitle")
                      : t("executionDiagramTitle")}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDiagramExpanded(false)}
                  className="text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  title={t("close")}
                  aria-label={t("close")}
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 min-h-0 p-3 bg-slate-900/80">
                <ExecutionGraphView graph={structuredDiagram.graph} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
