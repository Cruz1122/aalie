# Especificación de módulos de contenido

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `packages/content-catalog/` (src/types.ts, src/validate.ts, src/discover.ts, src/load.ts, src/search.ts, src/progress.ts, src/terms.ts, schemas/), `packages/content-catalog/catalog/spaces/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 8 — Catálogo de contenido

## Propósito

Definir el contrato operativo que conecta el catálogo de contenido con el renderer, la validación automática, la búsqueda y el progreso del estudiante.

## Alcance

Aplica a espacios, módulos, capítulos, secciones, bloques, referencias internas, términos, búsqueda, progreso y todas las validaciones (schema, semántica, referencias cruzadas, cobertura de locales, rutas de recursos).

## Fuente de verdad

- `packages/content-catalog/schemas/` — JSON Schemas (5 archivos)
- `packages/content-catalog/src/types.ts` — tipos TypeScript
- `packages/content-catalog/src/validate.ts` — validación completa
- `packages/content-catalog/src/discover.ts` — descubrimiento de espacios
- `packages/content-catalog/src/load.ts` — carga de módulos
- `packages/content-catalog/src/search.ts` — índices de búsqueda
- `packages/content-catalog/src/progress.ts` — progreso por sección
- `packages/content-catalog/catalog/spaces/` — contenido fuente en JSON

## Estructura

### Entidades contractuales

```
space → module → chapter → section → block
```

- **space** (`space.json`): define un espacio de contenido (course, user-guide). Contiene metadatos, configuración de búsqueda, progreso y tema visual.
- **module** (`*.module.json`): unidad pedagógica atómica. Contiene capítulos, términos, recursos y metadatos.
- **chapter**: agrupación de secciones dentro de un módulo.
- **section**: unidad de progreso. Contiene bloques de contenido renderizable.
- **block**: unidad mínima de contenido. Cada bloque tiene un `type` y estructura específica según su tipo.

## Espacios de contenido

### course
- 20 módulos por locale (es, en)
- Contenido: análisis de algoritmos completo
- Temas: notación asintótica, análisis iterativo, análisis recursivo, teorema maestro, árbol de recursión, ecuación característica, método de sustitución, programación dinámica, algoritmos greedy, backtracking, branch and bound, etc.
- Dificultad: foundational → advanced

### user-guide
- 7 módulos por locale (es, en)
- Contenido: guía de uso de AALIE
- Temas: cómo medir un algoritmo, costo por línea, algoritmos iterativos, algoritmos recursivos, interpretación de resultados, invariante de bucle, límites del análisis
- Enfoque pedagógico: "escribir → validar → analizar → interpretar" (no expone pipeline interno)

## Locales

- `es` (español): contenido completo para course (20 módulos) y user-guide (7 módulos)
- `en` (inglés): contenido completo para course (20 módulos) y user-guide (7 módulos)
- Archivos separados por locale en `catalog/spaces/{spaceId}/{locale}/`
- La validación de cobertura (`validateLocaleCoverage`) verifica que todos los módulos existan en todos los locales

## Tipos de bloque

### Bloques de texto y estructura

| Tipo | Descripción | Campos clave |
|---|---|---|
| `heading` | Encabezado de sección (nivel 2-4) | `level`, `content: RichText` |
| `paragraph` | Párrafo | `content: RichText` |
| `list` | Lista ordenada/desordenada | `style`, `items: ListItem[]` |
| `quote` | Cita | `content: RichText`, `attribution` |
| `divider` | Separador visual | — |

### Bloques pedagógicos

| Tipo | Descripción | Campos clave |
|---|---|---|
| `note` | Nota informativa con variante | `variant: info/warning/success/danger`, `blocks` |
| `callout` | Llamado destacado | `title`, `blocks` |
| `definition` | Definición formal | `title`, `blocks` |
| `theorem` | Teorema | `title`, `blocks` |
| `proof` | Demostración | `title`, `blocks` |
| `example` | Ejemplo | `title`, `blocks` |
| `evidenceBlock` | Bloque de evidencia pedagógica | `variant`, `icon`, `blocks` |
| `exercise` | Ejercicio | `prompt: RichText`, `difficulty`, `solutionRef` |
| `exerciseSolution` | Solución de ejercicio | `blocks` |
| `warningTrap` | Trampa conceptual | `title`, `misconception`, `whyItFails`, `fix` |
| `exampleSolved` | Ejemplo resuelto paso a paso | `title`, `problem`, `steps`, `answer` |
| `methodCard` | Tarjeta de método | `title`, `summary`, `whenToUse`, `steps`, `pitfalls` |
| `stepByStepMethod` | Método paso a paso | `title`, `steps` |
| `proofSteps` | Prueba paso a paso | `title`, `steps` |
| `cheatsheet` | Hoja de referencia rápida | `items` |
| `quizCheckpoint` | Punto de control con quiz | `quizId`, `prompt` |

### Bloques de código y diagramas

| Tipo | Descripción |
|---|---|
| `algorithm` | Bloque de pseudocódigo (lenguaje `pseudocode`) |
| `code` | Bloque de código genérico (lenguaje configurable) |
| `mermaid` | Diagrama Mermaid |
| `recursionTree` | Árbol de recursión (nodos/aristas) |
| `graph` | Grafo dirigido (nodos/aristas) |
| `image` / `figure` | Imagen o figura (referencia a recurso) |

### Bloques matemáticos

| Tipo | Descripción |
|---|---|
| `latex` | Expresión LaTeX simple |
| `equationBlock` | Ecuación LaTeX con formato |
| `latexSteps` | Pasos LaTeX (múltiples ecuaciones) |
| `complexityTable` | Tabla de complejidad |
| `formulaComparisonTable` | Tabla comparativa de fórmulas |

### Bloques de tabla y navegación

| Tipo | Descripción |
|---|---|
| `table` | Tabla genérica |
| `buttonRow` | Botones de navegación |
| `referenceList` | Lista de referencias bibliográficas |

## RichText (contenido en línea)

El contenido en línea usa un sistema de spans tipados. No se permite HTML plano ni Markdown en bloques de texto. Los tipos de span son:

| Tipo | Descripción | Campos |
|---|---|---|
| `text` | Texto plano | `text: string` |
| `strong` | Negrita | `text: string` |
| `emphasis` | Cursiva | `text: string` |
| `underline` | Subrayado | `text: string` |
| `highlight` | Resaltado con color | `text`, `tone` (yellow/green/blue/red) |
| `inlineCode` | Código en línea | `text: string` |
| `inlineMath` | Fórmula LaTeX en línea | `latex: string` |
| `link` | Enlace a target interno/externo | `text`, `target: TargetRef` |
| `term` | Referencia a término del glosario | `text`, `termRef`, `display` |
| `tooltip` | Tooltip | `text`, `tooltip` |
| `color` | Texto coloreado | `text`, `token` |

## JSON Schema validation

5 schemas en `packages/content-catalog/schemas/`:

| Schema | Archivo | Propósito |
|---|---|---|
| `shared.schema.json` | `shared.schema.json` | Definiciones compartidas: nonEmptyString, idSlug, semver, locale, difficulty, status, targetRef, searchMeta, prerequisiteRef, resourceSource, imageResource, referenceResource, term |
| `inline.schema.json` | `inline.schema.json` | Spans de RichText (text, strong, emphasis, underline, highlight, inlineCode, inlineMath, link, term, tooltip, color) + definición de `richText` como array de spans |
| `block.schema.json` | `block.schema.json` | Todos los tipos de bloque con sus propiedades específicas |
| `space.schema.json` | `space.schema.json` | Schema del archivo `space.json` (metadatos del espacio) |
| `module.schema.json` | `module.schema.json` | Schema del archivo `*.module.json` (módulo completo con capítulos, secciones, bloques) |

### Validación con AJV

```typescript
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(sharedSchema);
ajv.addSchema(inlineSchema);
ajv.addSchema(blockSchema);
ajv.addSchema(spaceSchema);
ajv.addSchema(moduleSchema);

