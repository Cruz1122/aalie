# Schema JSON de bloques

**Tipo:** normativa

## Propósito

Definir el catálogo oficial de bloques renderizables y sus payloads para que cualquier renderer pueda interpretar el contenido sin heurística manual.

## Alcance

Aplica a `block.schema.json`, a los módulos del catálogo y a cualquier UI futura que renderice contenido pedagógico.

## Fuente de verdad

- `packages/content-catalog/schemas/block.schema.json`
- `inline-rich-text-schema.md`
- `content-model.md`

## Estructura

### Tipos oficiales de bloque v1

- `heading`
- `paragraph`
- `list`
- `quote`
- `note`
- `callout`
- `definition`
- `theorem`
- `proof`
- `example`
- `exercise`
- `exerciseSolution`
- `algorithm`
- `code`
- `table`
- `image`
- `figure`
- `equationBlock`
- `cheatsheet`
- `referenceList`
- `buttonRow`
- `divider`

### Invariantes por familia

- bloques de texto usan `richText` tipado, nunca HTML o Markdown libre;
- bloques contenedores usan `blocks[]` anidados, no strings largos;
- `exercise.solutionRef` debe apuntar a un `block.id` existente;
- `image` y `figure` siempre resuelven mediante `resourceRef`;
- `referenceList` solo referencia resources de tipo `reference`;
- `table.rows[].cells.length` debe coincidir con `columns.length`.

### Reglas de nesting

- pueden anidar `blocks[]`: `note`, `callout`, `definition`, `theorem`, `proof`, `example`, `exerciseSolution`;
- no anidan `blocks[]`: `paragraph`, `quote`, `algorithm`, `code`, `table`, `image`, `figure`, `equationBlock`, `cheatsheet`, `referenceList`, `buttonRow`, `divider`;
- `list` puede anidar `children[]` dentro de cada item.

### Regla de render neutro

- el renderer selecciona componente por `block.type`;
- el renderer nunca inspecciona `moduleId`, `spaceId` o nombres de archivo para decidir UI;
- estilos visuales específicos se derivan de `variant`, `display` o props neutrales del bloque.

### Restricciones explícitas de v1

- no hay bloque `markdown`;
- no hay bloque `html`;
- no hay componentes arbitrarios embebidos en JSON;
- no hay lógica de render por curso, capítulo o módulo;
- no hay `page` persistida como entidad aparte.

## Ejemplos

- válido: `note` con `variant`, `title` y `blocks[]`.
- válido: `table` con `columns[]` y `rows[].cells[]`.
- válido: `example` que contiene `algorithm` y `paragraph`.
- no válido: `image` sin `resourceRef`.
- no válido: `exercise` con `solutionRef` a un bloque inexistente.

## Limites conocidos

- v1 no define bloques multimedia avanzados como video, audio o embeds arbitrarios;
- comparadores complejos y demostraciones extensas deben componerse con bloques ya existentes.

## Archivos relacionados

- `course-json-schema.md`
- `inline-rich-text-schema.md`
- `content-validation.md`
