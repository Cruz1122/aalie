"use client";

import type { Program } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useCallback, useRef } from "react";

import { useTraceController } from "@/hooks/trace/useTraceController";
import type { CaseType } from "@/types/trace";

import ExecutionGraphView from "./ExecutionGraphView";
import BaseModalContainer from "./modals/BaseModalContainer";
import StructuredTraceContent from "./trace/StructuredTraceContent";

/**
 * Modal de seguimiento de ejecución (traza estructurada).
 * Usa useTraceController + StructuredTraceContent.
 *
 * @author AALIE - Plan Sistema Traza Estructural
 * @version 0.1.0
 */
interface ExecutionTraceModalProps {
  open: boolean;
  onClose: () => void;
  source: string;
  ast: Program | null;
  caseType: CaseType;
  onCaseChange: (caseType: CaseType) => void;
}

export default function ExecutionTraceModal({
  open,
  onClose,
  source,
  ast,
  caseType,
  onCaseChange,
}: Readonly<ExecutionTraceModalProps>) {
  const locale = useLocale();
  const t = useTranslations("analyzer.executionTrace");
  const tAlgorithm = useTranslations("analyzer.algorithmType");
  const [inputSize, setInputSize] = useState<number>(4);
  const [debouncedInputSize, setDebouncedInputSize] = useState<number>(4);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed] = useState(1000);
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(false);
  const [initialVariablesOverride] = useState<Record<string, unknown> | null>(null);

  const {
    trace,
    loading,
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
    async (forceRefresh?: boolean) => {
      setCurrentStep(0);
      setIsPlaying(false);
      await loadTrace(forceRefresh);
    },
    [loadTrace],
  );

  const previousSourceKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open || !source) return;
    const sourceKey = source.substring(0, 100);
    if (previousSourceKeyRef.current !== sourceKey) {
      previousSourceKeyRef.current = sourceKey;
      setAlgorithmKind(null);
    }
    loadTraceWithReset();
  }, [open, caseType, debouncedInputSize, source, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open && !isDiagramExpanded) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPosition;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [open, isDiagramExpanded]);

  const isRecursiveOrHybrid =
    algorithmKind === "recursive" || algorithmKind === "hybrid";

  if (!open) return null;

  return (
    <BaseModalContainer
      open={open}
      onClose={onClose}
      title={t("title")}
      titleIcon="play_circle"
      closeAriaLabel={t("close")}
      zIndexClassName="z-[70]"
      sizeClassName="w-[95vw] max-w-[95vw] sm:max-w-6xl h-[90vh] max-h-[90dvh]"
      panelClassName="p-4 sm:p-6 mx-2 sm:mx-4"
      showHeader={false}
      contentClassName="p-0"
      lockBodyScroll={false}
    >
        {loading && algorithmKind === null ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-ping" />
              <div className="absolute w-8 h-8 bg-blue-500 rounded-full" />
            </div>
            <p className="text-sm text-slate-300">{t("detectingAlgorithm")}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-3 flex-shrink-0 min-w-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-blue-400 text-xl flex-shrink-0">
                    play_circle
                  </span>
                  <span className="truncate">{t("title")}</span>
                </h2>
                {trace?.algorithmKind && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      trace.algorithmKind === "recursive"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : trace.algorithmKind === "hybrid"
                          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}
                  >
                    {trace.algorithmKind === "recursive"
                      ? tAlgorithm("recursive")
                      : trace.algorithmKind === "hybrid"
                        ? tAlgorithm("hybrid")
                        : tAlgorithm("iterative")}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
                exampleArray={exampleArray}
                setExampleArray={setExampleArray}
                variant="modal"
              fetchCompleted={fetchCompleted}
              />
            </div>

            {isDiagramExpanded && structuredDiagram && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => setIsDiagramExpanded(false)}
                  role="button"
                  tabIndex={0}
                  aria-label={t("closeExpandedDiagram")}
                />
                <div className="relative z-10 w-[98vw] max-w-[98vw] h-[98vh] max-h-[98dvh] rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-2xl flex flex-col p-4 gap-3 overflow-hidden">
                  <div className="flex items-center justify-between flex-shrink-0">
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
                  <div className="flex-1 glass-card rounded-lg overflow-hidden">
                    <ExecutionGraphView
                      graph={structuredDiagram.graph}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </BaseModalContainer>
  );
}
