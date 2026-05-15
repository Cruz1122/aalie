# API de quizzes

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/quizzes/router.py`, `apps/api/app/modules/quizzes/schemas.py`, `apps/api/app/modules/quizzes/service.py`, `apps/web/src/app/api/quizzes/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.1.7

## Propósito

Documentar todos los endpoints del subsistema de quizzes, incluyendo sus contratos backend, proxies BFF y aliases legacy.

## Alcance

Cubre 6 endpoints backend, 4 rutas BFF y 2 aliases legacy del sistema de quizzes.

## Fuente de verdad

- `apps/api/app/modules/quizzes/router.py` — todos los endpoints
- `apps/api/app/modules/quizzes/schemas.py` — modelos Pydantic
- `apps/api/app/modules/quizzes/service.py` — lógica de negocio
- `apps/api/app/modules/quizzes/selector.py` — selección adaptativa
- `apps/api/app/modules/quizzes/grading.py` — evaluación
- `apps/api/app/modules/quizzes/taxonomy.py` — taxonomía
- `apps/web/src/app/api/quizzes/session/route.ts` — BFF session
- `apps/web/src/app/api/quizzes/evaluate/route.ts` — BFF evaluate
- `apps/web/src/app/api/quizzes/summary/route.ts` — BFF summary
- `apps/web/src/app/api/quizzes/taxonomy/route.ts` — BFF taxonomy

## Estructura

### Backend endpoints

#### `GET /quizzes/health`

- Path: `/quizzes/health`
- Method: `GET`
- Consumidor principal: monitoreo, scripts

Estado del módulo de quizzes. Verifica la integridad del dataset activo.

**Response:**

```json
{
  "ok": true,
  "datasetId": "quiz-dataset-es-v1",
  "schemaVersion": "1.0",
  "activeQuestions": 42,
  "warnings": 0,
  "errors": 0
}
```

Campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Dataset sin errores |
| `datasetId` | `string` | ID del dataset cargado |
| `schemaVersion` | `string` | Versión del schema |
| `activeQuestions` | `int` | Preguntas en estado `active` |
| `warnings` | `int` | Número de advertencias de validación |
| `errors` | `int` | Número de errores de validación |

#### `GET /quizzes/taxonomy`

- Path: `/quizzes/taxonomy`
- Method: `GET`
- Consumidor principal: BFF `api/quizzes/taxonomy`, UI

Taxonomía del banco: temas, tags y habilidades disponibles.

**Response:**

```json
{
  "taxonomyVersion": "1.0",
  "courseId": "algorithm-analysis",
  "topics": [" asymptotic_notation", "recurrence", "sorting", "searching"],
  "tags": ["basic", "intermediate", "advanced", "divide_conquer"],
  "skills": ["skill.analysis.big_o", "skill.analysis.recurrence", "skill.sorting.merge"]
}
```

#### `GET /quizzes/dataset/summary`

- Path: `/quizzes/dataset/summary`
- Method: `GET`
- Consumidor principal: BFF `api/quizzes/summary`, UI

Resumen estadístico del banco de preguntas.

**Response:**

```json
{
  "byTopic": { " asymptotic_notation": 10, "recurrence": 15, "sorting": 12, "searching": 5 },
  "byDifficulty": { "basic": 18, "intermediate": 15, "advanced": 9 },
  "byCognitiveLevel": { "recall": 10, "understand": 12, "apply": 15, "analyze": 5 },
  "byStatus": { "active": 42, "draft": 3, "deprecated": 1 }
}
```

#### `POST /quizzes/validate`

- Path: `/quizzes/validate`
- Method: `POST`
- Consumidor principal: CLI, CI, scripts de calidad

Valida la integridad estructural y de referencias del dataset de quizzes.

**Response:**

```json
{
  "ok": true,
  "errors": [],
  "warnings": [
    {
      "questionId": "q-001",
      "path": "difficulty",
      "reason": "Dificultad no estándar: 'expert'"
    }
  ]
}
```

#### `POST /quizzes/attempts`

- Path: `/quizzes/attempts`
- Method: `POST`
- Consumidor principal: BFF `api/quizzes/session`

Crea una sesión/intento de quiz con preguntas seleccionadas adaptativamente.

**Request** `QuizSelectionRequest`:

```json
{
  "studentId": "student-001",
  "studiedContentRefs": [
    { "courseId": "algorithm-analysis", "moduleId": "asymptotic-notation", "chapterId": "big-o" }
  ],
  "masteryBySkill": {
    "skill.analysis.big_o": 0.8,
    "skill.analysis.recurrence": 0.3
  },
  "weakSkillIds": ["skill.analysis.recurrence"],
  "weakTopics": ["recurrence"],
  "recentResults": [
    { "questionId": "q-001", "isCorrect": true, "score": 1.0, "maxScore": 1.0 }
  ],
  "recentQuestionIds": ["q-001", "q-002"],
  "sessionPreferences": {
    "questionCount": 5,
    "difficultyMix": { "basic": 0.4, "intermediate": 0.4, "advanced": 0.2 },
    "moduleId": "asymptotic-notation",
    "topicIds": ["asymptotic_notation"],
    "skillIds": ["skill.analysis.big_o"]
  },
  "locale": "es"
}
```

**Response** `QuizSession`:

