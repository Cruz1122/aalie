# Schema JSON de bloques

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | autor-contenido
**Fuente de verdad:** `packages/content-catalog/schemas/block.schema.json`, `inline-rich-text-schema.md`, `content-model.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 3.2 — Bloques de contenido

## Propósito

Definir el catálogo oficial de bloques renderizables y sus payloads para que cualquier renderer pueda interpretar el contenido sin heurística manual.

## Alcance

Aplica a `block.schema.json`, a los módulos del catálogo y a cualquier UI futura que renderice contenido pedagógico.

## Fuente de verdad

- `packages/content-catalog/schemas/block.schema.json`
- `inline-rich-text-schema.md`
- `content-model.md`

## Estructura

### Tipos oficiales de bloque (de `block.schema.json` y `types.ts`)

| Tipo | Requerido | Contiene | ¿Anida `blocks[]`? |
|---|---|---|---|
| `heading` | `id`, `type`, `level`, `content` | `content: RichText`; `level: 2|3|4` | No |
| `paragraph` | `id`, `type`, `content` | `content: RichText` | No |
| `list` | `id`, `type`, `items` | `items[]: { content, children? }`; `style?: unordered|ordered` | No (pero items anidan) |
| `quote` | `id`, `type`, `content` | `content: RichText`; `attribution?: string` | No |
| `note` | `id`, `type`, `variant`, `title`, `blocks` | `variant: info|warning|success|danger`; `title: string` | Sí |
| `callout` | `id`, `type`, `title`, `blocks` | `title: string` | Sí |
| `definition` | `id`, `type`, `title`, `blocks` | `title: string` | Sí |
| `theorem` | `id`, `type`, `title`, `blocks` | `title: string` | Sí |
| `proof` | `id`, `type`, `title`, `blocks` | `title: string` | Sí |
| `example` | `id`, `type`, `title`, `blocks` | `title: string` | Sí |
| `evidenceBlock` | `id`, `type`, `variant`, `icon`, `blocks` | `variant: concept|example|systemEvidence|interpretation|warning`; `icon` del conjunto cerrado | Sí |
| `exercise` | `id`, `type`, `prompt` | `prompt: RichText`; `title?`, `difficulty?`, `solutionRef?` | No |
| `exerciseSolution` | `id`, `type`, `title`, `blocks` | `title: string` | Sí |
| `algorithm` | `id`, `type`, `language`, `code` | `language: pseudocode|text|json|python|typescript`; `code: string` | No |
| `code` | `id`, `type`, `language`, `code` | `language: pseudocode|text|json|python|typescript`; `code: string` | No |
| `table` | `id`, `type`, `columns`, `rows` | `columns[]: { key, label, align? }`; `rows[].cells[]` | No |
| `image` | `id`, `type`, `resourceRef` | `resourceRef: string`; `display?: { width, captionPosition }` | No |
| `figure` | `id`, `type`, `resourceRef` | `resourceRef: string`; `display?: { width, captionPosition }` | No |
| `latex` | `id`, `type`, `latex` | `latex: string`; `align?`, `title?`, `caption?` | No |
| `equationBlock` | `id`, `type`, `latex` | `latex: string`; `align?`, `title?`, `caption?` | No |
| `latexSteps` | `id`, `type`, `steps` | `steps[]: { stepId, title?, explanation?, latex }` | No |
| `mermaid` | `id`, `type`, `code` | `code: string` (diagrama Mermaid); `title?`, `caption?` | No |
| `recursionTree` | `id`, `type`, `nodes` | `nodes[]: { nodeId, label, parentId?, edgeLabel? }`; `caption?` | No |
| `graph` | `id`, `type`, `nodes`, `edges` | `nodes[]: { nodeId, label }`; `edges[]: { edgeId, source, target, label? }` | No |
| `complexityTable` | `id`, `type`, `columns`, `rows` | Igual que `table` pero con tipado semántico | No |
| `formulaComparisonTable` | `id`, `type`, `columns`, `rows` | Igual que `table` pero con tipado semántico | No |
| `methodCard` | `id`, `type`, `title` | `summary?: RichText`; `whenToUse?: RichText[]`; `steps?: RichText[]`; `pitfalls?: RichText[]` | No |
| `stepByStepMethod` | `id`, `type`, `title`, `steps` | `steps[]: { stepId, title, blocks[] }` | Sí (vía steps) |
| `proofSteps` | `id`, `type`, `title`, `steps` | `steps[]: { stepId, title, blocks[] }` | Sí (vía steps) |
| `warningTrap` | `id`, `type`, `title` | `misconception?: RichText`; `whyItFails?: RichText`; `fix?: RichText` | No |
| `exampleSolved` | `id`, `type`, `title`, `steps` | `problem?: RichText`; `steps[]: { stepId, title, explanation, latex? }`; `answer?: RichText` | No |
| `quizCheckpoint` | `id`, `type`, `quizId` | `quizId: string`; `title?`, `prompt?: RichText` | No |
| `cheatsheet` | `id`, `type`, `items` | `items[]: { label, value: RichText }` | No |
| `referenceList` | `id`, `type`, `references` | `references[]: string` (resourceId de tipo reference) | No |
| `buttonRow` | `id`, `type`, `buttons` | `buttons[]: { label, target: TargetRef, variant? }` | No |
| `divider` | `id`, `type` | Sin payload adicional | No |

### Invariantes por familia

- Bloques de texto (`heading`, `paragraph`, `quote`) usan `content: RichText` — nunca HTML o Markdown libre.
- Bloques contenedores usan `blocks[]` anidados, no strings largos.
- `exercise.solutionRef` debe apuntar a un `block.id` existente (prefijo `blk-`).
- `image` y `figure` siempre resuelven mediante `resourceRef`.
- `referenceList` solo referencia resources de tipo `reference`.
- `table.rows[].cells.length` debe coincidir con `columns.length`.
- `algorithm` y `code` requieren `code: string` no vacío y `language` del enum.
- `mermaid` requiere `code: string` no vacío.
- `graph` requiere al menos 1 nodo y 1 arista.

### Reglas de nesting

**Pueden anidar `blocks[]`**: `note`, `callout`, `definition`, `theorem`, `proof`, `example`, `evidenceBlock`, `exerciseSolution`.

**Anidan vía `steps[].blocks[]`**: `stepByStepMethod`, `proofSteps`.

**No anidan `blocks[]`**: `paragraph`, `quote`, `algorithm`, `code`, `table`, `image`, `figure`, `equationBlock`, `latexSteps`, `mermaid`, `recursionTree`, `graph`, `complexityTable`, `formulaComparisonTable`, `methodCard`, `warningTrap`, `exampleSolved`, `quizCheckpoint`, `cheatsheet`, `referenceList`, `buttonRow`, `divider`.

**`list` puede anidar `children[]`** dentro de cada item para listas anidadas.

### Regla de render neutro

- El renderer selecciona componente por `block.type`.
- El renderer nunca inspecciona `moduleId`, `spaceId` o nombres de archivo para decidir UI.
- Estilos visuales específicos se derivan de `variant`, `display` o props neutrales del bloque.

### Restricciones explícitas de v1

- No hay bloque `markdown`.
- No hay bloque `html`.
- No hay componentes arbitrarios embebidos en JSON.
- No hay lógica de render por curso, capítulo o módulo.
- No hay `page` persistida como entidad aparte.

## Ejemplos

- Válido: `note` con `variant`, `title` y `blocks[]`.
- Válido: `table` con `columns[]` y `rows[].cells[]`.
- Válido: `example` que contiene `algorithm` y `paragraph`.
- Válido: `evidenceBlock` con `variant`, `icon` (conjunto cerrado) y `blocks[]` anidados.
- No válido: `image` sin `resourceRef`.
- No válido: `exercise` con `solutionRef` a un bloque inexistente.
- No válido: `table` con 2 columnas y una fila de 3 celdas.
- No válido: `mermaid` con `code` vacío.

## Limites conocidos

- v1 no define bloques multimedia avanzados como video, audio o embeds arbitrarios.
- Comparadores complejos y demostraciones extensas deben componerse con bloques ya existentes.

## Archivos relacionados

- `course-json-schema.md`
- `inline-rich-text-schema.md`
- `content-validation.md`
- `content-model.md`
