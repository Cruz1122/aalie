# Especificación de heurísticas WHILE

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/while_engine/engine.py`, `apps/api/app/modules/analysis/while_engine/classifier.py`, `apps/api/app/modules/analysis/while_engine/patterns/`, `apps/api/app/modules/analysis/while_engine/progress_proofs.py`, `apps/api/app/modules/analysis/while_engine/control_variables.py`, `apps/api/app/modules/analysis/while_engine/guard_analysis.py`, `apps/api/app/modules/analysis/while_engine/update_analysis.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 4.2 — Análisis de ciclos WHILE

## Propósito

Formalizar cómo AALIE analiza ciclos `WHILE`, qué decisiones son defendibles hoy, y bajo qué condiciones se emite cada nivel de evidencia. Este spec es la norma contractual para el `while_engine` y todos sus consumidores (visitors, export, UI).

## Alcance

Aplica al `while_engine` completo, incluyendo: análisis de guard, detección de variables de control, análisis de actualizaciones, pruebas de progreso, clasificación de patrones, construcción de `WhileCostBlock`, y payload de salida consumido por visitors de análisis. Aplica también al desempate entre patrones y a la política conservadora de evidencia.

## Fuera de alcance

No cubre: demostración general de terminación (solo patrones), análisis de FOR loops (espec separada), análisis de recursión.

## Contenido

### 1. Política conservadora de decisión

El motor **nunca adivina** una cota cuando la evidencia es insuficiente. Las únicas salidas permisibles son:

- `bounded` — hay evidencia suficiente para una cota de iteraciones.
- `unbounded` — hay evidencia de no terminación o de que el guard nunca se falsa.
- `unknown` — no hay suficiente evidencia para ninguna de las anteriores.
- `not_proven` — el motor reconoce señales de progreso pero no puede demostrar una cota cerrada.

### 2. Niveles de evidencia

| Nivel | Significado | Autoriza |
|-------|-------------|----------|
| `strong` | Guard interpretable, variable de control identificada, regla de actualización monotónica, dirección compatible con guard, límite inferible. | Clase asintótica completa, `iterations_expr`, `bounded` |
| `medium` | Patrón reconocible con ambigüedad local, sin contradicción estructural. | Salida parcial o `bounded` con advertencia, no conclusión fuerte completa |
| `weak` | Señales de progreso pero no prueba suficiente de controlador dominante o terminación. | `unknown` o `not_proven` |
| `contradictory` | Guard, actualización y progreso chocan entre sí. | Rechazo del patrón, `unbounded`/`not_proven`, nunca cierre optimista |

A efectos contractuales, **evidencia suficiente** significa al menos nivel `strong`.

### 3. Los 12 patrones registrados

Orden de evaluación en `_PATTERNS` dentro de `engine.py` (primera coincidencia con evidencia suficiente gana; ver desempate contractual abajo):

| # | Patrón | Clase | Descripción | Criterio de detección |
|---|--------|-------|-------------|----------------------|
| 1 | `gnome_sort_cursor` | O(n^2) | Cursor que retrocede tras swap, típico de Gnome Sort | WHILE con avance/retroceso condicional, dos punteros acoplados |
| 2 | `shrinking_window_bidirectional` | O(n) | Ventana que se contrae desde ambos extremos (Dutch National Flag) | Dos índices que convergen desde extremos opuestos, actualizaciones monótonas |
| 3 | `sentinel_scan` | O(n) | Búsqueda lineal con centinela al final del arreglo | Guard con comparación de elemento contra valor, ausencia de índice explícito |
| 4 | `gap_shrink_then_scan` | O(n^2) / O(n log n) | Gap que se reduce y luego se escanea (Comb Sort / Shell externo) | Variable gap que decrece multiplicativamente + escaneo anidado |
| 5 | `phase_loop_composition` | O(sqrt(n)) / O(log n) | Fase de salto + fase de barrido (Jump Search) | Dos fases detectables: salto multiplicativo seguido de barrido lineal |
| 6 | `merge_two_pointers` | O(n) | Dos punteros que avanzan en paralelo (merge de Merge Sort) | Dos índices independientes que avanzan monótonamente, guard compuesto |
| 7 | `linear_counter` | O(n) | Contador lineal: `i <- i + 1` | Actualización monótona aditiva, guard comparativo con límite |
| 8 | `geometric_growth` | O(log n) | Crecimiento geométrico: `i <- i * k` | Actualización multiplicativa, guard comparativo con límite |
| 9 | `flag_kill` | O(1) best / O(n) worst | Bandera que se mata en el camino correspondiente | Variable booleana de guard, actualización a false en el cuerpo |
| 10 | `euclid_mod` | O(log min(a,b)) | Algoritmo de Euclides vía módulo | Operador MOD sobre variables del guard, tamaño decrece por módulo |
| 11 | `binary_search_interval` | O(log n) | Intervalo de búsqueda que se reduce a la mitad | Actualización tipo `mid <- (low + high) // 2`, intervalo [low, high] |
| 12 | `interval_shrink` | O(n) | Intervalo que se reduce linealmente desde un extremo | Una variable de intervalo se actualiza monótonamente hacia la otra |

