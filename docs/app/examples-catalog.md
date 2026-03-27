# Catalogo De Ejemplos

El modulo de ejemplos del frontend usa una unica fuente de verdad:

- `apps/web/src/lib/examples/catalog.ts`

## Como agregar un algoritmo

1. Crea un item nuevo con `createExample` en la categoria correcta.
2. Define `id` y `slug` unicos.
3. Completa `copy.es` y `copy.en` (titulo, resumen, tags).
4. Ajusta `verifiedMethods`:
   - Iterativos: siempre `[]`.
   - Recursivos: solo `TM`, `IT`, `AR`, `EC` realmente defendibles.
5. Decide `enabled`:
   - `true`: visible en UI y debe pasar validacion completa.
   - `false`: queda en catalogo maestro, pero no se publica.

## Regla de badges verificadas

Las badges se mapean a metodos del backend asi:

- `TM` -> `master`
- `IT` -> `iteration`
- `AR` -> `recursion_tree`
- `EC` -> `characteristic_equation`

Un ejemplo habilitado no puede mostrar una badge que `/analyze/detect-methods` no soporte para su pseudocodigo.

## Script de validacion

Comando:

```bash
pnpm -C apps/web validate:examples-catalog
```

Comportamiento:

- Parsea cada algoritmo con `/grammar/parse`.
- En recursivos, valida badges con `/analyze/detect-methods`.
- Falla solo con ejemplos `enabled: true`.
- Para `enabled: false`, emite warning y continua.
