# Oráculos de Detección de Técnicas

## Propósito

Estos tests son oráculos semánticos para el detector estructural.

Previenen regresiones donde el detector:

- empieza a depender de nombres sin justificación,
- confunde recursión mutuamente excluyente con ramificación,
- sobreclasifica PD, greedy o divide and conquer,
- o pierde invarianza por renombre.

**Nota**: La detección greedy es una excepción a la regla "sin nombres" — los algoritmos greedy iterativos son estructuralmente idénticos a código iterativo genérico, por lo que se usan señales semánticas basadas en identificadores (`sortByFinishTime`, `prim`, `dijkstra`, etc.) como desempate.

## Conjunto Actual de Oráculos (35 tests)

### Divide and Conquer
- Búsqueda Binaria Recursiva (con ELSE) → `divide_and_conquer`
- Búsqueda Ternaria Recursiva (con ELSE) → `divide_and_conquer`
- Split k-way genérico → `divide_and_conquer`
- QuickSort (partición inline, pivote aleatorio, mediana-de-3, 3-way) → `divide_and_conquer`
- MergeSort → `divide_and_conquer`
- Max Subarray DC → `divide_and_conquer`

### Decrease and Conquer / Decrease and Get Conquered
- Fibonacci → `decrease_and_get_conquered`
- Torres de Hanoi → `decrease_and_get_conquered`
- Climbing Stairs → `decrease_and_get_conquered`
- Potencia Rápida → `decrease_and_conquer`
- Factorial → `decrease_and_conquer`
- Euclides MCD → `decrease_and_conquer`
- Conteo Regresivo → `decrease_and_conquer`

### Iterativo
- Bubble, Gnome, Cocktail Shaker, Selection, Insertion, Comb, Shell Sort → `iterative`
- Búsqueda Lineal Centinela, Kadane, Criba → `iterative`
- Prefix Sum no debe clasificarse como `dp_bottom_up`
- Counting Sort no debe clasificarse como `dp_bottom_up`
- Dutch Flag no debe clasificarse como `greedy`

### PD (Programación Dinámica)
- Fibonacci PD Bottom-up → `dp_bottom_up`
- Fibonacci con Memoización → `dp_top_down`

### Greedy
- Activity Selection → `greedy`
- Fractional Knapsack → `greedy`
- Huffman Coding → `greedy`
- Kruskal → `greedy`
- Prim → `greedy`
- Dijkstra → `greedy`

### Backtracking
- N-Queens → `backtracking`

### Tests de regresión
- QuickSort no es `backtracking`
- Fibonacci memoizado no es `backtracking`
- Búsqueda binaria recursiva no es `branch_and_bound`
- N-Queens no es `branch_and_bound`
- Invarianza por renombre en Divide and Conquer

## Intención de Aceptación

La suite de oráculos valida semántica estructural, no solo seguridad en tiempo de ejecución.

Aprobar significa que el detector sigue alineado con la interpretación pedagógica intencionada del AST.
