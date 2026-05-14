"use client";

import type {
  AnalyzeOpenResponse,
  LoopInvariant,
  RecursiveInvariant,
  ParseError,
  ParseResponse,
  Program,
} from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";

import AAButton from "@/components/AAButton";
import { AAProgressLoader } from "@/components/AAProgressLoader";
import { AnalyzerEditor } from "@/components/AnalyzerEditor";
import { EmbeddedAssistantLauncher } from "@/components/assistant/EmbeddedAssistantLauncher";
import { ASTTreeView } from "@/components/ASTTreeView";
import ComparisonModal from "@/components/ComparisonModal";
import ExportFormatSelector, {
  ExportFormatType,
} from "@/components/ExportFormatSelector";
import Footer from "@/components/Footer";
import GeneralProcedureModal from "@/components/GeneralProcedureModal";
import GPUCPUModal from "@/components/GPUCPUModal";
import Header from "@/components/Header";
import IterativeAnalysisView from "@/components/IterativeAnalysisView";
import LoopInvariantModal from "@/components/LoopInvariantModal";
import MethodSelector, {
  MethodMetadataMap,
  MethodType,
} from "@/components/MethodSelector";
import ProcedureModal from "@/components/ProcedureModal";
import RecursiveAnalysisView from "@/components/RecursiveAnalysisView";
import RecursiveInvariantModal from "@/components/RecursiveInvariantModal";
import RepairModal from "@/components/RepairModal";
import TraceDedicatedView from "@/components/TraceDedicatedView";
import TxtImportModal from "@/components/TxtImportModal";
import { getImportNormalizationSuggestions } from "@/features/analyzer/editor-support/parser/normalizeImportSuggestions";
import { requestTraceRefresh } from "@/hooks/trace/useTraceRefreshOnAnalysis";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { getApiKey, getApiKeyStatus } from "@/hooks/useApiKey";
import {
  buildBundleDetailNotes,
  normalizeAssistantLocale,
  truncateAssistantDetail,
} from "@/lib/assistant/panel-context";
import type {
  AssistantContext,
  AssistantFeatureContext,
  AssistantFocusedPanelContext,
} from "@/lib/assistant/types";
import { translateBackendContent } from "@/lib/backend-content-translator";
import {
  extractCoreData,
  isRecursiveAnalysis,
  type CoreAnalysisData,
} from "@/lib/extract-core-data";
import { analyzeASTForGPUCPU } from "@/lib/gpu-cpu-analyzer";
import { buildLlmComparisonPayload } from "@/lib/llm-compare-payload";
import { translateLlmError } from "@/lib/llm-error-translator";
import {
  getNormalizedLlmStructured,
  getNormalizedLlmText,
  parseJsonFromText,
} from "@/lib/llm-response";
import { getSavedCase, saveCase } from "@/lib/polynomial";
import {
  MAX_TXT_IMPORT_BYTES,
  looksLikeAlgorithmSourceText,
  readAndValidateTxtFile,
} from "@/lib/txt-import";
import { GrammarApiService } from "@/services/grammar-api";
import type { GPUCPUAnalysisResult } from "@/types/gpu-cpu";

