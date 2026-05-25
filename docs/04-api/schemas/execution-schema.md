# Schema de trace de ejecución

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/schemas.py`, `apps/api/app/modules/analysis/trace_service.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.2.3

## Propósito

Documentar el schema del payload de trace de ejecución paso a paso.

## Alcance

Schema documental para `POST /analyze/trace` y su BFF `POST /api/analyze/trace`.

## Fuente de verdad

- `apps/api/app/modules/analysis/schemas.py` (clases `TraceRequest`, `TraceResponse`)
- `apps/api/app/modules/analysis/trace_service.py`
- `apps/web/src/types/trace.ts`

## Schemas

### `TraceRequest`

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `source` | `string` | — | Código fuente a trazar |
| `case` | `"worst"\|"best"\|"avg"` | `"worst"` | Caso de análisis |
| `input_size` | `int\|null` | `null` | Tamaño de entrada concreto |
| `initial_variables` | `Dict\|null` | `null` | Variables iniciales |
| `locale` | `"es"\|"en"\|null` | `null` | Idioma para descripciones |

```json
{
  "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND",
  "case": "worst",
  "input_size": 3,
  "initial_variables": {},
  "locale": "en"
}
```

### `TraceResponse`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Trace exitoso |
| `trace` | `Dict` | Objeto de trace completo (ver sección trace.steps) |
| `algorithmKind` | `string` | Tipo de algoritmo detectado |
| `derived` | `Dict` | Información derivada del trace |

### `trace.steps[*]`

Cada paso de ejecución:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único del paso |
| `stepNumber` | `int` | Número de paso (1-indexed) |
| `line` | `int` | Línea del pseudocódigo |
| `eventKind` | `string` | Tipo de evento: `"assign"`, `"call_enter"`, `"call_exit"`, `"return"`, `"loop_iteration"`, `"condition"`, `"declaration"`, etc. |
| `description` | `string` | Descripción legible del paso |
| `variablesSnapshot` | `Dict` | Estado de variables en este punto |
| `iteration` | `int\|null` | Número de iteración si está dentro de un bucle |
| `recursion` | `Dict\|null` | Información de recursión (`depth`, `callStack`) |
| `decision` | `Dict\|null` | Resultado de una condición (`branch`: true/false) |
| `cost` | `string\|null` | Costo del paso |
| `sourceSpan` | `Dict\|null` | Ubicación exacta (`start`, `end`) |

```json
{
  "id": "step_3",
  "stepNumber": 3,
  "line": 3,
  "eventKind": "call_enter",
  "description": "Entering recursive call factorial(n=2)",
  "variablesSnapshot": { "n": 2 },
  "recursion": { "depth": 2, "callStack": ["factorial(3)", "factorial(2)"] },
  "cost": "1"
}
```

## Ejemplos

### Step de asignación

```json
{
  "id": "step_1",
  "stepNumber": 1,
  "line": 2,
  "eventKind": "assign",
  "description": "i = 0",
  "variablesSnapshot": { "i": 0, "n": 5, "sum": 0 },
  "iteration": null,
  "cost": "1"
}
```

### Step de llamada recursiva

```json
{
  "id": "step_5",
  "stepNumber": 5,
  "line": 5,
  "eventKind": "call_enter",
  "description": "Call mergeSort(A, 0, 2)",
  "variablesSnapshot": { "A": [5, 2, 4, 1, 3], "left": 0, "right": 2 },
  "recursion": { "depth": 1, "callStack": ["mergeSort(A, 0, 4)", "mergeSort(A, 0, 2)"] },
  "cost": "1"
}
```

### Step de retorno

```json
{
  "id": "step_8",
  "stepNumber": 8,
  "line": 8,
  "eventKind": "return",
  "description": "Return 6 from factorial(3)",
  "variablesSnapshot": { "returnValue": 6 },
  "recursion": { "depth": 0, "callStack": [] },
  "cost": "1"
}
```

## Límites conocidos

- Algunos nombres legacy del frontend (`step_number`, `kind`) conviven con la forma canónica del backend.
- `variablesSnapshot` puede contener valores grandes si el input incluye arrays extensos.
- El trace usa inputs concretos; no genera trazas simbólicas.

## Archivos relacionados

- `../execution-api.md`
- `../../03-specs/execution-trace-spec.md`