validateSpace = ajv.getSchema("https://aalie.dev/schemas/content/space.schema.json");
validateModule = ajv.getSchema("https://aalie.dev/schemas/content/module.schema.json");
```

## Validación de referencias (`validate.ts`)

### Validación estructural (CONTENT_1xx)
- `CONTENT_101`: directorio spaceId no coincide con space.json
- `CONTENT_102`: directorio locale no coincide con space.json
- `CONTENT_103`: nombre de archivo del módulo no sigue el formato `{order}-{slug}.module.json`
- `CONTENT_104`: module.spaceId no coincide con bundle.space.spaceId
- `CONTENT_105`: module.locale no coincide con bundle.space.locale

### Validación de IDs y órdenes (CONTENT_2xx)
- `CONTENT_201`: orden de capítulo duplicado
- `CONTENT_202`: chapterId duplicado
- `CONTENT_203`: orden de sección duplicado dentro de capítulo
- `CONTENT_204`: sectionId duplicado en el módulo
- `CONTENT_205`: block id duplicado en el módulo
- `CONTENT_206`: colisión de rutas entre módulos publicados
- `CONTENT_207`: relatedModuleId no existe
- `CONTENT_208`: progreso no computable (módulo sin secciones trackeables)
- `CONTENT_209`: recurso público no existe en `apps/web/public/`
- `CONTENT_210`: módulo prerrequisito no existe
- `CONTENT_211`: sección prerrequisito no existe
- `CONTENT_212`: prerrequisito de módulo en sección no existe
- `CONTENT_213`: prerrequisito de sección en sección no existe
- `CONTENT_214`: referencia a término inexistente
- `CONTENT_215`: referencia a recurso inexistente
- `CONTENT_216`: referencia en referenceList a resource inexistente
- `CONTENT_217`: external target no empieza con `/` o `http(s)://`
- `CONTENT_218`: internal target (module/chapter/section/term/resource) no resoluble
- `CONTENT_219`: solutionRef de ejercicio no resoluble
- `CONTENT_220`: colisión de rutas de espacio publicadas

