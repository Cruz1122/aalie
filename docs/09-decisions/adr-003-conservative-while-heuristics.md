# ADR-003: Heuristica conservadora para WHILE

**Tipo:** normativa

## Propósito

Registrar que el tratamiento de WHILE privilegia conclusiones defendibles sobre cobertura agresiva.

## Alcance

Aplica a la detección de variable de control, progreso, terminación y conteo de iteraciones.

## Fuente de verdad

- `apps/api/app/modules/analysis/while_engine/`
- tests contract de WHILE

## Estructura

### Decision

- El motor solo concluye cuando hay evidencia suficiente.
- Ante ambiguedad, retorna resultado parcial, advertencia o estado no concluyente.
- No se permite “adivinar” comportamiento para sostener una cota bonita.

## Ejemplos

- WHILE lineal y logarítmico con actualización monótona: soportados.
- WHILE con progreso no demostrable o dependencias complejas entre varias variables: no concluyente o no soportado.

## Limites conocidos

- Esta decisión reduce cobertura aparente en algunos casos, pero protege export, tests y mantenimiento.

## Archivos relacionados

- `../03-specs/while-heuristics-spec.md`
- `../01-product/known-limitations.md`
