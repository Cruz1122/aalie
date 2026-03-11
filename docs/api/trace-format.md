# Formato del Trace API

Documentación del contrato de datos expuesto por `POST /analyze/trace` para el frontend.

## Request

```json
{
  "source": "string (código pseudocódigo)",
  "case": "worst" | "best" | "avg",
  "input_size": number | null,
  "initial_variables": object | null,
  "locale": "en" | "es"
}
```

- **source**: Código fuente en pseudocódigo (obligatorio).
- **case**: Escenario de ejecución (worst, best, avg). Por defecto `"worst"`.
- **input_size**: Tamaño de entrada `n` para algoritmos que lo usan.
- **initial_variables**: Variables iniciales (ej. `{ "A": [1,2,3,4], "x": 3 }`) para búsquedas iterativas.
- **locale**: Idioma para descripciones de pasos (`"en"` o `"es"`).

## Response exitosa

```json
{
  "ok": true,
  "trace": {
    "steps": [...],
    "recursionTree": { "calls": [...], "root_calls": [...] }
  },
  "algorithmKind": "iterative" | "recursive" | "hybrid" | "unknown",
  "metadata": {
    "pseudocode": "...",
    "inputSize": 4,
    "case": "worst",
    "message": "..."
  }
}
```

## ExecutionStep

Cada paso del trace:

```typescript
interface ExecutionStep {
  step_number: number;
  line: number;
  kind: string;  // "assign" | "if" | "for" | "while" | "call" | "return" | ...
  variables: Record<string, string | number>;
  iteration?: {
    loopVar?: string;
    currentValue?: number;
    maxValue?: number;
    iteration?: number;
  };
  recursion?: {
    depth: number;
    callId: string;
    params: Record<string, unknown>;
    procedure?: string;
  };
  cost?: string;
  accumulated_cost?: string;
  description?: string;
  microseconds?: number;
  tokens?: number;
}
```

## RecursionTreeCall (algoritmos recursivos)

```typescript
interface RecursionTreeCall {
  id: string;
  depth: number;
  params: Record<string, unknown>;
  children: string[];
  parent_id?: string | null;
  is_base_case?: boolean;
  return_value?: unknown;
}
```

## Uso para diagramas

- **Iterativos**: El frontend llama a `/api/llm/generate-diagram` con el trace para obtener un `TraceGraph` (nodos y edges) para React Flow.
- **Recursivos**: El frontend llama a `/api/llm/recursion-diagram` con pseudocode, kind, input_size para generar el árbol de recursión (TraceGraph + explanation).

## Response de error

```json
{
  "ok": false,
  "errors": [
    {
      "message": "string",
      "line": number | null,
      "column": number | null
    }
  ]
}
```
