# Schema JSON de curso

**Tipo:** normativa

## Propósito

Definir el schema base para cursos, módulos y capítulos.

## Alcance

Aplica al JSON de contenido principal.

## Fuente de verdad

- `content-model.md`
- `../03-specs/content-modules-spec.md`

## Estructura

### Campos mínimos

- `version`
- `courseId`
- `title`
- `locale`
- `modules[]`

Cada módulo:

- `moduleId`
- `title`
- `chapters[]`

Cada capítulo:

- `chapterId`
- `title`
- `blocks[]`

## Ejemplos

- un curso con dos módulos y cada uno con capítulos versionados.

## Limites conocidos

- los bloques concretos deben seguir el tipo definido por el authoring guide.

## Archivos relacionados

- `content-model.md`
- `authoring-guide.md`
