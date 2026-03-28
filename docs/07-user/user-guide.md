# Guía de usuario

**Tipo:** descriptiva

## Propósito

Explicar cómo usar AALIE sin depender de capturas ni descubrir contratos por prueba y error.

## Alcance

Cubre editor, análisis, trace, export, ejemplos y asistencia opcional.

## Fuente de verdad

- flujo real de `apps/web/src/app/[locale]/analyzer/page.tsx`
- componentes del analizador

## Estructura

### Flujo base

1. escribir o importar pseudocódigo;
2. corregir errores de parseo;
3. ejecutar análisis;
4. revisar resultado iterativo o recursivo;
5. abrir trace, invariant o export según necesidad.

### Lo que entrega el sistema

- costos por línea;
- `T_open` y notaciones;
- método recursivo aplicable cuando existe;
- trace concreto;
- export institucional;
- apoyo LLM opcional.

## Ejemplos

- usar ejemplos precargados para comparar algoritmos canónicos;
- exportar el resultado en Markdown o PDF.

## Limites conocidos

- el sistema puede declarar casos no concluyentes y eso es parte del comportamiento esperado;
- algunas ayudas dependen de API key.

## Archivos relacionados

- `analyzer-workflows.md`
- `recursive-analysis-guide.md`
- `exports-guide.md`
