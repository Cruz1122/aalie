"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ExampleCard, type Example, type ExampleCategory } from "@/components/ExampleCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { NavigationFooter } from "@/components/NavigationFooter";
import NavigationLink from "@/components/NavigationLink";
import { PageHeader } from "@/components/PageHeader";
import { useAnalysisProgressContext } from "@/contexts/AnalysisProgressContext";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import { useNavigation } from "@/contexts/NavigationContext";

const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  "simple",
  "iterative",
  "recursive_iteration",
  "recursive_master",
  "recursive_tree",
  "recursive_characteristic",
];

const CATEGORY_ICONS: Record<ExampleCategory, string> = {
  simple: "help",
  iterative: "loop",
  recursive_iteration: "replay",
  recursive_master: "calculate",
  recursive_tree: "account_tree",
  recursive_characteristic: "functions",
};

const examples: Example[] = [
  // ========== Algoritmos Unknown/Básicos ==========
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

  // ========== Iterativos ==========
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

  // ========== Recursivos/Híbridos (Método Iterativo) ==========
  {
    id: 12,
    name: "Fibonacci Recursivo",
    description:
      "Calcula el n-ésimo número de Fibonacci usando recursión directa. Ahora analizado con el método de Ecuación Característica porque T(n) = T(n-1) + T(n-2) es una recurrencia lineal con desplazamientos constantes. Detecta automáticamente que es un caso de Programación Dinámica lineal.",
    complexity: "O(φⁿ) donde φ = (1+√5)/2 ≈ 1.618",
    code: `fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    ELSE BEGIN
        RETURN fibonacci(n - 1) + fibonacci(n - 2);
    END
END`,
    category: "recursive_characteristic",
    note: "Se analiza con Ecuación Característica (DP lineal detectada)",
    isHomogeneous: true, // T(n) = T(n-1) + T(n-2) es homogénea
  },
  {
    id: 13,
    name: "Torres de Hanoi",
    description:
      "Resuelve el problema clásico de las Torres de Hanoi usando recursión. Analizado con el método de Ecuación Característica porque T(n) = 2T(n-1) + 1 es una recurrencia lineal. Detecta automáticamente que es un caso de Programación Dinámica lineal.",
    complexity: "Best: O(1), Worst: O(2ⁿ), Avg: O(2ⁿ)",
    code: `hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        resultado <- hanoi(n - 1, origen, auxiliar, destino);
        resultado <- resultado + 1;
        resultado <- resultado + hanoi(n - 1, auxiliar, destino, origen);
        RETURN resultado;
    END
END`,
    category: "recursive_characteristic",
    note: "Se analiza con Ecuación Característica (DP lineal detectada)",
    isHomogeneous: false, // T(n) = 2T(n-1) + 1 es no homogénea (tiene +1)
  },
  {
    id: 14,
    name: "Factorial Recursivo",
    description:
      "Calcula el factorial de un número usando recursión. Analizado con el método de iteración porque la recurrencia T(n) = T(n-1) + O(1) no divide uniformemente.",
    complexity: "Best: O(1), Worst: O(n), Avg: O(n)",
    code: `factorialRecursivo(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        RETURN n * factorialRecursivo(n - 1);
    END
END`,
    category: "recursive_iteration",
    note: "Se analiza con método de iteración (desenrollado)",
  },

  // ========== Recursivos/Híbridos (Teorema Maestro) ==========
  {
    id: 15,
    name: "Búsqueda Binaria Recursiva",
    description:
      "Busca un elemento en un array ordenado usando recursión. Analizado con el Teorema Maestro porque T(n) = T(n/2) + O(1) con a=1, b=2.",
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
    category: "recursive_master",
    note: "Se analiza con Teorema Maestro (a=1, b=2)",
  },

  // ========== Recursivos/Híbridos (Árbol de Recursión) ==========
  {
    id: 16,
    name: "MergeSort (Ordenamiento por Mezcla)",
    description:
      "Algoritmo de ordenamiento divide y conquista que divide el array en dos mitades, ordena cada mitad recursivamente y las combina. Analizado con el método de Árbol de Recursión porque T(n) = 2T(n/2) + n con a=2, b=2.",
    complexity: "O(n log n)",
    code: `mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) / 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
        CALL mezclar(A, inicio, medio, fin);
    END
END

mezclar(A[n], inicio, medio, fin) BEGIN
    i <- inicio;
    j <- medio + 1;
    k <- 1;
    WHILE (i <= medio AND j <= fin) DO BEGIN
        IF (A[i] <= A[j]) THEN BEGIN
            temp[k] <- A[i];
            i <- i + 1;
        END
        ELSE BEGIN
            temp[k] <- A[j];
            j <- j + 1;
        END
        k <- k + 1;
    END
    WHILE (i <= medio) DO BEGIN
        temp[k] <- A[i];
        i <- i + 1;
        k <- k + 1;
    END
    WHILE (j <= fin) DO BEGIN
        temp[k] <- A[j];
        j <- j + 1;
        k <- k + 1;
    END
    FOR i <- 1 TO k - 1 DO BEGIN
        A[inicio + i - 1] <- temp[i];
    END
END`,
    category: "recursive_tree",
    note: "Se analiza con método de Árbol de Recursión (a=2, b=2)",
  },
  {
    id: 17,
    name: "Algoritmo Divide Desigual",
    description:
      "Divide un problema en 3 subproblemas iguales. Analizado con el método de Árbol de Recursión porque T(n) = 3T(n/3) + 1 con a=3, b=3.",
    complexity: "O(n)",
    code: `algoritmoDivideDesigual(arreglo, inicio, fin) BEGIN
    IF (fin - inicio <= 1) THEN BEGIN
        RETURN arreglo[inicio];
    END
    ELSE BEGIN
        medio1 <- inicio + (fin - inicio) DIV 3;
        medio2 <- inicio + 2 * (fin - inicio) DIV 3;
        resultado1 <- algoritmoDivideDesigual(arreglo, inicio, medio1);
        resultado2 <- algoritmoDivideDesigual(arreglo, medio1, medio2);
        resultado3 <- algoritmoDivideDesigual(arreglo, medio2, fin);
        RETURN resultado1 + resultado2 + resultado3;
    END
END`,
    category: "recursive_tree",
    note: "Se analiza con método de Árbol de Recursión (a=3, b=3)",
  },
  {
    id: 18,
    name: "Algoritmo Cuaternario",
    description:
      "Divide un problema en 4 subproblemas iguales. Analizado con el método de Árbol de Recursión porque T(n) = 4T(n/4) + 1 con a=4, b=4.",
    complexity: "O(n)",
    code: `algoritmoCuaternario(arreglo, inicio, fin) BEGIN
    IF (fin - inicio <= 1) THEN BEGIN
        RETURN arreglo[inicio];
    END
    ELSE BEGIN
        tamano <- fin - inicio;
        punto1 <- inicio + tamano DIV 4;
        punto2 <- inicio + 2 * tamano DIV 4;
        punto3 <- inicio + 3 * tamano DIV 4;
        
        resultado1 <- algoritmoCuaternario(arreglo, inicio, punto1);
        resultado2 <- algoritmoCuaternario(arreglo, punto1, punto2);
        resultado3 <- algoritmoCuaternario(arreglo, punto2, punto3);
        resultado4 <- algoritmoCuaternario(arreglo, punto3, fin);
        
        RETURN resultado1 + resultado2 + resultado3 + resultado4;
    END
END`,
    category: "recursive_tree",
    note: "Se analiza con método de Árbol de Recursión (a=4, b=4)",
  },
  {
    id: 19,
    name: "QuickSort (Ordenamiento Rápido)",
    description:
      "Algoritmo de ordenamiento divide y conquista usando particionamiento. En el mejor caso, analizado con el método de Árbol de Recursión porque T(n) = 2T(n/2) + n con a=2, b=2.",
    complexity: "Best: O(n log n), Worst: O(n²), Avg: O(n log n)",
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
    category: "recursive_tree",
    note: "En el mejor caso se analiza con método de Árbol de Recursión (a=2, b=2)",
  },

  // ========== Recursivos/Híbridos (Ecuación Característica) ==========
  {
    id: 20,
    name: "N-Step Stairs (Subir Escaleras)",
    description:
      "Cuenta el número de formas de subir n escalones, pudiendo dar pasos de 1 o 2 escalones a la vez. Recurrencia lineal T(n) = T(n-1) + T(n-2). Analizado con Ecuación Característica y detecta DP lineal automáticamente.",
    complexity: "Best: O(1), Worst: O(φⁿ), Avg: O(φⁿ) donde φ = (1+√5)/2 ≈ 1.618",
    code: `subirEscaleras(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        IF (n = 2) THEN BEGIN
            RETURN 2;
        END
        ELSE BEGIN
            RETURN subirEscaleras(n - 1) + subirEscaleras(n - 2);
        END
    END
END`,
    category: "recursive_characteristic",
    note: "Se analiza con Ecuación Característica (DP lineal detectada)",
    isHomogeneous: true, // T(n) = T(n-1) + T(n-2) es homogénea
  },
  {
    id: 21,
    name: "Formas de Decodificar",
    description:
      "Cuenta el número de formas de decodificar un mensaje numérico donde cada dígito o par de dígitos puede representar una letra. Recurrencia lineal T(n) = T(n-1) + T(n-2) con condiciones. Analizado con Ecuación Característica.",
    complexity: "Best: O(1), Worst: O(φⁿ), Avg: O(φⁿ) donde φ = (1+√5)/2 ≈ 1.618",
    code: `formasDecodificar(mensaje, n) BEGIN
    IF (n = 0 OR n = 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        formas <- 0;
        IF (mensaje[n] > 0) THEN BEGIN
            formas <- formas + formasDecodificar(mensaje, n - 1);
        END
        IF (mensaje[n-1] = 1 OR (mensaje[n-1] = 2 AND mensaje[n] < 7)) THEN BEGIN
            formas <- formas + formasDecodificar(mensaje, n - 2);
        END
        RETURN formas;
    END
END`,
    category: "recursive_characteristic",
    note: "Se analiza con Ecuación Característica (DP lineal detectada)",
    isHomogeneous: true, // T(n) = T(n-1) + T(n-2) es homogénea
  },
  {
    id: 22,
    name: "Tiling 2xN (Mosaicos)",
    description:
      "Cuenta el número de formas de llenar un tablero de 2xN con fichas de dominó (2x1). Recurrencia lineal T(n) = T(n-1) + T(n-2). Analizado con Ecuación Característica y detecta DP lineal.",
    complexity: "O(φⁿ) donde φ = (1+√5)/2 ≈ 1.618",
    code: `tiling2xN(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN n;
    END
    ELSE BEGIN
        RETURN tiling2xN(n - 1) + tiling2xN(n - 2);
    END
END`,
    category: "recursive_characteristic",
    note: "Se analiza con Ecuación Característica (DP lineal detectada)",
    isHomogeneous: true, // T(n) = T(n-1) + T(n-2) es homogénea
  },
  {
    id: 23,
    name: "Tribonacci",
    description:
      "Calcula el n-ésimo número de Tribonacci (similar a Fibonacci pero suma los últimos 3 términos). Recurrencia lineal T(n) = T(n-1) + T(n-2) + T(n-3). Analizado con Ecuación Característica.",
    complexity:
      "Best: O(1), Worst: O(rⁿ), Avg: O(rⁿ) donde r es la raíz real mayor",
    code: `tribonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    ELSE BEGIN
        IF (n = 2) THEN BEGIN
            RETURN 1;
        END
        ELSE BEGIN
            RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
        END
    END
END`,
    category: "recursive_characteristic",
    note: "Se analiza con Ecuación Característica (DP lineal detectada)",
    isHomogeneous: true, // T(n) = T(n-1) + T(n-2) + T(n-3) es homogénea
  },
  {
    id: 24,
    name: "Pell Numbers",
    description:
      "Calcula el n-ésimo número de Pell usando la recurrencia P(n) = 2P(n-1) + P(n-2). Recurrencia lineal homogénea. Analizado con Ecuación Característica.",
    complexity: "O((1+√2)ⁿ)",
    code: `pell(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    ELSE BEGIN
        RETURN 2 * pell(n - 1) + pell(n - 2);
    END
END`,
    category: "recursive_characteristic",
    note: "Se analiza con Ecuación Característica (DP lineal detectada)",
    isHomogeneous: true, // P(n) = 2P(n-1) + P(n-2) es homogénea (sin término constante)
  },

  // ========== Recursivos (Únicamente Teorema Maestro) ==========
  {
    id: 25,
    name: "QuickSort (Caso Promedio)",
    description:
      "Algoritmo de ordenamiento divide y conquista que funciona eligiendo un pivote y dividiendo el array en dos partes. En el caso promedio, T(n) = 2T(n/2) + O(n) pero el pivote no divide exactamente a la mitad. Analizado únicamente con Teorema Maestro porque a=1 no cumple las condiciones del Árbol de Recursión.",
    complexity: "Best: O(n log n), Worst: O(n²), Avg: O(n log n)",
    code: `quicksort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        pivote <- particionar(A, inicio, fin);
        CALL quicksort(A, inicio, pivote - 1);
        CALL quicksort(A, pivote + 1, fin);
    END
END

particionar(A[n], inicio, fin) BEGIN
    pivote <- A[fin];
    i <- inicio - 1;
    FOR j <- inicio TO fin - 1 DO BEGIN
        IF (A[j] <= pivote) THEN BEGIN
            i <- i + 1;
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    temp <- A[i + 1];
    A[i + 1] <- A[fin];
    A[fin] <- temp;
    RETURN i + 1;
END`,
    category: "recursive_master",
    note: "Se analiza únicamente con Teorema Maestro (a=1, divide no uniforme)",
  },
  {
    id: 26,
    name: "Búsqueda en Árbol Binario de Búsqueda",
    description:
      "Busca un elemento en un BST. La recurrencia T(n) = T(n/2) + O(1) depende de la altura del árbol. Analizado con Teorema Maestro porque a=1, b=2.",
    complexity: "Best: O(1), Worst: O(log n), Avg: O(log n)",
    code: `buscarBST(raiz, valor) BEGIN
    IF (raiz = null) THEN BEGIN
        RETURN null;
    END
    IF (raiz.valor = valor) THEN BEGIN
        RETURN raiz;
    END
    ELSE BEGIN
        IF (valor < raiz.valor) THEN BEGIN
            RETURN buscarBST(raiz.izquierda, valor);
        END
        ELSE BEGIN
            RETURN buscarBST(raiz.derecha, valor);
        END
    END
END`,
    category: "recursive_master",
    note: "Se analiza con Teorema Maestro (a=1, b=2). Detecta raiz.izquierda/derecha como n/2.",
  },
  {
    id: 27,
    name: "Exponentiación Rápida Recursiva",
    description:
      "Calcula x^n de forma eficiente usando divide y conquista. T(n) = T(n/2) + O(1). Analizado únicamente con Teorema Maestro porque a=1, b=2.",
    complexity: "Best: O(1), Worst: O(log n), Avg: O(log n)",
    code: `exponenciacionRapida(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    resultado <- exponenciacionRapida(x, n DIV 2);
    resultado <- resultado * resultado;
    IF (n MOD 2 = 1) THEN BEGIN
        resultado <- resultado * x;
    END
    RETURN resultado;
END`,
    category: "recursive_master",
    note: "Se analiza únicamente con Teorema Maestro (a=1, b=2)",
  },

  // ========== Recursivos (Únicamente Método Iterativo) ==========
  {
    id: 28,
    name: "Suma de Array Recursiva",
    description:
      "Suma los elementos de un array recursivamente procesando un elemento a la vez. Recurrencia T(n) = T(n-1) + O(1). Analizado únicamente con método iterativo porque no es lineal por desplazamientos constantes múltiples.",
    complexity: "Best: O(1), Worst: O(n), Avg: O(n)",
    code: `sumaArray(A[n], n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    ELSE BEGIN
        RETURN A[n] + sumaArray(A, n - 1);
    END
END`,
    category: "recursive_iteration",
    note: "Se analiza únicamente con método iterativo (T(n) = T(n-1) + O(1))",
  },
  {
    id: 29,
    name: "Búsqueda en Lista Enlazada",
    description:
      "Busca un elemento en una lista enlazada recursivamente. Recurrencia T(n) = T(n-1) + O(1). Analizado únicamente con método iterativo.",
    complexity: "Best: O(1), Worst: O(n), Avg: O(n)",
    code: `buscarLista(nodo, valor) BEGIN
    IF (nodo = null) THEN BEGIN
        RETURN false;
    END
    IF (nodo.valor = valor) THEN BEGIN
        RETURN true;
    END
    ELSE BEGIN
        RETURN buscarLista(nodo.siguiente, valor);
    END
END`,
    category: "recursive_iteration",
    note: "Se analiza únicamente con método iterativo (T(n) = T(n-1) + O(1))",
  },
  {
    id: 30,
    name: "Invertir Array Recursivo",
    description:
      "Invierte un array recursivamente intercambiando elementos de los extremos. Recurrencia T(n) = T(n-2) + O(1). Analizado únicamente con método iterativo porque no cumple las condiciones de ecuación característica.",
    complexity: "O(n)",
    code: `invertirArray(A[n], inicio, fin) BEGIN
    IF (inicio >= fin) THEN BEGIN
        RETURN 0;
    END
    temp <- A[inicio];
    A[inicio] <- A[fin];
    A[fin] <- temp;
    CALL invertirArray(A, inicio + 1, fin - 1);
END`,
    category: "recursive_iteration",
    note: "Se analiza únicamente con método iterativo (T(n) = T(n-2) + O(1))",
  },
];

