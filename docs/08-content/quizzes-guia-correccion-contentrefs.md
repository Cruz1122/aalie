# Guia de correccion de quizzes y contentRefs

**Estado:** reemplazado
**Reemplazado por:** `authoring-guide.md`
**Nota:** Documento histórico. La guía de contentRefs y corrección de bancos migró a `authoring-guide.md` (sección ContentRef linking).

## Estado actual

- El flujo de inicio desde card de curso envia `moduleId` y `moduleTitle`.
- El selector backend filtra por `sessionPreferences.moduleId`.
- El problema principal para “seccion incorrecta” estaba en `contentRefs` del banco.
- Se agrego un script de alineacion por `topic` para corregir refs en ES/EN.

## Flujo completo (frontend -> backend)

### 1) Card de curso inicia quiz acotado

Archivo: `apps/web/src/components/UserGuideCard.tsx`

- Query enviada:
  - `start=1`
  - `moduleId=<module.moduleId>`
  - `count=10`
  - `moduleTitle=<module.title>`
- Navegacion: `/{locale}/quizzes?...`

### 2) Dashboard parsea query y prepara sesion

Archivo: `apps/web/src/features/quizzes/dashboard/QuizDashboardView.tsx`

- Lee `moduleId`, `moduleTitle`, `count/questionCount`, `topics/topicIds`, `skills/skillIds`.
- Setea `activeQuizOptions`.
- Renderiza `QuizSessionView` con `moduleId` + `moduleTitle`.

Tipos:

Archivo: `apps/web/src/features/quizzes/dashboard/quizDashboardTypes.ts`

- `StartQuizOptions`:
  - `moduleId?: string`
  - `moduleTitle?: string`
  - `topicIds?: string[]`
  - `skillIds?: string[]`
  - `questionCount?: number`

### 3) Session hook arma payload de seleccion

Archivo: `apps/web/src/features/quizzes/session/useQuizSession.ts`

- Construye `QuizSelectionRequest`.
- Incluye en `sessionPreferences`:
  - `moduleId`
  - `topicIds`
  - `skillIds`
  - `questionCount`
- Llama `POST /api/quizzes/session`.

### 4) Proxy Next -> API

Archivo: `apps/web/src/app/api/quizzes/session/route.ts`

- Reenvia body a `POST {API_BASE}/quizzes/attempts`.

### 5) Router backend de quizzes

Archivo: `apps/api/app/modules/quizzes/router.py`

- Endpoint principal de seleccion:
  - `POST /quizzes/attempts`
- Alias legacy:
  - `POST /quizzes/session`

### 6) Servicio de seleccion

Archivo: `apps/api/app/modules/quizzes/service.py`

- `create_session(request)`:
  - normaliza locale (`es`/`en`)
  - carga dataset validado
  - ejecuta selector
  - sanitiza respuestas correctas
  - baraja opciones por semilla de sesion

### 7) Selector que aplica filtros

Archivo: `apps/api/app/modules/quizzes/selector.py`

- Aplica filtros explicitos:
  - `moduleId` (por `contentRefs`)
  - `topicIds`
  - `skillIds`
- Si no hay match con filtros explicitos: warning `explicit_filters_no_match`.
- Match de modulo:
  - exacto
  - o normalizado (admite `mod-` opcional)

### 8) Carga de banco por locale

Archivo: `apps/api/app/modules/quizzes/repository.py`

- ES: `packages/content-data/quizzes/ada-quiz-bank.json`
- EN: `packages/content-data/quizzes/ada-quiz-bank.en.json`

## Correccion de bancos (script nuevo)

Archivo: `scripts/align_quiz_content_refs_catalog.py`

Objetivo:

- Reasignar `contentRefs` segun `topic` pedagogico -> `moduleId` canonico.
- Elegir `chapterId` con mayor score textual dentro del modulo.
- Reescribir refs ADA en todo el arbol de la pregunta (`contentRefs` anidados).

Comando:

```bash
python scripts/align_quiz_content_refs_catalog.py
```

Salida esperada (ejemplo):

