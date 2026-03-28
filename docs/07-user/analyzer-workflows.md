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
- parsear;
- analizar;
- revisar resultados.

### Flujo desde ejemplos

- abrir `/examples`;
- cargar algoritmo;
- analizar y comparar método/caso.

### Flujo con `.txt`

- importar archivo de texto;
- validar formato;
- reparar con ayuda si aplica;
- volver al flujo principal.

### Herramientas auxiliares

- `loopInvariant`
- `trace`
- `GPU vs CPU`
- comparación con LLM

## Ejemplos

- usar `GPU vs CPU` como artefacto complementario, no como veredicto contractual del motor principal.

## Limites conocidos

- LLM y comparación pueden no estar disponibles.

## Archivos relacionados

- `user-guide.md`
- `exports-guide.md`
- `examples-guide.md`
