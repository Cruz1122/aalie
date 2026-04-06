# Modelo de contenido

**Tipo:** normativa

## Propósito

Fijar el modelo unificado de contenido para guías y cursos teóricos sin lógica manual por espacio, página o módulo.

## Alcance

Aplica al catálogo canónico de `packages/content-catalog/`, al renderer futuro de contenido y a la validación previa al render.

## Fuente de verdad

- `packages/content-catalog/catalog/`
- `packages/content-catalog/schemas/`
- `course-json-schema.md`

## Estructura

### Principio rector

- guía de usuario y curso teórico comparten el mismo contrato;
- el contenido vive en archivos JSON, no en componentes por curso;
- las rutas se derivan de `space.slug` y `module.slug`, no de código manual;
- la UI decide por `block.type` y `target.kind`, nunca por IDs concretos.

### Jerarquía oficial

- `space`
- `module`
- `chapter`
- `section`
- `block`

### Entidades clave

- `space`: contenedor navegable como `/user-guide` o `/course`.
- `module`: unidad visible en la grilla de entrada y en navegación interna.
- `chapter`: agrupador semántico dentro de un módulo.
- `section`: unidad oficial de lectura, progreso y paginación v1.
- `block`: unidad renderizable tipada.

### Decisiones cerradas

- el catálogo canónico vive en `packages/content-catalog/`, no en `docs/`;
- la localización canónica es un archivo por locale;
- el descubrimiento es por filesystem en `catalog/spaces/<spaceId>/<locale>/`;
- el progreso se calcula por secciones con `trackProgress: true`;
- los recursos visuales usan source híbrido: `backendAsset`, `publicPath` o `externalUrl`;
- el rich text inline es tipado y prohíbe Markdown/HTML libre como contrato de authoring.

## Ejemplos

- `packages/content-catalog/catalog/spaces/user-guide/es/` representa la guía de usuario con el mismo contrato que cualquier curso.
- `packages/content-catalog/catalog/spaces/theory/es/` representa el espacio teórico bajo `/course`.

## Limites conocidos

- la migración del renderer vivo de `/user-guide` al contrato unificado queda fuera de esta fase;
- v1 no persiste una entidad `page`; la paginación se deriva de secciones.

## Archivos relacionados

- `course-json-schema.md`
- `block-json-schema.md`
- `inline-rich-text-schema.md`
