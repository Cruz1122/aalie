# Sistema de Trazas Recursivas y Graficación con React Flow

## Objetivo
Este documento describe, de extremo a extremo, cómo funciona el sistema actual de trazas para algoritmos recursivos e híbridos en el proyecto:

1. Cómo se solicita y genera el trace en backend.
2. Cómo se modela el árbol de llamadas y los pasos (`steps`).
3. Cómo se deriva `structuredTrace` (clasificación + grafo).
4. Cómo se visualiza en frontend con React Flow.
5. Qué puntos son críticos para depuración y evolución.

> Estado actual: el sistema es determinista (no depende de LLM para construir el trace recursivo ni el grafo estructurado).

---

## Vista General del Flujo

```mermaid
flowchart LR
  A[UI TraceDedicatedView] --> B[useTraceController]
  B --> C[/api/analyze/trace - Next.js route]
  C --> D[/analyze/trace - FastAPI]
  D --> E[parse_source]
  D --> F[classify_algorithm]
  D --> G[CodeExecutor.execute]
  G --> H[TraceBuilder.build]
  D --> I[trace_enriched]
  I --> J[build_structured_trace_result]
  J --> K[classify_structural_trace]
  J --> L[builder_factory -> builder por pattern]
  L --> M[structured_view_to_graph]
  M --> N[derived.structuredTrace]
  N --> O[Frontend: DiagramSection -> ExecutionGraphView]
  O --> P[React Flow + dagre + ReturnEdge]
```

---

## 1) Entrada y Orquestación de la Petición

### Frontend
- Hook principal: `apps/web/src/hooks/trace/useTraceController.ts`
- Endpoint cliente: `POST /api/analyze/trace`
- Payload enviado:
  - `source`
  - `case` (`best|avg|worst`)
  - `input_size`
  - `initial_variables`
  - `locale` (`es|en`)

Características importantes:
- Cancela requests previos con `AbortController`.
- Timeout de 30s en cliente.
- Cachea respuestas por clave determinista (fuente normalizada + caso + input + override + locale + versión de contrato).
- Si hay `derived.structuredTrace`, lo toma como única fuente visual del diagrama.

Código real (cliente + locale + cache + request):

```ts
const cacheKey = traceCache.getKey({
  source,
  case: scenario,
  inputSize: n,
  initialVariablesOverride: overrideToUse ?? null,
  locale: locale === "es" ? "es" : "en",
});

const response = await fetch("/api/analyze/trace", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    source,
    case: scenario,
    input_size: n,
    initial_variables: initialVariables,
    locale: locale === "es" ? "es" : "en",
  }),
  signal: abortController.signal,
});

const st = data.derived?.structuredTrace;
if (st?.graph && (st.graph.nodes?.length ?? 0) > 0) {
  setStructuredDiagram({
    graph: st.graph,
    patternKind: st.patternKind,
    classification: st.classification,
  });
}
```

Cache:
- Utilidad: `apps/web/src/lib/trace-cache-utils.ts`
- Versión de contrato actual: `TRACE_CONTRACT_VERSION = "2.2"`

### Next.js API Route (BFF)
- Archivo: `apps/web/src/app/api/analyze/trace/route.ts`
- Reenvía la petición a FastAPI: `${API_BASE}/analyze/trace`
- Responde sin transformación semántica del payload del backend.

Código real (proxy BFF):

```ts
const response = await fetch(`${API_BASE}/analyze/trace`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    source,
    case: caseType || "worst",
    input_size: input_size || null,
    initial_variables: initial_variables || null,
    locale: locale || "en",
  }),
  cache: "no-store",
});

const data = await response.json().catch(() => null);
return NextResponse.json(data, { status: response.status });
```

### Backend FastAPI
- Router: `apps/api/app/modules/analysis/router.py`
- Endpoint: `@router.post("/trace")`

Pipeline del endpoint:
1. Parsea código (`parse_source`).
2. Clasifica algoritmo (`classify_algorithm`).
3. Ejecuta pseudocódigo (`CodeExecutor`).
4. Enriquece trace (`kind`, `summary`, `diagnostics`, `callTreeSource`).
5. Construye artefacto derivado `structuredTrace`.
6. Retorna:
   - `trace`
   - `algorithmKind`
   - `derived.structuredTrace`
   - `metadata`

Código real del endpoint `/trace`:

