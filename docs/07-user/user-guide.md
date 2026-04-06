# Guía de usuario

**Tipo:** descriptiva

## Propósito

Documentar la guía de usuario como space de contenido tipado, navegable por módulos y renderizado desde el catálogo unificado.

## Alcance

Cubre la experiencia de `/user-guide` y `/user-guide/[moduleSlug]`, su fuente de verdad, navegación, búsqueda local, progreso y relación con el analizador.

## Fuente de verdad

- catálogo canónico en `packages/content-catalog/catalog/spaces/user-guide/<locale>/`
- contrato JSON y validación en `packages/content-catalog/`
- loader web en `apps/web/src/lib/content/user-guide.ts`
- renderers genéricos en `apps/web/src/components/content/`

## Estructura

### Rutas oficiales

- `/${locale}/user-guide`: landing de módulos con cards, búsqueda global y progreso agregado
- `/${locale}/user-guide/[moduleSlug]`: lectura completa del módulo con tabla de contenidos, anchors y navegación anterior/siguiente

### Jerarquía de contenido

- `space -> module -> chapter -> section -> block`
- la guía se publica hoy con 6 módulos por locale:
  - introducción
  - uso del editor
  - sintaxis de la gramática
  - análisis de complejidad
  - ejemplos rápidos
  - solución de problemas
- el contenido pedagógico vive dentro de los `*.module.json`; `messages/*.json` conserva solo chrome UI compartido (`contentUi`)

### Render y navegación

- la landing ya no renderiza contenido completo ni abre un modal; solo usa metadatos de módulo
- cada card navega a una página de módulo completa
- la tabla de contenidos se genera desde `chapters[]` y `sections[]`
- los bloques se renderizan con `ContentBlockRenderer`
- el texto enriquecido inline se renderiza con `InlineRichTextRenderer`
- los links internos usan refs neutrales `{ kind, ref }` resueltos a rutas y anchors localizados
- no existe lógica por `moduleId` para decidir qué componente usar

### Búsqueda

- la landing indexa todo el space `user-guide`
- la página de módulo restringe la búsqueda al módulo actual
- el índice se construye desde JSON: títulos, texto inline, tags, aliases, términos, captions y referencias
- no hay scraping del DOM renderizado

### Progreso

- la unidad oficial es `section`
- la persistencia local usa `aalie.contentProgress.v1`
- la clave estable es `spaceId/moduleId/sectionId`
- una sección trackeable se marca completada cuando su root alcanza al menos 50% de visibilidad durante 1000 ms continuos
- el porcentaje de módulo y del space se deriva solo de secciones trackeables

### Alineación con el analizador

- el módulo de sintaxis expone como forma visible oficial `//`, `<-`, `CALL`, `FOR`, `WHILE`, `REPEAT`, `IF`, `PRINT`
- alias unicode o estilos legacy solo aparecen como compatibilidad, no como forma principal
- el módulo de análisis describe el pipeline determinista real del motor y separa explícitamente asistencia LLM opcional de resultados del analizador

### Validación

- todos los módulos de guía se validan contra JSON Schema y validaciones semánticas antes de renderizar
- slugs, ids, refs internas y recursos deben resolver en build/test

## Ejemplos

- `/${locale}/user-guide` muestra las 6 cards de módulo usando solo metadatos de catálogo y progreso derivado
- `/${locale}/user-guide/sintaxis-de-la-gramatica` renderiza capítulos, secciones, snippets y TOC desde `03-sintaxis-de-la-gramatica.module.json`
- búsquedas como `semicolon`, `CALL` o `analizar complejidad` resuelven desde el índice estructurado sin inspeccionar el DOM

## Limites conocidos

- esta fase migra solo `user-guide`; la generalización de rutas a cualquier `spaceSlug` queda para la fase de `course`
- la UI actual degrada `backendAsset` a placeholder si no existe aún un resolver web de assets
- el progreso es local al navegador hasta que exista persistencia remota

## Archivos relacionados

- `../08-content/content-model.md`
- `../08-content/course-json-schema.md`
- `../08-content/progress-model.md`
- `analyzer-workflows.md`
- `recursive-analysis-guide.md`
- `exports-guide.md`
