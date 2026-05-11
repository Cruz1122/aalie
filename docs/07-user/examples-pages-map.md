# Mapa de páginas: Ejemplos de algoritmos

Base en App Router:

- `/{locale}/examples`
- `/{locale}/examples/{category}`

## Locales detectados

- `es`
- `en`

## Categorías detectadas

- `iterative`
- `divide-and-conquer`
- `decrease-and-conquer`
- `decrease-and-get-conquered`
- `dp-top-down`
- `dp-bottom-up`
- `greedy`
- `backtracking`
- `branch-and-bound`

## Landing paginada

- `/es/examples?page=1`
- `/es/examples?page=2`
- `/es/examples?page=3`
- `/en/examples?page=1`
- `/en/examples?page=2`
- `/en/examples?page=3`

## Subpáginas de ejemplos

- `/es/examples/iterative`
- `/es/examples/divide-and-conquer`
- `/es/examples/decrease-and-conquer`
- `/es/examples/decrease-and-get-conquered`
- `/es/examples/dp-top-down`
- `/es/examples/dp-bottom-up`
- `/es/examples/greedy`
- `/es/examples/backtracking`
- `/es/examples/branch-and-bound`
- `/en/examples/iterative`
- `/en/examples/divide-and-conquer`
- `/en/examples/decrease-and-conquer`
- `/en/examples/decrease-and-get-conquered`
- `/en/examples/dp-top-down`
- `/en/examples/dp-bottom-up`
- `/en/examples/greedy`
- `/en/examples/backtracking`
- `/en/examples/branch-and-bound`

## Rutas legacy con redirect

- `/es/examples/iterativos` -> `/es/examples/iterative`
- `/es/examples/divide-y-venceras` -> `/es/examples/divide-and-conquer`
- `/es/examples/resta-y-venceras` -> `/es/examples/decrease-and-conquer`
- `/es/examples/resta-y-seras-vencido` -> `/es/examples/decrease-and-get-conquered`
- `/es/examples/recursive-expansion` -> `/es/examples/decrease-and-get-conquered`

## Origen técnico

- Ruta principal: `apps/web/src/app/[locale]/examples/page.tsx`
- Ruta por categoría: `apps/web/src/app/[locale]/examples/[category]/page.tsx`
- Contrato del catálogo: `apps/web/src/lib/examples/catalog.ts`