```py
@router.post("/trace")
def analyze_trace(payload: TraceRequest = Body(...)) -> Dict[str, Any]:
    parse_result = parse_source(payload.source)
    classification_result = classify_algo(ast=ast)
    algorithm_kind = classification_result.get("kind", "unknown")

    locale_val = (payload.locale or "en").lower()[:2]
    if locale_val not in ("en", "es"):
        locale_val = "en"

    executor = CodeExecutor(
        ast,
        payload.input_size,
        payload.case,
        initial_variables=payload.initial_variables,
        locale=locale_val,
    )
    trace = executor.execute()

    trace_enriched = {
        **trace,
        "callTreeSource": recursion_tree if recursion_tree else None,
        "kind": algorithm_kind,
        "summary": {...},
        "diagnostics": {...},
    }

    st = build_structured_trace_result(
        trace_enriched, StructuredTraceRenderConfig(locale=locale_val)
    )
```

---

## 2) Motor de Ejecución Recursiva (CodeExecutor)

Archivo: `apps/api/app/modules/execution/executor.py`

## Responsabilidades principales
- Ejecutar AST paso a paso.
- Resolver llamadas a procedimientos.
- Detectar y controlar recursión.
- Registrar eventos de trace (`eventKind`).
- Mantener consistencia de parámetros mutables (arrays/objetos).

## Estructuras clave internas
- `recursion_depth`: profundidad actual.
- `call_stack`: frames recursivos activos (`call_id`, `params`, `return_value`, etc.).
- `return_capture_stack`: captura de `RETURN` para llamadas recursivas y no recursivas.
- `proc_exec_stack`: procedimiento en ejecución para asociar retorno al frame correcto.

## Ciclo de una llamada recursiva
Cuando `_execute_procedure` detecta que el procedimiento es recursivo:
1. Genera/reutiliza `call_id`.
2. Incrementa profundidad.
3. Crea frame en `call_stack`.
4. Registra entrada en árbol (`enter_recursion`).
5. Emite step `call_enter` con snapshot de params.
6. Ejecuta cuerpo.
7. Actualiza params finales del frame.
8. Registra `return_value` y `final_params`.
9. Emite step `call_exit`.
10. Sale de recursión (`exit_recursion`) y hace pop del frame.

Código real (entrada y salida de llamada recursiva):

```py
call_id = pregenerated_call_id or self.trace_builder.generate_call_id()
parent_id = self.call_stack[-1]["call_id"] if self.call_stack else None
self.recursion_depth += 1

frame = {
    "call_id": call_id,
    "proc_name": proc_name,
    "params": copy.deepcopy(params),
    "depth": depth,
    "return_value": None,
}
self.call_stack.append(frame)

self.trace_builder.enter_recursion(
    call_id, depth, copy.deepcopy(params),
    function_name=proc_name,
    entry_line=entry_line,
    parent_call_id=parent_id,
)

self.trace_builder.add_step(
    line=line,
    kind="call",
    variables=self.environment.get_variables_snapshot(),
    recursion={"depth": depth, "callId": call_id, "params": copy.deepcopy(params), "procedure": proc_name},
    event_kind="call_enter",
)
...
self.trace_builder.record_return_value(call_id, result)
self.trace_builder.record_final_params(call_id, current_frame.get("params", {}))
self.trace_builder.add_step(..., event_kind="call_exit")
self.trace_builder.exit_recursion()
self.call_stack.pop()
self.recursion_depth -= 1
```

## Eventos recursivos relevantes (`eventKind`)
- `call_spawn_child`: padre crea llamada hija recursiva.
- `call_enter`: entra a la llamada recursiva.
- `call_resume`: padre retoma ejecución tras retorno de hija.
- `return_emit`: ejecución de `RETURN`.
- `call_exit`: salida de la llamada recursiva.

## Mutaciones de parámetros
En `_execute_call`, luego de ejecutar una llamada:
- Si un parámetro formal mutó y venía de una variable del caller, propaga cambios al scope padre.
- Esto es crítico para algoritmos como `mergeSort(A, ...)` donde `A` se ordena in-place.

Código real de propagación de mutaciones al caller:

