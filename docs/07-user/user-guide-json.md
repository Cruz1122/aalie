# JSON de la Guía de usuario (content space `user-guide`)

**Tipo:** descriptiva

## Propósito

Inventariar y describir los archivos JSON del space `user-guide` (rutas, `moduleId`, slugs por locale) y su relación con los schemas del catálogo.

## Alcance

Este documento detalla **todos los JSON** que alimentan la Guía de usuario (“User Guide”) como *content space* dentro de `packages/content-catalog`.

## Fuente de verdad

- catálogo canónico: `packages/content-catalog/catalog/spaces/user-guide/<locale>/`
- schemas: `packages/content-catalog/schemas/` (`space.schema.json`, `module.schema.json`, `block.schema.json`, etc.)

## Estructura

### Alcance y ubicación

Los JSON viven en:

- `packages/content-catalog/catalog/spaces/user-guide/en/`
- `packages/content-catalog/catalog/spaces/user-guide/es/`

En total son **16 archivos**:

- **2** `space.json` (uno por locale)
- **14** módulos `*.module.json` (7 por locale)

## Contratos (schemas) relevantes

- **Content Space**: `packages/content-catalog/schemas/space.schema.json`
  - Campo `schema`: `aalie.content.space`
- **Content Module**: `packages/content-catalog/schemas/module.schema.json`
  - Campo `schema`: `aalie.content.module`

> Nota: estos JSON están pensados para ser consumidos como fuente de verdad para rutas, progreso, búsqueda y render, según el modelo de contenido del catálogo.

## Inventario (tabla resumen)

| Tipo | Locale | Ruta | `spaceId` / `moduleId` | `slug` | `title` | `order` |
|---|---|---|---|---|---|---:|
| space | en | `packages/content-catalog/catalog/spaces/user-guide/en/space.json` | `user-guide` | `user-guide` | User Guide | - |
| module | en | `packages/content-catalog/catalog/spaces/user-guide/en/modules/01-measuring-an-algorithm.module.json` | `mod-user-guide-measure` | `measuring-an-algorithm` | How an algorithm is measured | 1 |
| module | en | `packages/content-catalog/catalog/spaces/user-guide/en/modules/02-building-the-cost.module.json` | `mod-user-guide-building-cost` | `building-the-cost` | How cost is built | 2 |
| module | en | `packages/content-catalog/catalog/spaces/user-guide/en/modules/03-iterative-algorithms.module.json` | `mod-user-guide-iterative` | `iterative-algorithms` | Iterative algorithms | 3 |
| module | en | `packages/content-catalog/catalog/spaces/user-guide/en/modules/04-recursive-algorithms.module.json` | `mod-user-guide-recursive` | `recursive-algorithms` | Recursive algorithms | 4 |
| module | en | `packages/content-catalog/catalog/spaces/user-guide/en/modules/05-interpreting-results.module.json` | `mod-user-guide-interpreting` | `interpreting-results` | Interpreting results | 5 |
| module | en | `packages/content-catalog/catalog/spaces/user-guide/en/modules/06-loop-invariant.module.json` | `mod-user-guide-loop-invariant` | `loop-invariant` | Reasoning with a loop invariant | 6 |
| module | en | `packages/content-catalog/catalog/spaces/user-guide/en/modules/07-analysis-limits.module.json` | `mod-user-guide-analysis-limits` | `analysis-limits` | When analysis is not enough | 7 |
| space | es | `packages/content-catalog/catalog/spaces/user-guide/es/space.json` | `user-guide` | `user-guide` | Guía de usuario | - |
| module | es | `packages/content-catalog/catalog/spaces/user-guide/es/modules/01-como-se-mide-un-algoritmo.module.json` | `mod-user-guide-measure` | `como-se-mide-un-algoritmo` | Cómo se mide un algoritmo | 1 |
| module | es | `packages/content-catalog/catalog/spaces/user-guide/es/modules/02-como-se-construye-el-costo.module.json` | `mod-user-guide-building-cost` | `como-se-construye-el-costo` | Cómo se construye el costo | 2 |
| module | es | `packages/content-catalog/catalog/spaces/user-guide/es/modules/03-algoritmos-iterativos.module.json` | `mod-user-guide-iterative` | `algoritmos-iterativos` | Algoritmos iterativos | 3 |
| module | es | `packages/content-catalog/catalog/spaces/user-guide/es/modules/04-algoritmos-recursivos.module.json` | `mod-user-guide-recursive` | `algoritmos-recursivos` | Algoritmos recursivos | 4 |
| module | es | `packages/content-catalog/catalog/spaces/user-guide/es/modules/05-interpretar-resultados.module.json` | `mod-user-guide-interpreting` | `interpretar-resultados` | Interpretar resultados | 5 |
| module | es | `packages/content-catalog/catalog/spaces/user-guide/es/modules/06-invariante-de-bucle.module.json` | `mod-user-guide-loop-invariant` | `invariante-de-bucle` | Razonamiento con invariante de bucle | 6 |
| module | es | `packages/content-catalog/catalog/spaces/user-guide/es/modules/07-limites-del-analisis.module.json` | `mod-user-guide-analysis-limits` | `limites-del-analisis` | Cuándo el análisis no es suficiente | 7 |

## `space.json` (por locale)

### Propósito

Define la **configuración del espacio**: identidad, locale, opciones de búsqueda y progreso, y (opcionalmente) tema visual.

### Campos principales (contractuales)

