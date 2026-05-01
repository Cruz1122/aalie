# Quizzes: Schema, JSON esperado y referencias a curso para feedback

**Tipo:** normativa + guía de implementación

## Objetivo

Definir con precisión:

1. Cómo se estructura un banco de quizzes.
2. Cuál es el JSON esperado por tipo de pregunta.
3. Cómo conectar preguntas, opciones y feedback con contenido de curso (`module/chapter/block`) de forma trazable y usable por frontend/backend.

Este documento aterriza el contrato de `quiz-json-schema.md` y lo alinea con el modelo de contenido de módulos (`module.schema.json`).

## Fuentes contractuales (source of truth)

- `docs/08-content/quiz-json-schema.md`
- `packages/content-data/quizzes/quiz-bank.sample.json`
- `packages/content-data/quizzes/ada-quiz-bank.json`
- `packages/content-catalog/schemas/module.schema.json`
- `packages/content-catalog/schemas/shared.schema.json`
- `packages/content-catalog/schemas/block.schema.json`

Si hay conflicto entre documento descriptivo y contrato normativo, prevalece `docs/08-content/quiz-json-schema.md`.

---

## 1) Modelo general del dataset de quizzes

Raíz esperada:

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

### Campos raíz obligatorios

- `schemaVersion` (`semver` string).
- `datasetId` (id estable del banco).
- `locale` (ej. `es-CO`).
- `courseId` (curso lógico del banco; ej. `ada`).
- `taxonomyVersion` (`semver` para topic/tags/skills).
- `questions` (array de preguntas).

### Invariantes raíz

- Dataset debe ser JSON válido.
- `questions` puede crecer a cientos de ítems sin romper contrato.
- Todas las preguntas `active` deben poder evaluarse de manera determinista.

---

## 2) Contrato canónico de una pregunta

Shape base:

```json
{
  "questionId": "ada-asymptotic-notation-basic-001",
  "questionVersion": 1,
  "status": "active",
  "type": "single_choice",
  "difficulty": "basic",
  "cognitiveLevel": "understand",
  "topic": "asymptotic_notation",
  "tags": ["big_o", "upper_bound"],
  "skillIds": ["skill.asymptotic.big_o.interpretation"],
  "prompt": { "blocks": [] },
  "options": [],
  "answer": {},
  "gradingPolicy": {},
  "explanation": { "blocks": [] },
  "contentRefs": [],
  "selectionMeta": {}
}
```

### Obligatorios por pregunta

- `questionId` único global en el dataset.
- `questionVersion` entero `>= 1`.
- `status`: `draft | active | deprecated | archived`.
- `type`: `single_choice | multiple_choice | true_false | ordering | match_pairs`.
- `difficulty`: `basic | intermediate | advanced`.
- `cognitiveLevel`: `recall | understand | apply | analyze`.
- `topic` (taxonomía ADA controlada).
- `tags[]` (controladas).
- `skillIds[]` (al menos una skill).
- `prompt` (renderizable).
- `answer` (canónico, explícito).
- `gradingPolicy` (determinista y compatible con tipo).
- `explanation` (renderizable).
- `contentRefs[]` (mínimo `courseId/moduleId/chapterId`).
- `selectionMeta` (metadatos de selección adaptativa).

### Estados

- `draft`: no seleccionable.
- `active`: seleccionable.
- `deprecated`: histórica, no nueva selección.
- `archived`: retirada.

Regla crítica: **solo `active` entra al selector**.

---

## 3) JSON esperado para bloques renderizables

El contrato de quizzes usa contenido renderizable para:

- `prompt`
- `options[].content`
- `options[].feedback.blocks`
- `explanation`
- `leftItems[].content`
- `rightItems[].content`

Shape:

```json
{
  "blocks": [
    { "type": "markdown", "content": "Texto con markdown restringido" },
    { "type": "code", "language": "aalie-pseudocode", "content": "..." }
  ]
}
```