### Validación semántica de bloques (CONTENT_3xx)
- `CONTENT_301`: bloque heading/paragraph/quote con RichText vacío
- `CONTENT_302`: lista con item vacío
- `CONTENT_303`: ejercicio con prompt vacío
- `CONTENT_304`: bloque code/algorithm vacío
- `CONTENT_305`: tabla con número incorrecto de celdas
- `CONTENT_306`: cheatsheet con item vacío
- `CONTENT_307`: latexSteps con paso vacío
- `CONTENT_308`: mermaid con código vacío
- `CONTENT_309`: recursionTree sin nodos
- `CONTENT_310`: graph sin nodos o aristas
- `CONTENT_311`: course no permite `latexDiagram`
- `CONTENT_312`: course no permite `engine=forest`
- `CONTENT_313`: duplicación de árbol (Mermaid + latexDiagram consecutivos)

### Validación de escala y metadatos (CONTENT_4xx)
- `CONTENT_401`: sección con >20 bloques (warning: considerar dividir)
- `CONTENT_402`: módulo sin searchMeta aliases/keywords (warning)
- `CONTENT_403`: progreso no computable en módulo no publicado (warning)
- `CONTENT_404`: espacio sin cobertura completa de locales (warning)

### Validación de términos (CONTENT_5xx)
- `CONTENT_501`: termId duplicado en módulo
- `CONTENT_502`: primarySectionRef refiere a módulo inexistente
- `CONTENT_503`: primarySectionRef refiere a sección inexistente
- `CONTENT_504`: label o alias duplicado entre términos del módulo

## Búsqueda

### Configuración por espacio
Cada espacio define en `space.json`:
```json
{
  "search": {
    "enabled": true,
    "indexText": true,
    "indexStructure": true,
    "indexTerms": true,
    "indexReferences": true,
    "indexCaptions": true
  }
}
```

