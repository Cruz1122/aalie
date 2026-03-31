# Informe ejecutivo: catálogo vs motor de análisis

- Generado: 2026-03-31T00:09:51.248Z
- API: `http://localhost:8000`
- Comparaciones por caso: **300** evaluaciones (3 casos × 100 algoritmos).
- Errores de API/detect-methods: 0.

## Resumen por clase de discrepancia

- exact_match: 0
- symbolic_equivalent: 211
- notation_mismatch_only: 48
- expected_dataset_issue: 35
- engine_bug_likely: 6
- unsupported_or_inconclusive_expected: 0
- parameterization_mismatch: 0

## Top 10 bugs reales (engine_bug_likely)

| Algoritmo | Categoria | Casos engine_bug_likely |
| --- | --- | --- |
| Ordenamiento por conteo (`counting-sort`) | iterativos | 3 |
| Merge de dos arreglos ordenados (`merge-dos-arreglos-ordenados`) | iterativos | 3 |
| Binary Search iterativa (`binary-search-iterativa`) | iterativos | 0 |
| Ordenamiento burbuja (`bubble-sort`) | iterativos | 0 |
| Ordenamiento burbuja mejorado (`bubble-sort-mejorado`) | iterativos | 0 |
| Cocktail Shaker Sort (`cocktail-shaker-sort`) | iterativos | 0 |
| Comb Sort (`comb-sort`) | iterativos | 0 |
| Bandera nacional holandesa (`dutch-national-flag`) | iterativos | 0 |
| Euclides iterativo (MCD) (`euclides-iterativo-mcd`) | iterativos | 0 |
| Exchange Sort (`exchange-sort`) | iterativos | 0 |

## Top 10 mismatches de oráculo (expected_dataset_issue + unsupported_or_inconclusive_expected)

| Algoritmo | Categoria | Casos mismatch de oráculo |
| --- | --- | --- |
| Newton-Raphson iterativo (`newton-raphson-iterativo`) | iterativos | 3 |
| Ordenamiento Shell (`shell-sort`) | iterativos | 3 |
| Vacas de Narayana (`narayana-cows`) | resta-y-seras-vencido | 3 |
| Secuencia de Perrin (`perrin-sequence`) | resta-y-seras-vencido | 3 |
| Formas de escribir n con sumandos 1, 3 y 4 (`ways-write-n-with-1-3-4`) | resta-y-seras-vencido | 3 |
| Sucesion de Padovan (`padovan-sequence`) | resta-y-seras-vencido | 2 |
| Contar cadenas binarias sin unos consecutivos (`count-binary-strings-without-consecutive-ones`) | resta-y-seras-vencido | 1 |
| Cadenas binarias sin ceros consecutivos (`count-binary-strings-without-consecutive-zeros`) | resta-y-seras-vencido | 1 |
| Escaleras recursivas (`climbing-stairs`) | resta-y-seras-vencido | 1 |
| Contar formas de llegar a N (`count-ways-to-reach-n`) | resta-y-seras-vencido | 1 |
