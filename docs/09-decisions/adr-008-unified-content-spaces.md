# ADR-008: Espacios de contenido unificados

**Tipo:** normativa
**Estado:** aceptada
**Fecha:** 2026-05-18
**Fuente de verdad:** `packages/content-catalog/`, `docs/08-content/content-model.md`, `scripts/check_docs_contracts.py`

## Propósito

Registrar la decisión de unificar guía y curso teórico bajo un mismo contrato de contenido descubrible y renderizable.

## Alcance

Aplica a `docs/08-content/`, `packages/content-catalog/`, validación, búsqueda, progreso y futuras rutas de contenido.

## Fuente de verdad

- `packages/content-catalog/`
- `docs/08-content/content-model.md`
- `scripts/check_docs_contracts.py`

## Estructura

### Decisión

- se adopta una jerarquía única `space -> module -> chapter -> section -> block`;
- el catálogo canónico vive en `packages/content-catalog/`;
- la ruta de un espacio se deriva de `space.slug`;
- la ruta de un módulo se deriva de `space.slug + module.slug`;
- la UI renderiza por `block.type` y `target.kind`, no por IDs de contenido.

### Consecuencias

- agregar contenido nuevo debe implicar editar JSON y assets, no reprogramar rutas;
- la guía de usuario deja de ser un contrato aislado a futuro;
- el proyecto gana schemas físicos, validador semántico y ejemplos canónicos bajo un workspace compartido.

### Alternativas descartadas

- guía y curso con sistemas separados;
- Markdown libre como contrato principal;
- un JSON monolítico por curso;
- lógica manual por curso o por ruta.

## Ejemplos

- `/user-guide` y `/course` son espacios distintos con el mismo contrato.
- `mod-guia-de-uso` y `mod-complejidad-temporal-y-espacial` se descubren sin wiring manual.

## Limites conocidos

- esta ADR no ejecuta por sí misma la migración de la UI viva de `/user-guide`;
- v1 sigue usando sección como unidad de progreso y paginación.

## Archivos relacionados

- `../08-content/content-model.md`
- `adr-007-versioned-schemas.md`
