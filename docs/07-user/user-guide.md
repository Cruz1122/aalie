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
2. usar ayudas de escritura del editor para insertar snippets o plantillas compatibles con el parser real;
3. corregir errores de parseo;
4. ejecutar análisis;
5. revisar resultado iterativo o recursivo;
6. abrir trace, invariant o export según necesidad.

### Ayudas de escritura del editor

- el editor usa Monaco con autocompletado contextual limitado a 5 sugerencias por interacción;
- la prioridad visible es: parámetros del procedimiento actual, variables detectadas, snippets cortos y por último algoritmos completos;
- las sugerencias duplicadas se eliminan antes de mostrarse;
- el idioma de inserción sigue el locale activo: en `es` se inserta pseudocódigo localizado en español y en `en` se inserta la variante inglesa del mismo bloque;
- el autocompletado incluye snippets base, plantillas canónicas y todos los algoritmos habilitados del catálogo de ejemplos;
- los algoritmos completos aparecen con menor prioridad que los snippets cortos para no tapar las ayudas locales de escritura.

### Panel lateral de ayuda

- el panel lateral mantiene categorías curadas para escritura rápida: `recommended`, `conditions`, `loops`, `functions`, `templates` y `other`;
- `templates` expone el catálogo completo de plantillas y algoritmos, paginado;
- la paginación del panel muestra 6 bloques por página en `md/lg` y 9 en `xl`;
- cuando hay más de 5 páginas, el paginador se abrevia con elipsis pero conserva una huella visual constante para evitar saltos de layout;
- las pestañas de categoría no usan scroll horizontal: se comprimen en una grilla adaptable según el ancho disponible.

### Sintaxis oficial visible

- comentarios: `//`
- asignación: `<-`
- relacionales: `<=`, `>=`, `!=`
- keywords en mayúscula

### Lo que entrega el sistema

- costos por línea;
- `T_open` y notaciones;
- método recursivo aplicable cuando existe;
- trace concreto;
- export institucional;
- apoyo LLM opcional.

### Señales de validación visibles

- los errores gramaticales se marcan directamente en Monaco y en el estado de parseo;
- el bombillo flotante de sugerencias gramaticales ya no forma parte de la UI operativa del analizador;
- la reparación con IA sigue disponible cuando el parseo falla y existe API key.

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
