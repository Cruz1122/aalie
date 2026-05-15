# Ejemplos de contenido inválido

**Tipo:** ejemplo
**Audiencia:** autor-contenido
**Fuente de verdad:** `content-validation.md`, `validate.ts`
**Última revisión:** 2026-05-18

## Propósito

Mostrar ejemplos de contenido que la validación rechaza, explicando qué error produce cada caso y cómo corregirlo.

## 1. Schema inválido — CONTENT_001

### Campo obligatorio faltante
```json
{
  "moduleId": "mod-ejemplo",
  "title": "Módulo sin schema"
}
```
**Error**: `CONTENT_001` — Falta `schema`, `schemaVersion`, `spaceId`, `slug`, `order`, `locale`, `version`, `status`, `chapters`.

**Solución**: Incluir todos los campos requeridos del schema `module.schema.json`.

### Tipo incorrecto
```json
{
  "moduleId": 123,
  "title": true
}
```
**Error**: `CONTENT_001` — `/moduleId` must be string.

## 2. Directory mismatch — CONTENT_101 a 105

### spaceId no coincide con directorio
Archivo en `catalog/spaces/course/es/modules/` con:
```json
{ "spaceId": "user-guide" }
```
**Error**: `CONTENT_104` — Módulo con `spaceId` distinto al espacio contenedor.

### Locale no coincide
```json
{ "locale": "en" }
```
**Error**: `CONTENT_105` — Módulo en directorio `es/` pero con locale `en`.

### Filename incorrecto
Archivo `mi-modulo.module.json` en lugar de `02-mi-modulo.module.json`.
**Error**: `CONTENT_103` — El nombre de archivo debe ser `02-mi-modulo.module.json`.

## 3. Órdenes duplicados — CONTENT_201 a 205

### Mismo chapter.order
```json
"chapters": [
  { "chapterId": "cap-uno", "order": 1, "sections": [...] },
  { "chapterId": "cap-dos", "order": 1, "sections": [...] }
]
```
**Error**: `CONTENT_201` — Repite chapter order 1.

### Mismo sectionId
```json
"sections": [
  { "sectionId": "sec-intro", "order": 1 },
  { "sectionId": "sec-intro", "order": 2 }
]
```
**Error**: `CONTENT_204` — Repite sectionId `sec-intro`.

## 4. Bloques semánticos inválidos — CONTENT_301 a 310

### heading vacío
```json
{ "id": "blk-vacio", "type": "heading", "level": 2, "content": [] }
```
**Error**: `CONTENT_301` — Bloque con rich text vacío.

### table con celdas incorrectas
```json
{ "id": "blk-tabla", "type": "table", "columns": [
  { "key": "a", "label": "A" },
  { "key": "b", "label": "B" }
], "rows": [
  { "cells": [ [{ "type": "text", "text": "1" }] ] }
]}
```
**Error**: `CONTENT_305` — Fila con 1 celda para 2 columnas.

### code vacío
```json
{ "id": "blk-code", "type": "code", "language": "pseudocode", "code": "" }
```
**Error**: `CONTENT_304` — Bloque code con código vacío.

### mermaid vacío
```json
{ "id": "blk-diag", "type": "mermaid", "code": "" }
```
**Error**: `CONTENT_308` — Bloque mermaid con código vacío.

### graph sin aristas
```json
{ "id": "blk-graph", "type": "graph", "nodes": [{ "nodeId": "n1", "label": "N1" }], "edges": [] }
```
**Error**: `CONTENT_310` — Graph debe definir nodos y aristas.

## 5. Referencias rotas — CONTENT_207 a 219

### relatedModuleId inexistente
```json
{ "relatedModuleIds": ["mod-no-existe"] }
```
**Error**: `CONTENT_207` — relatedModuleId no existe en el bundle.

### termRef inválido
```json
{ "type": "term", "termRef": "term-no-existe" }
```
**Error**: `CONTENT_214` — termRef no resuelve a ningún término.

### solutionRef inválido
```json
{ "type": "exercise", "solutionRef": "blk-no-existe" }
```
**Error**: `CONTENT_219` — solutionRef no resuelve a bloque existente.

### resourceRef inválido
```json
{ "type": "image", "resourceRef": "fig-no-existe" }
```
**Error**: `CONTENT_215` — resourceRef no resuelve a ningún recurso.

## 6. Términos inválidos — CONTENT_501 a 504

### termId duplicado
```json
"terms": [
  { "termId": "term-complejidad", "label": "Complejidad", "definition": "..." },
  { "termId": "term-complejidad", "label": "Complejidad temporal", "definition": "..." }
]
```
**Error**: `CONTENT_501` — termId repetido.

### Label duplicado (case-insensitive)
```json
"terms": [
  { "termId": "term-uno", "label": "Big O", "definition": "..." },
  { "termId": "term-dos", "label": "big o", "definition": "..." }
]
```
**Error**: `CONTENT_504` — Label duplicado: "big o".

## 7. Diagram contract — CONTENT_311 a 313

### latexDiagram en course
```json
{ "id": "blk-latex", "type": "latexDiagram", "latex": "\\begin{tikzpicture}..." }
```
**Error**: `CONTENT_311` — Course no permite `latexDiagram`.

### engine=forest en course
```json
{ "id": "blk-forest", "type": "mermaid", "engine": "forest", "code": "..." }
```
**Error**: `CONTENT_312` — Course no permite `engine=forest`.

## 8. Error de ruta — CONTENT_206

Dos módulos publicados con el mismo slug:
```
01-complejidad.module.json → slug: "complejidad"
02-complejidad.module.json → slug: "complejidad"
```
**Error**: `CONTENT_206` — Colisión de ruta para `/course/complejidad`.

## 9. Progreso inválido — CONTENT_208 / CONTENT_403

Módulo publicado sin ninguna sección con `trackProgress: true`.
**Error**: `CONTENT_208` — Módulo publicado sin secciones trackeables.

## 10. RichText inválido

### Markdown embebido
```json
{ "type": "text", "text": "Esto es **negrita** y *cursiva*" }
```
**Error**: No permitido. Debe usarse `strong` y `emphasis` como spans separados.

**Correcto**:
```json
[
  { "type": "text", "text": "Esto es " },
  { "type": "strong", "text": "negrita" },
  { "type": "text", "text": " y " },
  { "type": "emphasis", "text": "cursiva" }
]
```

### HTML embebido
```json
{ "type": "text", "text": "Esto tiene <b>HTML</b>" }
```
**Error**: No permitido. HTML no está permitido dentro de `RichText`.

## 11. Quiz inválido — preguntas active sin contentRefs

```json
{
  "questionId": "ada-bad-question-001",
  "status": "active",
  "contentRefs": []
}
```
**Error**: Pregunta `active` sin `contentRefs` — no puede seleccionarse.

## Resumen de validaciones

| Código | Severidad | Qué detecta |
|---|---|---|
| CONTENT_001 | error | Schema inválido (cualquier error AJV) |
| CONTENT_101-105 | error | Inconsistencia directorio/spaceId/locale/filename |
| CONTENT_201-205 | error | IDs u órdenes duplicados |
| CONTENT_206, 220 | error | Colisión de rutas |
| CONTENT_207-219 | error | Referencias rotas |
| CONTENT_301-310 | error | Bloques semánticamente inválidos |
| CONTENT_311-313 | error | Violación de contrato de diagramas |
| CONTENT_401-403 | warning | Escala, searchMeta faltante, draft sin progreso |
| CONTENT_404 | warning | Cobertura de locale incompleta |
| CONTENT_501-504 | error | Términos inválidos |
