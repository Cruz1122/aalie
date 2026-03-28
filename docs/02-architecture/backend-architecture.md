# Arquitectura backend

**Tipo:** descriptiva

## Propósito

Explicar cómo está organizado el backend por módulos y dónde vive cada contrato técnico.

## Alcance

Cubre parseo, clasificación, análisis, ejecución/trace y export.

## Fuente de verdad

- `apps/api/app/main.py`
- `apps/api/app/modules/`
- `apps/api/tests/`

## Estructura

### Módulos principales

- `parsing/`: adaptador, servicio y router de parseo.
- `classification/`: clasificación de algoritmo por AST.
- `analysis/`: motor iterativo/recursivo, WHILE, loop invariant y detección de métodos.
- `execution/`: ejecución instrumentada y derivación de `structuredTrace`.
- `export/`: snapshot builder, document model y renderers.

### Contratos entre módulos

- `classification` depende de parse/AST válido.
- `analysis` recibe `source`, puede reclasificar y devuelve contratos por caso.
- `trace_service` parsea, clasifica, ejecuta y deriva trace estructurado.
- `export` reutiliza parse, classify, analyze y trace para construir snapshot.

### Bottlenecks y dependencias simbólicas

- SymPy se usa en simplificación, cierre de sumatorias y parte de los métodos recursivos.
- Cuando la expresión sale de cobertura simbólica, el backend debe degradar a salida parcial o no soportada, nunca inventar una conclusión.

### Routers expuestos

- `/health`
- `/grammar/parse`
- `/classify`
- `/analyze/open`
- `/analyze/detect-methods`
- `/analyze/trace`
- `/export/report`

## Ejemplos

- Cambiar parser: `parsing/` + tipos compartidos + tests.
- Cambiar heurística de WHILE: `analysis/while_engine/` + contratos + tests contract.
- Cambiar export: `export/` + snapshot/versionado + tests unit/system.

## Limites conocidos

- El backend no usa el LLM como fuente de verdad para parse, classify ni analyze.
- Export PDF necesita dependencias de sistema, no solo paquetes Python.

## Archivos relacionados

- `system-architecture.md`
- `analysis-engine-overview.md`
- `execution-trace-architecture.md`
