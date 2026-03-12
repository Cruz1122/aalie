# Baseline: Diagramas y dependencia LLM

Documento técnico corto que inventaría el estado actual de generación de diagramas y la deuda semántica antes de la migración a generación determinista.

**Fecha:** 2025-03  
**Autor:** Plan de implementación diagramas deterministas

---

## 1. Matriz Vista UI → Endpoint → Contrato → Fuente de verdad

| Vista UI | Endpoint | Contrato request | Contrato response | Fuente de verdad |
|----------|----------|------------------|------------------|------------------|
| IterativeTraceContent (diagrama) | `/api/analyze/trace` | source, case, input_size, locale | trace.steps | Backend CodeExecutor |
| IterativeTraceContent (diagrama) | `/api/llm/generate-diagram` | trace, source, case, locale, apiKey | graph, explanation, stepCosts | **LLM (Gemini)** |
| RecursiveTraceContent (diagrama) | `/api/analyze/trace` | source, case, input_size, locale | trace.steps, trace.recursionTree | Backend CodeExecutor |
| RecursiveTraceContent (diagrama) | `/api/llm/recursion-diagram` | pseudocode, kind, input_size, depth_limit, locale, apiKey | graph, explanation | **LLM (Gemini)** — **no usa trace** |
| RecursiveAnalysisView (árbol analítico) | `/api/analyze/open` | source, mode | totals.recursion_tree | Backend RecursiveAnalyzer |

---

## 2. Rutas actuales

- **`POST /api/analyze/trace`** (BFF → backend `/analyze/trace`): Genera traza de ejecución. Backend: CodeExecutor + TraceBuilder.
- **`POST /api/llm/generate-diagram`** (BFF, sin proxy a backend): Genera diagrama iterativo desde trace + source vía Gemini.
- **`POST /api/llm/recursion-diagram`** (BFF, sin proxy a backend): Genera árbol de llamadas recursivas desde pseudocode vía Gemini. **No recibe ni usa trace.**

---

## 3. Shapes actuales

### trace (response de /analyze/trace)

```json
{
  "ok": true,
  "trace": {
    "steps": [
      {
        "step_number": 1,
        "line": 2,
        "kind": "assign",
        "variables": { "i": 0 },
        "iteration": null,
        "recursion": null,
        "cost": "C_1",
        "accumulated_cost": "C_1",
        "description": "..."
      }
    ],
    "recursionTree": {
      "calls": [
        {
          "id": "call_1",
          "depth": 0,
          "params": { "n": 4 },
          "children": ["call_2", "call_3"]
        }
      ],
      "root_calls": ["call_1"]
    }
  },
  "algorithmKind": "iterative | recursive | hybrid",
  "metadata": { ... }
}
```

### graph (response de generate-diagram / recursion-diagram)

```json
{
  "nodes": [
    {
      "id": "n1",
      "type": "default",
      "position": { "x": 0, "y": 0 },
      "data": { "label": "...", "microseconds": 10, "tokens": 5 }
    }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2", "label": "Sí", "type": "default" }
  ]
}
```

### stepCosts (solo generate-diagram)

```json
{
  "1": { "microseconds": 10, "tokens": 5 },
  "2": { "microseconds": 15, "tokens": 8 }
}
```

---

## 4. Campos inferidos por LLM que no existen en backend

| Campo | Dónde se usa | Quién lo produce |
|-------|--------------|------------------|
| `return_value` | RecursionTreeCall | LLM (recursion-diagram) / no en trace |
| `is_base_case` | RecursionTreeCall | LLM (recursion-diagram) / no en trace |
| `explanation` | DiagramSection | LLM |
| Labels enriquecidos en nodos | TraceGraph | LLM |
| `stepCosts` (microseconds, tokens) | IterativeTraceContent | LLM (generate-diagram) |
| `parent_id` en RecursionCall | trace.recursionTree.calls | No poblado por backend (solo children) |

---

## 5. Variantes de algoritmo que deben seguir funcionando

- **Iterativo:** for, while, repeat; búsqueda lineal, suma acumulada, bubble sort.
- **Recursivo:** factorial, Fibonacci, MergeSort, QuickSort, búsqueda binaria recursiva.
- **Híbrido:** recursión con bucles internos.
- **Arrays y objetos:** gramática soporta aliasing; ExecutionEnvironment maneja arrays.

---

## 6. Riesgos de migración

1. **RecursionTreeView ignora trace.recursionTree:** Llama a recursion-diagram con solo pseudocode. La migración debe hacer que use trace.recursionTree como fuente.
2. **Contratos fragmentados:** Tipos en `apps/web/src/types/trace.ts` vs backend `trace_builder.py` sin alineación formal.
3. **Detección de caso base:** Backend no la implementa; LLM la infiere. Heurística conservadora necesaria.
4. **Explosión en recursión múltiple:** Fibonacci con n grande puede generar miles de nodos; se requiere colapso y límites.