### 4. Payload de salida (`WhileAnalysisResult` y `WhileCostBlock`)

**`WhileAnalysisResult`:**
- `status`: `bounded` | `unbounded` | `unknown` | `not_proven`
- `termination`: `proven_terminating` | `proven_non_terminating` | `not_proven`
- `iterations_expr`: expresión simbólica de iteraciones (ej. `n`, `log(n)`, `n/2`)
- `asymptotic_class`: clase asintótica (ej. `O(n)`, `Θ(log n)`)
- `dominant_controller`: variable de control principal
- `supporting_controllers`: lista de variables de control auxiliares
- `pattern_used`: nombre del patrón que coincidió
- `reason_code`: código de razón (ver sección 6)
- `diagnostics`: lista de strings con advertencias
- Campos visitor compatibles: `variable`, `limit`, `change_rule`, `operator`, `evidence`, `cost_block`

**`WhileCostBlock`:**
- `id`: `while_L{line}`
- `status`: `available` | `partial` | `unknown` | `unbounded`
- `evidence_level`: `strong` | `medium` | `weak`
- `per_iteration_cost_expr`: `C_{guard,{line}} + C_{body,{line}}`
- `exit_check_cost_expr`: `C_{guard_exit,{line}}`
- `expanded_cost_expr`: `({iterations}) * ({per_iteration_cost}) + {exit_check_cost}`

### 5. Desempate entre patrones

Cuando dos o más patrones alcanzan evidencia `strong`, no gana "el primero" por orden incidental de `_PATTERNS`. El desempate sigue esta prioridad contractual:

1. **Patrón más específico del dominio** — el que capture la semántica más precisa del bucle (ej. `binary_search_interval` > `geometric_growth` cuando ambos describen el mismo loop pero el guard evidencia reducción de intervalo de búsqueda).
2. **Patrón con menos supuestos implícitos** — el que requiera menos heurísticas auxiliares para su justificación.
3. **Patrón con evidencia sobre una variable de control dominante única** — prefiere un controlador único probado sobre múltiples controladores con evidencia parcial.

Si dos patrones fuertes siguen empatados después de esa prioridad, el motor degrada a salida parcial o registra ambigüedad explícita en `diagnostics`; no puede elegir arbitrariamente.

`_PATTERNS` sigue siendo el orden de evaluación de primera pasada, pero el desempate contractual anula ese orden cuando hay conflicto entre patrones fuertes.

### 6. Códigos de razón (`reason_code`)

Cada salida incluye un `reason_code` que explica por qué se eligió ese nivel de evidencia:

- `while_bounded_known_pattern`: patrón reconocido con cota exacta
- `while_bounded_classify`: clasificador devolvió cota sin patrón específico
- `while_unbounded_known`: progreso probado pero sin límite superior derivable
- `while_unbounded_unknown`: no se pudo demostrar progreso ni cota
- `while_contradictory`: guard y actualizaciones son inconsistentes
- `while_guard_not_interpretable`: el guard no pudo analizarse
- `while_no_relevant_updates`: no hay actualizaciones en variables del guard
- `while_progress_not_provable`: el progreso hacia la salida no puede demostrarse
- `while_pattern_tie_ambiguity`: dos patrones fuertes empatados, se degrada a parcial

### 7. Manejo por modo (best/worst/average)

- `best`: puede aceptar `flag_kill` con una sola iteración cuando la bandera se mata en el camino correspondiente. No aplica esta preferencia a patrones logarítmicos (`euclid_mod`, `binary_search_interval`).
- `worst` y `avg`: no aceptan el atajo de `flag_kill` si el flag puede revivir.
- `worst` asume la trayectoria más larga posible del bucle.
- `avg` usa el modelo de promedio configurado (`avg_model`) para estimar iteraciones medias.

