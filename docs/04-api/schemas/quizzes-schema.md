# Schema de quizzes

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/quizzes/schemas.py`, `apps/api/app/modules/quizzes/selector.py`, `apps/api/app/modules/quizzes/grading.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.2.7

## Propósito

Documentar los schemas principales del subsistema de quizzes: selección de preguntas, creación de sesión, envío de respuestas y resultados de evaluación.

## Alcance

Cubre los modelos Pydantic usados por los endpoints `/quizzes/attempts`, `/quizzes/attempts/evaluate`, sus alias legacy y los BFF correspondientes.

## Fuente de verdad

- `apps/api/app/modules/quizzes/schemas.py`
- `apps/api/app/modules/quizzes/selector.py`
- `apps/api/app/modules/quizzes/grading.py`
- `apps/web/src/app/api/quizzes/session/route.ts`
- `apps/web/src/app/api/quizzes/evaluate/route.ts`

## Schemas

### `ContentRef`

Referencia a contenido pedagógico en el catálogo.

```json
{
  "courseId": "algorithm-analysis",
  "moduleId": "asymptotic-notation",
  "chapterId": "big-o",
  "blockId": "block-01"
}
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `courseId` | `string` | Sí | ID del curso |
| `moduleId` | `string` | Sí | ID del módulo |
| `chapterId` | `string` | Sí | ID del capítulo |
| `blockId` | `string\|null` | No | ID del bloque específico |

### `QuizSessionPreferences`

Preferencias de sesión para el selector de preguntas.

```json
{
  "questionCount": 5,
  "difficultyMix": { "basic": 0.4, "intermediate": 0.4, "advanced": 0.2 },
  "moduleId": "asymptotic-notation",
  "topicIds": ["asymptotic_notation"],
  "skillIds": ["skill.analysis.big_o"]
}
```

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `questionCount` | `int` | `5` | Número de preguntas solicitadas |
| `difficultyMix` | `Dict[str,float]` | `{}` | Proporción por dificultad (debe sumar 1.0) |
| `moduleId` | `string\|null` | `null` | Filtrar por módulo |
| `topicIds` | `string[]` | `[]` | Filtrar por temas |
| `skillIds` | `string[]` | `[]` | Filtrar por habilidades |

### `QuizSelectionRequest`

Solicitud de selección de preguntas para una sesión de quiz.

```json
{
  "studentId": "student-001",
  "studiedContentRefs": [],
  "masteryBySkill": { "skill.analysis.big_o": 0.8 },
  "weakSkillIds": ["skill.analysis.recurrence"],
  "weakTopics": ["recurrence"],
  "recentResults": [],
  "recentQuestionIds": [],
  "sessionPreferences": { "questionCount": 5 },
  "locale": "es"
}
```

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `studentId` | `string\|null` | `null` | ID del estudiante |
| `studiedContentRefs` | `ContentRef[]` | `[]` | Contenido estudiado recientemente |
| `masteryBySkill` | `Dict[str,float]` | `{}` | Nivel de dominio por skill (0.0–1.0) |
| `weakSkillIds` | `string[]` | `[]` | Skills con bajo dominio |
| `weakTopics` | `string[]` | `[]` | Temas con bajo dominio |
| `recentResults` | `Dict[]` | `[]` | Resultados recientes para evitar repetición |
| `recentQuestionIds` | `string[]` | `[]` | IDs de preguntas recientes |
| `sessionPreferences` | `QuizSessionPreferences` | `{questionCount:5}` | Preferencias de sesión |
| `locale` | `string\|null` | `null` | Idioma (`"es"` o `"en"`) |

### `QuizQuestion`

Pregunta individual dentro de una sesión.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `questionId` | `string` | ID único de la pregunta |
| `questionVersion` | `int` | Versión de la pregunta |
| `status` | `"draft"\|"active"\|"deprecated"\|"archived"` | Estado |
| `type` | `"single_choice"\|"multiple_choice"\|"true_false"\|"ordering"\|"match_pairs"` | Tipo de pregunta |
| `difficulty` | `"basic"\|"intermediate"\|"advanced"` | Dificultad |
| `cognitiveLevel` | `"recall"\|"understand"\|"apply"\|"analyze"` | Nivel cognitivo |
| `topic` | `string` | Tema de la pregunta |
| `tags` | `string[]` | Tags asociados |
| `skillIds` | `string[]` | Habilidades evaluadas |
| `prompt` | `RenderableContent` | Enunciado de la pregunta |
| `options` | `QuizOption[]` | Opciones de respuesta |
| `leftItems` | `MatchItem[]` | Items izquierdos (match_pairs) |
| `rightItems` | `MatchItem[]` | Items derechos (match_pairs) |
| `answer` | `QuizAnswer` | Respuesta correcta (oculta en sesión) |
| `gradingPolicy` | `GradingPolicy` | Política de evaluación |
| `explanation` | `RenderableContent` | Explicación de la respuesta |
| `contentRefs` | `ContentRef[]` | Referencias a contenido |
| `selectionMeta` | `SelectionMeta` | Metadatos de selección |

### `QuizAnswer`

Respuesta correcta de una pregunta.

```json
{
  "correctOptionIds": ["a"],
  "orderedOptionIds": null,
  "pairs": null
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `correctOptionIds` | `string[]\|null` | IDs de opciones correctas |
| `orderedOptionIds` | `string[]\|null` | IDs en orden correcto (ordering) |
| `pairs` | `Pair[]\|null` | Pares correctos (match_pairs) |

### `StudentAnswer`

Respuesta enviada por el estudiante.

```json
{
  "questionId": "q-005",
  "selectedOptionIds": ["a"],
  "orderedOptionIds": null,
  "pairs": null
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `questionId` | `string` | ID de la pregunta |
| `selectedOptionIds` | `string[]\|null` | Opciones seleccionadas |
| `orderedOptionIds` | `string[]\|null` | Orden propuesto (ordering) |
| `pairs` | `Pair[]\|null` | Pares propuestos (match_pairs) |

### `QuizAnswerSubmission`

Envío de respuestas para evaluación.

```json
{
  "sessionId": "quiz-session-xxxx",
  "questionIds": ["q-005", "q-010"],
  "answers": [
    { "questionId": "q-005", "selectedOptionIds": ["a"], "orderedOptionIds": null, "pairs": null }
  ],
  "locale": "es"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sessionId` | `string` | ID de la sesión a evaluar |
| `questionIds` | `string[]` | IDs de preguntas a evaluar |
| `answers` | `StudentAnswer[]` | Respuestas del estudiante |
| `locale` | `string\|null` | Idioma |

### `QuizSession`

Respuesta de creación de sesión.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sessionId` | `string` | ID único de la sesión |
| `schemaVersion` | `string` | Versión del schema del dataset |
| `locale` | `string` | Idioma de la sesión |
| `courseId` | `string` | ID del curso |
| `questions` | `QuizQuestion[]` | Preguntas seleccionadas (con respuestas ocultas) |
| `metadata` | `Dict` | Metadatos (`selectionMode`, `warnings`) |

### `QuizSessionResult`

Resultado de la evaluación.

```json
{
  "sessionId": "quiz-session-xxxx",
  "score": 1.5,
  "maxScore": 2.0,
  "accuracy": 0.75,
  "results": [
    {
      "questionId": "q-005",
      "isCorrect": true,
      "score": 1.0,
      "maxScore": 1.0,
      "studentAnswer": {"questionId": "q-005", "selectedOptionIds": ["a"], "orderedOptionIds": null, "pairs": null},
      "correctAnswer": {"correctOptionIds": ["a"], "orderedOptionIds": null, "pairs": null},
      "optionFeedback": [],
      "explanation": {"blocks": []},
      "contentRefs": [],
      "skillIds": ["skill.analysis.big_o"]
    }
  ],
  "strengths": ["skill.analysis.big_o"],
  "areasToImprove": ["skill.sorting"],
  "masteryDeltaBySkill": { "skill.analysis.big_o": 0.05 }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sessionId` | `string` | ID de la sesión evaluada |
| `score` | `float` | Puntuación obtenida |
| `maxScore` | `float` | Puntuación máxima posible |
| `accuracy` | `float` | Precisión (score/maxScore) |
| `results` | `QuizQuestionResult[]` | Resultados por pregunta |
| `strengths` | `string[]` | Skills con mejor desempeño |
| `areasToImprove` | `string[]` | Skills a mejorar |
| `masteryDeltaBySkill` | `Dict[str,float]` | Cambio estimado en dominio por skill |

### `GradingPolicy`

Política de puntuación para una pregunta.

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `mode` | `"all_or_nothing"\|"exact_set"\|"partial_credit"\|"ordered_exact"\|"pairwise"` | — | Modo de evaluación |
| `maxScore` | `float` | `1` | Puntuación máxima |
| `penalty` | `float` | `0` | Penalización por error |
| `minScore` | `float` | `0` | Puntuación mínima (piso) |

### `QuizQuestionResult`

Resultado individual de una pregunta.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `questionId` | `string` | ID de la pregunta |
| `isCorrect` | `boolean` | Si la respuesta fue correcta |
| `score` | `float` | Puntuación obtenida |
| `maxScore` | `float` | Puntuación máxima |
| `studentAnswer` | `StudentAnswer` | Respuesta enviada |
| `correctAnswer` | `QuizAnswer\|null` | Respuesta correcta (revelada post-evaluación) |
| `optionFeedback` | `OptionFeedback[]` | Feedback por opción |
| `explanation` | `RenderableContent` | Explicación de la pregunta |
| `contentRefs` | `ContentRef[]` | Referencias a contenido relacionado |
| `skillIds` | `string[]` | Habilidades evaluadas |

### `TaxonomyModel`

Taxonomía del banco de preguntas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `taxonomyVersion` | `string` | Versión de la taxonomía |
| `courseId` | `string` | ID del curso |
| `topics` | `string[]` | Temas disponibles |
| `tags` | `string[]` | Tags disponibles |
| `skills` | `string[]` | Habilidades disponibles |

### `RenderableBlock`

Bloque renderizable de contenido.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `type` | `"markdown"\|"code"` | Tipo de bloque |
| `content` | `string` | Contenido del bloque |
| `language` | `"aalie-pseudocode"\|"text"\|null` | Lenguaje (solo para type=code) |

## Ejemplos

### Selección de preguntas para estudiante con dominio bajo en recurrencias

Request:
```json
{
  "studentId": "student-042",
  "masteryBySkill": { "skill.analysis.recurrence": 0.15, "skill.analysis.big_o": 0.75 },
  "weakSkillIds": ["skill.analysis.recurrence"],
  "sessionPreferences": { "questionCount": 3, "difficultyMix": { "basic": 0.6, "intermediate": 0.4 } },
  "locale": "en"
}
```

Response (abreviado):
```json
{
  "sessionId": "quiz-session-abc123",
  "questions": [
    { "questionId": "q-recur-01", "difficulty": "basic", "topic": "recurrence" },
    { "questionId": "q-recur-02", "difficulty": "basic", "topic": "recurrence" },
    { "questionId": "q-recur-05", "difficulty": "intermediate", "topic": "recurrence" }
  ]
}
```

## Límites conocidos

- `QuizAttempt` y `QuizAttemptResult` son alias de `QuizSession` y `QuizSessionResult` respectivamente (sin cambios de schema).
- `QuizAttemptSubmission` es alias de `QuizAnswerSubmission`.
- Las respuestas correctas se eliminan de `QuizQuestion.answer` al devolver la sesión al cliente.
- `RenderableContent.blocks` soporta `markdown` y `code`; no hay otros tipos planificados.

## Archivos relacionados

- `../quizzes-api.md`
- `../../03-specs/content-model-spec.md`
- `../../08-content/content-model.md`
- `apps/api/app/modules/quizzes/selector.py`
- `apps/api/app/modules/quizzes/grading.py`
