# Motor determinista de invariante de ciclo (`loopInvariant`)

Este documento describe la implementación actual del bloque `loopInvariant` en la respuesta de `POST /analyze/open`: qué hace, dónde vive el código, cómo se integra y qué pruebas la cubren.

## Alcance

- **Entrada:** AST del pseudocódigo ya parseado (misma fuente que el análisis de complejidad).
- **Salida:** JSON de forma fija (`LoopInvariantPayload` en backend; `@aa/types` en frontend), **sin LLM**, sin API keys y sin llamadas externas.
- **Enfoque:** evidencia **local** del ciclo elegido (condición, lecturas/escrituras del cuerpo, features estructurales detectadas en el extractor). No se infiere la intención global del algoritmo completo.

## Ubicación en el código

| Pieza | Ruta |
|--------|------|
| Punto de entrada | `app/modules/analysis/invariants/service.py` → `generate_loop_invariant` |
| Selección del ciclo | `app/modules/analysis/invariants/selector.py` |
| Extracción de hechos (features) | `app/modules/analysis/invariants/extractor.py` |
| Clasificación de patrón | `app/modules/analysis/invariants/classifier.py` |
| Plantillas textuales (es/en) | `app/modules/analysis/invariants/templates.py` |
| Tipos y datos de dominio | `app/modules/analysis/invariants/schemas.py` |
| Integración en el análisis | `app/modules/analysis/service.py` → `analyze_algorithm` |

Tras un parseo exitoso, `analyze_algorithm` invoca siempre `generate_loop_invariant(ast, locale=...)`. Si el parseo falla o no hay AST, se devuelve `empty_loop_invariant` con `status=unavailable` y `reason=no_supported_loop`.

### Publicación según `mode`

- **`mode != "all"`:** `loopInvariant` se adjunta al objeto de resultado del caso analizado (p. ej. dentro de `worst` / `best` / `avg` según corresponda).
- **`mode == "all"`:** `loopInvariant` solo aparece en el **nivel superior** de la respuesta (no se duplica dentro de `worst` / `best`).

## Flujo de procesamiento

1. **Selección:** `select_significant_loop` recorre el AST y puntúa cada ciclo (`FOR`, `WHILE`, `REPEAT`) con una función de score determinista; desempata por score, profundidad y orden de aparición.
2. **Extracción:** `extract_loop_facts` construye un `LoopFacts` con límites de línea, variables de control, lecturas/escrituras, acumuladores, comparaciones y lista de features (p. ej. `has_binary_search_interval`, `has_swap_like_update`).
3. **Clasificación:** `classify_loop_pattern` aplica reglas **en orden fijo** (ver siguiente sección) y devuelve un `pattern` y una `confidence` acotada.
4. **Texto:** `resolve_template_variant` elige variante de plantilla; `build_invariant_text` rellena propiedad, inicialización, mantenimiento, finalización y resumen didáctico.
5. **Post-procesado (es):** en locale `es`, `service.py` normaliza acentos en palabras habituales de las plantillas para lectura natural.

## Patrones de clasificación (orden en código)

El orden importa: la primera regla que coincida determina el patrón. Resumen alineado con `classifier.py`:

1. `euclidean_gcd`
2. `partition_by_pivot`
3. `merge_progress`
4. `insertion_prefix_sorted`
5. `selection_prefix_sorted`
6. `binary_search_interval`
7. `sorting_pass` (con escribir en colección)
8. `two_pointer_like`
9. `search`
10. `filter_progress`
11. `field_assignment_progress`
12. `extrema`
13. `binary_exponentiation_state`
14. (forma incompleta de exponenciación binaria → `unknown` con baja confianza)
15. `counting`
16. `accumulation`
17. `prefix_progress`
18. Caso conservador de escrituras a campos de objetos sin señal fuerte → `unknown`
19. `traversal`
20. `loop_progress_only`
21. `state_refinement`
22. `unknown` (evidencia insuficiente)

Los valores de `patternType` en la API coinciden con `PatternType` en `schemas.py` (incluye entre otros `traversal`, `field_assignment_progress` y `loop_progress_only`).

## Política de confianza y estados

- **`status`** puede ser `ok`, `low_confidence` o `unavailable`.
- **`reason`:** `null` | `no_supported_loop` | `insufficient_evidence` | `pattern_not_supported`.
- Se marca **`low_confidence`** cuando, entre otras condiciones: el patrón es `unknown`; la confianza de clasificación es menor que **0.72**; la variante de plantilla es genérica (`unknown`, `state_refinement_generic`, `object_field_refinement`, `incremental_build`, `extrema_generic`); o hay **varios acumuladores** en un patrón `accumulation` (ambigüedad).
- Si el resultado es `low_confidence`, la confianza emitida se **capa a 0.69** como máximo para no mostrar scores casi seguros cuando el texto es conservador.

## Contrato JSON (`loopInvariant`)

Campos principales: `status`, `reason`, `selectedLoop` (incluye `patternType`, `nodeType`, líneas, variables, puntuación), `invariant` (cuatro secciones de texto), `didacticSummary`, `evidence` (lecturas, escrituras, `templateVariant`, `classificationConfidence`, `detectedFeatures`).

## Determinismo

Para el mismo par `(source, locale)` la salida es estable: recorrido fijo del AST, reglas y umbrales constantes, desempates estrictos, listas ordenadas al serializar.

## Limitaciones conocidas

- Prioriza el **ciclo más significativo** localmente, no necesariamente el que un humano elegiría en todo contexto.
- Bucles ambiguos o plantillas genéricas producen `low_confidence` en lugar de forzar una interpretación fuerte.
- No se usa el texto fuente con regex para inferir el invariante principal; la inferencia es por AST.

## Pruebas

La calidad del motor se valida con tests **versionados en código**, no con un conjunto externo de benchmark en el repo:

- **Unitarios:** `apps/api/tests/unit/analysis/test_loop_invariant_*.py` (selector, extractor, clasificador, plantillas, servicio).
- **Sistema (HTTP):** `apps/api/tests/system/test_loop_invariant_endpoint.py` — forma del payload, casos representativos por patrón, estabilidad y regresiones de redacción (p. ej. evitar mencionar `A[` cuando no hay arreglo).

## Extender el motor

1. Añadir o ajustar reglas en `classifier.py` (prioridad explícita).
2. Ampliar features en `extractor.py` si hace falta nueva señal.
3. Añadir copy en `templates.py` para `es` y `en`.
4. Mantener `schemas.py` y tipos compartidos (`packages/types`) alineados.
5. Añadir o actualizar pruebas unitarias y de sistema.

## Referencias

- Modelos de respuesta: [models.md](./models.md) (`LoopInvariant`, `LoopInvariantPayload`).
- Endpoints: [endpoints.md](./endpoints.md).
