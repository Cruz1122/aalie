# Benchmarking

**Tipo:** normativa

## Propósito

Definir cómo se miden benchmarks reproducibles en AALIE y cómo se separan de los oráculos semánticos.

## Alcance

Aplica a dos familias distintas de evaluación:

1. benchmarks de rendimiento y regresión del motor
2. benchmark comparativo AALIE vs Direct LLM sobre `LLM40`

No reemplaza los oráculos semánticos del dataset principal de 80 casos.

## Fuente de verdad

- `apps/api/tests/benchmark/`
- `apps/api/tests/oracles/`
- `apps/api/tests/llm_comparison/`

## Niveles de evaluación

### 1. Oracle dataset (80 casos)

El dataset de oráculos de AALIE es la referencia semántica principal del motor determinista.

Responsabilidades:

- validar que AALIE produce el resultado contractual correcto
- caracterizar gaps conocidos
- servir como base para derivar benchmarks secundarios

Artefactos relevantes:

- `apps/api/tests/oracles/oracle_index.*.json`
- `apps/api/tests/oracles/sources/*.aalie`
- `apps/api/tests/oracles/out/oracle_results.csv`
- `apps/api/tests/oracles/out/oracle_summary.json`

### 2. Balanced LLM40 benchmark

`LLM40` es un subconjunto balanceado de 40 casos derivado del dataset de 80 oráculos.

Distribución activa:

| Group | Cases |
|---|---:|
| `iterative_strict` | 12 |
| `recursive_strict` | 10 |
| `while_strict` | 8 |
| `unsupported_parser` | 6 |
| `regression_gaps` | 4 |
| **Total** | **40** |

Objetivo:

- comparar AALIE contra un LLM directo sobre una muestra representativa
- evitar sesgo adversarial sobre WHILE, unsupported o gaps
- mantener scoring determinista con gold targets separados del prompt dataset

Artefactos activos:

- `apps/api/tests/llm_comparison/llm40_cases.seed.json`
- `apps/api/tests/llm_comparison/llm40_index.json`
- `apps/api/tests/llm_comparison/llm40_gold.jsonl`
- `apps/api/tests/llm_comparison/llm40_prompt_dataset.jsonl`
- `apps/api/tests/llm_comparison/out/aalie40_results.csv`
- `apps/api/tests/llm_comparison/out/aalie40_summary.json`
- `apps/api/tests/llm_comparison/out/llm40_aalie_vs_llm_report.md`

## Benchmark rules

### LLM40 scoring

The comparison is gold-driven:

- gold is the source of truth
- AALIE is scored against gold
- the direct LLM is scored against gold
- the comparison uses the same metrics for both systems

Main metrics:

- `theta_accuracy_exact`
- `theta_accuracy_shape_aware`
- `explicit_safe_rejection`
- `non_hallucination`
- `hallucinated_bound_rate`
- `ideal_gap_recovery`

Denominators are not hardcoded to 40 except for total pass.

### Output contract

The direct LLM output is evaluated strictly:

- analyzable cases must populate `big_theta`
- unsupported cases must reject explicitly and avoid asymptotic bounds
- correct prose does not compensate for missing required structured fields

## Performance benchmarks

The traditional runtime/performance benchmark layer still exists and remains separate from LLM40.

Examples:

- iterative performance regression
- WHILE performance regression
- recursive performance regression
- export performance regression

These benchmarks measure reproducibility of runtime behavior, not semantic correctness.

## Operational distinction

| Layer | Primary question | Source of truth |
|---|---|---|
| Oráculos (80) | “¿AALIE está correcto?” | gold oracle dataset |
| LLM40 | “¿Cómo se compara AALIE con un LLM directo?” | gold derived from oracle dataset |
| `tests/benchmark/` | “¿Hubo regresión de rendimiento?” | repeated timing in same environment |

## Current observed LLM40 comparison result

From the active generated report:

| Metric | AALIE | Direct LLM |
|---|---:|---:|
| Total pass | `33/40` | `33/40` |
| Theta accuracy exact | `26/33` | `26/33` |
| Theta accuracy shape-aware | `30/33` | `28/33` |
| Explicit safe rejection | `7/7` | `7/7` |
| Non-hallucination | `7/7` | `7/7` |
| Hallucinated bound rate | `0/7` | `0/7` |
| Ideal gap recovery | `1/4` | `3/4` |

Interpretation:

- AALIE is stronger on balanced iterative and recursive strict families
- the direct LLM is stronger on known-gap recovery and most strict WHILE cases
- both systems currently tie under strict total pass
- shape-aware agreement still favors AALIE

## Commands

Generate AALIE benchmark artifacts:

`python apps/api/tests/llm_comparison/select_llm40_cases.py`

`python apps/api/tests/llm_comparison/run_aalie_outputs.py --index apps/api/tests/llm_comparison/llm40_index.json --out-dir apps/api/tests/llm_comparison/out`

Generate the comparison report:

`python apps/api/tests/llm_comparison/score_llm40_outputs.py --llm-jsonl apps/api/tests/llm_comparison/llm40_llm_outputs.jsonl --gold-jsonl apps/api/tests/llm_comparison/llm40_gold.jsonl --aalie-csv apps/api/tests/llm_comparison/out/aalie40_results.csv --out-md apps/api/tests/llm_comparison/out/llm40_aalie_vs_llm_report.md`

## Limits known

- strict total pass is a contract metric, not a pure mathematical-equivalence metric
- shape-aware agreement and strict structured-output agreement must be reported separately
- runtime benchmarks and semantic benchmarks must not be mixed in the same conclusion

## Related files

- `algorithm-oracles.md`
- `testing-strategy.md`
- `experimental-results.md`
- `performance.md`
