# Informe: catálogo vs motor de análisis

- Generado: 2026-03-31T09:16:08.849Z
- API: `http://localhost:8000`
- Comparaciones por caso: **300** evaluaciones en total (3 casos × 100 algoritmos).
- Errores de API / detect-methods: 0.

## Resumen por clase de discrepancia

- exact_match: 0
- symbolic_equivalent: 234
- notation_mismatch_only: 23
- expected_dataset_issue: 24
- engine_bug_likely: 0
- unsupported_or_inconclusive_expected: 0
- parameterization_mismatch: 0
- policy_best_mismatch: 2
- size_parameter_mismatch: 0
- model_dependent_expected: 7
- engine_approximation_gap: 10

## Política de comparación

1. **Contenido asintótico**: se extrae el interior de `O(·)`, `\Theta(·)` o `\Omega(·)` y se normaliza (espacios, `\log`, potencias `^{}`, `\sqrt{n}`, `\varphi`, etc.). Equivale a tratar `O(n^2)` y `\Theta(n^2)` como alineados cuando el interior coincide.
2. **Literal**: misma cadena completa normalizada; si la tabla espera `O(...)` y el motor devuelve `\Theta(...)`, cuenta como fallo literal aunque el interior coincida.
3. Bases exponenciales distintas (`\varphi^n` vs `2^n`) **no** se unifican en contenido: siguen siendo discrepancia.

## iterativos

| Algoritmo (catálogo)            | Caso  | Esperado        | Obtenido (big_Θ / big_O / …)                                                                                                        | Clase                    | Contenido | Literal |
| ------------------------------- | ----- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------- | ------- |
| Binary Search iterativa         | best  | O(1)            | \Theta(1)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Binary Search iterativa         | avg   | O(\log n)       | \Theta(\log(n))                                                                                                                     | symbolic_equivalent      | sí        | no      |
| Binary Search iterativa         | worst | O(\log n)       | \Theta(\log(n))                                                                                                                     | symbolic_equivalent      | sí        | no      |
| Ordenamiento burbuja            | best  | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento burbuja            | avg   | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento burbuja            | worst | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento burbuja mejorado   | best  | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Ordenamiento burbuja mejorado   | avg   | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento burbuja mejorado   | worst | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Cocktail Shaker Sort            | best  | O(n)            | \Theta(n^{2})                                                                                                                       | notation_mismatch_only   | no        | no      |
| Cocktail Shaker Sort            | avg   | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Cocktail Shaker Sort            | worst | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Comb Sort                       | best  | O(n \log n)     | \Theta(\log(n))                                                                                                                     | notation_mismatch_only   | no        | no      |
| Comb Sort                       | avg   | O(n^2)          | \Theta(n)                                                                                                                           | notation_mismatch_only   | no        | no      |
| Comb Sort                       | worst | O(n^2)          | \Theta(n)                                                                                                                           | notation_mismatch_only   | no        | no      |
| Ordenamiento por conteo         | best  | O(n + k)        | \Theta(k + n)                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento por conteo         | avg   | O(n + k)        | \Theta(k + n)                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento por conteo         | worst | O(n + k)        | \Theta(k + n)                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Bandera nacional holandesa      | best  | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Bandera nacional holandesa      | avg   | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Bandera nacional holandesa      | worst | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Euclides iterativo (MCD)        | best  | O(1)            | \Theta(1)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Euclides iterativo (MCD)        | avg   | O(\log n)       | \Theta(\log(\min(a,b)))                                                                                                             | notation_mismatch_only   | no        | no      |
| Euclides iterativo (MCD)        | worst | O(\log n)       | \Theta(\log(\min(a,b)))                                                                                                             | notation_mismatch_only   | no        | no      |
| Exchange Sort                   | best  | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Exchange Sort                   | avg   | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Exchange Sort                   | worst | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Factorial iterativo             | best  | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Factorial iterativo             | avg   | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Factorial iterativo             | worst | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Gnome Sort                      | best  | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Gnome Sort                      | avg   | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Gnome Sort                      | worst | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento por insercion      | best  | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Ordenamiento por insercion      | avg   | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento por insercion      | worst | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Busqueda por saltos             | best  | O(1)            | \Theta(1)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Busqueda por saltos             | avg   | O(\sqrt{n})     | \Theta(n)                                                                                                                           | notation_mismatch_only   | no        | no      |
| Busqueda por saltos             | worst | O(\sqrt{n})     | \Theta(fin + inicio)                                                                                                                | notation_mismatch_only   | no        | no      |
| Kadane                          | best  | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Kadane                          | avg   | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Kadane                          | worst | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Busqueda lineal                 | best  | O(1)            | \Theta(1)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Busqueda lineal                 | avg   | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Busqueda lineal                 | worst | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Maximum Subarray cuadratico     | best  | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Maximum Subarray cuadratico     | avg   | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Maximum Subarray cuadratico     | worst | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Merge de dos arreglos ordenados | best  | O(1)            | \Theta(1)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Merge de dos arreglos ordenados | avg   | O(n + m)        | \Theta(m + n)                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Merge de dos arreglos ordenados | worst | O(n + m)        | \Theta(m + n)                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Newton-Raphson iterativo        | best  | O(1)            | \Theta(iteraciones)                                                                                                                 | expected_dataset_issue   | no        | no      |
| Newton-Raphson iterativo        | avg   | O(t)            | \Theta(iteraciones)                                                                                                                 | model_dependent_expected | no        | no      |
| Newton-Raphson iterativo        | worst | O(t)            | \Theta(iteraciones)                                                                                                                 | model_dependent_expected | no        | no      |
| Suma prefija                    | best  | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Suma prefija                    | avg   | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Suma prefija                    | worst | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Ordenamiento por seleccion      | best  | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento por seleccion      | avg   | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Ordenamiento por seleccion      | worst | O(n^2)          | \Theta(n^{2})                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Sentinel Linear Search          | best  | O(1)            | \Theta(1)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Sentinel Linear Search          | avg   | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Sentinel Linear Search          | worst | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Ordenamiento Shell              | best  | O(n \log n)     | \Theta(\log(n))                                                                                                                     | model_dependent_expected | no        | no      |
| Ordenamiento Shell              | avg   | O(n^{1.5})      | \Theta(\frac{gap^{2} \\log{\left(n \right)}}{\\log{\left(2 \right)}} + \frac{n^{2} \\log{\left(n \right)}}{\\log{\left(2 \right)}}) | model_dependent_expected | no        | no      |
| Ordenamiento Shell              | worst | O(n^2)          | \Theta(\frac{gap^{2} \\log{\left(n \right)}}{\\log{\left(2 \right)}} + \frac{n^{2} \\log{\left(n \right)}}{\\log{\left(2 \right)}}) | model_dependent_expected | no        | no      |
| Criba de Eratostenes            | best  | O(n \log\log n) | \Theta(n)                                                                                                                           | notation_mismatch_only   | no        | no      |
| Criba de Eratostenes            | avg   | O(n \log\log n) | \Theta(n^{2})                                                                                                                       | notation_mismatch_only   | no        | no      |
| Criba de Eratostenes            | worst | O(n \log\log n) | \Theta(n^{2})                                                                                                                       | notation_mismatch_only   | no        | no      |
| Suma de arreglo                 | best  | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Suma de arreglo                 | avg   | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Suma de arreglo                 | worst | O(n)            | \Theta(n)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Busqueda ternaria iterativa     | best  | O(1)            | \Theta(1)                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Busqueda ternaria iterativa     | avg   | O(\log n)       | \Theta(\log(n))                                                                                                                     | symbolic_equivalent      | sí        | no      |
| Busqueda ternaria iterativa     | worst | O(\log n)       | \Theta(\log(n))                                                                                                                     | symbolic_equivalent      | sí        | no      |

## divide y venceras

| Algoritmo (catálogo)                           | Caso  | Esperado        | Obtenido (big_Θ / big_O / …)                                    | Clase                  | Contenido | Literal |
| ---------------------------------------------- | ----- | --------------- | --------------------------------------------------------------- | ---------------------- | --------- | ------- |
| Bitonic Sort                                   | best  | O(n \log^2 n)   | \Theta(n \log n)                                                | notation_mismatch_only | no        | no      |
| Bitonic Sort                                   | avg   | O(n \log^2 n)   | \Theta(n \log n)                                                | notation_mismatch_only | no        | no      |
| Bitonic Sort                                   | worst | O(n \log^2 n)   | \Theta(n \log n)                                                | notation_mismatch_only | no        | no      |
| Conteo de inversiones                          | best  | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Conteo de inversiones                          | avg   | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Conteo de inversiones                          | worst | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Conteo de ocurrencias por mitades              | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Conteo de ocurrencias por mitades              | avg   | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Conteo de ocurrencias por mitades              | worst | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Multiplicación de Karatsuba                    | best  | O(n^{\log_2 3}) | \Theta(n^{\frac{\log{\left(3 \right)}}{\log{\left(2 \right)}}}) | symbolic_equivalent    | no        | no      |
| Multiplicación de Karatsuba                    | avg   | O(n^{\log_2 3}) | \Theta(n^{\frac{\log{\left(3 \right)}}{\log{\left(2 \right)}}}) | symbolic_equivalent    | no        | no      |
| Multiplicación de Karatsuba                    | worst | O(n^{\log_2 3}) | \Theta(n^{\frac{\log{\left(3 \right)}}{\log{\left(2 \right)}}}) | symbolic_equivalent    | no        | no      |
| Elemento mayoritario divide y vencerás         | best  | O(n \log n)     | \Theta(n)                                                       | notation_mismatch_only | no        | no      |
| Elemento mayoritario divide y vencerás         | avg   | O(n \log n)     | \Theta(n)                                                       | notation_mismatch_only | no        | no      |
| Elemento mayoritario divide y vencerás         | worst | O(n \log n)     | \Theta(n)                                                       | notation_mismatch_only | no        | no      |
| Max-Min Tournament                             | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Max-Min Tournament                             | avg   | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Max-Min Tournament                             | worst | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Maximum Subarray divide y vencerás             | best  | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Maximum Subarray divide y vencerás             | avg   | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Maximum Subarray divide y vencerás             | worst | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Merge K arreglos ordenados                     | best  | O(N \log k)     | \Theta(n \log n)                                                | notation_mismatch_only | no        | no      |
| Merge K arreglos ordenados                     | avg   | O(N \log k)     | \Theta(n \log n)                                                | notation_mismatch_only | no        | no      |
| Merge K arreglos ordenados                     | worst | O(N \log k)     | \Theta(n \log n)                                                | notation_mismatch_only | no        | no      |
| Ordenamiento por mezcla                        | best  | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento por mezcla                        | avg   | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento por mezcla                        | worst | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Merge Sort 3-way                               | best  | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Merge Sort 3-way                               | avg   | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Merge Sort 3-way                               | worst | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Multiplicación de polinomios divide y vencerás | best  | O(n^2)          | \Theta(n^{2})                                                   | symbolic_equivalent    | sí        | no      |
| Multiplicación de polinomios divide y vencerás | avg   | O(n^2)          | \Theta(n^{2})                                                   | symbolic_equivalent    | sí        | no      |
| Multiplicación de polinomios divide y vencerás | worst | O(n^2)          | \Theta(n^{2})                                                   | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido                            | best  | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido                            | avg   | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido                            | worst | O(n^2)          | \Theta(n^2)                                                     | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido aleatorizado               | best  | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido aleatorizado               | avg   | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido aleatorizado               | worst | O(n^2)          | \Theta(n^2)                                                     | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido con mediana de tres        | best  | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido con mediana de tres        | avg   | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido con mediana de tres        | worst | O(n^2)          | \Theta(n \log n)                                                | notation_mismatch_only | no        | no      |
| Ordenamiento rapido 3-way partition            | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido 3-way partition            | avg   | O(n \log n)     | \Theta(n)                                                       | notation_mismatch_only | no        | no      |
| Ordenamiento rapido 3-way partition            | worst | O(n^2)          | \Theta(n^2)                                                     | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido con pivote central         | best  | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido con pivote central         | avg   | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Ordenamiento rapido con pivote central         | worst | O(n^2)          | \Theta(n^2)                                                     | symbolic_equivalent    | sí        | no      |
| Producto de arreglo por mitades                | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Producto de arreglo por mitades                | avg   | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Producto de arreglo por mitades                | worst | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Suma de arreglo por mitades                    | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Suma de arreglo por mitades                    | avg   | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Suma de arreglo por mitades                    | worst | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Construcción de árbol de torneo                | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Construcción de árbol de torneo                | avg   | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Construcción de árbol de torneo                | worst | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Tournament winner and runner-up                | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Tournament winner and runner-up                | avg   | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Tournament winner and runner-up                | worst | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Búsqueda de máximo por mitades                 | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Búsqueda de máximo por mitades                 | avg   | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Búsqueda de máximo por mitades                 | worst | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Búsqueda de mínimo por mitades                 | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Búsqueda de mínimo por mitades                 | avg   | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Búsqueda de mínimo por mitades                 | worst | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Merge de intervalos por divide y vencerás      | best  | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Merge de intervalos por divide y vencerás      | avg   | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Merge de intervalos por divide y vencerás      | worst | O(n \log n)     | \Theta(n \log n)                                                | symbolic_equivalent    | sí        | no      |
| Binary reduction sum divide y vencerás         | best  | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Binary reduction sum divide y vencerás         | avg   | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Binary reduction sum divide y vencerás         | worst | O(n)            | \Theta(n)                                                       | symbolic_equivalent    | sí        | no      |
| Z-order recursive matrix traversal             | best  | O(n^2)          | \Theta(n^{2})                                                   | symbolic_equivalent    | sí        | no      |
| Z-order recursive matrix traversal             | avg   | O(n^2)          | \Theta(n^{2})                                                   | symbolic_equivalent    | sí        | no      |
| Z-order recursive matrix traversal             | worst | O(n^2)          | \Theta(n^{2})                                                   | symbolic_equivalent    | sí        | no      |

## resta y venceras

