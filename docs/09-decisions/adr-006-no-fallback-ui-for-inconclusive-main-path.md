# ADR-006: Sin fallback UI engañoso para rutas inconclusas

**Tipo:** normativa

## Propósito

Evitar que la UI disfrace como conclusión firme un resultado incompleto o no soportado del motor principal.

## Alcance

Aplica a análisis, recurrencias, WHILE, trace y export.

## Fuente de verdad

- contratos de `analysis`, `trace` y `snapshot`;
- vistas del analizador en frontend.

## Estructura

### Decision

- Cuando el motor sea parcial, `unsupported` o no concluyente, la UI debe mostrarlo como tal.
- No se agrega una narrativa de certeza artificial para cerrar huecos del analizador.

## Ejemplos

- Una recurrencia fuera de forma soportada puede mostrarse con advertencia y detalle parcial, pero no con una theta inventada.

## Limites conocidos

- Esto puede ser menos “bonito” visualmente, pero preserva confianza y mantenibilidad.

## Archivos relacionados

- `../03-specs/analysis-engine-spec.md`
- `../07-user/user-guide.md`
