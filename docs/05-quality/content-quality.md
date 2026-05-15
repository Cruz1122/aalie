# Calidad del contenido

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | evaluador
**Fuente de verdad:** `packages/content-catalog/src/validate.ts`, `packages/content-catalog/schemas/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** testing-strategy

## Propósito

Definir cómo se valida la calidad del catálogo de contenido académico: esquemas JSON, reglas de negocio, referencias cruzadas, cobertura de locale y rutas de recursos.

## Schema validation

5 esquemas JSON en `packages/content-catalog/schemas/`:

| Schema | URI | Valida |
|---|---|---|
| `shared.schema.json` | — | Tipos compartidos (RichText, TargetRef, etc.) |
| `inline.schema.json` | — | Elementos inline (links, términos, código) |
| `block.schema.json` | — | Bloques de contenido (heading, paragraph, list, table, code, mermaid, etc.) |
| `space.schema.json` | `https://aalie.dev/schemas/content/space.schema.json` | Documento `space.json` (metadatos del espacio) |
| `module.schema.json` | `https://aalie.dev/schemas/content/module.schema.json` | Documento `XX-slug.module.json` (contenido del módulo) |

Validación con **AJV 2020** (strict mode, `allErrors: true`, `addFormats`).

## Business rules validation

Archivo: `packages/content-catalog/src/validate.ts` (~1085 líneas)

### Estructurales (CONTENT_1xx)

| Código | Regla | Severidad |
|---|---|---|
| `CONTENT_101` | Directory spaceId != space.json spaceId | error |
| `CONTENT_102` | Directory locale != space.json locale | error |
| `CONTENT_103` | Module filename != `{order}-{slug}.module.json` | error |
| `CONTENT_104` | Module spaceId != bundle spaceId | error |
| `CONTENT_105` | Module locale != bundle locale | error |

### IDs y orden (CONTENT_2xx)

| Código | Regla | Severidad |
|---|---|---|
| `CONTENT_201` | Duplicado chapter order | error |
| `CONTENT_202` | Duplicado chapterId | error |
| `CONTENT_203` | Duplicado section order | error |
| `CONTENT_204` | Duplicado sectionId | error |
| `CONTENT_205` | Duplicado block id | error |
| `CONTENT_206` | Route collision (ruta duplicada entre módulos publicados) | error |
| `CONTENT_207` | relatedModuleId desconocido | error |
| `CONTENT_208` | Module progress computation error (published → error, draft → warning) | error/warning |
| `CONTENT_209` | Resource apunta a asset público inexistente | error |
| `CONTENT_210` | Prerequisite moduleId desconocido | error |
| `CONTENT_211` | Prerequisite sectionId desconocido | error |
| `CONTENT_212` | Section prerequisite moduleId desconocido | error |
| `CONTENT_213` | Section prerequisite sectionId desconocido | error |
| `CONTENT_214` | Block referencea término desconocido | error |
| `CONTENT_215` | Block referencea resource desconocido | error |
| `CONTENT_216` | Reference list referencea referencia desconocida | error |
| `CONTENT_217` | External target no empieza con `/` o `http(s)://` | error |
| `CONTENT_218` | Internal target no resoluble | error |
| `CONTENT_219` | Exercise referencea solution block inexistente | error |
| `CONTENT_220` | Route collision (ruta de espacio duplicada) | error |

### Semánticas de bloque (CONTENT_3xx)

| Código | Regla | Severidad |
|---|---|---|
| `CONTENT_301` | Bloque heading/paragraph/quote con contenido vacío | error |
| `CONTENT_302` | List item vacío | error |
| `CONTENT_303` | Exercise prompt vacío | error |
| `CONTENT_304` | Bloque code/algorithm con código vacío | error |
| `CONTENT_305` | Table row con número incorrecto de celdas | error |
| `CONTENT_306` | Cheatsheet item vacío | error |
| `CONTENT_307` | Latex step vacío | error |
| `CONTENT_308` | Mermaid block con código vacío | error |
| `CONTENT_309` | Recursion tree sin nodos | error |
| `CONTENT_310` | Graph sin nodes o edges | error |
| `CONTENT_311` | Course module contiene latexDiagram (debe usar Mermaid) | error |
| `CONTENT_312` | Course module usa engine=forest (debe convertir a Mermaid) | error |
| `CONTENT_313` | Mermaid + latexDiagram consecutivos duplicando árbol | error |

### Escala y SEO (CONTENT_4xx)

| Código | Regla | Severidad |
|---|---|---|
| `CONTENT_401` | Section con > 20 bloques (considerar dividir) | warning |
| `CONTENT_402` | Module sin searchMeta.aliases/keywords | warning |
| `CONTENT_403` | Module progress error en draft | warning |
| `CONTENT_404` | Locale faltante para módulo en espacio multilenguaje | warning |

### Términos (CONTENT_5xx)

| Código | Regla | Severidad |
|---|---|---|
| `CONTENT_501` | termId duplicado en el mismo módulo | error |
| `CONTENT_502` | primarySectionRef moduleId desconocido | error |
| `CONTENT_503` | primarySectionRef sectionId desconocido | error |
| `CONTENT_504` | Label o alias duplicado en el mismo módulo | error |

## Cross-reference validation

El validador recolecta tokens de referencia de todos los tipos de bloque y verifica:

- **Términos:** cada `termRef` debe existir en el bundle del espacio.
- **Recursos:** cada `resourceRef` (image, figure) debe existir en `module.resources`.
- **Referencias:** cada `referenceId` en referenceList debe existir como recurso en el bundle.
- **Links internos:** cada internal target (module/section/block) debe ser resoluble.
- **Links externos:** deben empezar con `/` o `http(s)://`.
- **Soluciones de ejercicios:** cada `solutionRef` debe apuntar a un bloque existente.

## Locale coverage

Si un espacio tiene múltiples bundles de locale (ej. `es` y `en`), el validador verifica que ambos tengan el mismo conjunto de `moduleId`s. Si un módulo existe en ES pero no en EN, se emite `CONTENT_404` (warning).

## Resource path validation

Los recursos con `source.kind === "publicPath"` se verifican contra el sistema de archivos: `apps/web/public/{path}` debe existir.

## Route collision detection

Dos tipos de colisión:

1. **Módulos publicados** con la misma ruta derivada (`CONTENT_206`).
2. **Espacios publicados** con la misma ruta localizada (`CONTENT_220`).

## Cómo ejecutar

No hay script dedicado en `package.json`. Ejecutar directamente:

```bash
# Usando tsx (desde la raíz del monorepo)
node --import tsx packages/content-catalog/src/validate.ts

# O via test suite del paquete
pnpm -C packages/content-catalog test
```

## Archivos relacionados

- `testing-strategy.md`
- `packages/content-catalog/schemas/`
- `packages/content-catalog/src/validate.ts`
