# Proceso de release

**Tipo:** descriptiva

## Propósito

Definir el mínimo proceso de cierre para cambios que afectan contratos técnicos.

## Alcance

Cubre cambios en parser, análisis, trace, snapshot, export, APIs, docs críticas y el release automatizado ARM64 hacia OCI.

## Fuente de verdad

- CI del repo
- `.github/workflows/arm64-validation.yml`
- `infra/oci/`
- política documental y de tests

## Estructura

### Checklist mínimo

1. actualizar código y docs contractuales en el mismo cambio;
2. ejecutar tests relevantes;
3. pasar `docs-contracts`;
4. revisar impacto en export y APIs si cambia snapshot o payload;
5. registrar ADR si la decisión cambia un principio estable.
6. al integrar en `main`, dejar que ARM64 validation construya y pruebe las imágenes;
7. publicar API/web en GHCR con el SHA exacto;
8. desplegar mediante el Environment `Production – aalie` y su forced command;
9. exigir readiness interna y smoke funcional público antes de considerar cerrado el release.

## Ejemplos

- cambiar `SNAPSHOT_SCHEMA_VERSION` exige código, spec, checks y nota de compatibilidad.

## Límites conocidos

- No existe un entorno staging equivalente a OCI; `infra/compose.prod.yml` es el gate de integración productiva.
- La guía canónica de operación y rollback es `production-oci.md`; este documento resume el flujo de release.

## Archivos relacionados

- `../05-quality/ci-cd.md`
- `../09-decisions/`
- `production-oci.md`
