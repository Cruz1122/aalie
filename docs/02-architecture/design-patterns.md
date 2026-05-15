# Patrones de diseño

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/`, `apps/web/src/app/api/`, `packages/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** decisiones arquitectónicas, estilo del código

## Propósito

Catalogar los patrones de diseño identificados en el código fuente de AALIE, con evidencia concreta de su uso, beneficios y riesgos.

## Alcance

Cubre 8 patrones: Strategy, Visitor, Builder, Adapter/Proxy, Facade, Registry, Snapshot/Document Model, Template Method.

## Contenido

### 1. Strategy

| Atributo | Descripción |
|---|---|
| **Evidencia** | `apps/api/app/modules/analysis/analyzers/registry.py:9-13` — `AnalyzerRegistry` mapea `algorithm_kind` → clase de analizador |
| **Uso** | El análisis selecciona estrategia según tipo de algoritmo: `IterativeAnalyzer` para iterativos, `RecursiveAnalyzer` para recursivos/híbridos |
| **Beneficio** | Nuevos tipos de algoritmo solo requieren nueva clase de analizador + registro; el service facade no cambia |
| **Riesgo** | `AnalyzerRegistry` es un dict plano — no hay validación de interfaz en compile-time |

**Detalle**: `AnalyzerRegistry = {"iterative": IterativeAnalyzer, "recursive": RecursiveAnalyzer, "hybrid": RecursiveAnalyzer}`. El service `analyze_algorithm()` en `service.py:100` hace `analyzer_class = AnalyzerRegistry.get(algorithm_kind)` y si no hay match, usa `IterativeAnalyzer` como fallback. Cada analizador implementa `analyze(ast, mode, ...)`.

**Variante**: El while engine usa 12 patrones de WHILE (`patterns/*.py`) como estrategias concretas, matching por `pattern.matches(while_ctx)` y derivación por `pattern.derive_iterations(while_ctx)` (`engine.py:260-318`).

---

### 2. Visitor

| Atributo | Descripción |
|---|---|
| **Evidencia** | `apps/api/app/modules/analysis/visitors/` — 4 visitors: `for_visitor.py`, `if_visitor.py`, `while_repeat_visitor.py`, `simple_visitor.py` |
| **Uso** | El `IterativeAnalyzer` hereda de múltiples visitors via Python MRO (`iterative.py:21`): `class IterativeAnalyzer(BaseAnalyzer, ForVisitor, IfVisitor, WhileRepeatVisitor, SimpleVisitor)` |
| **Beneficio** | Separación clara de lógica de análisis por tipo de nodo AST. Cada visitor es responsable de un tipo de estructura de control |
| **Riesgo** | MRO puede causar conflictos de métodos si dos visitors definen `visit(node)` con el mismo nombre. Dependencia del orden de resolución de Python |

**Detalle**: Cada visitor implementa métodos como `visit_for(node)`, `visit_if(node)`, `visit_while(node)`. El analyzer itera sobre el AST y delega al visitor correspondiente según `node["type"]`. Los visitors acumulan costos en `self.rows[]` heredado de `BaseAnalyzer`.

**Variante en TypeScript**: No hay visitors formales en el frontend, pero el AST builder (`ast-builder.ts`) usa un patrón similar para recorrer el parse tree ANTLR.

---

### 3. Builder

| Atributo | Descripción |
|---|---|
| **Evidencia** | `apps/api/app/modules/export/snapshot_builder.py` (1188 líneas) construye `AalieAnalysisSnapshotV1` paso a paso; `apps/api/app/modules/export/document_model.py` (2459 líneas) construye `DocumentModel` |
| **Uso** | Export pipeline: `build_export_state()` → `build_snapshot_result()` → `build_document_model()` → renderer. Cada etapa construye un objeto complejo incrementalmente |
| **Beneficio** | Separación entre construcción y representación. El snapshot es una representación intermedia inmutable que puede renderizarse a múltiples formatos |
| **Riesgo** | Los builders son extensos (1188 y 2459 líneas). Acoplamiento al schema del snapshot |

