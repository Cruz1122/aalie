# Schema JSON de quiz

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | autor-contenido
**Fuente de verdad:** `packages/content-data/quizzes/ada-quiz-bank.json`, `../03-specs/quizzes-spec.md`, `content-model.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 7 — Sistema de evaluación (quizzes)

## Propósito

Definir el contrato JSON canónico para el banco de preguntas del sistema de quizzes de AALIE. Este contrato permite que el backend seleccione preguntas de forma determinista según progreso, temas estudiados y áreas a reforzar, y que el frontend pueda renderizar, responder, evaluar y mostrar retroalimentación sin lógica ad hoc por tipo de pregunta.

## Alcance

Aplica a:
- Banco canónico de preguntas.
- Validadores de dataset.
- Selección adaptativa determinista.
- Render de preguntas en frontend.
- Feedback por opción.
- Enlace estricto con contenido académico.
- Ejemplos de authoring.
- Crecimiento del banco hasta al menos 500 preguntas.

No aplica a:
- Persistencia de sesiones de usuario.
- Analítica histórica.
- Seguridad real contra inspección de respuestas en cliente.
- Evaluación con LLM.
- Preguntas abiertas con calificación automática.
- Preguntas sobre uso de AALIE como herramienta.

## Fuente de verdad

- `../03-specs/quizzes-spec.md`
- `content-model.md`
- `course-json-schema.md`
- `authoring-guide.md`
- `examples/quiz-bank.sample.json`

## Estructura

### Principios contractuales

1. El dataset canónico debe ser JSON.
2. CSV puede existir solo como formato auxiliar de authoring, importación o exportación.
3. El banco de preguntas no puede depender de componentes de UI.
4. La UI no debe tener lógica especial por pregunta concreta.
5. La evaluación debe ser determinista.
6. La selección adaptativa debe consumir metadatos explícitos, no interpretar texto libre.
7. Toda pregunta activa debe estar enlazada a contenido académico existente.
8. Las respuestas correctas viven claramente en el dataset canónico.
9. Cualquier ofuscación de respuesta pertenece al contrato runtime/API, no al dataset canónico.
10. El quiz evalúa Análisis y Diseño de Algoritmos, no uso de AALIE.

### Dataset raíz

```json
{
  "schemaVersion": "1.0.0",
  "datasetId": "ada-quiz-bank",
  "locale": "es-CO",
  "courseId": "ada",
  "taxonomyVersion": "1.0.0",
  "questions": []
}
```

Campos raíz:

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `schemaVersion` | string (semver) | Sí | Versión del contrato del dataset |
| `datasetId` | string | Sí | Identificador único del banco |
| `locale` | string | Sí | Código de locale (`es-CO`, `en`) |
| `courseId` | string | Sí | Curso lógico del banco (`ada`) |
| `taxonomyVersion` | string (semver) | Sí | Versión de la taxonomía de topics/tags/skills |
| `questions` | array | Sí | Array de preguntas del banco |

### QuizQuestion

```json
{
  "questionId": "ada-asymptotic-notation-basic-001",
  "questionVersion": 1,
  "status": "active",
  "type": "single_choice",
  "difficulty": "basic",
  "cognitiveLevel": "understand",
  "topic": "asymptotic_notation",
  "tags": ["big_o", "upper_bound", "limits"],
  "skillIds": ["skill.asymptotic.big_o.interpretation"],
  "prompt": { "blocks": [] },
  "options": [],
  "leftItems": [],
  "rightItems": [],
  "answer": {},
  "gradingPolicy": {},
  "explanation": { "blocks": [] },
  "contentRefs": [],
  "selectionMeta": {}
}
```

Campos obligatorios por pregunta:

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `questionId` | string | Sí | ID único global en el dataset |
| `questionVersion` | int >= 1 | Sí | Versión de la pregunta |
| `status` | enum | Sí | `draft | active | deprecated | archived` |
| `type` | enum | Sí | `single_choice | multiple_choice | true_false | ordering | match_pairs` |
| `difficulty` | enum | Sí | `basic | intermediate | advanced` |
| `cognitiveLevel` | enum | Sí | `recall | understand | apply | analyze` |
| `topic` | string | Sí | Debe pertenecer a la taxonomía controlada ADA |
| `tags` | string[] | Sí | Deben pertenecer a la taxonomía |
| `skillIds` | string[] | Sí | Al menos 1 skill, debe pertenecer a la taxonomía |
| `prompt` | objeto | Sí | Contenido renderizable con `blocks[]` |
| `options` | array | Según tipo | Opciones de respuesta |
| `leftItems` | array | match_pairs | Items izquierdos para emparejar |
| `rightItems` | array | match_pairs | Items derechos para emparejar |
| `answer` | objeto | Sí | Respuesta canónica (tipo-dependente) |
| `gradingPolicy` | objeto | Sí | Política de calificación determinista |
| `explanation` | objeto | Sí | Explicación general renderizable |
| `contentRefs` | array | Sí | Referencias a contenido del curso |
| `selectionMeta` | objeto | Sí | Metadatos para selección adaptativa |

### Estados editoriales

| Estado | Significado | Seleccionable |
|---|---|---|
| `draft` | Incompleta o no revisada | No |
| `active` | Válida y lista para selección | Sí |
| `deprecated` | Válida históricamente, no para nuevas sesiones | No |
| `archived` | Retirada del banco activo | No |

Reglas:
- Solo `active` puede entrar a selección.
- Una pregunta `active` debe pasar todas las validaciones bloqueantes.

### Tipos de pregunta soportados

| Tipo | Descripción | Opciones | Respuesta | Grading compatible |
|---|---|---|---|---|
| `single_choice` | Selección única | Mínimo 2, exactamente 1 correcta | `correctOptionIds[]` (1) | `all_or_nothing` |
| `multiple_choice` | Selección múltiple | Mínimo 2, al menos 1 correcta | `correctOptionIds[]` (1+) | `all_or_nothing`, `exact_set`, `partial_credit` |
| `true_false` | Verdadero/Falso | Exactamente "true" y "false" | `correctOptionIds[]` (1) | `all_or_nothing` |
| `ordering` | Ordenar elementos | Mínimo 3 elementos | `orderedOptionIds[]` (todos) | `ordered_exact`, `partial_credit` |
| `match_pairs` | Emparejar pares | Mínimo 2 pares, leftId único | `pairs[]` (leftId→rightId) | `pairwise`, `all_or_nothing` |

### Answer types por tipo de pregunta

**single_choice / true_false / multiple_choice:**
```json
{ "correctOptionIds": ["a"] }
```

**ordering:**
```json
{ "orderedOptionIds": ["step-1", "step-2", "step-3"] }
```

**match_pairs:**
```json
{
  "pairs": [
    { "leftId": "left-1", "rightId": "right-1" }
  ]
}
```

### Contenido renderizable

Aplica a: `prompt`, `options[].content`, `options[].feedback`, `explanation`, `leftItems[].content`, `rightItems[].content`.

```json
{
  "blocks": [
    { "type": "markdown", "content": "Texto con Markdown restringido y fórmulas inline." },
    { "type": "code", "language": "aalie-pseudocode", "content": "..." }
  ]
}
```

Bloques permitidos: `markdown`, `code`.

Markdown restringido:
- Permitido: párrafos, negrita, cursiva, listas, código inline, fórmulas inline y de bloque, tablas simples.
- Prohibido: HTML arbitrario, scripts, iframes, estilos inline, imágenes remotas no controladas.

### Opciones y feedback

```json
{
  "optionId": "a",
  "content": { "blocks": [] },
  "feedback": {
    "blocks": [],
    "contentRefs": []
  }
}
```

Reglas:
- `optionId` único dentro de la pregunta.
- Toda opción debe tener `content`.
- Toda opción debe tener `feedback`, incluso la correcta.
- `feedback` puede incluir `contentRefs` para enlaces de repaso.

### Políticas de calificación

```json
{
  "mode": "all_or_nothing",
  "maxScore": 1,
  "penalty": 0,
  "minScore": 0
}
```

| Modo | Compatible con | Fórmula |
|---|---|---|
| `all_or_nothing` | single_choice, true_false, multiple_choice, match_pairs | `maxScore` si expected == received, sino 0 |
| `exact_set` | multiple_choice | `maxScore` si expected == received, sino 0 |
| `partial_credit` | multiple_choice, ordering | `raw = correctSelected/totalCorrect - incorrectSelected*penalty`; `score = max(minScore, raw*maxScore)` |
| `ordered_exact` | ordering | `maxScore` si expected == received (orden exacto), sino 0 |
| `pairwise` | match_pairs | `ratio = correctPairs/totalPairs * maxScore` |

### Referencias a contenido (contentRefs)

```json
{
  "courseId": "ada",
  "moduleId": "mod-notacion-asintotica",
  "chapterId": "cap-big-o",
  "blockId": "blk-definicion-big-o"
}
```

Reglas:
- Toda pregunta `active` debe tener al menos un `contentRef`.
- `courseId`, `moduleId`, `chapterId` son obligatorios.
- `blockId` es opcional.
- Toda referencia debe resolver contra el contenido real del catálogo.

### Metadatos de selección adaptativa

```json
{
  "weight": 1,
  "estimatedTimeSec": 60,
  "targetMastery": 0.75,
  "prerequisiteSkillIds": [],
  "reinforcesSkillIds": [],
  "exposureLimit": 3,
  "cooldownSessions": 2,
  "discrimination": "medium"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `weight` | number | Peso relativo de la pregunta |
| `estimatedTimeSec` | int | Tiempo estimado en segundos |
| `targetMastery` | number | Nivel de dominio objetivo (0-1) |
| `prerequisiteSkillIds` | string[] | Skills que deben dominarse antes |
| `reinforcesSkillIds` | string[] | Skills que refuerza esta pregunta |
| `exposureLimit` | int | Máximo de veces que se muestra al mismo estudiante |
| `cooldownSessions` | int | Sesiones de espera antes de reaparecer |
| `discrimination` | `low|medium|high` | Poder discriminante de la pregunta |

### Taxonomía controlada ADA

Topics permitidos:
`asymptotic_notation`, `function_growth`, `common_functions`, `algorithm_analysis`, `elementary_operations`, `temporal_complexity`, `spatial_complexity`, `probability`, `correctness`, `loop_invariant`, `limits`, `series`, `divide_and_conquer`, `merge_sort`, `quick_sort`, `heaps`, `heap_sort`, `priority_queues`, `recurrence_equations`, `iteration_method`, `recursion_tree_method`, `master_theorem`, `intelligent_substitution`, `characteristic_equation`, `greedy_algorithms`, `backtracking`, `branch_and_bound`, `heuristics`, `uniform_cost_search`, `best_first_search`, `a_star`, `minimax`, `alpha_beta_pruning`, `dynamic_programming`.

Skills siguen el patrón `skill.<area>.<subarea>.<acción>`.

Tags son strings planos controlados por la taxonomía.

### Archivos del banco

| Archivo | Propósito |
|---|---|
| `packages/content-data/quizzes/ada-quiz-bank.json` | Banco ES (~476 preguntas) |
| `packages/content-data/quizzes/ada-quiz-bank.en.json` | Banco EN (~476 preguntas) |
| `packages/content-data/quizzes/ada-taxonomy.json` | Taxonomía (topics, tags, skills) |
| `packages/content-data/quizzes/quiz-bank.sample.json` | Ejemplo canónico (en `docs/08-content/examples/`) |

## Ejemplos

Ver dataset completo de muestra en `examples/quiz-bank.sample.json`, que cubre categorías y dificultades con los cinco tipos soportados.

## Validaciones bloqueantes

Una pregunta `active` es inválida si:
- Falta cualquier campo obligatorio.
- `questionId` no es único.
- `questionVersion` no es entero positivo.
- `type`, `difficulty` o `cognitiveLevel` no pertenecen al enum.
- `topic` no pertenece a la taxonomía controlada.
- `skillIds[]` está vacío.
- `prompt.blocks[]` o `explanation.blocks[]` está vacío.
- `contentRefs[]` está vacío o no resuelve.
- Hay IDs duplicados de opciones/items.
- La respuesta referencia IDs inexistentes.
- La política de calificación no es compatible con el tipo.
- Alguna opción no tiene feedback.
- El contenido incluye HTML no permitido.
- La pregunta evalúa uso de AALIE en lugar de ADA.

## Warnings recomendados

Advertir (sin bloquear) si:
- `estimatedTimeSec` es atípico para la dificultad.
- Hay menos de 2 tags o más de 8.
- Explicación demasiado corta (< 20 caracteres).
- Feedback sin `contentRefs`.
- Sobrerrepresentación de mismo `topic`/`skillId` (> 70% del banco).
- Diferencias extremas de longitud entre opciones.
- Uso de pistas obvias como "todas las anteriores".

## Compatibilidad y versionado

**`schemaVersion`** sigue semver.

Cambio compatible:
- Agregar campos opcionales.
- Agregar tags o skillIds controlados.
- Agregar warnings.

Cambio incompatible:
- Remover campos obligatorios.
- Renombrar campos públicos.
- Cambiar semántica de respuesta o `gradingPolicy`.
- Cambiar estructura de `contentRefs`.

**`questionVersion`** se incrementa cuando cambian:
- Respuesta correcta.
- Intención conceptual.
- Dificultad.
- Nivel cognitivo.
- Política de calificación.

No requiere incremento por correcciones ortográficas o redacción sin cambio semántico.

## Limites conocidos

- Este contrato no define persistencia de sesión.
- Este contrato no define endpoint runtime de selección.
- Este contrato no ofrece seguridad real para ocultar respuestas en cliente.
- La ofuscación de respuestas, si existe, pertenece al contrato runtime/API.
- No soporta preguntas abiertas con calificación automática.

## Archivos relacionados

- `content-model.md`
- `course-json-schema.md`
- `authoring-guide.md`
- `adaptive-quizzes.md`
- `examples/quiz-bank.sample.json`
- `../03-specs/quizzes-spec.md`