```json
{
  "es": { "questions_updated": 475, "skipped_unknown_topic": 0 },
  "en": { "questions_updated": 475, "skipped_unknown_topic": 0 }
}
```

## Mapa canonico topic -> moduleId

Fuente: `TOPIC_TO_MODULE` en `scripts/align_quiz_content_refs_catalog.py`.

- `a_star` -> `mod-comparacion-tecnicas-algoritmicas`
- `algorithm_analysis_fundamentals` -> `mod-complejidad-temporal-espacial`
- `algorithm_correctness` -> `mod-loop-invariant`
- `algorithm_formulation` -> `mod-comparacion-tecnicas-algoritmicas`
- `algorithm_specification` -> `mod-comparacion-tecnicas-algoritmicas`
- `alpha_beta_pruning` -> `mod-comparacion-tecnicas-algoritmicas`
- `asymptotic_notation` -> `mod-notaciones-asintoticas`
- `backtracking` -> `mod-backtracking`
- `best_first_search` -> `mod-comparacion-tecnicas-algoritmicas`
- `branch_and_bound` -> `mod-branch-and-bound`
- `characteristic_equation` -> `mod-ecuacion-caracteristica`
- `cost_analysis` -> `mod-complejidad-temporal-espacial`
- `divide_and_conquer` -> `mod-algoritmos-recursivos`
- `dynamic_programming` -> `mod-programacion-dinamica`
- `function_growth` -> `mod-notaciones-asintoticas`
- `greedy_algorithms` -> `mod-algoritmos-voraces`
- `heap_sort` -> `mod-tabla-sumatorias-comunes`
- `heaps` -> `mod-algoritmos-iterativos-patrones-costos`
- `heuristics` -> `mod-algoritmos-voraces`
- `input_size` -> `mod-complejidad-temporal-espacial`
- `intelligent_substitution` -> `mod-suposiciones-inteligentes`
- `iteration_method` -> `mod-complejidad-temporal-espacial`
- `limits` -> `mod-demostraciones-completas-teorema-limites`
- `loop_invariant` -> `mod-loop-invariant`
- `master_theorem` -> `mod-teorema-maestro`
- `merge_sort` -> `mod-algoritmos-recursivos`
- `minimax` -> `mod-comparacion-tecnicas-algoritmicas`
- `priority_queues` -> `mod-algoritmos-iterativos-patrones-costos`
- `recurrence_equations` -> `mod-teorema-maestro`
- `recursion_tree_method` -> `mod-arbol-recursion`
- `semantic_analysis` -> `mod-comparacion-tecnicas-algoritmicas`
- `series` -> `mod-tabla-sumatorias-comunes`
- `spatial_complexity` -> `mod-complejidad-temporal-espacial`
- `temporal_complexity` -> `mod-complejidad-temporal-espacial`
- `uniform_cost_search` -> `mod-comparacion-tecnicas-algoritmicas`

## Topics y tags por módulo

Fuente: `ada-quiz-bank.json`, `ada-quiz-bank.en.json` (questions `active`) y catálogo ES (`modules/*.module.json`).

### mod-complejidad-temporal-espacial — Complejidad Temporal y Espacial
- Topics (6): algorithm_analysis_fundamentals, cost_analysis, input_size, iteration_method, spatial_complexity, temporal_complexity
- Tags (10): complejidad, tiempo, espacio, operaciones-elementales, modelo-ram, costos, ciclos, for, while, sumatorias

### mod-loop-invariant — Loop Invariant (Invariante de Ciclo)
- Topics (2): algorithm_correctness, loop_invariant
- Tags (10): loop-invariant, invariante-de-ciclo, correctitud, inicializacion, mantenimiento, terminacion, insertion-sort, bubble-sort, ordenamiento, eficiencia

### mod-algoritmos-iterativos-patrones-costos — Algoritmos Iterativos — Patrones y Costos
- Topics (2): heaps, priority_queues
- Tags (11): algoritmos-iterativos, patrones-de-ciclos, for-simple, for-anidado, while, busqueda-secuencial, mejor-caso, peor-caso, caso-promedio, crecimiento-asintotico, limites