function extractProcedureNameFromSource(src: string): string | null {
  // Common format: `procedureName(param1, param2) BEGIN`
  // We only need something stable for filenames.
  const match = src.match(/(^|\n)\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
  if (!match) return null;
  const name = match[2] || "";
  return name.trim() ? name.trim() : null;
}

function buildFormalCaseSummary(
  caseId: "worst" | "best" | "avg",
  analysis: AnalyzeOpenResponse | null,
) {
  const core = extractCoreData(analysis);
  if (!core) {
    return null;
  }

  return {
    caseId,
    bigO: core.big_o,
    bigOmega: core.big_omega,
    bigTheta: core.big_theta,
    efficiencyEquation: core.T_open,
    groupedCostExpression: core.T_polynomial,
  };
}

function panelText(locale: "es" | "en", es: string, en: string) {
  return locale === "es" ? es : en;
}

function appendPanelDetail(
  details: string[],
  value: string | null | undefined,
): void {
  if (value) {
    details.push(value);
  }
}

function summarizePanelText(
  locale: "es" | "en",
  value: string | undefined | null,
  maxChars = 320,
) {
  return truncateAssistantDetail(
    translateBackendContent(value ?? "", normalizeAssistantLocale(locale)),
    maxChars,
  );
}

function summarizePanelSequence(
  locale: "es" | "en",
  values: string[] | undefined,
  labels: { es: string; en: string },
  limit = 2,
): string[] {
  return (values ?? [])
    .slice(0, limit)
    .map((value, index) => {
      const summary = summarizePanelText(locale, value);
      if (!summary) {
        return null;
      }

      return `${panelText(locale, labels.es, labels.en)} ${index + 1}: ${summary}`;
    })
    .filter((value): value is string => Boolean(value));
}

function buildLineProcedureDetails(args: {
  locale: "es" | "en";
  selectedCaseLabel: string;
  selectedLine: number | null;
  analysisData: AnalyzeOpenResponse | undefined;
}): string[] {
  const { locale, selectedCaseLabel, selectedLine, analysisData } = args;
  const details: string[] = [
    panelText(
      locale,
      `Caso visible en el modal: ${selectedCaseLabel}.`,
      `Case visible in the modal: ${selectedCaseLabel}.`,
    ),
  ];

  if (selectedLine == null) {
    return details;
  }

  appendPanelDetail(
    details,
    panelText(
      locale,
      `Linea seleccionada: ${selectedLine}.`,
      `Selected line: ${selectedLine}.`,
    ),
  );

  const lineData =
    analysisData?.byLine.find((line) => line.line === selectedLine) ?? null;

  if (!lineData) {
    appendPanelDetail(
      details,
      panelText(
        locale,
        "No hay detalle de costo asociado a esa linea en los resultados visibles.",
        "There is no visible cost detail associated with that line.",
      ),
    );
    return details;
  }

  appendPanelDetail(
    details,
    panelText(
      locale,
      `Tipo de instruccion: ${lineData.kind}.`,
      `Instruction kind: ${lineData.kind}.`,
    ),
  );
  appendPanelDetail(
    details,
    lineData.ops != null
      ? panelText(
          locale,
          `Operaciones elementales por ejecucion: ${lineData.ops}.`,
          `Elementary operations per execution: ${lineData.ops}.`,
        )
      : null,
  );
  appendPanelDetail(
    details,
    lineData.ck
      ? panelText(
          locale,
          `Costo elemental de la linea: ${lineData.ck}.`,
          `Line elementary cost: ${lineData.ck}.`,
        )
      : null,
  );
  appendPanelDetail(
    details,
    lineData.count
      ? panelText(
          locale,
          `Conteo simplificado visible: ${lineData.count}.`,
          `Visible simplified count: ${lineData.count}.`,
        )
      : null,
  );
  appendPanelDetail(
    details,
    lineData.count_raw && lineData.count_raw !== lineData.count
      ? panelText(
          locale,
          `Conteo antes de simplificar: ${lineData.count_raw}.`,
          `Count before simplification: ${lineData.count_raw}.`,
        )
      : null,
  );
  appendPanelDetail(
    details,
    lineData.note
      ? panelText(
          locale,
          `Nota del analisis: ${summarizePanelText(locale, lineData.note)}`,
          `Analysis note: ${summarizePanelText(locale, lineData.note)}`,
        )
      : null,
  );

  details.push(
    ...summarizePanelSequence(
      locale,
      lineData.line_procedure,
      { es: "Paso de conteo", en: "Counting step" },
      2,
    ),
  );
  details.push(
    ...buildBundleDetailNotes(lineData.step_by_step, locale, {
      maxSteps: 2,
      includeMath: true,
    }),
  );

  return details;
}

function buildGeneralProcedureDetails(args: {
  locale: "es" | "en";
  caseLabel: string;
  analysisData: AnalyzeOpenResponse | undefined;
}): string[] {
  const { locale, caseLabel, analysisData } = args;
  const details: string[] = [
    panelText(
      locale,
      `Caso visible en el modal: ${caseLabel}.`,
      `Case visible in the modal: ${caseLabel}.`,
    ),
  ];

  if (!analysisData) {
    appendPanelDetail(
      details,
      panelText(
        locale,
        "El modal no tiene datos de procedimiento visibles en este momento.",
        "The modal has no visible procedure data right now.",
      ),
    );
    return details;
  }

  appendPanelDetail(
    details,
    analysisData.totals.T_open
      ? panelText(
          locale,
          `Ecuacion de eficiencia visible: ${analysisData.totals.T_open}.`,
          `Visible efficiency equation: ${analysisData.totals.T_open}.`,
        )
      : null,
  );
  appendPanelDetail(
    details,
    analysisData.totals.T_polynomial
      ? panelText(
          locale,
          `Forma agrupada visible por potencias o terminos dominantes: ${analysisData.totals.T_polynomial}.`,
          `Visible grouped form by powers or dominant terms: ${analysisData.totals.T_polynomial}.`,
        )
      : null,
  );
  appendPanelDetail(
    details,
    analysisData.totals.big_theta
      ? panelText(
          locale,
          `Theta final visible: ${analysisData.totals.big_theta}.`,
          `Visible final theta: ${analysisData.totals.big_theta}.`,
        )
      : null,
  );

  details.push(
    ...summarizePanelSequence(
      locale,
      analysisData.totals.procedure,
      { es: "Paso general", en: "General step" },
      2,
    ),
  );
  details.push(
    ...buildBundleDetailNotes(analysisData.totals.step_by_step, locale, {
      maxSteps: 3,
      includeMath: true,
    }),
  );

  return details;
}

function formatCaseComparisonNote(
  locale: "es" | "en",
  label: string,
  data: CoreAnalysisData | null | undefined,
) {
  if (!data) {
    return panelText(
      locale,
      `${label}: sin datos visibles.`,
      `${label}: no visible data.`,
    );
  }

  return panelText(
    locale,
    `${label}: O=${data.big_o || "n/a"}, Ω=${data.big_omega || "n/a"}, Θ=${data.big_theta || "n/a"}.`,
    `${label}: O=${data.big_o || "n/a"}, Ω=${data.big_omega || "n/a"}, Θ=${data.big_theta || "n/a"}.`,
  );
}

import {
  extractParseError,
  extractAnalysisError,
  handleAnalysisError,
  detectAndSelectMethod,
  detectRecursiveMethod,
  updateAnalysisMessageForMethod,
} from "./analyzer-helpers";

type ClassifyResponse = {
  kind: "iterative" | "recursive" | "hybrid" | "unknown";
};
type CaseType = "worst" | "average" | "best";
type TxtImportModalState = {
  title: string;
  description: string;
  details?: string[];
  showRepairAction?: boolean;
};

export default function AnalyzerPage() {
  const locale = useLocale();
  const { animateProgress } = useAnalysisProgress();
  const t = useTranslations("analyzer.progress");
  const tMethods = useTranslations("analyzer.methods");
  const tAlgorithmType = useTranslations("analyzer.algorithmType");
  const tView = useTranslations("analyzer.view");
  const tMessages = useTranslations("analyzer.messages");
  const tExport = useTranslations("analyzer.exportSelector");
  const tCases = useTranslations("analyzer.cases");
  const tExecutionTrace = useTranslations("analyzer.executionTrace");
  const tLoopInvariant = useTranslations("analyzer.loopInvariant");
  const tProcedureModal = useTranslations("analyzer.procedureModal");
  const tGeneralProcedureModal = useTranslations(
    "analyzer.generalProcedureModal",
  );
  const tGpuCpuModal = useTranslations("analyzer.gpuCpuModal");
  const tMethodSelector = useTranslations("analyzer.methodSelector");
  const tCommon = useTranslations("common");
  const getMessage = (key: string) => t(key);

  // Estados del flujo de análisis (inicial neutro para evitar hydration mismatch)
  const [source, setSource] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState(() => t("init"));
  const [algorithmType, setAlgorithmType] = useState<
    "iterative" | "recursive" | "hybrid" | "unknown" | undefined
  >(undefined);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [applicableMethods, setApplicableMethods] = useState<MethodType[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<MethodType>("master");
  const [methodMetadata, setMethodMetadata] =
    useState<MethodMetadataMap | null>(null);
  const methodSelectionPromiseRef = useRef<{
    resolve: (method: MethodType) => void;
    reject: (reason?: unknown) => void;
  } | null>(null);
  const minProgressRef = useRef<number>(0);

  // Efecto para mantener el progreso mínimo cuando el selector está visible
  useEffect(() => {
    if (showMethodSelector && minProgressRef.current > 0) {
      // Solo establecer el progreso al mínimo si es menor que el mínimo
      // No forzar retroceso si el progreso ya es mayor
      setAnalysisProgress((prev) => {
        const minProgress = minProgressRef.current;
        if (prev < minProgress) {
          return minProgress;
        }
        return prev;
      });

      // Usar un intervalo para mantener el progreso mientras el selector está visible
      // Solo ajustar si el progreso es menor que el mínimo, nunca forzar retroceso
      const intervalId = setInterval(() => {
        setAnalysisProgress((prev) => {
          const minProgress = minProgressRef.current;
          // Solo ajustar si el progreso es menor que el mínimo
          // Nunca forzar retroceso si el progreso ya avanzó más
          if (prev < minProgress) {
            return minProgress;
          }
          return prev;
        });
      }, 100); // Verificar cada 100ms

      return () => clearInterval(intervalId);
    }
  }, [showMethodSelector]);
  const [data, setData] = useState<{
    worst: AnalyzeOpenResponse | null;
    best: AnalyzeOpenResponse | "same_as_worst" | null;
    avg?: AnalyzeOpenResponse | "same_as_worst" | null;
    has_case_variability?: boolean;
    loopInvariant?: LoopInvariant | null;
    recursiveInvariant?: RecursiveInvariant | null;
  } | null>(null);

  const hasComparableData = useMemo(() => {
    if (!data) {
      return false;
    }
    const worstCore = extractCoreData(data.worst || null);
    const bestCore =
      data.best === "same_as_worst" ? null : extractCoreData(data.best || null);
    const avgCore =
      data.avg === "same_as_worst" ? null : extractCoreData(data.avg || null);
    return Boolean(worstCore || bestCore || avgCore);
  }, [data]);

  // Estados para el modal
  const [open, setOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // Estados para parsing local y AST
  const [ast, setAst] = useState<Program | null>(null);
  const [showAstModal, setShowAstModal] = useState(false);
  const [localParseOk, setLocalParseOk] = useState(false);
  const [parseErrors, setParseErrors] = useState<ParseError[] | undefined>(
    undefined,
  );
  const [txtImportModal, setTxtImportModal] =
    useState<TxtImportModalState | null>(null);
  const [isImportingTxt, setIsImportingTxt] = useState(false);
  const txtInputRef = useRef<HTMLInputElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "json">("tree");
  // Estado para modal de reparación
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [pendingImportSourceForRepair, setPendingImportSourceForRepair] =
    useState<string | null>(null);
  const [pendingImportErrorsForRepair, setPendingImportErrorsForRepair] =
    useState<ParseError[] | undefined>(undefined);
  const [hasApiKey, setHasApiKey] = useState(false);
  // Estado para comparación con LLM
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [comparisonMessage, setComparisonMessage] = useState(
    "Contactando con LLM...",
  );
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [llmAnalysisData, setLlmAnalysisData] = useState<{
    worst: CoreAnalysisData | null;
    best: CoreAnalysisData | null;
    avg: CoreAnalysisData | null;
  } | null>(null);
  const [llmNote, setLlmNote] = useState<string>("");
  // Estado para vista de seguimiento (dedicada, no modal)
  const [analyzerViewMode, setAnalyzerViewMode] = useState<
    "analysis" | "trace"
  >("analysis");
  const [hasTraceViewMounted, setHasTraceViewMounted] = useState(false);
  const [isSwitchingTrace, setIsSwitchingTrace] = useState(false);
  const [executionTraceCase, setExecutionTraceCase] = useState<
    "worst" | "best" | "avg"
  >("worst");
  // Estado para análisis GPU vs CPU
  const [showGPUCPUModal, setShowGPUCPUModal] = useState(false);
  const [gpuCpuAnalysis, setGpuCpuAnalysis] =
    useState<GPUCPUAnalysisResult | null>(null);
  const [showLoopInvariantModal, setShowLoopInvariantModal] = useState(false);
  const [showRecursiveInvariantModal, setShowRecursiveInvariantModal] =
    useState(false);
  const [recursiveFocusedPanel, setRecursiveFocusedPanel] =
    useState<AssistantFocusedPanelContext | null>(null);
  const [traceFocusedPanel, setTraceFocusedPanel] =
    useState<AssistantFocusedPanelContext | null>(null);
  const [analysisMethodKey, setAnalysisMethodKey] = useState<
    | "characteristicEquation"
    | "iterationMethod"
    | "recursionTree"
    | "masterTheorem"
    | "iterativeAnalysis"
    | null
  >(null);

  // Estados de exportación de reporte
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormats, setExportFormats] = useState<ExportFormatType[]>([]);

  // Refs para evitar memory leaks con timeouts
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar API_KEY al montar y cuando cambie (incluyendo servidor)
  useEffect(() => {
    const checkApiKey = async () => {
      const status = await getApiKeyStatus();
      setHasApiKey(status.hasAny);
    };
    checkApiKey();
    const handleApiKeyChange = async () => {
      const status = await getApiKeyStatus();
      setHasApiKey(status.hasAny);
    };
    globalThis.window.addEventListener("apiKeyChanged", handleApiKeyChange);
    return () => {
      globalThis.window.removeEventListener(
        "apiKeyChanged",
        handleApiKeyChange,
      );
    };
  }, []);

  // Cargar código y resultados desde sessionStorage tras montar (evita hydration mismatch)
  useEffect(() => {
    const savedCode = globalThis.window.sessionStorage.getItem("analyzerCode");
    if (savedCode) {
      setSource(savedCode);
    }
    const savedResults =
      globalThis.window.sessionStorage.getItem("analyzerResults");
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        globalThis.window.sessionStorage.removeItem("analyzerResults");
        globalThis.window.sessionStorage.removeItem("analyzerCode");
        if (parsed && !parsed.worst && !parsed.best) {
          setData({
            worst: parsed,
            best: null,
            avg: null,
            loopInvariant: parsed.loopInvariant || null,
            recursiveInvariant: parsed.recursiveInvariant || null,
          });
        } else if (parsed && (parsed.worst || parsed.best)) {
          setData({
            worst: parsed.worst || null,
            best: parsed.best || null,
            avg: parsed.avg || null,
            loopInvariant: parsed.loopInvariant || null,
            recursiveInvariant: parsed.recursiveInvariant || null,
          });
        }
      } catch (error) {
        console.error("Error parsing saved results:", error);
        globalThis.window.sessionStorage.removeItem("analyzerResults");
        globalThis.window.sessionStorage.removeItem("analyzerCode");
      }
    }
  }, []);

  // Manejar cambios en el estado de parsing local
  const handleParseStatusChange = (ok: boolean, _isParsing: boolean) => {
    setLocalParseOk(ok);
  };

  // Manejar cambios en los errores de parsing
  const handleErrorsChange = (errors: ParseError[] | undefined) => {
    setParseErrors(errors);
  };

  const handleTxtImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setTxtImportModal(null);
    setIsImportingTxt(true);

    const validation = await readAndValidateTxtFile(file);
    if (!validation.ok) {
      setIsImportingTxt(false);
      if (validation.reason === "invalidExtension") {
        setTxtImportModal({
          title: tView("txtImportInvalidFileTitle"),
          description: tView("txtImportOnlyTxt"),
        });
      } else if (validation.reason === "empty") {
        setTxtImportModal({
          title: tView("txtImportInvalidFileTitle"),
          description: tView("txtImportEmpty"),
        });
      } else if (validation.reason === "tooLarge") {
        setTxtImportModal({
          title: tView("txtImportInvalidFileTitle"),
          description: tView("txtImportTooLarge", {
            maxKb: Math.floor(MAX_TXT_IMPORT_BYTES / 1024),
          }),
        });
      } else if (validation.reason === "invalidFormat") {
        setTxtImportModal({
          title: tView("txtImportInvalidFileTitle"),
          description: tView("txtImportInvalidFormat"),
        });
      } else {
        setTxtImportModal({
          title: tView("txtImportInvalidFileTitle"),
          description: tView("txtImportReadError"),
        });
      }
      return;
    }

    try {
      const parseRes = await GrammarApiService.parseCode(
        validation.normalizedSource,
      );

      if (parseRes.ok) {
        setSource(validation.normalizedSource);
        setParseErrors(undefined);
        setLocalParseOk(true);
        setPendingImportSourceForRepair(null);
        setPendingImportErrorsForRepair(undefined);
        const suggestions = getImportNormalizationSuggestions(
          validation.normalizedSource,
        );
        setTxtImportModal({
          title: tView("txtImportSuccessTitle"),
          description: tView("txtImportSuccess"),
          details:
            suggestions.length > 0
              ? suggestions.map((suggestion) => suggestion.reason)
              : undefined,
        });
      } else {
        const errors = parseRes.errors || undefined;
        setParseErrors(errors);
        setLocalParseOk(false);
        const looksAlgorithm = looksLikeAlgorithmSourceText(
          validation.normalizedSource,
        );

        if (!looksAlgorithm) {
          setTxtImportModal({
            title: tView("txtImportInvalidAlgorithmTitle"),
            description: tView("txtImportNotAlgorithm"),
          });
          return;
        }

        const errorDetails = (errors || []).slice(0, 3).map((e) =>
          tMessages("lineErrorFormat", {
            line: e.line ?? 0,
            column: e.column ?? 0,
            message: e.message ?? "",
          }),
        );

        setTxtImportModal({
          title: tView("txtImportGrammarTitle"),
          description: tView("txtImportParseFailed"),
          details: [
            ...errorDetails,
            ...getImportNormalizationSuggestions(
              validation.normalizedSource,
            ).map((suggestion) => suggestion.reason),
          ],
          showRepairAction: true,
        });
        setPendingImportSourceForRepair(validation.normalizedSource);
        setPendingImportErrorsForRepair(errors);
      }
    } catch {
      setPendingImportSourceForRepair(null);
      setPendingImportErrorsForRepair(undefined);
      setTxtImportModal({
        title: tView("txtImportInvalidFileTitle"),
        description: tView("txtImportReadError"),
      });
    } finally {
      setIsImportingTxt(false);
    }
  };

  // Cleanup de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Resetear estado de copiado cuando se cierra el modal
  useEffect(() => {
    if (!showAstModal) {
      setCopied(false);
      setViewMode("tree");
    }
  }, [showAstModal]);

  // Función para copiar JSON
  const handleCopyJson = async () => {
    if (!ast) return;

    // Limpiar timeout anterior si existe
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(ast, null, 2));
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  // Handler para el clic del botón de análisis
  const handleAnalyze = async () => {
    // Verificar que no esté ya analizando
    if (analyzing) return;

    // Activar estado de carga inmediatamente
    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisMessage(getMessage("init"));
    setAlgorithmType(undefined);
    setIsAnalysisComplete(false);
    setAnalysisError(null);
    setAnalysisMethodKey(null);

    try {
      // 1) Parsear el código (0-20%)
      setAnalysisMessage(getMessage("parsing"));
      const parsePromise = fetch("/api/grammar/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      }).then((r) => r.json() as Promise<ParseResponse>);

      // Animar progreso mientras se parsea (espera a que parsePromise se resuelva)
      const parseRes = (await animateProgress(
        0,
        20,
        800,
        setAnalysisProgress,
        parsePromise,
      )) as ParseResponse;

      if (!parseRes.ok) {
        console.error("Error en parse:", parseRes);
        const errorMsg = extractParseError(parseRes);
        handleAnalysisError(
          errorMsg,
          setAnalyzing,
          setAnalysisProgress,
          setAnalysisMessage,
          setAlgorithmType,
          setIsAnalysisComplete,
          setAnalysisError,
          getMessage,
        );
        return;
      }

      // 2) Clasificar el algoritmo (20-40%)
      setAnalysisMessage(getMessage("classifying"));
      let kind: ClassifyResponse["kind"];
      try {
        const clsPromise = fetch("/api/llm/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source,
            mode: "local",
          }),
        });

        // Animar progreso mientras se clasifica (espera a que clsPromise se resuelva)
        const clsResponse = (await animateProgress(
          20,
          40,
          1200,
          setAnalysisProgress,
          clsPromise,
        )) as Response;

        if (clsResponse.ok) {
          const cls = (await clsResponse.json()) as ClassifyResponse & {
            method?: string;
            mode?: string;
          };
          kind = cls.kind;
          setAlgorithmType(kind);
          setAnalysisMessage(
            t("algorithmIdentified", { type: formatAlgorithmKind(kind) }),
          );
          console.log(
            `[Analyzer] Clasificación: ${kind} (método: ${cls.method})`,
          );
        } else {
          throw new Error(`HTTP ${clsResponse.status}`);
        }
      } catch (error) {
        console.error(`[Analyzer] Error en clasificación:`, error);
        handleAnalysisError(
          t("classifyError"),
          setAnalyzing,
          setAnalysisProgress,
          setAnalysisMessage,
          setAlgorithmType,
          setIsAnalysisComplete,
          setAnalysisError,
          getMessage,
        );
        return;
      }

      // 3) Realizar el análisis de complejidad (40-80%)
      const isRecursive = kind === "recursive" || kind === "hybrid";

      let progressBeforeAnalysis: number;
      let selectedMethod: MethodType | undefined | null = undefined;

      if (isRecursive) {
        setAnalysisMessage(getMessage("verifyingConditions"));
        await animateProgress(40, 50, 300, setAnalysisProgress);
        setAnalysisMessage(getMessage("extractingRecurrence"));
        await animateProgress(50, 65, 400, setAnalysisProgress);
        setAnalysisMessage(getMessage("normalizingRecurrence"));
        await animateProgress(65, 75, 300, setAnalysisProgress);
        setAnalysisMessage(getMessage("detectingMethod"));
        await animateProgress(75, 85, 500, setAnalysisProgress);

        // Guardar el progreso actual antes de detectar métodos
        const progressBeforeMethodSelection = 85;

        // Detectar métodos aplicables
        selectedMethod = await detectAndSelectMethod(
          source,
          kind,
          locale === "es" ? "es" : "en",
          progressBeforeMethodSelection,
          setAnalysisMessage,
          setAnalysisProgress,
          setApplicableMethods,
          setDefaultMethod,
          setMethodMetadata,
          setShowMethodSelector,
          minProgressRef,
          methodSelectionPromiseRef,
          animateProgress,
          getMessage,
        );
        if (selectedMethod === null) {
          setAnalysisMessage(getMessage("analysisStopped"));
          setShowMethodSelector(false);
          setAnalyzing(false);
          setAnalysisProgress(0);
          setAlgorithmType(undefined);
          return;
        }

        progressBeforeAnalysis = 90;
      } else {
        setAnalysisMessage(getMessage("findingSums"));
        await animateProgress(40, 50, 200, setAnalysisProgress);
        setAnalysisMessage(getMessage("closingSums"));
        await animateProgress(50, 55, 200, setAnalysisProgress);
        progressBeforeAnalysis = 55;
      }

      // Realizar una sola petición que trae todos los casos (worst, best y avg)
      const analyzeBody: {
        source: string;
        mode: string;
        avgModel?: { mode: string; predicates?: Record<string, string> };
        algorithm_kind?: string;
        preferred_method?: MethodType;
        locale?: string;
      } = {
        source,
        mode: "all",
        avgModel: {
          mode: "uniform",
          predicates: {},
        },
        algorithm_kind: kind, // Enviar el tipo de algoritmo al backend
        locale: locale === "es" ? "es" : "en", // Etiquetas del procedimiento en el idioma del usuario
      };

      // Solo agregar preferred_method si es recursivo y hay un método seleccionado
      if (isRecursive && selectedMethod) {
        analyzeBody.preferred_method = selectedMethod;
      }

      // Actualizar mensaje antes de iniciar el análisis real
      if (isRecursive) {
        setAnalysisMessage(getMessage("calculatingComplexity"));
      } else {
        setAnalysisMessage(getMessage("analyzing"));
      }

      const analyzePromise = fetch("/api/analyze/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyzeBody),
      }).then((r) => r.json());

      // Animar progreso mientras se analiza (continuar desde donde quedó según el tipo)
      // Para recursivos: 90 → 95, para iterativos: 55 → 95
      const analyzeRes = (await animateProgress(
        progressBeforeAnalysis,
        95,
        2500,
        setAnalysisProgress,
        analyzePromise,
      )) as {
        ok: boolean;
        has_case_variability?: boolean;
        worst?: AnalyzeOpenResponse;
        best?: AnalyzeOpenResponse | "same_as_worst";
        avg?: AnalyzeOpenResponse | "same_as_worst";
        loopInvariant?: LoopInvariant;
        recursiveInvariant?: RecursiveInvariant;
        errors?: Array<{ message: string; line?: number; column?: number }>;
      };

      // Verificar errores
      if (!analyzeRes.ok) {
        console.error("Error en análisis:", analyzeRes);
        const errorMsg = extractAnalysisError(analyzeRes);
        handleAnalysisError(
          errorMsg,
          setAnalyzing,
          setAnalysisProgress,
          setAnalysisMessage,
          setAlgorithmType,
          setIsAnalysisComplete,
          setAnalysisError,
          getMessage,
        );
        return;
      }

      // Verificar que tenemos worst y best (avg es opcional)
      if (!analyzeRes.worst || !analyzeRes.best) {
        console.error(
          "Error: No se recibieron worst y best en la respuesta",
          analyzeRes,
        );
        setAnalysisError(
          "Error: No se pudieron obtener worst y best del análisis",
        );
        setTimeout(() => {
          setAnalyzing(false);
          setAnalysisProgress(0);
          setAnalysisMessage(getMessage("init"));
          setAlgorithmType(undefined);
          setIsAnalysisComplete(false);
          setAnalysisError(null);
        }, 3000);
        return;
      }

      // 6) Detectar el método usado y actualizar mensaje
      let methodKey:
        | "characteristicEquation"
        | "iterationMethod"
        | "recursionTree"
        | "masterTheorem"
        | "iterativeAnalysis" = "iterativeAnalysis";
      if (isRecursive && analyzeRes.worst?.totals?.recurrence) {
        const bestForDetection =
          analyzeRes.best === "same_as_worst" ? null : analyzeRes.best;
        methodKey = detectRecursiveMethod(analyzeRes.worst, bestForDetection);
        updateAnalysisMessageForMethod(
          methodKey,
          setAnalysisMessage,
          getMessage,
        );
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setAnalysisMethodKey(methodKey);

      // Actualizar los datos con todos los casos (worst, best y avg si está disponible)
      setData({
        worst: analyzeRes.worst,
        best: analyzeRes.best,
        avg: analyzeRes.avg, // Puede ser undefined si falló, pero el frontend lo maneja
        has_case_variability: analyzeRes.has_case_variability, // Incluir variabilidad de casos
        loopInvariant: analyzeRes.loopInvariant || null,
        recursiveInvariant: analyzeRes.recursiveInvariant ?? null,
      });

      // Asegurar que algorithmType se mantenga usando la variable local 'kind'
      // que ya tiene el valor correcto (no depender del estado que puede no haberse actualizado)
      // IMPORTANTE: Usar 'kind' en lugar de 'algorithmType' para evitar problemas de timing
      if (kind) {
        // Usar el tipo que ya fue clasificado (puede ser "hybrid", "recursive", etc.)
        setAlgorithmType(kind);
        console.log(
          `[Analyzer] algorithmType establecido desde clasificación: ${kind}`,
        );
      } else if (
        analyzeRes.worst?.totals?.recurrence ||
        (analyzeRes.best !== "same_as_worst" &&
          analyzeRes.best?.totals?.recurrence)
      ) {
        // Fallback: si no hay kind pero hay recurrencia, asumir recursive
        // (esto no debería pasar normalmente, pero es un fallback de seguridad)
        setAlgorithmType("recursive");
        console.log(
          '[Analyzer] algorithmType establecido a "recursive" como fallback basado en datos',
        );
      }

      // Debug: verificar que el tipo de algoritmo sea correcto
      console.log("[Analyzer] Datos actualizados:", {
        algorithmType: algorithmType || "recursive (detectado desde datos)",
        method: methodKey,
        hasWorst: !!analyzeRes.worst,
        hasBest: !!analyzeRes.best,
        hasAvg: !!analyzeRes.avg,
        worstHasRecurrence: !!analyzeRes.worst?.totals?.recurrence,
        worstHasMaster: !!analyzeRes.worst?.totals?.master,
        worstHasIteration: !!analyzeRes.worst?.totals?.iteration,
        worstHasRecursionTree: !!analyzeRes.worst?.totals?.recursion_tree,
      });

      // 7) Mostrar completado y cerrar de forma suave
      setAnalysisMessage(
        t("completeWithMethod", { method: tMethods(methodKey) }),
      );
      setIsAnalysisComplete(true);
      requestTraceRefresh();

      // Animar a 100% antes de cerrar
      await animateProgress(95, 100, 300, setAnalysisProgress);

      // Esperar un momento para mostrar el mensaje de completado
      // El loader iniciará su animación de fade-out automáticamente después de 300ms
      await new Promise((resolve) => setTimeout(resolve, 900));

      // Cerrar loader después de que la animación de fade-out haya comenzado
      // La animación dura 300ms, así que esperamos un poco más para que termine
      setAnalyzing(false);

      // Resetear estados después de que termine la animación de cierre
      setTimeout(() => {
        setAnalysisProgress(0);
        setAnalysisMessage(getMessage("init"));
        setAlgorithmType(undefined);
        setIsAnalysisComplete(false);
      }, 350);
    } catch (error) {
      console.error("[Analyzer] Error inesperado:", error);
      const rawMsg =
        error instanceof Error
          ? error.message
          : "Error inesperado durante el análisis";
      setAnalysisError(tMessages(translateLlmError(rawMsg)));
      setTimeout(() => {
        setAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisMessage(getMessage("init"));
        setAlgorithmType(undefined);
        setIsAnalysisComplete(false);
        setAnalysisError(null);
      }, 3000);
    }
  };

  // Handler para comparar con LLM
  const handleCompareWithLLM = async () => {
    if (!data || !hasApiKey || !hasComparableData) return;

    try {
      setIsComparing(true);
      setComparisonProgress(0);
      setComparisonMessage("Contactando con LLM...");

      // Determinar tipo de algoritmo y datos core
      const bestForAnalysis = data.best === "same_as_worst" ? null : data.best;
      const avgForAnalysis = data.avg === "same_as_worst" ? null : data.avg;
      const isRecursive = isRecursiveAnalysis(
        data.worst || bestForAnalysis || avgForAnalysis || null,
      );

      // Extraer datos core de todos los casos para iterativo
      const ownCoreDataWorst = extractCoreData(data.worst || null);
      // Si best o avg es "same_as_worst", usar los datos del worst (son iguales)
      const ownCoreDataBest =
        data.best === "same_as_worst"
          ? ownCoreDataWorst
          : extractCoreData(data.best || null);
      const ownCoreDataAvg =
        data.avg === "same_as_worst"
          ? ownCoreDataWorst
          : extractCoreData(data.avg || null);

      // Para recursivo, usar worst como principal
      const ownCoreData = isRecursive ? ownCoreDataWorst : ownCoreDataWorst;

      if (!ownCoreData) {
        throw new Error("No se pudieron extraer los datos core del análisis");
      }

      // Preparar todos los datos del análisis para enviar al LLM
      const fullAnalysisData =
        buildLlmComparisonPayload({
          data,
          isRecursive,
          worst: ownCoreDataWorst,
          best: ownCoreDataBest,
          avg: ownCoreDataAvg,
        }) ?? {};

      // Detectar el método usado en el análisis propio (si es recursivo)
      let ownMethod: string | undefined = undefined;
      if (isRecursive) {
        // Intentar obtener el método desde ownCoreDataWorst
        ownMethod = ownCoreDataWorst?.method;

        // Si no está en ownCoreDataWorst, intentar desde data.worst
        if (!ownMethod && data.worst?.totals?.recurrence?.method) {
          ownMethod = data.worst.totals.recurrence.method;
        }
      }

      // Preparación rápida inicial
      setComparisonMessage("Preparando datos...");
      await animateProgress(0, 5, 200, setComparisonProgress);

      // Construir instrucción sobre el método a usar
      let methodInstruction = "";
      if (ownMethod && isRecursive) {
        const methodNames: Record<string, string> = {
          characteristic_equation: tMethods("characteristicEquation"),
          iteration: tMethods("iterationMethod"),
          master: tMethods("masterTheorem"),
          recursion_tree: tMethods("recursionTree"),
        };
        const methodDisplayName = methodNames[ownMethod] || ownMethod;
        methodInstruction = `\n**MÉTODO A USAR (CRÍTICO):**
- El análisis propio utilizó el método "${methodDisplayName}" (${ownMethod})
- **DEBES usar el MISMO método** en tu análisis para poder comparar correctamente
- Si el análisis propio usó "${ownMethod}", tu análisis también debe usar "${ownMethod}" y proporcionar todos los campos requeridos para ese método
- Solo si el método usado en el análisis propio no es aplicable o es incorrecto, puedes usar un método alternativo, pero debes justificarlo en tu nota`;
      }

      const prompt = `Analiza el siguiente algoritmo y proporciona un análisis de complejidad detallado.

**CÓDIGO DEL ALGORITMO:**
\`\`\`pseudocode
${source}
\`\`\`

**ANÁLISIS PROPIO COMPLETO (para que puedas dar una observación real):**
${JSON.stringify(fullAnalysisData, null, 2)}${methodInstruction}${(() => {
        // Detectar si hay variabilidad de casos en el análisis propio
        const hasVariability = data.has_case_variability === true;
        const hasBestCase = data.best !== null && data.best !== undefined;
        const hasAvgCase = data.avg !== null && data.avg !== undefined;

        if (hasVariability && (hasBestCase || hasAvgCase)) {
          return `\n\n**⚠️ CRÍTICO - VARIABILIDAD DE CASOS (LEE ESTO CON ATENCIÓN):**
- El análisis propio tiene variabilidad entre worst, best y average case (has_case_variability: true)
- **OBLIGATORIO: DEBES proporcionar los 3 casos (worst, best, avg) en tu respuesta**, NO solo worst
- **ESTRUCTURA REQUERIDA**: Tu respuesta DEBE tener esta estructura:
  {
    "analysis": {
      "worst": { ... todos los campos del análisis del peor caso ... },
      "best": { ... todos los campos del análisis del mejor caso ... },
      "avg": { ... todos los campos del análisis del caso promedio ... }
    },
    "note": "..."
  }
- Si el análisis propio muestra diferentes complejidades para worst/best/avg, tu análisis también debe mostrar los 3 casos
- El campo "analysis" DEBE contener objetos separados para "worst", "best" y "avg" cuando hay variabilidad
- NO omitas los casos best y avg cuando el análisis propio los tiene
- Si el análisis propio tiene worst, best y avg, tu respuesta DEBE tener worst, best y avg también`;
        }
        return "";
      })()}

**INSTRUCCIONES:**
1. Analiza el algoritmo proporcionado
2. Determina si es iterativo o recursivo
3. Calcula la complejidad temporal y espacial
4. ${ownMethod && isRecursive ? `**USA EL MISMO MÉTODO QUE EL ANÁLISIS PROPIO** (${ownMethod})` : "Aplica los métodos apropiados (Teorema Maestro, Iteración, Árbol de Recursión, Ecuación Característica, etc.)"}
5. **Haz que tu salida coincida con el sistema paso a paso de AALIE**:
   - Si reportas un caso iterativo, incluye \`step_by_step\` con el walkthrough del caso (\`method: "iterative_case"\`)
   - Si reportas un método recursivo (\`characteristic_equation\`, \`iteration\`, \`master\`, \`recursion_tree\`), ese objeto DEBE incluir su \`step_by_step\`
   - Respeta la estructura de \`steps\`, \`overallStatus\`, \`summary\`, \`conceptNote\`, \`math.primaryLatex\` y \`math.items\`
6. Proporciona todos los datos core del análisis en formato JSON
7. **IMPORTANTE**: Compara tu análisis con el análisis propio proporcionado y da una observación REAL y específica (máx. 150 caracteres) sobre:
   - La precisión del análisis propio
   - Si hay diferencias o coincidencias
   - Si hay aspectos que podrían mejorarse
   - Un adjetivo calificativo breve
   La nota debe comenzar con un emoji de cara (😊, 😐, 😕, etc.) seguido de tu observación

**IMPORTANTE:**
- Usa formato LaTeX para todas las expresiones matemáticas
- La nota debe ser una observación REAL comparando tu análisis con el proporcionado, no genérica
- Devuelve SOLO un objeto JSON válido según el schema definido`;

      // Llamar al LLM
      const apiKey = getApiKey();

      setComparisonMessage("Enviando solicitud a Gemini 2.5 Pro...");
      await animateProgress(5, 10, 200, setComparisonProgress);

      // Progreso variable durante la petición: más lento al inicio, más rápido en el medio, lento al final
      // Va de 10% a 95% durante ~20 segundos
      const targetProgress = 95;
      const estimatedDuration = 20000; // ~20 segundos
      const startTime = Date.now();

      // Mensajes que cambian secuencialmente durante la espera (no se repiten)
      const waitingMessages = [
        "Esperando respuesta del LLM...",
        "Analizando algoritmo...",
        "Calculando complejidad...",
        "Comparando análisis...",
        "Generando observaciones...",
        "Finalizando comparación...",
      ];

      let messageIndex = 0;
      const messageChangeInterval = 3000; // Cambiar mensaje cada 3 segundos
      let lastMessageChange = Date.now();

      // Función para calcular progreso con curva más suave
      const calculateProgress = (elapsed: number) => {
        // Usar una curva ease-in-out más suave: lento al inicio, rápido en el medio, lento al final
        const progress = elapsed / estimatedDuration;
        // Aplicar curva ease-in-out más suave (usando seno para transición más gradual)
        // Esto hace que el inicio sea más lento que la curva cúbica anterior
        const easedProgress =
          progress < 0.5
            ? 2 * progress * progress // Ease-in: más lento al inicio
            : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Ease-out: más lento al final
        return 10 + (targetProgress - 10) * Math.min(easedProgress, 0.99); // Cap at 99% of target
      };

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = calculateProgress(elapsed);

        // Cambiar mensaje periódicamente de forma secuencial (no se repiten)
        if (Date.now() - lastMessageChange >= messageChangeInterval) {
          if (messageIndex < waitingMessages.length - 1) {
            messageIndex = messageIndex + 1;
            setComparisonMessage(waitingMessages[messageIndex]);
            lastMessageChange = Date.now();
          }
          // Si ya llegamos al último mensaje, mantenerlo
        }

        setComparisonProgress((prev) => {
          // Solo avanzar si el nuevo progreso es mayor
          if (newProgress > prev && newProgress < targetProgress) {
            return newProgress;
          }
          // Si llegamos al límite, mantener en 95%
          if (prev >= targetProgress - 0.5) {
            return targetProgress;
          }
          return prev;
        });
      }, 100); // Actualizar cada 100ms para suavidad

      // Establecer primer mensaje
      setComparisonMessage(waitingMessages[0]);

      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: "compare",
          prompt,
          apiKey: apiKey || undefined,
          locale,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error || `HTTP error! status: ${response.status}`,
        );
      }

      // Cuando recibimos la respuesta, ir de 95% a 100%
      setComparisonMessage("Procesando respuesta...");
      await animateProgress(95, 100, 300, setComparisonProgress);

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || tMessages("llmResponseError"));
      }

      setComparisonMessage("Generando comparación...");

      const structuredPayload =
        getNormalizedLlmStructured<Record<string, unknown>>(result);
      const llmResponseText = getNormalizedLlmText(result);
      if (!llmResponseText && !structuredPayload) {
        throw new Error("No se recibió respuesta del LLM");
      }

      // Parsear JSON de la respuesta
      let llmResponse: {
        analysis?: Record<string, unknown>;
        time_complexity?: Record<string, unknown>;
        note?: string;
        algorithm_type?: string;
      };
      if (structuredPayload && typeof structuredPayload === "object") {
        llmResponse = structuredPayload;
      } else {
        const parsed =
          parseJsonFromText<Record<string, unknown>>(llmResponseText);
        if (parsed) {
          llmResponse = parsed as {
            analysis?: Record<string, unknown>;
            time_complexity?: Record<string, unknown>;
            note?: string;
            algorithm_type?: string;
          };
        } else {
          throw new Error(tMessages("llmParseError"));
        }
      }

      // Convertir datos del LLM al formato CoreAnalysisData
      // El LLM puede devolver el análisis de diferentes formas:
      // 1. { analysis: { worst: {...}, best: {...}, avg: {...} }, note: "..." }
      // 2. { analysis: { worst: {...}, best: {...}, avg: {... } }, note: "..." }
      // 3. { analysis: {...}, note: "..." } (un solo objeto)
      // 4. { analysis: { time_complexity: {...}, space_complexity: {...} }, note: "..." } (estructura alternativa)
      // 5. { time_complexity: { analysis: {...} }, note: "..." } (estructura directa)

      // Variable para rastrear si ya se procesaron los datos
      let dataProcessed = false;

      // Primero verificar si time_complexity está directamente en llmResponse
      if (
        llmResponse.time_complexity &&
        typeof llmResponse.time_complexity === "object"
      ) {
        const timeComplexity = llmResponse.time_complexity as Record<
          string,
          unknown
        >;

        // Verificar si time_complexity tiene directamente recurrence, method, characteristic_equation, etc.
        // (estructura para recursivos: { time_complexity: { recurrence, method, characteristic_equation/iteration/master, big_theta } })
        if (
          timeComplexity.recurrence ||
          timeComplexity.method ||
          timeComplexity.characteristic_equation ||
          timeComplexity.iteration ||
          timeComplexity.master
        ) {
          const convertRecursiveAnalysis = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};

            // Notaciones asintóticas
            if (
              timeComplexity.big_theta &&
              typeof timeComplexity.big_theta === "string"
            )
              result.big_theta = timeComplexity.big_theta;
            if (
              timeComplexity.big_o &&
              typeof timeComplexity.big_o === "string"
            )
              result.big_o = timeComplexity.big_o;
            if (
              timeComplexity.big_O &&
              typeof timeComplexity.big_O === "string"
            )
              result.big_o = timeComplexity.big_O;
            if (
              timeComplexity.big_omega &&
              typeof timeComplexity.big_omega === "string"
            )
              result.big_omega = timeComplexity.big_omega;
            if (
              timeComplexity.big_Omega &&
              typeof timeComplexity.big_Omega === "string"
            )
              result.big_omega = timeComplexity.big_Omega;

            // Extraer recurrence
            if (
              timeComplexity.recurrence &&
              typeof timeComplexity.recurrence === "object"
            ) {
              const recurrence = timeComplexity.recurrence as Record<
                string,
                unknown
              >;
              result.recurrence = {
                type:
                  (recurrence.type as "divide_conquer" | "linear_shift") ||
                  "linear_shift",
                form: (recurrence.form as string) || "",
                a: (recurrence.a as number) || undefined,
                b: (recurrence.b as number) || undefined,
                f: (recurrence.f as string) || undefined,
                order: (recurrence.order as number) || undefined,
                shifts: (recurrence.shifts as number[]) || undefined,
                coefficients:
                  (recurrence.coefficients as number[]) || undefined,
                "g(n)": (recurrence["g(n)"] as string) || undefined,
                n0: (recurrence.n0 as number) || undefined,
                method: (timeComplexity.method as string) || undefined,
              };
            }

            // Extraer method
            if (
              timeComplexity.method &&
              typeof timeComplexity.method === "string"
            ) {
              result.method = timeComplexity.method;
            }

            // Extraer characteristic_equation (prioridad alta)
            if (
              timeComplexity.characteristic_equation &&
              typeof timeComplexity.characteristic_equation === "object"
            ) {
              const charEq = timeComplexity.characteristic_equation as Record<
                string,
                unknown
              >;
              result.characteristic_equation = {
                equation: (charEq.equation as string) || "",
                roots:
                  (charEq.roots as Array<{
                    root: string;
                    multiplicity: number;
                  }>) || undefined,
                dominant_root: (charEq.dominant_root as string) || undefined,
                growth_rate: (charEq.growth_rate as number) || undefined,
                homogeneous_solution:
                  (charEq.homogeneous_solution as string) || "",
                particular_solution:
                  (charEq.particular_solution as string) || undefined,
                general_solution:
                  (charEq.general_solution as string) || undefined,
                closed_form: (charEq.closed_form as string) || "",
                theta: (charEq.theta as string) || result.big_theta || "",
              };
              // Usar theta de characteristic_equation si está disponible
              if (result.characteristic_equation.theta) {
                result.big_theta = result.characteristic_equation.theta;
              }
            }

            // Extraer iteration
            if (
              timeComplexity.iteration &&
              typeof timeComplexity.iteration === "object"
            ) {
              const iteration = timeComplexity.iteration as Record<
                string,
                unknown
              >;
              const baseCase = iteration.base_case as
                | Record<string, unknown>
                | undefined;
              const summation = iteration.summation as
                | Record<string, unknown>
                | undefined;

              result.iteration = {
                g_function: (iteration.g_function as string) || "",
                expansions: (iteration.expansions as string[]) || [],
                general_form: (iteration.general_form as string) || "",
                base_case: {
                  condition: (baseCase?.condition as string) || "",
                  k: (baseCase?.k as string) || "",
                },
                summation: {
                  expression: (summation?.expression as string) || "",
                  evaluated: (summation?.evaluated as string) || "",
                },
                theta: (iteration.theta as string) || result.big_theta || "",
              };
              // Usar theta de iteration si está disponible
              if (result.iteration.theta) {
                result.big_theta = result.iteration.theta;
              }
            }

            // Extraer master
            if (
              timeComplexity.master &&
              typeof timeComplexity.master === "object"
            ) {
              const master = timeComplexity.master as Record<string, unknown>;
              result.master = {
                case: (master.case as 1 | 2 | 3 | null) || null,
                nlogba: (master.nlogba as string) || "",
                comparison:
                  (master.comparison as
                    | "smaller"
                    | "equal"
                    | "larger"
                    | null) || null,
                theta: (master.theta as string | null) || null,
              };
              // Usar theta de master si está disponible
              if (result.master.theta) {
                result.big_theta = result.master.theta;
              }
            }

            return Object.keys(result).length > 0 ? result : null;
          };

          const recursiveResult = convertRecursiveAnalysis();

          if (recursiveResult) {
            setLlmAnalysisData({
              worst: recursiveResult,
              best: null,
              avg: null,
            });
            dataProcessed = true;
          }
        }
        // Verificar si time_complexity tiene analysis
        else if (
          timeComplexity.analysis &&
          typeof timeComplexity.analysis === "object"
        ) {
          const analysisData = timeComplexity.analysis as Record<
            string,
            unknown
          >;
          const convertAnalysisData = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};

            // T_open y T_polynomial
            if (analysisData.T_open && typeof analysisData.T_open === "string")
              result.T_open = analysisData.T_open;
            if (
              analysisData.T_polynomial &&
              typeof analysisData.T_polynomial === "string"
            )
              result.T_polynomial = analysisData.T_polynomial;

            // Notaciones asintóticas
            if (
              analysisData.big_theta &&
              typeof analysisData.big_theta === "string"
            )
              result.big_theta = analysisData.big_theta;
            if (analysisData.big_o && typeof analysisData.big_o === "string")
              result.big_o = analysisData.big_o;
            if (analysisData.big_O && typeof analysisData.big_O === "string")
              result.big_o = analysisData.big_O;
            if (
              analysisData.big_omega &&
              typeof analysisData.big_omega === "string"
            )
              result.big_omega = analysisData.big_omega;
            if (
              analysisData.big_Omega &&
              typeof analysisData.big_Omega === "string"
            )
              result.big_omega = analysisData.big_Omega;

            return Object.keys(result).length > 0 ? result : null;
          };

          const analysisResult = convertAnalysisData();

          // Para iterativo, usar el mismo análisis para worst, best y avg
          if (analysisResult) {
            setLlmAnalysisData({
              worst: analysisResult,
              best: analysisResult,
              avg: analysisResult,
            });
            dataProcessed = true; // Marcar que ya procesamos los datos
          }
        } else if (
          timeComplexity.worst ||
          timeComplexity.best ||
          timeComplexity.avg
        ) {
          // Si time_complexity tiene worst, best, avg directamente
          const convertTimeComplexityCase = (
            caseData: unknown,
          ): CoreAnalysisData | null => {
            if (!caseData || typeof caseData !== "object") return null;
            const data = caseData as Record<string, unknown>;

            const result: CoreAnalysisData = {};
            if (data.T_open && typeof data.T_open === "string")
              result.T_open = data.T_open;
            if (data.T_polynomial && typeof data.T_polynomial === "string")
              result.T_polynomial = data.T_polynomial;
            if (data.big_theta && typeof data.big_theta === "string")
              result.big_theta = data.big_theta;
            if (data.big_o && typeof data.big_o === "string")
              result.big_o = data.big_o;
            if (data.big_O && typeof data.big_O === "string")
              result.big_o = data.big_O;
            if (data.big_omega && typeof data.big_omega === "string")
              result.big_omega = data.big_omega;
            if (data.big_Omega && typeof data.big_Omega === "string")
              result.big_omega = data.big_Omega;

            return Object.keys(result).length > 0 ? result : null;
          };

          setLlmAnalysisData({
            worst: convertTimeComplexityCase(timeComplexity.worst),
            best: convertTimeComplexityCase(timeComplexity.best),
            avg: convertTimeComplexityCase(timeComplexity.avg),
          });
        }
      }

      // Solo procesar llmResponse.analysis si no se procesó time_complexity.analysis
      const llmAnalysis = llmResponse.analysis || {};

      // Si el análisis tiene worst, best, avg directamente, convertirlos correctamente
      if (
        !dataProcessed &&
        (llmAnalysis.worst || llmAnalysis.best || llmAnalysis.avg)
      ) {
        // Función para convertir un caso del LLM a CoreAnalysisData
        const convertLLMCase = (caseData: unknown): CoreAnalysisData | null => {
          if (!caseData || typeof caseData !== "object") return null;
          const data = caseData as Record<string, unknown>;

          const result: CoreAnalysisData = {};

          // T_open y T_polynomial
          if (data.T_open && typeof data.T_open === "string")
            result.T_open = data.T_open;
          if (data.T_polynomial && typeof data.T_polynomial === "string")
            result.T_polynomial = data.T_polynomial;

          // Notaciones asintóticas
          if (data.big_theta && typeof data.big_theta === "string")
            result.big_theta = data.big_theta;
          if (data.big_o && typeof data.big_o === "string")
            result.big_o = data.big_o;
          if (data.big_O && typeof data.big_O === "string")
            result.big_o = data.big_O;
          if (data.big_omega && typeof data.big_omega === "string")
            result.big_omega = data.big_omega;
          if (data.big_Omega && typeof data.big_Omega === "string")
            result.big_omega = data.big_Omega;

          // Recurrence
          if (data.recurrence && typeof data.recurrence === "object") {
            const recurrence = data.recurrence as Record<string, unknown>;
            result.recurrence = {
              type:
                (recurrence.type as "divide_conquer" | "linear_shift") ||
                "linear_shift",
              form: (recurrence.form as string) || "",
              a: (recurrence.a as number) || undefined,
              b: (recurrence.b as number) || undefined,
              f: (recurrence.f as string) || undefined,
              order: (recurrence.order as number) || undefined,
              shifts: (recurrence.shifts as number[]) || undefined,
              coefficients: (recurrence.coefficients as number[]) || undefined,
              "g(n)": (recurrence["g(n)"] as string) || undefined,
              n0: (recurrence.n0 as number) || undefined,
              method: (recurrence.method as string) || undefined,
            };
          }

          // Method
          if (data.method && typeof data.method === "string") {
            result.method = data.method;
          }

          // Characteristic equation
          if (
            data.characteristic_equation &&
            typeof data.characteristic_equation === "object"
          ) {
            const charEq = data.characteristic_equation as Record<
              string,
              unknown
            >;
            result.characteristic_equation = {
              equation: (charEq.equation as string) || "",
              roots:
                (charEq.roots as Array<{
                  root: string;
                  multiplicity: number;
                }>) || undefined,
              dominant_root: (charEq.dominant_root as string) || undefined,
              growth_rate: (charEq.growth_rate as number) || undefined,
              homogeneous_solution:
                (charEq.homogeneous_solution as string) || "",
              particular_solution:
                (charEq.particular_solution as string) || undefined,
              general_solution:
                (charEq.general_solution as string) || undefined,
              closed_form: (charEq.closed_form as string) || "",
              theta: (charEq.theta as string) || result.big_theta || "",
            };
            if (result.characteristic_equation.theta) {
              result.big_theta = result.characteristic_equation.theta;
            }
          }

          // Iteration
          if (data.iteration && typeof data.iteration === "object") {
            const iteration = data.iteration as Record<string, unknown>;
            const baseCase = iteration.base_case as
              | Record<string, unknown>
              | undefined;
            const summation = iteration.summation as
              | Record<string, unknown>
              | undefined;

            result.iteration = {
              g_function: (iteration.g_function as string) || "",
              expansions: (iteration.expansions as string[]) || [],
              general_form: (iteration.general_form as string) || "",
              base_case: {
                condition: (baseCase?.condition as string) || "",
                k: (baseCase?.k as string) || "",
              },
              summation: {
                expression: (summation?.expression as string) || "",
                evaluated: (summation?.evaluated as string) || "",
              },
              theta: (iteration.theta as string) || result.big_theta || "",
            };
            if (result.iteration.theta) {
              result.big_theta = result.iteration.theta;
            }
          }

          // Master
          if (data.master && typeof data.master === "object") {
            const master = data.master as Record<string, unknown>;
            result.master = {
              case: (master.case as 1 | 2 | 3 | null) || null,
              nlogba: (master.nlogba as string) || "",
              comparison:
                (master.comparison as "smaller" | "equal" | "larger" | null) ||
                null,
              theta: (master.theta as string | null) || null,
            };
            if (result.master.theta) {
              result.big_theta = result.master.theta;
            }
          }

          return Object.keys(result).length > 0 ? result : null;
        };

        setLlmAnalysisData({
          worst: convertLLMCase(llmAnalysis.worst),
          best: convertLLMCase(llmAnalysis.best),
          avg: convertLLMCase(llmAnalysis.avg),
        });
        dataProcessed = true;
      } else if (
        !dataProcessed &&
        llmAnalysis.time_complexity &&
        typeof llmAnalysis.time_complexity === "object"
      ) {
        // Estructura: { analysis: { time_complexity: { worst: {...}, best: {...}, avg: {...} } } }
        // O también: { analysis: { time_complexity: { recurrence, method, characteristic_equation, ... } } }
        const timeComplexity = llmAnalysis.time_complexity as Record<
          string,
          unknown
        >;

        // Verificar si time_complexity tiene directamente recurrence, method, characteristic_equation, etc.
        // (estructura para recursivos)
        if (
          timeComplexity.recurrence ||
          timeComplexity.method ||
          timeComplexity.characteristic_equation ||
          timeComplexity.iteration ||
          timeComplexity.master
        ) {
          const convertRecursiveAnalysis = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};

            // Notaciones asintóticas
            if (
              timeComplexity.big_theta &&
              typeof timeComplexity.big_theta === "string"
            )
              result.big_theta = timeComplexity.big_theta;
            if (
              timeComplexity.big_o &&
              typeof timeComplexity.big_o === "string"
            )
              result.big_o = timeComplexity.big_o;
            if (
              timeComplexity.big_O &&
              typeof timeComplexity.big_O === "string"
            )
              result.big_o = timeComplexity.big_O;
            if (
              timeComplexity.big_omega &&
              typeof timeComplexity.big_omega === "string"
            )
              result.big_omega = timeComplexity.big_omega;
            if (
              timeComplexity.big_Omega &&
              typeof timeComplexity.big_Omega === "string"
            )
              result.big_omega = timeComplexity.big_Omega;

            // Extraer recurrence
            if (
              timeComplexity.recurrence &&
              typeof timeComplexity.recurrence === "object"
            ) {
              const recurrence = timeComplexity.recurrence as Record<
                string,
                unknown
              >;
              result.recurrence = {
                type:
                  (recurrence.type as "divide_conquer" | "linear_shift") ||
                  "linear_shift",
                form: (recurrence.form as string) || "",
                a: (recurrence.a as number) || undefined,
                b: (recurrence.b as number) || undefined,
                f: (recurrence.f as string) || undefined,
                order: (recurrence.order as number) || undefined,
                shifts: (recurrence.shifts as number[]) || undefined,
                coefficients:
                  (recurrence.coefficients as number[]) || undefined,
                "g(n)": (recurrence["g(n)"] as string) || undefined,
                n0: (recurrence.n0 as number) || undefined,
                method: (timeComplexity.method as string) || undefined,
              };
            }

            // Extraer method
            if (
              timeComplexity.method &&
              typeof timeComplexity.method === "string"
            ) {
              result.method = timeComplexity.method;
            }

            // Extraer characteristic_equation (prioridad alta)
            if (
              timeComplexity.characteristic_equation &&
              typeof timeComplexity.characteristic_equation === "object"
            ) {
              const charEq = timeComplexity.characteristic_equation as Record<
                string,
                unknown
              >;
              result.characteristic_equation = {
                equation: (charEq.equation as string) || "",
                roots:
                  (charEq.roots as Array<{
                    root: string;
                    multiplicity: number;
                  }>) || undefined,
                dominant_root: (charEq.dominant_root as string) || undefined,
                growth_rate: (charEq.growth_rate as number) || undefined,
                homogeneous_solution:
                  (charEq.homogeneous_solution as string) || "",
                particular_solution:
                  (charEq.particular_solution as string) || undefined,
                general_solution:
                  (charEq.general_solution as string) || undefined,
                closed_form: (charEq.closed_form as string) || "",
                theta: (charEq.theta as string) || result.big_theta || "",
              };
              // Usar theta de characteristic_equation si está disponible
              if (result.characteristic_equation.theta) {
                result.big_theta = result.characteristic_equation.theta;
              }
            }

            // Extraer iteration
            if (
              timeComplexity.iteration &&
              typeof timeComplexity.iteration === "object"
            ) {
              const iteration = timeComplexity.iteration as Record<
                string,
                unknown
              >;
              const baseCase = iteration.base_case as
                | Record<string, unknown>
                | undefined;
              const summation = iteration.summation as
                | Record<string, unknown>
                | undefined;

              result.iteration = {
                g_function: (iteration.g_function as string) || "",
                expansions: (iteration.expansions as string[]) || [],
                general_form: (iteration.general_form as string) || "",
                base_case: {
                  condition: (baseCase?.condition as string) || "",
                  k: (baseCase?.k as string) || "",
                },
                summation: {
                  expression: (summation?.expression as string) || "",
                  evaluated: (summation?.evaluated as string) || "",
                },
                theta: (iteration.theta as string) || result.big_theta || "",
              };
              // Usar theta de iteration si está disponible
              if (result.iteration.theta) {
                result.big_theta = result.iteration.theta;
              }
            }

            // Extraer master
            if (
              timeComplexity.master &&
              typeof timeComplexity.master === "object"
            ) {
              const master = timeComplexity.master as Record<string, unknown>;
              result.master = {
                case: (master.case as 1 | 2 | 3 | null) || null,
                nlogba: (master.nlogba as string) || "",
                comparison:
                  (master.comparison as
                    | "smaller"
                    | "equal"
                    | "larger"
                    | null) || null,
                theta: (master.theta as string | null) || null,
              };
              // Usar theta de master si está disponible
              if (result.master.theta) {
                result.big_theta = result.master.theta;
              }
            }

            return Object.keys(result).length > 0 ? result : null;
          };

          const recursiveResult = convertRecursiveAnalysis();

          if (recursiveResult) {
            setLlmAnalysisData({
              worst: recursiveResult,
              best: null,
              avg: null,
            });
            dataProcessed = true;
          }
        }
        // Verificar si time_complexity tiene worst, best, avg
        else if (
          timeComplexity.worst ||
          timeComplexity.best ||
          timeComplexity.avg
        ) {
          const convertTimeComplexityCase = (
            caseData: unknown,
          ): CoreAnalysisData | null => {
            if (!caseData || typeof caseData !== "object") return null;
            const data = caseData as Record<string, unknown>;

            // Extraer datos, manejando posibles variaciones en los nombres
            const result: CoreAnalysisData = {};

            // T_open y T_polynomial
            if (data.T_open && typeof data.T_open === "string")
              result.T_open = data.T_open;
            if (data.T_polynomial && typeof data.T_polynomial === "string")
              result.T_polynomial = data.T_polynomial;

            // Notaciones asintóticas (pueden venir con diferentes nombres)
            if (data.big_theta && typeof data.big_theta === "string")
              result.big_theta = data.big_theta;
            if (data.big_o && typeof data.big_o === "string")
              result.big_o = data.big_o;
            if (data.big_O && typeof data.big_O === "string")
              result.big_o = data.big_O; // Variante con mayúscula
            if (data.big_omega && typeof data.big_omega === "string")
              result.big_omega = data.big_omega;
            if (data.big_Omega && typeof data.big_Omega === "string")
              result.big_omega = data.big_Omega; // Variante con mayúscula

            return Object.keys(result).length > 0 ? result : null;
          };

          const worstData = convertTimeComplexityCase(timeComplexity.worst);
          const bestData = convertTimeComplexityCase(timeComplexity.best);
          const avgData = convertTimeComplexityCase(timeComplexity.avg);

          setLlmAnalysisData({
            worst: worstData,
            best: bestData,
            avg: avgData,
          });
        } else if (
          timeComplexity.analysis &&
          typeof timeComplexity.analysis === "object"
        ) {
          // Estructura: { time_complexity: { analysis: {...} } } - un solo análisis para todos los casos
          const analysisData = timeComplexity.analysis as Record<
            string,
            unknown
          >;
          const convertAnalysisData = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};

            // T_open y T_polynomial
            if (analysisData.T_open && typeof analysisData.T_open === "string")
              result.T_open = analysisData.T_open;
            if (
              analysisData.T_polynomial &&
              typeof analysisData.T_polynomial === "string"
            )
              result.T_polynomial = analysisData.T_polynomial;

            // Notaciones asintóticas
            if (
              analysisData.big_theta &&
              typeof analysisData.big_theta === "string"
            )
              result.big_theta = analysisData.big_theta;
            if (analysisData.big_o && typeof analysisData.big_o === "string")
              result.big_o = analysisData.big_o;
            if (analysisData.big_O && typeof analysisData.big_O === "string")
              result.big_o = analysisData.big_O;
            if (
              analysisData.big_omega &&
              typeof analysisData.big_omega === "string"
            )
              result.big_omega = analysisData.big_omega;
            if (
              analysisData.big_Omega &&
              typeof analysisData.big_Omega === "string"
            )
              result.big_omega = analysisData.big_Omega;

            return Object.keys(result).length > 0 ? result : null;
          };

          const analysisResult = convertAnalysisData();

          // Para iterativo, usar el mismo análisis para worst, best y avg
          setLlmAnalysisData({
            worst: analysisResult,
            best: analysisResult,
            avg: analysisResult,
          });
        }
        // Verificar si time_complexity tiene directamente recurrence, method, characteristic_equation, etc.
        // (estructura para recursivos dentro de analysis.time_complexity)
        else if (
          timeComplexity.recurrence ||
          timeComplexity.method ||
          timeComplexity.characteristic_equation ||
          timeComplexity.iteration ||
          timeComplexity.master
        ) {
          const convertRecursiveAnalysis = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};

            // Notaciones asintóticas
            if (
              timeComplexity.big_theta &&
              typeof timeComplexity.big_theta === "string"
            )
              result.big_theta = timeComplexity.big_theta;
            if (
              timeComplexity.big_o &&
              typeof timeComplexity.big_o === "string"
            )
              result.big_o = timeComplexity.big_o;
            if (
              timeComplexity.big_O &&
              typeof timeComplexity.big_O === "string"
            )
              result.big_o = timeComplexity.big_O;
            if (
              timeComplexity.big_omega &&
              typeof timeComplexity.big_omega === "string"
            )
              result.big_omega = timeComplexity.big_omega;
            if (
              timeComplexity.big_Omega &&
              typeof timeComplexity.big_Omega === "string"
            )
              result.big_omega = timeComplexity.big_Omega;

            // Extraer recurrence
            if (
              timeComplexity.recurrence &&
              typeof timeComplexity.recurrence === "object"
            ) {
              const recurrence = timeComplexity.recurrence as Record<
                string,
                unknown
              >;
              result.recurrence = {
                type:
                  (recurrence.type as "divide_conquer" | "linear_shift") ||
                  "linear_shift",
                form: (recurrence.form as string) || "",
                a: (recurrence.a as number) || undefined,
                b: (recurrence.b as number) || undefined,
                f: (recurrence.f as string) || undefined,
                order: (recurrence.order as number) || undefined,
                shifts: (recurrence.shifts as number[]) || undefined,
                coefficients:
                  (recurrence.coefficients as number[]) || undefined,
                "g(n)": (recurrence["g(n)"] as string) || undefined,
                n0: (recurrence.n0 as number) || undefined,
                method: (timeComplexity.method as string) || undefined,
              };
            }

            // Extraer method
            if (
              timeComplexity.method &&
              typeof timeComplexity.method === "string"
            ) {
              result.method = timeComplexity.method;
            }

            // Extraer characteristic_equation (prioridad alta)
            if (
              timeComplexity.characteristic_equation &&
              typeof timeComplexity.characteristic_equation === "object"
            ) {
              const charEq = timeComplexity.characteristic_equation as Record<
                string,
                unknown
              >;
              result.characteristic_equation = {
                equation: (charEq.equation as string) || "",
                roots:
                  (charEq.roots as Array<{
                    root: string;
                    multiplicity: number;
                  }>) || undefined,
                dominant_root: (charEq.dominant_root as string) || undefined,
                growth_rate: (charEq.growth_rate as number) || undefined,
                homogeneous_solution:
                  (charEq.homogeneous_solution as string) || "",
                particular_solution:
                  (charEq.particular_solution as string) || undefined,
                general_solution:
                  (charEq.general_solution as string) || undefined,
                closed_form: (charEq.closed_form as string) || "",
                theta: (charEq.theta as string) || result.big_theta || "",
              };
              // Usar theta de characteristic_equation si está disponible
              if (result.characteristic_equation.theta) {
                result.big_theta = result.characteristic_equation.theta;
              }
            }

            // Extraer iteration
            if (
              timeComplexity.iteration &&
              typeof timeComplexity.iteration === "object"
            ) {
              const iteration = timeComplexity.iteration as Record<
                string,
                unknown
              >;
              const baseCase = iteration.base_case as
                | Record<string, unknown>
                | undefined;
              const summation = iteration.summation as
                | Record<string, unknown>
                | undefined;

              result.iteration = {
                g_function: (iteration.g_function as string) || "",
                expansions: (iteration.expansions as string[]) || [],
                general_form: (iteration.general_form as string) || "",
                base_case: {
                  condition: (baseCase?.condition as string) || "",
                  k: (baseCase?.k as string) || "",
                },
                summation: {
                  expression: (summation?.expression as string) || "",
                  evaluated: (summation?.evaluated as string) || "",
                },
                theta: (iteration.theta as string) || result.big_theta || "",
              };
              // Usar theta de iteration si está disponible
              if (result.iteration.theta) {
                result.big_theta = result.iteration.theta;
              }
            }

            // Extraer master
            if (
              timeComplexity.master &&
              typeof timeComplexity.master === "object"
            ) {
              const master = timeComplexity.master as Record<string, unknown>;
              result.master = {
                case: (master.case as 1 | 2 | 3 | null) || null,
                nlogba: (master.nlogba as string) || "",
                comparison:
                  (master.comparison as
                    | "smaller"
                    | "equal"
                    | "larger"
                    | null) || null,
                theta: (master.theta as string | null) || null,
              };
              // Usar theta de master si está disponible
              if (result.master.theta) {
                result.big_theta = result.master.theta;
              }
            }

            return Object.keys(result).length > 0 ? result : null;
          };

          const recursiveResult = convertRecursiveAnalysis();

          if (recursiveResult) {
            setLlmAnalysisData({
              worst: recursiveResult,
              best: null,
              avg: null,
            });
            dataProcessed = true;
          }
        } else {
          // Estructura antigua: time_complexity como objeto único
          const convertedAnalysis: CoreAnalysisData = {
            big_theta:
              (timeComplexity.big_theta as string) ||
              (timeComplexity.big_O as string) ||
              undefined,
            big_o: (timeComplexity.big_O as string) || undefined,
            big_omega: (timeComplexity.big_Omega as string) || undefined,
          };

          // Si hay información de recurrencia
          if (
            timeComplexity.recurrence_relation &&
            typeof timeComplexity.recurrence_relation === "object"
          ) {
            const recurrence = timeComplexity.recurrence_relation as Record<
              string,
              unknown
            >;
            if (recurrence.type === "linear_shift") {
              convertedAnalysis.recurrence = {
                type: "linear_shift",
                form:
                  (recurrence.equation as string) ||
                  (recurrence.form as string) ||
                  "",
                method: (timeComplexity.method as string) || "iteration",
              };
            } else if (recurrence.type === "divide_conquer") {
              convertedAnalysis.recurrence = {
                type: "divide_conquer",
                form:
                  (recurrence.equation as string) ||
                  (recurrence.form as string) ||
                  "",
                a: (recurrence.a as number) || 1,
                b: (recurrence.b as number) || 2,
                f: (recurrence.f as string) || "1",
                method: (timeComplexity.method as string) || "master",
              };
            }
          }

          // Si hay detalles del método de iteración
          if (
            timeComplexity.method === "iteration" &&
            timeComplexity.method_details &&
            typeof timeComplexity.method_details === "object"
          ) {
            const details = timeComplexity.method_details as Record<
              string,
              unknown
            >;
            convertedAnalysis.method = "iteration";

            // Manejar tanto 'expansions' como 'steps' (el LLM puede usar cualquiera)
            const expansions =
              (details.expansions as string[]) ||
              (details.steps as string[]) ||
              [];

            convertedAnalysis.iteration = {
              g_function: (details.general_form as string) || "n-1",
              expansions: expansions,
              general_form: (details.general_form as string) || "",
              base_case: {
                condition:
                  (details.base_case_substitution as string) || "n = 0",
                k: "n",
              },
              summation: {
                expression: (details.solution as string) || "",
                evaluated: (details.solution as string) || "",
              },
              theta: (timeComplexity.big_theta as string) || "\\Theta(n)",
            };
          }

          if (isRecursive) {
            setLlmAnalysisData({
              worst: convertedAnalysis,
              best: null,
              avg: null,
            });
          } else {
            setLlmAnalysisData({
              worst: convertedAnalysis,
              best: convertedAnalysis,
              avg: convertedAnalysis,
            });
          }
        }
      } else if (
        llmAnalysis.recurrence ||
        llmAnalysis.iteration ||
        llmAnalysis.method ||
        llmAnalysis.characteristic_equation ||
        llmAnalysis.master
      ) {
        // Estructura con recurrence/iteration/characteristic_equation/master directamente en analysis
        const convertedAnalysis: CoreAnalysisData = {
          big_theta: (llmAnalysis.big_theta as string) || undefined,
          big_o: (llmAnalysis.big_o as string) || undefined,
          big_omega: (llmAnalysis.big_omega as string) || undefined,
        };

        // Extraer recurrence completo
        if (
          llmAnalysis.recurrence &&
          typeof llmAnalysis.recurrence === "object"
        ) {
          const recurrence = llmAnalysis.recurrence as Record<string, unknown>;
          convertedAnalysis.recurrence = {
            type:
              (recurrence.type as "divide_conquer" | "linear_shift") ||
              "linear_shift",
            form: (recurrence.form as string) || "",
            a: (recurrence.a as number) || undefined,
            b: (recurrence.b as number) || undefined,
            f: (recurrence.f as string) || undefined,
            order: (recurrence.order as number) || undefined,
            shifts: (recurrence.shifts as number[]) || undefined,
            coefficients: (recurrence.coefficients as number[]) || undefined,
            "g(n)": (recurrence["g(n)"] as string) || undefined,
            n0: (recurrence.n0 as number) || undefined,
          };
        }

        // Extraer method
        if (llmAnalysis.method) {
          convertedAnalysis.method = llmAnalysis.method as string;
        }

        // Extraer characteristic_equation (prioridad alta)
        if (
          llmAnalysis.characteristic_equation &&
          typeof llmAnalysis.characteristic_equation === "object"
        ) {
          const charEq = llmAnalysis.characteristic_equation as Record<
            string,
            unknown
          >;
          convertedAnalysis.characteristic_equation = {
            equation: (charEq.equation as string) || "",
            roots:
              (charEq.roots as Array<{ root: string; multiplicity: number }>) ||
              undefined,
            dominant_root: (charEq.dominant_root as string) || undefined,
            growth_rate: (charEq.growth_rate as number) || undefined,
            homogeneous_solution: (charEq.homogeneous_solution as string) || "",
            particular_solution:
              (charEq.particular_solution as string) || undefined,
            general_solution: (charEq.general_solution as string) || undefined,
            closed_form: (charEq.closed_form as string) || "",
            theta:
              (charEq.theta as string) || convertedAnalysis.big_theta || "",
          };
          // Usar theta de characteristic_equation si está disponible
          if (convertedAnalysis.characteristic_equation.theta) {
            convertedAnalysis.big_theta =
              convertedAnalysis.characteristic_equation.theta;
          }
        }

        // Extraer master
        if (llmAnalysis.master && typeof llmAnalysis.master === "object") {
          const master = llmAnalysis.master as Record<string, unknown>;
          convertedAnalysis.master = {
            case: (master.case as 1 | 2 | 3 | null) || null,
            nlogba: (master.nlogba as string) || "",
            comparison:
              (master.comparison as "smaller" | "equal" | "larger" | null) ||
              null,
            theta: (master.theta as string | null) || null,
          };
          // Usar theta de master si está disponible
          if (convertedAnalysis.master.theta) {
            convertedAnalysis.big_theta = convertedAnalysis.master.theta;
          }
        }

        // Extraer iteration completo
        if (
          llmAnalysis.iteration &&
          typeof llmAnalysis.iteration === "object"
        ) {
          const iteration = llmAnalysis.iteration as Record<string, unknown>;
          const baseCase = iteration.base_case as
            | Record<string, unknown>
            | undefined;
          const summation = iteration.summation as
            | Record<string, unknown>
            | undefined;

          convertedAnalysis.iteration = {
            g_function: (iteration.g_function as string) || "n-1",
            expansions: (iteration.expansions as string[]) || [],
            general_form: (iteration.general_form as string) || "",
            base_case: {
              condition: (baseCase?.condition as string) || "n = 0",
              k: (baseCase?.k as string) || "n",
            },
            summation: {
              expression: (summation?.expression as string) || "",
              evaluated: (summation?.evaluated as string) || "",
            },
            theta:
              (iteration.theta as string) ||
              convertedAnalysis.big_theta ||
              "\\Theta(n)",
          };
        }

        // También verificar iteration_details como alternativa
        if (
          llmAnalysis.iteration_details &&
          typeof llmAnalysis.iteration_details === "object" &&
          !convertedAnalysis.iteration
        ) {
          const details = llmAnalysis.iteration_details as Record<
            string,
            unknown
          >;
          convertedAnalysis.iteration = {
            g_function: (details.general_form as string) || "n-1",
            expansions:
              (details.expansions as string[]) ||
              (details.steps as string[]) ||
              [],
            general_form: (details.general_form as string) || "",
            base_case: {
              condition:
                (details.base_case_substitution as string) ||
                (details.base_case_condition as string) ||
                "n = 0",
              k: "n",
            },
            summation: {
              expression:
                (details.final_equation as string) ||
                (details.solution as string) ||
                "",
              evaluated:
                (details.result as string) ||
                (details.solution as string) ||
                "",
            },
            theta: convertedAnalysis.big_theta || "\\Theta(n)",
          };
        }

        if (isRecursive) {
          setLlmAnalysisData({
            worst: convertedAnalysis,
            best: null,
            avg: null,
          });
        } else {
          setLlmAnalysisData({
            worst: convertedAnalysis,
            best: convertedAnalysis,
            avg: convertedAnalysis,
          });
        }
      } else if (!dataProcessed && isRecursive) {
        // Para recursivo, usar el análisis directamente
        setLlmAnalysisData({
          worst: llmAnalysis as CoreAnalysisData,
          best: null,
          avg: null,
        });
      } else if (!dataProcessed) {
        // Para iterativo sin separación de casos, usar el mismo para todos
        setLlmAnalysisData({
          worst: llmAnalysis as CoreAnalysisData,
          best: llmAnalysis as CoreAnalysisData,
          avg: llmAnalysis as CoreAnalysisData,
        });
      }

      setLlmNote(llmResponse.note || "😐 Sin observaciones");

      setComparisonProgress(100);
      setComparisonMessage("Comparación completada");

      // Esperar un momento antes de cerrar el loader y abrir el modal
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsComparing(false);
      setShowComparisonModal(true);

      // Resetear estados después
      setTimeout(() => {
        setComparisonProgress(0);
        setComparisonMessage("Contactando con LLM...");
      }, 300);
    } catch (error) {
      console.error("[Comparison] Error:", error);
      const rawMsg =
        error instanceof Error
          ? error.message
          : "Error inesperado durante la comparación";
      setComparisonMessage("Error: " + tMessages(translateLlmError(rawMsg)));
      setComparisonProgress(0);

      setTimeout(() => {
        setIsComparing(false);
        setComparisonProgress(0);
        setComparisonMessage("Contactando con LLM...");
      }, 3000);
    }
  };

  // Los datos ya están cargados desde sessionStorage en el estado inicial
  // Si hay datos guardados, se mostrarán directamente sin necesidad de re-analizar

  const handleViewLineProcedure = (lineNo: number) => {
    setSelectedLine(lineNo);
    setOpen(true);
  };

  const [openGeneral, setOpenGeneral] = useState(false);
  const [generalProcedureCase, setGeneralProcedureCase] = useState<
    "worst" | "best" | "average"
  >("worst");
  const handleViewGeneralProcedure = (
    caseType: "worst" | "best" | "average" = "worst",
  ) => {
    setGeneralProcedureCase(caseType);
    setOpenGeneral(true);
  };

  const formatAlgorithmKind = (value: ClassifyResponse["kind"]): string => {
    return tAlgorithmType(value === "unknown" ? "unknown" : value);
  };

  // Selector de casos (worst por defecto, preparado para best/average)
  // Inicializar con 'worst' para evitar errores de hidratación (el servidor no tiene acceso a sessionStorage)
  const [selectedCase, setSelectedCase] = useState<CaseType>("worst");
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar el caso guardado solo en el cliente después de la hidratación
  useEffect(() => {
    setIsHydrated(true);
    const savedCase = getSavedCase();
    setSelectedCase(savedCase);
  }, []);

  // Guardar el caso seleccionado en sessionStorage
  useEffect(() => {
    if (isHydrated) {
      saveCase(selectedCase);
    }
  }, [selectedCase, isHydrated]);

  const handleExport = async (formats: ExportFormatType[]) => {
    setShowExportModal(false);
    setExportFormats(formats);
    setIsExporting(true);
    setExportProgress(0);

    const animateExport = async (from: number, to: number, ms: number) => {
      return new Promise<void>((resolve) => {
        let current = from;
        const step = (to - from) / (ms / 50);
        const interval = setInterval(() => {
          current += step;
          if (current >= to) {
            clearInterval(interval);
            setExportProgress(to);
            resolve();
          } else {
            setExportProgress(current);
          }
        }, 50);
      });
    };

    animateExport(0, 90, 2000);

    try {
      const preferredMethod =
        (data?.worst ? extractCoreData(data.worst)?.method : null) ||
        (data?.best && data.best !== "same_as_worst"
          ? extractCoreData(data.best)?.method
          : null) ||
        (data?.avg && data.avg !== "same_as_worst"
          ? extractCoreData(data.avg)?.method
          : null) ||
        undefined;

      const reqBody = {
        source,
        formats,
        includeZipBundle: formats.length > 1,
        locale: locale === "es" ? "es" : "en",
        preferredMethod,
        cachedParse: ast
          ? { ok: true, ast: ast, errors: parseErrors || undefined }
          : undefined,
        cachedClassify: algorithmType
          ? {
              kind: algorithmType,
              method:
                (data?.worst ? extractCoreData(data.worst)?.method : null) ||
                (data?.best && data.best !== "same_as_worst"
                  ? extractCoreData(data.best)?.method
                  : null) ||
                "master",
            }
          : undefined,
        cachedAnalyze:
          data && (data.worst || data.best || data.avg)
            ? { ok: true, ...data }
            : undefined,
      };

      const apiBaseUrl = (
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
      ).replace(/\/+$/, "");

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const procedureName =
        extractProcedureNameFromSource(source) || algorithmType || "algorithm";

      const res = await fetch(`${apiBaseUrl}/export/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      if (formats.length > 1) {
        a.download = `${dateStr}-${procedureName}-report.zip`.replaceAll(
          "--",
          "-",
        );
      } else if (formats[0] === "markdown") {
        a.download = `${dateStr}-${procedureName}-report.md`.replaceAll(
          "--",
          "-",
        );
      } else {
        a.download = `${dateStr}-${procedureName}-report.pdf`.replaceAll(
          "--",
          "-",
        );
      }

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      await animateExport(90, 100, 200);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Computar si el botón debe estar deshabilitado
  const isButtonDisabled =
    analyzing || !source.trim() || !localParseOk || isExporting;
  const loopInvariantData =
    data?.loopInvariant || data?.worst?.loopInvariant || null;
  const selectedAnalysisData = useMemo<AnalyzeOpenResponse | undefined>(() => {
    if (selectedCase === "worst") {
      return data?.worst || undefined;
    }

    if (selectedCase === "best") {
      return (
        (data?.best === "same_as_worst" ? data?.worst : data?.best) || undefined
      );
    }

    return (
      (data?.avg === "same_as_worst" ? data?.worst : data?.avg) || undefined
    );
  }, [data, selectedCase]);
  const generalProcedureData = useMemo<AnalyzeOpenResponse | undefined>(() => {
    if (generalProcedureCase === "worst") {
      return data?.worst || undefined;
    }

    if (generalProcedureCase === "best") {
      return (
        (data?.best === "same_as_worst" ? data?.worst : data?.best) || undefined
      );
    }

    return (
      (data?.avg === "same_as_worst" ? data?.worst : data?.avg) || undefined
    );
  }, [data, generalProcedureCase]);
  const analyzerFeatures = useMemo<AssistantFeatureContext[]>(() => {
    const isSpanish = locale === "es";
    const text = (es: string, en: string) => (isSpanish ? es : en);

    return [
      {
        id: "import-txt",
        title: tView("importTxt"),
        location: "/analyzer",
        description: text(
          "Carga pseudocodigo desde un archivo .txt al editor principal.",
          "Load pseudocode from a .txt file into the main editor.",
        ),
        availability: text("Disponible siempre", "Always available"),
      },
      {
        id: "export-report",
        title: tView("exportReport"),
        location: "/analyzer",
        description: text(
          "Descarga el reporte del analisis en PDF o Markdown.",
          "Download the analysis report as PDF or Markdown.",
        ),
        availability:
          data && (data.worst || data.best || data.avg)
            ? text(
                "Disponible con analisis completo",
                "Available with completed analysis",
              )
            : text(
                "Requiere un analisis completo",
                "Requires a completed analysis",
              ),
      },
      {
        id: "view-ast",
        title: tView("viewAst"),
        location: "/analyzer",
        description: text(
          "Abre el AST en vista de arbol o JSON para inspeccionar el parseo.",
          "Open the AST in tree or JSON view to inspect parsing output.",
        ),
        availability:
          localParseOk && ast
            ? text("Disponible ahora", "Available now")
            : text("Requiere AST valido", "Requires a valid AST"),
      },
      {
        id: "execution-trace",
        title: tView("viewExecutionTrace"),
        location: "/analyzer",
        description: text(
          "Muestra el seguimiento paso a paso y el diagrama de ejecucion.",
          "Show step-by-step execution tracing and execution diagrams.",
        ),
        availability: hasComparableData
          ? text("Disponible ahora", "Available now")
          : text(
              "Requiere analisis formal completo",
              "Requires completed formal analysis",
            ),
      },
      {
        id: "compare-with-llm",
        title: tView("compareWithLLM"),
        location: "/analyzer",
        description: text(
          "Contrasta el resultado formal con una lectura complementaria del LLM.",
          "Contrast the formal result with a complementary LLM reading.",
        ),
        availability:
          hasApiKey && hasComparableData
            ? text("Disponible ahora", "Available now")
            : text(
                "Requiere API key y analisis completo",
                "Requires API key and completed analysis",
              ),
      },
      {
        id: "loop-invariant",
        title: tView("viewLoopInvariant"),
        location: "/analyzer",
        description: text(
          "Explica el loop invariant determinista detectado para el ciclo seleccionado.",
          "Explain the deterministic loop invariant detected for the selected loop.",
        ),
        availability: loopInvariantData
          ? text("Disponible ahora", "Available now")
          : text(
              "Disponible cuando se detecta un invariante",
              "Available when an invariant is detected",
            ),
      },
      {
        id: "gpu-vs-cpu",
        title: tView("gpuVsCpuAnalysis"),
        location: "/analyzer",
        description: text(
          "Evalua si la estructura del algoritmo se adapta mejor a CPU, GPU o un enfoque hibrido.",
          "Evaluate whether the algorithm structure fits CPU, GPU, or a hybrid approach better.",
        ),
        availability:
          ast && hasComparableData
            ? text("Disponible ahora", "Available now")
            : text(
                "Requiere AST y analisis completo",
                "Requires AST and completed analysis",
              ),
      },
      {
        id: "repair-with-ai",
        title: tView("repairWithAI"),
        location: "/analyzer",
        description: text(
          "Intenta reparar pseudocodigo con errores de gramatica usando IA.",
          "Attempt to repair pseudocode with grammar issues using AI.",
        ),
        availability: hasApiKey
          ? text("Disponible con API key", "Available with API key")
          : text("Requiere API key", "Requires API key"),
      },
    ];
  }, [
    ast,
    data,
    hasApiKey,
    hasComparableData,
    locale,
    localParseOk,
    loopInvariantData,
    tView,
  ]);
  const focusedPanel = useMemo<AssistantFocusedPanelContext | undefined>(() => {
    const safeLocale = normalizeAssistantLocale(locale);
    const text = (es: string, en: string) => panelText(safeLocale, es, en);
    const selectedCaseLabel = tCases(selectedCase);
    const generalProcedureCaseLabel = tCases(generalProcedureCase);

    if (showMethodSelector) {
      return {
        id: "method-selector",
        title: tMethodSelector("title"),
        description: tMethodSelector("subtitle"),
        notes: [
          `defaultMethod=${defaultMethod}`,
          `applicableMethods=${applicableMethods.join(", ")}`,
        ],
      };
    }

    if (showAstModal && ast) {
      return {
        id: "ast-modal",
        title: tView("abstractSyntaxTree"),
        description:
          viewMode === "tree"
            ? tView("astTreeViewDesc")
            : tView("astJsonViewDesc"),
        notes: [`viewMode=${viewMode}`],
      };
    }

    if (open) {
      return {
        id: "line-procedure-modal",
        title:
          selectedLine == null
            ? tProcedureModal("titleComplete")
            : tProcedureModal("titleLine", { line: selectedLine }),
        description:
          selectedLine == null
            ? text(
                `Desglose exacto del procedimiento por linea para el caso ${selectedCaseLabel} visible.`,
                `Exact line-by-line procedure breakdown for the visible ${selectedCaseLabel} case.`,
              )
            : text(
                `Desglose exacto de la linea ${selectedLine} en el caso ${selectedCaseLabel} visible.`,
                `Exact breakdown of line ${selectedLine} in the visible ${selectedCaseLabel} case.`,
              ),
        notes: buildLineProcedureDetails({
          locale: safeLocale,
          selectedCaseLabel,
          selectedLine,
          analysisData: selectedAnalysisData,
        }),
      };
    }

    if (openGeneral) {
      return {
        id: "general-procedure-modal",
        title: `${tGeneralProcedureModal("title")} - ${generalProcedureCaseLabel}`,
        description: text(
          `Procedimiento completo visible para el caso ${generalProcedureCaseLabel}.`,
          `Full visible procedure for the ${generalProcedureCaseLabel} case.`,
        ),
        notes: buildGeneralProcedureDetails({
          locale: safeLocale,
          caseLabel: generalProcedureCaseLabel,
          analysisData: generalProcedureData,
        }),
      };
    }

    if (showComparisonModal) {
      const ownWorst = extractCoreData(data?.worst || null);
      const ownBest = extractCoreData(
        data?.best === "same_as_worst"
          ? data?.worst || null
          : data?.best || null,
      );
      const ownAvg = extractCoreData(
        data?.avg === "same_as_worst" ? data?.worst || null : data?.avg || null,
      );
      const llmWorst = llmAnalysisData?.worst || null;
      const llmBest = llmAnalysisData?.best || null;
      const llmAvg = llmAnalysisData?.avg || null;

      return {
        id: "llm-comparison-modal",
        title: tView("comparisonWithLlm"),
        description: text(
          "Comparacion lado a lado entre el analisis formal de la app y la lectura complementaria del LLM.",
          "Side-by-side comparison between the app's formal analysis and the LLM's complementary reading.",
        ),
        notes: [
          text(
            `Tipo de analisis comparado: ${isRecursiveAnalysis(data?.worst || null) ? "recursivo" : "iterativo"}.`,
            `Compared analysis kind: ${isRecursiveAnalysis(data?.worst || null) ? "recursive" : "iterative"}.`,
          ),
          formatCaseComparisonNote(
            safeLocale,
            text(`${tCases("worst")} formal`, `${tCases("worst")} formal`),
            ownWorst,
          ),
          formatCaseComparisonNote(
            safeLocale,
            text(`${tCases("best")} formal`, `${tCases("best")} formal`),
            ownBest,
          ),
          formatCaseComparisonNote(
            safeLocale,
            text(`${tCases("average")} formal`, `${tCases("average")} formal`),
            ownAvg,
          ),
          formatCaseComparisonNote(
            safeLocale,
            text(`${tCases("worst")} LLM`, `${tCases("worst")} LLM`),
            llmWorst,
          ),
          formatCaseComparisonNote(
            safeLocale,
            text(`${tCases("best")} LLM`, `${tCases("best")} LLM`),
            llmBest,
          ),
          formatCaseComparisonNote(
            safeLocale,
            text(`${tCases("average")} LLM`, `${tCases("average")} LLM`),
            llmAvg,
          ),
          ...(llmNote
            ? [
                text(
                  `Nota visible del contraste: ${truncateAssistantDetail(llmNote)}.`,
                  `Visible comparison note: ${truncateAssistantDetail(llmNote)}.`,
                ),
              ]
            : []),
        ],
      };
    }

    if (showGPUCPUModal && gpuCpuAnalysis) {
      return {
        id: "gpu-cpu-modal",
        title: tGpuCpuModal("title"),
        description: gpuCpuAnalysis.summary,
        notes: [
          text(
            `Recomendacion principal visible: ${gpuCpuAnalysis.primaryRecommendation}.`,
            `Visible primary recommendation: ${gpuCpuAnalysis.primaryRecommendation}.`,
          ),
          text(
            `Confianza visible: ${gpuCpuAnalysis.confidence}.`,
            `Visible confidence: ${gpuCpuAnalysis.confidence}.`,
          ),
          text(
            `Puntajes visibles: GPU ${gpuCpuAnalysis.scores.gpu}, CPU ${gpuCpuAnalysis.scores.cpu}, Hibrido ${gpuCpuAnalysis.scores.hybrid}.`,
            `Visible scores: GPU ${gpuCpuAnalysis.scores.gpu}, CPU ${gpuCpuAnalysis.scores.cpu}, Hybrid ${gpuCpuAnalysis.scores.hybrid}.`,
          ),
          ...gpuCpuAnalysis.reasons.blockers
            .slice(0, 2)
            .map((reason) =>
              text(
                `Bloqueador: ${truncateAssistantDetail(reason)}.`,
                `Blocker: ${truncateAssistantDetail(reason)}.`,
              ),
            ),
          ...gpuCpuAnalysis.reasons.positive
            .slice(0, 2)
            .map((reason) =>
              text(
                `A favor: ${truncateAssistantDetail(reason)}.`,
                `Positive signal: ${truncateAssistantDetail(reason)}.`,
              ),
            ),
          ...gpuCpuAnalysis.reasons.negative
            .slice(0, 2)
            .map((reason) =>
              text(
                `En contra: ${truncateAssistantDetail(reason)}.`,
                `Negative signal: ${truncateAssistantDetail(reason)}.`,
              ),
            ),
          ...gpuCpuAnalysis.detectedPatterns
            .slice(0, 3)
            .map((pattern) =>
              text(
                `Patron detectado: ${pattern.name} (${Math.round(pattern.confidence * 100)}%).`,
                `Detected pattern: ${pattern.name} (${Math.round(pattern.confidence * 100)}%).`,
              ),
            ),
        ],
      };
    }

    if (showLoopInvariantModal && loopInvariantData) {
      return {
        id: "loop-invariant-modal",
        title: tLoopInvariant("modal.title"),
        description: loopInvariantData.didacticSummary,
        notes: [
          text(
            `Estado visible: ${loopInvariantData.status}.`,
            `Visible status: ${loopInvariantData.status}.`,
          ),
          text(
            `Patron visible: ${loopInvariantData.selectedLoop.patternType}.`,
            `Visible pattern: ${loopInvariantData.selectedLoop.patternType}.`,
          ),
          loopInvariantData.selectedLoop.nodeType
            ? text(
                `Loop analizado: ${loopInvariantData.selectedLoop.nodeType}${
                  loopInvariantData.selectedLoop.lineStart != null
                    ? ` (lineas ${loopInvariantData.selectedLoop.lineStart}-${loopInvariantData.selectedLoop.lineEnd ?? loopInvariantData.selectedLoop.lineStart})`
                    : ""
                }.`,
                `Analyzed loop: ${loopInvariantData.selectedLoop.nodeType}${
                  loopInvariantData.selectedLoop.lineStart != null
                    ? ` (lines ${loopInvariantData.selectedLoop.lineStart}-${loopInvariantData.selectedLoop.lineEnd ?? loopInvariantData.selectedLoop.lineStart})`
                    : ""
                }.`,
              )
            : null,
          loopInvariantData.invariant.propertyStatement
            ? text(
                `Propiedad visible: ${summarizePanelText(safeLocale, loopInvariantData.invariant.propertyStatement)}.`,
                `Visible property: ${summarizePanelText(safeLocale, loopInvariantData.invariant.propertyStatement)}.`,
              )
            : null,
          loopInvariantData.invariant.initialization
            ? text(
                `Inicializacion visible: ${summarizePanelText(safeLocale, loopInvariantData.invariant.initialization)}.`,
                `Visible initialization: ${summarizePanelText(safeLocale, loopInvariantData.invariant.initialization)}.`,
              )
            : null,
          loopInvariantData.invariant.maintenance
            ? text(
                `Mantenimiento visible: ${summarizePanelText(safeLocale, loopInvariantData.invariant.maintenance)}.`,
                `Visible maintenance: ${summarizePanelText(safeLocale, loopInvariantData.invariant.maintenance)}.`,
              )
            : null,
          loopInvariantData.invariant.finalization
            ? text(
                `Cierre visible: ${summarizePanelText(safeLocale, loopInvariantData.invariant.finalization)}.`,
                `Visible finalization: ${summarizePanelText(safeLocale, loopInvariantData.invariant.finalization)}.`,
              )
            : null,
        ].filter((entry): entry is string => Boolean(entry)),
      };
    }

    if (analyzerViewMode === "trace") {
      return (
        traceFocusedPanel || {
          id: "execution-trace-view",
          title: tExecutionTrace("title"),
          description: tView("viewExecutionTrace"),
          notes: [
            text(
              `Caso visible en seguimiento: ${tCases(executionTraceCase)}.`,
              `Case visible in trace view: ${tCases(executionTraceCase)}.`,
            ),
            text(
              "La vista muestra el recorrido paso a paso de ejecucion sobre el codigo actual.",
              "The view shows the step-by-step execution trace over the current code.",
            ),
          ],
        }
      );
    }

    if (recursiveFocusedPanel) {
      return recursiveFocusedPanel;
    }

    return undefined;
  }, [
    analyzerViewMode,
    applicableMethods,
    ast,
    data,
    defaultMethod,
    executionTraceCase,
    generalProcedureCase,
    generalProcedureData,
    gpuCpuAnalysis,
    llmNote,
    llmAnalysisData,
    locale,
    loopInvariantData,
    open,
    openGeneral,
    recursiveFocusedPanel,
    traceFocusedPanel,
    selectedCase,
    selectedAnalysisData,
    selectedLine,
    showAstModal,
    showComparisonModal,
    showGPUCPUModal,
    showLoopInvariantModal,
    showMethodSelector,
    tCases,
    tExecutionTrace,
    tGeneralProcedureModal,
    tGpuCpuModal,
    tLoopInvariant,
    tMethodSelector,
    tProcedureModal,
    tView,
    viewMode,
  ]);
  const assistantContext = useMemo<AssistantContext>(() => {
    const notes: string[] = [];

    if (analysisError) {
      notes.push(analysisError);
    }
    if (parseErrors && parseErrors.length > 0) {
      notes.push(
        ...parseErrors
          .slice(0, 3)
          .map((error) => error.message || "Parse error"),
      );
    }
    if (loopInvariantData) {
      notes.push("Loop invariant available");
    }
    if (data?.best === "same_as_worst") {
      notes.push("Best case reuses worst-case result");
    }
    if (data?.avg === "same_as_worst") {
      notes.push("Average case reuses worst-case result");
    }

    const cases = [
      buildFormalCaseSummary("worst", data?.worst || null),
      buildFormalCaseSummary(
        "best",
        data?.best === "same_as_worst"
          ? data?.worst || null
          : data?.best || null,
      ),
      buildFormalCaseSummary(
        "avg",
        data?.avg === "same_as_worst" ? data?.worst || null : data?.avg || null,
      ),
    ].filter(
      (
        entry,
      ): entry is NonNullable<ReturnType<typeof buildFormalCaseSummary>> =>
        entry !== null,
    );

    return {
      surface: "analyzer",
      locale,
      pageContext: {
        route: "/analyzer",
        view: analyzerViewMode,
        title: tView("analyze"),
        description:
          analyzerViewMode === "trace"
            ? tView("viewExecutionTrace")
            : tView("analyze"),
        notes: [
          `selectedCase=${selectedCase}`,
          `parseOk=${localParseOk ? "true" : "false"}`,
          `importTxt=true`,
          `exportReport=${data && (data.worst || data.best || data.avg) ? "enabled" : "disabled"}`,
          `compareWithLLM=${hasApiKey && hasComparableData ? "enabled" : "disabled"}`,
          `executionTrace=${hasComparableData ? "enabled" : "disabled"}`,
          `gpuVsCpu=${ast && hasComparableData ? "enabled" : "disabled"}`,
          `loopInvariant=${loopInvariantData ? "enabled" : "disabled"}`,
        ],
      },
      sourceCode: source.trim() || undefined,
      formalAnalysisSummary: {
        parseStatus: source.trim()
          ? localParseOk
            ? "ok"
            : parseErrors && parseErrors.length > 0
              ? "error"
              : "unknown"
          : "idle",
        analysisStatus: analyzing
          ? "running"
          : analysisError
            ? "error"
            : data
              ? "complete"
              : "idle",
        algorithmType: algorithmType
          ? tAlgorithmType(
              algorithmType === "unknown" ? "unknown" : algorithmType,
            )
          : undefined,
        selectedCase,
        selectedMethod: analysisMethodKey
          ? tMethods(analysisMethodKey)
          : undefined,
        hasCaseVariability: data?.has_case_variability === true,
        cases,
        notes,
      },
      focusedPanel,
      availableFeatures: analyzerFeatures,
    };
  }, [
    algorithmType,
    analysisError,
    analysisMethodKey,
    analyzerViewMode,
    analyzing,
    analyzerFeatures,
    data,
    focusedPanel,
    hasApiKey,
    hasComparableData,
    ast,
    locale,
    localParseOk,
    loopInvariantData,
    parseErrors,
    selectedCase,
    source,
    tAlgorithmType,
    tMethods,
    tView,
  ]);

  // Extraer datos de invariantes recursivos
  const recursiveInvariantData = data?.recursiveInvariant || null;
  const isAlgorithmRecursive = isRecursiveAnalysis(data?.worst || null);

  return (
    <div className="relative flex w-full min-h-screen flex-col overflow-x-hidden">
      {/* Loader de análisis */}
      {analyzing && (
        <AAProgressLoader
          mode="analysis"
          progress={analysisProgress}
          message={analysisMessage}
          algorithmType={algorithmType}
          isComplete={isAnalysisComplete}
          error={analysisError}
          onClose={() => {
            setAnalyzing(false);
            setAnalysisProgress(0);
            setAnalysisMessage(getMessage("init"));
            setAlgorithmType(undefined);
            setIsAnalysisComplete(false);
            setAnalysisError(null);
          }}
          allowPointerEvents={showMethodSelector}
          overlayContent={
            showMethodSelector && applicableMethods.length > 0 ? (
              <MethodSelector
                applicableMethods={applicableMethods}
                defaultMethod={defaultMethod}
                methodMetadata={methodMetadata}
                embeddedInLoader
                onSelect={(method) => {
                  console.log("[MethodSelector] Método seleccionado:", method);
                  if (methodSelectionPromiseRef.current) {
                    methodSelectionPromiseRef.current.resolve(method);
                  }
                }}
                onCancel={() => {
                  setShowMethodSelector(false);
                  if (methodSelectionPromiseRef.current) {
                    methodSelectionPromiseRef.current.reject(
                      "METHOD_SELECTION_CANCELLED",
                    );
                  }
                }}
              />
            ) : undefined
          }
        />
      )}

      {/* Loader de comparación con LLM */}
      {isComparing && (
        <AAProgressLoader
          mode="comparison"
          progress={comparisonProgress}
          message={comparisonMessage}
          isComplete={false}
          error={
            comparisonMessage.startsWith("Error:") ? comparisonMessage : null
          }
          onClose={() => setIsComparing(false)}
        />
      )}

      {/* Loader de exportación */}
      {isExporting && (
        <AAProgressLoader
          mode="export"
          progress={exportProgress}
          message={tExport("progress")}
          isComplete={false}
          error={null}
          exportFormats={exportFormats}
          onClose={() => setIsExporting(false)}
        />
      )}

      {/* Modal de exportación */}
      {showExportModal && (
        <ExportFormatSelector
          onSelect={handleExport}
          onCancel={() => setShowExportModal(false)}
        />
      )}

      <Header />

      <main className="relative z-10 flex max-lg:flex-none flex-col px-6 py-4 lg:min-h-0 lg:flex-1">
        <div className="mx-auto flex w-full max-w-7xl flex-col max-lg:flex-none lg:min-h-0 lg:flex-1">
          {/* Vista trace: montada al abrir y se mantiene para persistir estado al volver */}
          {hasTraceViewMounted && (
            <div
              className={`flex flex-col min-h-0 transition-all duration-300 max-lg:flex-none lg:flex-1 ${
                analyzerViewMode !== "trace" ? "hidden" : ""
              } ${isSwitchingTrace ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
            >
              <TraceDedicatedView
                source={source}
                ast={ast}
                caseType={executionTraceCase}
                onCaseChange={setExecutionTraceCase}
                onAssistantFocusedPanelChange={setTraceFocusedPanel}
                onBack={() => {
                  setIsSwitchingTrace(true);
                  setTimeout(() => {
                    setAnalyzerViewMode("analysis");
                    setIsSwitchingTrace(false);
                  }, 300);
                }}
                hasApiKey={hasApiKey}
              />
            </div>
          )}
          {/* Vista análisis */}
          <div
            className={`flex flex-col min-h-0 transition-all duration-300 max-lg:flex-none lg:flex-1 ${
              analyzerViewMode === "trace" ? "hidden" : ""
            } ${isSwitchingTrace ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
          >
            {/* Main layout: código vertical, costos y ecuaciones horizontales */}
            <div className="grid grid-cols-1 gap-6 max-lg:flex-none lg:flex-1 lg:basis-0 lg:min-h-0 lg:grid-cols-12">
              {/* Columna izquierda: código fuente (vertical) */}
              <section className="flex min-h-0 flex-col max-lg:min-h-[max(220px,min(42svh,360px))] lg:col-span-4 lg:h-full">
                <div className="glass-card flex min-h-0 flex-1 flex-col rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-semibold flex items-center">
                      <span className="material-symbols-outlined mr-2 text-blue-400">
                        code
                      </span>{" "}
                      {tView("sourceCode")}
                    </h2>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => txtInputRef.current?.click()}
                          disabled={isImportingTxt}
                          className="flex items-center justify-center w-8 h-8 rounded-md text-[13px] font-medium transition-all hover:scale-[1.05] focus:outline-none focus:ring-1 focus:ring-slate-400/50 bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group text-slate-300"
                          title={
                            isImportingTxt
                              ? tView("importingTxt")
                              : tView("importTxt")
                          }
                        >
                          {isImportingTxt ? (
                            <span className="material-symbols-outlined text-sm animate-spin">
                              progress_activity
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">
                              upload
                            </span>
                          )}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                            {tView("importTxt")}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowExportModal(true)}
                          disabled={
                            !data ||
                            (!data.worst && !data.best && !data.avg) ||
                            analyzing ||
                            isExporting
                          }
                          className="flex items-center justify-center w-8 h-8 rounded-md text-[13px] font-medium transition-all hover:scale-[1.05] focus:outline-none focus:ring-1 focus:ring-slate-400/50 bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group text-slate-300"
                          title={tView("exportReport")}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            download
                          </span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                            {tView("exportReport")}
                          </div>
                        </button>
                        <AAButton
                          onClick={handleAnalyze}
                          disabled={isButtonDisabled}
                          variant="primary"
                          size="sm"
                          className="w-[95px] h-[32px] min-w-[95px] text-xs font-semibold px-2"
                        >
                          {analyzing ? (
                            <div className="relative">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping absolute" />
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            </div>
                          ) : (
                            tView("analyze")
                          )}
                        </AAButton>
                      </div>
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden basis-0">
                    <div className="flex min-h-0 flex-1 basis-0 flex-col">
                      <AnalyzerEditor
                        initialValue={source}
                        onChange={setSource}
                        onAstChange={setAst}
                        onParseStatusChange={handleParseStatusChange}
                        onErrorsChange={handleErrorsChange}
                        height="100%"
                      />
                    </div>
                    <input
                      ref={txtInputRef}
                      type="file"
                      accept=".txt,text/plain"
                      className="hidden"
                      onChange={handleTxtImport}
                    />
                  </div>

                  {/* Estado de parsing y botones */}
                  <div className="mt-4 space-y-3">
                    {/* Estado de parsing */}
                    <div className="flex items-center justify-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {!localParseOk && (
                          <button
                            onClick={() => setShowRepairModal(true)}
                            className="flex items-center justify-center py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400/50 bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/30 relative group"
                          >
                            <span className="material-symbols-outlined text-sm">
                              auto_awesome
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                              {tView("repairWithAI")}
                            </div>
                          </button>
                        )}
                        <button
                          onClick={() => setShowAstModal(true)}
                          disabled={!localParseOk || !ast}
                          className="flex items-center justify-center py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-400/50 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group"
                        >
                          <span className="material-symbols-outlined text-sm">
                            account_tree
                          </span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                            {tView("viewAst")}
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            if (analyzerViewMode === "trace") return;
                            setHasTraceViewMounted(true);
                            setIsSwitchingTrace(true);
                            setTimeout(() => {
                              setAnalyzerViewMode("trace");
                              setIsSwitchingTrace(false);
                            }, 300);
                          }}
                          disabled={!hasComparableData || isSwitchingTrace}
                          className="flex items-center justify-center py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-400/50 bg-gradient-to-br from-blue-500/20 to-blue-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group"
                        >
                          <span className="material-symbols-outlined text-sm">
                            play_circle
                          </span>
                          {!hasComparableData ? (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                              {tView("noCompleteAnalysis")}
                            </div>
                          ) : (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                              {tView("viewExecutionTrace")}
                            </div>
                          )}
                        </button>
                        <button
                          onClick={handleCompareWithLLM}
                          disabled={!hasApiKey || !hasComparableData}
                          className="flex items-center justify-center py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400/50 bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group"
                        >
                          <span className="material-symbols-outlined text-sm">
                            compare_arrows
                          </span>
                          {!hasApiKey || !hasComparableData ? (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                              {!hasApiKey
                                ? tView("apiKeyRequired")
                                : tView("noInfoToCompare")}
                            </div>
                          ) : (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                              {tView("compareWithLLM")}
                            </div>
                          )}
                        </button>
                        {isAlgorithmRecursive ? (
                          <button
                            onClick={() => setShowRecursiveInvariantModal(true)}
                            className="flex items-center justify-center py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-violet-400/50 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 hover:from-violet-500/30 hover:to-fuchsia-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group"
                          >
                            <span className="material-symbols-outlined text-sm">
                              verified_user
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                              {tView("viewRecursiveInvariant")}
                            </div>
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowLoopInvariantModal(true)}
                            disabled={!loopInvariantData}
                            className="flex items-center justify-center py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-400/50 bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 hover:from-red-500/30 hover:to-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group"
                          >
                            <span className="material-symbols-outlined text-sm">
                              verified_user
                            </span>
                            {!loopInvariantData ? (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                                {tView("loopInvariantUnavailable")}
                              </div>
                            ) : (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                                {tView("viewLoopInvariant")}
                              </div>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!ast) return;
                            const analysis = analyzeASTForGPUCPU(
                              ast,
                              (locale === "es" ? "es" : "en") as "en" | "es",
                            );
                            setGpuCpuAnalysis(analysis);
                            setShowGPUCPUModal(true);
                          }}
                          disabled={!ast || !hasComparableData}
                          className="flex items-center justify-center py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-400/50 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group"
                        >
                          <span className="material-symbols-outlined text-sm">
                            speed
                          </span>
                          {!ast || !hasComparableData ? (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                              {!ast
                                ? tView("noAstAvailable")
                                : tView("runAnalysisFirst")}
                            </div>
                          ) : (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                              {tView("gpuVsCpuAnalysis")}
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Columna derecha: costos y ecuaciones (vertical en pantallas grandes) */}
              <section className="flex min-h-0 flex-col lg:col-span-8 lg:h-full">
                <div className="grid h-full min-h-0 grid-cols-1 gap-6 xl:grid-cols-1">
                  {(() => {
                    // Determinar si es recursivo basado en algorithmType o en los datos
                    const isRecursive =
                      algorithmType === "recursive" ||
                      algorithmType === "hybrid" ||
                      data?.worst?.totals?.recurrence ||
                      (typeof data?.best !== "string" &&
                        data?.best?.totals?.recurrence) ||
                      (typeof data?.avg !== "string" &&
                        data?.avg?.totals?.recurrence);

                    if (isRecursive) {
                      // Asegurar que avg esté definido (null en lugar de undefined)
                      const dataWithAvg: {
                        worst: AnalyzeOpenResponse | null;
                        best: AnalyzeOpenResponse | "same_as_worst" | null;
                        avg: AnalyzeOpenResponse | "same_as_worst" | null;
                      } | null = data
                        ? {
                            worst: data.worst ?? null,
                            best: data.best ?? null,
                            avg: data.avg ?? null,
                          }
                        : null;
                      return (
                        <RecursiveAnalysisView
                          data={dataWithAvg}
                          onAssistantFocusedPanelChange={
                            setRecursiveFocusedPanel
                          }
                        />
                      );
                    } else {
                      // Asegurar que avg esté definido (null en lugar de undefined)
                      const dataWithAvg: {
                        worst: AnalyzeOpenResponse | null;
                        best: AnalyzeOpenResponse | "same_as_worst" | null;
                        avg: AnalyzeOpenResponse | "same_as_worst" | null;
                      } | null = data
                        ? {
                            worst: data.worst ?? null,
                            best: data.best ?? null,
                            avg: data.avg ?? null,
                          }
                        : null;
                      return (
                        <div className="flex flex-col lg:h-full lg:min-h-0">
                          <IterativeAnalysisView
                            data={dataWithAvg}
                            selectedCase={selectedCase}
                            onCaseChange={setSelectedCase}
                            onViewLineProcedure={handleViewLineProcedure}
                            onViewGeneralProcedure={handleViewGeneralProcedure}
                          />
                        </div>
                      );
                    }
                  })()}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de procedimiento por línea */}
      <ProcedureModal
        open={open}
        onClose={() => setOpen(false)}
        selectedLine={selectedLine}
        analysisData={selectedAnalysisData}
      />
      {/* Modal de procedimiento general */}
      <GeneralProcedureModal
        open={openGeneral}
        onClose={() => setOpenGeneral(false)}
        caseType={generalProcedureCase}
        data={generalProcedureData}
      />

      {/* Modal AST - Portal a body para que sea overlay fijo */}
      {showAstModal &&
        ast &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center glass-modal-overlay glass-modal-overlay-fixed modal-animate-in">
            <div className="glass-modal-container rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col m-4 modal-animate-in">
              {/* Header compacto */}
              <div className="glass-modal-header flex items-center justify-between px-5 py-3 rounded-t-xl border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-yellow-400">
                    account_tree
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    {tView("abstractSyntaxTree")}
                  </h2>
                </div>
                <button
                  onClick={() => setShowAstModal(false)}
                  className="text-slate-400 hover:text-white text-2xl leading-none transition-all hover:rotate-90 transform duration-200"
                >
                  ×
                </button>
              </div>

              {/* Tabs para cambiar vista */}
              <div className="flex gap-2 px-5 py-3 border-b border-white/10">
                <button
                  onClick={() => setViewMode("tree")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    viewMode === "tree"
                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      account_tree
                    </span>{" "}
                    {tView("treeView")}
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("json")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    viewMode === "json"
                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      code
                    </span>{" "}
                    {tView("jsonView")}
                  </span>
                </button>
              </div>

              {/* Content con altura fija */}
              <div className="h-[300px] overflow-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                {viewMode === "tree" ? (
                  <ASTTreeView node={ast} />
                ) : (
                  <pre className="whitespace-pre-wrap break-words text-xs">
                    {JSON.stringify(ast, null, 2)}
                  </pre>
                )}
              </div>

              {/* Footer compacto */}
              <div className="flex justify-between items-center gap-3 px-5 py-3 border-t border-white/10 rounded-b-xl">
                <div className="text-xs text-slate-400">
                  {viewMode === "tree"
                    ? tView("astTreeViewDesc")
                    : tView("astJsonViewDesc")}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyJson}
                    className={`glass-secondary px-4 py-2 text-xs font-semibold rounded-lg transition-all hover:scale-105 flex items-center gap-2 ${
                      copied
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "text-slate-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copied ? "check" : "content_copy"}
                    </span>
                    {copied ? tView("astModalCopied") : tView("copyJson")}
                  </button>
                  <AAButton
                    onClick={() => setShowAstModal(false)}
                    variant="amber"
                    size="sm"
                  >
                    {tCommon("close")}
                  </AAButton>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <EmbeddedAssistantLauncher
        surface="analyzer"
        assistantContext={assistantContext}
        onAnalyzeCode={(code: string) => {
          if (globalThis.window !== undefined) {
            sessionStorage.setItem("analyzerCode", code);
          }
          globalThis.window.location.reload();
        }}
      />

      {/* Modal de reparación */}
      <RepairModal
        open={showRepairModal}
        onClose={() => {
          setShowRepairModal(false);
          setPendingImportSourceForRepair(null);
          setPendingImportErrorsForRepair(undefined);
        }}
        onAccept={(repairedCode) => {
          setSource(repairedCode);
          setLocalParseOk(false);
          setShowRepairModal(false);
          setPendingImportSourceForRepair(null);
          setPendingImportErrorsForRepair(undefined);
        }}
        originalCode={pendingImportSourceForRepair ?? source}
        parseErrors={pendingImportErrorsForRepair ?? parseErrors}
      />

      <TxtImportModal
        open={txtImportModal !== null}
        title={txtImportModal?.title || ""}
        description={txtImportModal?.description || ""}
        details={txtImportModal?.details}
        confirmLabel={
          txtImportModal?.showRepairAction
            ? tView("repairWithAI")
            : tCommon("close")
        }
        cancelLabel={
          txtImportModal?.showRepairAction ? tCommon("cancel") : undefined
        }
        onCancel={
          txtImportModal?.showRepairAction
            ? () => {
                setTxtImportModal(null);
                setPendingImportSourceForRepair(null);
                setPendingImportErrorsForRepair(undefined);
              }
            : undefined
        }
        onConfirm={() => {
          const mustRepair = txtImportModal?.showRepairAction === true;
          setTxtImportModal(null);
          if (mustRepair) {
            if (pendingImportSourceForRepair) {
              setSource(pendingImportSourceForRepair);
            }
            setParseErrors(pendingImportErrorsForRepair);
            setShowRepairModal(true);
          } else {
            setPendingImportSourceForRepair(null);
            setPendingImportErrorsForRepair(undefined);
          }
        }}
      />

      <ComparisonModal
        open={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        ownData={{
          worst: extractCoreData(data?.worst || null),
          best:
            data?.best === "same_as_worst"
              ? "same_as_worst"
              : extractCoreData(data?.best || null),
          avg:
            data?.avg === "same_as_worst"
              ? "same_as_worst"
              : extractCoreData(data?.avg || null),
        }}
        llmData={llmAnalysisData || { worst: null, best: null, avg: null }}
        note={llmNote}
        isRecursive={isRecursiveAnalysis(
          data?.worst ||
            (data?.best === "same_as_worst" ? null : data?.best) ||
            (data?.avg === "same_as_worst" ? null : data?.avg) ||
            null,
        )}
      />

      {/* Modal de análisis GPU vs CPU */}
      <GPUCPUModal
        open={showGPUCPUModal}
        onClose={() => setShowGPUCPUModal(false)}
        analysis={gpuCpuAnalysis}
      />

      <LoopInvariantModal
        open={showLoopInvariantModal}
        onClose={() => setShowLoopInvariantModal(false)}
        loopInvariant={loopInvariantData}
      />

      <RecursiveInvariantModal
        open={showRecursiveInvariantModal}
        onClose={() => setShowRecursiveInvariantModal(false)}
        recursiveInvariant={recursiveInvariantData}
      />

      <div className="mt-auto w-full">
        <Footer />
      </div>
    </div>
  );
}
