# Especificación del sistema de quizzes

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/quizzes/` (router.py, service.py, selector.py, grading.py, schemas.py, repository.py, validator.py, taxonomy.py, content_refs.py), `apps/api/scripts/` (validate_quiz_bank.py, report_quiz_bank_coverage.py), `packages/content-data/quizzes/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 7 — Sistema de evaluación (quizzes)

## Propósito

Definir el comportamiento contractual del sistema de quizzes: selección, entrega, evaluación, retroalimentación, compatibilidad con el banco de preguntas y scripts de validación.

## Alcance

Aplica a:
- selección determinista adaptativa
- consumo backend del dataset JSON
- payload enviado al frontend (preguntas sanitizadas)
- evaluación determinista por política de calificación
- retroalimentación por opción y general
- resumen de áreas a reforzar (strengths/weaknesses)
- vínculo con contenido académico (contentRefs)
- validación del banco (schema + reglas de negocio)
- scripts de validación y cobertura

No aplica a:
- generación de preguntas por LLM
- calificación con LLM
- preguntas sobre uso de AALIE
- analítica avanzada
- seguridad criptográfica de respuestas
- persistencia backend obligatoria

## Fuente de verdad

- `apps/api/app/modules/quizzes/schemas.py` — modelos Pydantic
- `apps/api/app/modules/quizzes/selector.py` — algoritmo de selección
- `apps/api/app/modules/quizzes/grading.py` — políticas de calificación
- `apps/api/app/modules/quizzes/validator.py` — validación del banco
- `apps/api/app/modules/quizzes/repository.py` — carga y caché del dataset
- `apps/api/app/modules/quizzes/taxonomy.py` — carga de taxonomía
- `apps/api/app/modules/quizzes/content_refs.py` — verificación de referencias a contenido
- `apps/api/scripts/validate_quiz_bank.py` — script CLI de validación
- `apps/api/scripts/report_quiz_bank_coverage.py` — script CLI de cobertura
- `packages/content-data/quizzes/` — archivos JSON del banco y taxonomía
- `packages/content-catalog/` — catálogo de contenido para validación de referencias

## Estructura

### Decisiones arquitecturales

#### Dataset
El banco canónico de preguntas es JSON. CSV puede existir únicamente como formato auxiliar para authoring, importación o auditoría, pero no puede ser fuente contractual.

#### Propiedad del dataset
El backend posee el dataset y selecciona preguntas. El frontend no debe seleccionar preguntas por su cuenta, salvo en modo fallback explícito o demo local.

#### Evaluación
La evaluación es determinista. No se permite usar LLM para decidir si una respuesta es correcta.

#### Seguridad de respuestas
La respuesta canónica vive clara en el dataset. El contrato runtime elimina las respuestas correctas antes de enviar las preguntas al frontend (`_sanitize_question`). Si preocupa exposición adicional, el contrato runtime puede enviar respuesta ofuscada o token, pero esa ofuscación no es seguridad real: seguridad real implica evaluación en backend.

#### Contenido evaluado
El quiz evalúa Análisis y Diseño de Algoritmos. No se permiten preguntas cuyo objetivo sea enseñar o evaluar uso de AALIE como herramienta.

#### Persistencia
No hay persistencia backend obligatoria de sesiones. El progreso del estudiante se mantiene en `localStorage` del navegador.

