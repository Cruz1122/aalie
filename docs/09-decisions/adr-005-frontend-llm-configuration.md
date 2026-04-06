# ADR-005: Configuracion LLM desde frontend/BFF

**Tipo:** normativa

## Propósito

Registrar que modelos y endpoint LLM se configuran en el BFF/frontend y no dispersos por componentes.

## Alcance

Aplica a `/api/llm/*`, jobs, prompts y selección de modelos.

## Fuente de verdad

- `apps/web/src/app/api/llm/llm-config.ts`
- `apps/web/src/app/api/llm/`

## Estructura

### Decision

- Los jobs LLM consumen configuración centralizada.
- Los componentes no definen modelos ni prompts locales.
- La API key del servidor tiene prioridad; la del cliente es fallback.

## Ejemplos

- Cambiar el modelo de `compare` solo exige cambiar configuración y documentación asociada.

## Limites conocidos

- Esta decisión no vuelve contractual la salida del proveedor; solo centraliza su configuración.

## Archivos relacionados

- `../02-architecture/llm-integration.md`
- `../04-api/llm-api.md`
