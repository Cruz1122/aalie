# Tests - API de Análisis de Algoritmos

## Introducción

Tests organizados en **unit**, **component**, **contract** y **system**. Oráculo de aserciones en `_support/assertions.py`. Estilo AAA obligatorio (ver [STYLE.md](STYLE.md)).

- **unit**: componentes aislados (analyzers, visitors, parsing, classification, utils).
- **component**: pocos algoritmos canónicos (daily gate); `test_canonical_algorithms.py`.
- **contract**: regresión parametrizada y algoritmos de estrés (nightly); incluye `test_stress_algorithms.py` (Prueba1–Prueba7).
- **system**: HTTP (TestClient) y BDD en `features/` y `steps/`.

## Estructura

```
tests/
├── conftest.py              # Markers registrados (unit, component, contract, system, slow, while, recursive, dp)
├── STYLE.md                 # AAA y convenciones
├── _support/
│   ├── algorithms/          # Pseudocódigo .txt (math, sorting, divide_conquer, stress, dp, strings)
│   ├── expectations/        # Specs .json por algoritmo
│   ├── assertions.py       # Oráculo único de aserciones de complejidad
│   ├── loaders.py          # load_algorithm(), load_spec()
│   └── normalize.py
├── unit/                    # analysis, parsing, classification, utils
├── component/               # Algoritmos canónicos (daily gate)
├── contract/                # Regresión + stress (nightly)
└── system/
    ├── features/            # .feature (pytest-bdd)
    ├── steps/               # Step definitions
    └── test_*_endpoint.py   # Tests HTTP
```

## Ejecución

Desde `apps/api`:

```bash
# Todos los tests
python -m pytest tests/ -v

# Daily gate (unit + component + system, sin contract)
python -m pytest -m "unit or component or system" -q

# Solo contract (nightly)
python -m pytest -m "contract" -q

# Cobertura
python -m pytest tests/ --cov=app --cov-report=term
```

## Markers

- `unit`, `component`, `contract`, `system`: tipo de test
- `slow`: tests lentos (ej. SymPy pesado)
- `while`, `recursive`, `dp`: filtros por tipo de algoritmo

## Convenciones

- **Naming**: archivos `test_*.py`, clases `Test*`, funciones `test_*`.
- **Aserciones**: usar solo `tests._support.assertions` para complejidad.
- **Pseudocódigo**: algoritmos grandes en `_support/algorithms/<familia>/<nombre>.txt`; no inline salvo ejemplos mínimos (≤5 líneas).
- **Estilo**: AAA (Arrange, Act, Assert); ver [STYLE.md](STYLE.md).
- **Prohibido**: `import unittest` o `unittest.TestCase` en tests.

## BDD (system)

Escenarios en `system/features/*.feature`; step definitions en `system/steps/`. Ejecutar:

```bash
python -m pytest tests/system/steps/ -v
```

## Baseline y métricas

- Cobertura objetivo > 71% (referencia pre-reforma). Medir: `python -m pytest tests/ --cov=app --cov-report=term`.
- Prohibido: `import unittest` o `unittest.TestCase`; aserciones ad hoc de complejidad (usar `_support.assertions`).

## Algoritmos de estrés (stress/)

Prueba1–Prueba7 en `_support/algorithms/stress/` y `test_stress_algorithms.py`. Suelen exponer errores como "No se pudieron determinar los tamaños de los subproblemas"; deben mantenerse en el suite para validar correcciones del motor.
