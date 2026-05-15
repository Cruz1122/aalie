# Schema JSON de rich text inline

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | autor-contenido
**Fuente de verdad:** `packages/content-catalog/schemas/inline.schema.json`, `packages/content-catalog/schemas/shared.schema.json`, `packages/content-catalog/src/types.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 3.3 — Rich text inline

## Propósito

Definir el lenguaje inline tipado que reemplaza Markdown y HTML libre dentro de párrafos, listas, tablas y títulos.

## Alcance

Aplica a `inline.schema.json`, a cualquier `RichText` del catálogo y a resoluciones de términos, links y tooltips.

## Fuente de verdad

- `packages/content-catalog/schemas/inline.schema.json`
- `packages/content-catalog/schemas/shared.schema.json`
- `block-json-schema.md`

## Estructura

### Definición

`RichText` es un `array` no vacío de `InlineSpan` tipados. Cada span tiene shape cerrada con `additionalProperties: false`.

### Tipos inline permitidos

| Tipo | Requerido | Descripción |
|---|---|---|
| `text` | `type`, `text` | Texto plano |
| `strong` | `type`, `text` | Negrita |
| `emphasis` | `type`, `text` | Cursiva |
| `underline` | `type`, `text` | Subrayado |
| `highlight` | `type`, `text` | Resaltado; `tone?: yellow|green|blue|red` |
| `inlineCode` | `type`, `text` | Código inline |
| `inlineMath` | `type`, `latex` | Fórmula LaTeX inline |
| `link` | `type`, `text`, `target` | Enlace con `target: { kind, ref }` |
| `term` | `type`, `text`, `termRef` | Referencia a término del glosario; `display?: tooltip|highlight` |
| `tooltip` | `type`, `text`, `tooltip` | Tooltip explícito |
| `color` | `type`, `text`, `token` | Color semántico; `token: primary|success|warning|danger|muted` |

### Reglas de composición

- `richText` es un array no vacío de spans tipados.
- Cada span tiene shape cerrada con `additionalProperties: false`.
- La composición inline nunca mezcla contenido libre con HTML serializado.
- `inlineMath` usa LaTeX inline (fórmulas multilinea van en `equationBlock`).

### Reglas para referencias

- `link.target` usa `{ kind, ref }` neutral. `kind` puede ser: `module`, `chapter`, `section`, `block`, `term`, `resource`, `external`.
- `term.termRef` debe resolver a un `termId` existente en el módulo (o glosario global).
- `link.target.kind = external` permite rutas internas de app (que empiecen con `/`) o URLs HTTP(S).
- Links internos válidos: `module`, `chapter`, `section`, `block`, `term`, `resource`.
- Links externos deben empezar con `http://`, `https://` o `/`.

### Restricciones v1

- No se permite Markdown embebido dentro de `text`.
- No se permiten estilos arbitrarios fuera de `color.token` y `highlight.tone`.
- No se permiten tooltips implícitos a partir del DOM.
- No se permiten spans con `type` no definido en el schema.

### Prohibiciones explícitas

- **No HTML**: No se permite `<b>`, `<i>`, `<a>` u otras etiquetas HTML dentro de `RichText`.
- **No Markdown**: No se permite `**bold**`, `*italic*`, `` `code` `` dentro del texto de un span.
- **No clases CSS**: No se permite `className` o `style` en spans.

## Ejemplos

- Válido: `[{ "type": "text", "text": "Costo " }, { "type": "inlineMath", "latex": "T(n)" }]`
- Válido: `term` con `display: "tooltip"` y `termRef` válido.
- Válido: `link` a `{ "kind": "section", "ref": "sec-notaciones-y-comparacion" }`
- No válido: span `text` con `href`.
- No válido: `link` sin `target`.
- No válido: texto que contiene `**bold**` en un span de tipo `text`.
- No válido: `<b>texto</b>` dentro de `richText`.

## Limites conocidos

- v1 no soporta spans arbitrarios con clases CSS libres.
- Fórmulas multilinea deben ir en `equationBlock`, no en `inlineMath`.

## Archivos relacionados

- `block-json-schema.md`
- `course-json-schema.md`
- `content-validation.md`
- `content-model.md`
