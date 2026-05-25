# ADR-010: Motor determinista como núcleo de análisis

**Tipo:** decisión
**Estado:** aceptada
**Fecha:** 2026-05-18
**Fuente de verdad:** `apps/api/app/modules/analysis/` (analyzers, while_engine, visitors), `apps/api/app/modules/analysis/analyzers/registry.py`

## Contexto

Durante la fase de exploración temprana se consideró el uso directo de LLMs (GPT-4, Claude, etc.) para inferir complejidad asintótica a partir de pseudocódigo. Los prototipos mostraron que los LLMs producían resultados inconsistentes: acertaban en casos clásicos (merge sort, binary search) pero fallaban o alucinaban en casos con ambigüedad sintáctica, WHILE no triviales, o recurrencias con formas híbridas. El equipo evaluó si la ruta LLM-first era viable como núcleo del análisis.

## Decisión

El análisis de complejidad usa un motor determinista basado en reglas — Strategy pattern + Visitors + SymPy — no un LLM. El LLM queda relegado a soporte pedagógico opcional.

- El pipeline de análisis (`parse → classify → analyze → trace`) nunca invoca un LLM.
- La inferencia de recurrencia, detección de técnica, clasificación de WHILE, y simplificación simbólica usan AST concreto, reglas de detección por patrón, y `sympy.rsolve` para recurrencias lineales.
- El motor produce resultados deterministas: mismo pseudocódigo → mismo `T_open`, misma `Theta`, mismo bundle paso a paso.
- El LLM solo aparece en el módulo `/llm/*` como asistente opcional para explicaciones y comparación pedagógica.

## Alternativas consideradas

- **LLM como analizador principal**: Prototipado y rechazado por inconsistencia, alucinación de cotas, dependencia de API externa, costo por request, y falta de trazabilidad.
- **LLM + verificador simbólico**: El LLM propone cota y SymPy la verifica. Rechazado porque el verificador no puede confirmar la corrección sin la recurrencia subyacente, que el LLM también debe producir.
- **Híbrido con fallback**: Usar motor determinista y caer a LLM cuando el motor es inconcluso. Rechazado porque crea falsa sensación de completitud y rompe la consistencia contractual del snapshot.

## Consecuencias positivas

- Resultados deterministas y trazables: cada paso del análisis se puede inspeccionar y validar.
- Sin dependencia de API externa para el análisis principal; funciona offline.
- Costo operativo predecible (CPU, sin tokens).
- El snapshot es reproducible sin variación entre ejecuciones.

## Consecuencias negativas

- Cobertura limitada a formas soportadas por las reglas del motor: WHILE con patrones no reconocidos, recurrencias no lineales, y algoritmos con estado complejo quedan como `unsupported` o `partial`.
- El motor requiere mantenimiento continuo para ampliar cobertura (nuevos patrones WHILE, nuevas familias de recurrencia).
- La curva de desarrollo del motor es más larga que delegar en un LLM.

## Impacto en mantenimiento

- Cualquier nuevo patrón de WHILE o familia de recurrencia requiere implementar reglas de detección y validación en el motor.
- Los tests de análisis deben cubrir casos positivos, negativos, y límite; no se puede "mejorar" el análisis ajustando un prompt.
- El módulo LLM y el motor de análisis pueden evolucionar de forma independiente.

## Evidencia

- `apps/api/app/modules/analysis/analyzers/`: `IterativeAnalyzer`, `RecursiveAnalyzer`, `MasterTheoremAnalyzer`, `CharacteristicEquationAnalyzer`, etc. — todos implementan `BaseAnalyzer.analyze()` sin llamadas LLM.
- `apps/api/app/modules/analysis/while_engine/patterns/`: 12 patrones WHILE con detección por AST, no por LLM.
- `apps/api/app/modules/analysis/analyzers/base.py`: `BaseAnalyzer` define interfaz común; ningún analizador concreto importa del módulo `llm`.
- El `registry.py` mapea `algorithm_kind` a analizador sin opción LLM.

## Archivos relacionados

- `adr-003-conservative-while-heuristics.md`
- `adr-004-tests-as-oracles.md`
- `adr-006-llm-as-optional-assistant.md`
- `../03-specs/analysis-engine-spec.md`
- `../03-specs/recurrence-methods-spec.md`
