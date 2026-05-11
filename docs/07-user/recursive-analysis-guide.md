# Guía de análisis recursivo

**Tipo:** descriptiva

## Propósito

Explicar qué esperar cuando se analiza un algoritmo recursivo.

## Alcance

Cubre detección de métodos, bundles paso a paso, trace y advertencias.

## Seguimiento manual guiado

El seguimiento manual guiado es un modo pedagógico de la misma traza recursiva. No crea un contrato alternativo: reutiliza `trace`, `callTreeSource` y `structuredTrace` para permitir navegación por pasos o por niveles cuando eso ayuda a entender la expansión recursiva.

### Qué debe mostrar

- llamadas recursivas y profundidad;
- expansión del árbol de llamadas;
- retornos como eventos separados cuando aporten claridad;
- explicación y export apoyados en el mismo contrato.

### Qué no hace

- no inventa ramas ni retornos ausentes;
- no reinterpreta `steps` para imponer una complejidad matemática;
- no convierte una traza parcial en una conclusión total.

## Fuente de verdad

- `analysis` recursivo
- selector de método del frontend

## Estructura

### Flujo

1. clasificación recursiva;
2. detección de métodos;
3. selección o default;
4. resultado del método;
5. trace/export si se desea.

### Lo que puede ocurrir

- varios métodos aplicables;
- un método por defecto;
- bundles `complete`, `partial`, `unsupported` o `error`.

## Ejemplos

- `mergeSort` suele priorizar `master`.
- `factorial` puede resolverse por `iteration` o `characteristic_equation` según cobertura.
- `fibonacci` y `binarySearchRecursive` son casos útiles para validar expansión, profundidad y retorno en el árbol.
- para una validación manual formal de estos casos, ver el checklist en `../05-quality/testing-strategy.md`.

## Limites conocidos

- no toda recurrencia tiene solución automática completa.
- la navegación manual debe degradar con trazas profundas o truncadas sin romper la lectura pedagógica.

## Archivos relacionados

- `user-guide.md`
- `exports-guide.md`
- `../03-specs/recurrence-methods-spec.md`
