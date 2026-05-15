# Ejemplo de preguntas de quiz

**Tipo:** ejemplo
**Audiencia:** autor-contenido
**Fuente de verdad:** `quiz-json-schema.md`, `examples/quiz-bank.sample.json`
**Última revisión:** 2026-05-18

## Propósito

Este ejemplo muestra los 5 tipos de pregunta soportados con estructura JSON completa.

## 1. single_choice

```json
{
  "questionId": "ada-asymptotic-notation-basic-001",
  "questionVersion": 1,
  "status": "active",
  "type": "single_choice",
  "difficulty": "basic",
  "cognitiveLevel": "recall",
  "topic": "asymptotic_notation",
  "tags": ["big_o", "limits"],
  "skillIds": ["skill.asymptotic.big_o.upper-bound-interpretation"],
  "prompt": {
    "blocks": [
      {
        "type": "markdown",
        "content": "¿Cuál de las siguientes afirmaciones sobre la notación $O(n^2)$ es correcta?"
      }
    ]
  },
  "options": [
    {
      "optionId": "a",
      "content": {
        "blocks": [
          {
            "type": "markdown",
            "content": "$f(n) \\leq c \\cdot n^2$ para todo $n \\geq n_0$"
          }
        ]
      },
      "feedback": {
        "blocks": [
          { "type": "markdown", "content": "Correcto. La definición de $O(g(n))$ exige que existan constantes $c > 0$ y $n_0 \\geq 1$ tales que $0 \\leq f(n) \\leq c \\cdot g(n)$ para todo $n \\geq n_0$." }
        ],
        "contentRefs": [
          {
            "courseId": "ada",
            "moduleId": "mod-notacion-asintotica",
            "chapterId": "cap-big-o",
            "blockId": "blk-definicion-big-o"
          }
        ]
      }
    },
    {
      "optionId": "b",
      "content": {
        "blocks": [
          {
            "type": "markdown",
            "content": "$f(n) = n^2$ para todo $n$"
          }
        ]
      },
      "feedback": {
        "blocks": [
          { "type": "markdown", "content": "Incorrecto. Big-O no exige igualdad exacta, solo una cota superior asintótica." }
        ],
        "contentRefs": [
          {
            "courseId": "ada",
            "moduleId": "mod-notacion-asintotica",
            "chapterId": "cap-big-o",
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
        "content": "La notación $O(g(n))$ define un conjunto de funciones: $O(g(n)) = \\{f(n): \\exists c > 0, n_0 \\geq 1 \\text{ tal que } 0 \\leq f(n) \\leq c \\cdot g(n) \\text{ para todo } n \\geq n_0\\}$."
      }
    ]
  },
  "contentRefs": [
    {
      "courseId": "ada",
      "moduleId": "mod-notacion-asintotica",
      "chapterId": "cap-big-o",
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

## 2. multiple_choice

```json
{
  "questionId": "ada-complexity-properties-001",
  "questionVersion": 1,
  "status": "active",
  "type": "multiple_choice",
  "difficulty": "intermediate",
  "cognitiveLevel": "understand",
  "topic": "temporal_complexity",
  "tags": ["complexity_analysis", "elementary_operations", "cost_table"],
  "skillIds": ["skill.analysis.identify-dominant-operation-in-iterative-code"],
  "prompt": {
    "blocks": [
      {
        "type": "markdown",
        "content": "¿Cuáles de las siguientes afirmaciones sobre el análisis de algoritmos iterativos son correctas? (Selecciona todas las que apliquen)"
      }
    ]
  },
  "options": [
    {
      "optionId": "a",
      "content": {
        "blocks": [
          { "type": "markdown", "content": "El costo de un ciclo for simple es la suma del costo del cuerpo por el número de iteraciones." }
        ]
      },
      "feedback": {
        "blocks": [
          { "type": "markdown", "content": "Correcto. Un ciclo for suma el costo del cuerpo tantas veces como iteraciones tenga." }
        ],
        "contentRefs": []
      }
    },
    {
      "optionId": "b",
      "content": {
        "blocks": [
          { "type": "markdown", "content": "Dos ciclos for anidados siempre producen complejidad $O(n^2)$." }
        ]
      },
      "feedback": {
        "blocks": [
          { "type": "markdown", "content": "Incorrecto. Depende de los límites de cada ciclo. Si el interno depende del externo, la complejidad puede ser diferente." }
        ],
        "contentRefs": []
      }
    },
    {
      "optionId": "c",
      "content": {
        "blocks": [
          { "type": "markdown", "content": "Las operaciones elementales tienen costo constante $O(1)$ en el modelo RAM." }
        ]
      },
      "feedback": {
        "blocks": [
          { "type": "markdown", "content": "Correcto. En el modelo RAM, cada operación elemental tiene costo constante." }
        ],
        "contentRefs": []
      }
    }
  ],
  "answer": { "correctOptionIds": ["a", "c"] },
  "gradingPolicy": { "mode": "partial_credit", "maxScore": 1, "penalty": 0.1 },
  "explanation": {
    "blocks": [
      {
        "type": "markdown",
        "content": "El análisis de algoritmos iterativos se basa en identificar la operación dominante y contar cuántas veces se ejecuta."
      }
    ]
  },
  "contentRefs": [
    {
      "courseId": "ada",
      "moduleId": "mod-complejidad-temporal-espacial",
      "chapterId": "cap-analisis-iterativo"
    }
  ],
  "selectionMeta": {
    "weight": 1,
    "estimatedTimeSec": 90,
    "targetMastery": 0.75,
    "prerequisiteSkillIds": [],
    "reinforcesSkillIds": ["skill.analysis.identify-dominant-operation-in-iterative-code"],
    "exposureLimit": 3,
    "cooldownSessions": 2,
    "discrimination": "high"
  }
}
```

## 3. true_false

```json
{
  "questionId": "ada-loop-invariant-truefalse-001",
  "questionVersion": 1,
  "status": "active",
  "type": "true_false",
  "difficulty": "basic",
  "cognitiveLevel": "recall",
  "topic": "loop_invariant",
  "tags": ["correctness", "invariant"],
  "skillIds": ["skill.correctness.loop-invariant.three-moments"],
  "prompt": {
    "blocks": [
      {
        "type": "markdown",
        "content": "Un invariante de ciclo debe cumplirse en tres momentos: inicialización, mantenimiento y terminación."
      }
    ]
  },
  "options": [
    {
      "optionId": "true",
      "content": { "blocks": [{ "type": "markdown", "content": "Verdadero" }] },
      "feedback": {
        "blocks": [{ "type": "markdown", "content": "Correcto. Los tres momentos del invariante son inicialización, mantenimiento y terminación." }],
        "contentRefs": [{
          "courseId": "ada",
          "moduleId": "mod-loop-invariant",
          "chapterId": "cap-tres-momentos"
        }]
      }
    },
    {
      "optionId": "false",
      "content": { "blocks": [{ "type": "markdown", "content": "Falso" }] },
      "feedback": {
        "blocks": [{ "type": "markdown", "content": "Incorrecto. Los tres momentos —inicialización, mantenimiento y terminación— son la base de la demostración por invariante." }],
        "contentRefs": [{
          "courseId": "ada",
          "moduleId": "mod-loop-invariant",
          "chapterId": "cap-tres-momentos"
        }]
      }
    }
  ],
  "answer": { "correctOptionIds": ["true"] },
  "gradingPolicy": { "mode": "all_or_nothing", "maxScore": 1, "penalty": 0 },
  "explanation": {
    "blocks": [
      { "type": "markdown", "content": "El método del invariante de ciclo requiere verificar: (1) Inicialización: el invariante se cumple antes de la primera iteración. (2) Mantenimiento: si se cumple antes de una iteración, sigue cumpliéndose después. (3) Terminación: al terminar el ciclo, el invariante más la condición de término implican la correctitud." }
    ]
  },
  "contentRefs": [
    {
      "courseId": "ada",
      "moduleId": "mod-loop-invariant",
      "chapterId": "cap-tres-momentos"
    }
  ],
  "selectionMeta": {
    "weight": 1,
    "estimatedTimeSec": 30,
    "targetMastery": 0.7,
    "prerequisiteSkillIds": [],
    "reinforcesSkillIds": ["skill.correctness.loop-invariant.three-moments"],
    "exposureLimit": 3,
    "cooldownSessions": 1,
    "discrimination": "low"
  }
}
```

## 4. ordering

```json
{
  "questionId": "ada-recurrence-ordering-001",
  "questionVersion": 1,
  "status": "active",
  "type": "ordering",
  "difficulty": "intermediate",
  "cognitiveLevel": "apply",
  "topic": "recurrence_equations",
  "tags": ["recurrence", "iteration_method", "substitution"],
  "skillIds": ["skill.recurrences.method-selection"],
  "prompt": {
    "blocks": [
      {
        "type": "markdown",
        "content": "Ordena los siguientes pasos para resolver la recurrencia $T(n) = 2T(n/2) + n$ por el método de expansión."
      }
    ]
  },
  "options": [
    {
      "optionId": "step-1",
      "content": { "blocks": [{ "type": "markdown", "content": "Expandir la recurrencia: $T(n) = 2T(n/2) + n$" }] },
      "feedback": {
        "blocks": [{ "type": "markdown", "content": "Correcto. El primer paso es escribir la recurrencia." }],
        "contentRefs": [{
          "courseId": "ada",
          "moduleId": "mod-teorema-maestro",
          "chapterId": "cap-iteracion"
        }]
      }
    },
    {
      "optionId": "step-2",
      "content": { "blocks": [{ "type": "markdown", "content": "Sustituir $T(n/2) = 2T(n/4) + n/2$" }] },
      "feedback": {
        "blocks": [{ "type": "markdown", "content": "Correcto. Se expande un nivel más." }],
        "contentRefs": [{
          "courseId": "ada",
          "moduleId": "mod-teorema-maestro",
          "chapterId": "cap-iteracion"
        }]
      }
    },
    {
      "optionId": "step-3",
      "content": { "blocks": [{ "type": "markdown", "content": "Identificar el patrón: $T(n) = 2^k T(n/2^k) + k \\cdot n$" }] },
      "feedback": {
        "blocks": [{ "type": "markdown", "content": "Correcto. Después de k expansiones." }],
        "contentRefs": [{
          "courseId": "ada",
          "moduleId": "mod-teorema-maestro",
          "chapterId": "cap-iteracion"
        }]
      }
    },
    {
      "optionId": "step-4",
      "content": { "blocks": [{ "type": "markdown", "content": "Aplicar caso base $T(1) = 1$ con $k = \\log_2 n$" }] },
      "feedback": {
        "blocks": [{ "type": "markdown", "content": "Correcto. El último paso da $T(n) = n + n \\log n = O(n \\log n)$." }],
        "contentRefs": [{
          "courseId": "ada",
          "moduleId": "mod-teorema-maestro",
          "chapterId": "cap-iteracion"
        }]
      }
    }
  ],
  "answer": { "orderedOptionIds": ["step-1", "step-2", "step-3", "step-4"] },
  "gradingPolicy": { "mode": "ordered_exact", "maxScore": 1, "penalty": 0 },
  "explanation": {
    "blocks": [
      { "type": "markdown", "content": "El método de expansión (o iteración) expande la recurrencia nivel por nivel hasta identificar un patrón, luego aplica el caso base." }
    ]
  },
  "contentRefs": [
    {
      "courseId": "ada",
      "moduleId": "mod-teorema-maestro",
      "chapterId": "cap-iteracion"
    }
  ],
  "selectionMeta": {
    "weight": 1,
    "estimatedTimeSec": 120,
    "targetMastery": 0.8,
    "prerequisiteSkillIds": ["skill.recurrences.method-selection"],
    "reinforcesSkillIds": ["skill.recurrences.method-selection"],
    "exposureLimit": 2,
    "cooldownSessions": 3,
    "discrimination": "high"
  }
}
```

## 5. match_pairs

```json
{
  "questionId": "ada-growth-match-001",
  "questionVersion": 1,
  "status": "active",
  "type": "match_pairs",
  "difficulty": "basic",
  "cognitiveLevel": "understand",
  "topic": "function_growth",
  "tags": ["growth_order", "comparison"],
  "skillIds": ["skill.limits.series.growth-comparison"],
  "prompt": {
    "blocks": [
      { "type": "markdown", "content": "Empareja cada función con su orden de crecimiento asintótico." }
    ]
  },
  "leftItems": [
    { "leftId": "left-1", "content": { "blocks": [{ "type": "markdown", "content": "$f(n) = n^2$" }] } },
    { "leftId": "left-2", "content": { "blocks": [{ "type": "markdown", "content": "$f(n) = 2^n$" }] } },
    { "leftId": "left-3", "content": { "blocks": [{ "type": "markdown", "content": "$f(n) = n \\log n$" }] } }
  ],
  "rightItems": [
    { "rightId": "right-1", "content": { "blocks": [{ "type": "markdown", "content": "$\\Theta(n^2)$" }] } },
    { "rightId": "right-2", "content": { "blocks": [{ "type": "markdown", "content": "$\\Theta(2^n)$" }] } },
    { "rightId": "right-3", "content": { "blocks": [{ "type": "markdown", "content": "$\\Theta(n \\log n)$" }] } }
  ],
  "answer": {
    "pairs": [
      { "leftId": "left-1", "rightId": "right-1" },
      { "leftId": "left-2", "rightId": "right-2" },
      { "leftId": "left-3", "rightId": "right-3" }
    ]
  },
  "gradingPolicy": { "mode": "pairwise", "maxScore": 1, "penalty": 0 },
  "explanation": {
    "blocks": [
      { "type": "markdown", "content": "El orden de crecimiento determina cómo se comporta la función cuando $n$ tiende a infinito." }
    ]
  },
  "contentRefs": [
    {
      "courseId": "ada",
      "moduleId": "mod-notacion-asintotica",
      "chapterId": "cap-funciones-comunes"
    }
  ],
  "selectionMeta": {
    "weight": 1,
    "estimatedTimeSec": 60,
    "targetMastery": 0.7,
    "prerequisiteSkillIds": [],
    "reinforcesSkillIds": ["skill.limits.series.growth-comparison"],
    "exposureLimit": 3,
    "cooldownSessions": 2,
    "discrimination": "medium"
  }
}
```
