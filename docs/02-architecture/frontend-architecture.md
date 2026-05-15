# Arquitectura frontend

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/web/src/app/`, `apps/web/src/components/`, `apps/web/src/hooks/`, `apps/web/src/lib/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** UI, BFF, i18n, estado local

## Propósito

Documentar las rutas, componentes críticos, BFF y patrones de estado del frontend de AALIE.

## Alcance

Cubre UI routes, i18n, Monaco Editor, BFF proxy, componentes principales, estado local, persistencia y manejo de errores.

## Fuera de alcance

Detalle del analysis engine UI (ver `analysis-engine-overview.md`), LLM assistant (ver `llm-integration.md`).

## Contenido

### Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 14.2 | App Router, Server Components, API Routes |
| React | 18 | UI components |
| TypeScript | 5.5 | Tipado estático |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| Monaco Editor | 0.54 | Editor de pseudocódigo |
| KaTeX | 0.16 | Renderizado de fórmulas matemáticas |
| React Flow | 12.10 | Árboles de recursión y diagramas de trace |
| Dagre | — | Layout automático de grafos |
| next-intl | — | Internacionalización |
| Material UI / Symbols | — | Iconos y componentes base |

### UI routes (9)

| Ruta | Propósito |
|---|---|
| `/{locale}` | Home / landing page |
| `/{locale}/analyzer` | Editor, análisis, trace y export |
| `/{locale}/examples` | Catálogo de ejemplos |
| `/{locale}/examples/[category]` | Ejemplos por categoría |
| `/{locale}/course` | Contenido modular del curso |
| `/{locale}/course/[moduleSlug]/[chapterSlug]` | Capítulo del curso |
| `/{locale}/quizzes` | Dashboard de quizzes y sesiones |
| `/{locale}/user-guide` | Guía de usuario integrada |
| `/{locale}/user-guide/[moduleSlug]` | Módulo de guía de usuario |
| `/{locale}/about-us` | Información institucional |
| `/{locale}/privacy` | Política de privacidad |
| `/{locale}/debug/grammar` | Depuración de gramática/parseo |
| `/{locale}/assistant-frame` | Frame interno para asistente embebido |

Evidencia: `apps/web/src/app/[locale]/` contiene 11 directorios: `about-us/`, `analyzer/`, `assistant-frame/`, `course/`, `debug/`, `examples/`, `privacy/`, `quizzes/`, `user-guide/` + `layout.tsx`, `page.tsx`.

### i18n

- `next-intl` para enrutamiento y traducciones
- Locales: `es` (español), `en` (inglés)
- Rutas localizadas: todas bajo `/{locale}/...`
- Fallback controlado cuando una traducción no está disponible
- Contenido del curso también es bilingüe (por módulos en content-catalog)

### Monaco Editor

- Integrado en `/{locale}/analyzer`
- Autocompletado contextual: `registerPseudocodeCompletionProvider.ts`
- Snippets desde catálogo de algoritmos: `algorithmCompletionSnippets.ts`
- Validación sintáctica local con parser ANTLR TypeScript
- Inserción localizada: `contextInsertionRules.ts`
- Panel de snippets/plantillas paginado: `PaginationControls`

### BFF routes (12)

| Endpoint BFF | Backend destino | Propósito |
|---|---|---|
| `GET /api/health` | `GET /health` | Healthcheck del backend |
| `POST /api/grammar/parse` | `POST /grammar/parse` | Parseo de pseudocódigo |
| `POST /api/analyze/open` | `POST /analyze/open` | Análisis de complejidad |
| `POST /api/analyze/detect-methods` | `POST /analyze/detect-methods` | Detección de métodos recursivos |
| `POST /api/analyze/trace` | `POST /analyze/trace` | Traza de ejecución |
| `POST /api/llm` | `POST /llm` | Jobs LLM (general, repair, compare, explain) |
| `GET /api/llm/status` | `GET /llm/status` | Estado/configuración LLM |
| `POST /api/llm/classify` | `POST /classify` | Clasificación vía backend (proxy directo) |
| `POST /api/quizzes/session` | `POST /quizzes/attempts` | Crear sesión de quiz |
| `POST /api/quizzes/evaluate` | `POST /quizzes/attempts/evaluate` | Evaluar respuestas |
| `GET /api/quizzes/summary` | `GET /quizzes/dataset/summary` | Resumen del banco |
| `GET /api/quizzes/taxonomy` | `GET /quizzes/taxonomy` | Taxonomía del banco |

Evidencia: 12 archivos `route.ts` bajo `apps/web/src/app/api/`.

### Componentes críticos

| Componente | Ruta | Propósito |
|---|---|---|
| `AnalyzerEditor` | `[locale]/analyzer` | Editor Monaco + validación |
| `EditorSupportPanel` | `[locale]/analyzer` | Panel lateral de snippets |
| `IterativeAnalysisView` | `[locale]/analyzer` | Render análisis iterativo |
| `RecursiveAnalysisView` | `[locale]/analyzer` | Render análisis recursivo |
| `TraceDedicatedView` | `[locale]/analyzer` | Vista de traza paso a paso |
| `ExportFormatSelector` | `[locale]/analyzer` | Selector de formato de exportación |
| `ChatBot` | — | Chat LLM (modal) |
| `ComparisonModal` | — | Comparación LLM (modal) |
| `LoopInvariantModal` | — | Loop invariant (modal) |
| `RecursiveInvariantModal` | — | Invariante recursivo (modal) |
| `TxtImportModal` | — | Importación de archivos .txt |
| `PaginationControls` | — | Paginación compartida |
| `EmbeddedAssistantLauncher` | — | Lanzador flotante del asistente embebido |

### Estado y persistencia

| Storage | Contenido |
|---|---|
| `sessionStorage` | Código fuente, resultados del análisis actual |
| `localStorage` | API key LLM, progreso de quizzes (intentos recientes, dominio por habilidad, contenido estudiado) |

### Patrones de error

- BFF routes envuelven llamadas al backend con `try/catch`
- Backend unreachable → `{ ok: false, error: "..." }` con status 502/503
- Parsing errors → `{ ok: false, errors: [{ line, column, message }] }`
- Analysis errors → `{ ok: false, errors: [{ message }] }` + `loopInvariant` siempre presente
- Fallback: `ok: false` con error descriptivo

### Embedded assistant

- `assistant-frame` es un iframe mismo-origen que aísla shell e historial del chat
- Sincronización host → frame via `postMessage`
- Contexto estructurado: superficie, metadatos, resultados visibles, código fuente, panel/modal en foco
- Serialización determinista del contexto en `POST /api/llm`

## Evidencia desde código

- UI routes: `apps/web/src/app/[locale]/` tiene 11 subdirectorios
- BFF routes: 12 archivos en `apps/web/src/app/api/`
- Monaco completion: `lib/` y `features/analyzer/editor-support/monaco/`
- Embedded assistant: `components/assistant/EmbeddedAssistantLauncher.tsx`
- i18n: `next-intl` config en layout.tsx

## Limitaciones

- El frontend depende de proxies BFF para evitar acoplar la UI a direcciones de backend
- Funciones auxiliares (LLM, comparison) solo se activan con API key
- No hay Service Workers — offline no está soportado
- UI de quizzes se basa en localStorage; no hay sincronización server-side de progreso

## Archivos relacionados

- `system-architecture.md`
- `backend-architecture.md`
- `llm-integration.md`
- `data-flow.md`
