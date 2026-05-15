# Calidad de quizzes

**Tipo:** normativa
**Estado:** revisión pendiente (resultados dependen de estado actual del banco)
**Audiencia:** dev | evaluador
**Fuente de verdad:** `apps/api/scripts/validate_quiz_bank.py`, `apps/api/scripts/report_quiz_bank_coverage.py`, `apps/api/app/modules/quizzes/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** testing-strategy, ci-cd

## Propósito

Definir cómo se valida la calidad del banco de preguntas de quizzes: integridad del dataset, distribución temática y cobertura de skills/dificultades.

## Validación del dataset

Script: `apps/api/scripts/validate_quiz_bank.py`

Valida la integridad del dataset cargado vía `get_validated_dataset()`:

- **Errores** (→ FAIL): preguntas con schema inválido, prompts vacíos, opciones sin respuesta correcta, referencias rotas dentro del dataset.
- **Warnings** (→ informativo, no bloqueante): formato no convencional, duplicados de prompt sospechosos.

Salida esperada:
```
Quiz dataset validation: OK
```

## Reporte de cobertura

Script: `apps/api/scripts/report_quiz_bank_coverage.py`

Genera un JSON con la distribución completa del banco:

```json
{
  "totalQuestions": 475,
  "activeQuestions": 0,
  "byTopic": { "topic_A": 120, "topic_B": 95, ... },
  "byDifficulty": { "basic": 200, "intermediate": 200, "advanced": 75 },
  "byCognitiveLevel": { "recall": 100, "understand": 150, "apply": 150, "analyze": 75 },
  "byStatus": { "active": 476 },
  "bySkill": { "skill_001": 15, ... },
  "brokenRefs": [],
  "warnings": [],
  "coverageWarnings": [],
  "duplicateLikeQuestions": []
}
```

## Gates críticos (`--fail-on-critical`)

| Gate | Condición | Justificación |
|---|---|---|
| `active ≥ 5` | `activeQuestions < 5` → FAIL | Suficientes preguntas activas para generar quizzes no triviales |
| `total ≤ 500` | `totalQuestions > 500` → FAIL | Límite de mantenibilidad del banco (~475 por locale) |
| `advanced ≥ 15%` | `advanced / total < 0.15` → FAIL | Representación de nivel avanzado suficiente |
| `max topic ≤ 35%` | `topic.count / total > 0.35` → FAIL | Ningún tema debe dominar el banco |
| `no broken contentRefs` | `brokenRefs.length > 0` → FAIL | Todas las referencias a contenido deben ser válidas |

## Estado actual del banco

Basado en la lógica de `report_quiz_bank_coverage.py`:

- El banco tiene **~475 preguntas por locale** (ES y EN).
- **Estado actual:** todas las preguntas están en `active` (476 en ES, 476 en EN). Todos los gates pasan correctamente.
- **Distribución esperada:** al menos 3 niveles de dificultad (basic, intermediate, advanced), 4 niveles cognitivos (recall, understand, apply, analyze), 5 tipos de pregunta (single_choice, multiple_choice, true_false, ordering, match_pairs).
- **Skills:** cada skill debe tener al menos 3 preguntas asociadas.

## Comparativa ES/EN

El banco debe tener el mismo conjunto de `moduleId`s en ambos locales. Si un módulo existe en ES pero no en EN (o viceversa), es una advertencia de cobertura de locale.

## Integración en CI

Job: `quizzes-quality` (`.github/workflows/ci.yaml` líneas 329-361)

Pasos:
1. `python apps/api/scripts/validate_quiz_bank.py` — validación del dataset
2. `python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical` — cobertura con gates
3. `python -m pytest tests/unit/quizzes -q` — tests unitarios del módulo quizzes

## Comandos

```bash
# Validar integridad del dataset
python apps/api/scripts/validate_quiz_bank.py

# Reporte de cobertura (sin gates)
python apps/api/scripts/report_quiz_bank_coverage.py

# Reporte con gates críticos
python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical

# Tests unitarios del módulo quizzes
cd apps/api && python -m pytest tests/unit/quizzes -q
```

## Archivos relacionados

- `testing-strategy.md`
- `ci-cd.md`
- `apps/api/app/modules/quizzes/repository.py`
- `apps/api/app/modules/quizzes/content_refs.py`
