# Modelo de contenido

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | autor-contenido
**Fuente de verdad:** `packages/content-catalog/catalog/`, `packages/content-catalog/schemas/`, `packages/content-catalog/src/types.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 3 — Modelo de contenido

## Propósito

Fijar el modelo unificado de contenido para guías y cursos teóricos sin lógica manual por espacio, página o módulo. Todo contenido comparte el mismo contrato, las rutas se derivan de slugs, y la UI decide por `block.type` y `target.kind`, nunca por IDs concretos.

## Alcance

Aplica al catálogo canónico de `packages/content-catalog/`, al renderer futuro de contenido, a la validación previa al render, y al enlace con el sistema de quizzes a través de `contentRefs`.

## Fuente de verdad

- `packages/content-catalog/catalog/`
- `packages/content-catalog/schemas/`
- `packages/content-catalog/src/types.ts`
- `course-json-schema.md`
- `block-json-schema.md`
- `inline-rich-text-schema.md`

## Estructura

### Jerarquía oficial

```
space → module → chapter → section → block
```

- **space**: contenedor navegable como `/user-guide` o `/course`. Definido por `space.json` con metadata de búsqueda, progreso y tema visual.
- **module**: unidad visible en la grilla de entrada y en navegación interna. Archivo `NN-slug.module.json` con orden explícito.
- **chapter**: agrupador semántico dentro de un módulo. Tiene `chapterId`, `slug`, `title`, `order` y `sections[]`.
- **section**: unidad oficial de lectura, progreso y paginación v1. Marca `trackProgress` para habilitar/deshabilitar el conteo de progreso.
- **block**: unidad renderizable tipada. Cada `block.type` tiene su propio contrato de payload.

### Entidades clave

| Entidad | Descripción | ID prefijo | Requerido en |
|---|---|---|---|
| space | Contenedor raíz navegable | `space.json` slug | `/course`, `/user-guide` |
| module | Unidad pedagógica en grilla | `mod-` | `NN-slug.module.json` |
| chapter | Agrupador semántico | `cap-` | Dentro de `chapters[]` |
| section | Unidad de lectura/progreso | `sec-` | Dentro de `sections[]` |
| block | Elemento renderizable | `blk-` | Dentro de `blocks[]` |

### Localización

- Cada locale tiene su propio directorio: `catalog/spaces/<spaceId>/<locale>/`.
- Cada locale contiene su propio `space.json` y `modules/` con módulos traducidos.
- No hay archivos compartidos entre locales: cada archivo es autónomo.
- La validación de locale coverage verifica que ambos locales tengan los mismos módulos.

### Descubrimiento de archivos

El sistema descubre espacios escaneando el filesystem:

```
catalog/spaces/*/*/space.json                      → espacios con locale
catalog/spaces/<spaceId>/<locale>/modules/*.module.json  → módulos
```

### Convención de nombres

```
<order-2digitos>-<slug>.module.json
```

Ejemplo: `01-complejidad-temporal-y-espacial.module.json`

El `order` en el nombre de archivo debe coincidir con `module.order`.

### Versionado

- `schemaVersion` (semver): versión del contrato JSON Schema. Cambio incompatible exige subir versión, actualizar docs y ajustar validación.
- `version` (semver): versión editorial del contenido. Cambia cuando se modifica el contenido del módulo.
- Un cambio de significado sin cambio de shape sigue exigiendo actualización documental.

### Relación con quizzes

Cada pregunta de quiz puede declarar `contentRefs[]` que apuntan a módulos, capítulos y bloques del catálogo de contenido:

```json
{
  "courseId": "ada",
  "moduleId": "mod-notacion-asintotica",
  "chapterId": "cap-big-o",
  "blockId": "blk-definicion-big-o"
}
```

Estas referencias permiten al sistema de quizzes enlazar feedback y explicaciones al contenido académico correspondiente. El selector de quizzes usa `studiedContentRefs` del estudiante para filtrar preguntas relevantes.

### Pipeline de validación

1. **Capa 1 — Schema**: AJV valida cada archivo contra los 5 JSON Schemas (shared, inline, block, space, module).
2. **Capa 2 — Directorio**: Verifica consistencia entre `spaceId`, locale, y rutas de archivo.
3. **Capa 3 — Órdenes**: Valida unicidad de IDs y órdenes en capítulos, secciones y bloques.
4. **Capa 4 — Semántica**: Valida bloques vacíos, tablas mal formadas, código vacío, grafos sin aristas.
5. **Capa 5 — Referencias cruzadas**: Verifica que términos, recursos, links, solutionRefs y prerequisitos resuelvan.
6. **Capa 6 — Términos**: Sin IDs/aliases duplicados, primarySectionRef válido.
7. **Capa 7 — Diagramas**: Course space no permite `latexDiagram` ni `engine=forest`.
8. **Capa 8 — Cobertura**: Ambos locales deben tener los mismos módulos.
9. **Capa 9 — Rutas**: Detecta colisiones de rutas entre módulos publicados.
10. **Capa 10 — Recursos**: Verifica que `publicPath` exista en `apps/web/public/`.

### Decisiones cerradas

- El catálogo canónico vive en `packages/content-catalog/`, no en `docs/`.
- La localización canónica es un archivo por locale.
- El descubrimiento es por filesystem en `catalog/spaces/<spaceId>/<locale>/`.
- El progreso se calcula por secciones con `trackProgress: true`.
- Los recursos visuales usan source híbrido: `backendAsset`, `publicPath` o `externalUrl`.
- El rich text inline es tipado y prohíbe Markdown/HTML libre como contrato de authoring.
- No hay entidad `page` persistida; la paginación se deriva de secciones.

## Ejemplos

- `packages/content-catalog/catalog/spaces/user-guide/es/` representa la guía de usuario con el mismo contrato que cualquier curso.
- `packages/content-catalog/catalog/spaces/course/es/` representa el espacio teórico bajo `/course`.
- `packages/content-catalog/catalog/spaces/user-guide/es/modules/01-guia-de-uso.module.json` — ejemplo de módulo de guía.
- `packages/content-catalog/catalog/spaces/course/es/modules/01-complejidad-temporal-y-espacial.module.json` — ejemplo de módulo de curso.

## Limites conocidos

- La migración del renderer vivo de `/user-guide` al contrato unificado queda fuera de esta fase.
- v1 no persiste una entidad `page`; la paginación se deriva de secciones.
- La validación no compara equivalencia semántica exacta entre textos de distintos locales.
- `backendAsset` se valida por presencia contractual, no por existencia remota.

## Archivos relacionados

- `course-json-schema.md`
- `block-json-schema.md`
- `inline-rich-text-schema.md`
- `content-validation.md`
- `search-indexing.md`
- `progress-model.md`
- `authoring-guide.md`
- `adaptive-quizzes.md`
