# Schema JSON de quiz

**Tipo:** normativa

## Propósito

Definir el schema base de preguntas y feedback.

## Alcance

Aplica al banco de preguntas y a la estructura consumible por una UI futura.

## Fuente de verdad

- `../03-specs/quizzes-spec.md`
- `authoring-guide.md`

## Estructura

### Campos mínimos por pregunta

- `questionId`
- `type`
- `prompt`
- `difficulty`
- `tags[]`
- `options[]`
- `correctAnswer`
- `explanation`
- `contentRefs[]`

## Ejemplos

- pregunta de opción múltiple con referencia a un capítulo de recurrencias.

## Limites conocidos

- contrato pre-implementación; no describe persistencia ni sesión ya implementada.

## Archivos relacionados

- `content-model.md`
- `authoring-guide.md`
