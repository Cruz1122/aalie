# Visión del producto

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | docente | evaluador
**Fuente de verdad:** `apps/api/app/modules/analysis/`, `apps/web/src/app/[locale]/analyzer/`, `apps/api/app/modules/export/`, `apps/api/app/modules/classification/`, `apps/api/app/modules/quizzes/`, `packages/grammar/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** 2.1 Resumen Ejecutivo, 2.3 Arquitectura del Software

## Propósito

Definir qué es y qué no es AALIE, cuál es su propuesta de valor operativa, a quién está dirigido, y qué principios rigen su diseño y evolución. Este documento es normativo: cualquier desviación del alcance descrito debe tratarse como error o feature no soportado.

## Alcance

Producto completo vigente a corte 2026-05-18: análisis determinista de complejidad de pseudocódigo, trazas de ejecución paso a paso, export institucional basado en snapshot, asistencia LLM opcional, curso modular JSON versionado, quizzes deterministas adaptativos, catálogo de ejemplos, e internacionalización es/en.

## Fuera de alcance

- AALIE no es un analizador de código fuente en lenguajes de propósito general (Python, Java, C++).
- AALIE no es un sistema de IA generativa que calcule complejidad; el motor determinista es la ruta principal.
- AALIE no implementa RAG, ML real, ni análisis formal de backtracking, branch and bound, o voraces.
- AALIE no es un benchmark de rendimiento GPU vs CPU (la lectura es heurística/orientativa).
- AALIE no es un LMS; los quizzes son instrumento de práctica, no de certificación.

## Contenido

### Nombre e identidad

**AALIE** (Algorithmic Analysis Live Interaction Expert) se pronuncia como *"ally"* (aliado, en inglés). El nombre refleja su propósito: actuar como un aliado pedagógico para estudiantes y profesores en cursos de análisis de algoritmos. AALIE es el nombre de la asistente virtual de la plataforma.

### Problema que resuelve

Los estudiantes de análisis de algoritmos enfrentan dificultades para conectar la complejidad teórica con código real. Las herramientas existentes son cajas negras (LLM que alucinan cotas) o requieren trabajo manual de matemáticas. AALIE ofrece un camino intermedio: un motor determinista que muestra el proceso paso a paso, con resultados reproducibles y trazables.

### Audiencia objetivo

- **Estudiantes** de pregrado en análisis de algoritmos (tercero-cuarto semestre de Ingeniería de Sistemas, IA o afines).
- **Profesores** que necesitan apoyo visual para explicar análisis iterativo, recursivo, recurrencias y trazas en clase.

### Principios de producto

1. **El análisis determinista es la ruta principal.** El motor basado en reglas y contratos produce resultados reproducibles. Es la fuente de verdad del sistema.
2. **El LLM es auxiliar, no la fuente de verdad.** Las funciones con modelos de lenguaje son apoyo pedagógico opcional. Sin API key, el análisis formal funciona completo.
3. **Declarar límites reales.** Cuando el motor no tiene evidencia suficiente, AALIE prefiere no inventar. Reporta `unknown`, `partial` o `no concluyente` antes que forzar una respuesta.
4. **Coherencia UI-export.** Un mismo resultado debe mantenerse idéntico entre pantalla, snapshot y archivo exportado. El snapshot es la unidad de verdad para export.
5. **Reproducibilidad académica.** Cualquier análisis ejecutado con la misma entrada debe producir exactamente el mismo resultado (oráculo determinista).

### Superficies actuales del producto

| Superficie | Descripción | Ruta de evidencia |
|---|---|---|
| Editor Monaco | Editor de pseudocódigo con validación, autocompletado, snippets, import `.txt` | `apps/web/src/app/[locale]/analyzer/` |
| Parser ANTLR4 | Gramática compartida TS/Python, generación de AST | `packages/grammar/Language.g4` |
| Clasificación | Iterativo/recursivo/híbrido/unknown desde AST | `apps/api/app/modules/classification/classifier.py` |
| Análisis iterativo | Costeo por línea, sumatorias, cierre con SymPy, notación O/Ω/Θ | `apps/api/app/modules/analysis/analyzers/iterative.py` |
| Análisis WHILE | Heurística conservadora con 12+ patrones | `apps/api/app/modules/analysis/while_engine/` |
| Análisis recursivo | Detección de recurrencias, 4 métodos (Maestro, iteración, árbol, ec. característica) | `apps/api/app/modules/analysis/analyzers/recursive.py` |
| Traza de ejecución | Paso a paso, árbol de llamadas, trace estructurado | `apps/api/app/modules/analysis/trace_service.py` |
| Loop invariant | Artefacto determinista por patrón de ciclo | `apps/api/app/modules/analysis/invariants/` |
| Snapshot y export | Markdown, LaTeX, PDF, ZIP con manifest.json | `apps/api/app/modules/export/snapshot_builder.py` |
| LLM opcional | Asistente, comparación, reparación, diagramas | `apps/api/app/modules/llm/service.py` |
| Curso modular | JSON versionado en espacios course + user-guide | `packages/content-catalog/catalog/spaces/` |
| Quizzes | Dashboard, sesión, evaluación determinista adaptativa, progreso localStorage | `apps/api/app/modules/quizzes/` |
| Ejemplos | Catálogo por categoría y tema | `apps/web/src/app/[locale]/examples/` |
| i18n | es/en con next-intl, contenido bilingüe | `apps/web/next-intl.config.js` |

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14.2, React 18, TypeScript 5.5, Tailwind 3.4, Monaco Editor, KaTeX, React Flow |
| Backend | FastAPI, Python 3.11+, ANTLR4, SymPy, Pydantic |
| Monorepo | pnpm workspaces, packages/grammar, packages/types, packages/content-catalog |
| Calidad | pytest, ruff, ESLint, Prettier, coverage 70%, GitHub Actions (8 jobs) |
| Infra | Docker Compose, variables de entorno multi-capa |

### Demo e información del proyecto

- **Demo en vivo:** https://aalie.tumbergia.com
- **Repositorio:** https://github.com/Cruz1122/algorithmic-analysis
- **Autores:**
  - Juan Camilo Cruz Parra — Fullstack + arquitectura
  - Jhon Hander Patiño Londoño — FullStack post-MVP
  - Luz Enith Guerrero Mendieta — Coordinadora profesoral
- **Universidad:** Universidad de Caldas, Facultad de Inteligencia Artificial e Ingenierías
- **Período:** 2026-1

### Tono del documento

Técnico-académico, NO comercial. Este documento no vende capacidades. Declara lo que el sistema hace, cómo lo hace, y dónde están sus límites. Cualquier afirmación debe ser rastreable a código, tests o contratos.

## Evidencia desde código o configuración

- `README.md` raíz: define AALIE como plataforma educativa con motor determinista.
- `apps/api/app/modules/analysis/service.py`: orquesta parse -> classify -> analyze -> trace.
- `apps/api/app/modules/export/snapshot_builder.py`: snapshot versionado con contentHash.
- `.github/workflows/ci.yaml`: 8 jobs de CI con coverage gate 70%.
- `apps/api/app/modules/quizzes/schemas.py`: `QuizQuestionStatus` con estados draft/active/deprecated/archived.

## Limitaciones

- El alcance descrito corresponde al MVP vigente. No incluye backlog futuro.
- Backtracking, branch and bound y voraces solo existen como contenido pedagógico en el curso, no como análisis formal.
- El análisis de caso promedio usa modelo uniforme; no hay modelo universal de caso promedio.
- GPU vs CPU es lectura heurística/orientativa, no benchmark científico.

## Archivos relacionados

- `glossary.md` — definiciones operativas de términos del producto
- `known-limitations.md` — límites conocidos por módulo
- `final-scope.md` — tabla detallada de áreas cubiertas/no cubiertas
- `capability-map.md` — granularidad fina de capacidades
- `../02-architecture/system-architecture.md` — arquitectura del sistema
- `../03-specs/analysis-engine-spec.md` — contrato normativo del motor