### mod-notaciones-asintoticas — Notaciones Asintóticas
- Topics (2): asymptotic_notation, function_growth
- Tags (11): notaciones-asintoticas, big-o, omega, theta, little-o, little-omega, tilde, cuchiflu, limites, familias-de-funciones, cotas

### mod-tabla-maestra-notaciones-convenciones — Tabla Maestra: las 6 notaciones y las 2 convenciones
- Topics (0): ninguno
- Tags (12): tabla-maestra, notaciones-asintoticas, convenciones-de-limites, big-o, omega, theta, little-o, little-omega, tilde, cuchiflu, lim-f-sobre-g, lim-g-sobre-f

### mod-relaciones-notaciones — Relaciones entre las 6 notaciones
- Topics (0): ninguno
- Tags (14): relaciones-asintoticas, notaciones-asintoticas, inclusion, implicacion, simetria, transitividad, equivalencia, big-o, omega, theta, little-o, little-omega, tilde, cuchiflu

### mod-demostraciones-completas-teorema-limites — Demostraciones Completas — Teorema de Límites
- Topics (1): limits
- Tags (13): demostraciones, teorema-de-limites, notaciones-asintoticas, convencion-a, convencion-b, big-o, omega, theta, little-o, little-omega, tilde, verificacion-formal, definicion-formal

### mod-matriz-comparaciones-notaciones — Matriz de comparaciones: f vs g con las 6 notaciones
- Topics (0): ninguno
- Tags (13): matriz-de-comparaciones, notaciones-asintoticas, comparacion-de-funciones, limites, convencion-a, convencion-b, big-o, omega, theta, little-o, little-omega, tilde, cuchiflu

### mod-tabla-sumatorias-comunes — Tabla de Sumatorias Comunes
- Topics (2): heap_sort, series
- Tags (13): sumatorias, sumatorias-simples, sumatorias-dobles, sumatorias-triples, linealidad, telescopica, cambio-de-indice, ciclos-anidados, ciclos-logaritmicos, series-geometricas, serie-armonica, analisis-iterativo, recurrencias

### mod-cheatsheet-resumen-rapido — Cheatsheet — Resumen Rápido
- Topics (0): ninguno
- Tags (10): cheatsheet, resumen-rapido, repaso, analisis-iterativo, notaciones-asintoticas, limites, operaciones-elementales, sumatorias, parcial, referencia-rapida

### mod-algoritmos-recursivos — Algoritmos Recursivos
- Topics (2): divide_and_conquer, merge_sort
- Tags (16): recursion, algoritmos-recursivos, ambientes-de-ejecucion, pila, marcos-de-pila, caso-base, caso-general, fibonacci, torres-de-hanoi, arbol-de-llamadas, arbol-de-recursion, ecuaciones-de-recurrencia, divide-y-venceras, resta-y-venceras, resta-y-seras-vencido, recursion-de-cola

### mod-teorema-maestro — Teorema Maestro
- Topics (2): master_theorem, recurrence_equations
- Tags (12): recurrencias, teorema-maestro, master-theorem, divide-y-venceras, analisis-recursivo, logaritmo-base-b, exponente-critico, regularidad, merge-sort, busqueda-binaria, quicksort-mejor-caso, casos-mutualmente-excluyentes

### mod-arbol-recursion — Método del Árbol de Recursión
- Topics (1): recursion_tree_method
- Tags (14): recurrencias, arbol-de-recursion, recursion-tree, analisis-recursivo, divide-y-venceras, resta-y-seras-vencido, niveles, hojas, altura, sumatoria-por-niveles, dominancia, quicksort-mejor-caso, torres-de-hanoi, recurrencias-no-balanceadas

### mod-ecuacion-caracteristica — Método de la Ecuación Característica
- Topics (1): characteristic_equation
- Tags (12): recurrencias, ecuacion-caracteristica, erlh, recurrencias-lineales, coeficientes-constantes, fibonacci, torres-de-hanoi, raices-distintas, raices-repetidas, raiz-dominante, no-homogenea, termino-forzante