| Algoritmo (catálogo)                  | Caso  | Esperado  | Obtenido (big_Θ / big_O / …) | Clase                  | Contenido | Literal |
| ------------------------------------- | ----- | --------- | ---------------------------- | ---------------------- | --------- | ------- |
| Binary Search recursiva               | best  | O(1)      | \Theta(1)                    | symbolic_equivalent    | sí        | no      |
| Binary Search recursiva               | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Binary Search recursiva               | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Binary Search primera ocurrencia      | best  | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Binary Search primera ocurrencia      | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Binary Search primera ocurrencia      | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Binary Search ultima ocurrencia       | best  | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Binary Search ultima ocurrencia       | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Binary Search ultima ocurrencia       | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Conteo recursivo regresivo            | best  | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Conteo recursivo regresivo            | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Conteo recursivo regresivo            | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Conteo recursivo de digitos           | best  | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Conteo recursivo de digitos           | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Conteo recursivo de digitos           | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Euclides recursivo                    | best  | O(1)      | \Theta(\log n)               | policy_best_mismatch   | no        | no      |
| Euclides recursivo                    | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Euclides recursivo                    | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Exponenciacion rapida                 | best  | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Exponenciacion rapida                 | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Exponenciacion rapida                 | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Factorial recursivo                   | best  | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Factorial recursivo                   | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Factorial recursivo                   | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Find Maximum recursivo                | best  | O(1)      | \Theta(1)                    | symbolic_equivalent    | sí        | no      |
| Find Maximum recursivo                | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Find Maximum recursivo                | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Find Minimum recursivo                | best  | O(1)      | \Theta(1)                    | symbolic_equivalent    | sí        | no      |
| Find Minimum recursivo                | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Find Minimum recursivo                | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Insertion Sort recursivo              | best  | O(n)      | \Theta(n^{2})                | notation_mismatch_only | no        | no      |
| Insertion Sort recursivo              | avg   | O(n^2)    | \Theta(n^{2})                | symbolic_equivalent    | sí        | no      |
| Insertion Sort recursivo              | worst | O(n^2)    | \Theta(n^{2})                | symbolic_equivalent    | sí        | no      |
| Josephus recursivo                    | best  | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Josephus recursivo                    | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Josephus recursivo                    | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| K-esimo simbolo en gramatica          | best  | O(1)      | \Theta(1)                    | symbolic_equivalent    | sí        | no      |
| K-esimo simbolo en gramatica          | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| K-esimo simbolo en gramatica          | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Linear Search recursiva               | best  | O(1)      | \Theta(1)                    | symbolic_equivalent    | sí        | no      |
| Linear Search recursiva               | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Linear Search recursiva               | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Max en arreglo divide-by-one          | best  | O(1)      | \Theta(1)                    | symbolic_equivalent    | sí        | no      |
| Max en arreglo divide-by-one          | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Max en arreglo divide-by-one          | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Numeros binarios por division entre 2 | best  | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Numeros binarios por division entre 2 | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Numeros binarios por division entre 2 | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Palindrome Check recursivo            | best  | O(1)      | \Theta(1)                    | symbolic_equivalent    | sí        | no      |
| Palindrome Check recursivo            | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Palindrome Check recursivo            | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Potencia modular rapida               | best  | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Potencia modular rapida               | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Potencia modular rapida               | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Potencia recursiva naive              | best  | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Potencia recursiva naive              | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Potencia recursiva naive              | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Ordenamiento por seleccion recursivo  | best  | O(n^2)    | \Theta(n^{2})                | symbolic_equivalent    | sí        | no      |
| Ordenamiento por seleccion recursivo  | avg   | O(n^2)    | \Theta(n^{2})                | symbolic_equivalent    | sí        | no      |
| Ordenamiento por seleccion recursivo  | worst | O(n^2)    | \Theta(n^{2})                | symbolic_equivalent    | sí        | no      |
| Suma recursiva de digitos             | best  | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Suma recursiva de digitos             | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Suma recursiva de digitos             | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Inversion recursiva de cadena         | best  | O(1)      | \Theta(1)                    | symbolic_equivalent    | sí        | no      |
| Inversion recursiva de cadena         | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Inversion recursiva de cadena         | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Suma de 1..n recursiva                | best  | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Suma de 1..n recursiva                | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Suma de 1..n recursiva                | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Suma de arreglo recursiva             | best  | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Suma de arreglo recursiva             | avg   | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Suma de arreglo recursiva             | worst | O(n)      | \Theta(n)                    | symbolic_equivalent    | sí        | no      |
| Ternary Search recursiva              | best  | O(1)      | \Theta(1)                    | symbolic_equivalent    | sí        | no      |
| Ternary Search recursiva              | avg   | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |
| Ternary Search recursiva              | worst | O(\log n) | \Theta(\log n)               | symbolic_equivalent    | sí        | no      |

## resta y seras vencido

