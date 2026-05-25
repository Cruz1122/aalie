# Contrato exacto para insertar preguntas

**Estado:** reemplazado
**Reemplazado por:** `quiz-json-schema.md`
**Nota:** Documento histórico. El contrato exacto de inserción está cubierto en `quiz-json-schema.md` (sección Dataset y Answer types).

Este contrato aplica a `python scripts/manage_quiz_bank.py insert --input "<archivo>.json"`.

## Formato del archivo de entrada

Se aceptan exactamente 2 formatos:

1) Array de preguntas:

```json
[
  { "...pregunta..." }
]
```

2) Objeto con clave `questions`:

```json
{
  "questions": [
    { "...pregunta..." }
  ]
}
```

## Estructura exacta por pregunta

```json
{
  "questionId": "string",
  "questionVersion": 1,
  "status": "draft|active|deprecated|archived",
  "type": "single_choice|multiple_choice|true_false|ordering|match_pairs",
  "difficulty": "basic|intermediate|advanced",
  "cognitiveLevel": "recall|understand|apply|analyze",
  "topic": "string",
  "tags": ["string"],
  "skillIds": ["string"],
  "prompt": {
    "blocks": [
      {
        "type": "markdown|code",
        "content": "string",
        "language": "aalie-pseudocode|text"
      }
    ]
  },
  "options": [
    {
      "optionId": "string",
      "content": {
        "blocks": [
          {
            "type": "markdown|code",
            "content": "string",
            "language": "aalie-pseudocode|text"
          }
        ]
      },
      "feedback": {
        "blocks": [
          {
            "type": "markdown|code",
            "content": "string",
            "language": "aalie-pseudocode|text"
          }
        ],
        "contentRefs": [
          {
            "courseId": "ada",
            "moduleId": "string",
            "chapterId": "string",
            "blockId": "string-opcional"
          }
        ]
      }
    }
  ],
  "leftItems": [
    {
      "leftId": "string",
      "content": {
        "blocks": [
          {
            "type": "markdown|code",
            "content": "string",
            "language": "aalie-pseudocode|text"
          }
        ]
      }
    }
  ],
  "rightItems": [
    {
      "rightId": "string",
      "content": {
        "blocks": [
          {
            "type": "markdown|code",
            "content": "string",
            "language": "aalie-pseudocode|text"
          }
        ]
      }
    }
  ],
  "answer": {
    "correctOptionIds": ["string"],
    "orderedOptionIds": ["string"],
    "pairs": [
      {
        "leftId": "string",
        "rightId": "string"
      }
    ]
  },
  "gradingPolicy": {
    "mode": "all_or_nothing|exact_set|partial_credit|ordered_exact|pairwise",
    "maxScore": 1,
    "penalty": 0,
    "minScore": 0
  },
  "explanation": {
    "blocks": [
      {
        "type": "markdown|code",
        "content": "string",
        "language": "aalie-pseudocode|text"
      }
    ]
  },
  "contentRefs": [
    {
      "courseId": "ada",
      "moduleId": "string",
      "chapterId": "string",
      "blockId": "string-opcional"
    }
  ],
  "selectionMeta": {
    "weight": 1,
    "estimatedTimeSec": 60,
    "targetMastery": 0.75,
    "prerequisiteSkillIds": ["string"],
    "reinforcesSkillIds": ["string"],
    "exposureLimit": 3,
    "cooldownSessions": 0,
    "discrimination": "low|medium|high"
  }
}
```

## Taxonomía válida (exacta)

Fuente: `packages/content-data/quizzes/ada-taxonomy.json`.

### topics válidos

`asymptotic_notation`, `function_growth`, `common_functions`, `algorithm_analysis`, `elementary_operations`, `temporal_complexity`, `spatial_complexity`, `probability`, `correctness`, `loop_invariant`, `limits`, `series`, `divide_and_conquer`, `merge_sort`, `quick_sort`, `heaps`, `heap_sort`, `priority_queues`, `recurrence_equations`, `iteration_method`, `recursion_tree_method`, `master_theorem`, `intelligent_substitution`, `characteristic_equation`, `greedy_algorithms`, `backtracking`, `branch_and_bound`, `heuristics`, `uniform_cost_search`, `best_first_search`, `a_star`, `minimax`, `alpha_beta_pruning`, `dynamic_programming`, `algorithm_analysis_fundamentals`, `input_size`, `semantic_analysis`, `cost_analysis`, `algorithm_specification`, `algorithm_correctness`, `algorithm_formulation`

### tags válidos