```py
updated_params = {}
for param_name, source_name in param_sources.items():
    if not source_name:
        continue
    updated_value = self.environment.get_variable(param_name)
    if isinstance(updated_value, (list, dict)):
        updated_params[source_name] = updated_value

self.environment.pop_scope()
for source_name, updated_value in updated_params.items():
    self.environment.set_variable(source_name, updated_value)
```

Código real de `call_spawn_child` y `call_resume`:

```py
self.trace_builder.add_step(
    line=node.get("pos", {}).get("line", 0),
    kind="call",
    variables=self.environment.get_variables_snapshot(),
    recursion={
        "depth": self.recursion_depth,
        "callId": pregenerated_call_id,
        "parentCallId": parent_call_id,
        "params": copy.deepcopy(params_map),
        "procedure": proc_name,
    },
    event_kind="call_spawn_child",
)
...
self.trace_builder.add_step(
    line=node.get("pos", {}).get("line", 0),
    kind="call",
    variables=self.environment.get_variables_snapshot(),
    recursion={
        "depth": self.recursion_depth - 1,
        "callId": parent_call_id,
        "params": copy.deepcopy(parent_frame.get("params", {})),
        "procedure": proc_def.get("name", "unknown"),
    },
    event_kind="call_resume",
)
```

## Control de truncamiento
- Excepción: `MaxRecursionDepthExceeded`.
- Si se supera `max_recursion_depth`, el trace marca:
  - `recursion_truncated = true`
  - `max_depth_reached`
- El endpoint lo refleja en `diagnostics.truncated`.

---

## 3) Construcción del Trace Canónico (TraceBuilder)

Archivo: `apps/api/app/modules/execution/trace_builder.py`

## Qué produce
- `steps`: lista cronológica de ejecución.
- `recursionTree`: árbol de llamadas (si aplica).

## Step model
Cada step incluye, según aplique:
- `id`, `step_number`, `line`
- `kind` y alias `eventKind`
- `variables`
- `variables_changed`
- `iteration`
- `recursion` (`depth`, `callId`, `params`, `parentCallId`, `procedure`)
- `description`
- `tokens`, `microseconds`
- `decision`

## Costos estimados
`TraceBuilder` asigna costo heurístico por tipo de evento con `_estimate_step_cost`:
- Ejemplo: `assign=1 token`, `condition_eval=2`, `call_enter=2`, etc.
- `microseconds = tokens * 3.0`.

Código real (`TraceBuilder.add_step` + snapshots inmutables):

```py
effective_kind = event_kind if event_kind else kind
est_tokens, est_microseconds = _estimate_step_cost(effective_kind)

if vchanged is None and self._prev_variables is not None:
    vchanged = {
        k: v for k, v in variables.items()
        if k not in self._prev_variables or self._prev_variables.get(k) != v
    } or None
self._prev_variables = copy.deepcopy(variables)

step = ExecutionStep(
    id=f"step_{self.step_counter}",
    step_number=self.step_counter,
    line=line if line else None,
    kind=effective_kind,
    variables=copy.deepcopy(variables),
    variables_changed=copy.deepcopy(vchanged) if vchanged is not None else None,
    iteration=copy.deepcopy(iteration) if iteration is not None else None,
    recursion=copy.deepcopy(recursion) if recursion is not None else None,
    decision=copy.deepcopy(decision) if decision is not None else None,
    tokens=est_tokens,
    microseconds=est_microseconds,
)
```

## Consistencia de snapshots
Para evitar contaminación entre pasos:
- Se usan `deepcopy` en `variables`, `iteration`, `recursion`, `decision`.
- El árbol de recursión también copia params al entrar.
- Se registra `final_params` al salir de cada llamada.

Esto corrige errores típicos de visualización donde una llamada antigua parecía tener parámetros de un estado futuro.

## Recursion tree model
Cada `RecursionCall` guarda:
- `id`, `depth`, `parent_id`, `children`
- `params` (estado de entrada)
- `final_params` (estado de salida)
- `return_value`
- `base_case` + `is_base_case`

---

## 4) Derivación Estructural (`derived.structuredTrace`)

## Orquestador
- Archivo: `apps/api/app/modules/execution/derivations/structured_trace_builder.py`
- Función: `build_structured_trace_result(trace, config)`

Hace 3 pasos:
1. `classify_structural_trace(trace)`
2. `build_structured_trace(trace, classification, config)`
3. `structured_view_to_graph(view)`

