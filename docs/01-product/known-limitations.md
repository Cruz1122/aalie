# Limitaciones conocidas

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | evaluador | docente | estudiante
**Fuente de verdad:** `apps/api/app/modules/` (tests de borde), `apps/api/tests/` (oráculos), `apps/api/app/modules/export/constants.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** 2.8 Limitaciones y Trabajo Futuro

## Propósito

Centralizar límites reales del sistema para evitar promesas incorrectas y orientar soporte, pruebas y mantenimiento. Cada límite debe tener evidencia en código, test o contrato.

## Alcance

Incluye límites del parser, clasificación, análisis iterativo, WHILE, recurrencias, trace, snapshot, export, LLM, quizzes y contenido.

## Fuente de verdad

- tests contract y system en `apps/api/tests/`;
- `apps/api/app/modules/analysis/` (analyzers, while_engine, invariants);
- `apps/api/app/modules/export/` (snapshot_builder, engine, latex_compiler);
- `apps/api/app/modules/llm/` (service, config);
- `apps/web/src/app/api/llm/` (BFF proxy);
- `packages/content-data/quizzes/` (bancos de preguntas).

## Contrato

Toda limitación aquí listada es un compromiso de comportamiento. Si un caso cruza un límite documentado, el sistema debe responder explícitamente (error, `unsupported`, `unknown`, advertencia), no fallar silenciosamente ni inventar resultados.

## Estructura

### Parser y AST

- **La gramática no es un lenguaje de propósito general.** La sintaxis soportada es la definida por `Language.g4`. Todo lo que quede fuera debe fallar con error de parseo explícito (línea/columna/mensaje).
- **La notación aceptada idealmente es más amplia que la cobertura efectiva del motor posterior.** Un pseudocódigo puede parsear correctamente pero producir análisis no concluyente.
- **No hay normalización de pseudocódigo.** El snapshot marca `normalizedPseudocode` como no implementado.

### Clasificación

- La clasificación solo detecta patrones estructurales básicos (presencia de FOR/WHILE/REPEAT vs llamadas recursivas).
- Algoritmos con recursión indirecta (A llama a B llama a A) pueden no ser detectados como recursivos.

### Análisis iterativo

- **WHILE usa heurística conservadora:** el motor reconoce patrones frecuentes pero no adivina conteos cuando no hay señal suficiente. Estados resultantes: `bounded` (cota determinada), `unbounded` (no terminación probada), `unknown` (sin evidencia suficiente).
- **Niveles de evidencia en WHILE:** `strong` (coincidencia exacta de patrón), `medium` (clasificación base), `weak` (sin patrón, modo especulativo), `contradictory` (señales mixtas).
- **SymPy es el cuello de botella** en simplificaciones y cierres de sumatorias complejas. Expresiones muy grandes pueden timeout o producir resultados no simplificados.
- **Caso promedio no es universal.** Depende del modelo uniforme o simbólico. Sin modelo definido, no hay análisis de caso promedio.
- **No hay análisis de caso promedio para algoritmos recursivos** con modelo probabilístico.

### Análisis recursivo

- **Los métodos cubren solo familias concretas de recurrencias:** `divide_conquer` y `linear_shift`. Recurrencias no lineales, con términos mixtos o formas no estándar quedan fuera.
- **Hay salidas parciales o `unsupported`** cuando la forma detectada sale de cobertura.
- **Backtracking, branch and bound, voraces: NO están cubiertos como análisis formal.** Existen únicamente como contenido pedagógico en el curso modular (módulos 17, 18, 19). El motor puede clasificarlos como recursivos si detecta llamadas, pero no produce análisis de complejidad específico para estas técnicas.

### Trace

- **La generación de inputs por defecto para trace es heurística** y puede no representar todos los casos pedagógicos deseados (usa `n=5` por defecto, detecta arrays por nombre `A`).
- **El trace puede truncarse** por profundidad de recursión o por seguridad operativa. El snapshot reporta `truncated: true` con `truncationReason`.
- **El trace es pedagógico, no es una prueba formal** de comportamiento del algoritmo. Muestra ejecución con inputs concretos, no demostración para todo tamaño de entrada.
- **Los microsegundos en trazas son estimaciones,** no mediciones reales. Se excluyen del snapshot canónico.

### Snapshot y export

- **El PDF depende de `pdflatex` y del toolchain TeX instalado.** Si no está disponible, el export debe fallar explícitamente (no producir un PDF vacío o corrupto).
- **El export NO debe recalcular nada fuera del snapshot.** Si falta información, debe declararlo como no disponible.
- **La exportación ZIP incluye** `report.*`, `snapshot.json`, `manifest.json`, assets de diagramas y logos institucionales.
- **El snapshot canónico excluye** campos `microseconds` y `tokens` de los pasos de trace (no deterministas).

### LLM

- **La integración LLM es opcional.** Sin API key válida, todo el análisis determinista funciona sin cambios.
- **Las respuestas LLM no sustituyen el contrato determinista del motor.** Son apoyo pedagógico.
- **Disponibilidad, cuotas, latencia y formato dependen del proveedor configurado** (`gemini` o `openai_compatible`).
- **No hay RAG.** El LLM recibe contexto del asistente, pero no hay retrieval aumentado por documentos.
- **No hay ML real.** No hay modelos entrenados, inferencia ni datasets de ML.
- **La comparación LLM** compara el resultado determinista con la opinión del LLM. No es una validación formal.

### Quizzes

- **El banco de preguntas depende de curaduría continua.** A corte 2026-05-18, los bancos ES y EN tienen 476 preguntas activas cada uno. La calidad y pertinencia de las preguntas depende de revisión manual.
- **El progreso del estudiante se persiste en localStorage.** No hay persistencia en backend. Cambiar de navegador o borrar datos locales pierde el progreso.
- **No hay gamificación, leaderboards ni certificaciones.**
- **Los quizzes son instrumento de práctica, no de evaluación certificada.**

### Contenido

- **Los módulos 17-19 (greedy, backtracking, branch and bound) son pedagógicos.** No tienen análisis formal asociado en el motor.
- **El contenido es JSON versionado.** Cambios estructurales requieren actualizar schemas y validación.
- **No hay editor de contenido en UI.** Los autores deben editar JSON directamente.

### GPU vs CPU

- **La recomendación GPU vs CPU es heurística/orientativa,** basada en patrones estructurales del algoritmo. No equivale a un benchmark de rendimiento. Es útil para discusión didáctica pero no debe citarse como medición.

## Ejemplos

- Un WHILE con varias variables de control no monotónicamente relacionadas puede terminar en status `unknown`.
- Una recurrencia fuera de forma estándar (ej: `T(n) = T(n/2) + T(n/3) + n`) puede quedar documentada y mostrada sin una conclusión matemática fuerte.
- Un algoritmo de backtracking (ej: N-Reinas) se clasifica como recursivo pero su análisis de complejidad no está soportado formalmente.
- Si un estudiante solicita export PDF sin pdflatex, el sistema debe responder con error explícito.
- Si se intenta caso promedio sin modelo probabilístico, el motor usa modelo `uniform` por defecto con nota aclaratoria.

## Archivos relacionados

- `glossary.md` — definiciones operativas
- `final-scope.md` — áreas cubiertas/no cubiertas
- `capability-map.md` — granularidad fina
- `../03-specs/while-heuristics-spec.md` — contrato de heurísticas WHILE
- `../03-specs/recurrence-methods-spec.md` — contrato de métodos de recurrencia
- `../03-specs/report-snapshot-spec.md` — contrato de snapshot
