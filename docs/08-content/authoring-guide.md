# Guía de authoring

**Tipo:** normativa

## Propósito

Dar una convención operativa clara para crear o ampliar espacios y módulos sin tocar código de render ni rutas.

## Alcance

Aplica a autores de contenido en `packages/content-catalog/catalog/` y a quienes mantengan los schemas y validaciones asociadas.

## Fuente de verdad

- `packages/content-catalog/catalog/`
- `packages/content-catalog/scripts/validate-content-catalog.ts`
- `course-json-schema.md`

## Estructura

### Layout oficial

- `packages/content-catalog/catalog/spaces/<spaceId>/<locale>/space.json`
- `packages/content-catalog/catalog/spaces/<spaceId>/<locale>/modules/<order>-<slug>.module.json`

### Checklist para crear un espacio nuevo

- crear `space.json` con `spaceId`, `slug`, `kind`, `search` y `progress`;
- usar un `slug` que defina la ruta pública del espacio;
- crear al menos un módulo publicado o draft bajo `modules/`.

### Checklist para crear un módulo nuevo

- elegir `moduleId` con prefijo `mod-`;
- usar filename `NN-slug.module.json`;
- declarar `chapters[]`, `sections[]` y `blocks[]` tipados;
- completar `searchMeta`, `tags`, `learningObjectives` cuando apliquen;
- ejecutar `pnpm -C packages/content-catalog validate`.

### Reglas de authoring

- no duplicar lógica de UI dentro del JSON;
- no usar HTML o Markdown libre como contrato;
- declarar recursos una sola vez y referenciarlos por ID;
- usar `target.kind + target.ref` para navegación interna;
- usar `section` como unidad de lectura/progreso en v1.

### Errores frecuentes

- filename que no coincide con `order + slug`;
- `sectionId` o `block.id` duplicados;
- `resourceRef` sin resource declarado;
- `solutionRef` apuntando a un bloque inexistente;
- olvidar `trackProgress` en una sección publicada.

## Ejemplos

- la guía de usuario ya existe como `spaceId = user-guide` con módulo `mod-guia-de-uso`.
- el curso teórico ya existe como `spaceId = theory` y `slug = course`.

## Limites conocidos

- v1 no ofrece aún editor visual de authoring;
- assets backend se referencian por `assetId`, pero su gestión fuera del catálogo sigue siendo externa.

## Archivos relacionados

- `course-json-schema.md`
- `content-validation.md`
- `progress-model.md`
