# Guía de authoring

**Tipo:** guía
**Estado:** final
**Audiencia:** autor-contenido
**Fuente de verdad:** `content-model.md`, `course-json-schema.md`, `block-json-schema.md`, `inline-rich-text-schema.md`, `quiz-json-schema.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Secciones 3 y 7 — Authoring de contenido y quizzes

## Propósito

Guía práctica para autores de contenido del sistema AALIE: cómo crear y mantener módulos de curso, guías de usuario, y preguntas de quiz.

## Alcance

Aplica a:
- Creación y edición de módulos de contenido.
- Adición de traducciones (locales).
- Gestión de recursos visuales.
- Creación de preguntas de quiz.
- Vinculación de quizzes con contenido mediante `contentRefs`.
- Validación del catálogo.

## Fuente de verdad

- `quiz-json-schema.md`
- `content-model.md`
- `course-json-schema.md`
- `block-json-schema.md`
- `inline-rich-text-schema.md`

## Estructura del repositorio de contenido

### Ubicación del catálogo

```
packages/content-catalog/catalog/spaces/
  course/
    es/
      space.json
      modules/
        01-complejidad-temporal-y-espacial.module.json
        02-notaciones-asintoticas.module.json
        ...
    en/
      space.json
      modules/
        01-complexity-analysis.module.json
        02-asymptotic-notation.module.json
        ...
  user-guide/
    es/
      space.json
      modules/
        01-guia-de-uso.module.json
        ...
    en/
      space.json
      modules/
        01-user-guide.module.json
        ...
```

### Archivo space.json

Define metadata del espacio (course, user-guide). Contiene configuración de búsqueda, progreso y tema.

```json
{
  "schema": "aalie.content.space",
  "schemaVersion": "1.0.0",
  "spaceId": "course",
  "slug": "course",
  "kind": "theory",
  "title": "Análisis y Diseño de Algoritmos",
  "locale": "es",
  "version": "1.0.0",
  "status": "published",
  "search": {
    "enabled": true,
    "indexText": true,
    "indexStructure": true,
    "indexTerms": true,
    "indexReferences": true,
    "indexCaptions": true
  },
  "progress": {
    "unit": "section"
  }
}
```

### Archivo module

```
<NN>-<slug>.module.json
```

Ejemplo: `01-complejidad-temporal-y-espacial.module.json`

## Cómo crear un módulo nuevo

1. Crear archivo en `catalog/spaces/<spaceId>/<locale>/modules/` con nombre `<NN>-<slug>.module.json`.
2. Definir campos obligatorios: `schema`, `schemaVersion`, `spaceId`, `moduleId`, `slug`, `title`, `order`, `locale`, `version`, `status`, `chapters`.
3. Agregar al menos 1 capítulo con 1 sección.
4. Para cada sección, definir `trackProgress`.
5. Agregar bloques de contenido según los tipos disponibles.
6. Ejecutar validación: `npm run validate-content` (o script correspondiente).
7. Crear traducción en los otros locales.

## Guía de selección de tipo de bloque

| Necesitas | Usa |
|---|---|
| Título de sección | `heading` (level 2, 3, o 4) |
| Texto narrativo | `paragraph` con `richText` inline |
| Lista con viñetas/numerada | `list` con `style: unordered|ordered` |
| Cita textual | `quote` con `attribution` |
| Nota informativa | `note` con `variant: info|warning|success|danger` |
| Definición formal | `definition` con `blocks[]` anidados |
| Teorema | `theorem` con `blocks[]` anidados |
| Demostración | `proof` con `blocks[]` anidados |
| Ejemplo pedagógico | `example` con `blocks[]` anidados |
| Bloque de evidencia | `evidenceBlock` con `variant` e `icon` |
| Ejercicio para el lector | `exercise` con `prompt` y opcional `solutionRef` |
| Solución de ejercicio | `exerciseSolution` con `blocks[]` anidados |
| Pseudocódigo o código | `algorithm` o `code` con `language` y `code` |
| Tabla de datos | `table` con `columns[]` y `rows[].cells[]` |
| Imagen | `image` con `resourceRef` |
| Figura con caption | `figure` con `resourceRef` |
| Ecuación LaTeX | `equationBlock` o `latex` |
| Diagrama Mermaid | `mermaid` con `code` |
| Árbol de recursión | `recursionTree` con `nodes[]` |
| Grafo dirigido | `graph` con `nodes[]` y `edges[]` |
| Tabla de complejidades | `complexityTable` |
| Tabla comparativa de fórmulas | `formulaComparisonTable` |
| Ficha de método | `methodCard` con secciones opcionales |
| Algoritmo paso a paso | `stepByStepMethod` o `proofSteps` |
| Error común | `warningTrap` con `misconception`, `whyItFails`, `fix` |
| Ejemplo resuelto | `exampleSolved` con `steps[]` |
| Punto de control quiz | `quizCheckpoint` con `quizId` |
| Cheatsheet | `cheatsheet` con `items[]` |
| Lista de referencias | `referenceList` con `references[]` |
| Botonera de navegación | `buttonRow` con `buttons[]` |
| Separador visual | `divider` |

## Cómo agregar traducciones

1. Copiar el módulo al directorio del otro locale: `catalog/spaces/<spaceId>/en/modules/`.
2. Traducir: título, resumen, contenido de bloques, términos, recursos textuales.
3. Cambiar `locale` al código correspondiente.
4. Mantener el mismo `moduleId`, `order` y estructura de capítulos/secciones/bloques.
5. No traducir: IDs (`moduleId`, `chapterId`, `sectionId`, `block.id`, `termId`, `resourceId`).
6. Ejecutar validación para verificar cobertura entre locales.

## Gestión de recursos visuales

Los recursos (imágenes, figuras) se declaran en `module.resources` y se referencian desde bloques mediante `resourceRef`.

Tipos de source:
- `backendAsset`: Asset servido por el backend (`{ "kind": "backendAsset", "assetId": "..." }`).
- `publicPath`: Archivo en `apps/web/public/` (`{ "kind": "publicPath", "path": "/images/..." }`).
- `externalUrl`: URL externa (`{ "kind": "externalUrl", "url": "https://..." }`).

Para imágenes con `publicPath`, el archivo debe existir en `apps/web/public/`.

## Validación del catálogo

```bash
# Validación completa del catálogo
npm run validate-content-catalog

