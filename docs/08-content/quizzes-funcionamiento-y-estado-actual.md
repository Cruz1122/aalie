# Quizzes: funcionamiento y estado actual

Este documento explica como funciona el sistema de quizzes de ADA hoy, y que tenemos ahora mismo en backend, frontend y banco de preguntas.

## 1) Contrato funcional (fuente normativa)

La especificacion normativa esta en `docs/03-specs/quizzes-spec.md`.

Puntos clave del contrato:

- Seleccion determinista y adaptativa.
- Evaluacion determinista (sin LLM).
- Feedback por opcion + explicacion general.
- Vinculo de cada pregunta con contenido del curso (`contentRefs`).
- Validacion de schema + reglas de negocio del dataset.

Snippet del contrato:

```text
dataset JSON
	-> validación de dataset
	-> backend recibe contexto del estudiante
	-> backend selecciona preguntas
	-> backend entrega intento al frontend
	-> frontend renderiza
	-> estudiante responde
	-> evaluación determinista
	-> feedback por pregunta y por opción
	-> resumen de áreas a reforzar
	-> links directos al contenido
```

## 2) Arquitectura actual

### Backend (`apps/api/app/modules/quizzes`)

Responsabilidades:

- `repository.py`: carga dataset por locale (`es`/`en`), cachea y expone preguntas.
- `validator.py`: valida reglas de negocio del banco.
- `selector.py`: seleccion determinista de preguntas.
- `grading.py`: califica respuestas por politica.
- `service.py`: crea intento y evalua intento.
- `router.py`: expone endpoints HTTP.

Endpoints principales:

- `GET /quizzes/health`
- `GET /quizzes/taxonomy`
- `GET /quizzes/dataset/summary`
- `POST /quizzes/validate`
- `POST /quizzes/attempts`
- `POST /quizzes/attempts/evaluate`

Alias legacy:

- `POST /quizzes/session` -> alias de `POST /quizzes/attempts`
- `POST /quizzes/evaluate` -> alias de `POST /quizzes/attempts/evaluate`

Codigo real de router:

```python
@router.post("/attempts")
def create_quiz_attempt(payload: QuizSelectionRequest = Body(...)) -> dict[str, object]:
    try:
        return create_session(payload).model_dump()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/attempts/evaluate")
def evaluate_quiz_attempt(payload: QuizAnswerSubmission = Body(...)) -> dict[str, object]:
    try:
        return evaluate_session(payload).model_dump()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
```

### Frontend (`apps/web`)

Flujo:

- `app/[locale]/course/quiz/page.tsx` monta `QuizSessionView`.
- `useQuizSession.ts` crea intento y envia respuestas.
- `quizClient.ts` llama rutas BFF de Next.
- Rutas BFF (`app/api/quizzes/*`) proxyean al backend FastAPI.

Codigo real del hook:

```ts
const payload: QuizSelectionRequest = {
  studentId: null,
  studiedContentRefs: loadStudiedContentRefs(),
  masteryBySkill: progress.masteryBySkill,
  weakSkillIds: toWeakSkillIds(progress.masteryBySkill),
  recentQuestionIds: progress.recentQuestionIds,
  sessionPreferences: { questionCount, difficultyMix: {} },
  locale,
};
const created = await createQuizAttempt(payload);
```

## 3) Flujo end-to-end actual

1. UI arma `QuizSelectionRequest` con progreso local.
2. Front llama `/api/quizzes/session`.
3. BFF de Next reenvia a `POST /quizzes/attempts`.
4. Backend valida dataset y ejecuta selector.
5. Backend devuelve sesion con preguntas sanitizadas (sin respuestas canonicas).
6. Usuario responde en UI.
7. Front llama `/api/quizzes/evaluate`.
8. BFF reenvia a `POST /quizzes/attempts/evaluate`.
9. Backend califica deterministamente y devuelve score, resultados, fortalezas y areas a reforzar.

Codigo real de sanitizacion en backend:

```python
def _sanitize_question(question: QuizQuestion) -> QuizQuestion:
    question_copy = deepcopy(question)
    question_copy.answer.correctOptionIds = None
    question_copy.answer.orderedOptionIds = None
    question_copy.answer.pairs = None
    return question_copy
```

## 4) Seleccion determinista (hoy)

El selector (`selector.py`) aplica reglas en este orden:

1. Solo `status == "active"`.
2. Filtro por contenido estudiado (`contentRefs`) cuando hay contexto.
3. Exclusion de recientes (`recentQuestionIds`) si hay alternativas.
4. Prioridad a tema debil (`weakTopics`) o ultimo tema fallado.
5. Ajuste de dificultad segun ultimos 3 resultados.
6. Evita rachas (>2) de mismo `topic`/`type` si hay alternativa.
7. Cubre temas pendientes si no hay presion por fallo.
8. Desempate determinista por `questionId` ascendente.

