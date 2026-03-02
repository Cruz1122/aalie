# Documento de Pruebas de Algoritmos - Validación de Eficiencia

**Fecha de ejecución:** 2026-02-17 19:13:45
**Tiempo total:** 8538.51 ms

## Resultados por algoritmo

| ID | Nombre | Tiempo (ms) | Estado | Esperado | Discrepancias |
|----|--------|-------------|--------|----------|---------------|
| 1 | Asignación Simple | 44.36 | OK | O(1) | - |
| 2 | Acceso a Array Simple | 4.08 | OK | O(1) | - |
| 3 | Búsqueda Lineal | 312.91 | OK | Best: O(1), Worst: O(n), Avg: O(n/2) | - |
| 4 | Búsqueda Binaria Iterativa | 526.38 | OK | Best: O(1), Worst: O(log n), Avg: O(log  | - |
| 5 | Factorial Iterativo | 95.04 | OK | O(n) | - |
| 6 | Suma de Array | 149.71 | OK | O(n) | - |
| 7 | Máximo de Array | 299.65 | OK | Best: O(n), Worst: O(n), Avg: O(n) | - |
| 8 | MCD - Euclides | 602.61 | OK | O(log min(a, b)) | - |
| 9 | Bubble Sort | 2437.16 | OK | O(n²) | - |
| 10 | Insertion Sort | 1187.83 | OK | Best: O(n), Worst: O(n²), Avg: O(n²) | - |
| 11 | Selection Sort | 2081.73 | OK | O(n²) | - |
| 12 | Fibonacci Recursivo | 137.44 | OK | O(φⁿ) donde φ = (1+√5)/2 ≈ 1.618 | - |
| 13 | Torres de Hanoi | 17.67 | OK | Best: O(1), Worst: O(2ⁿ), Avg: O(2ⁿ) | - |
| 14 | Factorial Recursivo | 1.95 | OK | Best: O(1), Worst: O(n), Avg: O(n) | - |
| 15 | Búsqueda Binaria Recursiva | 9.1 | OK | Best: O(1), Worst: O(log n), Avg: O(log  | - |
| 16 | MergeSort | 22.5 | OK | O(n log n) | - |
| 17 | Algoritmo Divide Desigual | 7.5 | OK | O(n) | - |
| 18 | Algoritmo Cuaternario | 10.01 | OK | O(n) | - |
| 19 | QuickSort | 15.98 | DISCREPANCIA | Best: O(n log n), Worst: O(n²), Avg: O(n | worst: API='\\Theta(n \\log n)' vs esperado='O(n²) |
| 20 | N-Step Stairs | 80.99 | OK | Best: O(1), Worst: O(φⁿ), Avg: O(φⁿ) don | - |
| 21 | Formas de Decodificar | 81.74 | OK | Best: O(1), Worst: O(φⁿ), Avg: O(φⁿ) don | - |
| 22 | Tiling 2xN | 75.22 | OK | O(φⁿ) donde φ = (1+√5)/2 ≈ 1.618 | - |
| 23 | Tribonacci | 164.9 | OK | Best: O(1), Worst: O(rⁿ), Avg: O(rⁿ) don | - |
| 24 | Pell Numbers | 71.96 | OK | O((1+√2)ⁿ) | - |
| 25 | QuickSort Caso Promedio | 27.01 | DISCREPANCIA | Best: O(n log n), Worst: O(n²), Avg: O(n | best: API='\\Theta(n)' vs esperado='O(n log n)'; w |
| 26 | Búsqueda BST | 5.57 | OK | Best: O(1), Worst: O(log n), Avg: O(log  | - |
| 27 | Exponentiación Rápida | 5.11 | OK | Best: O(1), Worst: O(log n), Avg: O(log  | - |
| 28 | Suma Array Recursiva | 1.93 | OK | Best: O(1), Worst: O(n), Avg: O(n) | - |
| 29 | Búsqueda Lista Enlazada | 2.52 | OK | Best: O(1), Worst: O(n), Avg: O(n) | - |
| 30 | Invertir Array Recursivo | 4.33 | OK | O(n) | - |

## Resumen

- **OK:** 28
- **Discrepancias:** 2 (revisar: ¿bug analizador o actualizar página?)
- **Errores:** 0

---

Clasificación de discrepancias:
- **Tipo A (bug):** El analizador devuelve eficiencia incorrecta → corregir backend
- **Tipo B (actualizar página):** El analizador correcto, valor teórico en página no coincide → actualizar complexity en examples/page.tsx