# Validación de contenido

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `packages/content-catalog/src/validate.ts`, `packages/content-catalog/schemas/`, `course-json-schema.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 3.4 — Validación de contenido

## Propósito

Definir la validación obligatoria previa al render del catálogo para detectar errores estructurales y semánticos antes de que lleguen a la UI.

## Alcance

Aplica al script `packages/content-catalog/scripts/validate-content-catalog.ts`, a los checks de CI y al authoring local.

## Fuente de verdad

- `packages/content-catalog/src/validate.ts`
- `packages/content-catalog/schemas/`
- `course-json-schema.md`

## Estructura

### Capas de validación

La validación se ejecuta en 10 capas secuenciales:

1. **Schema validation** (AJV contra JSON Schema)
2. **Directory structure validation**
3. **Section order validation**
4. **Block semantics validation**
5. **Cross-reference validation**
6. **Term validation**
7. **Diagram contract validation**
8. **Locale coverage validation**
9. **Route collision detection**
10. **Resource path validation**

### 1. Schema validation (CONTENT_001)

Valida cada `space.json` y `*.module.json` contra sus respectivos JSON Schemas usando Ajv 2020 con `strict: true`.

- Espacio validado contra `space.schema.json`
- Módulo validado contra `module.schema.json`
- La validación de schema incluye los subschemas de bloque e inline

**Código**: `CONTENT_001`
**Severidad**: error
**Condición**: Cualquier error de schema (campo faltante, tipo incorrecto, patrón no coincidente)

### 2. Directory structure validation (CONTENT_101–105)

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_101` | Directorio padre no coincide con `space.json.spaceId` | error |
| `CONTENT_102` | Directorio locale no coincide con `space.json.locale` | error |
| `CONTENT_103` | Nombre de archivo no sigue `<NN>-<slug>.module.json` | error |
| `CONTENT_104` | `module.spaceId` no coincide con `space.spaceId` | error |
| `CONTENT_105` | `module.locale` no coincide con `space.locale` | error |

### 3. Section order validation (CONTENT_201–205)

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_201` | Orden de capítulo duplicado | error |
| `CONTENT_202` | `chapterId` duplicado | error |
| `CONTENT_203` | Orden de sección duplicado dentro del capítulo | error |
| `CONTENT_204` | `sectionId` duplicado en el módulo | error |
| `CONTENT_205` | `block.id` duplicado en el módulo | error |

### 4. Block semantics validation (CONTENT_301–310)

Valida reglas semánticas específicas por tipo de bloque:

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_301` | Bloque heading/paragraph/quote con `content` vacío | error |
| `CONTENT_302` | Lista con item de contenido vacío | error |
| `CONTENT_303` | Exercise con `prompt` vacío | error |
| `CONTENT_304` | Algorithm/code con `code` vacío | error |
| `CONTENT_305` | Table/fila con número incorrecto de celdas | error |
| `CONTENT_306` | Cheatsheet con item vacío (label o value) | error |
| `CONTENT_307` | LatexSteps con paso vacío | error |
| `CONTENT_308` | Mermaid con `code` vacío | error |
| `CONTENT_309` | RecursionTree sin nodos | error |
| `CONTENT_310` | Graph sin nodos o sin aristas | error |

### 5. Cross-reference validation (CONTENT_207–219)

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_207` | `relatedModuleId` no existe en el bundle | error |
| `CONTENT_208` | Módulo publicado sin secciones trackeables | error |
| `CONTENT_209` | Resource con `publicPath` que no existe en `apps/web/public/` | error |
| `CONTENT_210` | Prerrequisito de módulo no existe | error |
| `CONTENT_211` | Prerrequisito de sección no existe | error |
| `CONTENT_212` | Prerrequisito de sección (módulo) no existe | error |
| `CONTENT_213` | Prerrequisito de sección (sección) no existe | error |
| `CONTENT_214` | `termRef` no resuelve a ningún término | error |
| `CONTENT_215` | `resourceRef` no resuelve a ningún recurso | error |
| `CONTENT_216` | ReferenceList referencia resourceId inexistente | error |
| `CONTENT_217` | Enlace externo no empieza con `/` o `http(s)://` | error |
| `CONTENT_218` | Target interno (módulo/capítulo/sección/bloque/término/recurso) no resuelve | error |
| `CONTENT_219` | `solutionRef` de ejercicio no resuelve a bloque existente | error |

### 6. Term validation (CONTENT_501–504)

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_501` | `termId` duplicado en el módulo | error |
| `CONTENT_502` | `primarySectionRef.moduleId` no existe | error |
| `CONTENT_503` | `primarySectionRef.sectionId` no existe en el módulo | error |
| `CONTENT_504` | Label o alias duplicado (case-insensitive) | error |

### 7. Diagram contract validation (CONTENT_311–313)

Solo aplica a `spaceId = "course"`:

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_311` | Bloque `latexDiagram` presente en course | error |
| `CONTENT_312` | `engine: "forest"` presente en course | error |
| `CONTENT_313` | Misma representación duplicada como Mermaid + latexDiagram consecutivos | error |

### 8. Locale coverage validation (CONTENT_404)

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_404` | Módulo presente en un locale pero ausente en otro | warning |

### 9. Route collision detection (CONTENT_206, CONTENT_220)

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_206` | Ruta de módulo duplicada (mismo slug en módulos publicados) | error |
| `CONTENT_220` | Ruta de espacio duplicada (mismo slug en espacios publicados) | error |

### 10. Resource path validation (CONTENT_209)

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_209` | Recurso con `source.kind = "publicPath"` que no existe en disco | error |

### Scale warnings (CONTENT_401–403)

| Código | Condición | Severidad |
|---|---|---|
| `CONTENT_401` | Sección con más de 20 bloques | warning |
| `CONTENT_402` | Módulo sin `searchMeta.aliases` ni `searchMeta.keywords` | warning |
| `CONTENT_403` | Módulo draft sin progreso computable (0 secciones trackeables) | warning |

## Reglas semánticas obligatorias

- Unicidad de `moduleId` y `slug` por `spaceId + locale`.
- Unicidad de `chapterId`, `sectionId` y `block.id` dentro del módulo.
- Consistencia entre `space.json`, `*.module.json` y la ruta física.
- `resourceRef`, `termRef`, `solutionRef` y `target.ref` deben resolver.
- Módulos publicados deben tener al menos una sección trackeable.
- `publicPath` debe existir en `apps/web/public/`.

## Pipeline de validación

```text
discoverSpaces() → buildSchemaValidator()
  → for each bundle:
       validateSpace(schema)          → CONTENT_001
       validateSchemaDocuments()      → CONTENT_101-105
       validateReferences()           → CONTENT_201-220, 301-313, 401-403, 501-504
  → validateLocaleCoverage()          → CONTENT_404
  → return { valid, errors, warnings }
```

## Ejemplos

- Válido: agregar un módulo nuevo con filename `02-nuevo-modulo.module.json` y `order: 2`.
- No válido: `buttonRow` apuntando a `section` inexistente.
- No válido: `table` con 2 columnas y una fila de 3 celdas.
- No válido: bloque `heading` con `content` array vacío.
- No válido: curso con bloque `latexDiagram`.
- No válido: módulo con nombre de archivo `mi-modulo.module.json` (falta orden de 2 dígitos).

## Limites conocidos

- La validación no compara equivalencia semántica exacta entre textos de distintos locales.
- `backendAsset` se valida por presencia contractual, no por existencia remota.

## Archivos relacionados

- `course-json-schema.md`
- `authoring-guide.md`
- `search-indexing.md`
- `content-model.md`
- `block-json-schema.md`