Bloques permitidos en contrato de quiz:

- `markdown`
- `code`

Regla práctica: el renderer del quiz no debe contener reglas ad hoc por pregunta, solo por tipo de bloque.

---

## 4) JSON esperado por tipo de pregunta

## 4.1 `single_choice`

Reglas:

- mínimo 2 opciones;
- exactamente 1 correcta.

```json
{
  "type": "single_choice",
  "options": [
    {
      "optionId": "a",
      "content": { "blocks": [{ "type": "markdown", "content": "Opción A" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback A" }], "contentRefs": [] }
    },
    {
      "optionId": "b",
      "content": { "blocks": [{ "type": "markdown", "content": "Opción B" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback B" }], "contentRefs": [] }
    }
  ],
  "answer": { "correctOptionIds": ["a"] },
  "gradingPolicy": { "mode": "all_or_nothing", "maxScore": 1, "penalty": 0 }
}
```

## 4.2 `multiple_choice`

Reglas:

- mínimo 2 opciones;
- una o más correctas.

```json
{
  "type": "multiple_choice",
  "options": [
    {
      "optionId": "a",
      "content": { "blocks": [{ "type": "markdown", "content": "Afirmación A" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback A" }], "contentRefs": [] }
    },
    {
      "optionId": "b",
      "content": { "blocks": [{ "type": "markdown", "content": "Afirmación B" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback B" }], "contentRefs": [] }
    },
    {
      "optionId": "c",
      "content": { "blocks": [{ "type": "markdown", "content": "Afirmación C" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback C" }], "contentRefs": [] }
    }
  ],
  "answer": { "correctOptionIds": ["a", "b"] },
  "gradingPolicy": { "mode": "partial_credit", "maxScore": 1, "penalty": 0.1 }
}
```

## 4.3 `true_false`

Reglas:

- dos opciones (`true`, `false`);
- exactamente una correcta.

```json
{
  "type": "true_false",
  "options": [
    {
      "optionId": "true",
      "content": { "blocks": [{ "type": "markdown", "content": "Verdadero" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback true" }], "contentRefs": [] }
    },
    {
      "optionId": "false",
      "content": { "blocks": [{ "type": "markdown", "content": "Falso" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback false" }], "contentRefs": [] }
    }
  ],
  "answer": { "correctOptionIds": ["true"] },
  "gradingPolicy": { "mode": "all_or_nothing", "maxScore": 1, "penalty": 0 }
}
```

## 4.4 `ordering`

Reglas:

- mínimo 3 elementos;
- `answer.orderedOptionIds` debe contener todos.

```json
{
  "type": "ordering",
  "options": [
    {
      "optionId": "step-1",
      "content": { "blocks": [{ "type": "markdown", "content": "Paso 1" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback paso 1" }], "contentRefs": [] }
    },
    {
      "optionId": "step-2",
      "content": { "blocks": [{ "type": "markdown", "content": "Paso 2" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback paso 2" }], "contentRefs": [] }
    },
    {
      "optionId": "step-3",
      "content": { "blocks": [{ "type": "markdown", "content": "Paso 3" }] },
      "feedback": { "blocks": [{ "type": "markdown", "content": "Feedback paso 3" }], "contentRefs": [] }
    }
  ],
  "answer": { "orderedOptionIds": ["step-1", "step-2", "step-3"] },
  "gradingPolicy": { "mode": "ordered_exact", "maxScore": 1, "penalty": 0 }
}
```

## 4.5 `match_pairs`

Reglas:

- mínimo 2 pares;
- sin duplicados en lado izquierdo;
- `answer.pairs[]` solo referencia IDs existentes.

