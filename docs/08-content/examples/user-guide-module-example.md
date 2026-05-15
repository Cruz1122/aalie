# Ejemplo de módulo de guía de usuario

**Tipo:** ejemplo
**Estado:** final
**Audiencia:** autor-contenido
**Fuente de verdad:** `packages/content-catalog/catalog/spaces/user-guide/es/modules/`
**Última revisión:** 2026-05-18

## Propósito

Este ejemplo muestra la estructura de un módulo de guía de usuario, que usa el mismo contrato que los módulos de curso.

## Módulo: "Guía de uso de AALIE"

```json
{
  "schema": "aalie.content.module",
  "schemaVersion": "1.0.0",
  "spaceId": "user-guide",
  "moduleId": "mod-guia-de-uso",
  "slug": "guia-de-uso",
  "title": "Guía de uso de AALIE",
  "order": 1,
  "locale": "es",
  "version": "1.0.0",
  "status": "published",
  "summary": "Aprende a navegar y usar las herramientas de AALIE para el análisis de algoritmos.",
  "difficulty": "basic",
  "estimatedMinutes": 20,
  "tags": ["guía", "introducción", "navegación"],
  "chapters": [
    {
      "chapterId": "cap-introduccion",
      "slug": "introduccion",
      "title": "Introducción a AALIE",
      "order": 1,
      "sections": [
        {
          "sectionId": "sec-que-es-aalie",
          "slug": "que-es-aalie",
          "title": "¿Qué es AALIE?",
          "order": 1,
          "kind": "overview",
          "trackProgress": true,
          "blocks": [
            {
              "id": "blk-heading-que-es",
              "type": "heading",
              "level": 2,
              "content": [
                { "type": "text", "text": "Bienvenido a AALIE" }
              ]
            },
            {
              "id": "blk-parrafo-descripcion",
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "AALIE es una plataforma interactiva para el aprendizaje de Análisis y Diseño de Algoritmos. Combina contenido teórico estructurado con ejercicios prácticos y quizzes adaptativos." }
              ]
            },
            {
              "id": "blk-lista-caracteristicas",
              "type": "list",
              "style": "unordered",
              "items": [
                {
                  "content": [{ "type": "text", "text": "Módulos teóricos con notación asintótica, recurrencias y técnicas de diseño" }]
                },
                {
                  "content": [{ "type": "text", "text": "Quizzes adaptativos que se ajustan a tu nivel de conocimiento" }]
                },
                {
                  "content": [{ "type": "text", "text": "Visualizaciones interactivas de algoritmos" }]
                }
              ]
            },
            {
              "id": "blk-nota-empezar",
              "type": "note",
              "variant": "info",
              "title": "Para empezar",
              "blocks": [
                {
                  "id": "blk-parrafo-nota",
                  "type": "paragraph",
                  "content": [
                    { "type": "text", "text": "Dirígete a la sección " },
                    { "type": "link", "text": "Course", "target": { "kind": "module", "ref": "mod-complejidad-temporal-espacial" } },
                    { "type": "text", "text": " para comenzar con el primer módulo." }
                  ]
                }
              ]
            },
            {
              "id": "blk-boton-ir-curso",
              "type": "buttonRow",
              "buttons": [
                {
                  "label": "Ir al curso",
                  "target": { "kind": "module", "ref": "mod-complejidad-temporal-espacial" },
                  "variant": "primary"
                },
                {
                  "label": "Ver dashboard",
                  "target": { "kind": "external", "ref": "/quizzes" },
                  "variant": "secondary"
                }
              ]
            }
          ]
        },
        {
          "sectionId": "sec-navegacion",
          "slug": "navegacion",
          "title": "Navegación básica",
          "order": 2,
          "kind": "reference",
          "trackProgress": true,
          "blocks": [
            {
              "id": "blk-heading-navegacion",
              "type": "heading",
              "level": 2,
              "content": [{ "type": "text", "text": "Navegación" }]
            },
            {
              "id": "blk-tabla-atajos",
              "type": "table",
              "title": "Atajos de navegación",
              "columns": [
                { "key": "accion", "label": "Acción" },
                { "key": "como", "label": "Cómo" }
              ],
              "rows": [
                {
                  "cells": [
                    [{ "type": "text", "text": "Ver módulos" }],
                    [{ "type": "text", "text": "Click en \"Course\" en el header" }]
                  ]
                },
                {
                  "cells": [
                    [{ "type": "text", "text": "Iniciar quiz" }],
                    [{ "type": "text", "text": "Click en \"Quizzes\" en el header o botón en card de módulo" }]
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

1. **Mismo contrato**: La guía de usuario usa la misma estructura JSON que los módulos de curso.
2. **SpaceId**: `user-guide` para diferenciar del espacio de curso (`course`).
3. **Section kinds**: Usa `overview` y `reference` como tipos de sección.
4. **Bloques**: Incluye `note` con variante informativa, `buttonRow` para CTAs, `table` para datos de referencia.
5. **Enlaces**: Los `link` y `button` referencian módulos del espacio `course` mediante `target.kind = "module"`.
6. **Rutas**: El módulo es accesible en `/user-guide/guia-de-uso`.
