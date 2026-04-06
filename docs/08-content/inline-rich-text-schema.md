# Schema JSON de rich text inline

**Tipo:** normativa

## Propósito

Definir el lenguaje inline tipado que reemplaza Markdown y HTML libre dentro de párrafos, listas, tablas y títulos.

## Alcance

Aplica a `inline.schema.json`, a cualquier `richText` del catálogo y a resoluciones de términos, links y tooltips.

## Fuente de verdad

- `packages/content-catalog/schemas/inline.schema.json`
- `packages/content-catalog/schemas/shared.schema.json`
- `block-json-schema.md`

## Estructura

### Tipos inline permitidos

- `text`
- `strong`
- `emphasis`
- `underline`
- `highlight`
- `inlineCode`
- `inlineMath`
- `link`
- `term`
- `tooltip`
- `color`

### Reglas de composición

- `richText` es un array no vacío de spans tipados;
- cada span tiene shape cerrada con `additionalProperties: false`;
- la composición inline nunca mezcla contenido libre con HTML serializado;
- `inlineMath` usa LaTeX inline;
- `tooltip` es texto explícito, no inferido por el renderer.

### Reglas para referencias

- `link.target` usa `{ kind, ref }` neutral;
- `term.termRef` debe resolver a un `termId` existente en el módulo;
- `link.target.kind = external` permite rutas internas de app o URLs HTTP(S);
- links internos válidos: `module`, `chapter`, `section`, `block`, `term`, `resource`.

### Restricciones v1

- no se permite Markdown embebido dentro de `text`;
- no se permiten estilos arbitrarios fuera de `color.token` y `highlight.tone`;
- no se permiten tooltips implícitos a partir del DOM.

## Ejemplos

- válido: `[{ "type": "text", "text": "Costo " }, { "type": "inlineMath", "latex": "T(n)" }]`
- válido: `term` con `display: "tooltip"` y `termRef` válido.
- válido: `link` a `{ "kind": "section", "ref": "sec-notaciones-y-comparacion" }`
- no válido: span `text` con `href`.
- no válido: `link` sin `target`.

## Limites conocidos

- v1 no soporta spans arbitrarios con clases CSS libres;
- fórmulas multilinea deben ir en `equationBlock`, no en `inlineMath`.

## Archivos relacionados

- `block-json-schema.md`
- `course-json-schema.md`
- `content-validation.md`
