# Especificación de módulos de contenido

**Tipo:** normativa

## Propósito

Definir el contrato de módulos de contenido antes de su render automático en la app.

## Alcance

Aplica a curso, módulo, capítulo, bloques y referencias internas.

## Fuente de verdad

- `08-content/content-model.md`
- `08-content/course-json-schema.md`

## Estructura

### Entidades previstas

- curso;
- módulo;
- capítulo;
- bloque de contenido;
- referencias cruzadas, assets y metadata pedagogica.

## Inputs

- JSON del curso;
- assets y referencias internas;
- metadata de render.

## Outputs

- estructura normalizada consumible por renderer futuro;
- validación automática del authoring.

## Invariantes

- agregar contenido no debe exigir tocar lógica de render;
- la jerarquía curso -> módulo -> capítulo es estable;
- los bloques deben ser serializables y renderizables sin inferencia ad hoc.

## Errores esperables

- ids duplicados;
- referencias a assets o módulos inexistentes;
- bloques sin tipo renderizable.

## Ejemplos

### Ejemplos validos

- curso con módulos, capítulos y bloques `markdown`, `formula`, `callout`.

### Ejemplos no soportados

- contenido cuya estructura dependa de código custom por módulo;
- bloques sin tipo ni payload validable.

## Limites conocidos

- Esta spec es pre-implementación; no documenta una página de contenido ya disponible en la app.

## Archivos relacionados

- `quizzes-spec.md`
- `../08-content/course-json-schema.md`
