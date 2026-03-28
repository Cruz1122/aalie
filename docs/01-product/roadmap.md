# Mapa actual de capacidades

**Tipo:** descriptiva

## Propósito

Servir como mapa de lectura y de madurez actual del producto sin incluir backlog, sprints ni planes futuros.

## Alcance

Solo cubre capacidades visibles hoy o contratos ya aprobados en este repo.

## Fuente de verdad

- rutas del frontend;
- routers backend;
- ADRs vigentes;
- contratos en `03-specs/` y `04-api/`.

## Estructura

### Capacidades operativas actuales

| Capacidad | Estado documental esperado |
| --- | --- |
| Parseo y AST | contrato normativo |
| Clasificación de algoritmo | contrato normativo |
| Análisis iterativo y recursivo | contrato normativo |
| Heurística de WHILE | contrato normativo |
| Trace de ejecución | contrato normativo |
| Snapshot y export | contrato normativo |
| Integración LLM | arquitectura + API |
| Guía de uso del analizador | guía operativa |
| Catálogo de ejemplos | contrato + guía |

### Lecturas recomendadas

- mantenimiento de motor: `03-specs/`
- integración FE/BE: `04-api/`
- soporte operativo: `06-operations/`
- uso en clase: `07-user/`

## Ejemplos

- Si el trabajo es revisar una regresión en PDF, la ruta correcta es `03-specs/report-snapshot-spec.md` -> `03-specs/export-engine-spec.md` -> `04-api/execution-api.md`.

## Limites conocidos

- Este archivo no enumera iniciativas futuras ni define fechas.
- Los contratos pre-implementación de `08-content/` no se listan aquí como capacidad operativa.

## Archivos relacionados

- `vision.md`
- `known-limitations.md`
- `../index.md`
