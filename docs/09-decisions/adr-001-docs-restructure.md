# ADR-001: Reestructura documental contractual

**Tipo:** normativa

## Propósito

Registrar la decisión de sustituir la documentación histórica dispersa por una estructura modular, versionable y operacional.

## Alcance

Aplica a toda la carpeta `/docs` y a la politica de mantenimiento documental del repo.

## Fuente de verdad

- `docs/README.md`
- `scripts/check_docs_contracts.py`
- `.github/workflows/ci.yaml`

## Estructura

### Decision

- `/docs` se organiza por producto, arquitectura, specs, API, calidad, operaciones, usuario, contenido y ADRs.
- Toda doc nueva usa plantilla fija y etiqueta visible.
- Los documentos viejos dejan de ser fuente de verdad y se eliminan tras migracion.

### Consecuencias

- cambios de contratos críticos exigen cambios documentales en el mismo PR;
- la navegacion principal arranca en `docs/README.md`;
- el repo gana un check automatizado para contratos documentales.

## Ejemplos

- Un cambio en `/analyze/open` requiere actualizar `04-api/analysis-api.md` y, si cambia semántica, también la spec relevante.

## Limites conocidos

- La reestructura no convierte toda la documentación en código generado; sigue siendo texto mantenido manualmente con checks automatizados.

## Archivos relacionados

- `../README.md`
- `adr-007-versioned-schemas.md`
