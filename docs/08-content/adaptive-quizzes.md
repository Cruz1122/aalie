# Sistema de quizzes adaptativos

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/quizzes/selector.py`, `apps/api/app/modules/quizzes/grading.py`, `apps/api/app/modules/quizzes/service.py`, `../03-specs/quizzes-spec.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 7.2 — Selección adaptativa

## Propósito

Documentar el sistema de selección adaptativa de quizzes: cómo el backend elige preguntas según el perfil del estudiante, cómo se modela el dominio de habilidades, y cómo se genera retroalimentación vinculada al contenido.

## Alcance

Aplica al algoritmo de selección en `selector.py`, al modelo de mastery en `service.py`, al feedback vinculado a `contentRefs`, y a la gestión continua del banco de preguntas.

## Fuente de verdad

- `apps/api/app/modules/quizzes/selector.py`
- `apps/api/app/modules/quizzes/grading.py`
- `apps/api/app/modules/quizzes/service.py`
- `../03-specs/quizzes-spec.md`
- `quiz-json-schema.md`

## Estructura

### Algoritmo de selección

Implementado en `selector.py:select_questions()`.

1. **Filtrar preguntas activas**: solo `status == "active"`.
2. **Filtrar por preferencias explícitas**: si `sessionPreferences.moduleId`, `topicIds` o `skillIds` están presentes, filtrar el pool. Si el filtro no produce resultados, emitir warning `"explicit_filters_no_match"` y devolver vacío.
3. **Excluir preguntas recientes**: remover `recentQuestionIds` del pool.
4. **Filtrar por contenido estudiado**: solo preguntas cuyos `contentRefs` intersecten con `studiedContentRefs` del estudiante. Si no hay suficientes, relajar este filtro (warning `"studied_content_relaxed"`).
5. **Priorizar habilidades débiles**: si hay `weakSkillIds` (o `masteryBySkill < 0.5`), sesgar el pool hacia preguntas que ejerciten esas habilidades.
6. **Reforzar temas fallados**: si `weakTopics` está presente o el estudiante falló preguntas recientes del mismo tema, priorizar ese tema (reason_code: `"reinforce_failed_topic"`).
7. **Ajustar dificultad**: basado en los últimos 3 resultados:
   - `accuracy >= 80%`: subir dificultad (`increase_difficulty`).
   - `accuracy < 50%`: bajar dificultad (`decrease_difficulty`).
   - Si hay menos de 3 resultados: empezar en `basic` (`initial_question`).
8. **Evitar repetición**: si hay racha del mismo tema o tipo en los últimos 2 resultados, buscar alternativas (reason_code: `"avoid_repetition"`).
9. **Cubrir temas pendientes**: si no hay presión de tema fallado, priorizar temas no vistos en resultados recientes (reason_code: `"cover_pending_topic"`).
10. **Selección determinista**: dentro del pool resultante, ordenar por `questionId` ascendente y tomar el primero (reason_code de última instancia: `"fallback_available_question"`).
11. **Repetir**: continuar hasta completar `questionCount` o agotar el pool.

### Claves de selección (reason codes)

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

### Propiedades del algoritmo

- **100% determinista**: mismos inputs → misma selección.
- **Sin aleatoriedad**: el único "shuffle" aplicado a opciones por sesión usa `random.Random(session_seed + questionId)` para que sea determinístico por sesión.
- **Sin LLM**: no hay inferencia semántica.
- **Efecto cooldown**: preguntas recientes se excluyen; si no hay suficientes, se relaja con warning `"reused_questions_due_to_shortage"`.

### Modelo de mastery

El mastery por skill se calcula después de cada evaluación:

```python
def compute_mastery_delta(ratio: float) -> float:
    if ratio >= 0.999:
        return +0.05
    if ratio <= 0.001:
        return -0.03
    return 0.05 * ratio + (-0.03) * (1 - ratio)
```

- `strengths`: skills con promedio >= 0.75 en la sesión.
- `areasToImprove` / `weakSkillIds`: skills con promedio <= 0.5 en la sesión.

El mastery se persiste en `localStorage` del navegador bajo `aalie.quiz.progress.v1`.

### Modelo de feedback

Cada opción de pregunta tiene dos niveles de feedback:

1. **Feedback por opción** (`options[].feedback`): explica por qué la opción seleccionada es correcta o incorrecta. Puede incluir `contentRefs` para enlaces directos a contenido de repaso.
2. **Explicación general** (`explanation`): explicación completa del razonamiento detrás de la respuesta correcta.

El frontend muestra:
- Si respuesta correcta: feedback breve de consolidación + sugerencia de profundización.
- Si respuesta incorrecta: feedback específico de la opción elegida + enlaces a contenido de remediación.

```json
{
  "optionId": "a",
  "feedback": {
    "blocks": [{ "type": "markdown", "content": "Correcto: definición de cota superior." }],
    "contentRefs": [{
      "courseId": "ada",
      "moduleId": "mod-complejidad-temporal-y-espacial",
      "chapterId": "cap-crecimiento-asintotico",
      "blockId": "blk-definicion-big-o"
    }]
  }
}
```

### ContentRef linking

Cada pregunta activa debe tener al menos un `contentRef` que la vincule con el catálogo de contenido:

```json
{
  "courseId": "ada",
  "moduleId": "mod-notacion-asintotica",
  "chapterId": "cap-big-o",
  "blockId": "blk-definicion-big-o"
}
```

El backend valida estas referencias contra el catálogo real en tiempo de validación. Si un `contentRef` no resuelve, la pregunta no puede estar `active`.

### Degradación permitida

Si no hay suficientes preguntas:
- Relajar cooldown (permitir preguntas recientes).
- Relajar balance de dificultad.
- Relajar filtro de contenido estudiado.
- Devolver menos preguntas con warning.

No se permite: inventar preguntas, seleccionar `draft`/`deprecated`, evaluar con LLM.

### Gestión continua del banco

El banco requiere mantenimiento continuo:

1. **Curación de calidad**: revisar feedback, distractores, y contenido pedagógico.
2. **Balance**: mantener distribución por dificultad y nivel cognitivo.
3. **Cobertura**: asegurar que todos los módulos del curso tengan preguntas asociadas.
4. **Actualización de contentRefs**: si cambia el catálogo, re-ejecutar `align_quiz_content_refs_catalog.py`.
5. **Control de tamaño**: máximo 500 preguntas por dataset (validado).

### Estado actual del banco

| Métrica | Valor |
|---|---|
| Preguntas totales (ES) | ~475 |
| Preguntas totales (EN) | ~475 |
| Estados actuales | 100% `active` (476 preguntas c/u en ES y EN) |

**Nota operativa**: actualmente todas las preguntas están en estado `active`. El banco está listo para uso en runtime. Para inhabilitar una pregunta temporalmente, cambiar su estado a `draft`.

## Archivos relacionados

- `../03-specs/quizzes-spec.md`
- `quiz-json-schema.md`
- `authoring-guide.md`
- `progress-model.md`
- `content-model.md`
