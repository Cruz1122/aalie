# Formato del Trace API

Documentación del contrato de datos expuesto por `POST /analyze/trace` para el frontend.

## Terminología

- **Traza de ejecución** (execution trace): Secuencia temporal de eventos reales de ejecución.
- **Paso de ejecución** (execution step): Un evento individual en la traza.
- **Diagrama de seguimiento** (execution diagram): Representación visual del flujo ejecutado (iterativo).
- **Árbol de llamadas recursivas** (call tree): Representación jerárquica de llamadas reales ejecutadas.
- **Árbol de recurrencia** (recurrence tree): Representación analítica del costo según la recurrencia (no ejecución).

## Request

```json
{
  "source": "string (código pseudocódigo)",
  "case": "worst" | "best" | "avg",
  "input_size": number | null,
  "initial_variables": object | null,
  "locale": "en" | "es",
  "include_execution_diagram": false,
  "include_call_tree": false
}
```

- **include_execution_diagram**: Si true, el backend genera diagrama de seguimiento determinista (iterativos).
- **include_call_tree**: Si true, el backend genera árbol de llamadas como grafo (recursivos).

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
  "metadata": { "pseudocode": "...", "inputSize": 4, "case": "worst", "message": "..." },
  "executionDiagram": { "graph": { "nodes": [...], "edges": [...] }, "diagramKind": "execution_diagram" },
  "callTree": { "graph": { "nodes": [...], "edges": [...] }, "diagramKind": "call_tree" }
}
```

- **executionDiagram**: Presente cuando `include_execution_diagram=true` y algoritmo iterativo.
- **callTree**: Presente cuando `include_call_tree=true` y algoritmo recursivo/híbrido.

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

## RecursionTreeCall (árbol de llamadas recursivas)

El campo `recursionTree` en la respuesta contiene el **árbol de llamadas recursivas** (call tree), no el árbol de recurrencia analítico.

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

- **Iterativos y recursivos**: El frontend obtiene el diagrama de seguimiento o árbol de llamadas recursivas directamente en la respuesta de `/api/analyze/trace` cuando se envían `include_execution_diagram: true` e `include_call_tree: true`. Los diagramas se generan de forma determinista en el backend.

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