`big_o`, `theta`, `limits`, `correctness`, `loop_invariant`, `recurrence`, `elementary_operations`, `temporal_complexity`, `master_theorem`, `analysis_vs_measurement`, `machine_independence`, `growth_order`, `constant_factors`, `same_algorithm`, `input_size`, `arrays`, `parameters`, `ram_model`, `constant_cost`, `comparison`, `pseudocode_structure`, `non_operations`, `cost_table`, `dominant_operation`, `array_traversal`, `cost_analysis`, `algorithm_purpose`, `counting`, `state_variable`, `accumulator`, `for_loop`, `body_cost`, `nested_reasoning`, `multiple_parameters`, `n_m`, `input_model`, `precondition`, `postcondition`, `maximum`, `array`, `invariant`, `array_prefix`, `initialization`, `proof`, `maintenance`, `termination`, `finalization`, `bad_invariant`, `precision`, `sum`, `before_iteration`, `prefix`, `partial_correctness`, `search`, `sentinel_value`, `output_specification`, `control_structure`, `while_loop`, `early_stop`, `problem_statement`, `input_output`, `constraints`, `edge_cases`, `algorithm_patterns`, `classification`, `problem_purpose`

### skills válidas

`skill.asymptotic.big_o.upper-bound-interpretation`, `skill.asymptotic.theta.identify-equivalent-order`, `skill.elementary.operations.counting`, `skill.limits.series.growth-comparison`, `skill.correctness.loop-invariant.three-moments`, `skill.recurrences.method-selection`, `skill.recurrences.master.case-selection`, `skill.analysis.distinguish-algorithm-analysis-from-runtime-measurement`, `skill.analysis.reason-about-constant-factors`, `skill.analysis.identify-input-size`, `skill.analysis.identify-elementary-operations`, `skill.analysis.avoid-counting-structural-tokens`, `skill.analysis.identify-dominant-operation-in-iterative-code`, `skill.semantic.identify-algorithm-purpose`, `skill.semantic.identify-state-variable`, `skill.analysis.avoid-superficial-loop-classification`, `skill.analysis.identify-multiple-input-parameters`, `skill.specification.distinguish-precondition-postcondition`, `skill.specification.write-postcondition-from-code`, `skill.invariant.formulate-invariant-for-maximum`, `skill.invariant.explain-initialization`, `skill.invariant.explain-maintenance`, `skill.invariant.explain-finalization`, `skill.invariant.detect-bad-invariant`, `skill.invariant.formulate-invariant-for-sum`, `skill.invariant.interpret-before-iteration-state`, `skill.correctness.distinguish-termination-from-correctness`, `skill.specification.define-output-for-not-found-case`, `skill.formulation.choose-control-structure-for-full-traversal`, `skill.formulation.choose-control-structure-for-search`, `skill.formulation.extract-required-information-from-statement`, `skill.semantic.classify-algorithm-purpose`

## Reglas exactas que bloquean inserción

- `questionId` obligatorio, no vacío, único en lote y único contra banco.
- `questionVersion >= 1`.
- `prompt.blocks` no vacío.
- `explanation.blocks` no vacío.
- `status = active` exige `contentRefs` no vacío y resoluble en catálogo real.
- `topic` debe existir en taxonomía válida.
- cada `tag` debe existir en taxonomía válida.
- cada `skillId` debe existir en taxonomía válida.
- `options[].optionId` no duplicado.
- cada opción requiere `feedback.blocks` no vacío.
- markdown no puede contener HTML arbitrario.

### Reglas por tipo

- `single_choice`
  - `answer.correctOptionIds` con exactamente 1 id.
  - `gradingPolicy.mode = all_or_nothing`.

- `true_false`
  - `options` debe ser exactamente `true` y `false`.
  - `answer.correctOptionIds` con exactamente 1 id.
  - `gradingPolicy.mode = all_or_nothing`.

- `multiple_choice`
  - `answer.correctOptionIds` con al menos 1 id.
  - `gradingPolicy.mode` en `all_or_nothing|exact_set|partial_credit`.

- `ordering`
  - `answer.orderedOptionIds` debe contener todos los `optionId` exactamente una vez.
  - `gradingPolicy.mode` en `ordered_exact|partial_credit`.

- `match_pairs`
  - `leftItems[].leftId` único.
  - `rightItems[].rightId` único.
  - cada par en `answer.pairs` debe referenciar ids existentes.
  - `gradingPolicy.mode` en `pairwise|all_or_nothing`.

## Importante

- `insert` valida TODO el dataset final (banco actual + lote nuevo).
- Si hay un error en cualquier pregunta del dataset final, no guarda cambios.
