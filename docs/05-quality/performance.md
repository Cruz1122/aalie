# Rendimiento

**Tipo:** descriptiva

## Propósito

Describir qué partes del sistema son sensibles en rendimiento y qué vigilar al modificarlas.

## Alcance

Cubre parse, classify, analyze, simplify, trace y export.

## Fuente de verdad

- `apps/api/app/modules/analysis/`
- `apps/api/app/modules/export/`
- tests y benchmarks del repo

## Estructura

### Zonas sensibles

- parseo y construcción de AST
- cierre de sumatorias y simplificacion SymPy
- métodos recursivos con álgebra pesada
- derivacion de structured trace
- compilacion PDF

### Monitoreo recomendado

- tiempo total de análisis por algoritmo canónico;
- tiempo de `sympy` en casos complejos;
- tiempo y logs de `pdflatex`;
- número de pasos y truncamiento de trace.

## Ejemplos

- una mejora en visitors puede empeorar SymPy si genera expresiones más complejas.

## Limites conocidos

- el mayor cuello de botella matemático suele ser SymPy, no el parseo.

## Archivos relacionados

- `benchmarking.md`
- `../../03-specs/export-engine-spec.md`
