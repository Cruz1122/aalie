# Flujos del analizador

**Tipo:** descriptiva

## Propósito

Separar los flujos operativos más comunes del analizador y las herramientas auxiliares disponibles.

## Alcance

Cubre flujo manual, ejemplos, `.txt`, trace, loop invariant, GPU/CPU y comparación LLM.

## Fuente de verdad

- pagina del analizador
- modales y componentes asociados

## Estructura

### Flujo manual

- escribir código;
- insertar snippets o plantillas desde el panel lateral si conviene;
- aprovechar el autocompletado contextual del editor: primero símbolos locales, luego snippets y al final algoritmos completos;
- parsear;
- analizar;
- revisar resultados.

### Flujo de escritura asistida

- si el usuario conoce la estructura, puede escribir directamente con ayuda del autocompletado;
- si necesita una base completa, puede insertar una plantilla o un algoritmo del catálogo desde el panel;
- si el locale activo es inglés, la inserción usa el texto en inglés del snippet o del algoritmo;
- si el locale activo es español, la inserción usa la variante española;
- el panel lateral expone categorías curadas, mientras que el autocompletado de Monaco usa el catálogo expandido completo.

### Flujo desde ejemplos

- abrir `/examples`;
- cargar algoritmo;
- analizar y comparar método/caso.

### Flujo con `.txt`

- importar archivo de texto;
- revisar sugerencias de normalización si el archivo trae símbolos legacy;
- validar formato;
- corregir manualmente o reparar con ayuda si aplica;
- volver al flujo principal.

### Herramientas auxiliares

- panel lateral de ayuda de escritura;
- `loopInvariant`;
- `trace`;
- `GPU vs CPU`;
- comparación con LLM

### Flujo con asistente embebido

- abrir `/analyzer` con API key válida disponible;
- usar el launcher flotante de la esquina inferior derecha;
- si hay un modal o panel abierto, las preguntas ambiguas como "que es esto" o "que paso aqui" se responden primero respecto a esa vista;
- si no hay modal en foco, el asistente toma como base la vista activa del analizador y el resumen formal disponible;
- en seguimiento, el contexto incluye parametros visibles, paso actual y un resumen curado del diagrama, y se actualiza cuando cambian caso, `n` o variables iniciales.

## Ejemplos

- usar `GPU vs CPU` como artefacto complementario, no como veredicto contractual del motor principal.

## Limites conocidos

- LLM y comparación pueden no estar disponibles.
- el asistente no sustituye resultados formales; explica o amplia sobre lo visible.

## Archivos relacionados

- `user-guide.md`
- `exports-guide.md`
- `examples-guide.md`