```json
{
  "type": "match_pairs",
  "leftItems": [
    { "leftId": "left-1", "content": { "blocks": [{ "type": "markdown", "content": "Concepto A" }] } },
    { "leftId": "left-2", "content": { "blocks": [{ "type": "markdown", "content": "Concepto B" }] } }
  ],
  "rightItems": [
    { "rightId": "right-1", "content": { "blocks": [{ "type": "markdown", "content": "Definición A" }] } },
    { "rightId": "right-2", "content": { "blocks": [{ "type": "markdown", "content": "Definición B" }] } }
  ],
  "answer": {
    "pairs": [
      { "leftId": "left-1", "rightId": "right-1" },
      { "leftId": "left-2", "rightId": "right-2" }
    ]
  },
  "gradingPolicy": { "mode": "pairwise", "maxScore": 1, "penalty": 0 },
  "options": []
}
```

Nota: en datasets reales puede mantenerse `options: []` por compatibilidad de shape.

---

## 5) `feedback` por opción: contrato y objetivo pedagógico

Shape esperado por opción:

```json
{
  "optionId": "a",
  "content": { "blocks": [{ "type": "markdown", "content": "..." }] },
  "feedback": {
    "blocks": [{ "type": "markdown", "content": "Retroalimentación específica de la opción." }],
    "contentRefs": [
      {
        "courseId": "ada",
        "moduleId": "mod-complejidad-temporal-y-espacial",
        "chapterId": "cap-crecimiento-asintotico",
        "blockId": "blk-notacion-theorem"
      }
    ]
  }
}
```

Reglas clave:

- Toda opción debe tener `feedback` (incluye opción correcta).
- `feedback.blocks` explica por qué esa opción es correcta/incorrecta.
- `feedback.contentRefs` debe apuntar a contenido de remediación o refuerzo.

---

## 6) Referencias a curso para feedback

## 6.1 Problema que resuelve

Cuando el estudiante falla:

- no basta decir “incorrecto”;
- se requiere ruta de recuperación exacta;
- debe existir trazabilidad de quiz -> contenido académico.

## 6.2 Contrato de referencia recomendado

Actualmente el contrato usa:

```json
{
  "courseId": "ada",
  "moduleId": "mod-complejidad-temporal-y-espacial",
  "chapterId": "cap-crecimiento-asintotico",
  "blockId": "blk-notacion-theorem"
}
```

### Semántica de campos

- `courseId`: curso lógico del quiz (`ada`).
- `moduleId`: módulo del contenido (`mod-*`).
- `chapterId`: capítulo (`cap-*`).
- `blockId` (opcional): bloque exacto (`blk-*`) para deep-link.

### Dónde usar referencias

1. `question.contentRefs[]`: fuente conceptual base de la pregunta.
2. `options[].feedback.contentRefs[]`: remediación específica de error.
3. `explanation` (texto) puede complementar, pero el enlace duro lo da `contentRefs`.

## 6.3 Resolución en runtime (propuesta operativa)

Para cada `contentRef`:

1. Validar que `courseId` coincide con contexto del intento.
2. Cargar módulo por `moduleId`.
3. Buscar `chapterId` dentro del módulo.
4. Si existe `blockId`, verificar que el bloque vive en una sección del capítulo.
5. Construir `targetRef` navegable para UI (`kind: block/chapter` + `ref`).

Pseudocódigo:

```ts
type QuizContentRef = {
  courseId: string;
  moduleId: string;
  chapterId: string;
  blockId?: string;
};

function resolveRef(ref: QuizContentRef, moduleDoc: ModuleDoc) {
  if (moduleDoc.moduleId !== ref.moduleId) return { ok: false, reason: "module_mismatch" };

  const chapter = moduleDoc.chapters.find((c) => c.chapterId === ref.chapterId);
  if (!chapter) return { ok: false, reason: "chapter_not_found" };

  if (!ref.blockId) {
    return {
      ok: true,
      target: { kind: "chapter", ref: `${moduleDoc.moduleId}:${chapter.chapterId}` }
    };
  }

  const blockFound = chapter.sections.some((s) =>
    s.blocks.some((b) => b.id === ref.blockId)
  );
  if (!blockFound) return { ok: false, reason: "block_not_found" };

  return {
    ok: true,
    target: { kind: "block", ref: `${moduleDoc.moduleId}:${chapter.chapterId}:${ref.blockId}` }
  };
}
```

