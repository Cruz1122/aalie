# Estrategia de pruebas

**Tipo:** normativa

## Propósito

Definir cómo se valida AALIE en capas y qué significa una prueba útil en este repo.

## Alcance

Aplica a backend, contratos, sistema, examples catalog y checks documentales.

## Fuente de verdad

- `apps/api/tests/README.md`
- `.github/workflows/ci.yaml`
- `apps/web/package.json`

## Estructura por carriles

### Lanes backend (`apps/api/tests`)

- `fast`: feedback rápido para PR y desarrollo.
- `oracle`: capacidad real del motor con expected semántico.
- `contract`: invariantes del contrato público (shape/estados/coherencia).
- `system`: validación HTTP/end-to-end.
- `slow`: integraciones legítimamente costosas.
- `stress`: estrés representativo, fuera del gate rápido.
- `export`: pruebas de export (incluye PDF real).
- `benchmark`: medición de rendimiento (no correctness profunda).
- `web`: tests de componentes/utilidades frontend.

### Markers de dominio

- `iterative`, `recursive`, `while_loop`, `trace`, `dp`, `export`.

### Regla central

Las pruebas críticas deben ser auténticas: `input -> expected output real`, no solo “no explota”.

## Patrón estándar obligatorio

- cada test valida una hipótesis principal;
- cada test usa la ruta mínima necesaria para esa hipótesis;
- cada test declara si valida: oráculo funcional, contrato estructural, artefacto auxiliar, integración completa o benchmark;
- queda prohibido mezclar en un solo test corrección matemática + shape contractual + rendimiento + export + metadatos auxiliares.

### Regla de oráculos

- el expected de referencia debe vivir en forma estructurada, no solo como comentario narrativo;
- cuando el resultado sea simbólico, la comparación debe priorizar equivalencia semántica o shape contractual antes que igualdad textual frágil;
- cuando el resultado sea textual o enumerado, la comparación puede ser exacta;
- los tests deben declarar si validan: igualdad exacta, equivalencia simbólica, presencia de campos requeridos o estado contractual (`available`, `partial`, `unsupported`);
- si un resultado correcto es inconcluso, el oráculo debe esperarlo explícitamente.

### Equivalencia simbólica operativa

- la equivalencia simbólica debe evaluarse con la misma base algebraica que usa el motor en backend, prioritariamente SymPy.
- regla preferida: dos expresiones son equivalentes si su diferencia simplificada se reduce a cero bajo el dominio esperado del problema.
- si la simplificación exacta no cierra, se permite comparar shape contractual o clase asintótica esperada, pero el test debe declararlo explícitamente.
- no existe tolerancia numérica por defecto para expresiones simbólicas exactas; las tolerancias solo aplican a aproximaciones o verificaciones numéricas auxiliares y deben declararse en el test.
- cuando se use validación numérica complementaria, los puntos de muestreo deben ser positivos, consistentes con el dominio del algoritmo y no sustituir una equivalencia simbólica exacta disponible.

### Distribución por responsabilidad

- parser/AST: `fast` + `contract` + `system` (parse).
- clasificación y análisis: `oracle` + `contract` + `system`.
- WHILE y recurrencias: `oracle` + `contract` obligatoria.
- trace y export: `contract` + `system`; PDF real en `slow + export`.
- ejemplos: validación dedicada del catálogo

### Formato mínimo de expected

- parser/AST: shape mínimo esperado del nodo raíz y errores esperados;
- análisis iterativo: `byLine`, `T_open`/forma principal, notaciones y estado por caso;
- análisis recursivo: familia detectada, `default_method`, métodos aplicables, recurrencia y estado del bundle;
- WHILE: patrón, `iterations_expr` o estado inconcluso, clase asintótica y evidencia esperada;
- trace: kind, cantidad/orden básico de pasos y shape de `structuredTrace`;
- export/snapshot: `schemaVersion`, coherencia entre secciones y presencia de bloques obligatorios.

## Ejemplos

- `mergeSort` y `factorial` como algoritmos canónicos recursivos.
- `while_linear` y `euclides` como oraculos WHILE.

## Limites conocidos

- algunos resultados correctos son `partial` o `unsupported`; la prueba debe reflejar eso, no forzar certeza inexistente.

## Ejecución y paralelismo

### Regla operativa

`pytest-xdist` es obligatorio en CI y recomendado localmente.  
Todos los lanes deben correr en paralelo con `-n auto --dist=worksteal`.

### Comandos oficiales (backend)

Desde `apps/api`:

- PR gate (bloqueante): `python -m pytest tests/ -n auto --dist=worksteal -m "fast or oracle" --cov=app --cov-report=term`
- validación ampliada (no bloqueante): `python -m pytest tests/ -n auto --dist=worksteal -m "fast or oracle or contract or system" -q`
- nightly/release: `python -m pytest tests/ -n auto --dist=worksteal -m "slow or stress or export or benchmark" -q`

Si el entorno no tiene `xdist`, instalar: `pip install pytest-xdist`.

## Archivos relacionados

- `algorithm-oracles.md`
- `coverage-policy.md`
- `ci-cd.md`
