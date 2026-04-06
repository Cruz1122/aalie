# API de clasificación

**Tipo:** normativa

## Propósito

Fijar el contrato de clasificación de algoritmo y su uso desde frontend.

## Alcance

Cubre `/classify` y `/api/llm/classify`.

## Fuente de verdad

- `apps/api/app/modules/classification/router.py`
- `apps/api/app/modules/classification/service.py`
- `apps/web/src/app/api/llm/classify/route.ts`

## Estructura

### Endpoint backend

- path: `/classify`
- method: `POST`
- consumidor principal: BFF `llm/classify` y flujo del analizador

### Request

```json
{ "source": "..." }
```

o

```json
{ "ast": {} }
```

### Response

```json
{
  "ok": true,
  "kind": "iterative|recursive|hybrid|unknown",
  "method": "ast"
}
```

### BFF `/api/llm/classify`

- usa backend Python como fuente única de verdad;
- `mode="llm"` esta deshabilitado;
- retorna `kind`, `method` y `timestamp`.

## Ejemplos

- enviar AST ya parseado evita parseo redundante en el backend.

## Limites conocidos

- clasificación usa AST heurístico, no LLM;
- el BFF existe por consumo frontend, no porque la clasificación sea parte del subsistema LLM.

## Archivos relacionados

- `schemas/classification-schema.md`
- `analysis-api.md`
- `../03-specs/analysis-engine-spec.md`