### Índice de búsqueda (`search.ts`)
- `buildModuleSearchIndex()` produce `SearchIndexEntry[]` por módulo
- Entradas a nivel módulo y sección
- Texto indexado: títulos, resúmenes, términos, referencias, captions de medios
- Metadatos: aliases, keywords, tags
- La búsqueda no depende del DOM renderizado

### Términos (`terms.ts`)
- `buildTermsIndex()` construye un índice de detección automática de términos
- Soporta: label, aliases, caseSensitive, accentInsensitive, wholeWord, maxOccurrencesPerSection
- Normalización: lowercase + eliminación de acentos (NFD)
- Regla: no indexar términos < 4 caracteres a menos que sean aliases explícitos

## Progreso

### Modelo
- `space.progress.unit = "section"`: el progreso se calcula por sección
- `getTrackableSectionIds()`: recolecta sectionIds donde `trackProgress = true`
- `computeModuleProgress()`: calcula ratio y porcentaje basado en secciones completadas vs total trackeable
- Si un módulo no tiene secciones trackeables, `computeModuleProgress()` lanza error

```typescript
interface ModuleProgress {
  totalTrackableSections: number;
  completedTrackableSections: number;
  ratio: number;
  percentage: number;
}
```

### Integración
- El frontend consulta progreso desde localStorage
- No hay persistencia cross-device en esta fase
- El progreso se calcula por sección completada (no por bloque individual)

## Authoring

### Estructura de archivos
```
catalog/spaces/
  {spaceId}/
    {locale}/
      space.json
      modules/
        {order}-{slug}.module.json
```

### Convenciones
- `moduleId`: patrón `^mod-[a-z0-9]+(?:-[a-z0-9]+)*$`
- `blockId`: patrón `^blk-[a-z0-9]+(?:-[a-z0-9]+)*$`
- `sectionId`: patrón `^sec-[a-z0-9]+(?:-[a-z0-9]+)*$`
- `termId`: patrón `^term-[a-z0-9]+(?:-[a-z0-9]+)*$`
- Archivos de módulo: `{order}-{slug}.module.json` (orden de 2 dígitos)
- Contenido en RichText: no se permite HTML plano ni Markdown

### Content updates
- Agregar un módulo no exige tocar rutas ni componentes específicos
- La jerarquía estable es `space -> module -> chapter -> section -> block`
- El renderer decide solo por `block.type` y `target.kind`
- No hay componentes exclusivos por `moduleId`

## Invariantes

1. Agregar un módulo no exige tocar rutas ni componentes específicos.
2. La jerarquía estable es `space -> module -> chapter -> section -> block`.
3. El renderer decide solo por `block.type` y `target.kind`.
4. La búsqueda no depende del DOM renderizado.
5. El progreso se calcula por `section`.
6. No se permite HTML plano en RichText.
7. Los IDs deben ser únicos dentro de cada ámbito (moduleId global, chapterId/sectionId/blockId dentro del módulo).
8. El contenido debe ser completo en todos los locales soportados.

## Errores esperables

- Schema inválido (error de validación AJV).
- `spaceId` o `locale` inconsistentes con el directorio.
- IDs duplicados u órdenes repetidos.
- Recursos, términos o targets internos rotos.
- Módulos publicados sin progreso computable.
- Bloques con contenido vacío donde se requiere.
- Referencias a módulos o secciones que no existen.
- `latexDiagram` o `engine=forest` en espacio course.

## Límites conocidos

- Esta spec no ejecuta aún la migración de la UI viva a páginas genéricas de contenido.
- La persistencia cross-device de progreso queda fuera de esta fase.
- `loopInvariant` y `normalizedPseudocode` no están implementados en el catálogo.

## Archivos relacionados

- `quizzes-spec.md`
- `../08-content/course-json-schema.md`
- `../09-decisions/adr-008-unified-content-spaces.md`
