# Alcance final del producto

**Tipo:** normativa
**Estado:** final
**Audiencia:** evaluador | dev | docente
**Fuente de verdad:** `apps/api/app/modules/`, `apps/web/src/app/`, `packages/`, `.github/workflows/ci.yaml`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** 2.1 Resumen Ejecutivo, 2.3 Arquitectura del Software, 2.6 Detalles de Implementación

## Propósito

Declarar de forma contractual qué áreas del producto están implementadas, cuáles están parcialmente cubiertas, y cuáles están explícitamente fuera de alcance. Sirve como fuente de verdad para evaluadores, desarrolladores y autores de contenido.

## Alcance

Este documento cubre todas las áreas funcionales del monorepo a corte 2026-05-18. Cada área incluye estado, evidencia desde código y riesgo asociado.

## Fuera de alcance

- No cubre planes de desarrollo futuro ni backlog.
- No cubre features no expuestas en UI o API.
- No cubre documentación de usuario final (guías de uso).

## Contrato

Cada fila de las tablas siguientes es un compromiso contractual. Si una funcionalidad se declara como "implementado", debe existir evidencia en código, test o configuración. Si se declara "no implementado", no debe existir ruta de ejecución que lo active.

## Invariantes

- El motor determinista no puede depender de LLM para producir resultados.
- El snapshot no puede recalcular resultados; todo debe venir precargado.
- El contenido curricular no puede requerir cambios en el renderer para ser visualizado.
- Los quizzes no pueden depender de API keys de terceros.

## Errores esperables

- Parseo fallido con errores de sintaxis -> `ok: false`, `errors[]` con línea/columna.
- Análisis no soportado (backtracking, etc.) -> `ok: false` con mensaje explícito.
- WHILE sin patrón reconocido -> `status: "unknown"` o `"partial"`, no invención.
- Recurrencia fuera de forma -> `unsupported` o `not_applicable`.
- LLM sin API key -> `LLM_API_KEY_REQUIRED`.
- PDF sin pdflatex -> error de compilación.

## Áreas cubiertas

| Área | Funcionalidad | Estado | Evidencia | Riesgo |
|---|---|---|---|---|
| Editor | Monaco, validación en tiempo real, autocompletado, snippets, import `.txt` | Implementado | `apps/web/src/app/[locale]/analyzer/page.tsx` | Bajo |
| Parser | ANTLR4, gramática compartida TS/Python, parseo a AST, `POST /grammar/parse` | Implementado | `packages/grammar/Language.g4`, `apps/api/app/modules/parsing/` | Bajo |
| AST | Nodos tipados con línea/columna, 19+ tipos de nodo | Implementado | `packages/types/src/index.ts` (interfaces BaseNode, AstNode) | Bajo |
| Clasificación | Iterativo/recursivo/híbrido/unknown desde AST | Implementado | `apps/api/app/modules/classification/classifier.py` | Bajo |
| Análisis iterativo | Costeo por línea, sumatorias abiertas/cerradas, notación O/Ω/Θ, SymPy | Implementado | `apps/api/app/modules/analysis/analyzers/iterative.py`, `utils/summation_closer.py` | Medio (SymPy bottleneck) |
| WHILE | Heurística conservadora, 12 patrones, estados bounded/unbounded/unknown | Implementado | `apps/api/app/modules/analysis/while_engine/engine.py`, `patterns/` | Medio (heurística no cubre todos los casos) |
| Recurrencias | Teorema Maestro, iteración, árbol de recursión, ecuación característica, detección automática | Implementado | `apps/api/app/modules/analysis/analyzers/recursive.py`, `analyzers/master_steps.py`, `iteration_steps.py`, `recursion_tree_steps.py`, `characteristic_steps.py` | Medio (formas no estándar no cubiertas) |
| Traza | Paso a paso, árbol de llamadas, trace estructurado, `POST /analyze/trace` | Implementado | `apps/api/app/modules/analysis/trace_service.py`, `execution/` | Medio (inputs heurísticos) |
| Loop invariant | Determinista, 18+ patrones de ciclo, secciones property/init/maintenance/finalization | Implementado | `apps/api/app/modules/analysis/invariants/` | Medio (confianza variable) |
| Snapshot | Versionado (`schemaVersion: 1.0.0`), `snapshotId` UUID5, `contentHash` SHA-256 | Implementado | `apps/api/app/modules/export/snapshot_builder.py` | Bajo |
| Export | Markdown, LaTeX, PDF, ZIP con `manifest.json`, `snapshot.json` | Implementado | `apps/api/app/modules/export/engine.py`, `markdown_renderer.py`, `latex_renderer.py`, `zip_bundle.py` | Medio (PDF requiere pdflatex) |
| LLM | Asistente opcional, 5 jobs (general, repair, compare, explain, parser_assist), Gemini/OpenAI-compatible, sin RAG | Implementado | `apps/api/app/modules/llm/service.py`, `config.py`, `providers.py` | Medio (depende de API key/proveedor) |
| Curso modular | JSON versionado, espacios course + user-guide, 20 módulos por locale, 476 preguntas | Implementado | `packages/content-catalog/catalog/spaces/` | Bajo |
| Quizzes | Dashboard, sesión adaptativa determinista, evaluación backend, localStorage, 476 preguntas activas ES/EN | Implementado | `apps/api/app/modules/quizzes/`, `packages/content-data/quizzes/` | Medio (banco requiere curaduría continua) |
| Ejemplos | Catálogo por categoría, temas, nivel de soporte | Implementado | `apps/web/src/app/[locale]/examples/` | Bajo |
| i18n | es/en, next-intl, rutas localizadas, contenido bilingüe | Implementado | `apps/web/next-intl.config.js`, `apps/web/messages/` | Bajo |
| CI/testing | 8 jobs, coverage gate 70%, oráculos, contract/system/fast lanes | Implementado | `.github/workflows/ci.yaml` | Bajo |
| Docker | Docker Compose, builds de API, test de configuración | Implementado | `infra/compose.yml`, `apps/api/Dockerfile` | Bajo |
| Despliegue | Variables de entorno multi-capa, local/Docker, BFF proxy | Implementado | `infra/`, `docs/06-operations/environment-variables.md` | Bajo |
| Diagramas deterministas | Diagramas de flujo, árboles de recursión sin LLM | Implementado | `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS` | Bajo |

