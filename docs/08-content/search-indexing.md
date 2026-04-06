# Indexación de búsqueda

**Tipo:** normativa

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

- títulos de módulo, capítulo y sección;
- `summary`;
- texto inline de bloques;
- `tags`;
- `searchMeta.aliases`;
- `searchMeta.keywords`;
- términos y definiciones;
- captions de imágenes y figuras;
- labels y autores de referencias.

### Shape mínimo del índice

- `id`
- `kind`
- `route`
- `locale`
- `spaceId`
- `moduleId`
- `chapterId` opcional
- `sectionId` opcional
- `title`
- `text`
- `tags`
- `aliases`
- `keywords`

### Reglas de normalización

- eliminar vacíos y duplicados;
- conservar el texto derivado del JSON, no del HTML renderizado;
- derivar rutas con `/${space.slug}` y `/${space.slug}/${module.slug}`;
- indexar por módulo y por sección.

## Ejemplos

- el módulo teórico indexa `Operacion elemental`, `T(n)` y la caption de `fig-crecimiento-funciones`.
- la guía indexa atajos, errores frecuentes y enlaces relevantes a `/examples`.

## Limites conocidos

- v1 no pondera ranking ni relevancia semántica avanzada;
- el código fuente de `algorithm` y `code` no se indexa completo para evitar ruido.

## Archivos relacionados

- `content-validation.md`
- `progress-model.md`
- `authoring-guide.md`
