import type { Program } from "@aa/types";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { GrammarApiService } from "@/services/grammar-api";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { heuristicKind } from "@/lib/algorithm-classifier";

import { AnalysisLoader } from "./AnalysisLoader";
import { AnalyzerEditor } from "./AnalyzerEditor";
import { ASTTreeView } from "./ASTTreeView";

// Constantes
const COPY_FEEDBACK_DURATION = 2000; // 2 segundos
const ANALYSIS_RESULT_DURATION = 5000; // 5 segundos

const ANALYSIS_MESSAGES = {
  SUCCESS: "El código es sintácticamente correcto",
  ERROR_SYNTAX: "El código contiene errores de sintaxis",
  ERROR_CONNECTION: "Error al conectar con el servidor",
} as const;

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ManualModeViewProps {
  readonly messages: Message[];
  readonly setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  readonly onOpenChat: () => void;
  readonly onSwitchToAIMode: () => void;
}

const DEFAULT_CODE = `busquedaBinaria(A[n], x, inicio, fin) BEGIN
  IF (inicio > fin) THEN BEGIN
    RETURN -1;
  END
  mitad <- (inicio + fin) / 2;
  IF (A[mitad] = x) THEN BEGIN
    RETURN mitad;
  END
  ELSE BEGIN
    IF (x < A[mitad]) THEN BEGIN
      RETURN busquedaBinaria(A, x, inicio, mitad - 1);
    END
    ELSE BEGIN
      RETURN busquedaBinaria(A, x, mitad + 1, fin);
    END
  END
END`;