Retorna:
- `patternKind`
- `graph: { nodes, edges }`
- `classification: { confidence, evidence }`

Código real del orquestador:

```py
def build_structured_trace_result(trace: Dict[str, Any], config: Optional[StructuredTraceRenderConfig] = None) -> Dict[str, Any]:
    classification = classify_structural_trace(trace)
    view = build_structured_trace(trace, classification, config)
    graph = structured_view_to_graph(view)
    return {
        "patternKind": classification.patternKind,
        "graph": graph,
        "classification": {
            "patternKind": classification.patternKind,
            "confidence": classification.confidence,
            "evidence": classification.evidence,
        },
    }
```

## Clasificación estructural
Archivo: `.../structural_trace_classifier.py`

Patrones relevantes recursivos/híbridos:
- `tail_recursive_linear`
- `single_branch_recursive_search`
- `binary_branch_recursive`
- `multi_branch_recursive_fanout`
- `divide_partition_recurse`
- `divide_merge_recurse`
- `backtracking_stateful`
- `hybrid_recursive_iterative`
- `generic_recursive` (fallback)

Heurísticas usadas:
- Aridad de hijos por llamada (`children`).
- Secuencias de steps (`call_resume` + `assign`, etc.).
- Señales tipo partition/merge/backtracking.

Código real de clasificación:

```py
if kind == "hybrid":
    return StructuralTraceClassification(
        patternKind="hybrid_recursive_iterative",
        confidence="medium",
        evidence=["trace.kind == hybrid", "recursion with internal loops"],
    )

if kind == "recursive" and call_tree:
    if _has_partition_like_pattern(steps, calls):
        return StructuralTraceClassification(patternKind="divide_partition_recurse", confidence="high", evidence=[...])
    if _has_merge_like_pattern(steps, calls):
        return StructuralTraceClassification(patternKind="divide_merge_recurse", confidence="medium", evidence=[...])
```

## Builders por patrón
Seleccionados por `builder_factory.py`.

Ejemplos:
- `generic_recursive`: árbol de llamadas base + nodo de resultado si hay retorno de raíz.
- `divide_merge_recurse`: añade nodo `merge/mezcla`.
- `divide_partition_recurse`: añade nodos de operación y resultado (`partition`/`q`).

## Labels de llamadas
Archivo: `.../builders/_call_utils.py`

`call_to_label` arma etiquetas incluyendo:
- Firma de llamada con params de entrada.
- `estado final/final` cuando hubo cambios en params mutables.
- Marca de caso base.
- Flecha de retorno `→ valor` si existe `return_value`.

Locale aplicado (`en|es`) para labels relevantes.

Código real `call_to_label`:

```py
def call_to_label(call: Dict[str, Any], locale: str = "en") -> str:
    params = call.get("params", {})
    final_params = call.get("final_params", {})
    fn = call.get("function_name") or "proc"
    ret = call.get("return_value")
    label_parts = [f"{fn}({pstr})"]
    if isinstance(final_params, dict) and final_params:
        changed = {k: v for k, v in final_params.items() if params.get(k) != v}
        if changed:
            label_parts.append(f"{_t(locale, 'final', 'estado final')}: {final_str}")
    if ret is not None:
        label_parts.append(f"→ {_format_param_value(ret)}")
    return "\n".join(label_parts)
```

## Métricas por llamada
Archivo: `.../metrics_aggregator.py`

Agrega por `callId`:
- `tokens`, `microseconds` locales.
- `aggregateTokens`, `aggregateMicroseconds` del subárbol.

---

## 5) Del Grafo al Render: React Flow

## Entrada visual
Frontend consume `derived.structuredTrace.graph`:
- Tipo TS: `TraceGraph`
- Nodos: `id`, `type`, `position`, `data`.
- Edges: `id`, `source`, `target`, `label`, `type`.

## Layout previo (dagre)
Archivo: `apps/web/src/lib/layout/traceGraphLayout.ts`

`getLayoutedGraph(graph, { direction: "LR" })`:
- Usa `dagre` para layout automático.
- Detecta call tree por prefijo de ids (`call_`).
- Ajusta dimensiones y spacing para árbol recursivo:
  - `callTreeNodeWidth=220`, `callTreeNodeHeight=80`
  - `nodesep=100`, `ranksep=140`
- Para `LR`, invierte dirección de edges hacia nodos tipo `output` para mantener salida visual a la izquierda.

