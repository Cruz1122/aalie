# Modelo de contenido

**Tipo:** normativa

## Propósito

Definir el modelo conceptual de contenido modular antes de su render automático.

## Alcance

Aplica a curso, módulo, capítulo y bloques pedagógicos.

## Fuente de verdad

- `course-json-schema.md`
- `authoring-guide.md`

## Estructura

### Jerarquia

- curso
- módulo
- capitulo
- bloque

### Tipos de bloque previstos

- markdown
- formula
- callout
- lista
- ejemplo
- quiz-link

## Ejemplos

- un capítulo puede contener teoría, formula y ejemplo resuelto como bloques distintos.

## Limites conocidos

- contrato pre-implementación; no existe aún renderer productivo para esta jerarquía.

## Archivos relacionados

- `course-json-schema.md`
- `authoring-guide.md`
