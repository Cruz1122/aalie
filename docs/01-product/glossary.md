# Glosario

**Tipo:** descriptiva

## Propósito

Fijar el significado operativo de los términos usados por el producto, el motor y la documentación.

## Alcance

Incluye términos de análisis, trazas, snapshot, export y asistencia LLM.

## Fuente de verdad

- tipos compartidos en `packages/types/`;
- respuestas reales de `analysis`, `trace` y `export`;
- contratos en `03-specs/` y `04-api/`.

## Estructura

| Término | Significado operativo |
| --- | --- |
| `T_open` | forma abierta de la función de costo producida por el analizador |
| `T_polynomial` | simplificación algebraica de `T_open` cuando el motor la puede cerrar |
| `byLine` | tabla por línea con costo elemental, número de ejecuciones y notas |
| `avgModel` | configuración del caso promedio para análisis probabilístico |
| `loopInvariant` | artefacto determinista asociado al ciclo más significativo encontrado en el AST |
| `trace` | rastro de ejecución paso a paso con pasos, resumen y diagnósticos |
| `structuredTrace` | representación estructurada derivada del trace para diagrama y clasificación |
| `seguimiento manual guiado` | modo pedagógico donde la UI avanza por pasos o niveles usando el mismo trace contractual sin reinterpretarlo |
| `callTreeSource` | árbol de llamadas recursivas usado por UI y export |
| `snapshot` | objeto versionado que concentra input, metadatos, resultados, trazas y advertencias |
| `contentHash` | hash estable del snapshot normalizado |
| `snapshotId` | identificador estable del snapshot para el mismo estado de análisis |
| `método aplicable` | método recursivo que el detector considera defendible para la recurrencia observada |
| `conclusivo` | resultado cuyo contrato y soporte entran en cobertura actual del motor |
| `no concluyente` | resultado parcial, no soportado o con advertencias suficientes para impedir afirmaciones fuertes |
| `normativa` | doc que fija contrato obligatorio |
| `descriptiva` | doc que explica el sistema actual sin crear contrato nuevo |
| `legacy` | doc histórica retirada del flujo principal |

## Ejemplos

- Si `loopInvariant.status = low_confidence`, el sistema no debe venderlo como conclusión fuerte.
- Si el export cambia pero el snapshot no cambia, el problema está en render, no en análisis.

## Limites conocidos

- Algunos términos conservan nombres en inglés porque así existen en tipos, APIs y exports.

## Archivos relacionados

- `vision.md`
- `../03-specs/analysis-engine-spec.md`
- `../03-specs/report-snapshot-spec.md`
