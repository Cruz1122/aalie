# Proceso de release

**Tipo:** descriptiva

## Propósito

Definir el mínimo proceso de cierre para cambios que afectan contratos técnicos.

## Alcance

Cubre cambios en parser, análisis, trace, snapshot, export, APIs y docs críticas.

## Fuente de verdad

- CI del repo
- politica documental y de tests

## Estructura

### Checklist mínimo

1. actualizar código y docs contractuales en el mismo cambio;
2. ejecutar tests relevantes;
3. pasar `docs-contracts`;
4. revisar impacto en export y APIs si cambia snapshot o payload;
5. registrar ADR si la decisión cambia un principio estable.

## Ejemplos

- cambiar `SNAPSHOT_SCHEMA_VERSION` exige código, spec, checks y nota de compatibilidad.

## Limites conocidos

- este repo no documenta aqui un pipeline de publicacion externa automatizada; el foco es coherencia contractual interna.

## Archivos relacionados

- `../05-quality/ci-cd.md`
- `../09-decisions/`