Código real del layout:

```ts
export function getLayoutedGraph(graph: TraceGraph | null | undefined, options: LayoutOptions = {}): TraceGraph {
  const direction = options.direction ?? "TB";
  const callTree = isCallTree(graph);
  const w = callTree ? callTreeNodeWidth : nodeWidth;
  const h = callTree ? callTreeNodeHeight : nodeHeight;
  const dagreGraph = createGraph(direction, callTree ? 100 : 80, callTree ? 140 : 100);

  for (const edge of graph.edges ?? []) {
    const targetType = nodeTypeById.get(edge.target);
    if (direction === "LR" && targetType === "output") {
      dagreGraph.setEdge(edge.target, edge.source);
    } else {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  }
  dagre.layout(dagreGraph);
}
```

## Render principal
Archivo: `apps/web/src/components/ExecutionGraphView.tsx`

Características:
- `@xyflow/react` (React Flow v12).
- Node types:
  - `default`, `input`, `output`, `iteration` (mismo renderer `TraceNode`).
- Edge types:
  - custom `return` (`ReturnEdge.tsx`) para mostrar retornos con estilo diferenciado.

## Enriquecimiento visual de edges
`ExecutionGraphView` hace dos capas de aristas:
1. Aristas base (`mapEdges`): llamadas/flujo principal (`smoothstep`).
2. Aristas de retorno sintéticas (`createReturnEdges`):
   - Extrae `→ valor` del label del nodo hijo.
   - Crea edge inversa hijo→padre tipo `return` con etiqueta de valor.

Esto permite visualizar explícitamente el flujo de retorno recursivo.

Código real (`createReturnEdges`):

```ts
function createReturnEdges(originalEdges: GraphEdge[], nodeIndex: Map<string, GraphNode>): Edge[] {
  const returnEdges: Edge[] = [];
  originalEdges.forEach((edge) => {
    const childNode = nodeIndex.get(edge.target);
    const rawLabel = childNode?.data?.label ?? "";
    const returnMatch = /(?:\\n|^)→\\s*(.+?)(?:\\n|$)/.exec(rawLabel);
    if (!returnMatch) return;
    const returnValue = returnMatch[1]?.trim() ?? "";
    returnEdges.push({
      id: `return_${edge.target}_to_${edge.source}`,
      source: edge.target,
      target: edge.source,
      type: "return",
      data: { returnValue },
    } as Edge);
  });
  return returnEdges;
}
```

## Interacción React Flow
- `fitView` al cargar.
- Pan/zoom habilitados.
- `Controls`, `Background` y estilos custom.
- Nodos arrastrables, no conectables.

Código real de montaje en `ExecutionGraphView`:

```tsx
const layoutedGraph = useMemo(
  () => getLayoutedGraph(graph, { direction: "LR" }),
  [graph],
);

const initialEdges = useMemo(() => {
  const originalEdges = layoutedGraph.edges ?? [];
  const callEdges = mapEdges(originalEdges, nodeIndex, t);
  const returnEdges = createReturnEdges(originalEdges, nodeIndex);
  return [...callEdges, ...returnEdges];
}, [layoutedGraph.edges, nodeIndex, t]);

<ReactFlow
  nodes={nodes}
  edges={edges}
  fitView
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  nodesConnectable={false}
  panOnDrag
  zoomOnScroll
>
  <Background color="#334155" gap={16} size={1} />
  <Controls showZoom showFitView showInteractive />
</ReactFlow>
```

## Contenedor de sección
Archivo: `apps/web/src/components/trace/DiagramSection.tsx`

Responsable de:
- Título contextual (`executionDiagram` vs `callTreeTitle`).
- Estados de carga, vacío y error visual.
- Botones `refresh` y `expand`.

---

## 6) i18n y Locale en Trazas Recursivas

### Backend
- `TraceRequest.locale` (`analysis/schemas.py`).
- `CodeExecutor` usa locale para `description` de steps (`get_trace_step_labels`).
- `StructuredTraceRenderConfig(locale=...)` se pasa desde router a derivaciones.
- Builders usan `config.locale` para labels de nodos estructurados.

### Frontend
- `useTraceController` envía locale en cada request.
- Cache key incluye locale para evitar mezclar respuestas de idiomas distintos.

---

## 7) Contrato de Respuesta (Recursivo/Híbrido)

