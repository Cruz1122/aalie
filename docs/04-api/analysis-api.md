# API de análisis

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/router.py`, `apps/api/app/modules/analysis/schemas.py`, `apps/web/src/app/api/analyze/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.1.2, 4.1.3

## Propósito

Documentar el contrato de análisis principal de complejidad y la detección de métodos de recurrencia.

## Alcance

Cubre `POST /analyze/open`, `POST /analyze/detect-methods` (backend) y sus proxies Next `/api/analyze/open`, `/api/analyze/detect-methods`.

## Fuente de verdad

- `apps/api/app/modules/analysis/router.py`
- `apps/api/app/modules/analysis/schemas.py`
- `apps/web/src/app/api/analyze/open/route.ts`
- `apps/web/src/app/api/analyze/detect-methods/route.ts`

## Estructura

### `POST /analyze/open`

- Path: `/analyze/open`
- Method: `POST`
- Consumidor principal: UI (página del analizador), BFF `api/analyze/open`

#### Request `AnalyzeRequest`

```json
{
  "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND",
  "mode": "worst",
  "algorithm_kind": "recursive",
  "preferred_method": "master",
  "avgModel": {
    "mode": "uniform",
    "predicates": { "A[j] > A[j+1]": "1/2" }
  },
  "locale": "es"
}
```

Campos:

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `source` | `string` | — | Código fuente a analizar |
| `mode` | `"worst"\|"best"\|"avg"\|"all"` | `"worst"` | Caso a analizar; `"all"` devuelve todos los casos |
| `algorithm_kind` | `string\|null` | `null` | Pista: `"iterative"`, `"recursive"`, `"hybrid"`, `"unknown"` |
| `preferred_method` | `string\|null` | `null` | Método preferido: `"master"`, `"iteration"`, `"recursion_tree"`, `"characteristic_equation"` |
| `avgModel` | `AvgModelConfig\|null` | `null` | Modelo probabilístico para caso promedio |
| `avgModel.mode` | `"uniform"\|"symbolic"` | `"uniform"` | Modo del modelo de caso promedio |
| `avgModel.predicates` | `Dict[str,str]\|null` | `null` | Mapa predicado→probabilidad (ej: `{"A[j] > A[j+1]": "1/2"}`) |
| `locale` | `"es"\|"en"\|null` | `null` | Idioma para etiquetas del procedimiento |

#### Response `AnalyzeOpenResponse` (`mode != "all"`)

```json
{
  "ok": true,
  "byLine": [
    {
      "line": 1,
      "kind": "decl",
      "ck": "1",
      "ops": 1,
      "count": "1",
      "count_raw": "1",
      "note": "Algoritmo",
      "loopBlockRef": null
    }
  ],
  "totals": {
    "T_open": "3n + 2",
    "T_polynomial": "O(n)",
    "procedure": [
      { "step": "Sumar costos de cada línea", "detail": "T(n) = Σ ck · count(k)" }
    ]
  },
  "loopInvariant": {
    "status": "unavailable",
    "reason": "no_supported_loop"
  },
  "recursiveInvariant": {
    "status": "ok",
    "recursiveStructure": {
      "baseCondition": "n <= 1",
      "baseResult": "1",
      "recursiveCallPattern": [{ "calls": "f(n-1)", "parameters": ["n-1"] }]
    },
    "invariant": {
      "baseProperty": "factorial(0) = 1, factorial(1) = 1",
      "inductiveHypothesis": "factorial(k) = k! para k < n",
      "recursiveStep": "factorial(n) = n * factorial(n-1) = n * (n-1)! = n!",
      "terminationGarantee": "n decrece en cada llamada hasta alcanzar el caso base n <= 1"
    },
    "didacticSummary": "El factorial se define recursivamente: n! = n × (n-1)! con caso base 0! = 1."
  }
}
```

Campos principales:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Análisis exitoso |
| `byLine` | `LineCost[]` | Costos por línea (ck, count, ops) |
| `totals` | `Dict` | Ecuación `T_open`, cota `T_polynomial`, procedimiento |
| `loopInvariant` | `LoopInvariantPayload\|null` | Invariante de bucle si aplica |
| `recursiveInvariant` | `RecursiveInvariantPayload\|null` | Invariante recursivo si aplica |

#### Response `AnalyzeAll` (`mode = "all"`)

```json
{
  "ok": true,
  "has_case_variability": true,
  "worst": { "byLine": [...], "totals": { "T_open": "n²", ... } },
  "best": "same_as_worst",
  "avg": { "byLine": [...], "totals": { "T_open": "n²/2", ... } },
  "loopInvariant": null,
  "recursiveInvariant": null
}
```

Los casos `best` y `avg` pueden ser `"same_as_worst"` cuando el algoritmo es determinista.

#### Response `AnalyzeError`

```json
{
  "ok": false,
  "errors": [{ "message": "Error de análisis", "line": 3, "column": 5 }]
}
```

### `POST /analyze/detect-methods`

- Path: `/analyze/detect-methods`
- Method: `POST`
- Consumidor principal: selector de método recursivo, validación de ejemplos, BFF

#### Request

```json
{
  "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND",
  "algorithm_kind": "recursive"
}
```

#### Response

```json
{
  "ok": true,
  "applicable_methods": ["master", "recursion_tree", "iteration", "characteristic_equation"],
  "default_method": "master",
  "recurrence_info": {
    "recurrence": "T(n) = T(n-1) + c",
    "method_outcomes": {
      "master": {
        "applicable": true,
        "recommended": true,
        "bound_kind": "equivalent"
      },
      "recursion_tree": {
        "applicable": true,
        "recommended": false,
        "bound_kind": "equivalent"
      },
      "iteration": {
        "applicable": true,
        "recommended": false,
        "bound_kind": "equivalent"
      },
      "characteristic_equation": {
        "applicable": true,
        "recommended": false,
        "bound_kind": "equivalent"
      }
    }
  }
}
```

Campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Detección exitosa |
| `applicable_methods` | `string[]` | Métodos aplicables |
| `default_method` | `string` | Método recomendado |
| `recurrence_info.recurrence` | `string` | Recurrencia detectada |
| `recurrence_info.method_outcomes` | `Dict` | Resultado esperado por método: `applicable`, `recommended`, `bound_kind` |

`bound_kind` puede ser: `"equivalent"` (Θ), `"upper"` (O), `"lower"` (Ω), `"partial"`.

## Notas de compatibilidad

- `loopInvariant` y `recursiveInvariant` son parte del contrato y pueden ser `null`;
- `best` y `avg` pueden ser `"same_as_worst"` cuando el algoritmo es determinista;
- `api_key` sigue existiendo por compatibilidad pero el flujo principal no depende de ella.

## Ejemplos

- `mergeSort` puede devolver `master`, `recursion_tree` e `iteration` con `default_method=master`.
- `factorial` puede priorizar `characteristic_equation` o `iteration` según forma detectada.
- `method_outcomes` permite explicar si cada método da una cota equivalente, superior, inferior o parcial sin confundir aplicabilidad con fuerza del resultado.
- Búsqueda binaria devuelve `T(n) = T(n/2) + c` con `master` como default.

## Límites conocidos

- Si el algoritmo no es recursivo, `detect-methods` debe fallar explícitamente;
- Un método aplicable puede producir bound parcial si la cobertura simbólica no es total.
- `totals` es extensible y puede incluir bundles específicos por método.

## Archivos relacionados

- `schemas/analysis-schema.md`
- `../03-specs/analysis-engine-spec.md`
- `../03-specs/recurrence-methods-spec.md`
