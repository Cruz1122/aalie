# Schema de análisis

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/schemas.py`, `packages/types/src/index.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.2.2

## Propósito

Documentar las formas principales del request y response de análisis de complejidad.

## Alcance

Schema documental para `POST /analyze/open` y `POST /analyze/detect-methods`.

## Fuente de verdad

- `apps/api/app/modules/analysis/schemas.py`
- `packages/types/src/index.ts`

## Schemas

### `AnalyzeRequest`

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `source` | `string` | — | Código fuente a analizar |
| `mode` | `"worst"\|"best"\|"avg"\|"all"` | `"worst"` | Caso a analizar |
| `avgModel` | `AvgModelConfig\|null` | `null` | Modelo probabilístico para caso promedio |
| `algorithm_kind` | `string\|null` | `null` | Pista de tipo de algoritmo |
| `preferred_method` | `string\|null` | `null` | Método de recurrencia preferido |
| `locale` | `"es"\|"en"\|null` | `null` | Idioma para etiquetas del procedimiento |

### `AvgModelConfig`

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `mode` | `"uniform"\|"symbolic"` | `"uniform"` | Modo del modelo de caso promedio |
| `predicates` | `Dict[str,str]\|null` | `null` | Mapa de predicado → probabilidad |

### `LineCost`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `line` | `int` | Número de línea |
| `kind` | `string` | Tipo: `"assign"`, `"if"`, `"for"`, `"while"`, `"repeat"`, `"call"`, `"return"`, `"decl"`, `"other"` |
| `ck` | `string` | Costo constante de la línea (notación) |
| `ops` | `int\|null` | Operaciones elementales por ejecución |
| `count` | `string` | Frecuencia de ejecución (simplificada) |
| `count_raw` | `string` | Frecuencia de ejecución (sin simplificar) |
| `note` | `string\|null` | Nota explicativa |
| `unbounded` | `bool\|null` | Si el bucle puede no terminar |
| `unbounded_kind` | `string\|null` | Tipo de unbounded: `"non_terminating"`, `"unknown"` |
| `loopBlockRef` | `string\|null` | Referencia al bloque de bucle |

### `AnalyzeOpenResponse` (mode != "all")

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Análisis exitoso |
| `byLine` | `LineCost[]` | Costos por línea |
| `totals` | `Dict` | Ecuación `T_open`, `T_polynomial`, `procedure` |
| `loopInvariant` | `LoopInvariantPayload\|null` | Invariante de bucle |
| `recursiveInvariant` | `RecursiveInvariantPayload\|null` | Invariante recursivo |

### `AnalyzeAll` (mode = "all")

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Análisis exitoso |
| `has_case_variability` | `boolean` | Si hay variabilidad entre casos |
| `worst` | `AnalyzeOpenResponse\|"unavailable"` | Resultado worst-case |
| `best` | `AnalyzeOpenResponse\|"same_as_worst"\|"unavailable"` | Resultado best-case |
| `avg` | `AnalyzeOpenResponse\|"same_as_worst"\|"unavailable"` | Resultado avg-case |
| `loopInvariant` | `LoopInvariantPayload\|null` | Invariante de bucle |

### `DetectMethods` Response

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Detección exitosa |
| `applicable_methods` | `string[]` | Métodos aplicables |
| `default_method` | `string` | Método recomendado |
| `recurrence_info` | `Dict` | Detalle de recurrencia y outcomes por método |

### `LoopInvariantPayload`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | `"ok"\|"unavailable"\|"low_confidence"` | Estado del invariante |
| `reason` | `string\|null` | Razón si no disponible |
| `selectedLoop` | `LoopInvariantSelectedLoop` | Bucle seleccionado |
| `invariant` | `LoopInvariantSections` | Secciones del invariante |
| `didacticSummary` | `string` | Resumen pedagógico |
| `evidence` | `LoopInvariantEvidence` | Evidencia detectada |

### `RecursiveInvariantPayload`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | `"ok"\|"unavailable"\|"low_confidence"` | Estado del invariante |
| `reason` | `string\|null` | Razón si no disponible |
| `recursiveStructure` | `RecursiveStructure` | Estructura recursiva detectada |
| `invariant` | `RecursiveInvariantSections` | Secciones del invariante recursivo |
| `didacticSummary` | `string` | Resumen pedagógico |
| `confidence` | `float` | Confianza (0.0–1.0) |
| `evidence` | `RecursiveInvariantEvidence` | Evidencia detectada |

## Ejemplos

### Payload `mode=all`

```json
{
  "source": "linear_search(A, n, x) BEGIN\n  FOR i <- 0 TO n - 1 DO BEGIN\n    IF (A[i] = x) THEN BEGIN\n      RETURN i;\n    END\n  END\n  RETURN -1;\nEND",
  "mode": "all",
  "algorithm_kind": "iterative",
  "locale": "en"
}
```

Response con `best="same_as_worst"` para mergeSort (determinista):

```json
{
  "ok": true,
  "has_case_variability": false,
  "worst": { "byLine": [...], "totals": { "T_open": "n log n", "T_polynomial": "O(n log n)" } },
  "best": "same_as_worst",
  "avg": "same_as_worst",
  "loopInvariant": null
}
```

## Límites conocidos

- `totals` es extensible y puede incluir bundles específicos por método.
- `loopInvariant` y `recursiveInvariant` pueden ser `null` si no aplican.
- `LoopInvariantPayload` y `RecursiveInvariantPayload` con `status="unavailable"` se retornan cuando no hay suficiente evidencia.

## Archivos relacionados

- `../analysis-api.md`
- `../../03-specs/recurrence-methods-spec.md`
- `../../03-specs/analysis-engine-spec.md`
