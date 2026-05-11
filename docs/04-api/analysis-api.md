# API de análisis

**Tipo:** normativa

## Propósito

Documentar el contrato de análisis principal y la detección de métodos.

## Alcance

Cubre `/analyze/open`, `/analyze/detect-methods` y sus proxies Next.

## Fuente de verdad

- `apps/api/app/modules/analysis/router.py`
- `apps/api/app/modules/analysis/schemas.py`
- `apps/web/src/app/api/analyze/`

## Estructura

### `POST /analyze/open`

- path: `/analyze/open`
- method: `POST`
- consumidor principal: pagina del analizador

#### Request

```json
{
  "source": "...",
  "mode": "worst|best|avg|all",
  "algorithm_kind": "iterative|recursive|hybrid|unknown",
  "preferred_method": "master|iteration|recursion_tree|characteristic_equation",
  "avgModel": {
    "mode": "uniform|symbolic",
    "predicates": {}
  },
  "locale": "es|en"
}
```

#### Response

- `mode != all`: objeto de caso con `byLine`, `totals`, `loopInvariant`
- `mode = all`: envelope con `worst`, `best`, `avg?`, `has_case_variability`, `loopInvariant`

#### Notas de compatibilidad

- `loopInvariant` es parte del contrato;
- `best` y `avg` pueden ser `"same_as_worst"` cuando el algoritmo es deterministico;
- `api_key` sigue existiendo por compatibilidad pero el flujo principal no depende de ella.

### `POST /analyze/detect-methods`

- path: `/analyze/detect-methods`
- method: `POST`
- consumidor principal: selector de método recursivo y validación de ejemplos

#### Request

```json
{
  "source": "...",
  "algorithm_kind": "recursive|hybrid"
}
```

#### Response

```json
{
  "ok": true,
  "applicable_methods": ["master", "recursion_tree"],
  "default_method": "master",
  "recurrence_info": {
    "method_outcomes": {
      "master": {
        "applicable": true,
        "recommended": true,
        "bound_kind": "equivalent"
      }
    }
  }
}
```

## Ejemplos

- `mergeSort` puede devolver `master`, `recursion_tree` y `iteration` con `default_method=master`.
- `factorial` puede priorizar `characteristic_equation` o `iteration` según forma detectada.
- `method_outcomes` permite explicar si cada método da una cota equivalente, superior, inferior o parcial sin confundir aplicabilidad con fuerza del resultado.

## Limites conocidos

- si el algoritmo no es recursivo, `detect-methods` debe fallar explícitamente;
- un método aplicable puede producir bundle parcial si la cobertura simbólica no es total.

## Archivos relacionados

- `schemas/analysis-schema.md`
- `../03-specs/analysis-engine-spec.md`
- `../03-specs/recurrence-methods-spec.md`
