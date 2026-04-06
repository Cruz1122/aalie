# Especificación de módulos de contenido

**Tipo:** normativa

## Propósito

Definir el contrato operativo que conecta el catálogo de contenido con el renderer futuro y con la validación automática del repo.

## Alcance

Aplica a espacios, módulos, capítulos, secciones, bloques, referencias internas, búsqueda y progreso.

## Fuente de verdad

- `08-content/content-model.md`
- `08-content/course-json-schema.md`
- `packages/content-catalog/`

## Estructura

### Entidades contractuales

- `space`;
- `module`;
- `chapter`;
- `section`;
- `block`;
- `resource`;
- `term`.

## Inputs

- `space.json` descubierto en `catalog/spaces/*/*/`;
- módulos `*.module.json` descubiertos en `modules/`;
- resources y references declaradas por módulo;
- estado de secciones completadas para progreso.

## Outputs

- bundles normalizados con rutas derivadas;
- índice de búsqueda desde JSON;
- porcentaje de progreso por módulo;
- reporte de validación schema + semántica.

## Invariantes

- agregar un módulo no exige tocar rutas ni componentes específicos;
- la jerarquía estable es `space -> module -> chapter -> section -> block`;
- el renderer decide solo por `block.type` y `target.kind`;
- la búsqueda no depende del DOM renderizado;
- el progreso se calcula por `section`.

## Errores esperables

- schema inválido;
- `spaceId` o `locale` inconsistentes con el directorio;
- IDs duplicados u órdenes repetidos;
- recursos, términos o targets internos rotos;
- módulos publicados sin progreso computable.

## Ejemplos

### Ejemplos validos

- `/user-guide` y `/course` descubiertos como espacios distintos con el mismo contrato.
- módulo teórico con `theorem`, `proof`, `exercise` y `figure` sin lógica ad hoc.
- bloques `evidenceBlock` con `variant` + `icon` en un conjunto cerrado (Material Icons vía renderer web) para marcas pedagógicas sin acoplar el JSON a la implementación del motor.

### Ejemplos no soportados

- contenido que requiera componentes exclusivos por `moduleId`;
- módulos cuyo route path venga hardcodeado fuera de `space.slug` y `module.slug`;
- bloques libres de tipo `markdown` o `html`.

## Limites conocidos

- esta spec no ejecuta aún la migración de la UI viva a páginas genéricas de contenido;
- la persistencia cross-device de progreso queda fuera de esta fase.

## Contenido de la guía de usuario (`user-guide`)

- el texto de la guía no debe documentar el pipeline interno del analizador (p. ej. `parse → snapshot → export`); el lenguaje pedagógico expone **escribir → validar → analizar → interpretar**;
- enlaces internos rotos en el catálogo deben resolverse o mostrarse como no disponibles en UI, sin navegación silenciosa a un destino vacío.

## Archivos relacionados

- `quizzes-spec.md`
- `../08-content/course-json-schema.md`
- `../09-decisions/adr-008-unified-content-spaces.md`
