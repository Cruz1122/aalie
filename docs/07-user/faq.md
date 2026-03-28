# FAQ

**Tipo:** descriptiva

## Propósito

Responder dudas recurrentes sin duplicar contratos técnicos.

## Alcance

Cubre preguntas de uso, no de implementación interna profunda.

## Fuente de verdad

- comportamiento actual de UI y backend

## Estructura

### Preguntas frecuentes

- ¿Por qué dos casos devuelven el mismo resultado? Porque el algoritmo puede ser determinístico y el backend responde `same_as_worst`.
- ¿Por qué un método no aparece? Porque `detect-methods` no lo considera defendible para esa recurrencia.
- ¿El LLM reemplaza el análisis? No.
- ¿El PDF puede fallar aunque el análisis salga bien? Sí, por dependencias LaTeX.

## Ejemplos

- si ves advertencia o resultado parcial, no significa que la app esté rota; significa que el motor está declarando un límite real.

## Limites conocidos

- este FAQ no sustituye `troubleshooting.md` para fallos de entorno.

## Archivos relacionados

- `user-guide.md`
- `../06-operations/troubleshooting.md`
