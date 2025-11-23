import type { Program } from "@aa/types";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { getApiKey, getApiKeyStatus } from "@/hooks/useApiKey";
import { heuristicKind } from "@/lib/algorithm-classifier";
import { GrammarApiService } from "@/services/grammar-api";

import { AnalysisLoader } from "./AnalysisLoader";
import MethodSelector, { MethodType } from "./MethodSelector";
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

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
  retryMessageId?: string;
};

type AlgorithmKind = "iterative" | "recursive" | "hybrid" | "unknown";

/**
 * Propiedades del componente ManualModeView.
 */
interface ManualModeViewProps {
  readonly messages: Message[];
  readonly setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  readonly onOpenChat: () => void;
  readonly onSwitchToAIMode: () => void;
}

/**
 * Referencia imperativa para el componente ManualModeView.
 */
export interface ManualModeViewHandle {
  analyzeCode: (source: string) => Promise<void>;
}

/**
 * Formatea la etiqueta del tipo de algoritmo en español.
 * @param value - Tipo de algoritmo
 * @returns Etiqueta en español del tipo de algoritmo
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const formatAlgorithmKindLabel = (value: AlgorithmKind): string => {
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

/**
 * Formatea el mensaje para tipos de algoritmo no soportados.
 * @param value - Tipo de algoritmo
 * @returns Mensaje formateado indicando el tipo no soportado
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
const formatUnsupportedKindMessage = (value: AlgorithmKind): string => {
  return value === "recursive" ? "recursivo" : "híbrido";
};

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

/**
 * Componente principal para el modo manual de análisis.
 * Permite editar código, verificar sintaxis, analizar complejidad y visualizar el AST.
 * Incluye integración con el asistente IA para ayuda con errores de sintaxis.
 * 
 * @param props - Propiedades del componente
 * @param ref - Referencia imperativa para controlar el componente desde el exterior
 * @returns Componente React con la vista del modo manual
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * 
 * @example
 * ```tsx
 * const manualModeRef = useRef<ManualModeViewHandle>(null);
 * 
 * <ManualModeView
 *   ref={manualModeRef}
 *   messages={messages}
 *   setMessages={setMessages}
 *   onOpenChat={handleOpenChat}
 *   onSwitchToAIMode={handleSwitchToAIMode}
 * />
 * 
 * // Analizar código desde fuera del componente
 * manualModeRef.current?.analyzeCode(sourceCode);
 * ```
 */
