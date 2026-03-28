# Troubleshooting

**Tipo:** descriptiva

## Propósito

Reunir fallos recurrentes y su diagnóstico mínimo.

## Alcance

Cubre parser, grammar, CORS, puertos, env vars, LLM y PDF.

## Fuente de verdad

- configuración del repo;
- errores frecuentes observables en rutas, tests y Docker.

## Estructura

### Parser / grammar

- Sintoma: parse falla siempre.
- Revisar: instalacion de `packages/grammar/py`, artefactos generados, cambio reciente en `Language.g4`.
- Si se regeneran parsers Python: verificar Java solo para ese paso.

### CORS

- Sintoma: navegador bloquea requests.
- Revisar: `CORS_ENABLED`, `CORS_ALLOWED_ORIGINS`, `DEV_ALLOWED_ORIGINS`.

### Puertos

- web default `3000`
- api default `8000`
- revisar colisiones locales o mapeos Docker.

### Env vars

- LLM no responde: revisar `API_KEY`, `GEMINI_ENDPOINT_BASE`, `LLM_MODEL_*`.
- proxies Next apuntan mal: revisar `API_BASE_URL`, `API_INTERNAL_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`.

### PDF / LaTeX

- Sintoma: `export/report` falla al generar PDF.
- Revisar: `pdflatex` instalado, logs de compilacion, assets LaTeX.

## Ejemplos

- si Markdown exporta pero PDF no, el problema suele estar en toolchain TeX, no en snapshot.

## Limites conocidos

- algunos fallos del proveedor LLM solo pueden reproducirse con la misma key/cuota del entorno afectado.

## Archivos relacionados

- `environment-variables.md`
- `deployment.md`
- `../../03-specs/export-engine-spec.md`
