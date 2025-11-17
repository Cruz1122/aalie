"use client";

import type { Program } from "@aa/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AnalysisLoader } from "@/components/AnalysisLoader";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NavigationLink from "@/components/NavigationLink";
import { useNavigation } from "@/contexts/NavigationContext";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { getApiKey, getApiKeyStatus } from "@/hooks/useApiKey";
import { heuristicKind } from "@/lib/algorithm-classifier";

type ExampleCategory = "simple" | "iterative" | "recursive" | "greedy";

interface Example {
  id: number;
  name: string;
  description: string;
  complexity: string;
  code: string;
  category: ExampleCategory;
  note?: string;
}

const examples: Example[] = [
  // Simples/Unknown
  {
    id: 1,
    name: "Asignación Simple",
    description:
      "Operación básica de asignación sin bucles. Este tipo de algoritmo se clasifica como 'unknown' ya que no tiene estructuras de control complejas.",
    complexity: "O(1)",
    code: `suma(a, b) BEGIN
    resultado <- a + b;
    RETURN resultado;
END`,
    category: "simple",
    note: "Se clasificará como 'unknown' en el análisis (sin bucles complejos)",
  },
  {
    id: 2,
    name: "Acceso a Array Simple",
    description:
      "Acceso directo a un elemento de un array. Operación de tiempo constante sin bucles.",
    complexity: "O(1)",
    code: `obtenerElemento(A[n], indice) BEGIN
    elemento <- A[indice];
    RETURN elemento;
END`,
    category: "simple",
    note: "Se clasificará como 'unknown' en el análisis",
  },
  
  // Iterativos
  {
    id: 3,
    name: "Búsqueda Lineal",
    description:
      "Recorre un array secuencialmente buscando un elemento específico. Es el algoritmo de búsqueda más simple, ideal para arrays pequeños o no ordenados.",
    complexity: "Best: O(1), Worst: O(n), Avg: O(n/2)",
    code: `busquedaLineal(A[n], x, n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END`,
    category: "iterative",
  },
  {
    id: 4,
    name: "Búsqueda Binaria Iterativa",
    description:
      "Busca un elemento en un array ordenado dividiendo el espacio de búsqueda a la mitad en cada iteración. Versión iterativa de la búsqueda binaria.",
    complexity: "Best: O(1), Worst: O(log n), Avg: O(log n)",
    code: `busquedaBinariaIterativa(A[n], x, n) BEGIN
    izq <- 1;
    der <- n;
    WHILE (izq <= der) DO BEGIN
        mitad <- (izq + der) / 2;
        IF (A[mitad] = x) THEN BEGIN
            RETURN mitad;
        END
        ELSE BEGIN
            IF (A[mitad] < x) THEN BEGIN
                izq <- mitad + 1;
            END
            ELSE BEGIN
                der <- mitad - 1;
            END
        END
    END
    RETURN -1;
END`,
    category: "iterative",
  },
  {
    id: 5,
    name: "Factorial Iterativo",
    description:
      "Calcula el factorial de un número de forma iterativa. Es más eficiente que la versión recursiva y no tiene riesgo de stack overflow para números grandes.",
    complexity: "O(n)",
    code: `factorial(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END`,
    category: "iterative",
  },
  {
    id: 6,
    name: "Suma de Array",
    description:
      "Calcula la suma de todos los elementos de un array. Algoritmo lineal simple que recorre el array una vez.",
    complexity: "O(n)",
    code: `sumaArray(A[n], n) BEGIN
    suma <- 0;
    FOR i <- 1 TO n DO BEGIN
        suma <- suma + A[i];
    END
    RETURN suma;
END`,
    category: "iterative",
  },
  {
    id: 7,
    name: "Máximo de Array",
    description:
      "Encuentra el elemento máximo en un array. Recorre el array comparando cada elemento con el máximo actual.",
    complexity: "Best: O(n), Worst: O(n), Avg: O(n)",
    code: `maximoArray(A[n], n) BEGIN
    maximo <- A[1];
    FOR i <- 2 TO n DO BEGIN
        IF (A[i] > maximo) THEN BEGIN
            maximo <- A[i];
        END
    END
    RETURN maximo;
END`,
    category: "iterative",
  },
  {
    id: 8,
    name: "Máximo Común Divisor - Algoritmo de Euclides",
    description:
      "Calcula el máximo común divisor de dos números usando el algoritmo de Euclides. Es uno de los algoritmos más antiguos y eficientes, con complejidad logarítmica.",
    complexity: "O(log min(a, b))",
    code: `mcd(a, b) BEGIN
    WHILE (b != 0) DO BEGIN
        temp <- b;
        b <- a MOD b;
        a <- temp;
    END
    RETURN a;
END`,
    category: "iterative",
  },
  {
    id: 9,
    name: "Ordenamiento Burbuja (Bubble Sort)",
    description:
      "Ordena un array comparando elementos adyacentes e intercambiándolos si están en el orden incorrecto. Es uno de los algoritmos de ordenamiento más simples, pero también uno de los menos eficientes.",
    complexity: "Best: O(n), Worst: O(n²), Avg: O(n²)",
    code: `burbuja(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
            END
        END
    END
END`,
    category: "iterative",
  },
  {
    id: 10,
    name: "Ordenamiento por Inserción (Insertion Sort)",
    description:
      "Construye el array ordenado insertando cada elemento en su posición correcta. Es eficiente para arrays pequeños o casi ordenados, con mejor rendimiento que Bubble Sort en la práctica.",
    complexity: "Best: O(n), Worst: O(n²), Avg: O(n²)",
    code: `insercion(A[n], n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        clave <- A[i];
        j <- i - 1;
        WHILE (j > 0 AND A[j] > clave) DO BEGIN
            A[j + 1] <- A[j];
            j <- j - 1;
        END
        A[j + 1] <- clave;
    END
END`,
    category: "iterative",
  },
  {
    id: 11,
    name: "Ordenamiento por Selección (Selection Sort)",
    description:
      "Encuentra el elemento mínimo y lo coloca en su posición final en cada iteración. Realiza menos intercambios que Bubble Sort, pero tiene la misma complejidad temporal.",
    complexity: "O(n²)",
    code: `seleccion(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        min_idx <- i;
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[j] < A[min_idx]) THEN BEGIN
                min_idx <- j;
            END
        END
        temp <- A[i];
        A[i] <- A[min_idx];
        A[min_idx] <- temp;
    END
END`,
    category: "iterative",
  },
  
  // Recursivos
  {
    id: 12,
    name: "Búsqueda Binaria Recursiva",
    description:
      "Busca un elemento en un array ordenado usando recursión. Divide el espacio de búsqueda a la mitad en cada llamada recursiva.",
    complexity: "Best: O(1), Worst: O(log n), Avg: O(log n)",
    code: `busquedaBinaria(A[n], x, inicio, fin) BEGIN
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
END`,
    category: "recursive",
  },
  {
    id: 13,
    name: "Fibonacci Recursivo",
    description:
      "Calcula el n-ésimo número de Fibonacci usando recursión directa. Es un ejemplo clásico de recursión, pero muy ineficiente debido a la repetición de cálculos.",
    complexity: "O(2ⁿ) - Exponencial",
    code: `fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    ELSE BEGIN
        RETURN fibonacci(n - 1) + fibonacci(n - 2);
    END
END`,
    category: "recursive",
  },
  {
    id: 14,
    name: "Torres de Hanoi",
    description:
      "Resuelve el problema clásico de las Torres de Hanoi usando recursión. Demuestra cómo un problema aparentemente simple puede tener complejidad exponencial.",
    complexity: "O(2ⁿ)",
    code: `hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        CALL moverDisco(origen, destino);
    END
    ELSE BEGIN
        CALL hanoi(n - 1, origen, auxiliar, destino);
        CALL moverDisco(origen, destino);
        CALL hanoi(n - 1, auxiliar, destino, origen);
    END
END`,
    category: "recursive",
  },
  {
    id: 15,
    name: "QuickSort (Ordenamiento Rápido)",
    description:
      "Algoritmo de ordenamiento divide y conquista usando particionamiento. Es uno de los algoritmos de ordenamiento más eficientes en la práctica, aunque su peor caso es cuadrático.",
    complexity: "O(n log n) promedio, O(n²) peor caso",
    code: `quicksort(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        pivot <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivot) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        temp <- A[i + 1];
        A[i + 1] <- A[der];
        A[der] <- temp;
        pi <- i + 1;
        CALL quicksort(A, izq, pi - 1);
        CALL quicksort(A, pi + 1, der);
    END
END`,
    category: "recursive",
  },
  
  // Voraces (Greedy)
  {
    id: 16,
    name: "Cambio de Monedas (Greedy)",
    description:
      "Algoritmo voraz para el problema de cambio de monedas. Encuentra el número mínimo de monedas necesarias para formar una cantidad dada.",
    complexity: "O(n)",
    code: `cambioMonedas(cantidad, monedas[n], n) BEGIN
    resultado <- 0;
    i <- n;
    WHILE (cantidad > 0 AND i >= 1) DO BEGIN
        IF (monedas[i] <= cantidad) THEN BEGIN
            num_monedas <- cantidad / monedas[i];
            resultado <- resultado + num_monedas;
            cantidad <- cantidad - (num_monedas * monedas[i]);
        END
        i <- i - 1;
    END
    RETURN resultado;
END`,
    category: "greedy",
  },
];

