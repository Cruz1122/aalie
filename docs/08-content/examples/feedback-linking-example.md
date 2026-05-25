# Ejemplo de feedback y contentRef linking

**Tipo:** ejemplo
**Audiencia:** autor-contenido
**Fuente de verdad:** `quiz-json-schema.md`, `adaptive-quizzes.md`
**Última revisión:** 2026-05-18

## Propósito

Mostrar cómo se estructura el feedback por opción con enlaces a contenido del curso (`contentRefs`) para crear un sistema de remediación trazable.

## Estructura de feedback

Cada opción de pregunta tiene:
1. **`content`**: el texto visible de la opción.
2. **`feedback.blocks`**: mensaje de retroalimentación específico.
3. **`feedback.contentRefs`**: enlaces a contenido de repaso.

Además, cada pregunta tiene:
4. **`explanation`**: explicación general del tema.
5. **`contentRefs`**: referencias base de la pregunta.

## Ejemplo completo: single_choice con feedback enlazado

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
      "content": {
        "blocks": [
          { "type": "markdown", "content": "Existe $c, n_0$ tal que $f(n) \\leq c \\cdot n^2$ para $n \\geq n_0$" }
        ]
      },
      "feedback": {
        "blocks": [
          { "type": "markdown", "content": "✅ Correcto: esa es la definición de cota superior asintótica. Como $3n^2+2n \\leq 4n^2$ para $n \\geq 2$, se cumple la definición." }
        ],
        "contentRefs": [
          {
            "courseId": "ada",
            "moduleId": "mod-notacion-asintotica",
            "chapterId": "cap-big-o",
            "blockId": "blk-definicion-formal-big-o"
          }
        ]
      }
    },
    {
      "optionId": "b",
      "content": {
        "blocks": [
          { "type": "markdown", "content": "$f(n) = n^2$ exactamente para todo $n$" }
        ]
      },
      "feedback": {
        "blocks": [
          { "type": "markdown", "content": "❌ Incorrecto. Big-O **no exige igualdad exacta**, solo una cota superior. Revisa la definición formal en el módulo." }
        ],
        "contentRefs": [
          {
            "courseId": "ada",
            "moduleId": "mod-notacion-asintotica",
            "chapterId": "cap-big-o",
            "blockId": "blk-definicion-formal-big-o"
          }
        ]
      }
    },
    {
      "optionId": "c",
      "content": {
        "blocks": [
          { "type": "markdown", "content": "$f(n) \\geq c \\cdot n^2$ para todo $n \\geq n_0$" }
        ]
      },
      "feedback": {
        "blocks": [
          { "type": "markdown", "content": "❌ Incorrecto. Esa es la definición de **cota inferior** ($\\Omega$), no de cota superior ($O$). Revisa la diferencia entre ambas notaciones." }
        ],
        "contentRefs": [
          {
            "courseId": "ada",
            "moduleId": "mod-notacion-asintotica",
            "chapterId": "cap-omega",
            "blockId": "blk-definicion-omega"
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
        "content": "Para $n$ grande, el término dominante de $f(n)=3n^2+2n$ es $3n^2$. Por definición, $f(n) \\in O(n^2)$ si existen constantes $c>0$ y $n_0\\geq 1$ tales que $f(n) \\leq c \\cdot n^2$ para todo $n \\geq n_0$. En este caso, $c=4$ y $n_0=2$ funcionan."
      }
    ]
  },
  "contentRefs": [
    {
      "courseId": "ada",
      "moduleId": "mod-notacion-asintotica",
      "chapterId": "cap-big-o",
      "blockId": "blk-definicion-formal-big-o"
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

## Estrategia de feedback por estado

### Respuesta correcta
- Mostrar feedback breve de consolidación.
- El `contentRefs` de la opción apunta al mismo bloque que `question.contentRefs`.
- UI: CTA opcional "Profundizar en este tema".

### Respuesta incorrecta
- Mostrar feedback específico del error conceptual.
- El `contentRefs` de la opción incorrecta debe apuntar al bloque de remediación más relevante.
- Orden de prioridad de referencias:
  1. `options[respuesta].feedback.contentRefs` (más específico)
  2. `question.contentRefs` (general)
  3. Fallback a capítulo del `topic` en mapa de taxonomía

## Buenas prácticas

1. **Feedback correcto**: Explica por qué es correcto, no solo "Correcto".
2. **Feedback incorrecto**: Explica el error conceptual específico, no solo "Incorrecto".
3. **ContentRefs precisos**: Usar `blockId` cuando sea posible para deep-link directo.
4. **Distractores reales**: Cada distractor debe representar un error real que cometen los estudiantes.
5. **Sin feedback genérico**: No reutilizar el mismo feedback para todos los distractores.

## Mapeo de contentRef a targetRef navegable

```typescript
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

Este patrón permite que la UI renderice botones "Revisar teoría" usando la misma infraestructura de navegación que los `contentRefs` del módulo.
