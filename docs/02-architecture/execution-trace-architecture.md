# Arquitectura de trazas

**Tipo:** descriptiva

## Propósito

Explicar cómo AALIE construye, deriva y consume el trace de ejecución.

## Alcance

Cubre servicio de trace, ejecutor, `structuredTrace`, consumo frontend y uso en export.

## Fuente de verdad

- `apps/api/app/modules/analysis/trace_service.py`
- `apps/api/app/modules/execution/`
- `apps/web/src/types/trace.ts`
- `apps/web/src/components/trace/`

## Estructura

### Flujo de generación

1. parsear fuente;
2. clasificar algoritmo;
3. ejecutar `CodeExecutor` con `case`, `input_size` e `initial_variables`;
4. enriquecer trace con resumen y diagnósticos;
5. derivar `structuredTrace` para diagrama y clasificación estructural;
6. exponerlo a UI y export.

### Artefactos

- `trace`: pasos canonicamente ordenados;
- `summary`: total de pasos, llamadas y profundidad;
- `diagnostics`: truncamiento y advertencias;
- `callTreeSource`: fuente para árbol de llamadas;
- `derived.structuredTrace`: grafo y clasificación.

### Consumo de recursión

- la vista automática y el seguimiento manual guiado comparten el mismo `trace` base y el mismo `derived.structuredTrace`;
- la vista automática prioriza la lectura global del árbol de recursión y su explicación;
- el seguimiento manual guiado prioriza la navegación por pasos, niveles, expansión y retorno para uso docente;
- ambos modos deben respetar la misma secuencia contractual de llamadas y retornos.

### Consumidores

- `TraceDedicatedView` y componentes de `apps/web/src/components/trace/`;
- export institucional para diagramas de trace;
- tests unit/system y snapshots esperados.

## Ejemplos

- Un algoritmo iterativo usa pasos y variables por línea.
- Un algoritmo recursivo agrega call tree y clasificación estructural.
- Un algoritmo recursivo con seguimiento manual guiado muestra primero la expansión estructural y luego el retorno sin cambiar la fuente de verdad.

## Limites conocidos

- El trace usa inputs concretos; no es una prueba matemática del análisis asintótico.
- El algoritmo de derivación estructural puede degradar a `unknown` con grafo vacío si falla la clasificación.
- Si la traza está truncada o es parcial, la UI debe mostrar solo la parte derivable y dejar explícito que el árbol no es concluyente.

## Archivos relacionados

- `analysis-engine-overview.md`
- `../03-specs/execution-trace-spec.md`
- `../04-api/execution-api.md`