| Algoritmo (catálogo)                          | Caso  | Esperado          | Obtenido (big_Θ / big_O / …)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Clase                    | Contenido | Literal |
| --------------------------------------------- | ----- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------- | ------- |
| Contar cadenas binarias sin unos consecutivos | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Contar cadenas binarias sin unos consecutivos | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Contar cadenas binarias sin unos consecutivos | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Cadenas binarias sin ceros consecutivos       | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Cadenas binarias sin ceros consecutivos       | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Cadenas binarias sin ceros consecutivos       | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Escaleras recursivas                          | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Escaleras recursivas                          | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Escaleras recursivas                          | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Contar formas de llegar a N                   | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Contar formas de llegar a N                   | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Contar formas de llegar a N                   | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Cubrir distancia con pasos 1, 2 y 3           | best  | O(1)              | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | expected_dataset_issue   | no        | no      |
| Cubrir distancia con pasos 1, 2 y 3           | avg   | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Cubrir distancia con pasos 1, 2 y 3           | worst | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Fibonacci recursivo                           | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Fibonacci recursivo                           | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Fibonacci recursivo                           | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Colocacion de casas en fila (1D)              | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Colocacion de casas en fila (1D)              | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Colocacion de casas en fila (1D)              | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Sucesion de Jacobsthal                        | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Sucesion de Jacobsthal                        | avg   | O(2^n)            | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | engine_approximation_gap | no        | no      |
| Sucesion de Jacobsthal                        | worst | O(2^n)            | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | engine_approximation_gap | no        | no      |
| Escaleras de K pasos                          | best  | O(1)              | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | expected_dataset_issue   | no        | no      |
| Escaleras de K pasos                          | avg   | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Escaleras de K pasos                          | worst | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Numeros de Lucas                              | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Numeros de Lucas                              | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Numeros de Lucas                              | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Vacas de Narayana                             | best  | O(1)              | \Theta(\left(\frac{\sqrt[3]{2}}{3 \sqrt[3]{3 \sqrt{93} + 29}} + \frac{1}{3} + \frac{2^{\frac{2}{3}} \sqrt[3]{3 \sqrt{93} + 29}}{6}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                      | expected_dataset_issue   | no        | no      |
| Vacas de Narayana                             | avg   | O(1.4656^n)       | \Theta(\left(\frac{\sqrt[3]{2}}{3 \sqrt[3]{3 \sqrt{93} + 29}} + \frac{1}{3} + \frac{2^{\frac{2}{3}} \sqrt[3]{3 \sqrt{93} + 29}}{6}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                      | engine_approximation_gap | no        | no      |
| Vacas de Narayana                             | worst | O(1.4656^n)       | \Theta(\left(\frac{\sqrt[3]{2}}{3 \sqrt[3]{3 \sqrt{93} + 29}} + \frac{1}{3} + \frac{2^{\frac{2}{3}} \sqrt[3]{3 \sqrt{93} + 29}}{6}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                      | engine_approximation_gap | no        | no      |
| Sucesion de Padovan                           | best  | O(1)              | \Theta(1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | symbolic_equivalent      | sí        | no      |
| Sucesion de Padovan                           | avg   | O(1.3247^n)       | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                   | engine_approximation_gap | no        | no      |
| Sucesion de Padovan                           | worst | O(1.3247^n)       | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                   | engine_approximation_gap | no        | no      |
| Numeros de Pell                               | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Numeros de Pell                               | avg   | O((1+\sqrt{2})^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | engine_approximation_gap | no        | no      |
| Numeros de Pell                               | worst | O((1+\sqrt{2})^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | engine_approximation_gap | no        | no      |
| Secuencia de Perrin                           | best  | O(1)              | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                   | expected_dataset_issue   | no        | no      |
| Secuencia de Perrin                           | avg   | O(1.3247^n)       | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                   | engine_approximation_gap | no        | no      |
| Secuencia de Perrin                           | worst | O(1.3247^n)       | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                   | engine_approximation_gap | no        | no      |
| Poblacion de conejos (Fibonacci)              | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Poblacion de conejos (Fibonacci)              | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Poblacion de conejos (Fibonacci)              | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Escalera con pasos 1, 2 o 3                   | best  | O(1)              | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | expected_dataset_issue   | no        | no      |
| Escalera con pasos 1, 2 o 3                   | avg   | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Escalera con pasos 1, 2 o 3                   | worst | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Tetranacci                                    | best  | O(1)              | \Theta(\left(\frac{1}{4} + \frac{\sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}{2} + \frac{\sqrt{- 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}} + \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{6} + \frac{13}{4 \sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}}}{2}\right)^n) | expected_dataset_issue   | no        | no      |
| Tetranacci                                    | avg   | O(1.9276^n)       | \Theta(\left(\frac{1}{4} + \frac{\sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}{2} + \frac{\sqrt{- 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}} + \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{6} + \frac{13}{4 \sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}}}{2}\right)^n) | symbolic_equivalent      | sí        | no      |
| Tetranacci                                    | worst | O(1.9276^n)       | \Theta(\left(\frac{1}{4} + \frac{\sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}{2} + \frac{\sqrt{- 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}} + \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{6} + \frac{13}{4 \sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}}}{2}\right)^n) | symbolic_equivalent      | sí        | no      |
| Torres de Hanoi                               | best  | O(1)              | \Theta(2^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | policy_best_mismatch     | no        | no      |
| Torres de Hanoi                               | avg   | O(2^n)            | \Theta(2^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Torres de Hanoi                               | worst | O(2^n)            | \Theta(2^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | symbolic_equivalent      | sí        | no      |
| Tribonacci recursivo                          | best  | O(1)              | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | expected_dataset_issue   | no        | no      |
| Tribonacci recursivo                          | avg   | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Tribonacci recursivo                          | worst | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Formas de embaldosar 2xn                      | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Formas de embaldosar 2xn                      | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Formas de embaldosar 2xn                      | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Formas de escribir n con sumandos 1, 3 y 4    | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Formas de escribir n con sumandos 1, 3 y 4    | avg   | O(c^n)            | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | model_dependent_expected | no        | no      |
| Formas de escribir n con sumandos 1, 3 y 4    | worst | O(c^n)            | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | model_dependent_expected | no        | no      |
| Domino 1xn con fichas 1 y 2                   | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Domino 1xn con fichas 1 y 2                   | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Domino 1xn con fichas 1 y 2                   | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Rana: saltos de 1 o 2                         | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Rana: saltos de 1 o 2                         | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Rana: saltos de 1 o 2                         | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Rana: saltos de 1, 2 o 3                      | best  | O(1)              | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | expected_dataset_issue   | no        | no      |
| Rana: saltos de 1, 2 o 3                      | avg   | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Rana: saltos de 1, 2 o 3                      | worst | O(1.8393^n)       | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                | symbolic_equivalent      | sí        | no      |
| Caminos con saltos 1 y 2                      | best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | expected_dataset_issue   | no        | no      |
| Caminos con saltos 1 y 2                      | avg   | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |
| Caminos con saltos 1 y 2                      | worst | O(\varphi^n)      | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | symbolic_equivalent      | sí        | no      |

## Detalle: discrepancias y pseudocódigo

Para cada algoritmo con al menos un fallo **relajado**, o error de API, se incluye el pseudocódigo analizado (`sourceCode`). Si es **iterativo** y hubo discrepancia, se adjunta también `byLine` del peor caso (si existe).

### Binary Search iterativa (`binary-search-iterativa`)

_Nota esperada_: arreglo ordenado

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido        | Clase               | Contenido | Literal |
| ----- | --------- | --------------- | ------------------- | --------- | ------- |
| best  | O(1)      | \Theta(1)       | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log(n)) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log(n)) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
binarySearchIter(A[n], n, x) BEGIN
    izq <- 1;
    der <- n;
    WHILE (izq <= der) DO BEGIN
        mitad <- (izq + der) DIV 2;
        IF (A[mitad] = x) THEN BEGIN
            RETURN mitad;
        END
        IF (x < A[mitad]) THEN BEGIN
            der <- mitad - 1;
        END
        ELSE BEGIN
            izq <- mitad + 1;
        END
    END
    RETURN -1;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = 1"
    ],
    "line_cost_final": "C_{2}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2}",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "while",
    "ck": "C_{3}",
    "count": "\\frac{\\log{\\left(n \\right)} + \\log{\\left(2 \\right)}}{\\log{\\left(2 \\right)}}",
    "count_raw": "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1",
    "note": "Condición de while en línea 4 (worst case: variable  cambia en + 1, límite:  < n)",
    "ops": 1,
    "loopBlockRef": "while_L4",
    "count_closed": "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1",
    "procedure": [
      "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1"
    ],
    "line_cost_final": "C_{3} \\cdot \\frac{\\log{\\left(n \\right)} + \\log{\\left(2 \\right)}}{\\log{\\left(2 \\right)}}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (while) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "while",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "while",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3} \\cdot \\frac{\\log{\\left(n \\right)} + \\log{\\left(2 \\right)}}{\\log{\\left(2 \\right)}}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3} \\cdot \\frac{\\log{\\left(n \\right)} + \\log{\\left(2 \\right)}}{\\log{\\left(2 \\right)}}",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "assign",
    "ck": "C_{4}",
    "count": "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}",
…
```

---

### Ordenamiento burbuja (`bubble-sort`)

_Nota esperada_: versión básica sin corte temprano

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
bubbleSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
            END
        END
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "for",
    "ck": "C_{1}",
    "count": "n",
    "count_raw": "n",
    "note": "Cabecera de for i=1..n - 1",
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = n"
    ],
    "line_cost_final": "C_{1} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 3 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 3 \\cdot n",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "for",
    "ck": "C_{2}",
    "count": "\\frac{n^{2}}{2} + \\frac{n}{2} - 1",
    "count_raw": "\\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
    "note": "Cabecera de for j=1..n - i",
    "ops": 3,
    "count_closed": "\\frac{n^{2}}{2} + \\frac{n}{2} - 1",
    "procedure": [
      "\\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
      "\\text{Aplicando propiedad de linealidad: } \\sum_{i=1}^{n - 1} \\left(-1 \\cdot i + n + 1\\right) = \\sum_{i=1}^{n - 1} -1 \\cdot i + \\sum_{i=1}^{n - 1} n + 1",
      "\\text{Evaluando sumatoria: }",
      "\\sum_{i=1}^{n - 1} n + 1 = n^{2} - 1",
      "\\sum_{i=1}^{n - 1} -1 \\cdot i = \\frac{n \\left(1 - n\\right)}{2}",
      "\\text{Combinando resultados: } \\frac{n \\left(1 - n\\right)}{2} + n^{2} - 1 = \\frac{n^{2}}{2} + \\frac{n}{2} - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = \\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1 \\Rightarrow N_{3} = \\frac{n^{2}}{2} + \\frac{n}{2} - 1",
      "\\text{Resolución de sumatoria para la línea } 3 \\text{:}",
      "\\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
      "\\text{Aplicando propiedad de linealidad: } \\sum_{i=1}^{n - 1} \\left(-1 \\cdot i + n + 1\\right) = \\sum_{i=1}^{n - 1} -1 \\cdot i + \\sum_{i=1}^{n - 1} n + 1",
      "\\text{Evaluando sumatoria: }",
      "\\sum_{i=1}^{n - 1} n + 1 = n^{2} - 1",
      "\\sum_{i=1}^{n - 1} -1 \\cdot i = \\frac{n \\left(1 - n\\right)}{2}",
      "\\text{Combinando resultados: } \\frac{n \\left(1 - n\\right)}{2} + n^{2} - 1 = \\frac{n^{2}}{2} + \\frac{n}{2} - 1"
    ],
    "line_cost_final": "C_{2} \\cdot \\frac{3 n^{2}}{2} + \\frac{3 n}{2} - 3",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
            "items": [
              {
                "id": "iter_line_3_closed",
                "kind": "equation",
                "latex": "N_{3} = \\frac{n^{2}}{2} + \\frac{n}{2} - 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 3 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 4,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot \\frac{3 n^{2}}{2} + \\frac{3 n}{2} - 3",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot \\frac{3 n^{2}}{2} + \\frac{3 n}{2} - 3",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "if",
    "ck": "C_{3}",
    "count": "\\frac{n \\left(n - 1\\right)}{2}",
    "count_raw": "\\sum_{i=1}^{n - 1} \\sum_{j=1}^{-1 \\cdot i + n} 1",
    "note": "Evaluación de la condición",
    "ops": 4,
    "count_closed": "\\frac{n \\left(n - 1\\right)}{2}",
    "procedure": [
      "\\sum_{i=1}^{n - 1} \\sum_{j=1}^{-1 \\cdot i + n} 1",
      "\\text{Evaluando sumatoria interna: } \\sum_{j=1}^{-1 \\cdot i + n} 1 = -1 \\cdot i + n",
      "\\text{Sustituyendo en sumatoria externa: } \\sum_{i=1}^{n - 1} -1 \\cdot i + n",
      "\\text{Evaluando sumatoria externa con límite dependiente: } \\sum_{i=1}^{n - 1} -1 \\cdot i + n",
      "n \\cdot \\left(n - 1\\right)",
      "\\frac{n \\left(n - 1\\right)}{2}"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=1}^{n - 1} \\sum_{j=1}^{-1 \\cdot i + n} 1 \\Rightarrow N_{4} = \\frac{n \\left(n - 1\\right)}{2}",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=1}^{n - 1} \\sum_{j=1}^{-1 \\cdot i + n} 1",
      "\\text{Evaluando sumatoria interna: } \\sum_{j=1}^{-1 \\cdot i + n} 1 = -1 \\cdot i + n",
      "\\text{Sustituyendo en sumatoria externa: } \\sum_{i=1}^{n - 1} -1 \\cdot i + n",
      "\\text{Evaluando sumatoria externa con límite dependiente: } \\sum_{i=1}^{n - 1} -1 \\cdot i + n",
      "n \\cdot \\left(n - 1\\right)",
      "\\frac{n \\left(n - 1\\right)}{2}"
    ],
    "line_cost_final": "C_{3} \\cdot 2 \\cdot n \\cdot \\left(n - 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (condicional) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "if",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "condicional",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n - 1} \\sum_{j=1}^{-1 \\cdot i + n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
…
```

---

### Ordenamiento burbuja mejorado (`bubble-sort-mejorado`)

_Nota esperada_: con bandera de intercambio

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n)     | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
bubbleSortMejorado(A[n], n) BEGIN
    i <- 1;
    WHILE (i <= n - 1) DO BEGIN
        intercambio <- false;
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
                intercambio <- true;
            END
        END
        IF (intercambio = false) THEN BEGIN
            RETURN 0;
        END
        i <- i + 1;
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "while",
    "ck": "C_{2}",
    "count": "n",
    "count_raw": "n",
    "note": "Condición de while en línea 3 (worst case: variable i cambia en + 1, límite: i <= (n) - (1))",
    "ops": 2,
    "loopBlockRef": "while_L3",
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = n"
    ],
    "line_cost_final": "C_{2} \\cdot 2 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (while) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "while",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "while",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot 2 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot 2 \\cdot n",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "n - 1",
    "count_raw": "\\sum_{i=1}^{n - 1} 1",
    "note": null,
    "ops": 1,
    "loopBlockRef": "while_L3",
    "count_closed": "n - 1",
    "procedure": [
      "\\sum_{i=1}^{n - 1} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n - 1} 1 = n - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=1}^{n - 1} 1 \\Rightarrow N_{4} = n - 1",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=1}^{n - 1} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n - 1} 1 = n - 1"
    ],
    "line_cost_final": "C_{3} \\cdot \\left(n - 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n - 1} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n - 1} 1",
            "items": [
              {
                "id": "iter_line_4_closed",
                "kind": "equation",
                "latex": "N_{4} = n - 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 4 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
…
```

---

### Cocktail Shaker Sort (`cocktail-shaker-sort`)

_Nota esperada_: con corte temprano

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase                  | Contenido | Literal |
| ----- | -------- | ------------- | ---------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n^{2}) | notation_mismatch_only | no        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent    | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent    | sí        | no      |

#### Pseudocódigo analizado

```text
cocktailShakerSort(A[n], n) BEGIN
    inicio <- 1;
    fin <- n;
    WHILE (inicio < fin) DO BEGIN
        FOR i <- inicio TO fin - 1 DO BEGIN
            IF (A[i] > A[i + 1]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[i + 1];
                A[i + 1] <- temp;
            END
        END
        fin <- fin - 1;
        j <- fin;
        WHILE (j > inicio) DO BEGIN
            IF (A[j] < A[j - 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j - 1];
                A[j - 1] <- temp;
            END
            j <- j - 1;
        END
        inicio <- inicio + 1;
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = 1"
    ],
    "line_cost_final": "C_{2}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2}",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "while",
    "ck": "C_{3}",
    "count": "n + 1",
    "count_raw": "n + 1",
    "note": "Condición de while en línea 4 (worst case: variable  cambia en + 1, límite:  < n)",
    "ops": 1,
    "loopBlockRef": "while_L4",
    "count_closed": "n + 1",
    "procedure": [
      "n + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = n + 1"
    ],
    "line_cost_final": "C_{3} \\cdot \\left(n + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (while) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "while",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "while",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = n + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3} \\cdot \\left(n + 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3} \\cdot \\left(n + 1\\right)",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "for",
    "ck": "C_{4}",
    "count": "n \\cdot \\left(n + 1\\right)",
…
```

---

### Comb Sort (`comb-sort`)

_Nota esperada_: mejor caso por barridos con gaps decrecientes

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido        | Clase                  | Contenido | Literal |
| ----- | ----------- | --------------- | ---------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(\log(n)) | notation_mismatch_only | no        | no      |
| avg   | O(n^2)      | \Theta(n)       | notation_mismatch_only | no        | no      |
| worst | O(n^2)      | \Theta(n)       | notation_mismatch_only | no        | no      |

#### Pseudocódigo analizado

```text
combSort(A[n], n) BEGIN
    gap <- n;
    intercambio <- true;
    WHILE (gap > 1 OR intercambio = true) DO BEGIN
        IF (gap > 1) THEN BEGIN
            gap <- (gap * 10) DIV 13;
            IF (gap < 1) THEN BEGIN
                gap <- 1;
            END
        END
        intercambio <- false;
        FOR i <- 1 TO n - gap DO BEGIN
            IF (A[i] > A[i + gap]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[i + gap];
                A[i + gap] <- temp;
                intercambio <- true;
            END
        END
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = 1"
    ],
    "line_cost_final": "C_{2}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2}",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "while",
    "ck": "C_{3}",
    "count": "n + 1",
    "count_raw": "n + 1",
    "note": "Condición de while en línea 4 (worst case: variable gap cambia en + 1, límite: gap < n)",
    "ops": 3,
    "loopBlockRef": "while_L4",
    "count_closed": "n + 1",
    "procedure": [
      "n + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = n + 1"
    ],
    "line_cost_final": "C_{3} \\cdot 3 \\cdot \\left(n + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (while) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "while",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "while",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = n + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3} \\cdot 3 \\cdot \\left(n + 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3} \\cdot 3 \\cdot \\left(n + 1\\right)",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "if",
    "ck": "C_{4}",
    "count": "n",
…
```

---

### Ordenamiento por conteo (`counting-sort`)

_Nota esperada_: k = rango de claves

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n + k) | \Theta(k + n) | symbolic_equivalent | sí        | no      |
| avg   | O(n + k) | \Theta(k + n) | symbolic_equivalent | sí        | no      |
| worst | O(n + k) | \Theta(k + n) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
countingSort(A[n], n, k) BEGIN
    FOR i <- 0 TO k DO BEGIN
        C[i] <- 0;
    END
    FOR i <- 1 TO n DO BEGIN
        C[A[i]] <- C[A[i]] + 1;
    END
    indice <- 1;
    FOR valor <- 0 TO k DO BEGIN
        WHILE (C[valor] > 0) DO BEGIN
            A[indice] <- valor;
            C[valor] <- C[valor] - 1;
            indice <- indice + 1;
        END
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "for",
    "ck": "C_{1}",
    "count": "k + 2",
    "count_raw": "k + 2",
    "note": "Cabecera de for i=0..k",
    "ops": 3,
    "count_closed": "k + 2",
    "procedure": [
      "k + 2"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = k + 2"
    ],
    "line_cost_final": "C_{1} \\cdot 3 \\cdot \\left(k + 2\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = k + 2",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 3 \\cdot \\left(k + 2\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 3 \\cdot \\left(k + 2\\right)",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "k + 1",
    "count_raw": "\\sum_{i=0}^{k} 1",
    "note": null,
    "ops": 1,
    "count_closed": "k + 1",
    "procedure": [
      "\\sum_{i=0}^{k} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=0}^{k} 1 = k + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = \\sum_{i=0}^{k} 1 \\Rightarrow N_{3} = k + 1",
      "\\text{Resolución de sumatoria para la línea } 3 \\text{:}",
      "\\sum_{i=0}^{k} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=0}^{k} 1 = k + 1"
    ],
    "line_cost_final": "C_{2} \\cdot \\left(k + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=0}^{k} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=0}^{k} 1",
            "items": [
              {
                "id": "iter_line_3_closed",
                "kind": "equation",
                "latex": "N_{3} = k + 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 3 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 4,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot \\left(k + 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot \\left(k + 1\\right)",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "for",
    "ck": "C_{3}",
    "count": "n + 1",
    "count_raw": "n + 1",
    "note": "Cabecera de for i=1..n",
    "ops": 3,
    "count_closed": "n + 1",
    "procedure": [
      "n + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 5 \\text{: costo } C_{3}",
      "N_{5} = n + 1"
    ],
    "line_cost_final": "C_{3} \\cdot 3 \\cdot \\left(n + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_5_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 5 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 5,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 5,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_5_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{5} = n + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 5 en el peor caso. Aquí \\(N_{5}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{5}\\) representa cuántas veces se ejecuta la línea 5; el subíndice 5 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{5}\\) representa cuántas veces se ejecuta la línea 5; el subíndice 5 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 5,
            "countSymbol": "N_{5}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 5,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
…
```

---

### Bandera nacional holandesa (`dutch-national-flag`)

_Nota esperada_: partición lineal

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
dutchFlag(A[n], n, pivot) BEGIN
    low <- 1;
    mid <- 1;
    high <- n;
    WHILE (mid <= high) DO BEGIN
        IF (A[mid] < pivot) THEN BEGIN
            temp <- A[low];
            A[low] <- A[mid];
            A[mid] <- temp;
            low <- low + 1;
            mid <- mid + 1;
        END
        ELSE BEGIN
            IF (A[mid] > pivot) THEN BEGIN
                temp <- A[mid];
                A[mid] <- A[high];
                A[high] <- temp;
                high <- high - 1;
            END
            ELSE BEGIN
                mid <- mid + 1;
            END
        END
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = 1"
    ],
    "line_cost_final": "C_{2}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2}",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = 1"
    ],
    "line_cost_final": "C_{3}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3}",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "while",
    "ck": "C_{4}",
    "count": "n + 1",
    "count_raw": "n + 1",
…
```

---

### Euclides iterativo (MCD) (`euclides-iterativo-mcd`)

_Nota esperada_: n ~ min(a,b)

_Confianza expected_: hard_oracle

_Parametrización de tamaño (nota)_: Se acepta log(min(a,b)) como log n (n ~ min(a,b)).

| Caso  | Esperado  | Obtenido                | Clase                  | Contenido | Literal |
| ----- | --------- | ----------------------- | ---------------------- | --------- | ------- |
| best  | O(1)      | \Theta(1)               | symbolic_equivalent    | sí        | no      |
| avg   | O(\log n) | \Theta(\log(\min(a,b))) | notation_mismatch_only | no        | no      |
| worst | O(\log n) | \Theta(\log(\min(a,b))) | notation_mismatch_only | no        | no      |

#### Pseudocódigo analizado

```text
euclidesIterativo(a, b) BEGIN
    WHILE (b != 0) DO BEGIN
        temp <- b;
        b <- a MOD b;
        a <- temp;
    END
    RETURN a;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "while",
    "ck": "C_{1}",
    "count": "\\min\\left(a, b\\right) + 1",
    "count_raw": "\\min\\left(a, b\\right) + 1",
    "note": "Condición de while en línea 2 (algoritmo de Euclides: b disminuye por MOD, acotado por min(a,b))",
    "ops": 1,
    "loopBlockRef": "while_L2",
    "euclid_pattern": true,
    "count_closed": "\\min\\left(a, b\\right) + 1",
    "procedure": [
      "\\min\\left(a, b\\right) + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = \\min\\left(a, b\\right) + 1"
    ],
    "line_cost_final": "C_{1} \\cdot \\left(\\min\\left(a, b\\right) + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (while) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "while",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "while",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = \\min\\left(a, b\\right) + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot \\left(\\min\\left(a, b\\right) + 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot \\left(\\min\\left(a, b\\right) + 1\\right)",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "\\min\\left(a, b\\right)",
    "count_raw": "\\min\\left(a, b\\right)",
    "note": null,
    "ops": 1,
    "loopBlockRef": "while_L2",
    "count_closed": "\\min\\left(a, b\\right)",
    "procedure": [
      "\\min\\left(a, b\\right)"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = \\min\\left(a, b\\right)"
    ],
    "line_cost_final": "C_{2} \\cdot \\min\\left(a, b\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\min\\left(a, b\\right)",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot \\min\\left(a, b\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot \\min\\left(a, b\\right)",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "\\min\\left(a, b\\right)",
    "count_raw": "\\min\\left(a, b\\right)",
    "note": null,
    "ops": 2,
    "loopBlockRef": "while_L2",
    "count_closed": "\\min\\left(a, b\\right)",
    "procedure": [
      "\\min\\left(a, b\\right)"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\min\\left(a, b\\right)"
    ],
    "line_cost_final": "C_{3} \\cdot 2 \\cdot \\min\\left(a, b\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\min\\left(a, b\\right)",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3} \\cdot 2 \\cdot \\min\\left(a, b\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3} \\cdot 2 \\cdot \\min\\left(a, b\\right)",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
…
```

---

### Exchange Sort (`exchange-sort`)

_Nota esperada_: comparación por pares

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
exchangeSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[i] > A[j]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "for",
    "ck": "C_{1}",
    "count": "n",
    "count_raw": "n",
    "note": "Cabecera de for i=1..n - 1",
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = n"
    ],
    "line_cost_final": "C_{1} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 3 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 3 \\cdot n",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "for",
    "ck": "C_{2}",
    "count": "\\frac{n^{2}}{2} + \\frac{n}{2} - 1",
    "count_raw": "\\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
    "note": "Cabecera de for j=i + 1..n",
    "ops": 3,
    "count_closed": "\\frac{n^{2}}{2} + \\frac{n}{2} - 1",
    "procedure": [
      "\\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
      "\\text{Aplicando propiedad de linealidad: } \\sum_{i=1}^{n - 1} \\left(-1 \\cdot i + n + 1\\right) = \\sum_{i=1}^{n - 1} -1 \\cdot i + \\sum_{i=1}^{n - 1} n + 1",
      "\\text{Evaluando sumatoria: }",
      "\\sum_{i=1}^{n - 1} n + 1 = n^{2} - 1",
      "\\sum_{i=1}^{n - 1} -1 \\cdot i = \\frac{n \\left(1 - n\\right)}{2}",
      "\\text{Combinando resultados: } \\frac{n \\left(1 - n\\right)}{2} + n^{2} - 1 = \\frac{n^{2}}{2} + \\frac{n}{2} - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = \\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1 \\Rightarrow N_{3} = \\frac{n^{2}}{2} + \\frac{n}{2} - 1",
      "\\text{Resolución de sumatoria para la línea } 3 \\text{:}",
      "\\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
      "\\text{Aplicando propiedad de linealidad: } \\sum_{i=1}^{n - 1} \\left(-1 \\cdot i + n + 1\\right) = \\sum_{i=1}^{n - 1} -1 \\cdot i + \\sum_{i=1}^{n - 1} n + 1",
      "\\text{Evaluando sumatoria: }",
      "\\sum_{i=1}^{n - 1} n + 1 = n^{2} - 1",
      "\\sum_{i=1}^{n - 1} -1 \\cdot i = \\frac{n \\left(1 - n\\right)}{2}",
      "\\text{Combinando resultados: } \\frac{n \\left(1 - n\\right)}{2} + n^{2} - 1 = \\frac{n^{2}}{2} + \\frac{n}{2} - 1"
    ],
    "line_cost_final": "C_{2} \\cdot \\frac{3 n^{2}}{2} + \\frac{3 n}{2} - 3",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
            "items": [
              {
                "id": "iter_line_3_closed",
                "kind": "equation",
                "latex": "N_{3} = \\frac{n^{2}}{2} + \\frac{n}{2} - 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 3 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 4,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot \\frac{3 n^{2}}{2} + \\frac{3 n}{2} - 3",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot \\frac{3 n^{2}}{2} + \\frac{3 n}{2} - 3",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "if",
    "ck": "C_{3}",
    "count": "\\frac{n \\left(n - 1\\right)}{2}",
    "count_raw": "\\sum_{i=1}^{n - 1} \\sum_{j=i + 1}^{n} 1",
    "note": "Evaluación de la condición",
    "ops": 3,
    "count_closed": "\\frac{n \\left(n - 1\\right)}{2}",
    "procedure": [
      "\\sum_{i=1}^{n - 1} \\sum_{j=i + 1}^{n} 1",
      "\\text{Evaluando sumatoria interna: } \\sum_{j=i + 1}^{n} 1 = -1 \\cdot i + n",
      "\\text{Sustituyendo en sumatoria externa: } \\sum_{i=1}^{n - 1} -1 \\cdot i + n",
      "\\text{Evaluando sumatoria externa con límite dependiente: } \\sum_{i=1}^{n - 1} -1 \\cdot i + n",
      "n \\cdot \\left(n - 1\\right)",
      "\\frac{n \\left(n - 1\\right)}{2}"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=1}^{n - 1} \\sum_{j=i + 1}^{n} 1 \\Rightarrow N_{4} = \\frac{n \\left(n - 1\\right)}{2}",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=1}^{n - 1} \\sum_{j=i + 1}^{n} 1",
      "\\text{Evaluando sumatoria interna: } \\sum_{j=i + 1}^{n} 1 = -1 \\cdot i + n",
      "\\text{Sustituyendo en sumatoria externa: } \\sum_{i=1}^{n - 1} -1 \\cdot i + n",
      "\\text{Evaluando sumatoria externa con límite dependiente: } \\sum_{i=1}^{n - 1} -1 \\cdot i + n",
      "n \\cdot \\left(n - 1\\right)",
      "\\frac{n \\left(n - 1\\right)}{2}"
    ],
    "line_cost_final": "C_{3} \\cdot \\frac{3 n \\left(n - 1\\right)}{2}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (condicional) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "if",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "condicional",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n - 1} \\sum_{j=i + 1}^{n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
…
```

---

### Factorial iterativo (`factorial-iterativo`)

_Nota esperada_: mejor caso solo base

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
factorialIterativo(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "for",
    "ck": "C_{2}",
    "count": "n",
    "count_raw": "n",
    "note": "Cabecera de for i=2..n",
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = n"
    ],
    "line_cost_final": "C_{2} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot 3 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot 3 \\cdot n",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "n - 1",
    "count_raw": "\\sum_{i=2}^{n} 1",
    "note": null,
    "ops": 2,
    "count_closed": "n - 1",
    "procedure": [
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=2}^{n} 1 \\Rightarrow N_{4} = n - 1",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_cost_final": "C_{3} \\cdot 2 \\cdot \\left(n - 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=2}^{n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=2}^{n} 1",
            "items": [
              {
                "id": "iter_line_4_closed",
                "kind": "equation",
                "latex": "N_{4} = n - 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 4 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
…
```

---

### Gnome Sort (`gnome-sort`)

_Nota esperada_: si ya está ordenado

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n)     | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
gnomeSort(A[n], n) BEGIN
    i <- 2;
    WHILE (i <= n) DO BEGIN
        IF (i = 1) THEN BEGIN
            i <- i + 1;
        END
        ELSE BEGIN
            IF (A[i] >= A[i - 1]) THEN BEGIN
                i <- i + 1;
            END
            ELSE BEGIN
                temp <- A[i];
                A[i] <- A[i - 1];
                A[i - 1] <- temp;
                i <- i - 1;
            END
        END
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "while",
    "ck": "C_{2}",
    "count": "n^{2} + 1",
    "count_raw": "n^{2} + 1",
    "note": "Condición de while en línea 3 (cursor tipo gnome sort: los swaps adyacentes pueden hacer retroceder el índice, pero el trabajo total sigue acotado por un mejor caso lineal y peor/promedio cuadrático)",
    "ops": 1,
    "loopBlockRef": "while_L3",
    "count_closed": "n^{2} + 1",
    "procedure": [
      "n^{2} + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = n^{2} + 1"
    ],
    "line_cost_final": "C_{2} \\cdot \\left(n^{2} + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (while) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "while",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "while",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = n^{2} + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot \\left(n^{2} + 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot \\left(n^{2} + 1\\right)",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "if",
    "ck": "C_{3}",
    "count": "n - 1",
    "count_raw": "\\sum_{i=1}^{n - 1} 1",
    "note": "Evaluación de la condición",
    "ops": 1,
    "loopBlockRef": "while_L3",
    "count_closed": "n - 1",
    "procedure": [
      "\\sum_{i=1}^{n - 1} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n - 1} 1 = n - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=1}^{n - 1} 1 \\Rightarrow N_{4} = n - 1",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=1}^{n - 1} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n - 1} 1 = n - 1"
    ],
    "line_cost_final": "C_{3} \\cdot \\left(n - 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (condicional) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "if",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "condicional",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n - 1} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n - 1} 1",
            "items": [
              {
                "id": "iter_line_4_closed",
                "kind": "equation",
                "latex": "N_{4} = n - 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 4 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
…
```

---

### Ordenamiento por insercion (`insertion-sort`)

_Nota esperada_: estándar

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n)     | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
insertionSort(A[n], n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        clave <- A[i];
        j <- i - 1;
        WHILE (j > 0 AND A[j] > clave) DO BEGIN
            A[j + 1] <- A[j];
            j <- j - 1;
        END
        A[j + 1] <- clave;
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "for",
    "ck": "C_{1}",
    "count": "n",
    "count_raw": "n",
    "note": "Cabecera de for i=2..n",
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = n"
    ],
    "line_cost_final": "C_{1} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 3 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 3 \\cdot n",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "n - 1",
    "count_raw": "\\sum_{i=2}^{n} 1",
    "note": null,
    "ops": 2,
    "count_closed": "n - 1",
    "procedure": [
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = \\sum_{i=2}^{n} 1 \\Rightarrow N_{3} = n - 1",
      "\\text{Resolución de sumatoria para la línea } 3 \\text{:}",
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_cost_final": "C_{2} \\cdot 2 \\cdot \\left(n - 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=2}^{n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=2}^{n} 1",
            "items": [
              {
                "id": "iter_line_3_closed",
                "kind": "equation",
                "latex": "N_{3} = n - 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 3 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 4,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot 2 \\cdot \\left(n - 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot 2 \\cdot \\left(n - 1\\right)",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "n - 1",
    "count_raw": "\\sum_{i=2}^{n} 1",
    "note": null,
    "ops": 2,
    "count_closed": "n - 1",
    "procedure": [
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=2}^{n} 1 \\Rightarrow N_{4} = n - 1",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_cost_final": "C_{3} \\cdot 2 \\cdot \\left(n - 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=2}^{n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
…
```

---

### Busqueda por saltos (`jump-search`)

_Nota esperada_: bloque óptimo √n

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido             | Clase                  | Contenido | Literal |
| ----- | ----------- | -------------------- | ---------------------- | --------- | ------- |
| best  | O(1)        | \Theta(1)            | symbolic_equivalent    | sí        | no      |
| avg   | O(\sqrt{n}) | \Theta(n)            | notation_mismatch_only | no        | no      |
| worst | O(\sqrt{n}) | \Theta(fin + inicio) | notation_mismatch_only | no        | no      |

#### Pseudocódigo analizado

```text
jumpSearch(A[n], n, x, paso) BEGIN
    inicio <- 1;
    fin <- paso;
    WHILE (fin < n AND A[fin] < x) DO BEGIN
        inicio <- fin + 1;
        fin <- fin + paso;
    END
    IF (fin > n) THEN BEGIN
        fin <- n;
    END
    FOR i <- inicio TO fin DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = 1"
    ],
    "line_cost_final": "C_{2}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2}",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "while",
    "ck": "C_{3}",
    "count": "2",
    "count_raw": "2",
    "note": "Condición de while en línea 4 (worst case: variable fin cambia en + paso, límite: fin < n)",
    "ops": 4,
    "loopBlockRef": "while_L4",
    "count_closed": "2",
    "procedure": [
      "2"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = 2"
    ],
    "line_cost_final": "C_{3} \\cdot 8",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (while) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "while",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "while",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = 2",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3} \\cdot 8",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3} \\cdot 8",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "assign",
    "ck": "C_{4}",
    "count": "1",
…
```

---

### Kadane (`kadane`)

_Nota esperada_: una pasada

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
kadane(A[n], n) BEGIN
    mejorActual <- A[1];
    mejorGlobal <- A[1];
    FOR i <- 2 TO n DO BEGIN
        IF (mejorActual + A[i] > A[i]) THEN BEGIN
            mejorActual <- mejorActual + A[i];
        END
        ELSE BEGIN
            mejorActual <- A[i];
        END
        IF (mejorActual > mejorGlobal) THEN BEGIN
            mejorGlobal <- mejorActual;
        END
    END
    RETURN mejorGlobal;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 2,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1} \\cdot 2",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 2",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 2",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 2,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = 1"
    ],
    "line_cost_final": "C_{2} \\cdot 2",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot 2",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot 2",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "for",
    "ck": "C_{3}",
    "count": "n",
    "count_raw": "n",
    "note": "Cabecera de for i=2..n",
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = n"
    ],
    "line_cost_final": "C_{3} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3} \\cdot 3 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3} \\cdot 3 \\cdot n",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "if",
    "ck": "C_{4}",
    "count": "n - 1",
    "count_raw": "\\sum_{i=2}^{n} 1",
…
```

---

### Busqueda lineal (`linear-search`)

_Nota esperada_: promedio bajo posición uniforme

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
linearSearch(A[n], n, x) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "for",
    "ck": "C_{1}",
    "count": "n + 1",
    "count_raw": "n + 1",
    "note": "Cabecera de for i=1..n",
    "ops": 3,
    "count_closed": "n + 1",
    "procedure": [
      "n + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = n + 1"
    ],
    "line_cost_final": "C_{1} \\cdot 3 \\cdot \\left(n + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = n + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 3 \\cdot \\left(n + 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 3 \\cdot \\left(n + 1\\right)",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "if",
    "ck": "C_{2}",
    "count": "n",
    "count_raw": "\\sum_{i=1}^{n} 1",
    "note": "Evaluación de la condición",
    "ops": 2,
    "count_closed": "n",
    "procedure": [
      "\\sum_{i=1}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n} 1 = n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = \\sum_{i=1}^{n} 1 \\Rightarrow N_{3} = n",
      "\\text{Resolución de sumatoria para la línea } 3 \\text{:}",
      "\\sum_{i=1}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n} 1 = n"
    ],
    "line_cost_final": "C_{2} \\cdot 2 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (condicional) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "if",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "condicional",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=1}^{n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=1}^{n} 1",
            "items": [
              {
                "id": "iter_line_3_closed",
                "kind": "equation",
                "latex": "N_{3} = n"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 3 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 4,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot 2 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot 2 \\cdot n",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 7,
    "kind": "return",
    "ck": "C_{4}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 7 \\text{: costo } C_{4}",
      "N_{7} = 1"
    ],
    "line_cost_final": "C_{4}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_7_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 7 (retorno) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 7,
            "kind": "return",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 7,
              "kind_label": "retorno",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_7_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{7} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 7 en el peor caso. Aquí \\(N_{7}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{7}\\) representa cuántas veces se ejecuta la línea 7; el subíndice 7 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{7}\\) representa cuántas veces se ejecuta la línea 7; el subíndice 7 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 7,
            "countSymbol": "N_{7}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 7,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
…
```

---

### Maximum Subarray cuadratico (`maximum-subarray-cuadratico`)

_Nota esperada_: doble bucle

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
maximumSubarrayCuadratico(A[n], n) BEGIN
    mejor <- A[1];
    FOR i <- 1 TO n DO BEGIN
        suma <- 0;
        FOR j <- i TO n DO BEGIN
            suma <- suma + A[j];
            IF (suma > mejor) THEN BEGIN
                mejor <- suma;
            END
        END
    END
    RETURN mejor;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 2,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1} \\cdot 2",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 2",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 2",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "for",
    "ck": "C_{2}",
    "count": "n + 1",
    "count_raw": "n + 1",
    "note": "Cabecera de for i=1..n",
    "ops": 3,
    "count_closed": "n + 1",
    "procedure": [
      "n + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = n + 1"
    ],
    "line_cost_final": "C_{2} \\cdot 3 \\cdot \\left(n + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = n + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot 3 \\cdot \\left(n + 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot 3 \\cdot \\left(n + 1\\right)",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "n",
    "count_raw": "\\sum_{i=1}^{n} 1",
    "note": null,
    "ops": 1,
    "count_closed": "n",
    "procedure": [
      "\\sum_{i=1}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n} 1 = n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=1}^{n} 1 \\Rightarrow N_{4} = n",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=1}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n} 1 = n"
    ],
    "line_cost_final": "C_{3} \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n} 1",
            "items": [
              {
                "id": "iter_line_4_closed",
                "kind": "equation",
                "latex": "N_{4} = n"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 4 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
…
```

---

### Merge de dos arreglos ordenados (`merge-dos-arreglos-ordenados`)

_Nota esperada_: m segundo arreglo

_Confianza expected_: hard_oracle

_Parametrización de tamaño (nota)_: El motor tiende a reportar n o n+m según detección; comparar como multi-parámetro.

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1)     | symbolic_equivalent | sí        | no      |
| avg   | O(n + m) | \Theta(m + n) | symbolic_equivalent | sí        | no      |
| worst | O(n + m) | \Theta(m + n) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
mergeDosArreglos(A[n], n, B[m], m) BEGIN
    i <- 1;
    j <- 1;
    k <- 1;
    WHILE (i <= n AND j <= m) DO BEGIN
        IF (A[i] <= B[j]) THEN BEGIN
            C[k] <- A[i];
            i <- i + 1;
        END
        ELSE BEGIN
            C[k] <- B[j];
            j <- j + 1;
        END
        k <- k + 1;
    END
    RETURN k - 1;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = 1"
    ],
    "line_cost_final": "C_{2}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2}",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = 1"
    ],
    "line_cost_final": "C_{3}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3}",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "while",
    "ck": "C_{4}",
    "count": "m + n + 1",
    "count_raw": "m + n + 1",
