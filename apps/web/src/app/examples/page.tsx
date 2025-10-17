"use client";

import { useEffect, useState } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NavigationLink from "@/components/NavigationLink";
import { useNavigation } from "@/contexts/NavigationContext";

interface Example {
  id: number;
  name: string;
  description: string;
  complexity: string;
  code: string;
}

const examples: Example[] = [
  {
    id: 1,
    name: "Búsqueda Lineal",
    description:
      "Recorre un array secuencialmente buscando un elemento específico. Es el algoritmo de búsqueda más simple, ideal para arrays pequeños o no ordenados.",
    complexity: "O(n)",
    code: `busquedaLineal(A[n], x, n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END`,
  },
  {
    id: 2,
    name: "Búsqueda Binaria",
    description:
      "Busca un elemento en un array ordenado dividiendo el espacio de búsqueda a la mitad en cada iteración. Requiere que el array esté previamente ordenado, pero es mucho más eficiente que la búsqueda lineal.",
    complexity: "O(log n)",
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
  },
  {
    id: 3,
    name: "Ordenamiento Burbuja (Bubble Sort)",
    description:
      "Ordena un array comparando elementos adyacentes e intercambiándolos si están en el orden incorrecto. Es uno de los algoritmos de ordenamiento más simples, pero también uno de los menos eficientes.",
    complexity: "O(n²)",
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
  },
  {
    id: 4,
    name: "Ordenamiento por Inserción (Insertion Sort)",
    description:
      "Construye el array ordenado insertando cada elemento en su posición correcta. Es eficiente para arrays pequeños o casi ordenados, con mejor rendimiento que Bubble Sort en la práctica.",
    complexity: "O(n²) peor caso, O(n) mejor caso",
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
  },
  {
    id: 5,
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
  },
  {
    id: 6,
    name: "Fibonacci Recursivo",
    description:
      "Calcula el n-ésimo número de Fibonacci usando recursión directa. Es un ejemplo clásico de recursión, pero muy ineficiente debido a la repetición de cálculos. Ideal para demostrar análisis de complejidad exponencial.",
    complexity: "O(2ⁿ) - Exponencial",
    code: `fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    ELSE BEGIN
        RETURN fibonacci(n - 1) + fibonacci(n - 2);
    END
END`,
  },
  {
    id: 7,
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
  },
  {
    id: 8,
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
  },
  {
    id: 9,
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
  },
  {
    id: 10,
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
  },
];

export default function ExamplesPage() {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { finishNavigation } = useNavigation();

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

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1 z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          <header className="space-y-3 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              Ejemplos de Algoritmos
            </h1>
            <p className="text-dark-text text-sm sm:text-base lg:text-lg leading-relaxed max-w-4xl mx-auto lg:mx-0">
              Colección de 10 algoritmos clásicos escritos en nuestro lenguaje de pseudocódigo.
              Copia cualquier ejemplo y pégalo en el{" "}
              <NavigationLink href="/analyzer" className="text-blue-400 hover:text-blue-300 underline">
                analizador
              </NavigationLink>{" "}
              para ver su complejidad.
            </p>
          </header>

          {/* Grid de ejemplos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {examples.map((example) => (
              <div
                key={example.id}
                className="glass-card p-6 flex flex-col space-y-4 hover:scale-[1.02] transition-transform"
              >
                {/* Header del ejemplo */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-bold text-lg">#{example.id}</span>
                      <h3 className="text-xl font-bold text-white">{example.name}</h3>
                    </div>
                    <p className="text-xs text-primary font-mono mt-1">{example.complexity}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(example.code, example.id)}
                    className="glass-secondary px-3 py-2 rounded text-xs font-semibold transition-colors flex items-center gap-1 hover:bg-white/20"
                    title="Copiar código"
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
                </div>

                {/* Descripción */}
                <p className="text-dark-text text-sm leading-relaxed">{example.description}</p>

                {/* Código */}
                <div className="flex-1 bg-black/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-300 font-mono text-xs leading-relaxed">
                    {example.code}
                  </pre>
                </div>

                {/* Footer con acción */}
                <div className="flex justify-end">
                  <NavigationLink
                    href="/analyzer"
                    onClick={() => {
                      // Guardar el código en sessionStorage para que el analyzer lo cargue
                      sessionStorage.setItem("loadExample", example.code);
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                  >
                    Probar en el analizador{" "}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </NavigationLink>
                </div>
              </div>
            ))}
          </div>

          {/* Información adicional */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Cómo usar estos ejemplos</h2>
            <div className="space-y-3 text-dark-text text-sm">
              <p>
                1. <strong className="text-white">Copiar:</strong> Haz clic en el botón "Copiar" de
                cualquier ejemplo para copiar el código al portapapeles.
              </p>
              <p>
                2. <strong className="text-white">Analizar:</strong> Ve al{" "}
                <NavigationLink href="/analyzer" className="text-blue-400 hover:text-blue-300 underline">
                  analizador
                </NavigationLink>{" "}
                y pega el código en el editor.
              </p>
              <p>
                3. <strong className="text-white">Explorar:</strong> El sistema calculará
                automáticamente la complejidad temporal mostrando el análisis detallado.
              </p>
              <p>
                4. <strong className="text-white">Modificar:</strong> Experimenta modificando los
                ejemplos para entender cómo afectan los cambios a la complejidad.
              </p>
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

