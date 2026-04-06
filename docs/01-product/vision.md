# Visión del producto

**Tipo:** descriptiva

## Propósito

Definir para qué existe AALIE y qué valor operativo debe entregar sin vender capacidades que el sistema no sostiene.

## Alcance

Describe el producto vigente: análisis de complejidad de pseudocódigo, trazas, export institucional, asistencia opcional con LLM y artefactos pedagógicos ya integrados en el flujo de análisis.

## Fuente de verdad

- `apps/web/src/app/[locale]/analyzer/page.tsx`
- `apps/api/app/modules/analysis/`
- `apps/api/app/modules/export/`
- `apps/api/app/modules/execution/`

## Estructura

### Propuesta de valor

AALIE ayuda a:

- parsear pseudocódigo con una gramática controlada;
- clasificar algoritmos iterativos, recursivos e híbridos;
- analizar complejidad por casos y por método;
- visualizar AST, procedimiento, trazas y árboles asociados;
- exportar el mismo resultado base a Markdown, LaTeX/PDF y ZIP;
- complementar el flujo con asistencia LLM cuando hay API key.

### Principios de producto

- el análisis determinista es la ruta principal;
- el LLM es auxiliar, no la fuente de verdad;
- el sistema debe declarar límites reales cuando el motor no es concluyente;
- un mismo resultado debe mantenerse coherente entre UI, snapshot y export.

### Superficies actuales

- editor con parseo y análisis;
- selector de método para recursivos;
- vista dedicada de trace;
- export institucional;
- loop invariant determinista;
- comparación con LLM;
- catálogo de ejemplos;
- importación de algoritmo `.txt`.

## Ejemplos

- Un estudiante puede analizar `mergeSort`, revisar el método aplicable, abrir la traza y exportar el resultado.
- Un dev puede usar el mismo snapshot para comparar lo que ve en UI con lo que sale en PDF.

## Limites conocidos

- No todo algoritmo queda cubierto por los métodos recursivos disponibles.
- WHILE se trata con heurística conservadora.
- Las integraciones LLM pueden no estar disponibles si no hay API key o si el proveedor falla.

## Archivos relacionados

- `glossary.md`
- `known-limitations.md`
- `../02-architecture/system-architecture.md`