…
```

---

### Newton-Raphson iterativo (`newton-raphson-iterativo`)

_Nota esperada_: t iteraciones fijadas; no es en n puro

_Confianza expected_: pedagogical_expected

_Parametrización de tamaño (nota)_: Pedagógico: el coste depende de iteraciones t; no comparar como n puro.

| Caso  | Esperado | Obtenido            | Clase                    | Contenido | Literal |
| ----- | -------- | ------------------- | ------------------------ | --------- | ------- |
| best  | O(1)     | \Theta(iteraciones) | expected_dataset_issue   | no        | no      |
| avg   | O(t)     | \Theta(iteraciones) | model_dependent_expected | no        | no      |
| worst | O(t)     | \Theta(iteraciones) | model_dependent_expected | no        | no      |

#### Pseudocódigo analizado

```text
newtonRaphson(x0, iteraciones) BEGIN
    x <- x0;
    FOR i <- 1 TO iteraciones DO BEGIN
        x <- x - ((x * x) - 2) / (2 * x);
    END
    RETURN x;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "for",
    "ck": "C_{2}",
    "count": "iteraciones + 1",
    "count_raw": "iteraciones + 1",
    "note": "Cabecera de for i=1..iteraciones",
    "ops": 3,
    "count_closed": "iteraciones + 1",
    "procedure": [
      "iteraciones + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = iteraciones + 1"
    ],
    "line_cost_final": "C_{2} \\cdot 3 \\cdot \\left(iteraciones + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = iteraciones + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot 3 \\cdot \\left(iteraciones + 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot 3 \\cdot \\left(iteraciones + 1\\right)",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "iteraciones",
    "count_raw": "\\sum_{i=1}^{iteraciones} 1",
    "note": null,
    "ops": 6,
    "count_closed": "iteraciones",
    "procedure": [
      "\\sum_{i=1}^{iteraciones} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{iteraciones} 1 = iteraciones"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=1}^{iteraciones} 1 \\Rightarrow N_{4} = iteraciones",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=1}^{iteraciones} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{iteraciones} 1 = iteraciones"
    ],
    "line_cost_final": "C_{3} \\cdot 6 \\cdot iteraciones",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{iteraciones} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{iteraciones} 1",
            "items": [
              {
                "id": "iter_line_4_closed",
                "kind": "equation",
                "latex": "N_{4} = iteraciones"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 4 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
…
```

---

### Suma prefija (`prefix-sum`)

_Nota esperada_: lineal

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
prefixSum(A[n], n) BEGIN
    pref[1] <- A[1];
    FOR i <- 2 TO n DO BEGIN
        pref[i] <- pref[i - 1] + A[i];
    END
    RETURN pref[n];
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 2,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1} \\cdot 2",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 2",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 2",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "for",
    "ck": "C_{2}",
    "count": "n",
    "count_raw": "n",
    "note": "Cabecera de for i=2..n",
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = n"
    ],
    "line_cost_final": "C_{2} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot 3 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot 3 \\cdot n",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "n - 1",
    "count_raw": "\\sum_{i=2}^{n} 1",
    "note": null,
    "ops": 5,
    "count_closed": "n - 1",
    "procedure": [
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=2}^{n} 1 \\Rightarrow N_{4} = n - 1",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_cost_final": "C_{3} \\cdot 5 \\cdot \\left(n - 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=2}^{n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=2}^{n} 1",
            "items": [
              {
                "id": "iter_line_4_closed",
                "kind": "equation",
                "latex": "N_{4} = n - 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 4 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
…
```

---

### Ordenamiento por seleccion (`selection-sort`)

_Nota esperada_: estándar

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
selectionSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        minIndice <- i;
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[j] < A[minIndice]) THEN BEGIN
                minIndice <- j;
            END
        END
        temp <- A[i];
        A[i] <- A[minIndice];
        A[minIndice] <- temp;
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "for",
    "ck": "C_{1}",
    "count": "n",
    "count_raw": "n",
    "note": "Cabecera de for i=1..n - 1",
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = n"
    ],
    "line_cost_final": "C_{1} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 3 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 3 \\cdot n",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "n - 1",
    "count_raw": "\\sum_{i=1}^{n - 1} 1",
    "note": null,
    "ops": 1,
    "count_closed": "n - 1",
    "procedure": [
      "\\sum_{i=1}^{n - 1} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n - 1} 1 = n - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = \\sum_{i=1}^{n - 1} 1 \\Rightarrow N_{3} = n - 1",
      "\\text{Resolución de sumatoria para la línea } 3 \\text{:}",
      "\\sum_{i=1}^{n - 1} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n - 1} 1 = n - 1"
    ],
    "line_cost_final": "C_{2} \\cdot \\left(n - 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=1}^{n - 1} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=1}^{n - 1} 1",
            "items": [
              {
                "id": "iter_line_3_closed",
                "kind": "equation",
                "latex": "N_{3} = n - 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 3 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 4,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot \\left(n - 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot \\left(n - 1\\right)",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "for",
    "ck": "C_{3}",
    "count": "\\frac{n^{2}}{2} + \\frac{n}{2} - 1",
    "count_raw": "\\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
    "note": "Cabecera de for j=i + 1..n",
    "ops": 3,
    "count_closed": "\\frac{n^{2}}{2} + \\frac{n}{2} - 1",
    "procedure": [
      "\\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
      "\\text{Aplicando propiedad de linealidad: } \\sum_{i=1}^{n - 1} \\left(-1 \\cdot i + n + 1\\right) = \\sum_{i=1}^{n - 1} -1 \\cdot i + \\sum_{i=1}^{n - 1} n + 1",
      "\\text{Evaluando sumatoria: }",
      "\\sum_{i=1}^{n - 1} n + 1 = n^{2} - 1",
      "\\sum_{i=1}^{n - 1} -1 \\cdot i = \\frac{n \\left(1 - n\\right)}{2}",
      "\\text{Combinando resultados: } \\frac{n \\left(1 - n\\right)}{2} + n^{2} - 1 = \\frac{n^{2}}{2} + \\frac{n}{2} - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1 \\Rightarrow N_{4} = \\frac{n^{2}}{2} + \\frac{n}{2} - 1",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
      "\\text{Aplicando propiedad de linealidad: } \\sum_{i=1}^{n - 1} \\left(-1 \\cdot i + n + 1\\right) = \\sum_{i=1}^{n - 1} -1 \\cdot i + \\sum_{i=1}^{n - 1} n + 1",
      "\\text{Evaluando sumatoria: }",
      "\\sum_{i=1}^{n - 1} n + 1 = n^{2} - 1",
      "\\sum_{i=1}^{n - 1} -1 \\cdot i = \\frac{n \\left(1 - n\\right)}{2}",
      "\\text{Combinando resultados: } \\frac{n \\left(1 - n\\right)}{2} + n^{2} - 1 = \\frac{n^{2}}{2} + \\frac{n}{2} - 1"
    ],
    "line_cost_final": "C_{3} \\cdot \\frac{3 n^{2}}{2} + \\frac{3 n}{2} - 3",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n - 1} -1 \\cdot i + n + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
…
```

---

### Sentinel Linear Search (`sentinel-linear-search`)

_Nota esperada_: promedio uniforme

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
sentinelLinearSearch(A[n], n, x) BEGIN
    ultimo <- A[n];
    A[n] <- x;
    i <- 1;
    WHILE (A[i] != x) DO BEGIN
        i <- i + 1;
    END
    A[n] <- ultimo;
    IF (i < n OR A[n] = x) THEN BEGIN
        RETURN i;
    END
    RETURN -1;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 2,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1} \\cdot 2",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 2",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 2",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = 1"
    ],
    "line_cost_final": "C_{2}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2}",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = 1"
    ],
    "line_cost_final": "C_{3}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3}",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "while",
    "ck": "C_{4}",
    "count": "n + 1",
    "count_raw": "n + 1",
…
```

---

### Ordenamiento Shell (`shell-sort`)

_Nota esperada_: promedio aprox. n^1.5; depende de gaps

_Confianza expected_: depends_on_model

| Caso  | Esperado    | Obtenido                                                                                                                            | Clase                    | Contenido | Literal |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------- | ------- |
| best  | O(n \log n) | \Theta(\log(n))                                                                                                                     | model_dependent_expected | no        | no      |
| avg   | O(n^{1.5})  | \Theta(\frac{gap^{2} \\log{\left(n \right)}}{\\log{\left(2 \right)}} + \frac{n^{2} \\log{\left(n \right)}}{\\log{\left(2 \right)}}) | model_dependent_expected | no        | no      |
| worst | O(n^2)      | \Theta(\frac{gap^{2} \\log{\left(n \right)}}{\\log{\left(2 \right)}} + \frac{n^{2} \\log{\left(n \right)}}{\\log{\left(2 \right)}}) | model_dependent_expected | no        | no      |

#### Pseudocódigo analizado

```text
shellSort(A[n], n) BEGIN
    gap <- n DIV 2;
    WHILE (gap > 0) DO BEGIN
        FOR i <- gap + 1 TO n DO BEGIN
            temp <- A[i];
            j <- i;
            WHILE (j > gap AND A[j - gap] > temp) DO BEGIN
                A[j] <- A[j - gap];
                j <- j - gap;
            END
            A[j] <- temp;
        END
        gap <- gap DIV 2;
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 2,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1} \\cdot 2",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 2",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 2",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "while",
    "ck": "C_{2}",
    "count": "\\frac{\\log{\\left(n \\right)} + \\log{\\left(2 \\right)}}{\\log{\\left(2 \\right)}}",
    "count_raw": "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1",
    "note": "Condición de while en línea 3 (worst case: variable gap cambia en / 2, límite: gap < 0)",
    "ops": 1,
    "loopBlockRef": "while_L3",
    "count_closed": "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1",
    "procedure": [
      "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = \\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1"
    ],
    "line_cost_final": "C_{2} \\cdot \\frac{\\log{\\left(n \\right)} + \\log{\\left(2 \\right)}}{\\log{\\left(2 \\right)}}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (while) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "while",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "while",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\frac{\\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}} + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot \\frac{\\log{\\left(n \\right)} + \\log{\\left(2 \\right)}}{\\log{\\left(2 \\right)}}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot \\frac{\\log{\\left(n \\right)} + \\log{\\left(2 \\right)}}{\\log{\\left(2 \\right)}}",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "for",
    "ck": "C_{3}",
    "count": "\\frac{\\left(-gap + n + 1\\right) \\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}",
    "count_raw": "\\frac{\\left(-1 \\cdot gap + n + 1\\right) \\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}",
    "note": "Cabecera de for i=gap + 1..n",
    "ops": 3,
    "loopBlockRef": "while_L3",
    "count_closed": "\\frac{\\left(-1 \\cdot gap + n + 1\\right) \\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}",
    "procedure": [
      "\\frac{\\left(-1 \\cdot gap + n + 1\\right) \\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\frac{\\left(-1 \\cdot gap + n + 1\\right) \\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}"
    ],
    "line_cost_final": "C_{3} \\cdot \\frac{3 \\left(-gap + n + 1\\right) \\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\frac{\\left(-1 \\cdot gap + n + 1\\right) \\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3} \\cdot \\frac{3 \\left(-gap + n + 1\\right) \\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3} \\cdot \\frac{3 \\left(-gap + n + 1\\right) \\log{\\left(n \\right)}}{\\log{\\left(2 \\right)}}",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "assign",
    "ck": "C_{4}",
…
```

---

### Criba de Eratostenes (`sieve-of-eratosthenes`)

_Nota esperada_: estándar

_Confianza expected_: hard_oracle

| Caso  | Esperado        | Obtenido      | Clase                  | Contenido | Literal |
| ----- | --------------- | ------------- | ---------------------- | --------- | ------- |
| best  | O(n \log\log n) | \Theta(n)     | notation_mismatch_only | no        | no      |
| avg   | O(n \log\log n) | \Theta(n^{2}) | notation_mismatch_only | no        | no      |
| worst | O(n \log\log n) | \Theta(n^{2}) | notation_mismatch_only | no        | no      |

#### Pseudocódigo analizado

```text
sieveEratosthenes(n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        primo[i] <- true;
    END
    FOR p <- 2 TO n DO BEGIN
        IF (primo[p] = true) THEN BEGIN
            multiplo <- p + p;
            WHILE (multiplo <= n) DO BEGIN
                primo[multiplo] <- false;
                multiplo <- multiplo + p;
            END
        END
    END
    RETURN 0;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "for",
    "ck": "C_{1}",
    "count": "n",
    "count_raw": "n",
    "note": "Cabecera de for i=2..n",
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = n"
    ],
    "line_cost_final": "C_{1} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1} \\cdot 3 \\cdot n",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1} \\cdot 3 \\cdot n",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "n - 1",
    "count_raw": "\\sum_{i=2}^{n} 1",
    "note": null,
    "ops": 1,
    "count_closed": "n - 1",
    "procedure": [
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = \\sum_{i=2}^{n} 1 \\Rightarrow N_{3} = n - 1",
      "\\text{Resolución de sumatoria para la línea } 3 \\text{:}",
      "\\sum_{i=2}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=2}^{n} 1 = n - 1"
    ],
    "line_cost_final": "C_{2} \\cdot \\left(n - 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=2}^{n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = \\sum_{i=2}^{n} 1",
            "items": [
              {
                "id": "iter_line_3_closed",
                "kind": "equation",
                "latex": "N_{3} = n - 1"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 3 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 4,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot \\left(n - 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot \\left(n - 1\\right)",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "for",
    "ck": "C_{3}",
    "count": "n",
    "count_raw": "n",
    "note": "Cabecera de for p=2..n",
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 5 \\text{: costo } C_{3}",
      "N_{5} = n"
    ],
    "line_cost_final": "C_{3} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_5_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 5 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 5,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 5,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_5_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{5} = n",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 5 en el peor caso. Aquí \\(N_{5}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{5}\\) representa cuántas veces se ejecuta la línea 5; el subíndice 5 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{5}\\) representa cuántas veces se ejecuta la línea 5; el subíndice 5 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 5,
            "countSymbol": "N_{5}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 5,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
…
```

---

### Suma de arreglo (`suma-de-arreglo`)

_Nota esperada_: lineal

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
sumaArreglo(A[n], n) BEGIN
    suma <- 0;
    FOR i <- 1 TO n DO BEGIN
        suma <- suma + A[i];
    END
    RETURN suma;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "for",
    "ck": "C_{2}",
    "count": "n + 1",
    "count_raw": "n + 1",
    "note": "Cabecera de for i=1..n",
    "ops": 3,
    "count_closed": "n + 1",
    "procedure": [
      "n + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = n + 1"
    ],
    "line_cost_final": "C_{2} \\cdot 3 \\cdot \\left(n + 1\\right)",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (for) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "for",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "for",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = n + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2} \\cdot 3 \\cdot \\left(n + 1\\right)",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2} \\cdot 3 \\cdot \\left(n + 1\\right)",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "assign",
    "ck": "C_{3}",
    "count": "n",
    "count_raw": "\\sum_{i=1}^{n} 1",
    "note": null,
    "ops": 3,
    "count_closed": "n",
    "procedure": [
      "\\sum_{i=1}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n} 1 = n"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\sum_{i=1}^{n} 1 \\Rightarrow N_{4} = n",
      "\\text{Resolución de sumatoria para la línea } 4 \\text{:}",
      "\\sum_{i=1}^{n} 1",
      "\\text{Aplicando fórmula de sumatoria constante: } \\sum_{i=1}^{n} 1 = n"
    ],
    "line_cost_final": "C_{3} \\cdot 3 \\cdot n",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n} 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s3",
          "index": 3,
          "kind": "line_count_summation_closed",
          "title": "Cierre del conteo",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\sum_{i=1}^{n} 1",
            "items": [
              {
                "id": "iter_line_4_closed",
                "kind": "equation",
                "latex": "N_{4} = n"
              }
            ]
          },
          "summary": "La sumatoria que define el conteo de la línea 4 se cierra en una forma más manejable.",
          "conceptNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "teachingNote": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.summation_closed.standard",
            "conceptKey": "concept.iter_line.summation_closed",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