const ManualModeView = forwardRef<ManualModeViewHandle, ManualModeViewProps>(function ManualModeView({ messages, setMessages, onOpenChat, onSwitchToAIMode }, ref) {
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
  const [hasValidApiKey, setHasValidApiKey] = useState<boolean>(false);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [applicableMethods, setApplicableMethods] = useState<MethodType[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<MethodType>("master");
  const methodSelectionPromiseRef = useRef<{
    resolve: (method: MethodType) => void;
    reject: () => void;
  } | null>(null);
  const minProgressRef = useRef<number>(0);
  
  // Efecto para mantener el progreso mínimo cuando el selector está visible
  useEffect(() => {
    if (showMethodSelector && minProgressRef.current > 0) {
      // Establecer el progreso al mínimo inmediatamente
      setAnalysisProgress(minProgressRef.current);
      
      // Usar un intervalo para mantener el progreso mientras el selector está visible
      const intervalId = setInterval(() => {
        setAnalysisProgress((prev) => {
          const minProgress = minProgressRef.current;
          if (prev < minProgress) {
            return minProgress;
          }
          return prev;
        });
      }, 100); // Verificar cada 100ms
      
      return () => clearInterval(intervalId);
    }
  }, [showMethodSelector]);
  
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

  // Verificar API_KEY al montar y cuando cambie (sin hacer requests innecesarios)
  useEffect(() => {
    const checkApiKey = () => {
      // Verificar solo localStorage primero (sin hacer request al servidor)
      const stored = getApiKey();
      if (stored) {
        setHasValidApiKey(true);
        return;
      }
      
      // Solo verificar servidor si no hay en localStorage
      // Hacer esto de forma asíncrona pero sin bloquear
      getApiKeyStatus().then((status) => {
        setHasValidApiKey(status.hasAny);
      }).catch((error) => {
        console.error('[ManualModeView] Error verificando API_KEY:', error);
        setHasValidApiKey(false);
      });
    };
    
    checkApiKey();
    
    // Escuchar cambios en la API_KEY (solo eventos, sin polling)
    const handleApiKeyChange = () => {
      // Verificar localStorage primero
      const stored = getApiKey();
      if (stored) {
        setHasValidApiKey(true);
      } else {
        // Solo si no hay en localStorage, verificar servidor
        getApiKeyStatus().then((status) => {
          setHasValidApiKey(status.hasAny);
        }).catch(() => {
          setHasValidApiKey(false);
        });
      }
    };
    
    window.addEventListener('apiKeyChanged', handleApiKeyChange);
    window.addEventListener('storage', handleApiKeyChange);
    
    return () => {
      window.removeEventListener('apiKeyChanged', handleApiKeyChange);
      window.removeEventListener('storage', handleApiKeyChange);
    };
  }, []);

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

  const runAnalysis = useCallback(async (sourceCode: string) => {
    if (!sourceCode.trim()) return;
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisMessage("Iniciando análisis...");
    setAlgorithmType(undefined);
    setIsAnalysisComplete(false);
    setAnalysisResult(null);
    setAnalysisError(null);
    setBackendParseError(null);
    setShowAIHelpButton(false);

    try {
      setAnalysisMessage("Parseando código...");
      const parsePromise = fetch("/api/grammar/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: sourceCode }),
      }).then(r => r.json());

      const parseRes = await animateProgress(0, 20, 800, setAnalysisProgress, parsePromise) as { ok: boolean; ast?: Program; errors?: Array<{ line: number; column: number; message: string }> };

      if (!parseRes.ok) {
        const msg = parseRes.errors?.map((e: { line: number; column: number; message: string }) => `Línea ${e.line}:${e.column} ${e.message}`).join("\n") || "Error de parseo";
        setLocalParseOk(false);
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

      setLocalParseOk(true);

      setAnalysisMessage("Clasificando algoritmo...");
      let kind: AlgorithmKind;
      try {
        // Obtener API_KEY del localStorage (el backend usará la de variables de entorno si no hay)
        const apiKey = getApiKey();
        
        const body: { source: string; mode: string; apiKey?: string } = { source: sourceCode, mode: "local" };
        if (apiKey) {
          body.apiKey = apiKey;
        }
        
        const clsPromise = fetch("/api/llm/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const clsResponse = await animateProgress(20, 40, 1200, setAnalysisProgress, clsPromise) as Response;

        if (clsResponse.ok) {
          const cls = await clsResponse.json() as { kind: string; method?: string; mode?: string };
          kind = cls.kind as AlgorithmKind;
          setAlgorithmType(kind);
          setAnalysisMessage(`Algoritmo identificado: ${formatAlgorithmKindLabel(kind)}`);
          console.log(`[ManualMode] Clasificación: ${kind} (método: ${cls.method})`);
        } else {
          throw new Error(`HTTP ${clsResponse.status}`);
        }
      } catch (error) {
        console.warn(`[ManualMode] Error en clasificación, usando heurística:`, error);
        kind = heuristicKind(parseRes.ast || null);
        setAlgorithmType(kind);
        setAnalysisMessage(`Algoritmo identificado: ${formatAlgorithmKindLabel(kind)}`);
      }

      // 3) Realizar el análisis de complejidad (40-80%)
      const isRecursive = kind === "recursive" || kind === "hybrid";
      
      let selectedMethod: MethodType | undefined = undefined;
      
      if (isRecursive) {
        setAnalysisMessage("Verificando condiciones...");
        await animateProgress(40, 50, 300, setAnalysisProgress);
        setAnalysisMessage("Extrayendo recurrencia...");
        await animateProgress(50, 65, 400, setAnalysisProgress);
        setAnalysisMessage("Normalizando recurrencia...");
        await animateProgress(65, 75, 300, setAnalysisProgress);
        setAnalysisMessage("Detectando método de análisis...");
        await animateProgress(75, 85, 500, setAnalysisProgress);
        
        // Guardar el progreso actual antes de detectar métodos
        const progressBeforeMethodSelection = 85;
        
        // Detectar métodos aplicables
        selectedMethod = "master";
        try {
          const detectMethodsResponse = await fetch("/api/analyze/detect-methods", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: sourceCode,
              algorithm_kind: kind
            }),
          });
          
          const detectMethodsResult = await detectMethodsResponse.json() as {
            ok: boolean;
            applicable_methods?: MethodType[];
            default_method?: MethodType;
            errors?: Array<{ message: string }>;
          };
          
          if (detectMethodsResult.ok && detectMethodsResult.applicable_methods) {
            const methods = detectMethodsResult.applicable_methods;
            const defaultMethodValue = (detectMethodsResult.default_method || "master") as MethodType;
            
            setApplicableMethods(methods);
            setDefaultMethod(defaultMethodValue);
            
            // Si hay múltiples métodos aplicables, mostrar selector
            if (methods.length > 1) {
              setAnalysisMessage("Selecciona el método de análisis...");
              
              // Guardar el progreso mínimo para evitar que baje
              minProgressRef.current = progressBeforeMethodSelection;
              
              // Establecer el progreso directamente al valor guardado
              setAnalysisProgress(progressBeforeMethodSelection);
              
              setShowMethodSelector(true);
              
              // Esperar un poco para que el selector se renderice completamente
              await new Promise((resolve) => setTimeout(resolve, 200));
              
              // Crear un Promise que se resolverá cuando el usuario seleccione un método
              selectedMethod = await new Promise<MethodType>((resolve, reject) => {
                methodSelectionPromiseRef.current = { resolve, reject };
                setTimeout(() => {
                  if (methodSelectionPromiseRef.current) {
                    methodSelectionPromiseRef.current.resolve(defaultMethodValue);
                    methodSelectionPromiseRef.current = null;
                  }
                }, 60000);
              }).catch(() => defaultMethodValue);
              
              setShowMethodSelector(false);
              methodSelectionPromiseRef.current = null;
              // Limpiar el progreso mínimo después de ocultar el selector
              minProgressRef.current = 0;
              
              setAnalysisMessage("Método seleccionado, continuando análisis...");
              // Mantener el progreso y avanzar suavemente
              await animateProgress(progressBeforeMethodSelection, 90, 400, setAnalysisProgress);
            } else {
              selectedMethod = defaultMethodValue;
              // Continuar con el progreso normalmente
              setAnalysisMessage("Iniciando análisis de complejidad...");
              await animateProgress(progressBeforeMethodSelection, 90, 400, setAnalysisProgress);
            }
          } else {
            selectedMethod = "master";
            // Continuar con el progreso normalmente
            setAnalysisMessage("Iniciando análisis de complejidad...");
            await animateProgress(progressBeforeMethodSelection, 90, 400, setAnalysisProgress);
          }
        } catch (error) {
          console.warn("Error detectando métodos, usando método por defecto:", error);
          selectedMethod = "master";
          // Continuar con el progreso normalmente
          setAnalysisMessage("Iniciando análisis de complejidad...");
          await animateProgress(progressBeforeMethodSelection, 90, 400, setAnalysisProgress);
        }
      } else {
        setAnalysisMessage("Hallando sumatorias...");
        await animateProgress(40, 50, 200, setAnalysisProgress);
        setAnalysisMessage("Cerrando sumatorias...");
        await animateProgress(50, 55, 200, setAnalysisProgress);
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
        preferred_method?: MethodType;
      } = { 
        source: sourceCode, 
        mode: "all",
        avgModel: {
          mode: "uniform",
          predicates: {}
        },
        algorithm_kind: kind
      };
      
      // Solo agregar preferred_method si es recursivo y hay un método seleccionado
      if (isRecursive && selectedMethod) {
        analyzeBody.preferred_method = selectedMethod;
      }
      if (apiKey) {
        analyzeBody.api_key = apiKey;  // Mantener por compatibilidad, pero backend ya no lo usa para simplificación
      }
      
      const analyzePromise = fetch("/api/analyze/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyzeBody),
      }).then(r => r.json());

      const analyzeRes = await animateProgress(50, 70, 2000, setAnalysisProgress, analyzePromise) as { 
        ok: boolean; 
        worst?: unknown;
        best?: unknown;
        avg?: unknown;
        errors?: Array<{ message: string; line?: number; column?: number }>;
        [key: string]: unknown;
      };

      setAnalysisMessage("Generando forma polinómica...");
      await animateProgress(70, 80, 200, setAnalysisProgress);

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

      setAnalysisMessage("Finalizando análisis...");
      await animateProgress(80, 100, 200, setAnalysisProgress);

      if (globalThis.window !== undefined) {
        sessionStorage.setItem('analyzerCode', sourceCode);
        sessionStorage.setItem('analyzerResults', JSON.stringify(analyzeRes));
      }

      setAnalysisMessage("Análisis completo");
      setIsAnalysisComplete(true);

      await new Promise((resolve) => setTimeout(resolve, 800));

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
  }, [animateProgress, isAnalyzing, router]);

  const handleAnalyzeComplexity = () => {
    void runAnalysis(code);
  };

  useImperativeHandle(ref, () => ({
    analyzeCode: async (source: string) => {
      if (!source.trim()) return;

      setCode(source);
      setLocalParseOk(false);

      if (globalThis.window !== undefined) {
        localStorage.setItem('manualModeCode', source);
      }

      await runAnalysis(source);
    },
  }), [runAnalysis]);

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

      {/* Selector de método - debe aparecer sobre el loader */}
      {showMethodSelector && applicableMethods.length > 0 && isAnalyzing && (
        <MethodSelector
          applicableMethods={applicableMethods}
          defaultMethod={defaultMethod}
          onSelect={(method) => {
            console.log('[MethodSelector] Método seleccionado:', method);
            if (methodSelectionPromiseRef.current) {
              methodSelectionPromiseRef.current.resolve(method);
            }
          }}
          onCancel={() => {
            // Si cancela, usar método por defecto
            console.log('[MethodSelector] Cancelado, usando método por defecto:', defaultMethod);
            if (methodSelectionPromiseRef.current) {
              methodSelectionPromiseRef.current.resolve(defaultMethod);
            }
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

            {/* Botón de Ayuda con IA - aparece después de 3 segundos si hay error y hay API_KEY */}
            {showAIHelpButton && backendParseError && hasValidApiKey && (
              <button
                onClick={async () => {
                    // No verificar API_KEY del servidor (no hacer peticiones)
                    // El backend manejará la API_KEY automáticamente
                    // Permitir continuar incluso sin API_KEY del cliente
                    // El backend intentará usar la de variables de entorno
                    
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
                      id: `user-help-${Date.now()}`,
                      content: errorMessage,
                      sender: 'user',
                      timestamp: new Date()
                    };
                    
                    // Verificar si ya existe un mensaje con exactamente el mismo código y error
                    // Solo evitar duplicados si es el mismo código y el mismo error
                    const codeHash = code.trim().slice(0, 100); // Usar más caracteres para mejor comparación
                    const errorHash = backendParseError?.trim().slice(0, 50) || '';
                    const messageExists = messages.some(
                      msg => msg.sender === 'user' && 
                      msg.content.includes('**CÓDIGO ADJUNTO:**') &&
                      msg.content.includes(codeHash) &&
                      msg.content.includes(errorHash)
                    );
                    
                    // Si el mensaje ya existe exactamente igual, solo abrir el chat sin agregar duplicado
                    if (messageExists) {
                      onSwitchToAIMode();
                      setTimeout(() => {
                        onOpenChat();
                      }, 100);
                      return;
                    }
                    
                    // Agregar mensaje de bienvenida solo si no hay mensajes previos
                    // Usar una función de actualización para evitar problemas de estado
                    setMessages(prev => {
                      // Si ya hay mensajes, solo agregar el nuevo mensaje
                      if (prev.length > 0) {
                        return [...prev, newMessage];
                      }
                      
                      // Si no hay mensajes, agregar bienvenida y el nuevo mensaje
                      const welcomeMessage: Message = {
                        id: 'welcome',
                        content: "¡Hola! Soy Jhon Jairo, tu asistente para análisis de algoritmos. ¿En qué puedo ayudarte hoy?",
                        sender: 'bot',
                        timestamp: new Date()
                      };
                      return [welcomeMessage, newMessage];
                    });
                    
                    // Cambiar al modo asistente y abrir el chat después de que se actualice el estado
                    // El ChatBot detectará el nuevo mensaje y generará la respuesta automáticamente
                    setTimeout(() => {
                      onSwitchToAIMode();
                      
                      // Luego abrir el chat después de cambiar de modo
                      setTimeout(() => {
                        onOpenChat();
                      }, 150);
                    }, 100);
                  }}
                className="flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg text-white text-sm font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400/50 border animate-[slideInUp_0.3s_ease-out] bg-gradient-to-br from-purple-500/20 to-purple-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/30 animate-pulse-slow cursor-pointer"
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
              <p className="text-sm font-medium whitespace-pre-line">{analysisResult.message}</p>
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
});

export default ManualModeView;