## 6.4 Estrategia de feedback accionable

Recomendación por intento:

- Si respuesta correcta:
  - mostrar feedback breve de consolidación;
  - sugerir contenido de profundización (`question.contentRefs`).
- Si respuesta incorrecta:
  - mostrar `options[respuesta].feedback.blocks`;
  - priorizar `options[respuesta].feedback.contentRefs`;
  - fallback a `question.contentRefs` si no hay referencias en opción.

Orden de prioridad de referencias:

1. `options[].feedback.contentRefs`
2. `question.contentRefs`
3. fallback a capítulo del `topic` en mapa de taxonomía

---

## 7) Validaciones fuertes recomendadas

Para preguntas `active`, bloquear si:

- falta campo obligatorio;
- `questionId` duplicado;
- `answer` referencia IDs inexistentes;
- política de calificación incompatible con `type`;
- opción sin `feedback`;
- `contentRefs` vacío;
- `contentRef` no resolvible contra módulos/capítulos/bloques reales.

Warnings (no bloqueantes):

- feedback sin `contentRefs` por opción;
- `estimatedTimeSec` fuera de rango por dificultad;
- sobreuso de mismo `topic` o `skillId`;
- explicaciones demasiado cortas.

---

## 8) Ejemplo completo (single choice con feedback enlazado)

```json
{
  "questionId": "ada-big-o-interpretacion-010",
  "questionVersion": 2,
  "status": "active",
  "type": "single_choice",
  "difficulty": "basic",
  "cognitiveLevel": "understand",
  "topic": "asymptotic_notation",
  "tags": ["big_o", "upper_bound", "definicion_formal"],
  "skillIds": ["skill.asymptotic.big_o.upper-bound-interpretation"],
  "prompt": {
    "blocks": [
      {
        "type": "markdown",
        "content": "Si $f(n)=3n^2+2n$, ¿cuál afirmación sobre $O(n^2)$ es correcta?"
      }
    ]
  },
  "options": [
    {
      "optionId": "a",
      "content": { "blocks": [{ "type": "markdown", "content": "Existe c,n0: f(n) <= c*n^2 para n>=n0" }] },
      "feedback": {
        "blocks": [{ "type": "markdown", "content": "Correcto: esa es la definición de cota superior asintótica." }],
        "contentRefs": [
          {
            "courseId": "ada",
            "moduleId": "mod-complejidad-temporal-y-espacial",
            "chapterId": "cap-crecimiento-asintotico",
            "blockId": "blk-notacion-theorem"
          }
        ]
      }
    },
    {
      "optionId": "b",
      "content": { "blocks": [{ "type": "markdown", "content": "f(n) = n^2 exacto para todo n" }] },
      "feedback": {
        "blocks": [{ "type": "markdown", "content": "Incorrecto: Big-O no exige igualdad exacta, exige cota superior." }],
        "contentRefs": [
          {
            "courseId": "ada",
            "moduleId": "mod-complejidad-temporal-y-espacial",
            "chapterId": "cap-crecimiento-asintotico",
            "blockId": "blk-definicion-big-o"
          }
        ]
      }
    }
  ],
  "answer": { "correctOptionIds": ["a"] },
  "gradingPolicy": { "mode": "all_or_nothing", "maxScore": 1, "penalty": 0 },
  "explanation": {
    "blocks": [
      {
        "type": "markdown",
        "content": "Para n grande, el término dominante es n^2; por eso existe una constante que acota superiormente."
      }
    ]
  },
  "contentRefs": [
    {
      "courseId": "ada",
      "moduleId": "mod-complejidad-temporal-y-espacial",
      "chapterId": "cap-crecimiento-asintotico",
      "blockId": "blk-definicion-big-o"
    }
  ],
  "selectionMeta": {
    "weight": 1,
    "estimatedTimeSec": 60,
    "targetMastery": 0.75,
    "prerequisiteSkillIds": [],
    "reinforcesSkillIds": ["skill.asymptotic.big_o.upper-bound-interpretation"],
    "exposureLimit": 3,
    "cooldownSessions": 2,
    "discrimination": "medium"
  }
}
```

