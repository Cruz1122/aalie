# Guía de authoring

**Tipo:** normativa

## Propósito

Definir reglas para crear contenido y quizzes sin tocar lógica de render.

## Alcance

Aplica a autores de JSON de curso y de preguntas.

## Fuente de verdad

- `content-model.md`
- `course-json-schema.md`
- `quiz-json-schema.md`

## Estructura

### Reglas

- ids estables y únicos;
- versión explícita del documento;
- referencias internas validables;
- bloques y preguntas con tipo determinista;
- feedback siempre enlazado a contenido relevante.

### Validaciones

- no repetir ids;
- no dejar referencias rotas;
- no mezclar campos de tipos distintos en un mismo bloque/pregunta.

## Ejemplos

- agregar un capítulo nuevo solo debe modificar JSON, no código.

## Limites conocidos

- hasta que exista renderer de contenido, esta guía funciona como contrato previo de authoring.

## Archivos relacionados

- `course-json-schema.md`
- `quiz-json-schema.md`