### mod-suposiciones-inteligentes — Método de Suposiciones Inteligentes
- Topics (1): intelligent_substitution
- Tags (13): recurrencias, suposiciones-inteligentes, sustitucion, induccion-matematica, cotas-asintoticas, big-o, omega, theta, hipotesis-inductiva, casos-base, recurrencias-no-estandar, akra-bazzi-intuicion, verificacion-de-cotas

### mod-programacion-dinamica — Programación Dinámica
- Topics (1): dynamic_programming
- Tags (23): programacion-dinamica, pd, dynamic-programming, subestructura-optima, principio-de-optimalidad, subproblemas-superpuestos, memoizacion, top-down, bottom-up, tabulacion, modelo-recursivo, modelo-de-pd, fibonacci, factorial, tablas, lcs, subsecuencia-comun-mas-larga, tabla-de-optimos, tabla-de-caminos, reconstruccion, patrones-1d, patrones-2d, optimizacion-espacial

### mod-algoritmos-voraces — Algoritmos Voraces
- Topics (2): greedy_algorithms, heuristics
- Tags (16): algoritmos-voraces, greedy, avidos, avaros, glotones, miopes, optimo-local, optimo-global, propiedad-voraz, subestructura-optima, factibilidad, funcion-objetivo, cambio-de-monedas, warnsdorff, seleccion-de-actividades, programacion-dinamica

### mod-backtracking — Backtracking
- Topics (1): backtracking
- Tags (14): backtracking, vuelta-atras, busqueda-en-profundidad, dfs, arbol-de-decisiones, poda, factibilidad, solucion-parcial, espacio-de-soluciones, n-tupla, n-reinas, subconjuntos, coloreo-de-grafos, fuerza-bruta

### mod-branch-and-bound — Branch and Bound
- Topics (1): branch_and_bound
- Tags (16): branch-and-bound, ramificacion-y-poda, branch-bound, optimizacion, cotas, cota-superior, cota-inferior, incumbente, lista-nodos-vivos, cola-de-prioridad, least-cost, max-benefit, mochila-entera, mochila-01, poda-por-suboptimalidad, backtracking

### mod-comparacion-tecnicas-algoritmicas — Comparación de Técnicas Algorítmicas
- Topics (8): a_star, algorithm_formulation, algorithm_specification, alpha_beta_pruning, best_first_search, minimax, semantic_analysis, uniform_cost_search
- Tags (13): comparacion-de-tecnicas, tecnicas-algoritmicas, diseno-de-algoritmos, iterativos, recursivos, divide-y-venceras, resta-y-venceras, programacion-dinamica, voraces, backtracking, branch-and-bound, fuerza-bruta, seleccion-de-tecnica

## Verificaciones recomendadas

### 1) Unit tests selector

```bash
cd apps/api
python -m pytest tests/unit/quizzes/test_grading_selector.py -q
```

### 2) Integridad de datasets

```bash
cd apps/api
python - <<'PY'
from app.modules.quizzes.repository import get_validated_dataset
for loc in ['es','en']:
    _, report = get_validated_dataset(loc)
    print(loc, 'errors=', len(report.errors), 'warnings=', len(report.warnings))
PY
```

### 3) Smoke puntual por topic

```bash
cd /c/dev/algorithmic-analysis
python - <<'PY'
import json
from pathlib import Path
p=Path('packages/content-data/quizzes/ada-quiz-bank.en.json')
d=json.loads(p.read_text(encoding='utf-8'))
topic='a_star'
for q in d['questions']:
    if q.get('status')=='active' and q.get('topic')==topic:
        print(q['questionId'], q['contentRefs'])
        break
PY
```

## Notas de mantenimiento

- `scripts/backfill_quiz_content_refs.py` queda deprecado para esta tarea.
- Si agregas topics nuevos, actualiza `TOPIC_TO_MODULE` y re-ejecuta.
- Si cambia el catalogo (capitulos/secciones), re-ejecuta para recalcular `chapterId`.
- Reinicia API para refrescar cache si estaba levantada.
