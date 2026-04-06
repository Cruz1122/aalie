# Arquitectura frontend

**Tipo:** descriptiva

## Propósito

Ubicar las rutas, componentes y estados críticos del frontend para que un dev nuevo sepa dónde tocar cada feature.

## Alcance

Cubre el flujo del analizador, el BFF Next, la persistencia local y las vistas principales.

## Fuente de verdad

- `apps/web/src/app/`
- `apps/web/src/components/`
- `apps/web/src/hooks/`
- `apps/web/src/lib/`

## Estructura

### Rutas clave

- `/[locale]/`: entrada principal.
- `/[locale]/analyzer`: editor, análisis, trace y export.
- `/[locale]/examples`: catálogo de ejemplos.
- `/[locale]/user-guide`: guía integrada.
- `/api/analyze/*`, `/api/grammar/parse`, `/api/health`: proxies al backend.
- `/api/llm/*`: BFF para configuración y consumo de Gemini.

### Componentes críticos

- `AnalyzerEditor`: edición y validación local.
- `EditorSupportPanel`: panel lateral curado de escritura rápida.
- `PaginationControls`: paginación compartida para examples y panel de snippets.
- `IterativeAnalysisView` y `RecursiveAnalysisView`: render de resultados.
- `TraceDedicatedView`: seguimiento operativo.
- `ExportFormatSelector`: descarga de artefactos.
- `ChatBot`, `ComparisonModal`, `LoopInvariantModal`, `TxtImportModal`.

### Estado y persistencia

- `sessionStorage` guarda código y resultados del análisis actual.
- `localStorage` guarda API key del usuario.
- hooks y contextos gestionan progreso, chat, loader y refresco de trace.

### Flujo editor -> análisis -> vistas

1. edición o importación `.txt`;
2. autocompletado y ayudas de escritura;
3. parseo/validación;
4. clasificación y detección de métodos;
5. análisis;
6. render de vista iterativa o recursiva;
7. trace, comparación LLM y export sobre el mismo estado.

### Soporte de escritura y catálogo

- `features/analyzer/editor-support/catalog/snippetCatalog.ts` define el catálogo curado visible del panel, la localización del texto insertado y la derivación de secciones;
- `features/analyzer/editor-support/catalog/algorithmCompletionSnippets.ts` deriva snippets de autocompletado a partir del catálogo de ejemplos habilitados;
- `features/analyzer/editor-support/monaco/completionCandidates.ts` construye las sugerencias de Monaco con prioridad estable: identificadores locales, snippets regulares y algoritmos completos;
- `features/analyzer/editor-support/monaco/registerPseudocodeCompletionProvider.ts` registra completions por locale y vuelve a montarlos cuando cambia el idioma activo;
- `features/analyzer/editor-support/monaco/contextInsertionRules.ts` aplica la inserción localizada final dentro del editor.

### Features activas de UI

- AST y errores de parseo;
- autocompletado contextual bilingüe;
- panel de snippets/plantillas paginado;
- selector de método recursivo;
- loop invariant;
- trace dedicado;
- comparación con LLM;
- GPU vs CPU;
- catálogo de ejemplos;
- importación `.txt`.

## Ejemplos

- Para cambiar el flujo de selección de método, revisar `analyzer/page.tsx` y `MethodSelector`.
- Para cambiar la integración backend de análisis o trace, revisar primero las rutas `/api/*`.

## Limites conocidos

- El frontend depende de proxies internos para evitar acoplar la UI a direcciones de backend según entorno.
- Hay features auxiliares que solo se activan cuando existe API key.

## Archivos relacionados

- `system-architecture.md`
- `llm-integration.md`
- `execution-trace-architecture.md`
