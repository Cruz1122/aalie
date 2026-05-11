# Guía de authoring para quizzes

**Tipo:** normativa

## Propósito

Definir cómo escribir preguntas de quiz para el curso de Análisis y Diseño de Algoritmos de forma consistente, evaluable, renderizable y útil para retroalimentación adaptativa.

## Alcance

Aplica a:

- creación manual de preguntas;
- curación del banco;
- importación desde CSV auxiliar;
- revisión de calidad;
- validación de distractores;
- referencias al contenido;
- crecimiento del banco objetivo de 500 preguntas.

No aplica a:

- preguntas sobre uso de AALIE;
- generación automática sin revisión;
- calificación con LLM;
- respuesta abierta evaluada automáticamente.

## Fuente de verdad

- `quiz-json-schema.md`
- `../03-specs/quizzes-spec.md`
- `course-json-schema.md`
- `content-model.md`
- `examples/quiz-bank.sample.json`

## Estructura

### Principios

1. Una pregunta evalúa una habilidad concreta.
2. Toda pregunta activa debe enlazarse a contenido existente.
3. Toda opción debe tener feedback.
4. El feedback debe enseñar, no solo marcar correcto/incorrecto.
5. Los distractores deben representar errores reales.
6. La dificultad refleja carga cognitiva, no longitud.
7. El nivel cognitivo refleja operación mental del estudiante.
8. La pregunta debe renderizarse sin lógica especial.
9. La pregunta debe evaluarse de forma determinista.
10. No se hacen preguntas sobre uso de AALIE.

### Temas permitidos

Usar taxonomía ADA controlada:

- `asymptotic_notation`
- `function_growth`
- `common_functions`
- `algorithm_analysis`
- `elementary_operations`
- `temporal_complexity`
- `spatial_complexity`
- `probability`
- `correctness`
- `loop_invariant`
- `limits`
- `series`
- `divide_and_conquer`
- `merge_sort`
- `quick_sort`
- `heaps`
- `heap_sort`
- `priority_queues`
- `recurrence_equations`
- `iteration_method`
- `recursion_tree_method`
- `master_theorem`
- `intelligent_substitution`
- `characteristic_equation`
- `greedy_algorithms`
- `backtracking`
- `branch_and_bound`
- `heuristics`
- `uniform_cost_search`
- `best_first_search`
- `a_star`
- `minimax`
- `alpha_beta_pruning`
- `dynamic_programming`

### Distribución recomendada para banco de 500

Distribución por dificultad recomendada:

- `basic`: 35%
- `intermediate`: 45%
- `advanced`: 20%

Distribución por nivel cognitivo recomendada:

- `recall`: 20%
- `understand`: 30%
- `apply`: 35%
- `analyze`: 15%

Ninguna categoría principal del curso debería quedar con menos de 20 preguntas activas.

### Cómo escribir una pregunta

1. Elegir habilidad concreta (`skillIds`), no solo tema amplio.
2. Elegir tipo entre: `single_choice`, `multiple_choice`, `true_false`, `ordering`, `match_pairs`.
3. Escribir prompt claro y sin ambigüedad.
4. Escribir opciones paralelas y plausibles.
5. Escribir feedback por opción (también para correcta).
6. Escribir explicación general con razonamiento.
7. Declarar `contentRefs` válidos.
8. Completar `selectionMeta`.

### Guía por tipo

- `single_choice`: selección inequívoca de una respuesta.
- `multiple_choice`: varias propiedades correctas en simultáneo.
- `true_false`: verificación conceptual puntual, sin ambigüedad.
- `ordering`: procesos o demostraciones por pasos.
- `match_pairs`: asociación concepto-método, técnica-aplicación.

### Guía de dificultad

- `basic`: definición, reconocimiento directo.
- `intermediate`: aplicación o comparación moderada.
- `advanced`: análisis de casos o selección de método con justificación.

### Guía de nivel cognitivo

- `recall`: recordar una definición o fórmula.
- `understand`: interpretar o distinguir conceptos.
- `apply`: ejecutar un procedimiento.
- `analyze`: comparar, diagnosticar o justificar estrategia.

### Reglas de render

Prompt, opciones, explicación y feedback usan bloques renderizables con Markdown restringido. Cuando se use pseudocódigo, usar bloque `code` con `language: aalie-pseudocode`.

### Reglas de referencias

Toda pregunta activa debe declarar:

```json
{
	"courseId": "ada",
	"moduleId": "...",
	"chapterId": "...",
	"blockId": "... (opcional)"
}
```

Si el capítulo no existe, la pregunta no puede estar activa.

### Reglas de selección adaptativa

Cada pregunta debe tener `selectionMeta` con:

- `weight`
- `estimatedTimeSec`
- `targetMastery`
- `prerequisiteSkillIds`
- `reinforcesSkillIds`
- `exposureLimit`
- `cooldownSessions`
- `discrimination`

Recomendación por dificultad:

- basic: 30-60s, discriminación media.
- intermediate: 60-120s, media/alta.
- advanced: 120-240s, alta.

### Preguntas prohibidas

No se permiten preguntas sobre:

- botones o flujos de UI de AALIE;
- exportaciones/snapshots de AALIE;
- configuración técnica de AALIE;
- interpretación de outputs de AALIE como herramienta.

## Inputs

- contenido del curso y taxonomía vigente;
- skillIds y objetivos pedagógicos;
- estructura del contrato definida en `quiz-json-schema.md`.

## Outputs

- preguntas activas renderizables y evaluables;
- feedback útil por opción;
- referencias válidas a contenido;
- metadata apta para selección determinista.

## Invariantes

- no hay authoring de preguntas sobre uso de AALIE;
- no hay preguntas activas sin referencias válidas;
- no hay opciones sin feedback;
- no hay respuesta inferida desde texto;
- no hay dependencia de LLM para calificar.

## Errores esperables

- respuesta discutible o ambigua;
- distractores absurdos;
- feedback genérico;
- referencias rotas;
- mezcla excesiva de habilidades en una sola pregunta;
- falta de `selectionMeta`.

## Ejemplos

Ver ejemplos completos en `examples/quiz-bank.sample.json` con cobertura de:

- categorías ADA;
- dificultades `basic/intermediate/advanced`;
- niveles cognitivos `recall/understand/apply/analyze`;
- cinco tipos de pregunta soportados.

## Checklist de pregunta activa

Antes de activar una pregunta, verificar:

- `questionId` único.
- `questionVersion` presente.
- `status = active`.
- tipo soportado.
- dificultad y nivel cognitivo válidos.
- topic permitido.
- tags controlados.
- `skillIds` no vacío.
- prompt renderizable.
- opciones/items válidos.
- respuesta canónica clara.
- `gradingPolicy` compatible.
- feedback en todas las opciones.
- explicación general presente.
- referencias a contenido existentes.
- `selectionMeta` completo.
- no evalúa uso de AALIE.

## Checklist de cierre del banco (500)

- al menos 500 preguntas `active`;
- validación bloqueante aprobada;
- sin referencias rotas;
- cobertura por módulos del curso;
- balance razonable por dificultad y nivel cognitivo;
- sin duplicados obvios;
- feedback útil en distractores;
- skillIds aptos para áreas de refuerzo.

## Limites conocidos

- esta guía no garantiza calidad pedagógica por sí sola;
- el validador detecta estructura, no reemplaza revisión experta;
- un CSV auxiliar puede perder expresividad frente al JSON canónico.

## Archivos relacionados

- `quiz-json-schema.md`
- `../03-specs/quizzes-spec.md`
- `course-json-schema.md`
- `content-model.md`
- `examples/quiz-bank.sample.json`
