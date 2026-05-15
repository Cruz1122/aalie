# ADR-012: Sin RAG en la versión final

**Tipo:** decisión
**Estado:** aceptada
**Fecha:** 2026-05-18
**Fuente de verdad:** `apps/api/app/modules/llm/`, `apps/web/src/app/api/llm/`, `packages/llm-client/`

## Contexto

Durante el diseño de la asistencia LLM se consideró la inclusión de Retrieval-Augmented Generation (RAG) para que el LLM pudiese consultar documentación interna, ejemplos canónicos, o pseudo-código histórico al generar explicaciones pedagógicas. La hipótesis inicial era que RAG mejoraría la precisión de las explicaciones y permitiría respuestas contextualizadas sin reentrenar el modelo.

## Decisión

La versión final del producto no incluye RAG. El LLM opera en modo sin contexto aumentado: recibe el pseudocódigo, el snapshot de análisis, y un prompt fijo, pero no consulta una base de conocimiento adicional ni recupera documentos externos.

- No hay pipeline de chunking, embedding, ni índice vectorial en el módulo LLM.
- El LLM recibe el snapshot como contexto estático; no hay recuperación dinámica de documentos.
- Los prompts son fijos y versionados; no se aumentan con contenido recuperado en tiempo real.
- No existe base de conocimientos vectorial (FAISS, Chroma, Pinecone) en el stack.

## Alternativas consideradas

- **RAG completo con embeddings locales**: Requiere mantener un índice vectorial, pipeline de chunking de toda la documentación, y actualización del índice cuando cambia el contenido. Overhead operativo alto para un beneficio marginal, dado que el snapshot ya contiene toda la información necesaria para el análisis.
- **RAG ligero con retrieval categorizado (por técnica/patrón)**: El LLM consulta fragmentos predefinidos según la técnica detectada. Descartado porque el prompt fijo con el snapshot ya proporciona suficiente contexto; el retrieval añade latencia sin mejorar la calidad medible de las explicaciones.
- **Fine-tuning del LLM**: Descartado por costo, necesidad de dataset etiquetado, y falta de infraestructura MLOps.

## Consecuencias positivas

- Sin dependencia de infraestructura vectorial (no hay índices, no hay pipelines de embedding).
- Sin costos de computación por chunking/embedding/retrieval.
- El comportamiento del LLM es más predecible: depende solo del snapshot + prompt, no del estado del índice.
- El tiempo de respuesta del LLM es menor sin la fase de retrieval.

## Consecuencias negativas

- El LLM no puede consultar documentación adicional fuera del snapshot; explicaciones muy profundas o referencias a ejemplos no incluidos en el prompt pueden ser menos precisas.
- Sin RAG, no hay forma de que el LLM "aprenda" de errores pasados o mejore con el uso sin cambiar el prompt manualmente.
- Si en el futuro se requiere contextualización más rica, habrá que implementar RAG desde cero.

## Impacto en mantenimiento

- El módulo LLM se mantiene como un componente aislado y descartable: no afecta la corrección del análisis si falla o no está configurado.
- Los prompts se versionan en el repositorio; cambios de comportamiento del LLM se controlan por versión de prompt, no por estado del índice.
- La decisión de no tener RAG puede revertirse en una versión futura sin cambiar el núcleo del análisis.

## Evidencia

- `apps/api/app/modules/llm/`: contiene `llm_service.py` que llama al API del proveedor sin paso de retrieval. Las funciones `build_analysis_context()` y `build_comparison_context()` usan solo el snapshot como entrada.
- `packages/llm-client/`: el cliente HTTP no incluye métodos de consulta a índice vectorial ni recuperación de documentos.
- No existe `vector-store/`, `embeddings/`, ni `rag-pipeline/` en ningún workspace del monorepo.
- `apps/web/src/app/api/llm/llm-config.ts`: la configuración LLM no incluye URL de índice vectorial ni campo de collection/namespace.

## Archivos relacionados

- `adr-005-frontend-llm-configuration.md`
- `adr-006-llm-as-optional-assistant.md`
- `adr-010-deterministic-engine-over-llm-analysis.md`
- `../03-specs/llm-assistance-spec.md`
