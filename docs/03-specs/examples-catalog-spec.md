# Especificación del catálogo de ejemplos

**Tipo:** normativa

## Propósito

Fijar el contrato del catálogo de ejemplos del frontend y la validación de badges/métodos.

## Alcance

Aplica al catálogo maestro usado por `/examples` y al script de validación.

## Fuente de verdad

- `apps/web/src/lib/examples/catalog.ts`
- `apps/web/scripts/validate-examples-catalog.ts`

## Estructura

### Entidad `ExampleCatalogItem`

- `id`
- `slug`
- `category`
- `family`
- `difficulty`
- `sourceCode`
- `verifiedMethods`
- `enabled`
- `copy.es`
- `copy.en`

### Regla de badges

- `TM -> master`
- `IT -> iteration`
- `AR -> recursion_tree`
- `EC -> characteristic_equation`

## Inputs

- item de catálogo;
- parse del backend;
- `detect-methods` para recursivos.

## Outputs

- item visible u oculto en UI;
- validación OK/error/warning del script.

## Invariantes

- ejemplos iterativos no deben declarar `verifiedMethods`;
- un ejemplo `enabled: true` debe parsear;
- un ejemplo recursivo `enabled: true` solo puede mostrar badges respaldadas por `detect-methods`.

## Errores esperables

- pseudocódigo no parseable;
- badge no soportada por el backend;
- metadatos obligatorios faltantes.

## Ejemplos

### Ejemplos validos

- `bubble-sort` iterativo con `verifiedMethods = []`.
- `merge-sort` recursivo con badges alineadas a métodos aplicables.

### Ejemplos no soportados

- ejemplo habilitado con badge `TM` si `detect-methods` no devuelve `master`.

## Limites conocidos

- el catálogo actual vive en código TypeScript, no en JSON externo.

## Archivos relacionados

- `../07-user/examples-guide.md`
- `../04-api/analysis-api.md`
