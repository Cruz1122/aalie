# Estrategia de pruebas

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/tests/`, `.github/workflows/ci.yaml`, `apps/api/pyproject.toml`, `package.json`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** testing-strategy, ci-cd, coverage-policy

## Propósito

Definir cómo se valida AALIE en capas y qué significa una prueba útil en este repo.

## Alcance

Aplica a backend, contratos, sistema, catálogo de contenido, quizzes y checks documentales.

## Estructura por capas de test

### 1. Unitarias (`tests/unit/`)
- **Qué cubren:** funciones aisladas, helpers, validadores, servicios sin IO.
- **Marcador:** `unit`
- **Archivos:** ~40 test files en `tests/unit/`
- **Ejecución:** `python -m pytest tests/unit/ -v`
- **Regla:** no deben depender de la base de datos, red ni archivos externos.

### 2. Componente (`tests/component/`)
- **Qué cubren:** algoritmos canónicos completos (pipeline parse → analyze → result).
- **Marcador:** `component`
- **Regla:** usan pocos algoritmos representativos; validan que el pipeline no explote.

### 3. Contrato (`tests/contract/`)
- **Qué cubren:** invariantes del contrato público — shape de respuesta, estados (`available`, `partial`, `unsupported`), coherencia estructural.
- **Subcarpetas:**
  - `tests/contract/oracles/` — 15 archivos de oráculos semánticos (WHILE, recursivos, iterativos)
  - `tests/contract/trace_contracts/` — shape de `structuredTrace`
- **Marcadores:** `contract`, `oracle`, `while_loop`, `recursive`, `iterative`, `trace`
- **Regla central:** los oráculos deben ser auténticos: `input → expected output real`, no solo "no explota".

### 4. Sistema (`tests/system/`)
- **Qué cubren:** endpoints HTTP reales (health, parse, classify, analyze, trace, export, quizzes, LLM).
- **Marcador:** `system`
- **Requiere:** servidor corriendo o test client de FastAPI.
- **Dependencia:** si `reportlab` no está instalado, los tests system se omiten (ver `conftest.py`).

### 5. Lentas (`tests/slow/`)
- **Qué cubren:** casos pesados de SymPy, algoritmos muy recursivos, export PDF real.
- **Marcador:** `slow`, `export`
- **Ejecución:** solo en CI nightly (programado) o local con `-m slow`.

### 6. Benchmark (`tests/benchmark/`)
- **Qué cubren:** rendimiento reproducible de WHILE, recursivos, iterativos y export.
- **Marcador:** `benchmark`
- **Regla:** miden mediana sobre múltiples ejecuciones; no validan corrección profunda.

### 7. Comparación AALIE vs Direct LLM (`tests/llm_comparison/`)
- **Qué cubre:** benchmark semántico balanceado de 40 casos derivado del dataset de oráculos.
- **Artefactos:** `llm40_index.json`, `llm40_gold.jsonl`, `llm40_prompt_dataset.jsonl`, `out/aalie40_results.csv`, `out/llm40_aalie_vs_llm_report.md`
- **Regla:** AALIE y el LLM se puntúan por separado contra gold; ninguno juzga al otro.
- **Métricas clave:** `theta_accuracy_exact`, `theta_accuracy_shape_aware`, `explicit_safe_rejection`, `non_hallucination`, `hallucinated_bound_rate`, `ideal_gap_recovery`.

## Oracle-based testing

### Definición

Un test oracle valida que el motor produce el resultado semántico correcto para un algoritmo dado:

```
input (pseudocode) → analyze_algorithm() → expected output (complexity class, T_open, notation)
```

### Equivalencia simbólica

- La comparación usa SymPy: dos expresiones son equivalentes si su diferencia simplificada es cero.
- Si la simplificación exacta no cierra, se permite comparar clase asintótica esperada.
- No existe tolerancia numérica por defecto. Las tolerancias solo aplican a verificaciones numéricas auxiliares.

### Estados contractuales

Los resultados correctos pueden ser:
- `available` — el motor resolvió completamente el caso.
- `partial` — el motor reconoció el patrón pero no pudo cerrar la expresión (válido).
- `unsupported` — el patrón está fuera del alcance del motor (válido).

La diferencia clave: **"no explota"** (el análisis no lanza excepción) ≠ **"validación real"** (el resultado semántico coincide con el oráculo). Un test que solo verifica `result.get("ok")` sin comparar la notación asintótica no es un oráculo útil.

### Export testing

- Markdown/LaTeX: validan que el snapshot contiene `schemaVersion` y secciones obligatorias.
- PDF: validan que se genera un archivo binario. Los tests PDF se saltan si `reportlab` no está instalado (ver `conftest.py` línea 49).

### Quiz testing

- Unitarios: `tests/unit/quizzes/` — lógica de evaluación, scoring, content refs.
- Sistema: `POST /quizzes/attempts` y `POST /quizzes/attempts/evaluate`.

### Content validation

- Schema: 5 JSON schemas (`shared`, `inline`, `block`, `space`, `module`) validados con AJV.
- Business rules: `packages/content-catalog/src/validate.ts` (~1085 líneas).
- Comando: `pnpm -C packages/content-catalog test` o node directo.

### Docs contracts validation

- Script: `scripts/check_docs_contracts.py`.
- Valida: (1) directorios `docs/03-specs/`, `docs/04-api/`, `docs/09-decisions/` existen; (2) `docs/index.md` existe; (3) `SNAPSHOT_SCHEMA_VERSION` está sincronizado entre `apps/api/app/modules/export/constants.py` y `packages/types/src/export-snapshot.ts`.

## Cobertura

- **Umbral:** 70% global en el job `test-pr-gate`.
- **Medido sobre:** módulo `app/` (excluye tests, migrations, `__pycache__`).
- **Comando:** `pytest tests/ -m "fast or oracle" --cov=app --cov-fail-under=70`.

### LLM40 comparison

- El benchmark `LLM40` no sustituye los oráculos de 80 casos.
- Los oráculos responden “¿AALIE está correcto?”
- `LLM40` responde “¿cómo se compara AALIE contra un LLM directo bajo el mismo gold?”
- El scoring es estricto a nivel de contrato estructurado y además reporta una métrica shape-aware para notación asintótica.

## Cómo ejecutar

### Backend (API)

| Comando | Marcador | Cobertura |
|---|---|---|
| `python -m pytest tests/ -v` | todos | no |
| `python -m pytest tests/unit/ -v` | unit | no |
| `python -m pytest -m contract -q` | contract | no |
| `python -m pytest -m while_domain -v` | while_domain | no |
| `python -m pytest tests/ --cov=app --cov-report=term` | todos | sí |
| `python -m pytest -m "fast or oracle" --cov=app --cov-fail-under=70` | fast+oracle | sí, gate 70% |

### Via pnpm (monorepo)

| Comando | Efecto |
|---|---|
| `pnpm test:api` | todos los tests API |
| `pnpm test:api:cov` | todos los tests con cobertura |
| `pnpm test:api:gate` | PR gate: `unit or component or system` |
| `pnpm test:api:contract` | solo contract |
| `pnpm test:api:while` | solo while_domain |
| `pnpm test:docs-contracts` | validación docs |

### LLM40 comparison commands

| Comando | Efecto |
|---|---|
| `python apps/api/tests/llm_comparison/select_llm40_cases.py` | genera index/gold/prompt del benchmark balanceado |
| `python apps/api/tests/llm_comparison/run_aalie_outputs.py --index apps/api/tests/llm_comparison/llm40_index.json --out-dir apps/api/tests/llm_comparison/out` | genera baseline AALIE |
| `python apps/api/tests/llm_comparison/score_llm40_outputs.py --llm-jsonl apps/api/tests/llm_comparison/llm40_llm_outputs.jsonl --gold-jsonl apps/api/tests/llm_comparison/llm40_gold.jsonl --aalie-csv apps/api/tests/llm_comparison/out/aalie40_results.csv --out-md apps/api/tests/llm_comparison/out/llm40_aalie_vs_llm_report.md` | genera comparación AALIE vs Direct LLM |

### CI lanes

| Job | Marcador | Cobertura | Bloqueante |
|---|---|---|---|
| `test-pr-gate` | `fast or oracle` | 70% | sí |
| `test-extended-lanes` | `contract or system` | no | no (continue-on-error) |
| `test-nightly-lanes` | `slow or stress or export or benchmark` | no | solo schedule |

## Reglas operativas

- `pytest-xdist` es obligatorio en CI y recomendado localmente: `-n auto --dist=worksteal`.
- Cada test valida una hipótesis principal y usa la ruta mínima necesaria.
- Queda prohibido mezclar corrección matemática + shape contractual + rendimiento + export en un solo test.
- Los tests deben declarar si validan: igualdad exacta, equivalencia simbólica, presencia de campos requeridos o estado contractual.
- Los resultados de `LLM40` deben distinguir explícitamente entre strict structured-output scoring y shape-aware mathematical agreement.

## Límites conocidos

- Algunos resultados correctos son `partial` o `unsupported`; la prueba debe reflejar eso, no forzar certeza inexistente.
- Los lanes extendidos no tienen umbral de cobertura.