- **`schema`**: constante `aalie.content.space`
- **`schemaVersion`**: versión semver del contrato
- **`spaceId`**: id del espacio (aquí: `user-guide`)
- **`slug`**: slug del espacio (aquí: `user-guide`)
- **`kind`**: `guide` (según el schema: `guide` \| `theory` \| `reference` \| `mixed`)
- **`title`**, **`description`**: texto visible para el usuario
- **`locale`**: `en` o `es`
- **`version`**, **`status`**: versionado editorial y estado de publicación
- **`search`**: banderas de indexación
  - `enabled`, `indexText`, `indexStructure`, `indexTerms`, `indexReferences`, `indexCaptions`
- **`progress`**: unidad de progreso del espacio
  - `unit`: `section`
  - `paginationUnit`: `section` (si se usa paginación por secciones)
- **`theme`** (opcional): configuración visual del espacio
  - `icon`, `accentColor` (hex)

### Archivos

- `packages/content-catalog/catalog/spaces/user-guide/en/space.json`
- `packages/content-catalog/catalog/spaces/user-guide/es/space.json`

## `*.module.json` (módulos por locale)

### Propósito

Cada módulo representa una unidad navegable de la guía, con:

- metadatos (título, orden, dificultad, tags)
- búsqueda (aliases/keywords)
- relaciones y prerequisitos (módulos/secciones)
- glosario de términos (`terms`)
- contenido jerárquico `chapters[] -> sections[] -> blocks[]`

### Campos principales (contractuales)

Metadatos del módulo:

- **`schema`**: constante `aalie.content.module`
- **`schemaVersion`**
- **`spaceId`**: `user-guide`
- **`moduleId`**: id estable (patrón `mod-...`)
- **`slug`**: slug por locale (se usa en rutas)
- **`title`**, `shortTitle`
- **`order`**: orden recomendado del módulo dentro del espacio
- **`locale`**, **`version`**, **`status`**
- `summary`, `difficulty`, `estimatedMinutes`, `tags`
- `searchMeta`: `aliases[]`, `keywords[]`

Dependencias y relaciones:

- `prerequisites`: `{ modules?: prerequisiteRef[], sections?: prerequisiteRef[] }`
- `relatedModuleIds`: lista de `moduleId` relacionados

Pedagogía y glosario:

- `learningObjectives[]`: objetivos con `objectiveId` y `text`
- `terms[]`: términos con `termId`, `label`, `aliases[]`, `definition`

Contenido:

- **`chapters[]`** (mínimo 1)
  - `chapterId`, `slug`, `title`, `order`, `summary?`
  - `sections[]` (mínimo 1)
    - `sectionId`, `slug`, `title`, `order`
    - `kind` (p. ej. `overview`, `reference`, `theory`, `example`, `troubleshooting`)
    - `trackProgress` (boolean)
    - `estimatedMinutes?`
    - `searchMeta?`, `prerequisites?`, `learningObjectives?`
    - `blocks[]` (mínimo 1): bloques renderizables (p. ej. `paragraph`, `heading`, `list`, `note`, `callout`, `evidenceBlock`, `algorithm`, `buttonRow`, etc.)

## Fichas por archivo (qué contiene cada JSON)

### EN / ES (mismo `moduleId`, `slug` localizado)

- **`01` — Medición (`mod-user-guide-measure`)**: eficiencia, operaciones, crecimiento con n; sintaxis mínima integrada.
- **`02` — Costo (`mod-user-guide-building-cost`)**: suma de costos, control de flujo, cabecera/cuerpo; mensaje “no basta citar O(·) sin justificar”.
- **`03` — Iterativos (`mod-user-guide-iterative`)**: patrones de bucles, anidados, WHILE y límites heurísticos (módulo piloto ampliado).
- **`04` — Recursivos (`mod-user-guide-recursive`)**: recurrencias, árbol de llamadas, profundidad.
- **`05` — Interpretación (`mod-user-guide-interpreting`)**: O/Ω/Θ, comparación, orden de magnitudes; CPU/GPU como puente teoría–práctica.
- **`06` — Invariante (`mod-user-guide-loop-invariant`)**: invariante como apoyo pedagógico, no prueba formal.
- **`07` — Límites (`mod-user-guide-analysis-limits`)**: resultados parciales, advertencias, cuándo no confiar ciegamente.

Los `space.json` por locale conservan `kind: guide`, búsqueda y progreso por sección; la descripción del espacio resume el enfoque AyD + AALIE.

## Convenciones prácticas que se ven en estos JSON

- **Identificadores**:
  - `moduleId` es estable entre locales (p. ej. `mod-user-guide-measure`), pero `slug` cambia por idioma.
  - `chapterId`/`sectionId` son estables y se referencian desde links y prerequisites.
- **Enlaces internos**: en `blocks`, el tipo `link` usa `target.kind` (`module`, `section`, `external`) y `target.ref` (id o ruta).
- **Progreso**: `trackProgress: true` en secciones que cuentan para completitud.
- **Búsqueda**: `searchMeta` aparece a nivel módulo y sección; `space.json` habilita qué se indexa globalmente.

## Ejemplos

- `pnpm run validate:content-catalog` en la raíz del monorepo valida schemas y reglas semánticas sobre el catálogo.
- Un módulo publicado con `order: 3` y slug `algoritmos-iterativos` se expone en `/${locale}/user-guide/algoritmos-iterativos`.

## Límites conocidos

- el contenido editorial puede superar el umbral de advertencia por número de bloques por sección; conviene dividir secciones largas.
- `backendAsset` en recursos gráficos sin resolver en web sigue mostrándose como placeholder.

## Archivos relacionados

- `../08-content/content-model.md`
- `../08-content/course-json-schema.md`
- `../08-content/content-validation.md`
- `user-guide.md`

