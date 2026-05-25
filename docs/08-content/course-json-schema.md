# Schema JSON de curso

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | autor-contenido
**Fuente de verdad:** `packages/content-catalog/schemas/space.schema.json`, `packages/content-catalog/schemas/module.schema.json`, `content-model.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 3.1 — Schema de módulo

## Propósito

Documentar el contrato normativo del sistema de contenido unificado. El nombre histórico del archivo se conserva por compatibilidad, pero el vocabulario oficial ahora es `space` y `module`.

## Alcance

Aplica a los JSON de `space.json`, `*.module.json`, metadata pedagógica, referencias internas y convenciones de versionado.

## Fuente de verdad

- `packages/content-catalog/schemas/space.schema.json`
- `packages/content-catalog/schemas/module.schema.json`
- `content-model.md`

## Estructura

### Schemas físicos

| Schema | Archivo | Propósito |
|---|---|---|
| shared | `shared.schema.json` | Defs comunes: IDs, slugs, estados, dificultad, targetRef, prerequisitos, resources, terms |
| inline | `inline.schema.json` | Spans inline tipados (text, strong, link, term, formula, etc.) |
| block | `block.schema.json` | Bloques renderizables (heading, paragraph, code, table, image, etc.) |
| space | `space.schema.json` | Metadata de un espacio descubrible (search config, progress config, theme) |
| module | `module.schema.json` | Metadata y contenido de un módulo (chapters, sections, blocks, terms, resources) |

### Campos requeridos de `space.json`

| Campo | Tipo | Descripción |
|---|---|---|
| `schema` | `"aalie.content.space"` | Identificador del schema |
| `schemaVersion` | semver | Versión del contrato |
| `spaceId` | kebab-case | ID único del espacio |
| `slug` | kebab-case | Slug para ruta URL |
| `kind` | `guide | theory | reference | mixed` | Tipo de espacio |
| `title` | string | Título humano |
| `locale` | `xx` o `xx-XX` | Código de locale |
| `version` | semver | Versión editorial |
| `status` | `draft | published | archived` | Estado editorial |
| `search` | objeto | Config de búsqueda (enabled, indexText, indexStructure, etc.) |
| `progress` | objeto | Config de progreso (unit: "section") |

### Campos requeridos de `*.module.json`

| Campo | Tipo | Descripción |
|---|---|---|
| `schema` | `"aalie.content.module"` | Identificador del schema |
| `schemaVersion` | semver | Versión del contrato |
| `spaceId` | kebab-case | Debe coincidir con el directorio contenedor |
| `moduleId` | `mod-*` | ID único del módulo |
| `slug` | kebab-case | Slug para ruta URL |
| `title` | string | Título humano |
| `order` | int >= 1 | Orden dentro del espacio |
| `locale` | `xx` o `xx-XX` | Debe coincidir con el directorio locale |
| `version` | semver | Versión editorial |
| `status` | `draft | published | archived` | Estado editorial |
| `chapters` | array | Contenido del módulo (mínimo 1) |

### Campos requeridos por jerarquía

| Nivel | Campos requeridos |
|---|---|
| chapter | `chapterId`, `slug`, `title`, `order`, `sections[]` |
| section | `sectionId`, `slug`, `title`, `order`, `kind`, `trackProgress`, `blocks[]` |
| block | `id`, `type` + payload específico del tipo (ver block-json-schema.md) |

### Metadata opcional soportada

| Campo | Nivel | Descripción |
|---|---|---|
| `summary` | module/chapter | Resumen textual |
| `shortTitle` | module | Título abreviado para navegación |
| `difficulty` | module | `foundational | basic | intermediate | advanced` |
| `estimatedMinutes` | module/section | Tiempo estimado de lectura |
| `tags` | module | Etiquetas de categorización |
| `searchMeta` | module/section | `aliases[]` y `keywords[]` para búsqueda |
| `prerequisites` | module/section | Módulos/secciones requeridos o recomendados |
| `relatedModuleIds` | module | Módulos relacionados |
| `learningObjectives` | module/section | Objetivos pedagógicos |
| `resources` | module | Imágenes, figuras y referencias |
| `terms` | module | Glosario de términos del módulo |
| `quizRefs` | module/section | Referencias a quizzes |
| `contentRefs` | module/section | Referencias a contenido externo |

### Convenciones de identificación

| Entidad | Prefijo | Patrón regex |
|---|---|---|
| moduleId | `mod-` | `^mod-[a-z0-9]+(?:-[a-z0-9]+)*$` |
| chapterId | `cap-` | `^cap-[a-z0-9]+(?:-[a-z0-9]+)*$` |
| sectionId | `sec-` | `^sec-[a-z0-9]+(?:-[a-z0-9]+)*$` |
| block.id | `blk-` | `^blk-[a-z0-9]+(?:-[a-z0-9]+)*$` |
| termId | `term-` | `^term-[a-z0-9]+(?:-[a-z0-9]+)*$` |
| resourceId | kebab | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |

### Convenciones de nombres de archivo

```
<order-2digitos>-<slug>.module.json
```

Ejemplo: `01-complejidad-temporal-y-espacial.module.json`

### Convenciones de rutas y descubrimiento

- Espacios: `catalog/spaces/*/*/space.json`
- Módulos: `catalog/spaces/<spaceId>/<locale>/modules/*.module.json`
- Ruta de espacio: `/${space.slug}`
- Ruta de módulo: `/${space.slug}/${module.slug}`
- Orden: por `order`; `previous` y `next` se derivan, no se configuran

### Compatibilidad y versionado

- `schemaVersion` y `version` siguen semver.
- Cambio incompatible: exige subir versión, actualizar docs y ajustar validación.
- Agregar campos opcionales compatibles no rompe versiones anteriores.
- Un cambio de significado sin cambio de shape sigue exigiendo actualización documental.

### Validaciones obligatorias antes de render

- Validación JSON Schema con Ajv contra los 5 schemas.
- Validación semántica de referencias, unicidad, orden, rutas y progreso.
- Rechazo de JSON incompleto, inconsistente o mal formado.

## Ejemplos

- Válido: `packages/content-catalog/catalog/spaces/course/es/modules/01-complejidad-temporal-y-espacial.module.json`
- Válido: `packages/content-catalog/catalog/spaces/user-guide/es/modules/01-guia-de-uso.module.json`
- No válido: módulo con `spaceId` distinto al directorio que lo contiene.
- No válido: `section` sin `kind` o sin `trackProgress`.
- No válido: nombre de archivo que no sigue `<order>-<slug>.module.json`.

## Limites conocidos

- El archivo mantiene nombre legado aunque ya no describe un único "curso" monolítico.
- La compatibilidad entre locales se valida por presencia de módulos, no por traducción frase a frase.

## Archivos relacionados

- `content-model.md`
- `content-validation.md`
- `authoring-guide.md`
- `block-json-schema.md`
- `inline-rich-text-schema.md`
- `quiz-json-schema.md`