Campos más relevantes:
- `ok`
- `trace.steps[]`
- `trace.recursionTree` y `trace.callTreeSource`
- `trace.kind`
- `trace.summary`
- `trace.diagnostics`
- `algorithmKind`
- `derived.structuredTrace`

Ejemplo conceptual mínimo:

```json
{
  "ok": true,
  "trace": {
    "kind": "recursive",
    "steps": [
      { "eventKind": "call_enter", "recursion": { "callId": "call_1", "depth": 0 } },
      { "eventKind": "call_spawn_child", "recursion": { "callId": "call_2", "parentCallId": "call_1", "depth": 1 } },
      { "eventKind": "call_resume", "recursion": { "callId": "call_1", "depth": 0 } },
      { "eventKind": "call_exit", "recursion": { "callId": "call_1", "depth": 0 } }
    ],
    "recursionTree": {
      "root_calls": ["call_1"],
      "calls": [
        {
          "id": "call_1",
          "params": { "A": [4,3,2,1] },
          "final_params": { "A": [1,2,3,4] },
          "children": ["call_2"]
        }
      ]
    }
  },
  "derived": {
    "structuredTrace": {
      "patternKind": "divide_merge_recurse",
      "graph": { "nodes": [], "edges": [] },
      "classification": { "confidence": "medium", "evidence": [] }
    }
  }
}
```

---

## 8) Puntos Críticos de Calidad y Depuración

## Invariantes recomendados
1. `steps` debe mantener snapshots inmutables por step.
2. `recursionTree.calls[i].params` = entrada real de la llamada.
3. `final_params` = estado de salida real.
4. `call_spawn_child` y `call_resume` deben conservar relación padre-hijo correcta.
5. `derived.structuredTrace.graph` debe existir incluso ante fallos (aunque sea vacío + `buildError`).

## Checklist rápido cuando "el árbol se ve mal"
1. Verificar `trace.steps` final (¿estado final correcto?).
2. Comparar `params` vs `final_params` en `recursionTree`.
3. Revisar `patternKind` y `classification.evidence`.
4. Confirmar invalidez de cache (versión de contrato o refresh forzado).
5. Validar layout en frontend (`getLayoutedGraph`) y labels de nodos.

## Tests relevantes
- Backend system:
  - `apps/api/tests/system/test_trace_endpoint.py`
  - `apps/api/tests/system/test_trace_diagram_expectations.py`
- Backend unit:
  - `apps/api/tests/unit/test_structured_trace_builders.py`
  - `apps/api/tests/unit/test_executor_param_inference.py`
- Frontend:
  - `apps/web/src/lib/__tests__/trace-cache-utils.test.ts`

---

## 9) Archivos Clave (Mapa Rápido)

### Backend
- Endpoint trace:
  - `apps/api/app/modules/analysis/router.py`
- Request schema:
  - `apps/api/app/modules/analysis/schemas.py`
- Motor ejecución:
  - `apps/api/app/modules/execution/executor.py`
- Builder de trace:
  - `apps/api/app/modules/execution/trace_builder.py`
- Derivación estructural:
  - `apps/api/app/modules/execution/derivations/structured_trace_builder.py`
  - `apps/api/app/modules/execution/derivations/structural_trace_classifier.py`
  - `apps/api/app/modules/execution/derivations/builder_factory.py`
  - `apps/api/app/modules/execution/derivations/builders/*`

### Frontend
- Hook orquestador:
  - `apps/web/src/hooks/trace/useTraceController.ts`
- API route proxy:
  - `apps/web/src/app/api/analyze/trace/route.ts`
- Sección diagrama:
  - `apps/web/src/components/trace/DiagramSection.tsx`
- Renderer React Flow:
  - `apps/web/src/components/ExecutionGraphView.tsx`
- Edge de retorno:
  - `apps/web/src/components/edges/ReturnEdge.tsx`
- Layout dagre:
  - `apps/web/src/lib/layout/traceGraphLayout.ts`
- Tipos TS:
  - `apps/web/src/types/trace.ts`

---

## 10) Nota de Evolución
Existen documentos históricos en `docs/app/` que describen flujos antiguos (por ejemplo, dependencias de LLM para recursión). El comportamiento vigente de trazas recursivas y `structuredTrace` es determinista y está descrito por este documento.
