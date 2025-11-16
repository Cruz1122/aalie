"use client";

import type { AnalyzeOpenResponse, ParseResponse, Program } from "@aa/types";
import { useEffect, useRef, useState } from "react";

import { AnalysisLoader } from "@/components/AnalysisLoader";
import { AnalyzerEditor } from "@/components/AnalyzerEditor";
import { ASTTreeView } from "@/components/ASTTreeView";
import ChatBot from "@/components/ChatBot";
import Footer from "@/components/Footer";
import Formula from "@/components/Formula";
import GeneralProcedureModal from "@/components/GeneralProcedureModal";
import Header from "@/components/Header";
import LineTable from "@/components/LineTable";
import ProcedureModal from "@/components/ProcedureModal";
import IterativeAnalysisView from "@/components/IterativeAnalysisView";
import RecursiveAnalysisView from "@/components/RecursiveAnalysisView";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { getApiKey } from "@/hooks/useApiKey";
import { useChatHistory } from "@/hooks/useChatHistory";
import { heuristicKind } from "@/lib/algorithm-classifier";
import { calculateBigO, getSavedCase, saveCase } from "@/lib/polynomial";
import { getBestAsymptoticNotation as getBestNotation } from "@/lib/asymptotic-notation";

type ClassifyResponse = { kind: "iterative" | "recursive" | "hybrid" | "unknown" };

