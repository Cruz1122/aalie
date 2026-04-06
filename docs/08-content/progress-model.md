# Modelo de progreso

**Tipo:** normativa

## Propósito

Cerrar el contrato de progreso para módulos de guía y curso sin interpretaciones distintas entre frontend, contenido y analytics.

## Alcance

Aplica al cálculo de porcentaje por módulo y a la unidad oficial de lectura de v1.

## Fuente de verdad

- `packages/content-catalog/src/progress.ts`
- `packages/content-catalog/catalog/`
- `content-model.md`

## Estructura

### Unidad oficial

- la unidad oficial de progreso es `section`;
- `trackProgress: true` marca secciones que cuentan en el porcentaje;
- `trackProgress: false` permite secciones auxiliares o no evaluables.

### Fórmula oficial

- `completedTrackableSections / totalTrackableSections`
- el porcentaje se redondea al entero más cercano;
- un módulo publicado con cero secciones trackeables es inválido.

### Eventos esperados de UI

- marcar una sección como leída o completada;
- restaurar progreso desde persistencia futura;
- recalcular el progreso al entrar o salir de una sección trackeable.

## Ejemplos

- si un módulo tiene 4 secciones trackeables y 2 completadas, el progreso es `50%`.
- una sección de portada con `trackProgress: false` no altera el denominador.

## Limites conocidos

- v1 no define todavía persistencia contractual entre dispositivos;
- no existe una entidad `page`; si una UI pagina una sección larga, el progreso sigue atado a la sección.

## Archivos relacionados

- `search-indexing.md`
- `content-validation.md`
- `authoring-guide.md`
