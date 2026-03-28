# Vista general del motor de análisis

**Tipo:** descriptiva

## Propósito

Dar una vista compacta del pipeline del motor antes de entrar a las specs normativas.

## Alcance

Resume parseo, clasificación, análisis iterativo/recursivo, WHILE, loop invariant y salida general.

## Fuente de verdad

- `apps/api/app/modules/analysis/service.py`
- `apps/api/app/modules/analysis/analyzers/`
- `apps/api/app/modules/analysis/while_engine/`
- `apps/api/app/modules/analysis/invariants/`

## Estructura

### Pipeline lógico

1. AST normalizado.
2. Clasificación del algoritmo.
3. Selección de analizador.
4. Visita de estructuras y acumulación de costos.
5. Construcción de `T_open`.
6. Simplificación y notaciones.
7. Artefactos auxiliares: loop invariant, métodos, prueba paso a paso.

### Modos del motor

- iterativo;
- recursivo;
- híbrido;
- caso `worst`, `best`, `avg` o `all`.

### Fronteras del motor

- lo determinista vive en backend;
- trace ejecuta con inputs concretos, no reemplaza el análisis simbólico;
- export no recalcula el motor.

## Ejemplos

- Un `FOR` simple produce `byLine`, `T_open` y notaciones.
- Una recurrencia tipo divide-and-conquer puede producir método detectado, detalle del método y trace/recursion tree.

## Limites conocidos

- El motor mezcla exactitud matemática y heurística conservadora; eso debe verse en sus estados y advertencias.

## Archivos relacionados

- `backend-architecture.md`
- `../03-specs/analysis-engine-spec.md`
- `../03-specs/while-heuristics-spec.md`
