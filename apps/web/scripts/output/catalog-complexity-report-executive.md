# Informe ejecutivo: catálogo vs motor de análisis

- Generado: 2026-03-31T01:37:21.415Z
- API: `http://localhost:8000`
- Comparaciones por caso: **300** evaluaciones (3 casos × 100 algoritmos).
- Errores de API/detect-methods: 0.

## Resumen por clase de discrepancia

- exact_match: 0
- symbolic_equivalent: 217
- notation_mismatch_only: 27
- expected_dataset_issue: 22
- engine_bug_likely: 0
- unsupported_or_inconclusive_expected: 0
- parameterization_mismatch: 0
- policy_best_mismatch: 21
- size_parameter_mismatch: 0
- model_dependent_expected: 7
- engine_approximation_gap: 6

## Top 10 bugs reales (engine_bug_likely + policy_best_mismatch)

| Algoritmo | Categoria | Casos engine_bug_likely+policy_best_mismatch |
| --- | --- | --- |
| Euclides iterativo (MCD) (`euclides-iterativo-mcd`) | iterativos | 1 |
| Factorial iterativo (`factorial-iterativo`) | iterativos | 1 |
| Binary Search recursiva (`binary-search-recursiva`) | resta-y-venceras | 1 |
| Binary Search primera ocurrencia (`binary-search-first-occurrence`) | resta-y-venceras | 1 |
| Binary Search ultima ocurrencia (`binary-search-last-occurrence`) | resta-y-venceras | 1 |
| Conteo recursivo regresivo (`conteo-recursivo-regresivo`) | resta-y-venceras | 1 |
| Conteo recursivo de digitos (`conteo-recursivo-digitos`) | resta-y-venceras | 1 |
| Euclides recursivo (`euclides-recursivo`) | resta-y-venceras | 1 |
| Exponenciacion rapida (`exponenciacion-rapida`) | resta-y-venceras | 1 |
| Factorial recursivo (`factorial-recursivo`) | resta-y-venceras | 1 |

## Top 10 mismatches de oráculo (expected_dataset_issue + unsupported_or_inconclusive_expected)

| Algoritmo | Categoria | Casos mismatch de oráculo |
| --- | --- | --- |
| Newton-Raphson iterativo (`newton-raphson-iterativo`) | iterativos | 1 |
| Contar cadenas binarias sin unos consecutivos (`count-binary-strings-without-consecutive-ones`) | resta-y-seras-vencido | 1 |
| Cadenas binarias sin ceros consecutivos (`count-binary-strings-without-consecutive-zeros`) | resta-y-seras-vencido | 1 |
| Escaleras recursivas (`climbing-stairs`) | resta-y-seras-vencido | 1 |
| Contar formas de llegar a N (`count-ways-to-reach-n`) | resta-y-seras-vencido | 1 |
| Cubrir distancia con pasos 1, 2 y 3 (`cover-distance-1-2-3`) | resta-y-seras-vencido | 1 |
| Fibonacci recursivo (`fibonacci-recursivo`) | resta-y-seras-vencido | 1 |
| Colocacion de casas en fila (1D) (`house-placements-1d`) | resta-y-seras-vencido | 1 |
| Escaleras de K pasos (`k-step-stairs`) | resta-y-seras-vencido | 1 |
| Numeros de Lucas (`lucas-numbers`) | resta-y-seras-vencido | 1 |
