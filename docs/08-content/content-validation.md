# Validación de contenido

**Tipo:** normativa

## Propósito

Definir la validación obligatoria previa al render del catálogo para detectar errores estructurales y semánticos antes de que lleguen a la UI.

## Alcance

Aplica al script `packages/content-catalog/scripts/validate-content-catalog.ts`, a los checks de CI y al authoring local.

## Fuente de verdad

- `packages/content-catalog/src/validate.ts`
- `packages/content-catalog/schemas/`
- `course-json-schema.md`

## Estructura

### Capas de validación

- capa 1: JSON Schema con Ajv para `space`, `module`, `block`, `inline`, `shared`;
- capa 2: validación semántica cross-file sobre descubrimiento, referencias, rutas, orden y progreso.

### Errores bloqueantes actuales

- `CONTENT_001`: schema inválido;
- `CONTENT_101` a `CONTENT_105`: mismatch entre directorio, locale, `spaceId` y filename;
- `CONTENT_201` a `CONTENT_205`: órdenes o IDs repetidos;
- `CONTENT_206`, `CONTENT_220`: colisiones de rutas;
- `CONTENT_207` a `CONTENT_219`: referencias internas, recursos o prerequisitos rotos;
- `CONTENT_301` a `CONTENT_306`: bloques vacíos o tablas mal formadas.

### Warnings actuales

- `CONTENT_401`: sección sobredimensionada;
- `CONTENT_402`: falta `searchMeta` útil en módulo;
- `CONTENT_403`: módulo draft sin progreso computable;
- `CONTENT_404`: cobertura incompleta entre locales para un mismo espacio.

### Reglas semánticas obligatorias

- unicidad de `moduleId` y `slug` por `spaceId + locale`;
- unicidad de `chapterId`, `sectionId` y `block.id` dentro del módulo;
- consistencia entre `space.json`, `*.module.json` y la ruta física;
- `resourceRef`, `termRef`, `solutionRef` y `target.ref` deben resolver;
- módulos publicados deben tener al menos una sección trackeable;
- `publicPath` debe existir en `apps/web/public/`.

## Ejemplos

- válido: agregar un módulo nuevo con filename `02-nuevo-modulo.module.json` y `order: 2`.
- no válido: `buttonRow` apuntando a `section` inexistente.
- no válido: `table` con 2 columnas y una fila de 3 celdas.

## Limites conocidos

- la validación no compara equivalencia semántica exacta entre textos de distintos locales;
- `backendAsset` se valida por presencia contractual, no por existencia remota.

## Archivos relacionados

- `course-json-schema.md`
- `authoring-guide.md`
- `search-indexing.md`
