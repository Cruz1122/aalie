# Ejemplo de módulo de curso

**Tipo:** ejemplo
**Estado:** final
**Audiencia:** autor-contenido
**Fuente de verdad:** `packages/content-catalog/catalog/spaces/course/es/modules/01-complejidad-temporal-y-espacial.module.json`
**Última revisión:** 2026-05-18

## Propósito

Este ejemplo muestra la estructura completa de un módulo de curso con capítulos, secciones y bloques de distintos tipos.

## Módulo: "Complejidad Temporal y Espacial"

```json
{
  "schema": "aalie.content.module",
  "schemaVersion": "1.0.0",
  "spaceId": "course",
  "moduleId": "mod-complejidad-temporal-espacial",
  "slug": "complejidad-temporal-y-espacial",
  "title": "Complejidad Temporal y Espacial",
  "order": 1,
  "locale": "es",
  "version": "1.2.0",
  "status": "published",
  "summary": "Introducción a la medición de eficiencia de algoritmos mediante complejidad temporal y espacial.",
  "difficulty": "basic",
  "estimatedMinutes": 45,
  "tags": ["complejidad", "tiempo", "espacio"],
  "searchMeta": {
    "aliases": ["análisis de algoritmos", "complejidad algorítmica"],
    "keywords": ["big O", "notación asintótica", "operaciones elementales"]
  },
  "learningObjectives": [
    {
      "objectiveId": "obj-comprender-complejidad",
      "text": "Comprender el concepto de complejidad temporal y espacial."
    }
  ],
  "relatedModuleIds": ["mod-notaciones-asintoticas"],
  "resources": {
    "images": [
      {
        "resourceId": "fig-crecimiento-funciones",
        "kind": "figure",
        "source": {
          "kind": "publicPath",
          "path": "/images/course/crecimiento-funciones.png"
        },
        "alt": "Gráfica comparativa del crecimiento de funciones comunes",
        "caption": "Crecimiento de funciones típicas en análisis de algoritmos."
      }
    ],
    "references": [
      {
        "resourceId": "ref-cormen",
        "kind": "reference",
        "label": "Cormen et al. Introduction to Algorithms, 4th ed.",
        "refType": "book",
        "authors": ["Cormen, T.", "Leiserson, C.", "Rivest, R.", "Stein, C."],
        "year": 2022
      }
    ]
  },
  "terms": [
    {
      "termId": "term-complejidad-temporal",
      "label": "Complejidad temporal",
      "aliases": ["tiempo de ejecución", "complejidad de tiempo"],
      "definition": "Medida de la cantidad de tiempo que un algoritmo tarda en función del tamaño de la entrada.",
      "autoLink": true,
      "primarySectionRef": {
        "moduleId": "mod-complejidad-temporal-espacial",
        "sectionId": "sec-que-es-complejidad"
      }
    }
  ],
  "chapters": [
    {
      "chapterId": "cap-introduccion",
      "slug": "introduccion",
      "title": "Introducción",
      "order": 1,
      "sections": [
        {
          "sectionId": "sec-que-es-complejidad",
          "slug": "que-es-complejidad",
          "title": "¿Qué es la complejidad de un algoritmo?",
          "order": 1,
          "kind": "theory",
          "trackProgress": true,
          "estimatedMinutes": 10,
          "blocks": [
            {
              "id": "blk-heading-intro",
              "type": "heading",
              "level": 2,
              "content": [
                { "type": "text", "text": "Introducción a la " },
                { "type": "strong", "text": "complejidad" },
                { "type": "text", "text": " de algoritmos" }
              ]
            },
            {
              "id": "blk-parrafo-definicion",
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "La " },
                { "type": "term", "text": "complejidad temporal", "termRef": "term-complejidad-temporal", "display": "tooltip" },
                { "type": "text", "text": " de un algoritmo es una función " },
                { "type": "inlineMath", "latex": "T(n)" },
                { "type": "text", "text": " que describe el número de operaciones elementales en función del tamaño " },
                { "type": "inlineMath", "latex": "n" },
                { "type": "text", "text": " de la entrada." }
              ]
            },
            {
              "id": "blk-ejemplo-simple",
              "type": "example",
              "title": "Ejemplo: suma de elementos",
              "blocks": [
                {
                  "id": "blk-algoritmo-suma",
                  "type": "algorithm",
                  "language": "pseudocode",
                  "code": "Algoritmo Suma(A[0..n-1])\n  total ← 0\n  Para i ← 0 hasta n-1 hacer\n    total ← total + A[i]\n  FinPara\n  Retornar total"
                },
                {
                  "id": "blk-explicacion-suma",
                  "type": "paragraph",
                  "content": [
                    { "type": "text", "text": "Este algoritmo realiza " },
                    { "type": "inlineMath", "latex": "n" },
                    { "type": "text", "text": " sumas y " },
                    { "type": "inlineMath", "latex": "n" },
                    { "type": "text", "text": " incrementos, para un total de " },
                    { "type": "inlineMath", "latex": "T(n) = 2n + 1" },
                    { "type": "text", "text": " operaciones elementales." }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Explicación

1. **Metadata del módulo**: Los campos `moduleId`, `slug`, `title`, `order`, `locale` identifican el módulo. `spaceId` conecta con el espacio padre.
2. **Recursos**: Imágenes y referencias bibliográficas declaradas en `resources`.
3. **Términos**: Glosario local con `termId`, alias y referencia a sección primaria.
4. **Capítulos**: Contenedores de secciones.
5. **Secciones**: Unidad de progreso con `trackProgress`.
6. **Bloques**: Contenido renderizable por tipo. Incluyen `heading`, `paragraph`, `term` inline, `inlineMath`, `example` y `algorithm`.
7. **RichText**: Los bloques de texto usan arrays tipados de `InlineSpan` en lugar de Markdown.