Codigo real del gate mas importante:

```python
active = [question for question in questions if question.status == "active"]
...
available = [
    q
    for q in active
    if q.questionId not in seen
    and q.questionId not in used_ids
    and _matches_studied(q, studied)
]
```

## 5) Evaluacion determinista (hoy)

`service.evaluate_session`:

- Mapea respuestas por `questionId`.
- Valida que cada pregunta exista.
- Valida que cada pregunta tenga respuesta.
- Llama `grade_question(...)` por pregunta.
- Acumula score, accuracy, mastery delta por skill.
- Resume fortalezas y areas de mejora.

Codigo real del loop de evaluacion:

```python
for question_id in payload.questionIds:
    question = get_question(question_id, loc)
    if question is None:
        raise ValueError(f"Unknown questionId: {question_id}")

    answer = answers_by_id.get(question_id)
    if answer is None:
        raise ValueError(f"Missing answer for questionId: {question_id}")

    result = grade_question(question, answer)
    results.append(result)
```

## 6) Banco de quizzes: que hay ahora mismo

Fuente actual:

- ES: `packages/content-data/quizzes/ada-quiz-bank.json`
- EN: `packages/content-data/quizzes/ada-quiz-bank.en.json`

Estado medido hoy (conteo real del JSON):

- `datasetId`: `ada-quiz-bank`
- `schemaVersion`: `1.0.0`
- `locale` ES: `es-CO`
- preguntas totales ES: `475`
- preguntas totales EN: `475`
- estado ES/EN: **todas en `draft`**

Distribucion actual ES:

- Por estado: `draft: 475` (no hay `active`)
- Por tipo:
  - `single_choice: 372`
  - `multiple_choice: 30`
  - `true_false: 33`
  - `ordering: 19`
  - `match_pairs: 21`
- Por dificultad:
  - `basic: 147`
  - `intermediate: 183`
  - `advanced: 145`

Implicacion operativa importante:

- Como el selector filtra solo `active`, con el banco actual la seleccion devolvera 0 preguntas o warning de insuficiencia.
- Para habilitar el quiz en runtime, se necesita activar un subconjunto valido (`status: "active"`).

## 7) Gestion del banco (script operativo)

Script:

- `scripts/manage_quiz_bank.py`

Comandos:

- Insertar preguntas:
  - `python scripts/manage_quiz_bank.py insert --input <archivo.json>`
- Borrar por IDs:
  - `python scripts/manage_quiz_bank.py remove --ids <ids.json>`

Garantias del script:

- Rechaza `questionId` faltante o duplicado en entrada.
- Rechaza insercion si `questionId` ya existe en banco.
- Valida schema (`QuizDataset`) y negocio (`validate_dataset`) antes de escribir.
- Escritura atomica logica: valida primero, persiste despues.

Codigo real del check de duplicados:

```python
existing_ids = {q["questionId"] for q in bank["questions"]}
duplicates = [qid for qid in incoming_ids if qid in existing_ids]
if duplicates:
    raise ValueError(f"Ya existen questionId en banco: {duplicates}")
```

## 8) Pruebas existentes

Suite base:

- `apps/api/tests/system/quizzes/test_quizzes_endpoints.py`
- `apps/api/tests/unit/quizzes/*`

Cobertura funcional validada en tests de sistema:

- health/taxonomy/summary/validate.
- crear intento.
- priorizacion por `weakSkillIds`.
- evaluar intento.
- errores por `questionId` desconocido y respuesta malformada.

Ejemplo real:

```python
def test_create_attempt_with_weak_skill_prioritizes_it():
    payload = {
        "studiedContentRefs": [],
        "masteryBySkill": {},
        "weakSkillIds": ["skill.asymptotic.big_o.upper-bound-interpretation"],
        "recentQuestionIds": [],
        "sessionPreferences": {"questionCount": 1, "difficultyMix": {}},
    }
    res = client.post("/quizzes/attempts", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert "skill.asymptotic.big_o.upper-bound-interpretation" in body["questions"][0]["skillIds"]
```

## 9) Resumen corto

Lo que funciona hoy:

- Arquitectura end-to-end completa (UI -> BFF -> API -> selector/grading).
- Contratos y validaciones definidos.
- Scripts de operacion del banco.
- Tests de sistema y unitarios de quizzes.

Bloqueador actual principal:

- El banco actual esta 100% en `draft`; no hay preguntas `active` para sesion real.
