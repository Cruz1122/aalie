"use client";

import type { AnalyzeOpenResponse, ParseResponse, Program } from "@aa/types";
import { useEffect, useRef, useState } from "react";

import { AnalyzerEditor } from "@/components/AnalyzerEditor";
import { ASTTreeView } from "@/components/ASTTreeView";
import ChatBot from "@/components/ChatBot";
import Footer from "@/components/Footer";
import FormulaBlock from "@/components/FormulaBlock";
import Header from "@/components/Header";
import LineTable from "@/components/LineTable";
import ProcedureModal from "@/components/ProcedureModal";
import { GrammarApiService } from "@/services/grammar-api";
import { useChatHistory } from "@/hooks/useChatHistory";

type ClassifyResponse = { kind: "iterative" | "recursive" | "hybrid" | "unknown" };

export default function AnalyzerPage() {
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
  const [parsing, setParsing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
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

  // Función heurística de fallback para clasificar algoritmos
  const heuristicKind = (ast: any): ClassifyResponse["kind"] => {
    try {
      const text = JSON.stringify(ast);
      if (text.includes('"type":"For"') || text.includes('"type":"While"') || text.includes('"type":"Repeat"')) {
        return "iterative";
      }
      // súper simple detección de recursión:
      const m = /"type":"ProcDef","name":"([^"]+)"/.exec(text);
      if (m) {
        const name = m[1];
        if (text.includes(`"type":"Call","callee":"${name}"`)) return "recursive";
      }
      return "unknown";
    } catch { 
      return "unknown"; 
    }
  };

  // Función principal del flujo de análisis
  async function onAnalyzeClick() {
    setParsing(true);
    try {
      // 1) /parse
      const parseRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/grammar/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }), // JSON.stringify preserva \n
      }).then(r => r.json() as Promise<ParseResponse>);

      setParsing(false);

      if (!parseRes.ok) {
        return;
      }

      // 2) Clasificar (BFF). Si falla, heurística.
      let kind: ClassifyResponse["kind"];
      try {
        const clsResponse = await fetch("/api/llm/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, mode: "auto" }), // Permitir modo auto
        });
        
        if (!clsResponse.ok) {
          throw new Error(`HTTP ${clsResponse.status}: ${clsResponse.statusText}`);
        }
        
        const cls = await clsResponse.json() as ClassifyResponse & { method?: string; mode?: string };
        kind = cls.kind;
        console.log(`[Analyzer] Clasificación: ${kind} (método: ${cls.method}, modo: ${cls.mode})`);
      } catch (error) {
        console.warn(`[Analyzer] Error en clasificación, usando heurística:`, error);
        kind = heuristicKind(parseRes.ast); // fallback
        console.log(`[Analyzer] Fallback heurístico: ${kind}`);
      }

      // Permitir algoritmos iterativos y básicos (asignaciones, etc.)
      if (kind === "recursive" || kind === "hybrid") {
        return;
      }

      // 3) /analyze (modo worst por ahora)
      setAnalyzing(true);
      const analyzeRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyze/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, mode: "worst" }),
      }).then(r => r.json() as Promise<AnalyzeOpenResponse>);
      setAnalyzing(false);

      if (!analyzeRes.ok) {
        return;
      }

      setData(analyzeRes);
    } catch (e: any) {
      console.error("Error en análisis:", e);
      setParsing(false);
      setAnalyzing(false);
    }
  }

  const handleViewLineProcedure = (lineNo: number) => {
    setSelectedLine(lineNo);
    setOpen(true);
  };

  const handleViewGeneralProcedure = () => {
    setSelectedLine(null);
    setOpen(true);
  };

  // Función para obtener el texto del botón según el estado
  function getButtonText() {
    if (parsing) return "Parseando...";
    if (analyzing) return "Analizando...";
    return "Analizar";
  }

  // Función para verificar si el botón debe estar deshabilitado
  function isButtonDisabled() {
    return parsing || analyzing || !source.trim();
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />
      
      <main className="flex-1 p-6 z-10">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Analizador de Complejidad</h1>
            <p className="text-slate-300 text-sm">
              Análisis detallado de la complejidad algorítmica con visualización de costos y ecuaciones matemáticas
            </p>
          </div>


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
                    onClick={onAnalyzeClick}
                    disabled={isButtonDisabled()}
                    className="glass-button px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {getButtonText()}
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
                  <h2 className="text-white font-semibold mb-3 flex items-center">
                    <span className="material-symbols-outlined mr-2 text-amber-400">table_chart</span>{" "}
                    Costos por Línea
                  </h2>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {data ? (
                      <div className="flex-1 overflow-auto scrollbar-custom">
                        <LineTable rows={data.byLine} onViewProcedure={handleViewLineProcedure} />
                      </div>
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
              <div className="glass-card p-4 rounded-lg h-full flex flex-col">
                <h2 className="text-white font-semibold mb-3 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-green-400">functions</span>{" "}
                  Ecuaciones Matemáticas
                </h2>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {data ? (
                      <div className="flex-1 overflow-auto scrollbar-custom space-y-4">
                  <div className="space-y-2">
                          <h3 className="text-sm font-medium text-slate-300">Función de costo T(n):</h3>
                          <FormulaBlock latex={data.totals.T_open} />
                  </div>
                  
                  <div className="space-y-2">
                          <h3 className="text-sm font-medium text-slate-300">Procedimiento:</h3>
                          <button
                            onClick={handleViewGeneralProcedure}
                            className="w-full glass-secondary rounded-md text-white text-sm px-4 py-2 hover:bg-sky-500/20 transition-colors flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined mr-2 text-sm">visibility</span>
                            Ver Procedimiento
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <span className="material-symbols-outlined text-4xl mb-2 block">functions</span>
                          <p>Ejecuta el análisis para ver las ecuaciones</p>
                    </div>
                  </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Additional info section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-400">trending_up</span>
              </div>
              <h3 className="font-semibold text-green-300 mb-1">Best Case</h3>
              <p className="text-xs text-slate-400">Escenario óptimo de ejecución</p>
            </div>
            
            <div className="glass-card p-4 rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-400">analytics</span>
              </div>
              <h3 className="font-semibold text-yellow-300 mb-1">Average Case</h3>
              <p className="text-xs text-slate-400">Comportamiento promedio esperado</p>
            </div>
            
            <div className="glass-card p-4 rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400">trending_down</span>
              </div>
              <h3 className="font-semibold text-red-300 mb-1">Worst Case</h3>
              <p className="text-xs text-slate-400">Escenario más desfavorable (S3)</p>
            </div>
          </div>
        </div>
      </main>

      <ProcedureModal 
        open={open} 
        onClose={() => setOpen(false)} 
        selectedLine={selectedLine}
        analysisData={data || undefined}
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
      />

      <Footer />
    </div>
  );
}