type AlgorithmKind = "iterative" | "recursive" | "hybrid" | "unknown";

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

const formatUnsupportedKindMessage = (value: AlgorithmKind): string => {
  return value === "recursive" ? "recursivo" : "híbrido";
};

export default function ExamplesPage() {
  const router = useRouter();
  const { animateProgress } = useAnalysisProgress();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { finishNavigation } = useNavigation();
  
  // Estados para el loader de análisis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("Iniciando análisis...");
  const [algorithmType, setAlgorithmType] = useState<AlgorithmKind | undefined>(undefined);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Finalizar la carga cuando el componente se monte
  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  const handleCopy = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
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
    setAnalysisError(null);

    try {
      setAnalysisMessage("Parseando código...");
      const parsePromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/grammar/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: sourceCode }),
      }).then(r => r.json());

      const parseRes = await animateProgress(0, 20, 800, setAnalysisProgress, parsePromise) as { ok: boolean; ast?: Program; errors?: Array<{ line: number; column: number; message: string }> };

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

      setAnalysisMessage("Clasificando algoritmo...");
      let kind: AlgorithmKind;
      try {
        const apiKey = getApiKey();
        const clsPromise = fetch("/api/llm/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: sourceCode, mode: "local", apiKey: apiKey || undefined }),
        });

        const clsResponse = await animateProgress(20, 40, 1200, setAnalysisProgress, clsPromise) as Response;

        if (clsResponse.ok) {
          const cls = await clsResponse.json() as { kind: string; method?: string; mode?: string };
          kind = cls.kind as AlgorithmKind;
          setAlgorithmType(kind);
          setAnalysisMessage(`Algoritmo identificado: ${formatAlgorithmKindLabel(kind)}`);
        } else {
          throw new Error(`HTTP ${clsResponse.status}`);
        }
      } catch (error) {
        console.warn(`[Examples] Error en clasificación, usando heurística:`, error);
        kind = heuristicKind(parseRes.ast || null);
        setAlgorithmType(kind);
        setAnalysisMessage(`Algoritmo identificado: ${formatAlgorithmKindLabel(kind)}`);
      }

      setAnalysisMessage("Hallando sumatorias...");
      await animateProgress(40, 50, 200, setAnalysisProgress);

      // Verificar estado de API_KEY
      const apiKeyStatus = await getApiKeyStatus();
      const apiKey = getApiKey();
      const hasApiKey = apiKeyStatus.hasAny;
      
      // Mostrar mensaje según disponibilidad de API_KEY
      if (hasApiKey) {
        setAnalysisMessage("Simplificando expresiones matemáticas...");
      } else {
        setAnalysisMessage("Analizando (sin simplificación LLM)...");
      }
      
      // Realizar una sola petición que trae todos los casos (worst, best y avg)
      const analyzeBody: { 
        source: string; 
        mode: string; 
        api_key?: string;
        avgModel?: { mode: string; predicates?: Record<string, string> };
      } = { 
        source: sourceCode, 
        mode: "all",
        avgModel: {
          mode: "uniform",
          predicates: {}
        }
      };
      if (apiKey) {
        analyzeBody.api_key = apiKey;
      }
      // Si no hay apiKey en localStorage, el backend intentará usar la de variables de entorno
      
      const analyzePromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyze/open`, {
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

      // Guardar código y resultados en sessionStorage (igual que ManualModeView y chatbot)
      if (globalThis.window !== undefined) {
        sessionStorage.setItem('analyzerCode', sourceCode);
        sessionStorage.setItem('analyzerResults', JSON.stringify(analyzeRes));
      }

      setAnalysisMessage("Análisis completo");
      setIsAnalysisComplete(true);

      // Esperar antes de navegar
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Navegar a /analyzer con los datos (el loader se ocultará automáticamente al desmontarse)
      router.push('/analyzer');
    } catch (error) {
      console.error("[Examples] Error inesperado:", error);
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

  const handleAnalyze = (code: string) => {
    void runAnalysis(code);
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

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

      <main className="flex-1 z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          <header className="space-y-3 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              Ejemplos de Algoritmos
            </h1>
            <p className="text-dark-text text-sm sm:text-base lg:text-lg leading-relaxed max-w-4xl mx-auto lg:mx-0">
              Colección de algoritmos clásicos organizados por categorías. Los ejemplos están clasificados como simples (unknown), iterativos, recursivos y voraces.
              Copia cualquier ejemplo y analízalo directamente desde esta página.
            </p>
          </header>

          {/* Categorías */}
          {(["simple", "iterative", "recursive", "greedy"] as ExampleCategory[]).map((category) => {
            const categoryExamples = examples.filter((ex) => ex.category === category);
            if (categoryExamples.length === 0) return null;

            const categoryLabels: Record<ExampleCategory, { label: string; description: string; color: string }> = {
              simple: {
                label: "Simples/Unknown",
                description: "Algoritmos básicos sin bucles complejos. Se clasificarán como 'unknown' en el análisis.",
                color: "bg-gray-500/20 border-gray-500/30 text-gray-300",
              },
              iterative: {
                label: "Iterativos",
                description: "Algoritmos con bucles FOR/WHILE. Totalmente soportados por el analizador iterativo.",
                color: "bg-blue-500/20 border-blue-500/30 text-blue-300",
              },
              recursive: {
                label: "Recursivos",
                description: "Algoritmos con llamadas recursivas. Analizados con el Teorema Maestro.",
                color: "bg-red-500/20 border-red-500/30 text-red-300",
              },
              greedy: {
                label: "Voraces (Greedy)",
                description: "Algoritmos voraces que toman decisiones locales óptimas. Soportados si son iterativos.",
                color: "bg-purple-500/20 border-purple-500/30 text-purple-300",
              },
            };

            const catInfo = categoryLabels[category];

            return (
              <div key={category} className="space-y-4">
                <div className="glass-card p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{catInfo.label}</h2>
                  <p className="text-sm text-dark-text">{catInfo.description}</p>
                </div>

                {/* Grid de ejemplos de esta categoría */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {categoryExamples.map((example) => (
                    <div
                      key={example.id}
                      className="glass-card p-5 flex flex-col space-y-3 hover:scale-[1.01] transition-transform"
                    >
                      {/* Header del ejemplo */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-lg font-semibold text-white">{example.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${catInfo.color}`}>
                              {catInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">{example.complexity}</p>
                          {example.note && (
                            <div className="mt-2 p-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-300">
                              <strong>Nota:</strong> {example.note}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-dark-text text-sm leading-relaxed">{example.description}</p>

                      {/* Código */}
                      <div className="flex-1 bg-slate-900/50 border border-white/10 rounded p-3 overflow-x-auto scrollbar-custom">
                        <pre className="text-green-300 font-mono text-xs leading-relaxed whitespace-pre">
                          {example.code}
                        </pre>
                      </div>

                      {/* Footer con acción */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => handleCopy(example.code, example.id)}
                          className="px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 border border-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300"
                          title="Copiar código"
                          disabled={isAnalyzing}
                        >
                          {copiedId === example.id ? (
                            <>
                              <span className="material-symbols-outlined text-sm">check</span>{" "}
                              Copiado
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">content_copy</span>{" "}
                              Copiar
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleAnalyze(example.code)}
                          disabled={isAnalyzing}
                          className="flex items-center justify-center gap-2 py-1.5 px-4 rounded text-white text-xs font-medium transition-colors bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isAnalyzing ? (
                            <>
                              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>{' '}
                              Analizando...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">functions</span>{' '}
                              Analizar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Información adicional */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Cómo usar estos ejemplos</h2>
            <div className="space-y-3 text-dark-text text-sm">
              <p>
                1. <strong className="text-white">Copiar:</strong> Haz clic en el botón &quot;Copiar&quot; de
                cualquier ejemplo para copiar el código al portapapeles.
              </p>
              <p>
                2. <strong className="text-white">Analizar:</strong> Haz clic en el botón &quot;Analizar&quot; para
                analizar el algoritmo directamente desde esta página, o ve al{" "}
                <NavigationLink href="/analyzer" className="text-blue-400 hover:text-blue-300 underline">
                  analizador
                </NavigationLink>{" "}
                y pega el código en el editor.
              </p>
              <p>
                3. <strong className="text-white">Explorar:</strong> El sistema calculará
                automáticamente la complejidad temporal para best/worst/average case mostrando el análisis detallado.
              </p>
              <p>
                4. <strong className="text-white">Modificar:</strong> Experimenta modificando los
                ejemplos para entender cómo afectan los cambios a la complejidad.
              </p>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>💡 Nota sobre categorías:</strong> Los algoritmos simples se clasificarán como &quot;unknown&quot; en el análisis (no tienen bucles complejos). Los algoritmos recursivos se analizan automáticamente usando el Teorema Maestro, incluyendo visualización del árbol de recursión y procedimiento completo con pasos de prueba.
                </p>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <footer className="text-sm sm:text-base text-dark-text text-center border-t border-white/10 pt-6">
            <div className="flex justify-between items-center">
              <NavigationLink
                href="/user-guide"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                ← Ver Guía de Usuario
              </NavigationLink>
              <NavigationLink
                href="/analyzer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                Ir al Analizador →
              </NavigationLink>
            </div>
          </footer>
        </div>
      </main>

      <Footer />
    </div>
  );
}

