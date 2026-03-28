# API de parseo

**Tipo:** normativa

## Propósito

Definir el contrato de parseo de pseudocodigo y su proxy frontend.

## Alcance

Cubre `/grammar/parse` y `/api/grammar/parse`.

## Fuente de verdad

- `apps/api/app/modules/parsing/router.py`
- `apps/web/src/app/api/grammar/parse/route.ts`

## Estructura

### Endpoint backend

- path: `/grammar/parse`
- method: `POST`
- consumidor principal: worker de parseo y flujo del analizador

### Request

Acepta compatibilidad con:

```json
{ "source": "..." }
```

o

```json
{ "input": "..." }
```

### Response

```json
{
  "ok": true,
  "available": true,
  "runtime": "python",
  "error": null,
  "ast": {},
  "errors": []
}
```

### Errores

- parse invalido: `ok=false`, `errors[]`
- fallo del backend: `500`
- proxy con respuesta inesperada: `502`

### Compatibilidad

- el backend conserva compatibilidad `input | source`;
- el proxy Next hoy entrega `input`.

## Ejemplos

```json
{
  "source": "factorial(n) BEGIN RETURN 1; END"
}
```

## Limites conocidos

- `ok=true` solo garantiza AST valido, no cobertura posterior del analizador.

## Archivos relacionados

- `schemas/parse-schema.md`
- `../03-specs/pseudocode-grammar-spec.md`
- `../03-specs/ast-schema.md`
