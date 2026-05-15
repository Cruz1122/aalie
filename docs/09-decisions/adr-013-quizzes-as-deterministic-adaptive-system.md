# ADR-013: Quizzes como sistema adaptativo determinista

**Tipo:** decisión
**Estado:** aceptada
**Fecha:** 2026-05-18
**Fuente de verdad:** `packages/quiz-engine/`, `packages/content-data/quizzes/`, `apps/web/src/hooks/useQuizEngine.ts`

## Contexto

El proyecto incluye quizzes interactivos como parte del curso teórico de complejidad algorítmica. Se evaluó cómo implementar la lógica de quizzes: como contenido estático con preguntas fijas, como sistema adaptativo basado en desempeño del estudiante, o como sistema generativo donde el LLM produce preguntas sobre la marcha. La decisión debía balancear valor pedagógico, determinismo, costo operativo, y mantenibilidad.

## Decisión

Los quizzes se implementan como un sistema adaptativo determinista basado en reglas, no generativo ni puramente estático.

- Las preguntas se definen en JSON versionado dentro de `packages/content-data/quizzes/`, con schema tipado que incluye: `question`, `options`, `correctAnswer`, `distractorExplanations`, `difficulty`, `tags`, `prerequisites`.
- El `quiz-engine` selecciona la siguiente pregunta basado en reglas deterministas: dificultad ajustada por desempeño acumulado, refuerzo de temas con errores, y bloque de temas dominados.
- No hay generación de preguntas por LLM; todo el banco de preguntas es curado editorialmente.
- El engine no usa ML ni modelos probabilísticos; la adaptación es puramente basada en umbrales y contadores.

## Alternativas consideradas

- **Quizzes generados por LLM**: Cada pregunta se genera on-demand. Rechazado por inconsistencia, posible alucinación de respuestas correctas, costo por pregunta, y falta de control sobre la calidad pedagógica y el nivel de dificultad.
- **Quizzes estáticos (misma secuencia siempre)**: Simple de implementar pero sin adaptación al ritmo del estudiante. Los estudiantes avanzados se aburren con preguntas básicas; los que tienen dificultades se frustran con preguntas avanzadas.
- **Sistema adaptativo con ML (IRT/BKT)**: Modelos de Teoría de Respuesta al Ítem o Bayesian Knowledge Tracing. Descartado por complejidad de implementación, necesidad de datos históricos de calibración, y overkill para el alcance del curso.

## Consecuencias positivas

- Experiencia adaptativa: el estudiante recibe preguntas acordes a su nivel y recibe refuerzo en áreas débiles.
- Sin costo operativo variable (no hay llamadas LLM por pregunta).
- El banco de preguntas es curado, versionado, y auditable: no hay riesgo de contenido incorrecto o engañoso.
- El comportamiento del engine es determinista: mismo historial de respuestas produce la misma siguiente pregunta.

## Consecuencias negativas

- El banco de preguntas requiere mantenimiento editorial continuo para ampliar cobertura y evitar memorización.
- La adaptación es relativamente simple (umbrales) comparada con sistemas basados en IRT; puede no capturar matices finos de competencia.
- Sin generación dinámica, el número total de preguntas es finito; estudiantes que repiten el curso pueden encontrar las mismas preguntas.

## Impacto en mantenimiento

- Agregar nuevas preguntas requiere solo editar el JSON del banco y regenerar el catálogo; no requiere cambios en el engine.
- El esquema de reglas de adaptación vive en `packages/quiz-engine/` y puede ajustarse sin modificar el banco de preguntas.
- La decisión no impide migrar a un sistema IRT en el futuro si se recolectan suficientes datos de intentos.

## Evidencia

- `packages/quiz-engine/src/adaptative-selector.ts`: implementa `selectNextQuestion(history, availableQuestions, config)` con reglas de dificultad progresiva, refuerzo de errores, y umbral de dominio.
- `packages/content-data/quizzes/`: contiene bancos JSON con preguntas organizadas por módulo y técnica.
- `apps/web/src/hooks/useQuizEngine.ts`: hook que consume el engine y expone estado de quiz, pregunta actual, y feedback.
- El LLM no es invocado en ningún punto del flujo de quizzes; no hay endpoint `/api/llm/quiz-generate`.

## Archivos relacionados

- `../03-specs/quizzes-spec.md`
- `../03-specs/content-modules-spec.md`
- `adr-011-localstorage-for-progress-and-quizzes.md`
- `adr-008-unified-content-spaces.md`