## Áreas parciales o no cubiertas

| Área | Funcionalidad | Estado | Evidencia | Riesgo |
|---|---|---|---|---|
| RAG | Retrieval-Augmented Generation | No implementado | No hay pipeline de retrieval ni embeddings en el código | N/A |
| ML real | Modelos de machine learning para análisis | No implementado | No hay entrenamiento, inferencia ni dataset de ML | N/A |
| Backtracking/BB/Voraces | Análisis formal de complejidad | No cubierto (solo contenido pedagógico o clasificación si hay evidencia) | `packages/content-catalog/catalog/spaces/course/*/modules/18-backtracking.module.json`, `19-branch-and-bound.module.json`, `17-greedy-algorithms.module.json` | Bajo (contenido educacional, no análisis) |
| GPU vs CPU | Recomendación de idoneidad estructural | Heurístico/orientativo | `apps/api/app/modules/analysis/` — sin benchmark científico | Medio (puede malinterpretarse como benchmark) |
| Caso promedio universal | Análisis de caso promedio para todo algoritmo | No cubierto (depende de modelo uniforme/simbólico) | `apps/api/app/modules/analysis/models/avg_model.py` | Medio |
| PDF export | Generación de PDF | Requiere pdflatex en runtime | `apps/api/app/modules/export/latex_compiler.py` | Medio (dependencia externa) |
| Análisis espacial | Complejidad espacial (memoria) | No cubierto formalmente | No hay pipeline de análisis espacial | N/A |

## Casos soportados

- Algoritmos iterativos con ciclos FOR, WHILE, REPEAT-UNTIL.
- Algoritmos recursivos lineales, divide-and-conquer, múltiples llamadas.
- Híbridos (iterativo + recursivo).
- WHILE con contadores lineales, crecimiento geométrico, búsqueda binaria, Euclides, flag kill, interval shrink, sentinel scan, gap shrink, gnome sort cursor, merge two pointers, phase loop composition, shrinking window bidireccional.
- Recurrencias de forma `T(n) = a·T(n/b) + f(n)` (Maestro), `T(n) = c₁T(n-1) + ... + cₖT(n-k) + g(n)` (ec. característica).
- Export en entornos con y sin pdflatex (Markdown/LaTeX siempre disponibles).
- Quizzes con 5 tipos de pregunta: single_choice, multiple_choice, true_false, ordering, match_pairs.

## Casos no soportados

- Análisis formal de backtracking, branch and bound, algoritmos voraces.
- Cálculo de caso promedio sin modelo probabilístico definido.
- WHILE con múltiples variables de control no monotónicas (resultado: no concluyente).
- Recurrencias no lineales o con formas no estándar.
- Análisis de complejidad espacial.
- RAG, ML, redes neuronales.
- Export PDF sin pdflatex instalado.
- Parser para lenguajes de propósito general (Java, Python, etc.).

## Archivos relacionados

- `vision.md` — visión del producto
- `capability-map.md` — granularidad fina de capacidades
- `known-limitations.md` — límites conocidos por módulo
- `../03-specs/analysis-engine-spec.md` — contrato normativo del motor
- `../03-specs/while-heuristics-spec.md` — contrato de heurísticas WHILE