export default function ManualModeView({ messages, setMessages, onOpenChat, onSwitchToAIMode }: ManualModeViewProps) {
  const router = useRouter();
  const { animateProgress } = useAnalysisProgress();
  
  // Cargar código desde localStorage o usar valor por defecto
  const [code, setCode] = useState(() => {
    if (globalThis.window !== undefined) {
      const savedCode = localStorage.getItem('manualModeCode');
      return savedCode || DEFAULT_CODE;
    }
    return DEFAULT_CODE;
  });
  const [ast, setAst] = useState<Program | null>(null);
  const [showAstModal, setShowAstModal] = useState(false);
  const [localParseOk, setLocalParseOk] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVerifyingParse, setIsVerifyingParse] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAIHelpButton, setShowAIHelpButton] = useState(false);
  const [backendParseError, setBackendParseError] = useState<string | null>(null);
  
  // Estados para el loader de análisis de complejidad
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("Iniciando análisis...");
  const [algorithmType, setAlgorithmType] = useState<"iterative" | "recursive" | "hybrid" | "unknown" | undefined>(undefined);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Refs para evitar memory leaks con timeouts
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
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
        const data = await GrammarApiService.parseCode(code);
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
  }, [localParseOk, code]);

  // Guardar código en localStorage cuando cambia
  useEffect(() => {
    if (globalThis.window !== undefined) {
      localStorage.setItem('manualModeCode', code);
    }
  }, [code]);

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
      }, COPY_FEEDBACK_DURATION);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };


  // Función para verificar parse (estado independiente)
  const handleAnalyzeCode = async () => {
    setIsVerifyingParse(true);
    setAnalysisResult(null);
    
    // Limpiar timeout anterior si existe
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    try {
      const data = await GrammarApiService.parseCode(code);
      
      if (data.ok) {
        setAnalysisResult({
          success: true,
          message: ANALYSIS_MESSAGES.SUCCESS
        });
      } else {
        setAnalysisResult({
          success: false,
          message: data.error || ANALYSIS_MESSAGES.ERROR_SYNTAX
        });
      }
    } catch (e) {
      console.error("Error analyzing code:", e);
      setAnalysisResult({
        success: false,
        message: ANALYSIS_MESSAGES.ERROR_CONNECTION
      });
    } finally {
      setIsVerifyingParse(false);
      // Auto-ocultar el mensaje después de 5 segundos
      analysisTimeoutRef.current = setTimeout(() => {
        setAnalysisResult(null);
        analysisTimeoutRef.current = null;
      }, ANALYSIS_RESULT_DURATION);
    }
  };


  // Función para analizar complejidad (ejecutar análisis completo con loader)
  const handleAnalyzeComplexity = async () => {
    // Verificar que no esté ya analizando
    if (isAnalyzing) return;

    // Activar estado de carga inmediatamente
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisMessage("Iniciando análisis...");
    setAlgorithmType(undefined);
    setIsAnalysisComplete(false);
    setAnalysisResult(null);
    setAnalysisError(null);

    try {
      // 1) Parsear el código (0-20%)
      setAnalysisMessage("Parseando código...");
      const parsePromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/grammar/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: code }),
      }).then(r => r.json());
      
      // Animar progreso mientras se parsea (espera a que parsePromise se resuelva)
      const parseRes = await animateProgress(0, 20, 2000, setAnalysisProgress, parsePromise) as { ok: boolean; ast?: Program; errors?: Array<{ line: number; column: number; message: string }> };

      if (!parseRes.ok) {
        const msg = parseRes.errors?.map((e: { line: number; column: number; message: string }) => `Línea ${e.line}:${e.column} ${e.message}`).join("\n") || "Error de parseo";
        setAnalysisError(`Errores de sintaxis:\n${msg}`);
        setTimeout(() => {
          setIsAnalyzing(false);
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
      let kind: "iterative" | "recursive" | "hybrid" | "unknown";
      try {
        const clsPromise = fetch("/api/llm/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: code, mode: "auto" }),
        });
        
        // Animar progreso mientras se clasifica (espera a que clsPromise se resuelva)
        const clsResponse = await animateProgress(20, 40, 3000, setAnalysisProgress, clsPromise) as Response;
        
        if (clsResponse.ok) {
          const cls = await clsResponse.json() as { kind: string; method?: string; mode?: string };
          kind = cls.kind as "iterative" | "recursive" | "hybrid" | "unknown";
          setAlgorithmType(kind);
          setAnalysisMessage(`Algoritmo identificado: ${kind === "iterative" ? "Iterativo" : kind === "recursive" ? "Recursivo" : kind === "hybrid" ? "Híbrido" : "Desconocido"}`);
          console.log(`[ManualMode] Clasificación: ${kind} (método: ${cls.method})`);
        } else {
          throw new Error(`HTTP ${clsResponse.status}`);
        }
      } catch (error) {
        console.warn(`[ManualMode] Error en clasificación, usando heurística:`, error);
        kind = heuristicKind(parseRes.ast || null);
        setAlgorithmType(kind);
        setAnalysisMessage(`Algoritmo identificado: ${kind === "iterative" ? "Iterativo" : kind === "recursive" ? "Recursivo" : kind === "hybrid" ? "Híbrido" : "Desconocido"}`);
      }

      // 3) Rechazar algoritmos recursivos o híbridos
      if (kind === "recursive" || kind === "hybrid") {
        const kindLabel = kind === "recursive" ? "recursivo" : "híbrido";
        setAnalysisError(`El algoritmo ${kindLabel} no está soportado en esta versión. Por favor, usa un algoritmo iterativo o básico, o cambia a S4 luego.`);
        setTimeout(() => {
          setIsAnalyzing(false);
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
        body: JSON.stringify({ source: code, mode: "worst" }),
      }).then(r => r.json());
      
      // Animar progreso mientras se simplifica (espera a que analyzePromise se resuelva)
      const analyzeRes = await animateProgress(50, 70, 5000, setAnalysisProgress, analyzePromise) as { ok: boolean; [key: string]: unknown };
      
      setAnalysisMessage("Generando forma polinómica...");
      await animateProgress(70, 80, 500, setAnalysisProgress);

      if (!analyzeRes.ok) {
        const errorMsg = (analyzeRes as { errors?: Array<{ message: string; line?: number; column?: number }> }).errors?.map((e: { message: string; line?: number; column?: number }) => 
          e.message || `Error en línea ${e.line || '?'}`
        ).join("\n") || "No se pudo analizar el algoritmo";
        setAnalysisError(errorMsg);
        setTimeout(() => {
          setIsAnalyzing(false);
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
      
      // 6) Guardar resultados
      if (globalThis.window !== undefined) {
        sessionStorage.setItem('analyzerCode', code);
        sessionStorage.setItem('analyzerResults', JSON.stringify(analyzeRes));
      }
      
      // 7) Mostrar completado y esperar 2 segundos
      setAnalysisMessage("Análisis completo");
      setIsAnalysisComplete(true);
      
      // Esperar 2 segundos antes de redirigir
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Redirigir al analizador
      router.push('/analyzer');

    } catch (error) {
      console.error("[ManualMode] Error inesperado:", error);
      const errorMsg = error instanceof Error ? error.message : "Error inesperado durante el análisis";
      setAnalysisError(errorMsg);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        setAnalysisMessage("Iniciando análisis...");
        setAlgorithmType(undefined);
        setIsAnalysisComplete(false);
        setAnalysisError(null);
      }, 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Loader de análisis */}
      {isAnalyzing && (
        <AnalysisLoader
          progress={analysisProgress}
          message={analysisMessage}
          algorithmType={algorithmType}
          isComplete={isAnalysisComplete}
          error={analysisError}
          onClose={() => {
            setIsAnalyzing(false);
            setAnalysisProgress(0);
            setAnalysisMessage("Iniciando análisis...");
            setAlgorithmType(undefined);
            setIsAnalysisComplete(false);
            setAnalysisError(null);
          }}
        />
      )}
      
      <div className="flex flex-col items-center">
        {/* Contenedor flex: editor a la izquierda, botones a la derecha */}
        <div className="flex flex-col lg:flex-row gap-6 w-full items-center lg:items-center">
          {/* Editor de Código con Monaco - 75% en desktop, 100% en mobile */}
          <div className="w-full lg:w-[75%]">
            <AnalyzerEditor
              initialValue={code}
              onChange={setCode}
              onAstChange={setAst}
              onParseStatusChange={handleParseStatusChange}
              height="420px"
              showToolbar={false}
            />
          </div>

          {/* Botones Analizar y Ver AST - 25% en desktop, 100% en mobile */}
          <div className="w-full lg:w-[25%] flex flex-col gap-3">
            <button
              onClick={handleAnalyzeCode}
              disabled={isVerifyingParse || code.trim() === ''}
              className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg text-white text-sm font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-400/50 bg-gradient-to-br from-blue-500/20 to-blue-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isVerifyingParse ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>{' '}
                  Verificando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">check_circle</span>{' '}
                  Verificar Parse
                </>
              )}
            </button>

            <button
              onClick={handleAnalyzeComplexity}
              disabled={isAnalyzing || !localParseOk || code.trim() === ''}
              className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg text-white text-sm font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-400/50 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isAnalyzing ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>{' '}
                  Analizando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">functions</span>{' '}
                  Analizar Complejidad
                </>
              )}
            </button>

            <button
              onClick={() => setShowAstModal(true)}
              disabled={!localParseOk || !ast}
              className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg text-white text-sm font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-400/50 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined">account_tree</span>{' '}
              Ver AST
            </button>

            {/* Botón de Ayuda con IA - aparece después de 3 segundos si hay error */}
            {showAIHelpButton && backendParseError && (
              <button
                onClick={() => {
                  // Crear mensaje estructurado con el código y el error para el LLM
                  const errorMessage = `Necesito ayuda con un error de sintaxis en mi código de pseudocódigo.

**CÓDIGO ADJUNTO:**
\`\`\`pseudocode
${code}
\`\`\`

**ERROR DETECTADO:**
\`\`\`error
${backendParseError}
\`\`\`

**SOLICITUD:**
Por favor, analiza el código y el error, identifica la causa del problema y proporciona una solución corregida. Explica qué estaba mal y cómo solucionarlo.`;
                  
                  const newMessage: Message = {
                    id: Date.now().toString(),
                    content: errorMessage,
                    sender: 'user',
                    timestamp: new Date()
                  };
                  
                  // Si no hay mensajes previos, agregar mensaje de bienvenida
                  if (messages.length === 0) {
                    const welcomeMessage: Message = {
                      id: 'welcome',
                      content: "¡Hola! Soy Jhon Jairo, tu asistente para análisis de algoritmos. ¿En qué puedo ayudarte hoy?",
                      sender: 'bot',
                      timestamp: new Date()
                    };
                    setMessages([welcomeMessage, newMessage]);
                  } else {
                    setMessages(prev => [...prev, newMessage]);
                  }
                  
                  // Cambiar al modo asistente y abrir el chat
                  // El ChatBot real se encargará de generar la respuesta usando LLM
                  setTimeout(() => {
                    onSwitchToAIMode();
                    
                    // Luego abrir el chat después de cambiar de modo
                    setTimeout(() => {
                      onOpenChat();
                    }, 100);
                  }, 50);
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg text-white text-sm font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400/50 bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/30 animate-[slideInUp_0.3s_ease-out] animate-pulse-slow"
              >
                <span className="material-symbols-outlined text-base animate-shake">smart_toy</span>{' '}
                Ayuda con IA
              </button>
            )}
          </div>
        </div>

        {/* Resultado del análisis */}
        {analysisResult && (
          <div 
            className={`mt-4 w-full max-w-5xl mx-auto px-6 py-4 rounded-lg border animate-[slideInUp_0.3s_ease-out,fadeIn_0.3s_ease-out] ${
              analysisResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">
                {analysisResult.success ? 'check_circle' : 'error'}
              </span>
              <p className="text-sm font-medium">{analysisResult.message}</p>
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
