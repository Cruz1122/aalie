# Indexación de búsqueda

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `packages/content-catalog/src/search.ts`, `packages/content-catalog/catalog/`, `course-json-schema.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 3.5 — Indexación de búsqueda

## Propósito

Definir cómo se construye el índice de búsqueda a partir del catálogo JSON sin depender de scraping del DOM.

## Alcance

Aplica a `packages/content-catalog/src/search.ts`, a futuras experiencias de búsqueda y a la metadata que deben suministrar los autores.

## Fuente de verdad

- `packages/content-catalog/src/search.ts`
- `packages/content-catalog/catalog/`
- `course-json-schema.md`

## Estructura

### Fuentes indexables v1

- Títulos de módulo, capítulo y sección.
- `summary` del módulo.
- Texto inline de bloques (extraído de `RichText` mediante `flattenInlineText`).
- `tags` del módulo.
- `searchMeta.aliases`.
- `searchMeta.keywords`.
- Términos y definiciones del glosario.
- Captions de imágenes y figuras.
- Labels y autores de referencias bibliográficas.

### Shape mínimo del índice

```typescript
interface SearchIndexEntry {
  id: string;
  kind: "module" | "section";
  route: string;
  locale: string;
  spaceId: string;
  moduleId: string;
  chapterId?: string;
  sectionId?: string;
  title: string;
  text: string;
  tags: string[];
  aliases: string[];
  keywords: string[];
}
```

### Reglas de normalización

- Eliminar vacíos y duplicados del índice.
- Conservar el texto derivado del JSON, no del HTML renderizado.
- Derivar rutas con `/${space.slug}` y `/${space.slug}/${module.slug}`.
- Indexar por módulo y por sección (cada sección es una entrada independiente).

### Implementación actual

El índice se construye en `packages/content-catalog/src/search.ts`:
1. Recorre todos los espacios y módulos descubiertos.
2. Para cada módulo, crea una entrada de índice con metadatos y texto completo.
3. Para cada sección, crea una entrada de índice independiente.
4. Extrae texto plano de bloques usando `flattenInlineText`.
5. Incluye `tags`, `aliases` y `keywords` de `searchMeta`.
6. Deriva rutas usando `deriveModuleRoute` y `deriveSpaceRoute`.

### Configuración por espacio

Cada `space.json` tiene un campo `search` que controla el comportamiento:

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

### Locale-aware search

El índice incluye el campo `locale` para filtrar por idioma. Cada locale tiene su propio índice derivado de sus archivos JSON.

## Ejemplos

- El módulo teórico indexa "Operación elemental", "T(n)" y la caption de `fig-crecimiento-funciones`.
- La guía indexa atajos, errores frecuentes y enlaces relevantes a `/examples`.
- Una sección sobre Big-O indexa título, aliases ("cota superior asintótica"), tags y texto de párrafos.

## Limites conocidos

- v1 no pondera ranking ni relevancia semántica avanzada.
- El código fuente de `algorithm` y `code` no se indexa completo para evitar ruido.
- La funcionalidad de búsqueda está definida en el modelo de datos, pero la UI de búsqueda no está implementada.

## Archivos relacionados

- `content-validation.md`
- `progress-model.md`
- `authoring-guide.md`
- `content-model.md`
