# Casos límite del árbol de recursión

Registro de algoritmos de referencia, patrones problemáticos y ejemplos para revisión en futuros sprints.

## Tabla de algoritmos de referencia

| Algoritmo | Recurrencia | Tipo esperado | Método preferido | Notas |
|-----------|-------------|---------------|------------------|-------|
| Merge Sort | T(n) = 2T(n/2) + n | divide_conquer | master, recursion_tree | Niveles: 2^i nodos, tamaño n/2^i. Θ(n log n) |
| Búsqueda binaria | T(n) = T(n/2) + Θ(1) | divide_conquer | master, recursion_tree | 1 nodo por nivel. Θ(log n) |
| Fibonacci | T(n) = T(n-1) + T(n-2) | linear_shift | characteristic_equation | Subproblemas superpuestos. Θ(φ^n) |
| Quicksort peor caso | T(n) = T(n-1) + n | linear_shift | recursion_tree | Pivot fijo en izq. 1 nodo por nivel. Θ(n²) |
| Generación subconjuntos | T(n) = T(n-1) + Θ(1) en FOR | linear_shift | recursion_tree | branching_subset. 2^i nodos por nivel. Θ(2^n) |
| Hanoi | T(n) = 2T(n-1) + 1 | linear_shift | iteration | No es branching_subset (no hay FOR) |

## Casos que requieren heurísticas

### object_field_access
- **Árbol binario** (izq/der): múltiples campos → divide_conquer
- **Lista enlazada** (siguiente): un solo campo → linear_shift (n-1)

### recursive_call_inside_for
- Recursión dentro de FOR (generación de subconjuntos) → linear_shift con branching_subset
- Override: puede forzar subtraction aunque subproblem_sizes sugieran divide_conquer

### Quicksort pivot fijo
- `_detect_quicksort_pivot_izq`: pivot siempre en izq → T(n)=T(n-1)+n
- Override explícito cuando preferred_method=recursion_tree

## Casos que fallaban o eran ambiguos (resueltos)

### Fibonacci con preferred_method=recursion_tree
- **Problema:** Caía en bloque divide-and-conquer con a=1, b=2 por defecto → árbol incorrecto.
- **Solución:** Rama explícita en `_apply_recursion_tree_method` para linear_shift con len(shifts) >= 2.
- **Solución adicional:** En `_extract_recurrence`, cuando method=recursion_tree y has_subtraction con múltiples coeficientes, preservar type=linear_shift en la recurrencia.

## Estructura de recursion_tree en la respuesta

```json
{
  "method": "recursion_tree",
  "recurrence_type": "divide_conquer" | "linear_shift",
  "levels": [...],
  "height": "...",
  "summation": {...},
  "dominating_level": {...},
  "theta": "..."
}
```

- `recurrence_type`: Indica al frontend qué visualización usar (árbol uniforme vs irregular).
- Para linear_shift (Fibonacci), el frontend genera el árbol desde recurrence.shifts y recurrence.coefficients.

## Referencias

- [docs/api/recursive-analysis.md](api/recursive-analysis.md): Proceso de análisis recursivo
- [apps/api/tests/contract/test_recursion_tree_structure.py](../apps/api/tests/contract/test_recursion_tree_structure.py): Tests de estructura del árbol
