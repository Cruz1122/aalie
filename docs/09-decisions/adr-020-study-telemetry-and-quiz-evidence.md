# ADR-020: Estudios, telemetría y evidencia autoritativa de quizzes

**Estado:** aceptado  
**Fecha:** 2026-08-20  
**Ámbito:** AALIE Fase 4 / Microfase 3

## Contexto

AALIE necesita preparar un cuasiexperimento sin mezclar identidad de producto con identidad académica. El login de Google no equivale a consentimiento de investigación. El quiz actual fue diseñado como práctica local: la sesión no se persiste, el navegador suministra `questionIds` al evaluar y el estado adaptativo vive en `localStorage`. Ese contrato no es suficiente para usar calificaciones como evidencia académica reproducible.

También se necesita telemetría mínima para medir uso de features sin almacenar código fuente, prompts, respuestas LLM completas ni PII innecesaria.

## Decisión

### Separación de dominios

```text
role operativo:       USER | ADMIN
condición de estudio: AALIE | CONTROL
```

La condición nunca se codifica como role ni claim JWT.

Separación de identidad:

```text
auth user → enlace operacional → participant_id seudónimo → evidencia académica
```

Los datasets exportados no incluyen el enlace operacional.

### Estudios y consentimiento

Persistir:

- `studies`;
- `study_participants`;
- `study_identity_links`;
- `study_consents` append-only;
- `study_measurements`.

Login no crea participante. La inscripción requiere consentimiento explícito y versionado. Retiro detiene nueva recolección. Estados de estudio: `DRAFT`, `ACTIVE`, `PAUSED`, `CLOSED`.

La condición se asigna exclusivamente server-side/ADMIN y se vuelve inmutable una vez existe evidencia experimental.

### Quizzes autoritativos para participantes

Para usuarios fuera de un estudio puede mantenerse el modo de práctica compatible con `localStorage`.

Para participantes consentidos:

1. el servidor deriva el estado adaptativo;
2. selecciona preguntas;
3. persiste la sesión y cada pregunta antes de responder;
4. guarda dataset/version/hash, selector/grader/progress version y fingerprint por pregunta;
5. la evaluación carga la sesión persistida y no confía en `questionIds`, mastery o recent results del navegador;
6. la entrega es idempotente;
7. score total y score por pregunta se guardan en la misma transacción que la actualización del progreso adaptativo.

Tablas:

- `study_quiz_attempts`;
- `study_quiz_attempt_items`;
- `study_quiz_progress`.

Cada item conserva al menos `question_id`, `question_version`, fingerprint, posición, topic, difficulty, cognitive level, skills, razón de selección, score, max score e `is_correct`.

No se guarda el prompt completo ni la respuesta correcta en la evidencia por defecto.

### Adaptación reproducible

Versionar explícitamente:

- selector;
- grading;
- progreso/mastery.

`recentResults`, mastery, weak skills y recent question IDs se derivan de DB en study mode. `localStorage` no puede alterar la selección experimental.

`difficultyMix`, cuando se suministra, debe tener semántica determinista implementada y testeada; no puede permanecer como parámetro documentado pero ignorado.

### Telemetría

Las calificaciones de quiz no se duplican como eventos genéricos.

`study_events` usa un schema cerrado y allowlisted para operaciones como:

- `analysis_run`;
- `trace_run`;
- `export_run`;
- `llm_run`.

Campos permitidos incluyen éxito, duración, error code y metadatos técnicos de baja sensibilidad definidos por evento. No existe un `metadata JSONB` libre para insertar payloads arbitrarios.

No almacenar como telemetría académica:

- email/nombre;
- IP/user-agent;
- pseudocódigo fuente;
- prompt;
- respuesta LLM completa.

Una falla de telemetría no modifica el resultado matemático de una operación exitosa. Una falla al persistir una calificación sí impide confirmar el submit y debe permitir retry idempotente.

### Export administrativo

El dataset se descarga desde un panel ADMIN mediante endpoint protegido en BFF y FastAPI. No usar CLI como interfaz principal.

El ZIP contiene:

- `manifest.json`;
- `participants.csv`;
- `quiz_attempts.csv`;
- `quiz_items.csv`;
- `events.csv`;
- `measurements.csv`;
- `data_dictionary.json`.

El manifest versiona schema de export, protocolo, consentimiento, build SHA, datasets, selector/grader y hashes por archivo. La generación usa un snapshot consistente (`REPEATABLE READ` o cutoff único). Se audita quién generó el export, sin almacenar otra copia del ZIP.

Un gradebook identificado, si se necesita en el futuro, será un endpoint distinto y explícito; el dataset científico por defecto es seudonimizado.

### Backup antes de datos reales

Antes de habilitar telemetría de un estudio real debe existir copia `pg_dump -Fc` fuera de la VM y restore drill validado. El export académico no sustituye un backup operacional.

## Motivos

- evita confundir autenticación con consentimiento;
- impide que `localStorage` altere evidencia de investigación;
- conserva exactamente qué pregunta/version recibió cada participante;
- hace las notas idempotentes y auditables;
- reduce superficie de datos sensibles;
- permite reproducir el dataset desde el panel ADMIN.

## Validación requerida

- login sin consentimiento no crea participante;
- usuario no puede autoasignar condición;
- retiro detiene nueva evidencia;
- sesión study se persiste antes de devolverse;
- session ownership se valida;
- pregunta no emitida o manipulada se rechaza;
- submit duplicado devuelve el mismo resultado;
- score total equivale a suma de items;
- manipular/borrar `localStorage` no cambia selección study para el mismo estado DB;
- selector/grader/dataset versions quedan persistidos;
- telemetría fuera de allowlist se rechaza;
- export ADMIN no incluye PII ni source/prompts/IP;
- manifest y hashes del ZIP son verificables;
- dump/restore conserva participantes, consentimientos, quizzes y eventos;
- CI Docker y ARM64 prueban el camino crítico.

## Alternativas descartadas

- guardar notas como telemetría JSON: pierde integridad relacional y versionado.
- confiar en `sessionId + questionIds` del navegador: no prueba qué emitió el servidor.
- sincronizar todo el progreso de contenido dentro de MF3: amplía el alcance más allá de la evidencia mínima requerida.
- export CLI como interfaz de producto: no aprovecha el rol ADMIN ni ofrece trazabilidad adecuada.
- almacenar payloads completos de análisis/LLM: riesgo de privacidad innecesario.
