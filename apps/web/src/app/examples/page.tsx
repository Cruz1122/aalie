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

type ExampleCategory = "simple" | "iterative" | "recursive_iteration" | "recursive_master" | "recursive_tree" | "recursive_characteristic";

interface Example {
  id: number;
  name: string;
  description: string;
  complexity: string;
  code: string;
  category: ExampleCategory;
  note?: string;
  isHomogeneous?: boolean; // Solo para ejemplos de ecuación característica
}

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
    complexity: "O(2ⁿ)",
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
    complexity: "O(n)",
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
    complexity: "O(φⁿ) donde φ = (1+√5)/2 ≈ 1.618",
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
    complexity: "O(φⁿ) donde φ = (1+√5)/2 ≈ 1.618",
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
    complexity: "O(rⁿ) donde r es la raíz real mayor de la ecuación característica",
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
        quicksort(A, inicio, pivote - 1);
        quicksort(A, pivote + 1, fin);
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
      "Busca un elemento en un BST. La recurrencia T(n) = T(n/2) + O(1) depende de la altura del árbol. Analizado únicamente con Teorema Maestro porque a=1, b=2 no cumple las condiciones del Árbol de Recursión.",
    complexity: "Best: O(log n), Worst: O(n), Avg: O(log n)",
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
    note: "Se analiza únicamente con Teorema Maestro (a=1, b=2, caso promedio)",
  },
  {
    id: 27,
    name: "Exponentiación Rápida Recursiva",
    description:
      "Calcula x^n de forma eficiente usando divide y conquista. T(n) = T(n/2) + O(1). Analizado únicamente con Teorema Maestro porque a=1, b=2.",
    complexity: "O(log n)",
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
    complexity: "O(n)",
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
    complexity: "O(n)",
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
        RETURN;
    END
    temp <- A[inicio];
    A[inicio] <- A[fin];
    A[fin] <- temp;
    invertirArray(A, inicio + 1, fin - 1);
END`,
    category: "recursive_iteration",
    note: "Se analiza únicamente con método iterativo (T(n) = T(n-2) + O(1))",
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
  const [viewingCodeId, setViewingCodeId] = useState<number | null>(null);
  const { finishNavigation } = useNavigation();
  
  // Estados para el loader de análisis
  const [analyzingExampleId, setAnalyzingExampleId] = useState<number | null>(null); // Estado individual por ejemplo
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

  const runAnalysis = useCallback(async (sourceCode: string, exampleId: number) => {
    if (!sourceCode.trim()) return;
    if (analyzingExampleId !== null) return;

    setAnalyzingExampleId(exampleId);
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
          setAnalyzingExampleId(null);
          setAnalysisProgress(0);
          setAnalysisMessage("Iniciando análisis...");
          setAlgorithmType(undefined);
          setIsAnalysisComplete(false);
          setAnalysisError(null);
        }, 3000);
        return;
      }

      // Detectar método utilizado para mostrar mensaje correcto
      let detectedMethod = "análisis";
      if (typeof analyzeRes.worst === 'object' && analyzeRes.worst !== null) {
        const worstData = analyzeRes.worst as { totals?: { recurrence?: { method?: string }; characteristic_equation?: unknown } };
        if (worstData.totals?.characteristic_equation) {
          detectedMethod = "Ecuación Característica";
          setAnalysisMessage("Aplicando Método de Ecuación Característica...");
        } else if (worstData.totals?.recurrence) {
          const method = worstData.totals.recurrence.method;
          if (method === "characteristic_equation") {
            detectedMethod = "Ecuación Característica";
            setAnalysisMessage("Aplicando Método de Ecuación Característica...");
          } else if (method === "iteration") {
            detectedMethod = "Método de Iteración";
            setAnalysisMessage("Aplicando Método de Iteración...");
          } else if (method === "recursion_tree") {
            detectedMethod = "Método de Árbol de Recursión";
            setAnalysisMessage("Aplicando Método de Árbol de Recursión...");
          } else if (method === "master") {
            detectedMethod = "Teorema Maestro";
            setAnalysisMessage("Aplicando Teorema Maestro...");
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 300));

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
        setAnalyzingExampleId(null);
        setAnalysisProgress(0);
        setAnalysisMessage("Iniciando análisis...");
        setAlgorithmType(undefined);
        setIsAnalysisComplete(false);
        setAnalysisError(null);
      }, 3000);
    }
  }, [animateProgress, analyzingExampleId, router]);

  const handleAnalyze = (code: string, exampleId: number) => {
    void runAnalysis(code, exampleId);
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      {/* Loader de análisis */}
      {analyzingExampleId !== null && (
        <AnalysisLoader
          progress={analysisProgress}
          message={analysisMessage}
          algorithmType={algorithmType}
          isComplete={isAnalysisComplete}
          error={analysisError}
          onClose={() => {
            setAnalyzingExampleId(null);
            setAnalysisProgress(0);
            setAnalysisMessage("Iniciando análisis...");
            setAlgorithmType(undefined);
            setIsAnalysisComplete(false);
            setAnalysisError(null);
          }}
        />
      )}

      <main className="flex-1 z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
          <header className="space-y-2 text-center lg:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              Ejemplos de Algoritmos
            </h1>
            <p className="text-dark-text text-xs sm:text-sm lg:text-base leading-relaxed max-w-4xl mx-auto lg:mx-0">
              Colección de algoritmos clásicos organizados por métodos de análisis. Los ejemplos están agrupados por: algoritmos básicos (unknown), iterativos, y recursivos clasificados según el método utilizado (iteración, teorema maestro, o árbol de recursión).
            </p>
          </header>

          {/* Índice de Contenido */}
          <div className="glass-card p-4 rounded-lg">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">list</span>
              Índice de Contenido
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(["simple", "iterative", "recursive_iteration", "recursive_master", "recursive_tree", "recursive_characteristic"] as ExampleCategory[]).map((category) => {
                const categoryExamples = examples.filter((ex) => ex.category === category);
                if (categoryExamples.length === 0) return null;

                const categoryLabels: Record<ExampleCategory, { label: string; color: string }> = {
                  simple: {
                    label: "Algoritmos Unknown/Básicos",
                    color: "bg-gray-500/20 border-gray-500/30 text-gray-300",
                  },
                  iterative: {
                    label: "Iterativos",
                    color: "bg-blue-500/20 border-blue-500/30 text-blue-300",
                  },
                  recursive_iteration: {
                    label: "Recursivos (Método Iterativo)",
                    color: "bg-purple-500/20 border-purple-500/30 text-purple-300",
                  },
                  recursive_master: {
                    label: "Recursivos (Teorema Maestro)",
                    color: "bg-orange-500/20 border-orange-500/30 text-orange-300",
                  },
                  recursive_tree: {
                    label: "Recursivos (Árbol de Recursión)",
                    color: "bg-cyan-500/20 border-cyan-500/30 text-cyan-300",
                  },
                  recursive_characteristic: {
                    label: "Recursivos (Ecuación Característica)",
                    color: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300",
                  },
                };

                const catInfo = categoryLabels[category];

                return (
                  <a
                    key={category}
                    href={`#category-${category}`}
                    className={`p-3 rounded border ${catInfo.color} hover:opacity-80 transition-opacity text-xs font-medium`}
                  >
                    <div className="font-semibold mb-1">{catInfo.label}</div>
                    <div className="text-xs opacity-75">{categoryExamples.length} ejemplo{categoryExamples.length !== 1 ? 's' : ''}</div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Categorías */}
          {(["simple", "iterative", "recursive_iteration", "recursive_master", "recursive_tree", "recursive_characteristic"] as ExampleCategory[]).map((category) => {
            const categoryExamples = examples.filter((ex) => ex.category === category);
            if (categoryExamples.length === 0) return null;

            const categoryLabels: Record<ExampleCategory, { label: string; description: string; color: string }> = {
              simple: {
                label: "Algoritmos Unknown/Básicos",
                description: "Algoritmos básicos sin bucles complejos. Se clasificarán como 'unknown' en el análisis.",
                color: "bg-gray-500/20 border-gray-500/30 text-gray-300",
              },
              iterative: {
                label: "Iterativos",
                description: "Algoritmos con bucles FOR/WHILE. Totalmente soportados por el analizador iterativo.",
                color: "bg-blue-500/20 border-blue-500/30 text-blue-300",
              },
              recursive_iteration: {
                label: "Recursivos/Híbridos (Método Iterativo)",
                description: "Algoritmos recursivos analizados con el método de iteración (unrolling). Se usan cuando la recurrencia no cumple las condiciones del Teorema Maestro, Árbol de Recursión ni Ecuación Característica.",
                color: "bg-purple-500/20 border-purple-500/30 text-purple-300",
              },
              recursive_master: {
                label: "Recursivos/Híbridos (Teorema Maestro)",
                description: "Algoritmos recursivos analizados con el Teorema Maestro. Se usan cuando la recurrencia tiene la forma T(n) = aT(n/b) + f(n) con a < 2 o no cumple las condiciones del Árbol de Recursión ni Ecuación Característica.",
                color: "bg-orange-500/20 border-orange-500/30 text-orange-300",
              },
              recursive_tree: {
                label: "Recursivos/Híbridos (Árbol de Recursión)",
                description: "Algoritmos recursivos analizados con el método de Árbol de Recursión. Se usan cuando a ≥ 2, divide uniformemente y es divide-and-conquer. Incluye visualización del árbol y tabla por niveles.",
                color: "bg-cyan-500/20 border-cyan-500/30 text-cyan-300",
              },
              recursive_characteristic: {
                label: "Recursivos/Híbridos (Ecuación Característica)",
                description: "Algoritmos recursivos analizados con el método de Ecuación Característica. Se usan cuando la recurrencia es lineal con desplazamientos constantes T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n). Tiene PRIORIDAD sobre el método de iteración. Detecta automáticamente casos de Programación Dinámica lineal y genera versión DP.",
                color: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300",
              },
            };

            const catInfo = categoryLabels[category];

            return (
              <div key={category} id={`category-${category}`} className="space-y-3 scroll-mt-20">
                <div className="glass-card p-3">
                  <h2 className="text-base font-bold text-white mb-1">{catInfo.label}</h2>
                  <p className="text-xs text-dark-text">{catInfo.description}</p>
                </div>

                {/* Grid de ejemplos de esta categoría */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryExamples.map((example) => (
                    <div
                      key={example.id}
                      className="glass-card p-4 flex flex-col space-y-2 hover:scale-[1.02] transition-transform"
                    >
                      {/* Header del ejemplo */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white mb-1 truncate">{example.name}</h3>
                          <p className="text-[10px] text-slate-400 font-mono break-words">{example.complexity}</p>
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-dark-text text-xs leading-relaxed line-clamp-3">{example.description}</p>

                      {/* Badges para ecuación característica */}
                      {example.category === "recursive_characteristic" && (
                        <div className="flex flex-wrap gap-2">
                          {example.isHomogeneous !== undefined && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              example.isHomogeneous
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            }`}>
                              <span className="material-symbols-outlined text-xs mr-1">functions</span>
                              {example.isHomogeneous ? 'Homogénea' : 'No Homogénea'}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-green-500/20 text-green-300 border-green-500/30">
                            <span className="material-symbols-outlined text-xs mr-1">memory</span>
                            DP Lineal
                          </span>
                        </div>
                      )}

                      {example.note && (
                        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-300">
                          <strong>Nota:</strong> {example.note}
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="flex flex-col gap-2 pt-1">
                          <button
                            onClick={() => setViewingCodeId(viewingCodeId === example.id ? null : example.id)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-medium transition-colors border border-white/10 hover:bg-white/5 hover:border-white/20 text-slate-300"
                            disabled={analyzingExampleId !== null}
                          >
                          <span className="material-symbols-outlined text-sm">
                            {viewingCodeId === example.id ? 'visibility_off' : 'visibility'}
                          </span>
                          {viewingCodeId === example.id ? 'Ocultar Código' : 'Ver Código'}
                        </button>
                        
                        {viewingCodeId === example.id && (
                          <div className="bg-slate-900/50 border border-white/10 rounded p-2 overflow-x-auto scrollbar-custom max-h-64">
                            <pre className="text-green-300 font-mono text-[10px] leading-relaxed whitespace-pre">
                              {example.code}
                            </pre>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleCopy(example.code, example.id)}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs font-medium transition-colors border border-white/10 hover:bg-white/5 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300"
                            title="Copiar código"
                            disabled={analyzingExampleId !== null}
                          >
                            {copiedId === example.id ? (
                              <>
                                <span className="material-symbols-outlined text-xs">check</span>
                                <span className="hidden sm:inline">Copiado</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-xs">content_copy</span>
                                <span className="hidden sm:inline">Copiar</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleAnalyze(example.code, example.id)}
                            disabled={analyzingExampleId !== null}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded text-white text-xs font-medium transition-colors bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {analyzingExampleId === example.id ? (
                              <>
                                <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                                <span className="hidden sm:inline">Analizando...</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-xs">functions</span>
                                <span className="hidden sm:inline">Analizar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Información adicional */}
          <div className="glass-card p-4">
            <h2 className="text-base font-bold text-white mb-3">Cómo usar estos ejemplos</h2>
            <div className="space-y-2 text-dark-text text-xs">
              <p>
                1. <strong className="text-white">Ver Código:</strong> Haz clic en el botón &quot;Ver Código&quot; para
                ver el código completo del algoritmo.
              </p>
              <p>
                2. <strong className="text-white">Copiar:</strong> Haz clic en el botón &quot;Copiar&quot; para copiar el código al portapapeles.
              </p>
              <p>
                3. <strong className="text-white">Analizar:</strong> Haz clic en el botón &quot;Analizar&quot; para
                analizar el algoritmo directamente desde esta página, o ve al{" "}
                <NavigationLink href="/analyzer" className="text-blue-400 hover:text-blue-300 underline">
                  analizador
                </NavigationLink>{" "}
                y pega el código en el editor.
              </p>
              <p>
                4. <strong className="text-white">Explorar:</strong> El sistema calculará
                automáticamente la complejidad temporal para best/worst/average case mostrando el análisis detallado.
              </p>
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-xs font-semibold mb-2">
                  💡 Nota sobre métodos de análisis:
                </p>
                <ul className="space-y-1 text-[11px] text-blue-200 list-disc list-inside">
                  <li><strong>Ecuación Característica:</strong> Para recurrencias lineales T(n) = c₁T(n-1) + c₂T(n-2) + ... + cₖT(n-k) + g(n). Tiene PRIORIDAD sobre iteración. Detecta DP lineal automáticamente y genera versión DP.</li>
                  <li><strong>Método de Iteración:</strong> Para recurrencias no uniformes como T(n) = T(n/2) + f(n) o T(n) = T(√n) + f(n) (solo si NO es lineal por desplazamientos constantes)</li>
                  <li><strong>Teorema Maestro:</strong> Para recurrencias T(n) = aT(n/b) + f(n) con a &lt; 2 o que no cumplen las condiciones del Árbol de Recursión ni Ecuación Característica</li>
                  <li><strong>Árbol de Recursión:</strong> Para recurrencias con a ≥ 2, divide uniformemente, divide-and-conquer. Incluye visualización del árbol y tabla detallada por niveles</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <footer className="text-xs sm:text-sm text-dark-text text-center border-t border-white/10 pt-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
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