**Detalle**: `build_export_state()` orquesta parse → classify → analyze → trace y ensambla todos los resultados. `build_snapshot_result()` organiza en secciones con estado (`SnapshotSection<T>`: available/not_requested/not_supported/not_implemented/missing_data). `build_document_model()` transforma a `DocumentModel` con secciones, tablas y contenido plano.

**Variante**: `RecursiveMethodStepBundle` y sus step builders (`master_steps.py`, `iteration_steps.py`, `characteristic_steps.py`, `recursion_tree_steps.py`) construyen paso a paso un bundle de análisis recursivo con status, math, derivación y audit trail.

---

### 4. Adapter / Proxy

| Atributo | Descripción |
|---|---|
| **Evidencia** | 12 BFF routes bajo `apps/web/src/app/api/` — todas actúan como proxy al backend FastAPI |
| **Uso** | Cada BFF route (`/api/analyze/open`, `/api/llm`, etc.) recibe request del frontend, lo reenvía al backend, y devuelve la respuesta. Ejemplo: `analyze/open/route.ts:25` hace `fetch(`${API_BASE}/analyze/open`, ...)` |
| **Beneficio** | El frontend no conoce la dirección del backend. El BFF puede agregar validación, normalización de errores, y lógica de clasificación suplementaria (ej. `/api/llm/classify`). Entorno configurable via `API_INTERNAL_BASE_URL`, `API_BASE_URL`, `DOCKER` |
| **Riesgo** | Latencia adicional (doble hop). El BFF no cachea respuestas (`cache: "no-store"`). Si el BFF y backend están en el mismo proceso (Docker), el proxy es innecesario |

**Detalle**: Todos los BFF routes siguen el mismo patrón:
1. `getApiBase()` determina URL base del backend
2. `fetch()` con `cache: "no-store"`
3. Si backend responde JSON válido → passthrough
4. Si no → `{ ok: false, error }` con status 502/503

**Adapter**: `parsing/adapter.py` — `is_grammar_available()` adapta el parser Python para reportar disponibilidad al router.

---

### 5. Facade

| Atributo | Descripción |
|---|---|
| **Evidencia** | `apps/api/app/modules/analysis/service.py` — `analyze_algorithm()` es fachada sobre parsing, clasificación, selección de analizador, invariantes |
| **Uso** | El service facade orquesta múltiples subsistemas y expone una interfaz simple: `analyze_algorithm(source, mode, ...)` |
| **Beneficio** | Los routers no conocen la complejidad interna. El análisis de todos los casos (`mode="all"`) queda abstraído detrás de una sola función |
| **Riesgo** | La fachada tiende a acumular lógica (425 líneas en `service.py`). El manejo de errores mezcla responsabilidades |

**Otros facades**:
- `export/service.py` (`ExportService.render_report()`) — facade sobre snapshot builder, document model, renderers
- `quizzes/service.py` — facade sobre repository, selector, grading
- `llm/service.py` — facade sobre providers
- `trace_service.py` (`build_trace_result()`) — facade sobre executor, structured trace builder

---

### 6. Registry

| Atributo | Descripción |
|---|---|
| **Evidencia** | `apps/api/app/modules/analysis/analyzers/registry.py:9-13` — `AnalyzerRegistry` dict; `apps/api/app/modules/quizzes/grading.py:80-91` — dispatch por `mode` |
| **Uso** | AnalyzerRegistry mapea tipo de algoritmo a clase. Quiz grading dispatch a 5 funciones según `gradingPolicy.mode` |
| **Beneficio** | Nuevos analizadores o políticas de grading se agregan sin modificar el dispatch central |
| **Riesgo** | Registry plano (dict) — no hay validación de que todas las estrategias implementen la misma interfaz |

**Grading registry** (implícito en `grading.py:80-91`):
```python
if mode == "all_or_nothing": score = grade_all_or_nothing(...)
elif mode == "exact_set": score = grade_exact_set(...)
elif mode == "partial_credit": score = grade_partial_credit(...)
elif mode == "ordered_exact": score = grade_ordered_exact(...)
elif mode == "pairwise": score = grade_pairwise(...)
```