## Endpoints backend

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/quizzes/health` | Estado del dataset y conteo de preguntas activas |
| GET | `/quizzes/taxonomy` | Árbol de taxonomía (topics, tags, skills) |
| GET | `/quizzes/dataset/summary` | Resumen del banco por topic, difficulty, cognitiveLevel, status |
| POST | `/quizzes/validate` | Validación completa del dataset (schema + reglas de negocio) |
| POST | `/quizzes/attempts` | Crear sesión de quiz (selección de preguntas) |
| POST | `/quizzes/attempts/evaluate` | Evaluar respuestas de una sesión |
| POST | `/quizzes/session` | Alias legacy de `/quizzes/attempts` |
| POST | `/quizzes/evaluate` | Alias legacy de `/quizzes/attempts/evaluate` |

### GET /quizzes/health
```json
{
  "ok": true,
  "datasetId": "ada-quiz-bank",
  "schemaVersion": "1.0.0",
  "activeQuestions": 476,
  "warnings": 0,
  "errors": 0
}
```

### GET /quizzes/taxonomy
```json
{
  "taxonomyVersion": "1.0.0",
  "courseId": "ada",
  "topics": ["topic.asymptotic-notation", "topic.iterative-analysis", ...],
  "tags": ["tag.big-o", "tag.theta", ...],
  "skills": ["skill.asymptotic.big_o.interpretation", ...]
}
```

### GET /quizzes/dataset/summary
```json
{
  "byTopic": { "topic.asymptotic-notation": 45, ... },
  "byDifficulty": { "basic": 200, "intermediate": 200, "advanced": 76 },
  "byCognitiveLevel": { "recall": 100, "understand": 150, "apply": 150, "analyze": 76 },
  "byStatus": { "active": 476 }
}
```

### POST /quizzes/attempts
Crea una sesión seleccionando preguntas según el contexto del estudiante. Retorna preguntas sanitizadas (sin respuestas correctas) y mezcladas determinísticamente.

### POST /quizzes/attempts/evaluate
Evalúa las respuestas del estudiante contra las respuestas canónicas. Retorna calificación, retroalimentación por opción, áreas a reforzar y delta de dominio por habilidad.

## Modelo de datos

### QuizSelectionRequest → QuizSession

**QuizSelectionRequest** (input de selección):
```json
{
  "studentId": "local-or-server-id",
  "studiedContentRefs": [{ "courseId": "ada", "moduleId": "mod-notacion-asintotica", "chapterId": "big-o" }],
  "masteryBySkill": { "skill.asymptotic.big_o.interpretation": 0.6 },
  "weakSkillIds": ["skill.asymptotic.limit-criteria"],
  "weakTopics": ["topic.asymptotic-notation"],
  "recentResults": [{ "questionId": "...", "topic": "...", "difficulty": "basic", "type": "single_choice", "wasCorrect": true }],
  "recentQuestionIds": ["ada-asymptotic-notation-basic-001"],
  "sessionPreferences": { "questionCount": 5, "moduleId": null, "topicIds": [], "skillIds": [] },
  "locale": "es-CO"
}
```

**QuizSession** (respuesta):
```json
{
  "sessionId": "quiz-session-<uuid>",
  "schemaVersion": "1.0.0",
  "locale": "es",
  "courseId": "ada",
  "questions": [ /* QuizQuestion[] sanitizadas */ ],
  "metadata": {
    "selectionMode": "adaptive_deterministic",
    "warnings": []
  }
}
```

### QuizAnswerSubmission → QuizSessionResult

**QuizAnswerSubmission**:
```json
{
  "sessionId": "quiz-session-<uuid>",
  "questionIds": ["q1", "q2", "q3"],
  "answers": [
    { "questionId": "q1", "selectedOptionIds": ["opt_a"] },
    { "questionId": "q2", "orderedOptionIds": ["opt_b", "opt_a", "opt_c"] },
    { "questionId": "q3", "pairs": [{ "leftId": "L1", "rightId": "R2" }] }
  ],
  "locale": "es-CO"
}
```

**QuizSessionResult**:
```json
{
  "sessionId": "quiz-session-<uuid>",
  "score": 3,
  "maxScore": 5,
  "accuracy": 0.6,
  "results": [ /* QuizQuestionResult[] */ ],
  "strengths": ["skill.asymptotic.big_o.interpretation"],
  "areasToImprove": ["skill.asymptotic.limit-criteria"],
  "masteryDeltaBySkill": { "skill.asymptotic.big_o.interpretation": 0.05 }
}
```

## Tipos de pregunta

| Tipo | Campo de respuesta | Grading modes compatibles |
|---|---|---|
| `single_choice` | `selectedOptionIds[]` (1 elemento) | `all_or_nothing` |
| `multiple_choice` | `selectedOptionIds[]` | `all_or_nothing`, `exact_set`, `partial_credit` |
| `true_false` | `selectedOptionIds[]` (1 elemento: "true"/"false") | `all_or_nothing` |
| `ordering` | `orderedOptionIds[]` | `ordered_exact`, `partial_credit` |
| `match_pairs` | `pairs[]` (leftId → rightId) | `pairwise`, `all_or_nothing` |

## Selección determinista adaptativa

### Algoritmo

Implementado en `selector.py:select_questions()`.

1. **Filtrar preguntas activas**: solo `status == "active"`.
2. **Filtrar por preferencias explícitas**: si `sessionPreferences.moduleId`, `topicIds` o `skillIds` están presentes, filtrar el pool. Si el filtro no produce resultados, emitir warning `"explicit_filters_no_match"` y devolver vacío.
3. **Excluir preguntas recientes**: remover `recentQuestionIds` del pool.
4. **Filtrar por contenido estudiado**: solo preguntas cuyos `contentRefs` intersecten con `studiedContentRefs` del estudiante. Si no hay suficientes, relajar este filtro (warning `"studied_content_relaxed"`).
5. **Priorizar habilidades débiles**: si hay `weakSkillIds` (o `masteryBySkill < 0.5`), sesgar el pool hacia preguntas que ejerciten esas habilidades.
6. **Reforzar temas fallados**: si `weakTopics` está presente o el estudiante falló preguntas recientes del mismo tema, priorizar ese tema (reason_code: `"reinforce_failed_topic"`).
7. **Ajustar dificultad**: basado en los últimos 3 resultados:
   - `accuracy >= 80%`: subir dificultad (`increase_difficulty`)
   - `accuracy < 50%`: bajar dificultad (`decrease_difficulty`)
   - Si hay menos de 3 resultados: empezar en `basic` (`initial_question`)
8. **Evitar repetición**: si hay racha del mismo tema o tipo en los últimos 2 resultados, buscar alternativas (reason_code: `"avoid_repetition"`).
9. **Cubrir temas pendientes**: si no hay presión de tema fallado, priorizar temas no vistos en resultados recientes (reason_code: `"cover_pending_topic"`).
10. **Selección determinista**: dentro del pool resultante, ordenar por `questionId` ascendente y tomar el primero (reason_code de última instancia: `"fallback_available_question"`).
11. **Repetir**: continuar hasta completar `questionCount` o agotar el pool.

### Claves de selección

| Reason code | Significado |
|---|---|
| `initial_question` | Pregunta inicial de dificultad básica |
| `reinforce_failed_topic` | Refuerzo de tema donde el estudiante falló |
| `increase_difficulty` | Subida de dificultad por buen desempeño |
| `decrease_difficulty` | Bajada de dificultad para reforzar fundamentos |
| `maintain_difficulty` | Dificultad mantenida por desempeño estable |
| `cover_pending_topic` | Cobertura de tema pendiente |
| `avoid_repetition` | Evitar repetición de tema o tipo |
| `target_weak_skills` | Priorización de habilidad con bajo dominio |
| `fallback_available_question` | Mejor pregunta disponible (fallback determinista) |

### Propiedades
- **100% determinista**: mismos inputs → misma selección.
- **Sin aleatoriedad**: el único "shuffle" aplicado a opciones por sesión usa `random.Random(session_seed + questionId)` para que sea determinístico por sesión.
- **Sin LLM**: no hay inferencia semántica.
- **Efecto cooldown**: preguntas recientes se excluyen; si no hay suficientes, se relaja con warning `"reused_questions_due_to_shortage"`.

## Evaluación determinista

### Políticas de calificación

| Política | Tipos compatibles | Fórmula |
|---|---|---|
| `all_or_nothing` | single_choice, true_false, multiple_choice, match_pairs | `maxScore` si `expected == received`, sino 0 |
| `exact_set` | multipe_choice | `maxScore` si `expected == received`, sino 0 |
| `partial_credit` | multiple_choice, ordering | `raw = correctSelected/totalCorrect - incorrectSelected*penalty`; `score = max(minScore, raw*maxScore)` |
| `ordered_exact` | ordering | `maxScore` si `expected == received` (orden exacto), sino 0 |
| `pairwise` | match_pairs | `ratio = correctPairs/totalPairs * maxScore` |

### Cómputo de `partial_credit`
```text
raw = correctSelected / totalCorrect - incorrectSelected * penalty
score = max(minScore, raw * maxScore)
```
Donde `penalty`, `maxScore` y `minScore` se declaran en `gradingPolicy` de cada pregunta.

### Reglas
- `penalty` declarado en `gradingPolicy` (default 0).
- Sin puntajes negativos (cota inferior en `minScore`, default 0).
- No se permite lógica personalizada por `questionId`.

### Mastery delta
Por cada pregunta evaluada, se calcula un delta de dominio por skill:
- `ratio >= 0.999`: `delta = +0.05`
- `ratio <= 0.001`: `delta = -0.03`
- Otherwise: `delta = 0.05*ratio + (-0.03)*(1-ratio)`

### Strengths / weaknesses
- `strengths`: skills con promedio >= 0.75 en la sesión.
- `areasToImprove`: skills con promedio <= 0.5 en la sesión.

## Sanitización de preguntas

Antes de enviar preguntas al frontend:
1. `_sanitize_question()` elimina `correctOptionIds`, `orderedOptionIds`, `pairs` del campo `answer`.
2. `_shuffle_question_for_session()` mezcla opciones, `leftItems` y `rightItems` usando `random.Random(session_seed + questionId)` para que el orden sea determinístico por sesión pero diferente entre sesiones.

## Taxonomy

La taxonomía se carga desde `packages/content-data/quizzes/ada-taxonomy.json`:

- **Topics** (`topics`): lista plana de strings con jerarquía semántica (`.` separa niveles), ej. `"topic.asymptotic-notation.big-o"`.
- **Tags** (`tags`): lista plana de strings libres, ej. `"tag.analysis"`, `"tag.formula"`.
- **Skills** (`skills`): lista plana de strings con jerarquía semántica, ej. `"skill.asymptotic.big_o.interpretation"`.
- **Validación individual**: `validate_topic()`, `validate_tag()`, `validate_skill()` verifican contra la taxonomía cargada.

## Dataset

### Estado actual
- ~476 preguntas por locale (es, en)
- Todos los questions actualmente con `status: "active"`
- 5 tipos de pregunta soportados
- 3 dificultades: basic, intermediate, advanced
- 4 niveles cognitivos: recall, understand, apply, analyze

### Archivos
- `packages/content-data/quizzes/ada-quiz-bank.json` — banco ES
- `packages/content-data/quizzes/ada-quiz-bank.en.json` — banco EN
- `packages/content-data/quizzes/ada-taxonomy.json` — taxonomía
- `packages/content-data/quizzes/quiz-bank.sample.json` — ejemplo canónico

### Carga
- `load_dataset()` con `lru_cache(maxsize=4)` para ES y EN
- `refresh_dataset_cache()` para invalidar caché
- Ruta configurable vía `QUIZ_DATA_DIR` env var

## Validación del banco

### Validación de esquema (`validator.py`)

**Errores** (bloqueantes):
- `questionId` duplicado
- Dataset > 500 preguntas o < 5 preguntas
- `questionVersion` no positivo
- `topic` inválido (no existe en taxonomía)
- `tag` inválido
- `skillIds` vacío o skill inválida
- `prompt.blocks` vacío
- `explanation.blocks` vacío
- `contentRefs` vacío para preguntas `active`
- Referencia de contenido (`contentRefs`) no resoluble
- Markdown con HTML arbitrario
- Pregunta evalúa uso de AALIE
- Opción sin feedback
- `correctOptionIds` refiere a optionId inexistente
- `single_choice` sin exactamente 1 respuesta correcta
- `true_false` sin options exactas "true"/"false"
- `multioption_choice` sin al menos 1 respuesta correcta
- `ordering` sin todos los itemIds exactamente una vez
- `match_pairs` con leftId/rightId duplicados o pares con IDs inexistentes
- Modo de grading incompatible con tipo de pregunta

**Warnings** (no bloqueantes):
- Menos de 2 tags
- Más de 8 tags
- Tiempo estimado alto/bajo para la dificultad
- Explicación demasiado corta (< 20 caracteres)
- Feedback sin `contentRefs`
- Sobreconcentración por topic (> 70% del banco)
- Sobreconcentración por skill (> 70% del banco)

### Script de validación (`validate_quiz_bank.py`)
```bash
python apps/api/scripts/validate_quiz_bank.py
```
Retorna exit code 0 si OK, 1 si hay errores.

### Script de cobertura (`report_quiz_bank_coverage.py`)
```bash
python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical
```

**Verificaciones críticas** (`critical_checks()`):
- Preguntas activas >= 5
- Total preguntas <= 500
- Ratio de preguntas `advanced` >= 15%
- Ningún topic con > 35% de concentración
- Sin referencias rotas (`brokenRefs`)

## Modelo de feedback

- Cada opción tiene `feedback` (lista de `RenderableBlock`)
- Feedback correcto: explica por qué la opción es correcta
- Feedback incorrecto: explica el error conceptual
- Toda opción debe tener feedback (validado)
- Feedback puede incluir `contentRefs` para enlaces de repaso
- Además del feedback por opción, cada pregunta tiene `explanation` (explicación general)

## Skills, Tags, ContentRefs

Cada pregunta puede tener:
- **topic**: un tema de la taxonomía (jerárquico)
- **tags**: lista de etiquetas libres (hasta 8, mínimo 2 recomendado)
- **skillIds**: lista de habilidades evaluadas (obligatorio, al menos 1)
- **contentRefs**: referencias a contenido del curso para enlaces de repaso

Las referencias a contenido (`contentRef`) se validan contra el catálogo real (`content_refs.py` → `_load_catalog_index()`), verificando que el `courseId`, `moduleId`, `chapterId` y opcionalmente `blockId` existan.

## Integración con frontend

### BFF (backend-for-frontend)
- 4 rutas de quiz en `apps/web`:
  - Crear sesión
  - Evaluar respuestas
  - Resumen del banco
  - Taxonomía
- Dashboard en ruta `/{locale}/quizzes`

### localStorage
- Progreso de sesiones persistido en `localStorage` del navegador
- No hay sincronización cross-device
- La persistencia puede perderse si el usuario limpia datos del navegador

## Invariantes

1. La selección es determinista (mismos inputs → mismas preguntas).
2. La evaluación es determinista (mismas respuestas → misma calificación).
3. Una pregunta activa siempre referencia contenido existente.
4. El feedback siempre puede renderizarse (estructura `RenderableBlock`).
5. La UI no requiere lógica por `questionId`.
6. Las respuestas canónicas no se infieren desde texto.
7. El sistema no evalúa uso de AALIE.
8. Las respuestas correctas se eliminan antes de enviar al frontend.
9. Los options se mezclan determinísticamente por sesión.
10. El dataset y taxonomía se cachean en backend (LRU, max 4 entradas).

## Límites conocidos

- Ofuscación de respuesta no es seguridad real.
- Persistencia local puede perderse en cliente.
- Adaptación es determinista, no inferencia estadística avanzada.
- Calidad final depende de authoring y validación del banco.
- No hay evaluación automática de respuesta abierta.
- Máximo 500 preguntas por dataset (validado).
- El banco actual tiene ~476 preguntas; escalar requiere authoring adicional.
- Todos los question types están presentes en el banco.

## Degradación permitida

Si no hay suficientes preguntas:
- Relajar cooldown (permitir preguntas recientes).
- Relajar balance de dificultad.
- Relajar filtro de contenido estudiado.
- Devolver menos preguntas con warning.
- No se permite: inventar preguntas, seleccionar `draft`/`deprecated`, evaluar con LLM.

## Archivos relacionados

- `content-modules-spec.md`
- `../08-content/quiz-json-schema.md`
- `../08-content/course-json-schema.md`
- `../08-content/authoring-guide.md`
- `../08-content/examples/quiz-bank.sample.json`
