# Guía de ejemplos

**Tipo:** descriptiva

## Propósito

Explicar cómo usar el catálogo de ejemplos como apoyo de estudio y validación.

## Alcance

Cubre navegación por categorías, carga del pseudocódigo y lectura de badges.

## Fuente de verdad

- `apps/web/src/lib/examples/catalog.ts`
- vistas `/examples`

## Estructura

### Uso recomendado

- elegir categoría;
- revisar resumen y dificultad;
- cargar el código en el analizador;
- comparar el método o complejidad obtenida con la badge visible.

### Significado de badges

- `TM`, `IT`, `AR`, `EC` solo se muestran si el backend las sostiene para ese ejemplo habilitado.

## Ejemplos

- usar `bubbleSort` para contrastar un caso cuadrático iterativo;
- usar `mergeSort` para estudiar `master`.

## Limites conocidos

- un ejemplo deshabilitado puede existir en catálogo maestro pero no estar expuesto en UI.

## Archivos relacionados

- `user-guide.md`
- `../03-specs/examples-catalog-spec.md`