export default function AnalyzerPage() {
  const { animateProgress } = useAnalysisProgress();

  // Estados del flujo de análisis
  const [source, setSource] = useState<string>(() => {
    // Cargar código desde sessionStorage si viene del editor manual o del chatbot
    if (globalThis.window !== undefined) {
      const savedCode = globalThis.window.sessionStorage.getItem('analyzerCode');
      if (savedCode) {
        // NO limpiar el código aquí todavía, se limpiará después de cargar
        return savedCode;
      }
    }
    return "";
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("Iniciando análisis...");
  const [algorithmType, setAlgorithmType] = useState<"iterative" | "recursive" | "hybrid" | "unknown" | undefined>(undefined);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [data, setData] = useState<{
    worst: AnalyzeOpenResponse | null;
    best: AnalyzeOpenResponse | null;
    avg?: AnalyzeOpenResponse | null;
  }>(() => {
    // Cargar resultados desde sessionStorage si vienen del editor manual o del chatbot
    if (globalThis.window !== undefined) {
      const savedResults = globalThis.window.sessionStorage.getItem('analyzerResults');
      if (savedResults) {
        try {
          const parsed = JSON.parse(savedResults);
          // Limpiar los resultados guardados después de cargarlos
          globalThis.window.sessionStorage.removeItem('analyzerResults');
          // También limpiar el código después de cargarlo
          globalThis.window.sessionStorage.removeItem('analyzerCode');
          // Si es el formato antiguo (solo worst), convertirlo al nuevo formato
          if (parsed && !parsed.worst && !parsed.best) {
            return { worst: parsed, best: null, avg: null };
          }
          // Si es el formato nuevo (con worst, best, avg), extraer solo esos campos
          if (parsed && (parsed.worst || parsed.best)) {
            return {
              worst: parsed.worst || null,
              best: parsed.best || null,
              avg: parsed.avg || null
            };
          }
          return { worst: null, best: null, avg: null };
        } catch (error) {
          console.error('Error parsing saved results:', error);
          // Limpiar datos corruptos
          globalThis.window.sessionStorage.removeItem('analyzerResults');
          globalThis.window.sessionStorage.removeItem('analyzerCode');
        }
      }
    }
    return { worst: null, best: null, avg: null };
  });

  // Estados para el modal
  const [open, setOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // Estados para parsing local y AST
  const [ast, setAst] = useState<Program | null>(null);
  const [showAstModal, setShowAstModal] = useState(false);
  const [localParseOk, setLocalParseOk] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');
  // Estados del chat
  const { messages, setMessages } = useChatHistory();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Refs para evitar memory leaks con timeouts
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manejar cambios en el estado de parsing local
  const handleParseStatusChange = (ok: boolean, _isParsing: boolean) => {
    setLocalParseOk(ok);
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
      setViewMode('tree');
    }
  }, [showAstModal]);

  // Estado para indicar que se debe ejecutar análisis automático (ya no se usa, se eliminó)
  // Los datos ahora vienen directamente desde sessionStorage cuando están guardados

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
      console.error('Error al copiar:', err);
    }
  };

  // Handler para el clic del botón de análisis
  const handleAnalyze = async () => {
    // Verificar que no esté ya analizando
    if (analyzing) return;

    // Activar estado de carga inmediatamente
    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisMessage("Iniciando análisis...");
    setAlgorithmType(undefined);
    setIsAnalysisComplete(false);
    setAnalysisError(null);

    try {
      // 1) Parsear el código (0-20%)
      setAnalysisMessage("Parseando código...");
      const parsePromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/grammar/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      }).then(r => r.json() as Promise<ParseResponse>);

      // Animar progreso mientras se parsea (espera a que parsePromise se resuelva)
      const parseRes = await animateProgress(0, 20, 800, setAnalysisProgress, parsePromise) as ParseResponse;

      if (!parseRes.ok) {
        console.error("Error en parse:", parseRes);
        const errorMsg = parseRes.errors?.map((e: { line?: number; column?: number; message: string }) =>
          `Línea ${e.line || '?'}:${e.column || '?'} ${e.message}`
        ).join("\n") || "Error al parsear el código";
        setAnalysisError(errorMsg);
        setTimeout(() => {
          setAnalyzing(false);
          setAnalysisProgress(0);
          setAnalysisMessage("Iniciando análisis...");
          setAlgorithmType(undefined);
          setIsAnalysisComplete(false);
          setAnalysisError(null);
        }, 3000);
        return;
      }

      // 2) Clasificar el algoritmo (20-40%)
      setAnalysisMessage("Clasificando algoritmo...");
      let kind: ClassifyResponse["kind"];
      try {
        const apiKey = getApiKey();
        const clsPromise = fetch("/api/llm/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, mode: "local", apiKey: apiKey || undefined }),
        });

        // Animar progreso mientras se clasifica (espera a que clsPromise se resuelva)
        const clsResponse = await animateProgress(20, 40, 1200, setAnalysisProgress, clsPromise) as Response;

        if (clsResponse.ok) {
          const cls = await clsResponse.json() as ClassifyResponse & { method?: string; mode?: string };
          kind = cls.kind;
          setAlgorithmType(kind);
          setAnalysisMessage(`Algoritmo identificado: ${formatAlgorithmKind(kind)}`);
          console.log(`[Analyzer] Clasificación: ${kind} (método: ${cls.method})`);
        } else {
          throw new Error(`HTTP ${clsResponse.status}`);
        }
      } catch (error) {
        console.warn(`[Analyzer] Error en clasificación, usando heurística:`, error);
        kind = heuristicKind(parseRes.ast);
        setAlgorithmType(kind);
        setAnalysisMessage(`Algoritmo identificado: ${formatAlgorithmKind(kind)}`);
      }

      // 3) Realizar el análisis de complejidad (40-80%)
      const isRecursive = kind === "recursive" || kind === "hybrid";
      
      let progressBeforeAnalysis: number;
      
      if (isRecursive) {
        setAnalysisMessage("Verificando condiciones...");
        await animateProgress(40, 50, 300, setAnalysisProgress);
        setAnalysisMessage("Extrayendo recurrencia...");
        await animateProgress(50, 65, 400, setAnalysisProgress);
        setAnalysisMessage("Normalizando recurrencia...");
        await animateProgress(65, 75, 300, setAnalysisProgress);
        setAnalysisMessage("Aplicando Teorema Maestro...");
        await animateProgress(75, 85, 500, setAnalysisProgress);
        // Añadir transición suave antes de iniciar el análisis real
        setAnalysisMessage("Iniciando análisis de complejidad...");
        await animateProgress(85, 90, 400, setAnalysisProgress);
        progressBeforeAnalysis = 90;
      } else {
        setAnalysisMessage("Hallando sumatorias...");
        await animateProgress(40, 50, 200, setAnalysisProgress);
        setAnalysisMessage("Cerrando sumatorias...");
        await animateProgress(50, 55, 200, setAnalysisProgress);
        progressBeforeAnalysis = 55;
      }

      // Obtener API key (solo necesitamos la key, no el status completo)
      const apiKey = getApiKey();
      
      // Realizar una sola petición que trae todos los casos (worst, best y avg)
      const analyzeBody: { 
        source: string; 
        mode: string; 
        api_key?: string;
        avgModel?: { mode: string; predicates?: Record<string, string> };
        algorithm_kind?: string;
      } = { 
        source, 
        mode: "all",
        avgModel: {
          mode: "uniform",
          predicates: {}
        },
        algorithm_kind: kind  // Enviar el tipo de algoritmo al backend
      };
      if (apiKey) {
        analyzeBody.api_key = apiKey;  // Mantener por compatibilidad, pero backend ya no lo usa para simplificación
      }
      
      // Actualizar mensaje antes de iniciar el análisis real
      if (isRecursive) {
        setAnalysisMessage("Calculando complejidad...");
      } else {
        setAnalysisMessage("Analizando complejidad...");
      }
      
      const analyzePromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyze/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyzeBody),
      }).then(r => r.json());

      // Animar progreso mientras se analiza (continuar desde donde quedó según el tipo)
      // Para recursivos: 90 → 95, para iterativos: 55 → 95
      const analyzeRes = await animateProgress(progressBeforeAnalysis, 95, 2500, setAnalysisProgress, analyzePromise) as {
        ok: boolean;
        worst?: AnalyzeOpenResponse;
        best?: AnalyzeOpenResponse;
        avg?: AnalyzeOpenResponse;
        errors?: Array<{ message: string; line?: number; column?: number }>;
      };

      setAnalysisMessage("Generando forma polinómica...");
      await animateProgress(95, 100, 200, setAnalysisProgress);

      // Verificar errores
      if (!analyzeRes.ok) {
        console.error("Error en análisis:", analyzeRes);
        const errorMsg = analyzeRes.errors?.map((e: { message: string; line?: number; column?: number }) =>
          e.message || `Error en línea ${e.line || '?'}`
        ).join("\n") || "Error al analizar el algoritmo";
        setAnalysisError(errorMsg);
        setTimeout(() => {
          setAnalyzing(false);
          setAnalysisProgress(0);
          setAnalysisMessage("Iniciando análisis...");
          setAlgorithmType(undefined);
          setIsAnalysisComplete(false);
          setAnalysisError(null);
        }, 3000);
        return;
      }

      // Verificar que tenemos worst y best (avg es opcional)
      if (!analyzeRes.worst || !analyzeRes.best) {
        console.error("Error: No se recibieron worst y best en la respuesta", analyzeRes);
        setAnalysisError("Error: No se pudieron obtener worst y best del análisis");
        setTimeout(() => {
          setAnalyzing(false);
          setAnalysisProgress(0);
          setAnalysisMessage("Iniciando análisis...");
          setAlgorithmType(undefined);
          setIsAnalysisComplete(false);
          setAnalysisError(null);
        }, 3000);
        return;
      }

      // 6) Actualizar los datos con todos los casos (worst, best y avg si está disponible)
      setData({ 
        worst: analyzeRes.worst, 
        best: analyzeRes.best,
        avg: analyzeRes.avg  // Puede ser undefined si falló, pero el frontend lo maneja
      });
      
      // Asegurar que algorithmType se mantenga (puede haberse perdido)
      if (!algorithmType && (analyzeRes.worst?.totals?.recurrence || analyzeRes.best?.totals?.recurrence)) {
        setAlgorithmType("recursive");
        console.log('[Analyzer] algorithmType restaurado a "recursive" basado en datos');
      }
      
      // Debug: verificar que el tipo de algoritmo sea correcto
      console.log('[Analyzer] Datos actualizados:', {
        algorithmType: algorithmType || "recursive (detectado desde datos)",
        hasWorst: !!analyzeRes.worst,
        hasBest: !!analyzeRes.best,
        hasAvg: !!analyzeRes.avg,
        worstHasRecurrence: !!analyzeRes.worst?.totals?.recurrence,
        worstHasMaster: !!analyzeRes.worst?.totals?.master
      });

      // 7) Mostrar completado y cerrar de forma suave
      setAnalysisMessage("Análisis completo");
      setIsAnalysisComplete(true);
      
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
        setAnalysisMessage("Iniciando análisis...");
        setAlgorithmType(undefined);
        setIsAnalysisComplete(false);
      }, 350);

    } catch (error) {
      console.error("[Analyzer] Error inesperado:", error);
      const errorMsg = error instanceof Error ? error.message : "Error inesperado durante el análisis";
      setAnalysisError(errorMsg);
      setTimeout(() => {
        setAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisMessage("Iniciando análisis...");
        setAlgorithmType(undefined);
        setIsAnalysisComplete(false);
        setAnalysisError(null);
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
  const [generalProcedureCase, setGeneralProcedureCase] = useState<'worst' | 'best' | 'average'>('worst');
  const handleViewGeneralProcedure = (caseType: 'worst' | 'best' | 'average' = 'worst') => {
    setGeneralProcedureCase(caseType);
    setOpenGeneral(true);
  };

  type CaseType = 'worst' | 'average' | 'best';

  // Helper para obtener Big-O de los datos según el caso
  // Helper para obtener la mejor notación asintótica disponible según el caso
  // Usa la lógica de priorización: Θ > (Ω,O) > solo O > solo Ω
  const getBestAsymptoticNotation = (caseType: 'worst' | 'best' | 'average') => {
    const analysisData = caseType === 'worst' ? data?.worst : 
                        caseType === 'best' ? data?.best :
                        caseType === 'average' ? data?.avg : null;
    
    if (!analysisData?.ok) {
      return {
        notation: caseType === 'best' ? 'Ω(—)' : caseType === 'worst' ? 'O(—)' : 'Θ(—)',
        type: 'single-bound' as const,
        boundType: (caseType === 'best' ? 'lower' : caseType === 'worst' ? 'upper' : 'exact') as const,
        hasHypothesis: false,
        isConditional: false,
        chips: [],
      };
    }
    
    const totals = analysisData.totals as {
      big_theta?: string;
      big_o?: string;
      big_omega?: string;
      avg_model_info?: { mode: string; note: string };
      hypotheses?: string[];
      symbols?: Record<string, string>;
    };
    
    return getBestNotation(caseType, totals);
  };

  // Helpers legacy (mantener para compatibilidad si se usan en otros lugares)
  const getBigOFromData = (caseType: 'worst' | 'best' | 'average' = 'worst'): string => {
    const analysisData = caseType === 'worst' ? data?.worst : 
                        caseType === 'best' ? data?.best :
                        caseType === 'average' ? data?.avg : null;
    if (!analysisData?.ok) return 'O(—)';
    const totals = analysisData.totals as { big_o?: string } | undefined;
    if (totals?.big_o) {
      return totals.big_o;
    }
    const base = analysisData.totals?.T_polynomial ?? analysisData.totals.T_open;
    return calculateBigO(base);
  };

  const getBigOmegaFromData = (caseType: 'worst' | 'best' | 'average' = 'best'): string => {
    const analysisData = caseType === 'worst' ? data?.worst : 
                        caseType === 'best' ? data?.best :
                        caseType === 'average' ? data?.avg : null;
    if (!analysisData?.ok) return 'Ω(—)';
    const totals = analysisData.totals as { big_omega?: string } | undefined;
    if (totals?.big_omega) {
      return totals.big_omega;
    }
    const base = analysisData.totals?.T_polynomial ?? analysisData.totals.T_open;
    const bigO = calculateBigO(base);
    return bigO.replace('O(', 'Ω(');
  };

  const getBigThetaFromData = (caseType: 'worst' | 'best' | 'average' = 'worst'): string => {
    const analysisData = caseType === 'worst' ? data?.worst : 
                        caseType === 'best' ? data?.best :
                        caseType === 'average' ? data?.avg : null;
    if (!analysisData?.ok) return 'Θ(—)';
    const totals = analysisData.totals as { big_theta?: string } | undefined;
    if (totals?.big_theta) {
      return totals.big_theta;
    }
    const base = analysisData.totals?.T_polynomial ?? analysisData.totals.T_open;
    const bigO = calculateBigO(base);
    return bigO.replace('O(', 'Θ(');
  };

  // Helper para obtener el label del caso
  const getCaseLabel = (caseType: CaseType): string => {
    switch (caseType) {
      case 'worst': return 'Peor';
      case 'average': return 'Promedio';
      case 'best': return 'Mejor';
      default: return '';
    }
  };

  // Helper para obtener el estilo del badge según el caso
  const getCaseBadgeStyle = (caseType: CaseType): string => {
    switch (caseType) {
      case 'worst': return 'bg-red-500/15 text-red-300 border-red-500/25';
      case 'average': return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25';
      case 'best': return 'bg-green-500/15 text-green-300 border-green-500/25';
      default: return '';
    }
  };

  // Helper para obtener el estilo del botón del selector según el caso
  const getSelectorButtonStyle = (caseType: CaseType, isSelected: boolean): string => {
    if (!isSelected) return 'text-slate-300 hover:bg-white/5';
    
    switch (caseType) {
      case 'worst': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'average': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'best': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      default: return '';
    }
  };

  const formatAlgorithmKind = (value: ClassifyResponse["kind"]): string => {
    switch (value) {
      case "iterative":
        return "Iterativo";
      case "recursive":
        return "Recursivo";
      case "hybrid":
        return "Híbrido";
      default:
        return "Desconocido";
    }
  };

  const formatUnsupportedKindMessage = (value: ClassifyResponse["kind"]): string => {
    return value === "recursive" ? "recursivo" : "híbrido";
  };

  const renderLineCostContent = () => {
    if (!data || (!data.worst && !data.best && !data.avg)) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2 block">table_chart</span>
            <p>Ejecuta el análisis para ver los costos</p>
          </div>
        </div>
      );
    }

    // Obtener datos según el caso seleccionado
    const currentData = selectedCase === 'worst' ? data?.worst : 
                       selectedCase === 'best' ? data?.best :
                       selectedCase === 'average' ? data?.avg : null;

    if (!currentData || !currentData.ok) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2 block">hourglass_empty</span>
            <p>El caso &quot;{getCaseLabel(selectedCase)}&quot; estará disponible próximamente</p>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-auto scrollbar-custom" style={{ height: '285px' }}>
        <LineTable rows={currentData.byLine} onViewProcedure={handleViewLineProcedure} />
      </div>
    );
  };

  // Selector de casos (worst por defecto, preparado para best/average)
  // Inicializar con 'worst' para evitar errores de hidratación (el servidor no tiene acceso a sessionStorage)
  const [selectedCase, setSelectedCase] = useState<CaseType>('worst');
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

  // Computar si el botón debe estar deshabilitado
  const isButtonDisabled = analyzing || !source.trim() || !localParseOk;

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      {/* Loader de análisis */}
      {analyzing && (
        <AnalysisLoader
          progress={analysisProgress}
          message={analysisMessage}
          algorithmType={algorithmType}
          isComplete={isAnalysisComplete}
          error={analysisError}
          onClose={() => {
            setAnalyzing(false);
            setAnalysisProgress(0);
            setAnalysisMessage("Iniciando análisis...");
            setAlgorithmType(undefined);
            setIsAnalysisComplete(false);
            setAnalysisError(null);
          }}
        />
      )}

      <Header />

      <main className="flex-1 p-6 z-10">
        <div className="max-w-7xl mx-auto">

          {/* Main layout: código vertical, costos y ecuaciones horizontales */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna izquierda: código fuente (vertical) */}
            <section className="lg:col-span-4 h-full">
              <div className="glass-card p-4 rounded-lg h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold flex items-center">
                    <span className="material-symbols-outlined mr-2 text-blue-400">code</span>{" "}
                    Código Fuente
                  </h2>
                  <button
                    onClick={handleAnalyze}
                    disabled={isButtonDisabled}
                    className="glass-button px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center w-[100px] h-[36px]"
                  >
                    {analyzing ? (
                      <div className="relative">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping absolute" />
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                    ) : (
                      "Analizar"
                    )}
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AnalyzerEditor
                    initialValue={source}
                    onChange={setSource}
                    onAstChange={setAst}
                    onParseStatusChange={handleParseStatusChange}
                    height="430px"
                  />
                </div>

                {/* Estado de parsing y botones */}
                <div className="mt-4 space-y-3">
                  {/* Estado de parsing */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${localParseOk ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-sm text-slate-300">
                        {localParseOk ? 'Sin errores' : 'Con errores'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAstModal(true)}
                        disabled={!localParseOk || !ast}
                        className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-400/50 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <span className="material-symbols-outlined text-sm">account_tree</span>
                        <span>Ver AST</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Columna derecha: costos y ecuaciones (vertical en pantallas grandes) */}
            <section className="lg:col-span-8 h-full">
              <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 h-full">
                {(() => {
                  // Determinar si es recursivo basado en algorithmType o en los datos
                  const isRecursive = 
                    algorithmType === "recursive" || 
                    algorithmType === "hybrid" ||
                    (data?.worst?.totals?.recurrence || data?.best?.totals?.recurrence || data?.avg?.totals?.recurrence);
                  
                  if (isRecursive) {
                    return <RecursiveAnalysisView data={data} />;
                  } else {
                    return (
                      <IterativeAnalysisView
                        data={data}
                        selectedCase={selectedCase}
                        onCaseChange={setSelectedCase}
                        onViewLineProcedure={handleViewLineProcedure}
                        onViewGeneralProcedure={handleViewGeneralProcedure}
                      />
                    );
                  }
                })()}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Modal de procedimiento por línea */}
      <ProcedureModal
        open={open}
        onClose={() => setOpen(false)}
        selectedLine={selectedLine}
        analysisData={selectedCase === 'worst' ? data?.worst : 
                      selectedCase === 'best' ? data?.best :
                      selectedCase === 'average' ? data?.avg : undefined}
      />
      {/* Modal de procedimiento general */}
      <GeneralProcedureModal
        open={openGeneral}
        onClose={() => setOpenGeneral(false)}
        data={generalProcedureCase === 'worst' ? data?.worst : 
              generalProcedureCase === 'best' ? data?.best :
              generalProcedureCase === 'average' ? data?.avg : undefined}
      />

      {/* Modal AST */}
      {showAstModal && ast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-modal-overlay modal-animate-in">
          <div className="glass-modal-container rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col m-4 modal-animate-in">
            {/* Header compacto */}
            <div className="glass-modal-header flex items-center justify-between px-5 py-3 rounded-t-xl border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-yellow-400">account_tree</span>
                <h2 className="text-lg font-bold text-white">
                  Abstract Syntax Tree
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
                onClick={() => setViewMode('tree')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  viewMode === 'tree'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">account_tree</span>{' '}
                  Vista de Árbol
                </span>
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  viewMode === 'json'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">code</span>{' '}
                  Vista JSON
                </span>
              </button>
            </div>

            {/* Content con altura fija */}
            <div className="h-[300px] overflow-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
              {viewMode === 'tree' ? (
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
                {viewMode === 'tree' ? 'Vista interactiva del árbol' : 'Vista JSON completa'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJson}
                  className={`glass-secondary px-4 py-2 text-xs font-semibold rounded-lg transition-all hover:scale-105 flex items-center gap-2 ${
                    copied ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'Copiado!' : 'Copiar JSON'}
                </button>
                <button
                  onClick={() => setShowAstModal(false)}
                  className="glass-button px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all hover:scale-105 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-amber-500/30"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ChatBot */}
      <ChatBot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        setMessages={setMessages}
        onAnalyzeCode={(code: string) => {
          // Guardar código y recargar la página con el nuevo código
          if (globalThis.window !== undefined) {
            sessionStorage.setItem('analyzerCode', code);
          }
          // Recargar para que el código se cargue desde sessionStorage
          globalThis.window.location.reload();
        }}
      />

      <Footer />
    </div>
  );
}