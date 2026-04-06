# Guía de análisis recursivo

**Tipo:** descriptiva

## Propósito

Explicar qué esperar cuando se analiza un algoritmo recursivo.

## Alcance

Cubre detección de métodos, bundles paso a paso, trace y advertencias.

## Fuente de verdad

- `analysis` recursivo
- selector de método del frontend

## Estructura

### Flujo

1. clasificación recursiva;
2. detección de métodos;
3. selección o default;
4. resultado del método;
5. trace/export si se desea.

### Lo que puede ocurrir

- varios métodos aplicables;
- un método por defecto;
- bundles `complete`, `partial`, `unsupported` o `error`.

## Ejemplos

- `mergeSort` suele priorizar `master`.
- `factorial` puede resolverse por `iteration` o `characteristic_equation` según cobertura.

## Limites conocidos

- no toda recurrencia tiene solución automática completa.

## Archivos relacionados

- `user-guide.md`
- `exports-guide.md`
- `../03-specs/recurrence-methods-spec.md`
