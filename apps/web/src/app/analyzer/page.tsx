"use client";

import type { AnalyzeOpenResponse, ParseResponse, Program } from "@aa/types";
import { useEffect, useRef, useState } from "react";

import { AnalyzerEditor } from "@/components/AnalyzerEditor";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import { ASTTreeView } from "@/components/ASTTreeView";
import ChatBot from "@/components/ChatBot";
import Footer from "@/components/Footer";
import FormulaBlock from "@/components/FormulaBlock";
import Formula from "@/components/Formula";
import Header from "@/components/Header";
import LineTable from "@/components/LineTable";
import ProcedureModal from "@/components/ProcedureModal";
import GeneralProcedureModal from "@/components/GeneralProcedureModal";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { heuristicKind } from "@/lib/algorithm-classifier";
import { GrammarApiService } from "@/services/grammar-api";
import { useChatHistory } from "@/hooks/useChatHistory";

type ClassifyResponse = { kind: "iterative" | "recursive" | "hybrid" | "unknown" };

export default function AnalyzerPage() {
  const { animateProgress } = useAnalysisProgress();

  // Estados del flujo de análisis
  const [source, setSource] = useState<string>(() => {
    // Cargar código desde sessionStorage si viene del editor manual
    if (globalThis.window !== undefined) {
      const savedCode = sessionStorage.getItem('analyzerCode');
      if (savedCode) {
        // Limpiar el código guardado después de cargarlo
        sessionStorage.removeItem('analyzerCode');
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
  const [data, setData] = useState<AnalyzeOpenResponse | null>(() => {
    // Cargar resultados desde sessionStorage si vienen del editor manual
    if (globalThis.window !== undefined) {
      const savedResults = sessionStorage.getItem('analyzerResults');
      if (savedResults) {
        // Limpiar los resultados guardados después de cargarlos
        sessionStorage.removeItem('analyzerResults');
        try {
          return JSON.parse(savedResults);
        } catch (error) {
          console.error('Error parsing saved results:', error);
        }
      }
    }
    return null;
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
  const [showAIHelpButton, setShowAIHelpButton] = useState(false);
  const [backendParseError, setBackendParseError] = useState<string | null>(null);

  // Estados del chat
  const { messages, setMessages } = useChatHistory();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Refs para evitar memory leaks con timeouts
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiHelpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (aiHelpTimeoutRef.current) {
        clearTimeout(aiHelpTimeoutRef.current);
      }
    };
  }, []);

  // Detectar errores de parsing y mostrar botón de ayuda después de 3 segundos
  useEffect(() => {
    // Limpiar timeout anterior
    if (aiHelpTimeoutRef.current) {
      clearTimeout(aiHelpTimeoutRef.current);
    }

    // Si no hay errores locales, ocultar el botón
    if (localParseOk) {
      setShowAIHelpButton(false);
      setBackendParseError(null);
      return;
    }

    // Si hay errores locales, esperar 3 segundos y consultar backend
    aiHelpTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await GrammarApiService.parseCode(source);
        if (data.ok) {
          setShowAIHelpButton(false);
          setBackendParseError(null);
        } else {
          setBackendParseError(data.error || "Error de sintaxis detectado");
          setShowAIHelpButton(true);
        }
      } catch (e) {
        console.error("Error al verificar parse:", e);
        setBackendParseError("Error al verificar el código");
        setShowAIHelpButton(true);
      }
    }, 3000);

    return () => {
      if (aiHelpTimeoutRef.current) {
        clearTimeout(aiHelpTimeoutRef.current);
      }
    };
  }, [localParseOk, source]);

  // Resetear estado de copiado cuando se cierra el modal
  useEffect(() => {
    if (!showAstModal) {
      setCopied(false);
      setViewMode('tree');
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
      console.error('Error al copiar:', err);
    }
  };

  // Funciones para manejar el chat
  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleSwitchToAIMode = () => {
    // Cambiar al modo AI (funcionalidad futura)
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
      const parseRes = await animateProgress(0, 20, 2000, setAnalysisProgress, parsePromise) as ParseResponse;

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
        const clsPromise = fetch("/api/llm/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, mode: "auto" }),
        });

        // Animar progreso mientras se clasifica (espera a que clsPromise se resuelva)
        const clsResponse = await animateProgress(20, 40, 3000, setAnalysisProgress, clsPromise) as Response;

        if (clsResponse.ok) {
          const cls = await clsResponse.json() as ClassifyResponse & { method?: string; mode?: string };
          kind = cls.kind;
          setAlgorithmType(kind);
          setAnalysisMessage(`Algoritmo identificado: ${kind === "iterative" ? "Iterativo" : kind === "recursive" ? "Recursivo" : kind === "hybrid" ? "Híbrido" : "Desconocido"}`);
          console.log(`[Analyzer] Clasificación: ${kind} (método: ${cls.method})`);
        } else {
          throw new Error(`HTTP ${clsResponse.status}`);
        }
      } catch (error) {
        console.warn(`[Analyzer] Error en clasificación, usando heurística:`, error);
        kind = heuristicKind(parseRes.ast);
        setAlgorithmType(kind);
        setAnalysisMessage(`Algoritmo identificado: ${kind === "iterative" ? "Iterativo" : kind === "recursive" ? "Recursivo" : kind === "hybrid" ? "Híbrido" : "Desconocido"}`);
      }

      // 3) Rechazar algoritmos recursivos o híbridos
      if (kind === "recursive" || kind === "hybrid") {
        console.warn(`[Analyzer] Algoritmo ${kind} no soportado`);
        const kindLabel = kind === "recursive" ? "recursivo" : "híbrido";
        setAnalysisError(`El algoritmo ${kindLabel} no está soportado en esta versión. Por favor, usa un algoritmo iterativo.`);
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

      // 4) Realizar el análisis de complejidad (40-80%)
      setAnalysisMessage("Hallando sumatorias...");
      await animateProgress(40, 50, 500, setAnalysisProgress);

      setAnalysisMessage("Simplificando expresiones matemáticas...");
      const analyzePromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyze/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, mode: "worst" }),
      }).then(r => r.json() as Promise<AnalyzeOpenResponse>);

      // Animar progreso mientras se simplifica (espera a que analyzePromise se resuelva)
      const analyzeRes = await animateProgress(50, 70, 5000, setAnalysisProgress, analyzePromise) as AnalyzeOpenResponse;

      setAnalysisMessage("Generando forma polinómica...");
      await animateProgress(70, 80, 500, setAnalysisProgress);

      if (!analyzeRes.ok) {
        console.error("Error en análisis:", analyzeRes);
        const errorMsg = (analyzeRes as { errors?: Array<{ message: string; line?: number; column?: number }> }).errors?.map((e: { message: string; line?: number; column?: number }) =>
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

      // 5) Finalizar (80-100%)
      setAnalysisMessage("Finalizando análisis...");
      await animateProgress(80, 100, 500, setAnalysisProgress);

      // 6) Actualizar los datos
      setData(analyzeRes);

      // 7) Mostrar completado y esperar 2 segundos
      setAnalysisMessage("Análisis completo");
      setIsAnalysisComplete(true);

      // Esperar 2 segundos antes de cerrar el loader
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Cerrar loader
      setAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisMessage("Iniciando análisis...");
      setAlgorithmType(undefined);
      setIsAnalysisComplete(false);

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

  const handleViewLineProcedure = (lineNo: number) => {
    setSelectedLine(lineNo);
    setOpen(true);
  };

  const [openGeneral, setOpenGeneral] = useState(false);
  const handleViewGeneralProcedure = () => {
    setOpenGeneral(true);
  };

  // Selector de casos (worst por defecto, preparado para best/average)
  const [selectedCase, setSelectedCase] = useState<'worst' | 'average' | 'best'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.sessionStorage.getItem('analyzerSelectedCase');
      if (saved === 'best' || saved === 'average' || saved === 'worst') return saved;
    }
    return 'worst';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('analyzerSelectedCase', selectedCase);
    }
  }, [selectedCase]);

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
                    height="400px"
                    showToolbar={true}
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
                      {/* Botón de Ayuda con IA - deshabilitado por el momento */}
                      {showAIHelpButton && backendParseError && (
                        <button
                          disabled
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all opacity-40 cursor-not-allowed bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-purple-500/30"
                        >
                          <span className="material-symbols-outlined text-sm">smart_toy</span>
                          Ayuda IA
                        </button>
                      )}
                      <button
                        onClick={() => setShowAstModal(true)}
                        disabled={!localParseOk || !ast}
                        className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-400/50 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <span className="material-symbols-outlined text-sm">account_tree</span>
                        Ver AST
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Columna derecha: costos y ecuaciones (vertical en pantallas grandes) */}
            <section className="lg:col-span-8 h-full">
              <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 h-full">
                {/* Card de costos por línea (encima en pantallas grandes) */}
                <div className="glass-card p-4 rounded-lg h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined mr-2 text-amber-400">table_chart</span>{" "}
                      Costos por Línea
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wide ${selectedCase === 'worst' ? 'bg-red-500/15 text-red-300 border-red-500/25' :
                            selectedCase === 'average' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25' :
                              'bg-green-500/15 text-green-300 border-green-500/25'
                          }`}
                      >
                        {selectedCase === 'worst' ? 'Peor' : selectedCase === 'average' ? 'Promedio' : 'Mejor'}
                      </span>
                    </h2>
                    <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-1">
                      <button
                        onClick={() => setSelectedCase('best')}
                        className={`px-2 py-1 text-xs rounded-md ${selectedCase === 'best' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'text-slate-300 hover:bg-white/5'}`}
                      >Mejor</button>
                      <button
                        onClick={() => setSelectedCase('average')}
                        className={`px-2 py-1 text-xs rounded-md ${selectedCase === 'average' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'text-slate-300 hover:bg:white/5'}`}
                      >Promedio</button>
                      <button
                        onClick={() => setSelectedCase('worst')}
                        className={`px-2 py-1 text-xs rounded-md ${selectedCase === 'worst' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-300 hover:bg-white/5'}`}
                      >Peor</button>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {data ? (
                      selectedCase === 'worst' ? (
                        <div className="overflow-auto scrollbar-custom" style={{ maxHeight: '285px' }}>
                          <LineTable rows={data.byLine} onViewProcedure={handleViewLineProcedure} />
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                          <div className="text-center">
                            <span className="material-symbols-outlined text-4xl mb-2 block">hourglass_empty</span>
                            <p>El caso “{selectedCase === 'best' ? 'Mejor' : 'Promedio'}” estará disponible próximamente</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <span className="material-symbols-outlined text-4xl mb-2 block">table_chart</span>
                          <p>Ejecuta el análisis para ver los costos</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card de ecuaciones matemáticas (abajo en pantallas grandes) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card p-4 rounded-lg text-center">
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                        <div className="scale-110">
                          <Formula latex={"O(—)"} />
                        </div>
                      </div>
                      <h3 className="font-semibold text-green-300 mb-1">Mejor caso</h3>

                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-slate-400 border border-white/10 bg-white/5 cursor-not-allowed opacity-60"
                        title="Próximamente"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Ver Procedimiento (próximamente)
                      </button>
                    </div>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                        <div className="scale-110">
                          <Formula latex={"O(—)"} />
                        </div>
                      </div>
                      <h3 className="font-semibold text-yellow-300 mb-1">Caso promedio</h3>
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold text-slate-400 border border-white/10 bg-white/5 cursor-not-allowed opacity-60"
                        title="Próximamente"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Ver Procedimiento (próximamente)
                      </button>
                    </div>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                        <div className="scale-110">
                          <Formula latex={(() => {
                            if (!data || !(data as any).ok) return 'O(—)';
                            const base = ((data.totals as any)?.T_polynomial as string | undefined) || data.totals.T_open;
                            const poly = typeof base === 'string' ? base : '';
                            if (poly.includes('n^3')) return 'O(n^3)';
                            if (poly.includes('n^2')) return 'O(n^2)';
                            if (/([^\\^]|^)n(?![\\w^])/.test(poly)) return 'O(n)';
                            if (poly.includes('\\\log(n)')) return 'O(\\log n)';
                            return 'O(1)';
                          })()} />
                        </div>
                      </div>
                      <h3 className="font-semibold text-red-300 mb-1">Peor caso</h3>
                      <button
                        onClick={handleViewGeneralProcedure}
                        disabled={!data || !(data as any).ok}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors ${data && (data as any).ok ? 'text-white glass-secondary hover:bg-sky-500/20' : 'text-slate-400 border border-white/10 bg:white/5 cursor-not-allowed opacity-60'}`}
                        title={data && (data as any).ok ? 'Ver procedimiento general' : 'Ejecuta el análisis para ver el procedimiento'}
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Ver Procedimiento
                      </button>
                    </div>
                  </div>
                </div>
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
        analysisData={data}
      />
      {/* Modal de procedimiento general */}
      <GeneralProcedureModal
        open={openGeneral}
        onClose={() => setOpenGeneral(false)}
        data={data || null}
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
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'tree'
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
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'json'
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
                <pre className="text-xs text-slate-200 p-4 rounded-lg border border-white/10 overflow-x-auto font-mono h-full">
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
                  className={`glass-secondary px-4 py-2 text-xs font-semibold rounded-lg transition-all hover:scale-105 flex items-center gap-2 ${copied ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'text-slate-200'
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
      />

      <Footer />
    </div>
  );
}