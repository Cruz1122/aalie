# Schema de análisis

**Tipo:** normativa

## Propósito

Documentar las formas principales del request y response de análisis.

## Alcance

Schema documental para `/analyze/open` y `/analyze/detect-methods`.

## Fuente de verdad

- `apps/api/app/modules/analysis/schemas.py`
- `packages/types/src/index.ts`

## Estructura

### Request `AnalyzeRequest`

- `source: string`
- `mode?: "worst" | "best" | "avg" | "all"`
- `avgModel?: { mode, predicates? }`
- `algorithm_kind?: string`
- `preferred_method?: string`
- `locale?: "es" | "en"`

### Response `AnalyzeOpen`

- `ok`
- `byLine[]`
- `totals`
- `loopInvariant`

### Response `AnalyzeAll`

- `ok`
- `has_case_variability`
- `worst`
- `best | "same_as_worst"`
- `avg | "same_as_worst"`
- `loopInvariant`

### Response `DetectMethods`

- `ok`
- `applicable_methods[]`
- `default_method`
- `recurrence_info`

## Ejemplos

- payload `mode=all`
- response con `best="same_as_worst"`

## Limites conocidos

- `totals` es extensible y puede incluir bundles específicos por método.

## Archivos relacionados

- `../analysis-api.md`
- `../../03-specs/recurrence-methods-spec.md`