…
```

---

### Busqueda ternaria iterativa (`ternary-search-iterativo`)

_Nota esperada_: arreglo ordenado

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido        | Clase               | Contenido | Literal |
| ----- | --------- | --------------- | ------------------- | --------- | ------- |
| best  | O(1)      | \Theta(1)       | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log(n)) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log(n)) | symbolic_equivalent | sí        | no      |

#### Pseudocódigo analizado

```text
ternarySearchIterativo(A[n], n, x) BEGIN
    izq <- 1;
    der <- n;
    WHILE (izq <= der) DO BEGIN
        tercio <- (der - izq) DIV 3;
        m1 <- izq + tercio;
        m2 <- der - tercio;
        IF (A[m1] = x) THEN BEGIN
            RETURN m1;
        END
        IF (A[m2] = x) THEN BEGIN
            RETURN m2;
        END
        IF (x < A[m1]) THEN BEGIN
            der <- m1 - 1;
        END
        ELSE BEGIN
            IF (x > A[m2]) THEN BEGIN
                izq <- m2 + 1;
            END
            ELSE BEGIN
                izq <- m1 + 1;
                der <- m2 - 1;
            END
        END
    END
    RETURN -1;
END
```

#### byLine (peor caso, iterativo)

_truncado a 400 líneas; ver snapshot JSON completo._

```json
[
  {
    "line": 2,
    "kind": "assign",
    "ck": "C_{1}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 2 \\text{: costo } C_{1}",
      "N_{2} = 1"
    ],
    "line_cost_final": "C_{1}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_2_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 2 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 2,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{2} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 2 en el peor caso. Aquí \\(N_{2}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{2}\\) representa cuántas veces se ejecuta la línea 2; el subíndice 2 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "countSymbol": "N_{2}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 2,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_2_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{1}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 2.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 2,
            "mode": "worst",
            "costFormula": "C_{1}",
            "ck": "C_{1}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 2
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 3,
    "kind": "assign",
    "ck": "C_{2}",
    "count": "1",
    "count_raw": "1",
    "note": null,
    "ops": 1,
    "count_closed": "1",
    "procedure": [
      "1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 3 \\text{: costo } C_{2}",
      "N_{3} = 1"
    ],
    "line_cost_final": "C_{2}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_3_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 3 (asignación) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "kind": "assign",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 3,
              "kind_label": "asignación",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{3} = 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 3 en el peor caso. Aquí \\(N_{3}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{3}\\) representa cuántas veces se ejecuta la línea 3; el subíndice 3 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "countSymbol": "N_{3}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 3,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_3_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{2}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 3.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 3,
            "mode": "worst",
            "costFormula": "C_{2}",
            "ck": "C_{2}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 3
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 4,
    "kind": "while",
    "ck": "C_{3}",
    "count": "\\frac{\\log{\\left(n \\right)} + \\log{\\left(3 \\right)}}{\\log{\\left(3 \\right)}}",
    "count_raw": "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(3 \\right)}} + 1",
    "note": "Condición de while en línea 4 (worst case: variable  cambia en + 1, límite:  < n)",
    "ops": 1,
    "loopBlockRef": "while_L4",
    "count_closed": "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(3 \\right)}} + 1",
    "procedure": [
      "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(3 \\right)}} + 1"
    ],
    "line_procedure": [
      "\\text{Línea contable } 4 \\text{: costo } C_{3}",
      "N_{4} = \\frac{\\log{\\left(n \\right)}}{\\log{\\left(3 \\right)}} + 1"
    ],
    "line_cost_final": "C_{3} \\cdot \\frac{\\log{\\left(n \\right)} + \\log{\\left(3 \\right)}}{\\log{\\left(3 \\right)}}",
    "step_by_step": {
      "method": "iterative_line",
      "version": "iter_line_steps_v1",
      "overallStatus": "complete",
      "steps": [
        {
          "id": "iter_line_4_s1",
          "index": 1,
          "kind": "line_scope_identified",
          "title": "Línea analizada",
          "status": "complete",
          "math": {
            "primaryLatex": null,
            "items": []
          },
          "summary": "Se toma la línea 4 (while) como unidad contable dentro del peor caso.",
          "conceptNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "teachingNote": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "kind": "while",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.scope",
            "conceptKey": "concept.iter_line.scope",
            "warningKey": null,
            "params": {
              "line": 4,
              "kind_label": "while",
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s2",
          "index": 2,
          "kind": "line_execution_count_resolved",
          "title": "Conteo de ejecuciones",
          "status": "complete",
          "math": {
            "primaryLatex": "N_{4} = \\frac{\\log{\\left(n \\right)}}{\\log{\\left(3 \\right)}} + 1",
            "items": []
          },
          "summary": "Se determina cuántas veces se ejecuta la línea 4 en el peor caso. Aquí \\(N_{4}\\) nombra ese conteo.",
          "conceptNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "teachingNote": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental. Aquí \\(N_{4}\\) representa cuántas veces se ejecuta la línea 4; el subíndice 4 indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "countSymbol": "N_{4}",
            "mode": "worst"
          },
          "template": {
            "summaryKey": "iter_line.count.standard",
            "conceptKey": "concept.iter_line.count",
            "warningKey": null,
            "params": {
              "line": 4,
              "case_label": "peor caso"
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        },
        {
          "id": "iter_line_4_s4",
          "index": 3,
          "kind": "line_cost_built",
          "title": "Costo final de la línea",
          "status": "complete",
          "math": {
            "primaryLatex": "C_{3} \\cdot \\frac{\\log{\\left(n \\right)} + \\log{\\left(3 \\right)}}{\\log{\\left(3 \\right)}}",
            "items": []
          },
          "summary": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea 4.",
          "conceptNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "teachingNote": "Este término es el bloque que luego entra a la suma global del caso analizado.",
          "warning": null,
          "confidence": "high",
          "payload": {
            "line": 4,
            "mode": "worst",
            "costFormula": "C_{3} \\cdot \\frac{\\log{\\left(n \\right)} + \\log{\\left(3 \\right)}}{\\log{\\left(3 \\right)}}",
            "ck": "C_{3}"
          },
          "template": {
            "summaryKey": "iter_line.cost.standard",
            "conceptKey": "concept.iter_line.cost",
            "warningKey": null,
            "params": {
              "line": 4
            }
          },
          "audit": {
            "codes": [],
            "assumptions": [],
            "blockedBy": []
          }
        }
      ]
    }
  },
  {
    "line": 5,
    "kind": "assign",
    "ck": "C_{4}",
    "count": "\\frac{\\log{\\left(n \\right)}}{\\log{\\left(3 \\right)}}",
…
```

---

### Bitonic Sort (`bitonic-sort`)

_Nota esperada_: red/merge bitónico

_Confianza expected_: hard_oracle

| Caso  | Esperado      | Obtenido         | Clase                  | Contenido | Literal |
| ----- | ------------- | ---------------- | ---------------------- | --------- | ------- |
| best  | O(n \log^2 n) | \Theta(n \log n) | notation_mismatch_only | no        | no      |
| avg   | O(n \log^2 n) | \Theta(n \log n) | notation_mismatch_only | no        | no      |
| worst | O(n \log^2 n) | \Theta(n \log n) | notation_mismatch_only | no        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
bitonicSort(A[n], inicio, fin, ascendente) BEGIN
    IF (fin - inicio <= 0) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    CALL bitonicSort(A, inicio, medio, true);
    CALL bitonicSort(A, medio + 1, fin, false);
    CALL bitonicMerge(A, inicio, fin, ascendente);
    RETURN 0;
END

bitonicMerge(A[n], inicio, fin, ascendente) BEGIN
    IF (fin - inicio <= 0) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    i <- inicio;
    WHILE (i <= medio) DO BEGIN
        CALL compareAndSwap(A, i, i + (medio - inicio + 1), ascendente);
        i <- i + 1;
    END
    CALL bitonicMerge(A, inicio, medio, ascendente);
    CALL bitonicMerge(A, medio + 1, fin, ascendente);
    RETURN 0;
END

compareAndSwap(A[n], i, j, ascendente) BEGIN
    temp <- 0;
    IF (ascendente = true) THEN BEGIN
        IF (A[i] > A[j]) THEN BEGIN
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    ELSE BEGIN
        IF (A[i] < A[j]) THEN BEGIN
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    RETURN 0;
END
```

---

### Conteo de inversiones (`counting-inversions`)

_Nota esperada_: merge + count

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido         | Clase               | Contenido | Literal |
| ----- | ----------- | ---------------- | ------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| avg   | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| worst | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
countInversions(A[n], inicio, fin) BEGIN
    IF (inicio >= fin) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    izquierda <- countInversions(A, inicio, medio);
    derecha <- countInversions(A, medio + 1, fin);
    cruzadas <- mergeAndCount(A, inicio, medio, fin);
    RETURN izquierda + derecha + cruzadas;
END
```

---

### Conteo de ocurrencias por mitades (`conteo-ocurrencias-por-mitades`)

_Nota esperada_: divide ambas mitades y suma

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
countOccurrencesDC(A[n], inicio, fin, x) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN 0;
    END
    IF (inicio = fin) THEN BEGIN
        IF (A[inicio] = x) THEN BEGIN
            RETURN 1;
        END
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    izq <- countOccurrencesDC(A, inicio, medio, x);
    der <- countOccurrencesDC(A, medio + 1, fin, x);
    RETURN izq + der;
END
```

---

### Multiplicación de Karatsuba (`karatsuba-multiplication`)

_Nota esperada_: ≈ O(n^1.585)

_Confianza expected_: hard_oracle

| Caso  | Esperado        | Obtenido                                                        | Clase               | Contenido | Literal |
| ----- | --------------- | --------------------------------------------------------------- | ------------------- | --------- | ------- |
| best  | O(n^{\log_2 3}) | \Theta(n^{\frac{\log{\left(3 \right)}}{\log{\left(2 \right)}}}) | symbolic_equivalent | no        | no      |
| avg   | O(n^{\log_2 3}) | \Theta(n^{\frac{\log{\left(3 \right)}}{\log{\left(2 \right)}}}) | symbolic_equivalent | no        | no      |
| worst | O(n^{\log_2 3}) | \Theta(n^{\frac{\log{\left(3 \right)}}{\log{\left(2 \right)}}}) | symbolic_equivalent | no        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
karatsuba(x, y, n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN x * y;
    END
    mitad <- n DIV 2;
    z0 <- karatsuba(x, y, mitad);
    z1 <- karatsuba(x, y, mitad);
    z2 <- karatsuba(x, y, mitad);
    RETURN z0 + z1 + z2;
END
```

---

### Elemento mayoritario divide y vencerás (`majority-element-divide-and-conquer`)

_Nota esperada_: combinación con conteo

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido  | Clase                  | Contenido | Literal |
| ----- | ----------- | --------- | ---------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n) | notation_mismatch_only | no        | no      |
| avg   | O(n \log n) | \Theta(n) | notation_mismatch_only | no        | no      |
| worst | O(n \log n) | \Theta(n) | notation_mismatch_only | no        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
majorityElement(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- majorityElement(A, inicio, medio);
    der <- majorityElement(A, medio + 1, fin);
    IF (izq = der) THEN BEGIN
        RETURN izq;
    END
    RETURN izq;
END
```

---

### Max-Min Tournament (`max-min-tournament`)

_Nota esperada_: torneo

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
maxMinTournament(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izquierda <- maxMinTournament(A, inicio, medio);
    derecha <- maxMinTournament(A, medio + 1, fin);
    RETURN izquierda + derecha;
END
```

---

### Maximum Subarray divide y vencerás (`maximum-subarray-divide-and-conquer`)

_Nota esperada_: clásico

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido         | Clase               | Contenido | Literal |
| ----- | ----------- | ---------------- | ------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| avg   | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| worst | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
maxSubarrayDC(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- maxSubarrayDC(A, inicio, medio);
    der <- maxSubarrayDC(A, medio + 1, fin);
    cruz <- maxSubarrayCruzando(A, inicio, medio, fin);
    IF (izq >= der AND izq >= cruz) THEN BEGIN
        RETURN izq;
    END
    IF (der >= cruz) THEN BEGIN
        RETURN der;
    END
    RETURN cruz;
END
```

---

### Merge K arreglos ordenados (`merge-k-arreglos-ordenados`)

_Nota esperada_: N total de elementos

_Confianza expected_: hard_oracle

_Parametrización de tamaño (nota)_: El motor suele usar n como total de elementos; el expected usa N y k.

| Caso  | Esperado    | Obtenido         | Clase                  | Contenido | Literal |
| ----- | ----------- | ---------------- | ---------------------- | --------- | ------- |
| best  | O(N \log k) | \Theta(n \log n) | notation_mismatch_only | no        | no      |
| avg   | O(N \log k) | \Theta(n \log n) | notation_mismatch_only | no        | no      |
| worst | O(N \log k) | \Theta(n \log n) | notation_mismatch_only | no        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
mergeKSorted(A[n], inicio, fin, k) BEGIN
    IF (k <= 1) THEN BEGIN
        RETURN 0;
    END
    medio <- k DIV 2;
    CALL mergeKSorted(A, inicio, fin, medio);
    CALL mergeKSorted(A, inicio, fin, k - medio);
    CALL mergeKCombine(A, inicio, fin, medio, k - medio);
    RETURN 0;
END
```

---

### Ordenamiento por mezcla (`merge-sort`)

_Nota esperada_: canónico

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido         | Clase               | Contenido | Literal |
| ----- | ----------- | ---------------- | ------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| avg   | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| worst | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) DIV 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
        CALL merge(A, inicio, medio, fin);
    END
    RETURN 0;
END

merge(A[n], inicio, medio, fin) BEGIN
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
    RETURN 0;
END
```

---

### Merge Sort 3-way (`merge-sort-3-way`)

_Nota esperada_: log_3 n, misma clase

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido         | Clase               | Contenido | Literal |
| ----- | ----------- | ---------------- | ------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| avg   | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| worst | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
mergeSort3Way(A[n], inicio, fin) BEGIN
    IF (fin - inicio <= 1) THEN BEGIN
        RETURN 0;
    END
    len <- fin - inicio + 1;
    tercio <- len DIV 3;
    p1 <- inicio + tercio - 1;
    p2 <- p1 + tercio;
    CALL mergeSort3Way(A, inicio, p1);
    CALL mergeSort3Way(A, p1 + 1, p2);
    CALL mergeSort3Way(A, p2 + 1, fin);
    CALL merge3(A, inicio, p1, p2, fin);
    RETURN 0;
END
```

---

### Multiplicación de polinomios divide y vencerás (`polynomial-multiplication-divide-and-conquer`)

_Nota esperada_: versión ingenua por mitades

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
multiplyPolynomial(A[n], B[n], n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN A[1] * B[1];
    END
    mitad <- n DIV 2;
    p1 <- multiplyPolynomial(A, B, mitad);
    p2 <- multiplyPolynomial(A, B, mitad);
    p3 <- multiplyPolynomial(A, B, mitad);
    p4 <- multiplyPolynomial(A, B, mitad);
    RETURN p1 + p2 + p3 + p4;
END
```

---

### Ordenamiento rapido (`quick-sort`)

_Nota esperada_: promedio estándar; peor pivotes

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido         | Clase               | Contenido | Literal |
| ----- | ----------- | ---------------- | ------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| avg   | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)      | \Theta(n^2)      | symbolic_equivalent | sí        | no      |

_preferred_method_: `recursion_tree`

#### Pseudocódigo analizado

```text
quickSort(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        pivote <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
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
        CALL quickSort(A, izq, pi - 1);
        CALL quickSort(A, pi + 1, der);
    END
    RETURN 0;
END
```

---

### Ordenamiento rapido aleatorizado (`quick-sort-aleatorizado`)

_Nota esperada_: esperado en promedio

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido         | Clase               | Contenido | Literal |
| ----- | ----------- | ---------------- | ------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| avg   | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)      | \Theta(n^2)      | symbolic_equivalent | sí        | no      |

_preferred_method_: `recursion_tree`

#### Pseudocódigo analizado

```text
quickSortRand(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        r <- randomInt(izq, der);
        temp <- A[r];
        A[r] <- A[der];
        A[der] <- temp;
        pivote <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
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
        CALL quickSortRand(A, izq, pi - 1);
        CALL quickSortRand(A, pi + 1, der);
    END
    RETURN 0;
END
```

---

### Ordenamiento rapido con mediana de tres (`quick-sort-mediana-de-tres`)

_Nota esperada_: mejora práctica

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido         | Clase                  | Contenido | Literal |
| ----- | ----------- | ---------------- | ---------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n \log n) | symbolic_equivalent    | sí        | no      |
| avg   | O(n \log n) | \Theta(n \log n) | symbolic_equivalent    | sí        | no      |
| worst | O(n^2)      | \Theta(n \log n) | notation_mismatch_only | no        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
quickSortMedian3(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        med <- (izq + der) DIV 2;
        CALL ordenarTres(A, izq, med, der);
        temp <- A[med];
        A[med] <- A[der - 1];
        A[der - 1] <- temp;
        pivote <- A[der - 1];
        i <- izq;
        FOR j <- izq + 1 TO der - 2 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        CALL quickSortMedian3(A, izq, i);
        CALL quickSortMedian3(A, i + 2, der);
    END
    RETURN 0;
END
```

---

### Ordenamiento rapido 3-way partition (`quick-sort-3-way-partition`)

_Nota esperada_: muchos duplicados

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido    | Clase                  | Contenido | Literal |
| ----- | ----------- | ----------- | ---------------------- | --------- | ------- |
| best  | O(n)        | \Theta(n)   | symbolic_equivalent    | sí        | no      |
| avg   | O(n \log n) | \Theta(n)   | notation_mismatch_only | no        | no      |
| worst | O(n^2)      | \Theta(n^2) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `recursion_tree`

#### Pseudocódigo analizado

```text
quickSort3Way(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        pivote <- A[izq];
        lt <- izq;
        i <- izq + 1;
        gt <- der;
        WHILE (i <= gt) DO BEGIN
            IF (A[i] < pivote) THEN BEGIN
                temp <- A[lt];
                A[lt] <- A[i];
                A[i] <- temp;
                lt <- lt + 1;
                i <- i + 1;
            END
            ELSE BEGIN
                IF (A[i] > pivote) THEN BEGIN
                    temp <- A[i];
                    A[i] <- A[gt];
                    A[gt] <- temp;
                    gt <- gt - 1;
                END
                ELSE BEGIN
                    i <- i + 1;
                END
            END
        END
        CALL quickSort3Way(A, izq, lt - 1);
        CALL quickSort3Way(A, gt + 1, der);
    END
    RETURN 0;
END
```

---

### Ordenamiento rapido con pivote central (`quick-sort-pivote-central`)

_Nota esperada_: misma clase

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido         | Clase               | Contenido | Literal |
| ----- | ----------- | ---------------- | ------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| avg   | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)      | \Theta(n^2)      | symbolic_equivalent | sí        | no      |

_preferred_method_: `recursion_tree`

#### Pseudocódigo analizado

```text
quickSortMid(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        med <- (izq + der) DIV 2;
        temp <- A[med];
        A[med] <- A[der];
        A[der] <- temp;
        pivote <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
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
        CALL quickSortMid(A, izq, pi - 1);
        CALL quickSortMid(A, pi + 1, der);
    END
    RETURN 0;
END
```

---

### Producto de arreglo por mitades (`producto-arreglo-por-mitades`)

_Nota esperada_: T(n)=2T(n/2)+O(1)

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
productoArrayMitades(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- productoArrayMitades(A, inicio, medio);
    der <- productoArrayMitades(A, medio + 1, fin);
    RETURN izq * der;
END
```

---

### Suma de arreglo por mitades (`suma-arreglo-por-mitades`)

_Nota esperada_: T(n)=2T(n/2)+O(1)

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
sumaArrayMitades(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- sumaArrayMitades(A, inicio, medio);
    der <- sumaArrayMitades(A, medio + 1, fin);
    RETURN izq + der;
END
```

---

### Construcción de árbol de torneo (`tournament-tree-construction`)

_Nota esperada_: árbol de torneo

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
buildTournamentTree(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    ganadorIzq <- buildTournamentTree(A, inicio, medio);
    ganadorDer <- buildTournamentTree(A, medio + 1, fin);
    IF (ganadorIzq > ganadorDer) THEN BEGIN
        RETURN ganadorIzq;
    END
    RETURN ganadorDer;
END
```

---

### Tournament winner and runner-up (`tournament-winner-runner-up`)

_Nota esperada_: comparaciones guardadas

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
tournamentWinner(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    w1 <- tournamentWinner(A, inicio, medio);
    w2 <- tournamentWinner(A, medio + 1, fin);
    IF (w1 > w2) THEN BEGIN
        RETURN w1;
    END
    RETURN w2;
END
```

---

### Búsqueda de máximo por mitades (`busqueda-maximo-por-mitades`)

_Nota esperada_: divide ambas mitades

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
maxPorMitades(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- maxPorMitades(A, inicio, medio);
    der <- maxPorMitades(A, medio + 1, fin);
    IF (izq > der) THEN BEGIN
        RETURN izq;
    END
    RETURN der;
END
```

---

### Búsqueda de mínimo por mitades (`busqueda-minimo-por-mitades`)

_Nota esperada_: divide ambas mitades

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
minPorMitades(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- minPorMitades(A, inicio, medio);
    der <- minPorMitades(A, medio + 1, fin);
    IF (izq < der) THEN BEGIN
        RETURN izq;
    END
    RETURN der;
END
```

---

### Merge de intervalos por divide y vencerás (`merge-intervalos-divide-and-conquer`)

_Nota esperada_: ordenar/combinar

_Confianza expected_: hard_oracle

| Caso  | Esperado    | Obtenido         | Clase               | Contenido | Literal |
| ----- | ----------- | ---------------- | ------------------- | --------- | ------- |
| best  | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| avg   | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |
| worst | O(n \log n) | \Theta(n \log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
mergeIntervalsDC(I[n], inicio, fin) BEGIN
    IF (inicio >= fin) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    CALL mergeIntervalsDC(I, inicio, medio);
    CALL mergeIntervalsDC(I, medio + 1, fin);
    CALL mergeIntervalPair(I, medio, medio + 1);
    RETURN 0;
END
```

---

### Binary reduction sum divide y vencerás (`binary-reduction-sum-divide-and-conquer`)

_Nota esperada_: reducción binaria

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
binaryReductionSum(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    izq <- binaryReductionSum(A, inicio, medio);
    der <- binaryReductionSum(A, medio + 1, fin);
    RETURN izq + der;
END
```

---

### Z-order recursive matrix traversal (`z-order-recursive-matrix-traversal`)

_Nota esperada_: n dimensión matriz

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
zOrder(M[n], fila, col, tam) BEGIN
    IF (tam = 1) THEN BEGIN
        RETURN M[fila][col];
    END
    mitad <- tam DIV 2;
    q1 <- zOrder(M, fila, col, mitad);
    q2 <- zOrder(M, fila, col + mitad, mitad);
    q3 <- zOrder(M, fila + mitad, col, mitad);
    q4 <- zOrder(M, fila + mitad, col + mitad, mitad);
    RETURN q1 + q2 + q3 + q4;
END
```

---

### Binary Search recursiva (`binary-search-recursiva`)

_Nota esperada_: canónico

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido       | Clase               | Contenido | Literal |
| ----- | --------- | -------------- | ------------------- | --------- | ------- |
| best  | O(1)      | \Theta(1)      | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
binarySearchRec(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) DIV 2;
    IF (A[mitad] = x) THEN BEGIN
        RETURN mitad;
    END
    ELSE BEGIN
        IF (x < A[mitad]) THEN BEGIN
            RETURN binarySearchRec(A, x, inicio, mitad - 1);
        END
        ELSE BEGIN
            RETURN binarySearchRec(A, x, mitad + 1, fin);
        END
    END
END
```

---

### Binary Search primera ocurrencia (`binary-search-first-occurrence`)

_Nota esperada_: sigue a la izquierda

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido       | Clase               | Contenido | Literal |
| ----- | --------- | -------------- | ------------------- | --------- | ------- |
| best  | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
binarySearchFirst(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) DIV 2;
    IF (A[mitad] = x) THEN BEGIN
        izq <- binarySearchFirst(A, x, inicio, mitad - 1);
        IF (izq != -1) THEN BEGIN
            RETURN izq;
        END
        RETURN mitad;
    END
    IF (x < A[mitad]) THEN BEGIN
        RETURN binarySearchFirst(A, x, inicio, mitad - 1);
    END
    RETURN binarySearchFirst(A, x, mitad + 1, fin);
END
```

---

### Binary Search ultima ocurrencia (`binary-search-last-occurrence`)

_Nota esperada_: sigue a la derecha

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido       | Clase               | Contenido | Literal |
| ----- | --------- | -------------- | ------------------- | --------- | ------- |
| best  | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
binarySearchLast(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) DIV 2;
    IF (A[mitad] = x) THEN BEGIN
        der <- binarySearchLast(A, x, mitad + 1, fin);
        IF (der != -1) THEN BEGIN
            RETURN der;
        END
        RETURN mitad;
    END
    IF (x < A[mitad]) THEN BEGIN
        RETURN binarySearchLast(A, x, inicio, mitad - 1);
    END
    RETURN binarySearchLast(A, x, mitad + 1, fin);
END
```

---

### Conteo recursivo regresivo (`conteo-recursivo-regresivo`)

_Nota esperada_: base trivial

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
conteoRegresivo(n) BEGIN
    IF (n <= 0) THEN BEGIN
        RETURN 0;
    END
    RETURN 1 + conteoRegresivo(n - 1);
END
```

---

### Conteo recursivo de digitos (`conteo-recursivo-digitos`)

_Nota esperada_: base 10

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido       | Clase               | Contenido | Literal |
| ----- | --------- | -------------- | ------------------- | --------- | ------- |
| best  | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
countDigitsRec(n) BEGIN
    IF (n < 10) THEN BEGIN
        RETURN 1;
    END
    RETURN 1 + countDigitsRec(n DIV 10);
END
```

---

### Euclides recursivo (`euclides-recursivo`)

_Nota esperada_: n ~ min(a,b)

_Confianza expected_: hard_oracle

_Parametrización de tamaño (nota)_: Se acepta log(min(a,b)) como log n (n ~ min(a,b)).

| Caso  | Esperado  | Obtenido       | Clase                | Contenido | Literal |
| ----- | --------- | -------------- | -------------------- | --------- | ------- |
| best  | O(1)      | \Theta(\log n) | policy_best_mismatch | no        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent  | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent  | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
euclidesRecursivo(a, b) BEGIN
    IF (b = 0) THEN BEGIN
        RETURN a;
    END
    RETURN euclidesRecursivo(b, a MOD b);
END
```

---

### Exponenciacion rapida (`exponenciacion-rapida`)

_Nota esperada_: divide exponente por 2

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido       | Clase               | Contenido | Literal |
| ----- | --------- | -------------- | ------------------- | --------- | ------- |
| best  | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
fastPower(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    mitad <- fastPower(x, n DIV 2);
    resultado <- mitad * mitad;
    IF (n MOD 2 = 1) THEN BEGIN
        resultado <- resultado * x;
    END
    RETURN resultado;
END
```

---

### Factorial recursivo (`factorial-recursivo`)

_Nota esperada_: una llamada por nivel

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
factorialRecursivo(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorialRecursivo(n - 1);
END
```

---

### Find Maximum recursivo (`find-maximum-recursivo`)

_Nota esperada_: una llamada por nivel

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
findMaximumRec(A[n], n) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN A[1];
    END
    anterior <- findMaximumRec(A, n - 1);
    IF (A[n] > anterior) THEN BEGIN
        RETURN A[n];
    END
    RETURN anterior;
END
```

---

### Find Minimum recursivo (`find-minimum-recursivo`)

_Nota esperada_: una llamada por nivel

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
findMinimumRec(A[n], n) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN A[1];
    END
    anterior <- findMinimumRec(A, n - 1);
    IF (A[n] < anterior) THEN BEGIN
        RETURN A[n];
    END
    RETURN anterior;
END
```

---

### Insertion Sort recursivo (`insertion-sort-recursivo`)

_Nota esperada_: igual clase que iterativo

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase                  | Contenido | Literal |
| ----- | -------- | ------------- | ---------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n^{2}) | notation_mismatch_only | no        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent    | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `iteration`

#### Pseudocódigo analizado

```text
insertionSortRec(A[n], n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    CALL insertionSortRec(A, n - 1);
    clave <- A[n];
    j <- n - 1;
    WHILE (j > 0 AND A[j] > clave) DO BEGIN
        A[j + 1] <- A[j];
        j <- j - 1;
    END
    A[j + 1] <- clave;
    RETURN 0;
END
```

---

### Josephus recursivo (`josephus-recursivo`)

_Nota esperada_: una llamada por nivel

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
josephus(n, k) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    RETURN ((josephus(n - 1, k) + k - 1) MOD n) + 1;
END
```

---

### K-esimo simbolo en gramatica (`kth-symbol-in-grammar`)

_Nota esperada_: respecto a la fila; equivalente O(log k)

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
kthSymbol(fila, k) BEGIN
    IF (fila = 1) THEN BEGIN
        RETURN 0;
    END
    padre <- kthSymbol(fila - 1, (k + 1) DIV 2);
    IF (k MOD 2 = 1) THEN BEGIN
        RETURN padre;
    END
    IF (padre = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN 0;
END
```

---

### Linear Search recursiva (`linear-search-recursiva`)

_Nota esperada_: promedio uniforme

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
linearSearchRec(A[n], x, i, n) BEGIN
    IF (i > n) THEN BEGIN
        RETURN -1;
    END
    IF (A[i] = x) THEN BEGIN
        RETURN i;
    END
    RETURN linearSearchRec(A, x, i + 1, n);
END
```

---

### Max en arreglo divide-by-one (`max-en-arreglo-divide-by-one`)

_Nota esperada_: equivalente find max

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
arrayMaxDivideByOne(A[n], n) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN A[1];
    END
    resto <- arrayMaxDivideByOne(A, n - 1);
    IF (A[n] > resto) THEN BEGIN
        RETURN A[n];
    END
    RETURN resto;
END
```

---

### Numeros binarios por division entre 2 (`numeros-binarios-por-division-entre-2`)

_Nota esperada_: una llamada por bit

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido       | Clase               | Contenido | Literal |
| ----- | --------- | -------------- | ------------------- | --------- | ------- |
| best  | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
binaryDigits(n) BEGIN
    IF (n < 2) THEN BEGIN
        RETURN n;
    END
    RETURN binaryDigits(n DIV 2) + (n MOD 2);
END
```

---

### Palindrome Check recursivo (`palindrome-check-recursivo`)

_Nota esperada_: mejor caso falla en extremos

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
palindromeRec(S[n], izq, der) BEGIN
    IF (izq >= der) THEN BEGIN
        RETURN 1;
    END
    IF (S[izq] != S[der]) THEN BEGIN
        RETURN 0;
    END
    RETURN palindromeRec(S, izq + 1, der - 1);
END
```

---

### Potencia modular rapida (`potencia-modular-rapida`)

_Nota esperada_: exponente

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido       | Clase               | Contenido | Literal |
| ----- | --------- | -------------- | ------------------- | --------- | ------- |
| best  | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
fastModPower(x, n, m) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    mitad <- fastModPower(x, n DIV 2, m);
    resultado <- (mitad * mitad) MOD m;
    IF (n MOD 2 = 1) THEN BEGIN
        resultado <- (resultado * x) MOD m;
    END
    RETURN resultado;
END
```

---

### Potencia recursiva naive (`potencia-recursiva-naive`)

_Nota esperada_: una multiplicación por nivel

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
powerNaive(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN x * powerNaive(x, n - 1);
END
```

---

### Ordenamiento por seleccion recursivo (`recursive-selection-sort`)

_Nota esperada_: misma clase

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido      | Clase               | Contenido | Literal |
| ----- | -------- | ------------- | ------------------- | --------- | ------- |
| best  | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| avg   | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |
| worst | O(n^2)   | \Theta(n^{2}) | symbolic_equivalent | sí        | no      |

_preferred_method_: `iteration`

#### Pseudocódigo analizado

```text
selectionSortRec(A[n], inicio, n) BEGIN
    IF (inicio >= n) THEN BEGIN
        RETURN 0;
    END
    minIndice <- inicio;
    FOR j <- inicio + 1 TO n DO BEGIN
        IF (A[j] < A[minIndice]) THEN BEGIN
            minIndice <- j;
        END
    END
    temp <- A[inicio];
    A[inicio] <- A[minIndice];
    A[minIndice] <- temp;
    RETURN selectionSortRec(A, inicio + 1, n);
END
```

---

### Suma recursiva de digitos (`recursive-sum-of-digits`)

_Nota esperada_: base 10

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido       | Clase               | Contenido | Literal |
| ----- | --------- | -------------- | ------------------- | --------- | ------- |
| best  | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
sumDigits(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    RETURN (n MOD 10) + sumDigits(n DIV 10);
END
```

---

### Inversion recursiva de cadena (`reverse-string-recursiva`)

_Nota esperada_: mejor caso solo base

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(1)     | \Theta(1) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
reverseStringRec(S[n], izq, der) BEGIN
    IF (izq >= der) THEN BEGIN
        RETURN 0;
    END
    temp <- S[izq];
    S[izq] <- S[der];
    S[der] <- temp;
    RETURN reverseStringRec(S, izq + 1, der - 1);
END
```

---

### Suma de 1..n recursiva (`suma-de-1-a-n-recursiva`)

_Nota esperada_: una llamada por nivel

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
sumOneToN(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN n + sumOneToN(n - 1);
END
```

---

### Suma de arreglo recursiva (`suma-de-arreglo-recursiva`)

_Nota esperada_: una llamada por nivel

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido  | Clase               | Contenido | Literal |
| ----- | -------- | --------- | ------------------- | --------- | ------- |
| best  | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| avg   | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |
| worst | O(n)     | \Theta(n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
sumArrayRec(A[n], n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    RETURN A[n] + sumArrayRec(A, n - 1);
END
```

---

### Ternary Search recursiva (`ternary-search-recursiva`)

_Nota esperada_: un subproblema por llamada

_Confianza expected_: hard_oracle

| Caso  | Esperado  | Obtenido       | Clase               | Contenido | Literal |
| ----- | --------- | -------------- | ------------------- | --------- | ------- |
| best  | O(1)      | \Theta(1)      | symbolic_equivalent | sí        | no      |
| avg   | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |
| worst | O(\log n) | \Theta(\log n) | symbolic_equivalent | sí        | no      |

_preferred_method_: `master`

#### Pseudocódigo analizado

```text
ternarySearchRec(A[n], x, izq, der) BEGIN
    IF (izq > der) THEN BEGIN
        RETURN -1;
    END
    tercio <- (der - izq) DIV 3;
    m1 <- izq + tercio;
    m2 <- der - tercio;
    IF (A[m1] = x) THEN BEGIN
        RETURN m1;
    END
    IF (A[m2] = x) THEN BEGIN
        RETURN m2;
    END
    IF (x < A[m1]) THEN BEGIN
        RETURN ternarySearchRec(A, x, izq, m1 - 1);
    END
    IF (x > A[m2]) THEN BEGIN
        RETURN ternarySearchRec(A, x, m2 + 1, der);
    END
    RETURN ternarySearchRec(A, x, m1 + 1, m2 - 1);
END
```

---

### Contar cadenas binarias sin unos consecutivos (`count-binary-strings-without-consecutive-ones`)

_Nota esperada_: tipo Fibonacci

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
countBinaryStringsOnes(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 2;
    END
    RETURN countBinaryStringsOnes(n - 1) + countBinaryStringsOnes(n - 2);
END
```

---

### Cadenas binarias sin ceros consecutivos (`count-binary-strings-without-consecutive-zeros`)

_Nota esperada_: misma clase

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
countBinaryStringsZeros(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 2;
    END
    RETURN countBinaryStringsZeros(n - 1) + countBinaryStringsZeros(n - 2);
END
```

---

### Escaleras recursivas (`climbing-stairs`)

_Nota esperada_: naive

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
climbingStairs(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN climbingStairs(n - 1) + climbingStairs(n - 2);
END
```

---

### Contar formas de llegar a N (`count-ways-to-reach-n`)

_Nota esperada_: saltos 1 y 2

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
countWaysToReachN(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN countWaysToReachN(n - 1) + countWaysToReachN(n - 2);
END
```

---

### Cubrir distancia con pasos 1, 2 y 3 (`cover-distance-1-2-3`)

_Nota esperada_: tribonacci-like

_Confianza expected_: approx_symbolic

| Caso  | Esperado    | Obtenido                                                                                                           | Clase                  | Contenido | Literal |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- | --------- | ------- |
| best  | O(1)        | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
coverDistance123(n) BEGIN
    IF (n <= 0) THEN BEGIN
        RETURN 1;
    END
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    IF (n = 2) THEN BEGIN
        RETURN 2;
    END
    RETURN coverDistance123(n - 1) + coverDistance123(n - 2) + coverDistance123(n - 3);
END
```

---

### Fibonacci recursivo (`fibonacci-recursivo`)

_Nota esperada_: clásico

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
```

---

### Colocacion de casas en fila (1D) (`house-placements-1d`)

_Nota esperada_: tipo Fibonacci

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
housePlacements1D(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n + 1;
    END
    RETURN housePlacements1D(n - 1) + housePlacements1D(n - 2);
END
```

---

### Sucesion de Jacobsthal (`jacobsthal-sequence`)

_Nota esperada_: raíz dominante 2

_Confianza expected_: approx_symbolic

| Caso  | Esperado | Obtenido                                                | Clase                    | Contenido | Literal |
| ----- | -------- | ------------------------------------------------------- | ------------------------ | --------- | ------- |
| best  | O(1)     | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue   | no        | no      |
| avg   | O(2^n)   | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | engine_approximation_gap | no        | no      |
| worst | O(2^n)   | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | engine_approximation_gap | no        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
jacobsthal(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    RETURN jacobsthal(n - 1) + 2 * jacobsthal(n - 2);
END
```

---

### Escaleras de K pasos (`k-step-stairs`)

_Nota esperada_: ejemplo k=3

_Confianza expected_: approx_symbolic

| Caso  | Esperado    | Obtenido                                                                                                           | Clase                  | Contenido | Literal |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- | --------- | ------- |
| best  | O(1)        | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
kStepStairs(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    IF (n = 2) THEN BEGIN
        RETURN 2;
    END
    RETURN kStepStairs(n - 1) + kStepStairs(n - 2) + kStepStairs(n - 3);
END
```

---

### Numeros de Lucas (`lucas-numbers`)

_Nota esperada_: como Fibonacci

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
lucas(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 2;
    END
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    RETURN lucas(n - 1) + lucas(n - 2);
END
```

---

### Vacas de Narayana (`narayana-cows`)

_Nota esperada_: x^3=x^2+1

_Confianza expected_: approx_symbolic

| Caso  | Esperado    | Obtenido                                                                                                                                     | Clase                    | Contenido | Literal |
| ----- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------- | ------- |
| best  | O(1)        | \Theta(\left(\frac{\sqrt[3]{2}}{3 \sqrt[3]{3 \sqrt{93} + 29}} + \frac{1}{3} + \frac{2^{\frac{2}{3}} \sqrt[3]{3 \sqrt{93} + 29}}{6}\right)^n) | expected_dataset_issue   | no        | no      |
| avg   | O(1.4656^n) | \Theta(\left(\frac{\sqrt[3]{2}}{3 \sqrt[3]{3 \sqrt{93} + 29}} + \frac{1}{3} + \frac{2^{\frac{2}{3}} \sqrt[3]{3 \sqrt{93} + 29}}{6}\right)^n) | engine_approximation_gap | no        | no      |
| worst | O(1.4656^n) | \Theta(\left(\frac{\sqrt[3]{2}}{3 \sqrt[3]{3 \sqrt{93} + 29}} + \frac{1}{3} + \frac{2^{\frac{2}{3}} \sqrt[3]{3 \sqrt{93} + 29}}{6}\right)^n) | engine_approximation_gap | no        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
narayanaCows(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN 1;
    END
    RETURN narayanaCows(n - 1) + narayanaCows(n - 3);
END
```

---

### Sucesion de Padovan (`padovan-sequence`)

_Nota esperada_: raíz plástica

_Confianza expected_: approx_symbolic

| Caso  | Esperado    | Obtenido                                                                                                                        | Clase                    | Contenido | Literal |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------- | ------- |
| best  | O(1)        | \Theta(1)                                                                                                                       | symbolic_equivalent      | sí        | no      |
| avg   | O(1.3247^n) | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n) | engine_approximation_gap | no        | no      |
| worst | O(1.3247^n) | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n) | engine_approximation_gap | no        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
padovan(n) BEGIN
    IF (n = 0 OR n = 1) THEN BEGIN
        RETURN 1;
    END
    IF (n = 2) THEN BEGIN
        RETURN 1;
    END
    RETURN padovan(n - 2) + padovan(n - 3);
END
```

---

### Numeros de Pell (`pell-numbers`)

_Nota esperada_: ≈ 2.4142^n

_Confianza expected_: approx_symbolic

| Caso  | Esperado          | Obtenido                                                | Clase                    | Contenido | Literal |
| ----- | ----------------- | ------------------------------------------------------- | ------------------------ | --------- | ------- |
| best  | O(1)              | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue   | no        | no      |
| avg   | O((1+\sqrt{2})^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | engine_approximation_gap | no        | no      |
| worst | O((1+\sqrt{2})^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | engine_approximation_gap | no        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
pell(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN 2 * pell(n - 1) + pell(n - 2);
END
```

---

### Secuencia de Perrin (`perrin-sequence`)

_Nota esperada_: como Padovan

_Confianza expected_: approx_symbolic

| Caso  | Esperado    | Obtenido                                                                                                                        | Clase                    | Contenido | Literal |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------- | ------- |
| best  | O(1)        | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n) | expected_dataset_issue   | no        | no      |
| avg   | O(1.3247^n) | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n) | engine_approximation_gap | no        | no      |
| worst | O(1.3247^n) | \Theta(\left(\frac{2 \sqrt[3]{18} + \sqrt[3]{12} \left(\sqrt{69} + 9\right)^{\frac{2}{3}}}{6 \sqrt[3]{\sqrt{69} + 9}}\right)^n) | engine_approximation_gap | no        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
perrin(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 3;
    END
    IF (n = 1) THEN BEGIN
        RETURN 0;
    END
    IF (n = 2) THEN BEGIN
        RETURN 2;
    END
    RETURN perrin(n - 2) + perrin(n - 3);
END
```

---

### Poblacion de conejos (Fibonacci) (`rabbit-population-fibonacci`)

_Nota esperada_: Fibonacci-like

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
rabbitFib(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN rabbitFib(n - 1) + rabbitFib(n - 2);
END
```

---

### Escalera con pasos 1, 2 o 3 (`staircase-1-2-3`)

_Nota esperada_: tribonacci-like

_Confianza expected_: approx_symbolic

| Caso  | Esperado    | Obtenido                                                                                                           | Clase                  | Contenido | Literal |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- | --------- | ------- |
| best  | O(1)        | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
staircase123(n) BEGIN
    IF (n < 0) THEN BEGIN
        RETURN 0;
    END
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN staircase123(n - 1) + staircase123(n - 2) + staircase123(n - 3);
END
```

---

### Tetranacci (`tetranacci-sequence`)

_Nota esperada_: tetranacci

_Confianza expected_: approx_symbolic

| Caso  | Esperado    | Obtenido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Clase                  | Contenido | Literal |
| ----- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)        | \Theta(\left(\frac{1}{4} + \frac{\sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}{2} + \frac{\sqrt{- 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}} + \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{6} + \frac{13}{4 \sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(1.9276^n) | \Theta(\left(\frac{1}{4} + \frac{\sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}{2} + \frac{\sqrt{- 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}} + \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{6} + \frac{13}{4 \sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(1.9276^n) | \Theta(\left(\frac{1}{4} + \frac{\sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}{2} + \frac{\sqrt{- 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}} + \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{6} + \frac{13}{4 \sqrt{- \frac{7}{9 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}} + \frac{11}{12} + 2 \sqrt[3]{- \frac{65}{432} + \frac{\sqrt{1689}}{144}}}}}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
tetranacci(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN 0;
    END
    IF (n = 3) THEN BEGIN
        RETURN 1;
    END
    RETURN tetranacci(n - 1) + tetranacci(n - 2) + tetranacci(n - 3) + tetranacci(n - 4);
END
```

---

### Torres de Hanoi (`hanoi`)

_Nota esperada_: 2^n-1 movimientos

_Confianza expected_: hard_oracle

| Caso  | Esperado | Obtenido    | Clase                | Contenido | Literal |
| ----- | -------- | ----------- | -------------------- | --------- | ------- |
| best  | O(1)     | \Theta(2^n) | policy_best_mismatch | no        | no      |
| avg   | O(2^n)   | \Theta(2^n) | symbolic_equivalent  | sí        | no      |
| worst | O(2^n)   | \Theta(2^n) | symbolic_equivalent  | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    izquierda <- hanoi(n - 1, origen, auxiliar, destino);
    derecha <- hanoi(n - 1, auxiliar, destino, origen);
    RETURN izquierda + derecha + 1;
END
```

---

### Tribonacci recursivo (`tribonacci-recursivo`)

_Nota esperada_: orden 3

_Confianza expected_: approx_symbolic

| Caso  | Esperado    | Obtenido                                                                                                           | Clase                  | Contenido | Literal |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- | --------- | ------- |
| best  | O(1)        | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
tribonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    IF (n = 2) THEN BEGIN
        RETURN 1;
    END
    RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
END
```

---

### Formas de embaldosar 2xn (`ways-to-tile-2xn`)

_Nota esperada_: dominós 2×1

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
waysToTile2xN(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN n;
    END
    RETURN waysToTile2xN(n - 1) + waysToTile2xN(n - 2);
END
```

---

### Formas de escribir n con sumandos 1, 3 y 4 (`ways-write-n-with-1-3-4`)

_Nota esperada_: raíz dominante del polinomio característico

_Confianza expected_: depends_on_model

| Caso  | Esperado | Obtenido                                                | Clase                    | Contenido | Literal |
| ----- | -------- | ------------------------------------------------------- | ------------------------ | --------- | ------- |
| best  | O(1)     | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue   | no        | no      |
| avg   | O(c^n)   | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | model_dependent_expected | no        | no      |
| worst | O(c^n)   | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | model_dependent_expected | no        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
waysWriteN134(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    IF (n < 0) THEN BEGIN
        RETURN 0;
    END
    RETURN waysWriteN134(n - 1) + waysWriteN134(n - 3) + waysWriteN134(n - 4);
END
```

---

### Domino 1xn con fichas 1 y 2 (`domino-tiling-1xn`)

_Nota esperada_: Fibonacci-like

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
dominoTiling1xn(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN dominoTiling1xn(n - 1) + dominoTiling1xn(n - 2);
END
```

---

### Rana: saltos de 1 o 2 (`frog-jump-1-or-2`)

_Nota esperada_: Fibonacci-like

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
frogJump12(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN frogJump12(n - 1) + frogJump12(n - 2);
END
```

---

### Rana: saltos de 1, 2 o 3 (`frog-jump-1-2-3`)

_Nota esperada_: tribonacci-like

_Confianza expected_: approx_symbolic

| Caso  | Esperado    | Obtenido                                                                                                           | Clase                  | Contenido | Literal |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- | --------- | ------- |
| best  | O(1)        | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(1.8393^n) | \Theta(\left(\frac{1}{3} + \frac{4}{3 \sqrt[3]{3 \sqrt{33} + 19}} + \frac{\sqrt[3]{3 \sqrt{33} + 19}}{3}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
frogJump123(n) BEGIN
    IF (n < 0) THEN BEGIN
        RETURN 0;
    END
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN frogJump123(n - 1) + frogJump123(n - 2) + frogJump123(n - 3);
END
```

---

### Caminos con saltos 1 y 2 (`count-paths-jumps-1-and-2`)

_Nota esperada_: Fibonacci-like

_Confianza expected_: approx_symbolic

| Caso  | Esperado     | Obtenido                                                | Clase                  | Contenido | Literal |
| ----- | ------------ | ------------------------------------------------------- | ---------------------- | --------- | ------- |
| best  | O(1)         | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | expected_dataset_issue | no        | no      |
| avg   | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |
| worst | O(\varphi^n) | \Theta(\left(\frac{1}{2} + \frac{\sqrt{5}}{2}\right)^n) | symbolic_equivalent    | sí        | no      |

_preferred_method_: `characteristic_equation`

#### Pseudocódigo analizado

```text
countPathsJumps12(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN countPathsJumps12(n - 1) + countPathsJumps12(n - 2);
END
```

---