# O directamente:
npx tsx packages/content-catalog/scripts/validate-content-catalog.ts
```

La validación ejecuta todas las capas definidas en `content-validation.md`. Los errores bloqueantes deben corregirse antes de publicar.

## Cómo crear preguntas de quiz

### Guía de authoring para quizzes

1. Elegir habilidad concreta (`skillIds`), no solo tema amplio.
2. Elegir tipo entre: `single_choice`, `multiple_choice`, `true_false`, `ordering`, `match_pairs`.
3. Escribir prompt claro y sin ambigüedad.
4. Escribir opciones paralelas y plausibles.
5. Escribir feedback por opción (también para la correcta).
6. Escribir explicación general con razonamiento.
7. Declarar `contentRefs` válidos (ver sección siguiente).
8. Completar `selectionMeta`.

### ContentRef linking

Cada pregunta activa debe declarar:

```json
{
  "courseId": "ada",
  "moduleId": "mod-notacion-asintotica",
  "chapterId": "cap-big-o",
  "blockId": "blk-definicion-big-o"
}
```

- `courseId` siempre es `"ada"`.
- `moduleId` debe existir en el catálogo (prefijo `mod-`).
- `chapterId` debe existir dentro del módulo (prefijo `cap-`).
- `blockId` es opcional pero recomendado para remediación precisa.

### Distribución recomendada para banco de 500

Por dificultad:
- `basic`: 35%
- `intermediate`: 45%
- `advanced`: 20%

Por nivel cognitivo:
- `recall`: 20%
- `understand`: 30%
- `apply`: 35%
- `analyze`: 15%

### Scripts de gestión del banco

```bash
# Validar el banco
python apps/api/scripts/validate_quiz_bank.py

# Reporte de cobertura
python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical

# Insertar preguntas
python scripts/manage_quiz_bank.py insert --input <archivo.json>

# Eliminar preguntas por ID
python scripts/manage_quiz_bank.py remove --ids <ids.json>
```

### Alineación de contentRefs

Si los `contentRefs` del banco están desactualizados respecto al catálogo, ejecutar:

```bash
python scripts/align_quiz_content_refs_catalog.py
```

Este script reasigna `contentRefs` según el `topic` pedagógico de cada pregunta.

## Checklist de módulo publicado

Antes de cambiar `status` a `published`:
- Todos los bloques tienen contenido no vacío.
- Todas las referencias (`termRef`, `resourceRef`, `solutionRef`, `target`) resuelven.
- No hay IDs duplicados.
- El nombre de archivo sigue `<NN>-<slug>.module.json`.
- `spaceId` y `locale` coinciden con el directorio.
- Al menos una sección tiene `trackProgress: true`.
- Existe el mismo módulo en todos los locales del espacio.
- No hay colisiones de rutas.
- `publicPath` existe en disco.

## Checklist de pregunta activa

- `questionId` único en el dataset.
- `questionVersion >= 1`.
- `status = active`.
- Tipo soportado y `gradingPolicy` compatible.
- Dificultad y nivel cognitivo válidos.
- `topic` y `tags` en taxonomía.
- `skillIds` no vacío.
- `prompt.blocks` y `explanation.blocks` no vacíos.
- Opciones con `feedback` (incluye correcta).
- `contentRefs` resuelven contra el catálogo.
- `selectionMeta` completo.
- No evalúa uso de AALIE.

## Archivos relacionados

- `quiz-json-schema.md`
- `../03-specs/quizzes-spec.md`
- `course-json-schema.md`
- `content-model.md`
- `examples/quiz-bank.sample.json`
- `content-validation.md`