**Pattern registry** (while engine): `_PATTERNS` list en `engine.py:91-104` — 12 patrones en orden de prioridad, cada uno con `matches()` y `derive_iterations()`.

---

### 7. Snapshot / Document Model

| Atributo | Descripción |
|---|---|
| **Evidencia** | `packages/types/src/export-snapshot.ts` — `AalieAnalysisSnapshotV1` schema version `1.0.0`; `apps/api/app/modules/export/snapshot_builder.py` — constructor |
| **Uso** | El snapshot es una representación inmutable de todo el análisis. Una vez construido, es la única fuente de verdad para export. `DocumentModel` es otra capa de transformación para renderizado |
| **Beneficio** | Consistencia: lo que se ve en UI y lo que se exporta usan el mismo snapshot. Versionado (`schemaVersion: "1.0.0"`) permite evolución controlada |
| **Riesgo** | Snapshots grandes pueden ser costosos de construir. La inmutabilidad implica que variaciones del análisis requieren snapshots completos separados |

**Estructura del snapshot**:
- `meta`: análisis ID, origen, tipo de algoritmo, validez, warnings
- `input`: pseudocódigo original, parámetros, parsing, trace summary
- `internal`: AST, clasificación, recurrencia, matemática intermedia
- `globalResult`: casos (worst/best/avg) con T_open, T_polynomial, notaciones
- `byAlgorithm`: `IterativeSnapshotSection` + `RecursiveSnapshotSection` (seleccionado por tipo)
- `comparative`: LLM + GPU/CPU
- `institutional`: disclaimer, limitaciones

---

### 8. Template Method

| Atributo | Descripción |
|---|---|
| **Evidencia** | `apps/api/app/modules/analysis/analyzers/base.py` — `BaseAnalyzer` define métodos compartidos: `add_row()`, `push_multiplier()`, `build_t_open()`, `result()` |
| **Uso** | `IterativeAnalyzer` y `RecursiveAnalyzer` heredan de `BaseAnalyzer` y extienden con su propia lógica de `analyze()` |
| **Beneficio** | Reducción de código duplicado. La estructura de `build_t_open()` y `result()` es común |
| **Riesgo** | La herencia múltiple (MRO) complica el flujo de llamadas. Subclases deben conocer detalles internos de `BaseAnalyzer` (ej. `self.rows`, `self.loop_stack`) |

**Métodos plantilla clave**:
- `add_row(line, kind, ck, count, ...)` — todas las subclases usan este método para agregar filas de costo
- `build_t_open()` → construye ecuación de eficiencia
- `result()` → ensambla respuesta estándar con totals, notas, whileBlocks
- `push_multiplier()` / `pop_multiplier()` — manejo de contexto de bucles

---

### Patrones menores identificados

| Patrón | Evidencia | Uso |
|---|---|---|
| **Factory** | `execution/derivations/builder_factory.py` | Crea builders de structured trace según tipo de algoritmo |
| **Singleton** | `export/router.py:19` — `export_service = ExportService()` | Instancia única del servicio de export |
| **Chain of Responsibility** | `analysis/while_engine/engine.py:260-318` | Patrones de WHILE en cadena: si uno no matchea, pasa al siguiente |
| **Null Object** | `invariants/` — `empty_loop_invariant()` | Objeto invariante vacío cuando no aplica (evita null checks) |
| **Data Transfer Object** | `packages/types/src/export-snapshot.ts` → `AalieAnalysisSnapshotV1` | Snapshot completo como DTO entre backend y export renderers |
| **Lazy Initialization** | `quizzes/repository.py:38` — `@lru_cache` en `load_dataset()` | Dataset de quizzes se carga una vez y se cachea |

## Archivos relacionados

- `system-architecture.md`
- `backend-architecture.md`
- `package-architecture.md`
- `data-flow.md`
