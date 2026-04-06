# Schema JSON de curso

**Tipo:** normativa

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

- `shared.schema.json`: defs comunes de IDs, estado, dificultad, prerequisitos, resources y terms.
- `inline.schema.json`: spans inline tipados.
- `block.schema.json`: bloques renderizables.
- `space.schema.json`: metadata de un espacio descubrible.
- `module.schema.json`: metadata y contenido de un módulo.

### Campos requeridos de `space.json`

- `schema`
- `schemaVersion`
- `spaceId`
- `slug`
- `kind`
- `title`
- `locale`
- `version`
- `status`
- `search`
- `progress`

### Campos requeridos de `*.module.json`

- `schema`
- `schemaVersion`
- `spaceId`
- `moduleId`
- `slug`
- `title`
- `order`
- `locale`
- `version`
- `status`
- `chapters`

### Campos requeridos por jerarquía

- `chapter`: `chapterId`, `slug`, `title`, `order`, `sections`
- `section`: `sectionId`, `slug`, `title`, `order`, `kind`, `trackProgress`, `blocks`
- `block`: `id`, `type` y el payload requerido por `block.type`

### Metadata opcional soportada

- `summary`
- `shortTitle`
- `difficulty`
- `estimatedMinutes`
- `tags`
- `searchMeta`
- `prerequisites`
- `relatedModuleIds`
- `learningObjectives`
- `resources`
- `terms`

### Convenciones de nombres

- `spaceId` y `slug`: `kebab-case`
- `moduleId`: prefijo `mod-`
- `chapterId`: prefijo `cap-`
- `sectionId`: prefijo `sec-`
- `block.id`: prefijo `blk-`
- el nombre de archivo del módulo es obligatorio: `<order-con-2-digitos>-<slug>.module.json`

### Convenciones de rutas y descubrimiento

- espacios: `catalog/spaces/*/*/space.json`
- módulos: `catalog/spaces/<spaceId>/<locale>/modules/*.module.json`
- ruta de espacio: `/${space.slug}`
- ruta de módulo: `/${space.slug}/${module.slug}`
- orden: por `order`; `previous` y `next` se derivan, no se configuran

### Compatibilidad y versionado

- `schemaVersion` y `version` siguen semver.
- cambio incompatible: exige subir versión, actualizar docs y ajustar validación.
- agregar campos opcionales compatibles no rompe versiones anteriores.
- un cambio de significado sin cambio de shape sigue exigiendo actualización documental.

### Validaciones obligatorias antes de render

- validación JSON Schema con Ajv contra los 5 schemas;
- validación semántica de referencias, unicidad, orden, rutas y progreso;
- rechazo de JSON incompleto, inconsistente o mal formado.

## Ejemplos

- válido: `packages/content-catalog/catalog/spaces/theory/es/modules/01-complejidad-temporal-y-espacial.module.json`
- válido: `packages/content-catalog/catalog/spaces/user-guide/es/modules/01-guia-de-uso.module.json`
- no válido: módulo con `spaceId` distinto al directorio que lo contiene.
- no válido: `section` sin `kind` o sin `trackProgress`.

## Limites conocidos

- el archivo mantiene nombre legado aunque ya no describe un único “curso” monolítico;
- la compatibilidad entre locales se valida por presencia de módulos, no por traducción frase a frase.

## Archivos relacionados

- `content-model.md`
- `content-validation.md`
- `authoring-guide.md`
