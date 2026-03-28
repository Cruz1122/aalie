# Especificación de quizzes

**Tipo:** normativa

## Propósito

Definir el contrato base de quizzes antes de su implementación para evitar que nazcan sin schema, feedback ni reglas de validación.

## Alcance

Aplica a la estructura de preguntas, sesiones y feedback, no a una UI ya existente.

## Fuente de verdad

- `08-content/quiz-json-schema.md`
- ADRs de versionado y contratos

## Estructura

### Entidades previstas

- banco de preguntas;
- sesión de quiz;
- resultado por pregunta;
- feedback vinculado a contenido.

## Inputs

- JSON de pregunta;
- referencias a módulo/capítulo de contenido;
- metadatos de dificultad, tema y tags.

## Outputs

- estructura determinista consumible por UI futura;
- feedback y links a contenido relacionados;
- resultado serializable por sesión.

## Invariantes

- cada pregunta tiene identificador estable;
- la corrección y el feedback no dependen de texto libre inferido en runtime;
- la estructura debe permitir validación automática.

## Errores esperables

- opciones ambiguas;
- feedback sin referencia de contenido;
- schema incompatible con version declarada.

## Ejemplos

### Ejemplos validos

- pregunta de opción múltiple con respuesta única y explicación enlazada a un módulo.

### Ejemplos no soportados

- pregunta sin criterio de correccion determinista;
- feedback sin referencia verificable a contenido.

## Limites conocidos

- Esta spec es pre-implementación; no describe una UI ya shipped.

## Archivos relacionados

- `content-modules-spec.md`
- `../08-content/quiz-json-schema.md`
