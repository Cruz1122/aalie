# Especificación de heurísticas WHILE

**Tipo:** normativa

## Propósito

Formalizar cómo AALIE analiza ciclos `WHILE` y qué decisiones son defendibles hoy.

## Alcance

Aplica al `while_engine`, a la clasificación de patrones y al payload usado por visitors/análisis.

## Fuente de verdad

- `apps/api/app/modules/analysis/while_engine/`
- tests contract `test_while_algorithms.py`, `test_while_loop_notation.py`, `test_while_metamorphic.py`

## Estructura

### Patrones soportados hoy

- `linear_counter`
- `geometric_growth`
- `flag_kill`
- `euclid_mod`
- `binary_search_interval`

### Política de decisión

- si un patrón coincide con evidencia suficiente, su cota es autoritativa;
- si no hay prueba fuerte, el engine retorna `bounded`, `unbounded`, `unknown` o `not_proven` según evidencia disponible;
- nunca se adivina una cota para cerrar un hueco.

### Ranking de evidencia

- `strong`: guard interpretable, variable de control identificada, regla de actualización monotónica, dirección compatible con el guard y límite inferible. Autoriza clase asintótica y `iterations_expr`.
- `medium`: patrón reconocible con alguna ambigüedad local pero sin contradicción estructural. Autoriza salida parcial o `bounded` con advertencia, no una conclusión fuerte completa.
- `weak`: hay señales de progreso pero no prueba suficiente de controlador dominante o de terminación. Autoriza `unknown` o `not_proven`.
- `contradictory`: guard, actualización y progreso chocan entre sí. Autoriza rechazo del patrón o `unbounded/not_proven`, nunca cierre optimista.

Evidencia suficiente, a efectos contractuales, significa al menos nivel `strong`.

### Desempate entre patrones fuertes

- si dos patrones alcanzan `strong`, no gana “el primero” por orden incidental de implementación.
- el desempate debe seguir esta prioridad contractual: patrón más específico del dominio > patrón con menos supuestos implícitos > patrón con evidencia sobre una variable de control dominante única.
- si dos patrones fuertes siguen empatados después de esa prioridad, el engine debe degradar a salida parcial o registrar ambigüedad explícita en `diagnostics`; no puede elegir arbitrariamente.
- `binary_search_interval` prevalece sobre `geometric_growth` cuando ambos describen el mismo loop pero el guard y las actualizaciones evidencian reducción de intervalo de búsqueda.

### Casos por modo

- `best`: puede aceptar `flag_kill` con una sola iteración cuando la bandera se mata en el camino correspondiente;
- `worst` y `avg`: no aceptan el mismo atajo si el flag puede revivir.

## Inputs

- `while_node`
- `parent_context`
- `procedure_context`
- `mode`
- `symbol_table`
- `global_analysis_ctx`

## Outputs

- `status`
- `termination`
- `iterations_expr`
- `asymptotic_class`
- `dominant_controller`
- `pattern_used`
- `reason_code`
- `diagnostics`
- payload compatible con visitor: `variable`, `limit`, `change_rule`, `operator`, `evidence`, `evidence_level`

## Invariantes

- el guard se analiza antes que las actualizaciones;
- las variables asignadas en el cuerpo se usan para reforzar evidencia de control;
- el orden interno de evaluación no define por sí solo el patrón ganador;
- una coincidencia de patrón no autoriza extrapolar a casos no demostrados.

## Errores esperables

- guard no interpretable;
- ausencia de actualizaciones relevantes;
- progreso no demostrable;
- contradicción entre actualizaciones y condición.

## Ejemplos

### Ejemplos validos

```text
linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    i <- i + 1;
  END
END
```

```text
logLoop(n) BEGIN
  i <- 1;
  WHILE (i <= n) DO BEGIN
    i <- i * 2;
  END
END
```

### Ejemplos no soportados

```text
weird(n, m) BEGIN
  WHILE (i < n OR j < m) DO BEGIN
    i <- i + j;
    j <- j - i;
  END
END
```

```text
unknownLoop(n) BEGIN
  WHILE (condicionExterna()) DO BEGIN
    actualizarEstado();
  END
END
```

## Limites conocidos

- el soporte actual cubre patrones frecuentes, no una demostración general de terminación;
- loops con varias variables acopladas y progreso no monótono pueden quedar en estado no concluyente.

## Archivos relacionados

- `analysis-engine-spec.md`
- `../09-decisions/adr-003-conservative-while-heuristics.md`
- `../04-api/analysis-api.md`