```json
{
  "sessionId": "quiz-session-xxxx",
  "schemaVersion": "1.0",
  "locale": "es",
  "courseId": "algorithm-analysis",
  "questions": [
    {
      "questionId": "q-005",
      "questionVersion": 1,
      "status": "active",
      "type": "single_choice",
      "difficulty": "intermediate",
      "cognitiveLevel": "understand",
      "topic": "asymptotic_notation",
      "tags": ["big_o"],
      "skillIds": ["skill.analysis.big_o"],
      "prompt": { "blocks": [{ "type": "markdown", "content": "¿Qué significa O(n)?" }] },
      "options": [
        {
          "optionId": "a",
          "content": { "blocks": [{ "type": "markdown", "content": "Lineal" }] },
          "feedback": { "blocks": [] }
        }
      ],
      "leftItems": [],
      "rightItems": [],
      "answer": { "correctOptionIds": null, "orderedOptionIds": null, "pairs": null },
      "gradingPolicy": { "mode": "all_or_nothing", "maxScore": 1, "penalty": 0, "minScore": 0 },
      "explanation": { "blocks": [{ "type": "markdown", "content": "O(n) indica crecimiento lineal." }] },
      "contentRefs": [],
      "selectionMeta": { "weight": 1, "discrimination": "medium" }
    }
  ],
  "metadata": {
    "selectionMode": "adaptive_deterministic",
    "warnings": []
  }
}
```

> **Nota:** Las respuestas correctas (`correctOptionIds`, `orderedOptionIds`, `pairs`) se eliminan del `answer` en la sesión devuelta al cliente para evitar filtración.

#### `POST /quizzes/attempts/evaluate`

- Path: `/quizzes/attempts/evaluate`
- Method: `POST`
- Consumidor principal: BFF `api/quizzes/evaluate`

Evalúa las respuestas de un intento de quiz y devuelve resultados.

**Request** `QuizAnswerSubmission`:

```json
{
  "sessionId": "quiz-session-xxxx",
  "questionIds": ["q-005", "q-010"],
  "answers": [
    {
      "questionId": "q-005",
      "selectedOptionIds": ["a"],
      "orderedOptionIds": null,
      "pairs": null
    }
  ],
  "locale": "es"
}
```

**Response** `QuizSessionResult`:

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
      "studentAnswer": { "questionId": "q-005", "selectedOptionIds": ["a"], "orderedOptionIds": null, "pairs": null },
      "correctAnswer": { "correctOptionIds": ["a"], "orderedOptionIds": null, "pairs": null },
      "optionFeedback": [],
      "explanation": { "blocks": [{ "type": "markdown", "content": "O(n) indica crecimiento lineal." }] },
      "contentRefs": [],
      "skillIds": ["skill.analysis.big_o"]
    }
  ],
  "strengths": ["skill.analysis.big_o"],
  "areasToImprove": ["skill.sorting"],
  "masteryDeltaBySkill": {
    "skill.analysis.big_o": 0.05,
    "skill.sorting": -0.02
  }
}
```

### BFF endpoints

#### `POST /api/quizzes/session`

- Path: `/api/quizzes/session`
- Method: `POST`
- Consumidor principal: UI (dashboard de quizzes)

Proxy a `POST /quizzes/attempts` del backend. Reenvía el payload completo y retransmite la respuesta.

Errores: `502` si backend responde con forma inesperada, `503` si backend no disponible.

#### `POST /api/quizzes/evaluate`

- Path: `/api/quizzes/evaluate`
- Method: `POST`
- Consumidor principal: UI

Proxy a `POST /quizzes/attempts/evaluate` del backend. Mismo comportamiento de errores.

#### `GET /api/quizzes/summary`

- Path: `/api/quizzes/summary`
- Method: `GET`
- Consumidor principal: UI

Proxy a `GET /quizzes/dataset/summary` del backend. Mismo comportamiento de errores.

#### `GET /api/quizzes/taxonomy`

- Path: `/api/quizzes/taxonomy`
- Method: `GET`
- Consumidor principal: UI

Proxy a `GET /quizzes/taxonomy` del backend. Mismo comportamiento de errores.

### Aliases legacy (backend)

Estos endpoints existen por compatibilidad con versiones anteriores del MVP. Delegan completamente en los endpoints canónicos.

#### `POST /quizzes/session` (legacy)

Delega en `POST /quizzes/attempts`. Mismo request/response.

#### `POST /quizzes/evaluate` (legacy)

Delega en `POST /quizzes/attempts/evaluate`. Mismo request/response.

## Tipos de pregunta soportados

| Tipo | Descripción | Modo de evaluación |
|------|-------------|-------------------|
| `single_choice` | Una opción correcta | `all_or_nothing` |
| `multiple_choice` | Varias opciones correctas | `exact_set` o `partial_credit` |
| `true_false` | Verdadero/Falso | `all_or_nothing` |
| `ordering` | Ordenar elementos | `ordered_exact` |
| `match_pairs` | Emparejar izquierda/derecha | `pairwise` |

## Grading modes

| Modo | Descripción |
|------|-------------|
| `all_or_nothing` | Todo o nada: puntuación completa solo si todas las opciones correctas están seleccionadas |
| `exact_set` | Conjunto exacto: penaliza opciones extras |
| `partial_credit` | Crédito parcial proporcional |
| `ordered_exact` | Orden exacto para preguntas de ordenamiento |
| `pairwise` | Evaluación por pares para emparejamiento |

## Ejemplos

- Crear sesión con 5 preguntas de notación asintótica para un estudiante con dominio bajo en recurrencias;
- Evaluar respuestas de un intento y obtener fortalezas/áreas de mejora por skill;
- Consultar taxonomía para poblar filtros en la UI.

## Límites conocidos

- La selección es determinista adaptativa (basada en mastery por skill);
- El progreso del estudiante se persiste localmente en el navegador;
- El banco de preguntas existe, pero la madurez depende de la curaduría del contenido;
- Los campos `locale` en create/evaluate determinan qué dataset de preguntas se usa.

## Archivos relacionados

- `schemas/quizzes-schema.md`
- `../03-specs/content-model-spec.md`
- `../08-content/content-model.md`
