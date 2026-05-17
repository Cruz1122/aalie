# Oráculos de algoritmos

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | evaluador
**Fuente de verdad:** `apps/api/tests/oracles/`, `apps/api/tests/_shared/helpers/analysis_oracle.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** oráculos, testing-strategy, benchmarking

## Propósito

Centralizar el dataset principal de oráculos semánticos de AALIE y su rol como fuente de verdad del motor determinista.

## Alcance

Aplica al dataset principal de 80 casos usado para:

- validar corrección semántica de AALIE
- caracterizar gaps conocidos
- servir como fuente de derivación para benchmarks secundarios como `LLM40`

No describe el benchmark comparativo AALIE vs Direct LLM; ese flujo vive en `benchmarking.md`.

## Dataset principal de oráculos

El dataset actual se organiza en:

- `oracle_index.for.json`
- `oracle_index.if_while.json`
- `oracle_index.while_u_recursive.json`
- `oracle_index.export_parser.json`
- `sources/*.aalie`

Artefactos generados:

- `apps/api/tests/oracles/out/oracle_results.csv`
- `apps/api/tests/oracles/out/oracle_summary.json`
- `apps/api/tests/oracles/out/oracle_failures_and_gaps.md`

## Distribución actual del dataset de 80 casos

| Family | Count |
|---|---:|
| `for_simple` | 10 |
| `for_nested` | 10 |
| `conditional` | 8 |
| `while_supported` | 16 |
| `while_unsupported` | 8 |
| `recursive_divide_conquer` | 11 |
| `recursive_linear_shift` | 9 |
| `parser_negative` | 2 |
| `snapshot_export` | 6 |
| **Total** | **80** |

## Expectation kinds

The oracle dataset uses four main expectation kinds:

| expectationKind | Meaning |
|---|---|
| `strict_math` | AALIE should match the mathematical target |
| `expected_unsupported` | AALIE should reject safely |
| `regression_characterization` | Known engine limitation documented intentionally |
| `pending_integration` | Export-related integration contract not fully closed |

## Role of the oracle dataset

This dataset answers one question:

**Is AALIE correct against its official semantic reference set?**

It is not the same as the LLM benchmark.

### Oracle dataset vs LLM40

| Dataset | Main purpose |
|---|---|
| 80-oracle dataset | Validate AALIE itself |
| LLM40 balanced benchmark | Compare AALIE against a direct LLM using gold derived from the oracle dataset |

## Validation model

Each oracle validates real semantic expectations, not just absence of exceptions.

Examples:

- exact or normalized asymptotic notation
- recurrence family
- method selection for recursive algorithms
- WHILE pattern recognition
- explicit unsupported handling
- parser rejection for malformed pseudocode

## Canonical examples

Representative cases in the oracle dataset:

| ID | Family | Target |
|---|---|---|
| `FOR-002` | for_simple | `Theta(n)` |
| `FOR-008` | for_simple | `Theta(n+m)` |
| `NEST-004` | for_nested | `Theta(n^2)` |
| `WHILE-S-005` | while_supported | `Theta(log n)` |
| `WHILE-U-001` | while_unsupported | explicit unsupported rejection |
| `REC-DC-001` | recursive_divide_conquer | `Theta(n log n)` |
| `REC-LS-004` | recursive_linear_shift | Fibonacci exponential shape |
| `PARSE-001` | parser_negative | parse failure |

## Characterized gaps

The oracle dataset explicitly tracks known limitations rather than hiding them.

Examples currently relevant:

- `WHILE-S-011` — Euclid modulo gap
- `WHILE-U-007` — variable multiplicative factor safety
- `REC-DC-004` — lost quadratic local work inside recursion
- `REC-LS-008` — lost quadratic local work in linear-shift recursion

These cases are intentionally reused in `LLM40` under `regression_gaps`.

## Operational rule

If the oracle dataset changes:

1. update or regenerate `apps/api/tests/oracles/out/*`
2. update `benchmarking.md` if the change affects `LLM40`
3. re-run the balanced `LLM40` comparison pipeline if any selected case changed

## Commands

Generate/recompute oracle artifacts:

`python apps/api/tests/oracles/generate_oracle_report.py`

Use oracle execution path programmatically via:

- `tests.oracles.oracle_schema.load_oracle_index()`
- `tests.oracles.oracle_schema.run_oracle()`
- `tests.oracles.oracle_schema.run_oracle_with_metrics()`

## Related files

- `testing-strategy.md`
- `benchmarking.md`
- `technique-detection-oracles.md`