export default function ExamplesPage() {
  const t = useTranslations("examples");
  const tCategories = useTranslations("examples.categories");
  const tCategoryDesc = useTranslations("examples.categoryDesc");
  const tMethods = useTranslations("analyzer.methods");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [viewingCodeId, setViewingCodeId] = useState<number | null>(null);
  const { finishNavigation } = useNavigation();
  const [analyzingExampleId, setAnalyzingExampleId] = useState<number | null>(
    null,
  );
  const { state: analysisState } = useAnalysisProgressContext();
  const { runAnalysis } = useRunAnalysis({
    onComplete: () => setAnalyzingExampleId(null),
  });
  const [activeSection, setActiveSection] = useState<string>("simple");
  const [showHowToUse, setShowHowToUse] = useState(false);

  const isAnalyzing =
    analysisState.visible && analysisState.mode === "analysis";

  // Finalizar la carga cuando el componente se monte
  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  // Scroll spy: actualizar activeSection al hacer scroll
  useEffect(() => {
    const categories = [
      "simple",
      "iterative",
      "recursive_iteration",
      "recursive_master",
      "recursive_tree",
      "recursive_characteristic",
    ] as ExampleCategory[];
    const onScroll = () => {
      const headerOffset = 100;
      const sections = categories
        .map((cat) => ({
          id: cat,
          el: document.getElementById(`category-${cat}`),
        }))
        .filter((s) => s.el)
        .map((s) => ({
          id: s.id,
          top: s.el!.getBoundingClientRect().top,
        }));
      const passed = sections.filter((s) => s.top <= headerOffset);
      const toSet =
        passed.length > 0 ? passed[passed.length - 1].id : sections[0]?.id ?? categories[0];
      setActiveSection(toSet);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCopy = async (code: string, id: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleAnalyze = (code: string, exampleId: number) => {
    setAnalyzingExampleId(exampleId);
    void runAnalysis(code);
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1 z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            icon="code_blocks"
            title={t("title")}
            description={t("subtitle")}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 mt-6">
            {/* TOC lateral - primero en mobile, lateral en desktop */}
            <aside className="lg:col-span-1 order-1 lg:order-1">
              <div className="glass-card p-4 sticky top-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-xl">
                    list
                  </span>
                  <h2 className="text-lg font-bold text-white">{t("toc")}</h2>
                </div>
                <nav className="space-y-1">
                  {EXAMPLE_CATEGORIES.map((category) => {
                    const categoryExamples = examples.filter(
                      (ex) => ex.category === category,
                    );
                    if (categoryExamples.length === 0) return null;

                    return (
                      <div key={category} className="space-y-0.5">
                        <a
                          href={`#category-${category}`}
                          className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-all ${
                            activeSection === category
                              ? "text-white bg-primary/20 border border-primary/30"
                              : "text-dark-text hover:text-white hover:bg-white/5"
                          }`}
                          onClick={() => setActiveSection(category)}
                        >
                          <span className="material-symbols-outlined text-base">
                            {CATEGORY_ICONS[category]}
                          </span>
                          <span className="line-clamp-2">
                            {tCategories(category)}
                          </span>
                          <span className="text-xs opacity-70 ml-auto">
                            {categoryExamples.length}
                          </span>
                        </a>
                        {categoryExamples.map((ex) => (
                          <a
                            key={ex.id}
                            href={`#example-${ex.id}`}
                            className="flex items-center gap-2 text-xs py-1.5 pl-8 pr-3 rounded-lg transition-all text-dark-text hover:text-white hover:bg-white/5"
                            onClick={() => setActiveSection(category)}
                          >
                            <span className="line-clamp-1">
                              {t(`items.${ex.id}.name`)}
                            </span>
                          </a>
                        ))}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Contenido principal */}
            <div className="lg:col-span-3 space-y-8 order-2 lg:order-2">
          {/* Categorías */}
          {EXAMPLE_CATEGORIES.map((category) => {
            const categoryExamples = examples.filter(
              (ex) => ex.category === category,
            );
            if (categoryExamples.length === 0) return null;

            const catInfo = {
              label: tCategories(category),
              description: tCategoryDesc(category),
            };

            return (
              <section
                key={category}
                id={`category-${category}`}
                className="scroll-mt-24"
              >
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-white">
                    {catInfo.label}
                  </h2>
                  <p className="text-xs text-dark-text mt-0.5">
                    {catInfo.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryExamples.map((example) => (
                    <ExampleCard
                      key={example.id}
                      example={example}
                      category={category}
                      copiedId={copiedId}
                      viewingCodeId={viewingCodeId}
                      analyzingExampleId={analyzingExampleId}
                      onCopy={handleCopy}
                      onViewCode={setViewingCodeId}
                      onAnalyze={handleAnalyze}
                      t={t}
                    />
                  ))}
                </div>
              </section>
            );
          })}

              {/* Cómo usar - compacto y colapsable */}
              <section className="glass-card p-4 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setShowHowToUse(!showHowToUse)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">
                      help
                    </span>
                    {t("howToUse")}
                  </h2>
                  <span
                    className={`material-symbols-outlined text-slate-400 transition-transform ${
                      showHowToUse ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                {showHowToUse && (
                  <div className="mt-3 space-y-2 text-dark-text text-xs">
                    <p>1. {t("howToUse1")}</p>
                    <p>2. {t("howToUse2")}</p>
                    <p>
                      3. {t("howToUse3")}{" "}
                      <NavigationLink
                        href="/analyzer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        {t("howToUse3Link")}
                      </NavigationLink>
                      .
                    </p>
                    <p>4. {t("howToUse4")}</p>
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-xs font-semibold mb-2">
                        💡 {t("methodsNote")}
                      </p>
                      <ul className="space-y-1 text-[11px] text-blue-200 list-disc list-inside">
                        <li>
                          <strong>{tMethods("characteristicEquation")}</strong>{" "}
                          {tCategoryDesc("recursive_characteristic")}
                        </li>
                        <li>
                          <strong>{tMethods("iterationMethod")}</strong>{" "}
                          {tCategoryDesc("recursive_iteration")}
                        </li>
                        <li>
                          <strong>{tMethods("masterTheorem")}</strong>{" "}
                          {tCategoryDesc("recursive_master")}
                        </li>
                        <li>
                          <strong>{tMethods("recursionTree")}</strong>{" "}
                          {tCategoryDesc("recursive_tree")}
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </section>

              <NavigationFooter
                namespace="examples"
                prev={{ href: "/user-guide", labelKey: "backToUserGuide" }}
                next={{ href: "/analyzer", labelKey: "goToAnalyzer" }}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
