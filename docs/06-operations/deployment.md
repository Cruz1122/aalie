# Despliegue

**Tipo:** descriptiva

## Propósito

Explicar como se ejecuta AALIE en local, Docker y runtime productivo compatible con export PDF.

## Alcance

Cubre imagen API, imagen web y dependencias de export.

## Fuente de verdad

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `infra/docker-compose.yml`

## Estructura

### Local

- web y api pueden correrse por separado con `pnpm` y `uvicorn`.

### Docker

- `api` usa imagen Python 3.11 con TeX instalado;
- `web` usa Node 22 Alpine y corre Next en dev.

### Produccion compatible

- la API debe incluir `pdflatex` y paquetes TeX requeridos;
- el frontend debe conocer la URL interna/externa del backend;
- si se usa LLM servidor, `API_KEY` debe estar disponible del lado server.

## Ejemplos

- despliegue mínimo para export PDF: backend con toolchain TeX y assets LaTeX accesibles.

## Limites conocidos

- la imagen web actual está orientada a desarrollo; si se endurece para producción, la doc debe actualizarse junto con el Dockerfile.

## Archivos relacionados

- `environment-variables.md`
- `troubleshooting.md`
- `../../03-specs/export-engine-spec.md`