### 8. Invariantes

1. El guard se analiza antes que las actualizaciones.
2. Las variables asignadas en el cuerpo se usan para reforzar evidencia de control.
3. El orden interno de evaluación (`_PATTERNS`) no define por sí solo el patrón ganador (el desempate contractual lo anula).
4. Una coincidencia de patrón no autoriza extrapolar a casos no demostrados.
5. `_collect_assigned` extrae todas las variables del cuerpo para enriquecer `vars_used`.
6. `prove_progress` debe invocarse incluso si ningún patrón coincide — establece el estado de terminación.

### 9. Errores esperables

- Guard no interpretable → `reason_code: "while_guard_not_interpretable"`.
- Ausencia de actualizaciones relevantes → `reason_code: "while_no_relevant_updates"`.
- Progreso no demostrable → `reason_code: "while_progress_not_provable"`.
- Contradicción entre actualizaciones y condición → `reason_code: "while_contradictory"`.
- `classify_while` lanza excepción → `status: "unknown"`, `termination: "not_proven"`, `reason_code: "while_unbounded_unknown"`.
- Patrón coincide pero produce error interno → se captura y degrada a fallback con diagnostico.

### 10. Casos soportados

1. **Contador lineal**: `WHILE (i < n) DO i <- i + 1` → `linear_counter`, O(n)
2. **Crecimiento geométrico**: `WHILE (i <= n) DO i <- i * 2` → `geometric_growth`, O(log n)
3. **Búsqueda binaria**: `WHILE (low <= high) DO mid <- (low+high)//2; ...` → `binary_search_interval`, O(log n)
4. **Euclides**: `WHILE (b != 0) DO r <- a MOD b; a <- b; b <- r` → `euclid_mod`, O(log min(a,b))
5. **Bandera**: `WHILE (swapped) DO swapped <- FALSE; ...` → `flag_kill`, O(n) worst / O(1) best
6. **Selección**: bucle con `min_idx <- i; ...` y swap al final → `gnome_sort_cursor` o `interval_shrink`, O(n^2)
7. **Dos punteros merge**: dos índices avanzando en paralelo → `merge_two_pointers`, O(n)

### 11. Casos no soportados

1. **Guard compuesto no separable**: `WHILE (i < n OR j < m) DO i <- i + j; j <- j - i` — las variables están acopladas, el progreso no es monótono.
2. **Llamada a función externa en guard**: `WHILE (condicionExterna()) DO actualizarEstado()` — el guard no es interpretable estáticamente.
3. **Actualización no monótona**: bucle donde la variable de control oscila (ej. `i <- i + 1` y `i <- i - 2` en ramas diferentes sin dominancia clara).
4. **Múltiples variables acopladas sin controlador dominante**: tres o más variables que se modifican mutuamente en cada iteración.
5. **Progreso dependiente de estructura de datos no analizable**: guard sobre campo de objeto cuyo valor no puede inferirse estáticamente.

### 12. Evidencia

- La implementación actual en `engine.py` procesa los 12 patrones en el orden de `_PATTERNS`.
- `classify_while` (del módulo `classifier`) provee la clasificación base antes de aplicar patrones.
- `prove_progress` establece `termination` independientemente del patrón.
- `_build_cost_block` construye el bloque semántico expandible con `per_iteration_cost_expr` y `expanded_cost_expr`.
- `_infer_iterations_class` deriva la clase textual (`logarithmic`, `quadratic`, `linear`, `constant`) a partir de la expresión.

### 13. Limitaciones

- El soporte actual cubre 12 patrones frecuentes, no una demostración general de terminación.
- Loops con variables acopladas y progreso no monótono pueden quedar en estado no concluyente.
- `flag_kill` asume que la bandera no puede revivir después de matarse — esto es conservador pero puede perder casos donde la bandera efectivamente muere para siempre.
- El desempate entre patrones fuertes puede producir ambigüedad no resoluble; en ese caso se degrauda a parcial.

## Archivos relacionados

- `../02-architecture/analysis-engine-architecture.md`
- `analysis-engine-spec.md`
- `../09-decisions/adr-003-conservative-while-heuristics.md`
- `../04-api/analysis-api.md`
