# Schema de módulos de contenido

## Propósito

Este documento describe el contrato real que hoy usamos para módulos del catálogo en `packages/content-catalog`.

Aplica tanto para `user-guide` como para `course`. La diferencia principal entre espacios suele ser `spaceId`, el `space.json` del espacio y los módulos concretos, no el shape base del módulo.

## Fuente de verdad

- Tipos runtime/editoriales: `packages/content-catalog/src/types.ts`
- Schemas JSON: `packages/content-catalog/schemas/`
- Catálogo real: `packages/content-catalog/catalog/spaces/<spaceId>/<locale>/`

## Ruta esperada

Un módulo vive en:

```txt
packages/content-catalog/catalog/spaces/<spaceId>/<locale>/modules/<nn>-<slug>.module.json
```

Ejemplo:

```txt
packages/content-catalog/catalog/spaces/course/es/modules/01-complejidad-temporal-espacial.module.json
```

## Contrato base del módulo

Campos principales:

```json
{
  "schema": "aalie.content.module",
  "schemaVersion": "1.0.0",
  "spaceId": "course",
  "moduleId": "mod-complejidad-temporal-espacial",
  "slug": "complejidad-temporal-espacial",
  "title": "Complejidad Temporal y Espacial",
  "order": 1,
  "locale": "es",
  "version": "1.0.0",
  "status": "draft",
  "summary": "Resumen visible del módulo",
  "difficulty": "foundational",
  "estimatedMinutes": 55,
  "tags": ["complejidad", "tiempo"],
  "searchMeta": {
    "aliases": ["complejidad temporal y espacial"],
    "keywords": ["T(n)", "modelo RAM"]
  },
  "prerequisites": {
    "modules": [],
    "sections": []
  },
  "relatedModuleIds": ["mod-loop-invariant"],
  "learningObjectives": [
    {
      "objectiveId": "comprender-recursos",
      "text": "Comprender qué recursos mide el análisis de algoritmos."
    }
  ],
  "quizRefs": [],
  "contentRefs": [],
  "resources": {
    "images": [],
    "figures": [],
    "references": []
  },
  "terms": [
    {
      "termId": "term-tn",
      "label": "T(n)",
      "definition": "Función de eficiencia temporal del algoritmo."
    }
  ],
  "chapters": []
}
```

## Restricciones importantes

- `schema` debe ser exactamente `aalie.content.module`.
- `schemaVersion` y `version` siguen formato semver: `x.y.z`.
- `moduleId`, `slug`, `chapterId`, `sectionId`, `objectiveId`, `termId`, `refId` usan slugs estables en minúsculas con guiones.
- `difficulty` solo acepta:
  - `foundational`
  - `basic`
  - `intermediate`
  - `advanced`
- `status` solo acepta:
  - `draft`
  - `published`
  - `archived`
- `kind` de sección solo acepta:
  - `overview`
  - `theory`
  - `example`
  - `practice`
  - `reference`
  - `troubleshooting`

## Estructura interna

Jerarquía:

```txt
module
  -> chapters[]
    -> sections[]
      -> blocks[]
```

### `chapters[]`

Cada capítulo usa:

```json
{
  "chapterId": "cap-complejidad-temporal-espacial",
  "slug": "complejidad-temporal-espacial",
  "title": "Complejidad Temporal y Espacial",
  "order": 1,
  "summary": "Resumen opcional",
  "sections": []
}
```

### `sections[]`

Cada sección usa:

```json
{
  "sectionId": "sec-introduccion-complejidad",
  "slug": "introduccion-complejidad",
  "title": "1. Complejidad Temporal y Espacial",
  "order": 1,
  "kind": "overview",
  "trackProgress": true,
  "estimatedMinutes": 3,
  "learningObjectives": [],
  "quizRefs": [],
  "contentRefs": [],
  "searchMeta": {},
  "prerequisites": {
    "modules": [],
    "sections": []
  },
  "blocks": []
}
```

## Formato correcto de `learningObjectives`

No se entregan como strings sueltos. Deben ser objetos:

```json
[
  {
    "objectiveId": "contar-oe",
    "text": "Contar operaciones elementales línea por línea."
  }
]
```

## Formato correcto de `prerequisites`

No es un arreglo plano. Debe ser un objeto con `modules` y/o `sections`.

```json
{
  "modules": [
    {
      "id": "mod-loop-invariant",
      "kind": "recommended"
    }
  ],
  "sections": [
    {
      "id": "sec-forma-general",
      "kind": "required"
    }
  ]
}
```

## Formato correcto de texto enriquecido

Los párrafos, listas, títulos de bloque y celdas de tabla usan `RichText`, no strings arbitrarios.

Texto simple:

```json
[
  {
    "type": "text",
    "text": "La complejidad temporal mide..."
  }
]
```

Texto con LaTeX inline:

```json
[
  { "type": "text", "text": "El resultado es " },
  { "type": "inlineMath", "latex": "T(n) = a n + b" },
  { "type": "text", "text": "." }
]
```

Tipos inline soportados:

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

## Bloques principales soportados

Bloques base:

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
- `latex`
- `equationBlock`
- `latexSteps`
- `mermaid`
- `recursionTree`
- `graph`
- `complexityTable`
- `formulaComparisonTable`
- `methodCard`
- `stepByStepMethod`
- `proofSteps`
- `warningTrap`
- `exampleSolved`
- `quizCheckpoint`
- `cheatsheet`
- `referenceList`
- `buttonRow`
- `divider`

## Tablas: shape real

Las tablas no usan objetos arbitrarios por fila. El shape válido es:

```json
{
  "type": "table",
  "title": "Casos frecuentes",
  "columns": [
    { "key": "caso", "label": "Caso" },
    { "key": "descripcion", "label": "Descripción" }
  ],
  "rows": [
    {
      "cells": [
        [{ "type": "text", "text": "Lineal" }],
        [{ "type": "inlineMath", "latex": "O(n)" }]
      ]
    }
  ]
}
```

## LaTeX: bloque vs inline

Usa `inlineMath` dentro de `content` o `cells` cuando la fórmula vive dentro de una frase.

Usa `equationBlock` o `latex` cuando la fórmula debe ir sola:

```json
{
  "id": "blk-formula",
  "type": "equationBlock",
  "latex": "T(n) = 5n^2 + 6n + 4"
}
```

Usa `latexSteps` cuando quieres una derivación paso a paso:

```json
{
  "id": "blk-derivacion",
  "type": "latexSteps",
  "steps": [
    {
      "stepId": "suma-costos",
      "title": "Suma de costos",
      "latex": "T(n) = 1 + 3(n+1)"
    }
  ]
}
```

## Errores frecuentes que ya vimos

- `difficulty: "introductory"`: inválido. Debe ser `foundational`.
- `learningObjectives` como `string[]`: inválido. Deben ser objetos.
- `prerequisites: []`: inválido. Debe ser objeto.
- `kind: "concept"` o `kind: "worked_example"`: inválido. Deben mapearse a `theory` o `example`.
- tablas con `rows` tipo objeto plano: inválido. Deben usar `cells`.
- fórmulas escritas como texto plano dentro de párrafos o celdas: no renderizan bien. Deben ir como `inlineMath`.

## Recomendación editorial

- Mantén una sección por idea principal.
- Si una sección supera muchas piezas de contenido, conviene partirla para evitar advertencias del validador.
- Todo `block.id`, `sectionId` y `chapterId` debe ser estable y reutilizable por quizzes y referencias.

## Validación

Comandos útiles:

```bash
pnpm -C packages/content-catalog validate
pnpm -C packages/content-catalog test
```