---

## 9) Interoperabilidad con schemas de contenido

Para integrar quiz refs con contenido navegable (`shared.schema.json`):

- Resolver `contentRef` de quiz a `targetRef`:
  - capítulo: `{ "kind": "chapter", "ref": "mod-...:cap-..." }`
  - bloque: `{ "kind": "block", "ref": "mod-...:cap-...:blk-..." }`
- UI puede renderizar CTA tipo “Revisar teoría” usando el mismo patrón que `contentRefs` del módulo.

Ejemplo de transformación:

```ts
function toTargetRef(ref: {
  moduleId: string;
  chapterId: string;
  blockId?: string;
}) {
  return ref.blockId
    ? { kind: "block", ref: `${ref.moduleId}:${ref.chapterId}:${ref.blockId}` }
    : { kind: "chapter", ref: `${ref.moduleId}:${ref.chapterId}` };
}
```

Beneficio: se reutiliza infraestructura de navegación ya existente en contenido.

---

## 10) Checklist de authoring y QA

Antes de publicar banco:

1. Validar JSON schema de dataset y preguntas.
2. Verificar unicidad de IDs (`questionId`, `optionId`, `leftId`, `rightId`).
3. Verificar compatibilidad `type` <-> `answer` <-> `gradingPolicy`.
4. Resolver todos los `contentRefs`.
5. Probar render de `prompt/options/explanation/feedback` sin fallback ad hoc.
6. Probar feedback correcto/incorrecto en frontend.
7. Confirmar que selección ignora `draft/deprecated/archived`.

---

## 11) Decisiones prácticas recomendadas

- Mantener `courseId` estable por dataset; no mezclar cursos en un mismo banco.
- Usar `blockId` en feedback incorrecto para remediación precisa.
- Reservar `question.contentRefs` para fundamento general.
- Evitar feedback genérico; cada distractor debe corregir una confusión concreta.
- Incrementar `questionVersion` si cambia respuesta, dificultad, nivel cognitivo o política de grading.

---

## 12) Anti-patrones

- Preguntas `active` sin `contentRefs`.
- `feedback` sin guiar al contenido.
- Reutilizar el mismo feedback para todos los distractores.
- Evaluación que dependa de interpretar texto libre.
- Preguntas sobre uso de la herramienta en vez de dominio ADA.

---

## 13) Mapa rápido de campos (referencia)

```txt
Dataset
 ├─ schemaVersion
 ├─ datasetId
 ├─ locale
 ├─ courseId
 ├─ taxonomyVersion
 └─ questions[]
     ├─ questionId, questionVersion, status, type
     ├─ difficulty, cognitiveLevel, topic, tags[], skillIds[]
     ├─ prompt.blocks[]
     ├─ options[] | leftItems[] + rightItems[]
     ├─ answer
     ├─ gradingPolicy
     ├─ explanation.blocks[]
     ├─ contentRefs[] (course/module/chapter/block)
     └─ selectionMeta
```

## Archivos relacionados

- `docs/08-content/quiz-json-schema.md`
- `docs/08-content/course-json-schema.md`
- `packages/content-data/quizzes/quiz-bank.sample.json`
- `packages/content-data/quizzes/ada-quiz-bank.json`
- `packages/content-catalog/schemas/module.schema.json`
- `packages/content-catalog/schemas/shared.schema.json`
