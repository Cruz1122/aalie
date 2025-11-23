"use client";

import type { AnalyzeOpenResponse, ParseError, ParseResponse, Program } from "@aa/types";
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
import MethodSelector, { MethodType } from "@/components/MethodSelector";
import RepairModal from "@/components/RepairModal";
import { ComparisonLoader } from "@/components/ComparisonLoader";
import ComparisonModal from "@/components/ComparisonModal";
import { extractCoreData, isRecursiveAnalysis, type CoreAnalysisData } from "@/lib/extract-core-data";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { getApiKey, getApiKeyStatus } from "@/hooks/useApiKey";
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
    best: AnalyzeOpenResponse | null;
    avg?: AnalyzeOpenResponse | null;
  } | null>(() => {
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
  const [parseErrors, setParseErrors] = useState<ParseError[] | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'json'>('tree');
  // Estados del chat
  const { messages, setMessages } = useChatHistory();
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Estado para modal de reparación
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  // Estado para comparación con LLM
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [comparisonMessage, setComparisonMessage] = useState("Contactando con LLM...");
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [llmAnalysisData, setLlmAnalysisData] = useState<{
    worst: CoreAnalysisData | null;
    best: CoreAnalysisData | null;
    avg: CoreAnalysisData | null;
  } | null>(null);
  const [llmNote, setLlmNote] = useState<string>("");

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
    window.addEventListener('apiKeyChanged', handleApiKeyChange);
    return () => {
      window.removeEventListener('apiKeyChanged', handleApiKeyChange);
    };
  }, []);

  // Manejar cambios en el estado de parsing local
  const handleParseStatusChange = (ok: boolean, _isParsing: boolean) => {
    setLocalParseOk(ok);
  };

  // Manejar cambios en los errores de parsing
  const handleErrorsChange = (errors: ParseError[] | undefined) => {
    setParseErrors(errors);
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
      const parsePromise = fetch("/api/grammar/parse", {
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
              source,
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
              console.log('[Analyzer] Múltiples métodos detectados:', methods);
              console.log('[Analyzer] Método por defecto:', defaultMethodValue);
              
              // Actualizar mensaje para indicar que el usuario debe seleccionar
              setAnalysisMessage("Selecciona el método de análisis...");
              
              // Guardar el progreso mínimo para evitar que baje
              minProgressRef.current = progressBeforeMethodSelection;
              
              // Asegurar que el progreso se mantenga en el valor actual
              setAnalysisProgress((prev) => Math.max(prev, progressBeforeMethodSelection));
              
              // Mostrar el selector primero
              setShowMethodSelector(true);
              console.log('[Analyzer] Selector de método mostrado');
              
              // Esperar un poco para que el selector se renderice completamente
              await new Promise((resolve) => setTimeout(resolve, 200));
              
              // Crear un Promise que se resolverá cuando el usuario seleccione un método
              console.log('[Analyzer] Esperando selección del usuario...');
              selectedMethod = await new Promise<MethodType>((resolve, reject) => {
                methodSelectionPromiseRef.current = { resolve, reject };
                // Timeout de seguridad (no debería pasar, pero por si acaso)
                setTimeout(() => {
                  if (methodSelectionPromiseRef.current) {
                    console.warn("Timeout en selección de método, usando método por defecto");
                    methodSelectionPromiseRef.current.resolve(defaultMethodValue);
                    methodSelectionPromiseRef.current = null;
                  }
                }, 60000); // 60 segundos timeout
              }).catch(() => {
                console.warn("Error en selección de método, usando método por defecto");
                return defaultMethodValue;
              });
              
              console.log('[Analyzer] Método seleccionado:', selectedMethod);
              
              // Ocultar selector después de la selección
              setShowMethodSelector(false);
              methodSelectionPromiseRef.current = null;
              // Limpiar el progreso mínimo después de ocultar el selector
              minProgressRef.current = 0;
              
              // Actualizar mensaje para continuar
              setAnalysisMessage("Método seleccionado, continuando análisis...");
              // Mantener el progreso y avanzar suavemente
              await animateProgress(progressBeforeMethodSelection, 90, 400, setAnalysisProgress);
            } else {
              // Solo un método disponible, usarlo directamente
              console.log('[Analyzer] Solo un método disponible:', defaultMethodValue);
              selectedMethod = defaultMethodValue;
              // Continuar con el progreso normalmente
              setAnalysisMessage("Iniciando análisis de complejidad...");
              await animateProgress(progressBeforeMethodSelection, 90, 400, setAnalysisProgress);
            }
          } else {
            // Si falla la detección, usar método por defecto
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
        preferred_method?: MethodType;
      } = { 
        source, 
        mode: "all",
        avgModel: {
          mode: "uniform",
          predicates: {}
        },
        algorithm_kind: kind  // Enviar el tipo de algoritmo al backend
      };
      
      // Solo agregar preferred_method si es recursivo y hay un método seleccionado
      if (isRecursive && selectedMethod) {
        analyzeBody.preferred_method = selectedMethod;
      }
      if (apiKey) {
        analyzeBody.api_key = apiKey;  // Mantener por compatibilidad, pero backend ya no lo usa para simplificación
      }
      
      // Actualizar mensaje antes de iniciar el análisis real
      if (isRecursive) {
        setAnalysisMessage("Calculando complejidad...");
      } else {
        setAnalysisMessage("Analizando complejidad...");
      }
      
      const analyzePromise = fetch("/api/analyze/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyzeBody),
      }).then(r => r.json());

      // Animar progreso mientras se analiza (continuar desde donde quedó según el tipo)
      // Para recursivos: 90 → 95, para iterativos: 55 → 95
      const analyzeRes = await animateProgress(progressBeforeAnalysis, 95, 2500, setAnalysisProgress, analyzePromise) as {
        ok: boolean;
        has_case_variability?: boolean;
        worst?: AnalyzeOpenResponse;
        best?: AnalyzeOpenResponse;
        avg?: AnalyzeOpenResponse;
        errors?: Array<{ message: string; line?: number; column?: number }>;
      };

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

      // 6) Detectar el método usado y actualizar mensaje
      let detectedMethod = "método recursivo";
      if (isRecursive && analyzeRes.worst?.totals?.recurrence) {
        const method = analyzeRes.worst.totals.recurrence.method || analyzeRes.best?.totals?.recurrence?.method;
        if (method === "characteristic_equation") {
          detectedMethod = "Ecuación Característica";
          setAnalysisMessage("Aplicando Método de Ecuación Característica...");
        } else if (method === "iteration") {
          detectedMethod = "Método de Iteración";
          setAnalysisMessage("Aplicando Método de Iteración...");
        } else if (method === "recursion_tree") {
          detectedMethod = "Método de Árbol de Recursión";
          setAnalysisMessage("Aplicando Método de Árbol de Recursión...");
        } else {
          detectedMethod = "Teorema Maestro";
          setAnalysisMessage("Aplicando Teorema Maestro...");
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      
      // Actualizar los datos con todos los casos (worst, best y avg si está disponible)
      setData({ 
        worst: analyzeRes.worst, 
        best: analyzeRes.best,
        avg: analyzeRes.avg  // Puede ser undefined si falló, pero el frontend lo maneja
      });
      
      // Asegurar que algorithmType se mantenga usando la variable local 'kind'
      // que ya tiene el valor correcto (no depender del estado que puede no haberse actualizado)
      // IMPORTANTE: Usar 'kind' en lugar de 'algorithmType' para evitar problemas de timing
      if (kind) {
        // Usar el tipo que ya fue clasificado (puede ser "hybrid", "recursive", etc.)
        setAlgorithmType(kind);
        console.log(`[Analyzer] algorithmType establecido desde clasificación: ${kind}`);
      } else if (analyzeRes.worst?.totals?.recurrence || analyzeRes.best?.totals?.recurrence) {
        // Fallback: si no hay kind pero hay recurrencia, asumir recursive
        // (esto no debería pasar normalmente, pero es un fallback de seguridad)
        setAlgorithmType("recursive");
        console.log('[Analyzer] algorithmType establecido a "recursive" como fallback basado en datos');
      }
      
      // Debug: verificar que el tipo de algoritmo sea correcto
      console.log('[Analyzer] Datos actualizados:', {
        algorithmType: algorithmType || "recursive (detectado desde datos)",
        method: detectedMethod,
        hasWorst: !!analyzeRes.worst,
        hasBest: !!analyzeRes.best,
        hasAvg: !!analyzeRes.avg,
        worstHasRecurrence: !!analyzeRes.worst?.totals?.recurrence,
        worstHasMaster: !!analyzeRes.worst?.totals?.master,
        worstHasIteration: !!analyzeRes.worst?.totals?.iteration,
        worstHasRecursionTree: !!analyzeRes.worst?.totals?.recursion_tree
      });

      // 7) Mostrar completado y cerrar de forma suave
      setAnalysisMessage(`Análisis completo con ${detectedMethod}`);
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

  // Handler para comparar con LLM
  const handleCompareWithLLM = async () => {
    if (!data || !hasApiKey) return;

    try {
      setIsComparing(true);
      setComparisonProgress(0);
      setComparisonMessage("Contactando con LLM...");

      // Determinar tipo de algoritmo y datos core
      const isRecursive = isRecursiveAnalysis(data.worst || data.best || data.avg || null);
      
      // Extraer datos core de todos los casos para iterativo
      const ownCoreDataWorst = extractCoreData(data.worst || null);
      const ownCoreDataBest = extractCoreData(data.best || null);
      const ownCoreDataAvg = extractCoreData(data.avg || null);
      
      // Para recursivo, usar worst como principal
      const ownCoreData = isRecursive ? ownCoreDataWorst : ownCoreDataWorst;

      if (!ownCoreData) {
        throw new Error("No se pudieron extraer los datos core del análisis");
      }

      // Preparar todos los datos del análisis para enviar al LLM
      const fullAnalysisData = {
        worst: ownCoreDataWorst,
        best: ownCoreDataBest,
        avg: ownCoreDataAvg,
        isRecursive,
      };

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
          "characteristic_equation": "Ecuación Característica",
          "iteration": "Método de Iteración",
          "master": "Teorema Maestro",
          "recursion_tree": "Árbol de Recursión"
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
${JSON.stringify(fullAnalysisData, null, 2)}${methodInstruction}

**INSTRUCCIONES:**
1. Analiza el algoritmo proporcionado
2. Determina si es iterativo o recursivo
3. Calcula la complejidad temporal y espacial
4. ${ownMethod && isRecursive ? `**USA EL MISMO MÉTODO QUE EL ANÁLISIS PROPIO** (${ownMethod})` : 'Aplica los métodos apropiados (Teorema Maestro, Iteración, Árbol de Recursión, Ecuación Característica, etc.)'}
5. Proporciona todos los datos core del análisis en formato JSON
6. **IMPORTANTE**: Compara tu análisis con el análisis propio proporcionado y da una observación REAL y específica (máx. 150 caracteres) sobre:
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
        "Finalizando comparación..."
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
        const easedProgress = progress < 0.5
          ? 2 * progress * progress  // Ease-in: más lento al inicio
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

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: 'compare',
          prompt,
          apiKey: apiKey || undefined,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      // Cuando recibimos la respuesta, ir de 95% a 100%
      setComparisonMessage("Procesando respuesta...");
      await animateProgress(95, 100, 300, setComparisonProgress);

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(result.error || "Error al obtener respuesta del LLM");
      }

      setComparisonMessage("Generando comparación...");

      // Extraer datos del LLM
      const llmResponseText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!llmResponseText) {
        throw new Error("No se recibió respuesta del LLM");
      }

      // Parsear JSON de la respuesta
      let llmResponse: { 
        analysis?: Record<string, unknown>; 
        time_complexity?: Record<string, unknown>;
        note?: string; 
        algorithm_type?: string;
      };
      try {
        llmResponse = JSON.parse(llmResponseText);
      } catch {
        // Intentar extraer JSON si está dentro de un bloque de código
        const jsonMatch = llmResponseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          llmResponse = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error("No se pudo parsear la respuesta del LLM como JSON");
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
      if (llmResponse.time_complexity && typeof llmResponse.time_complexity === 'object') {
        const timeComplexity = llmResponse.time_complexity as Record<string, unknown>;
        
        // Verificar si time_complexity tiene directamente recurrence, method, characteristic_equation, etc.
        // (estructura para recursivos: { time_complexity: { recurrence, method, characteristic_equation/iteration/master, big_theta } })
        if (timeComplexity.recurrence || timeComplexity.method || timeComplexity.characteristic_equation || timeComplexity.iteration || timeComplexity.master) {
          const convertRecursiveAnalysis = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};
            
            // Notaciones asintóticas
            if (timeComplexity.big_theta && typeof timeComplexity.big_theta === 'string') result.big_theta = timeComplexity.big_theta;
            if (timeComplexity.big_o && typeof timeComplexity.big_o === 'string') result.big_o = timeComplexity.big_o;
            if (timeComplexity.big_O && typeof timeComplexity.big_O === 'string') result.big_o = timeComplexity.big_O;
            if (timeComplexity.big_omega && typeof timeComplexity.big_omega === 'string') result.big_omega = timeComplexity.big_omega;
            if (timeComplexity.big_Omega && typeof timeComplexity.big_Omega === 'string') result.big_omega = timeComplexity.big_Omega;
            
            // Extraer recurrence
            if (timeComplexity.recurrence && typeof timeComplexity.recurrence === 'object') {
              const recurrence = timeComplexity.recurrence as Record<string, unknown>;
              result.recurrence = {
                type: (recurrence.type as "divide_conquer" | "linear_shift") || "linear_shift",
                form: (recurrence.form as string) || "",
                a: (recurrence.a as number) || undefined,
                b: (recurrence.b as number) || undefined,
                f: (recurrence.f as string) || undefined,
                order: (recurrence.order as number) || undefined,
                shifts: (recurrence.shifts as number[]) || undefined,
                coefficients: (recurrence.coefficients as number[]) || undefined,
                "g(n)": (recurrence["g(n)"] as string) || undefined,
                n0: (recurrence.n0 as number) || undefined,
                method: (timeComplexity.method as string) || undefined,
              };
            }
            
            // Extraer method
            if (timeComplexity.method && typeof timeComplexity.method === 'string') {
              result.method = timeComplexity.method;
            }
            
            // Extraer characteristic_equation (prioridad alta)
            if (timeComplexity.characteristic_equation && typeof timeComplexity.characteristic_equation === 'object') {
              const charEq = timeComplexity.characteristic_equation as Record<string, unknown>;
              result.characteristic_equation = {
                equation: (charEq.equation as string) || "",
                roots: (charEq.roots as Array<{ root: string; multiplicity: number }>) || undefined,
                dominant_root: (charEq.dominant_root as string) || undefined,
                growth_rate: (charEq.growth_rate as number) || undefined,
                homogeneous_solution: (charEq.homogeneous_solution as string) || "",
                particular_solution: (charEq.particular_solution as string) || undefined,
                general_solution: (charEq.general_solution as string) || undefined,
                closed_form: (charEq.closed_form as string) || "",
                theta: (charEq.theta as string) || result.big_theta || "",
              };
              // Usar theta de characteristic_equation si está disponible
              if (result.characteristic_equation.theta) {
                result.big_theta = result.characteristic_equation.theta;
              }
            }
            
            // Extraer iteration
            if (timeComplexity.iteration && typeof timeComplexity.iteration === 'object') {
              const iteration = timeComplexity.iteration as Record<string, unknown>;
              const baseCase = iteration.base_case as Record<string, unknown> | undefined;
              const summation = iteration.summation as Record<string, unknown> | undefined;
              
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
            if (timeComplexity.master && typeof timeComplexity.master === 'object') {
              const master = timeComplexity.master as Record<string, unknown>;
              result.master = {
                case: (master.case as 1 | 2 | 3 | null) || null,
                nlogba: (master.nlogba as string) || "",
                comparison: (master.comparison as "smaller" | "equal" | "larger" | null) || null,
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
        else if (timeComplexity.analysis && typeof timeComplexity.analysis === 'object') {
          const analysisData = timeComplexity.analysis as Record<string, unknown>;
          const convertAnalysisData = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};
            
            // T_open y T_polynomial
            if (analysisData.T_open && typeof analysisData.T_open === 'string') result.T_open = analysisData.T_open;
            if (analysisData.T_polynomial && typeof analysisData.T_polynomial === 'string') result.T_polynomial = analysisData.T_polynomial;
            
            // Notaciones asintóticas
            if (analysisData.big_theta && typeof analysisData.big_theta === 'string') result.big_theta = analysisData.big_theta;
            if (analysisData.big_o && typeof analysisData.big_o === 'string') result.big_o = analysisData.big_o;
            if (analysisData.big_O && typeof analysisData.big_O === 'string') result.big_o = analysisData.big_O;
            if (analysisData.big_omega && typeof analysisData.big_omega === 'string') result.big_omega = analysisData.big_omega;
            if (analysisData.big_Omega && typeof analysisData.big_Omega === 'string') result.big_omega = analysisData.big_Omega;
            
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
        } else if (timeComplexity.worst || timeComplexity.best || timeComplexity.avg) {
          // Si time_complexity tiene worst, best, avg directamente
          const convertTimeComplexityCase = (caseData: unknown): CoreAnalysisData | null => {
            if (!caseData || typeof caseData !== 'object') return null;
            const data = caseData as Record<string, unknown>;
            
            const result: CoreAnalysisData = {};
            if (data.T_open && typeof data.T_open === 'string') result.T_open = data.T_open;
            if (data.T_polynomial && typeof data.T_polynomial === 'string') result.T_polynomial = data.T_polynomial;
            if (data.big_theta && typeof data.big_theta === 'string') result.big_theta = data.big_theta;
            if (data.big_o && typeof data.big_o === 'string') result.big_o = data.big_o;
            if (data.big_O && typeof data.big_O === 'string') result.big_o = data.big_O;
            if (data.big_omega && typeof data.big_omega === 'string') result.big_omega = data.big_omega;
            if (data.big_Omega && typeof data.big_Omega === 'string') result.big_omega = data.big_Omega;
            
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
      
      // Si el análisis tiene worst, best, avg directamente, usarlos (solo si no se procesó antes)
      if (!dataProcessed && (llmAnalysis.worst || llmAnalysis.best || llmAnalysis.avg)) {
        setLlmAnalysisData({
          worst: (llmAnalysis.worst || null) as CoreAnalysisData | null,
          best: (llmAnalysis.best || null) as CoreAnalysisData | null,
          avg: (llmAnalysis.avg || null) as CoreAnalysisData | null,
        });
      } else if (!dataProcessed && llmAnalysis.time_complexity && typeof llmAnalysis.time_complexity === 'object') {
        // Estructura: { analysis: { time_complexity: { worst: {...}, best: {...}, avg: {...} } } }
        // O también: { analysis: { time_complexity: { recurrence, method, characteristic_equation, ... } } }
        const timeComplexity = llmAnalysis.time_complexity as Record<string, unknown>;
        
        // Verificar si time_complexity tiene directamente recurrence, method, characteristic_equation, etc.
        // (estructura para recursivos)
        if (timeComplexity.recurrence || timeComplexity.method || timeComplexity.characteristic_equation || timeComplexity.iteration || timeComplexity.master) {
          const convertRecursiveAnalysis = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};
            
            // Notaciones asintóticas
            if (timeComplexity.big_theta && typeof timeComplexity.big_theta === 'string') result.big_theta = timeComplexity.big_theta;
            if (timeComplexity.big_o && typeof timeComplexity.big_o === 'string') result.big_o = timeComplexity.big_o;
            if (timeComplexity.big_O && typeof timeComplexity.big_O === 'string') result.big_o = timeComplexity.big_O;
            if (timeComplexity.big_omega && typeof timeComplexity.big_omega === 'string') result.big_omega = timeComplexity.big_omega;
            if (timeComplexity.big_Omega && typeof timeComplexity.big_Omega === 'string') result.big_omega = timeComplexity.big_Omega;
            
            // Extraer recurrence
            if (timeComplexity.recurrence && typeof timeComplexity.recurrence === 'object') {
              const recurrence = timeComplexity.recurrence as Record<string, unknown>;
              result.recurrence = {
                type: (recurrence.type as "divide_conquer" | "linear_shift") || "linear_shift",
                form: (recurrence.form as string) || "",
                a: (recurrence.a as number) || undefined,
                b: (recurrence.b as number) || undefined,
                f: (recurrence.f as string) || undefined,
                order: (recurrence.order as number) || undefined,
                shifts: (recurrence.shifts as number[]) || undefined,
                coefficients: (recurrence.coefficients as number[]) || undefined,
                "g(n)": (recurrence["g(n)"] as string) || undefined,
                n0: (recurrence.n0 as number) || undefined,
                method: (timeComplexity.method as string) || undefined,
              };
            }
            
            // Extraer method
            if (timeComplexity.method && typeof timeComplexity.method === 'string') {
              result.method = timeComplexity.method;
            }
            
            // Extraer characteristic_equation (prioridad alta)
            if (timeComplexity.characteristic_equation && typeof timeComplexity.characteristic_equation === 'object') {
              const charEq = timeComplexity.characteristic_equation as Record<string, unknown>;
              result.characteristic_equation = {
                equation: (charEq.equation as string) || "",
                roots: (charEq.roots as Array<{ root: string; multiplicity: number }>) || undefined,
                dominant_root: (charEq.dominant_root as string) || undefined,
                growth_rate: (charEq.growth_rate as number) || undefined,
                homogeneous_solution: (charEq.homogeneous_solution as string) || "",
                particular_solution: (charEq.particular_solution as string) || undefined,
                general_solution: (charEq.general_solution as string) || undefined,
                closed_form: (charEq.closed_form as string) || "",
                theta: (charEq.theta as string) || result.big_theta || "",
              };
              // Usar theta de characteristic_equation si está disponible
              if (result.characteristic_equation.theta) {
                result.big_theta = result.characteristic_equation.theta;
              }
            }
            
            // Extraer iteration
            if (timeComplexity.iteration && typeof timeComplexity.iteration === 'object') {
              const iteration = timeComplexity.iteration as Record<string, unknown>;
              const baseCase = iteration.base_case as Record<string, unknown> | undefined;
              const summation = iteration.summation as Record<string, unknown> | undefined;
              
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
            if (timeComplexity.master && typeof timeComplexity.master === 'object') {
              const master = timeComplexity.master as Record<string, unknown>;
              result.master = {
                case: (master.case as 1 | 2 | 3 | null) || null,
                nlogba: (master.nlogba as string) || "",
                comparison: (master.comparison as "smaller" | "equal" | "larger" | null) || null,
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
        else if (timeComplexity.worst || timeComplexity.best || timeComplexity.avg) {
          const convertTimeComplexityCase = (caseData: unknown): CoreAnalysisData | null => {
            if (!caseData || typeof caseData !== 'object') return null;
            const data = caseData as Record<string, unknown>;
            
            // Extraer datos, manejando posibles variaciones en los nombres
            const result: CoreAnalysisData = {};
            
            // T_open y T_polynomial
            if (data.T_open && typeof data.T_open === 'string') result.T_open = data.T_open;
            if (data.T_polynomial && typeof data.T_polynomial === 'string') result.T_polynomial = data.T_polynomial;
            
            // Notaciones asintóticas (pueden venir con diferentes nombres)
            if (data.big_theta && typeof data.big_theta === 'string') result.big_theta = data.big_theta;
            if (data.big_o && typeof data.big_o === 'string') result.big_o = data.big_o;
            if (data.big_O && typeof data.big_O === 'string') result.big_o = data.big_O; // Variante con mayúscula
            if (data.big_omega && typeof data.big_omega === 'string') result.big_omega = data.big_omega;
            if (data.big_Omega && typeof data.big_Omega === 'string') result.big_omega = data.big_Omega; // Variante con mayúscula
            
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
        } else if (timeComplexity.analysis && typeof timeComplexity.analysis === 'object') {
          // Estructura: { time_complexity: { analysis: {...} } } - un solo análisis para todos los casos
          const analysisData = timeComplexity.analysis as Record<string, unknown>;
          const convertAnalysisData = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};
            
            // T_open y T_polynomial
            if (analysisData.T_open && typeof analysisData.T_open === 'string') result.T_open = analysisData.T_open;
            if (analysisData.T_polynomial && typeof analysisData.T_polynomial === 'string') result.T_polynomial = analysisData.T_polynomial;
            
            // Notaciones asintóticas
            if (analysisData.big_theta && typeof analysisData.big_theta === 'string') result.big_theta = analysisData.big_theta;
            if (analysisData.big_o && typeof analysisData.big_o === 'string') result.big_o = analysisData.big_o;
            if (analysisData.big_O && typeof analysisData.big_O === 'string') result.big_o = analysisData.big_O;
            if (analysisData.big_omega && typeof analysisData.big_omega === 'string') result.big_omega = analysisData.big_omega;
            if (analysisData.big_Omega && typeof analysisData.big_Omega === 'string') result.big_omega = analysisData.big_Omega;
            
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
        else if (timeComplexity.recurrence || timeComplexity.method || timeComplexity.characteristic_equation || timeComplexity.iteration || timeComplexity.master) {
          const convertRecursiveAnalysis = (): CoreAnalysisData | null => {
            const result: CoreAnalysisData = {};
            
            // Notaciones asintóticas
            if (timeComplexity.big_theta && typeof timeComplexity.big_theta === 'string') result.big_theta = timeComplexity.big_theta;
            if (timeComplexity.big_o && typeof timeComplexity.big_o === 'string') result.big_o = timeComplexity.big_o;
            if (timeComplexity.big_O && typeof timeComplexity.big_O === 'string') result.big_o = timeComplexity.big_O;
            if (timeComplexity.big_omega && typeof timeComplexity.big_omega === 'string') result.big_omega = timeComplexity.big_omega;
            if (timeComplexity.big_Omega && typeof timeComplexity.big_Omega === 'string') result.big_omega = timeComplexity.big_Omega;
            
            // Extraer recurrence
            if (timeComplexity.recurrence && typeof timeComplexity.recurrence === 'object') {
              const recurrence = timeComplexity.recurrence as Record<string, unknown>;
              result.recurrence = {
                type: (recurrence.type as "divide_conquer" | "linear_shift") || "linear_shift",
                form: (recurrence.form as string) || "",
                a: (recurrence.a as number) || undefined,
                b: (recurrence.b as number) || undefined,
                f: (recurrence.f as string) || undefined,
                order: (recurrence.order as number) || undefined,
                shifts: (recurrence.shifts as number[]) || undefined,
                coefficients: (recurrence.coefficients as number[]) || undefined,
                "g(n)": (recurrence["g(n)"] as string) || undefined,
                n0: (recurrence.n0 as number) || undefined,
                method: (timeComplexity.method as string) || undefined,
              };
            }
            
            // Extraer method
            if (timeComplexity.method && typeof timeComplexity.method === 'string') {
              result.method = timeComplexity.method;
            }
            
            // Extraer characteristic_equation (prioridad alta)
            if (timeComplexity.characteristic_equation && typeof timeComplexity.characteristic_equation === 'object') {
              const charEq = timeComplexity.characteristic_equation as Record<string, unknown>;
              result.characteristic_equation = {
                equation: (charEq.equation as string) || "",
                roots: (charEq.roots as Array<{ root: string; multiplicity: number }>) || undefined,
                dominant_root: (charEq.dominant_root as string) || undefined,
                growth_rate: (charEq.growth_rate as number) || undefined,
                homogeneous_solution: (charEq.homogeneous_solution as string) || "",
                particular_solution: (charEq.particular_solution as string) || undefined,
                general_solution: (charEq.general_solution as string) || undefined,
                closed_form: (charEq.closed_form as string) || "",
                theta: (charEq.theta as string) || result.big_theta || "",
              };
              // Usar theta de characteristic_equation si está disponible
              if (result.characteristic_equation.theta) {
                result.big_theta = result.characteristic_equation.theta;
              }
            }
            
            // Extraer iteration
            if (timeComplexity.iteration && typeof timeComplexity.iteration === 'object') {
              const iteration = timeComplexity.iteration as Record<string, unknown>;
              const baseCase = iteration.base_case as Record<string, unknown> | undefined;
              const summation = iteration.summation as Record<string, unknown> | undefined;
              
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
            if (timeComplexity.master && typeof timeComplexity.master === 'object') {
              const master = timeComplexity.master as Record<string, unknown>;
              result.master = {
                case: (master.case as 1 | 2 | 3 | null) || null,
                nlogba: (master.nlogba as string) || "",
                comparison: (master.comparison as "smaller" | "equal" | "larger" | null) || null,
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
            big_theta: (timeComplexity.big_theta as string) || (timeComplexity.big_O as string) || undefined,
            big_o: (timeComplexity.big_O as string) || undefined,
            big_omega: (timeComplexity.big_Omega as string) || undefined,
          };
          
          // Si hay información de recurrencia
          if (timeComplexity.recurrence_relation && typeof timeComplexity.recurrence_relation === 'object') {
            const recurrence = timeComplexity.recurrence_relation as Record<string, unknown>;
            if (recurrence.type === "linear_shift") {
              convertedAnalysis.recurrence = {
                type: "linear_shift",
                form: (recurrence.equation as string) || (recurrence.form as string) || "",
                method: (timeComplexity.method as string) || "iteration",
              };
            } else if (recurrence.type === "divide_conquer") {
              convertedAnalysis.recurrence = {
                type: "divide_conquer",
                form: (recurrence.equation as string) || (recurrence.form as string) || "",
                a: (recurrence.a as number) || 1,
                b: (recurrence.b as number) || 2,
                f: (recurrence.f as string) || "1",
                method: (timeComplexity.method as string) || "master",
              };
            }
          }
          
          // Si hay detalles del método de iteración
          if (timeComplexity.method === "iteration" && timeComplexity.method_details && typeof timeComplexity.method_details === 'object') {
            const details = timeComplexity.method_details as Record<string, unknown>;
            convertedAnalysis.method = "iteration";
            
            // Manejar tanto 'expansions' como 'steps' (el LLM puede usar cualquiera)
            const expansions = (details.expansions as string[]) || (details.steps as string[]) || [];
            
            convertedAnalysis.iteration = {
              g_function: (details.general_form as string) || "n-1",
              expansions: expansions,
              general_form: (details.general_form as string) || "",
              base_case: {
                condition: (details.base_case_substitution as string) || "n = 0",
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
      } else if (llmAnalysis.recurrence || llmAnalysis.iteration || llmAnalysis.method || llmAnalysis.characteristic_equation || llmAnalysis.master) {
        // Estructura con recurrence/iteration/characteristic_equation/master directamente en analysis
        const convertedAnalysis: CoreAnalysisData = {
          big_theta: (llmAnalysis.big_theta as string) || undefined,
          big_o: (llmAnalysis.big_o as string) || undefined,
          big_omega: (llmAnalysis.big_omega as string) || undefined,
        };
        
        // Extraer recurrence completo
        if (llmAnalysis.recurrence && typeof llmAnalysis.recurrence === 'object') {
          const recurrence = llmAnalysis.recurrence as Record<string, unknown>;
          convertedAnalysis.recurrence = {
            type: (recurrence.type as "divide_conquer" | "linear_shift") || "linear_shift",
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
        if (llmAnalysis.characteristic_equation && typeof llmAnalysis.characteristic_equation === 'object') {
          const charEq = llmAnalysis.characteristic_equation as Record<string, unknown>;
          convertedAnalysis.characteristic_equation = {
            equation: (charEq.equation as string) || "",
            roots: (charEq.roots as Array<{ root: string; multiplicity: number }>) || undefined,
            dominant_root: (charEq.dominant_root as string) || undefined,
            growth_rate: (charEq.growth_rate as number) || undefined,
            homogeneous_solution: (charEq.homogeneous_solution as string) || "",
            particular_solution: (charEq.particular_solution as string) || undefined,
            general_solution: (charEq.general_solution as string) || undefined,
            closed_form: (charEq.closed_form as string) || "",
            theta: (charEq.theta as string) || convertedAnalysis.big_theta || "",
          };
          // Usar theta de characteristic_equation si está disponible
          if (convertedAnalysis.characteristic_equation.theta) {
            convertedAnalysis.big_theta = convertedAnalysis.characteristic_equation.theta;
          }
        }
        
        // Extraer master
        if (llmAnalysis.master && typeof llmAnalysis.master === 'object') {
          const master = llmAnalysis.master as Record<string, unknown>;
          convertedAnalysis.master = {
            case: (master.case as 1 | 2 | 3 | null) || null,
            nlogba: (master.nlogba as string) || "",
            comparison: (master.comparison as "smaller" | "equal" | "larger" | null) || null,
            theta: (master.theta as string | null) || null,
          };
          // Usar theta de master si está disponible
          if (convertedAnalysis.master.theta) {
            convertedAnalysis.big_theta = convertedAnalysis.master.theta;
          }
        }
        
        // Extraer iteration completo
        if (llmAnalysis.iteration && typeof llmAnalysis.iteration === 'object') {
          const iteration = llmAnalysis.iteration as Record<string, unknown>;
          const baseCase = iteration.base_case as Record<string, unknown> | undefined;
          const summation = iteration.summation as Record<string, unknown> | undefined;
          
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
            theta: (iteration.theta as string) || convertedAnalysis.big_theta || "\\Theta(n)",
          };
        }
        
        // También verificar iteration_details como alternativa
        if (llmAnalysis.iteration_details && typeof llmAnalysis.iteration_details === 'object' && !convertedAnalysis.iteration) {
          const details = llmAnalysis.iteration_details as Record<string, unknown>;
          convertedAnalysis.iteration = {
            g_function: (details.general_form as string) || "n-1",
            expansions: (details.expansions as string[]) || (details.steps as string[]) || [],
            general_form: (details.general_form as string) || "",
            base_case: {
              condition: (details.base_case_substitution as string) || (details.base_case_condition as string) || "n = 0",
              k: "n",
            },
            summation: {
              expression: (details.final_equation as string) || (details.solution as string) || "",
              evaluated: (details.result as string) || (details.solution as string) || "",
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
      const errorMsg = error instanceof Error ? error.message : "Error inesperado durante la comparación";
      setComparisonMessage(`Error: ${errorMsg}`);
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
      const getBoundType = (): 'lower' | 'upper' | 'exact' => {
        if (caseType === 'best') return 'lower';
        if (caseType === 'worst') return 'upper';
        return 'exact';
      };
      return {
        notation: caseType === 'best' ? 'Ω(—)' : caseType === 'worst' ? 'O(—)' : 'Θ(—)',
        type: 'single-bound' as const,
        boundType: getBoundType(),
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

      {/* Selector de método - debe aparecer sobre el loader */}
      {showMethodSelector && applicableMethods.length > 0 && analyzing && (
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
                    onErrorsChange={handleErrorsChange}
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
                      {!localParseOk && (
                        <button
                          onClick={() => setShowRepairModal(true)}
                          disabled={!hasApiKey}
                          className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400/50 bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group"
                          title={!hasApiKey ? "Se requiere una API_KEY para usar esta función" : ""}
                        >
                          <span className="material-symbols-outlined text-sm">auto_awesome</span>
                          <span>Reparar con IA</span>
                          {!hasApiKey && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                              Se requiere una API_KEY
                            </div>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setShowAstModal(true)}
                        disabled={!localParseOk || !ast}
                        className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-400/50 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <span className="material-symbols-outlined text-sm">account_tree</span>
                        <span>Ver AST</span>
                      </button>
                      <button
                        onClick={handleCompareWithLLM}
                        disabled={!hasApiKey || !data}
                        className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-white text-xs font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400/50 bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative group"
                        title={!hasApiKey ? "Se requiere una API_KEY para usar esta función" : !data ? "Se requiere un análisis completado" : ""}
                      >
                        <span className="material-symbols-outlined text-sm">compare_arrows</span>
                        <span>Comparar con LLM</span>
                        {(!hasApiKey || !data) && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-600">
                            {!hasApiKey ? "Se requiere una API_KEY" : "Se requiere un análisis completado"}
                          </div>
                        )}
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
                    // Asegurar que avg esté definido (null en lugar de undefined)
                    const dataWithAvg: {
                      worst: AnalyzeOpenResponse | null;
                      best: AnalyzeOpenResponse | null;
                      avg: AnalyzeOpenResponse | null;
                    } | null = data ? {
                      worst: data.worst ?? null,
                      best: data.best ?? null,
                      avg: data.avg ?? null,
                    } : null;
                    return <RecursiveAnalysisView data={dataWithAvg} />;
                  } else {
                    // Asegurar que avg esté definido (null en lugar de undefined)
                    const dataWithAvg: {
                      worst: AnalyzeOpenResponse | null;
                      best: AnalyzeOpenResponse | null;
                      avg: AnalyzeOpenResponse | null;
                    } | null = data ? {
                      worst: data.worst ?? null,
                      best: data.best ?? null,
                      avg: data.avg ?? null,
                    } : null;
                    return (
                      <IterativeAnalysisView
                        data={dataWithAvg}
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
        analysisData={selectedCase === 'worst' ? (data?.worst || undefined) : 
                      selectedCase === 'best' ? (data?.best || undefined) :
                      selectedCase === 'average' ? (data?.avg || undefined) : undefined}
      />
      {/* Modal de procedimiento general */}
      <GeneralProcedureModal
        open={openGeneral}
        onClose={() => setOpenGeneral(false)}
        data={generalProcedureCase === 'worst' ? (data?.worst || undefined) : 
              generalProcedureCase === 'best' ? (data?.best || undefined) :
              generalProcedureCase === 'average' ? (data?.avg || undefined) : undefined}
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

      {/* Modal de reparación */}
      <RepairModal
        open={showRepairModal}
        onClose={() => setShowRepairModal(false)}
        onAccept={(repairedCode) => {
          setSource(repairedCode);
          setShowRepairModal(false);
        }}
        originalCode={source}
        parseErrors={parseErrors}
      />

      {/* Loader de comparación con LLM */}
      {isComparing && (
        <ComparisonLoader
          progress={comparisonProgress}
          message={comparisonMessage}
          isComplete={false}
          error={comparisonMessage.startsWith("Error:") ? comparisonMessage : null}
          onClose={() => setIsComparing(false)}
        />
      )}

      {/* Modal de comparación con LLM */}
      <ComparisonModal
        open={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        ownData={{
          worst: extractCoreData(data?.worst || null),
          best: extractCoreData(data?.best || null),
          avg: extractCoreData(data?.avg || null),
        }}
        llmData={llmAnalysisData || { worst: null, best: null, avg: null }}
        note={llmNote}
        isRecursive={isRecursiveAnalysis(data?.worst || data?.best || data?.avg || null)}
      />

      <Footer />
    </div>
  );
}