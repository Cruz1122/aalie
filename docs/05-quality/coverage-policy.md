# Política de cobertura

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `.github/workflows/ci.yaml`, `apps/api/pyproject.toml`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** testing-strategy, ci-cd

## Propósito

Fijar el umbral de cobertura y evitar que la cobertura se use como métrica vacía.

## Alcance

Aplica al backend de la API (`apps/api/app/`) en el job `test-pr-gate` de CI.

## Umbral

| Métrica | Valor | Dónde se aplica |
|---|---|---|
| Cobertura global mínima | **70%** | CI job `test-pr-gate`: `pytest -m "fast or oracle" --cov=app --cov-fail-under=70` |
| Objetivo operativo | **70–75%+** | Esfuerzo continuo del equipo |

## Qué se mide

- **Source:** `app/` (todo el código fuente de la API).
- **Omisiones:** `*/tests/*`, `*/__pycache__/*`, `*/migrations/*`.
- **Líneas excluidas del reporte:** `pragma: no cover`, `__repr__`, `raise AssertionError`, `raise NotImplementedError`, `if __name__`, `TYPE_CHECKING`, `Protocol`, `abstractmethod`.

## Qué NO se mide

| Componente | Razón |
|---|---|
| Frontend (`apps/web/`) | Framework diferente (Next.js), cobertura no unificada |
| Packages (`packages/`) | Librerías compartidas, probadas individualmente |
| Scripts (`scripts/`) | Herramientas de desarrollo/CI |
| Infraestructura (`infra/`) | Configuración Docker/despliegue |
| Código generado | Generación automática, no cubierta por pytest |

## Cómo leer el reporte

Ejecutar:

```
pnpm test:api:cov
# o
python -m pytest tests/ --cov=app --cov-report=term
```

El reporte muestra porcentajes por módulo. Priorizar:

1. **Módulos de análisis** (`app/modules/analysis/`) — el core del motor
2. **Módulos de export** (`app/modules/export/`) — snapshot, PDF, LaTeX
3. **Módulos de quizzes** (`app/modules/quizzes/`) — banco de preguntas, evaluación
4. **Módulos de gramática** (`app/grammar/`) — parser y AST

Buscar módulos por debajo del 70% y añadir tests para las rutas no cubiertas.

## Qué hacer si la cobertura falla

1. Identificar los módulos con menor cobertura en el reporte HTML (`htmlcov/index.html`).
2. Añadir tests para las rutas no cubiertas — preferiblemente oráculos semánticos (`oracle` marker) o tests de contrato (`contract` marker).
3. **No bajar el umbral.** 70% es un piso mínimo; el objetivo es mantener o subir.

## Lanes sin cobertura

| CI Job | Cobertura | Razón |
|---|---|---|
| `test-extended-lanes` | No medida | Tests no bloqueantes, continue-on-error |
| `test-nightly-lanes` | No medida | Solo programado, tests pesados |

## Regla semántica

Cobertura sin oráculo útil no cuenta como cierre de calidad. Subir cobertura con asserts superficiales en helpers sin proteger el contrato no es suficiente. Un test que solo verifica `result.get("ok")` sin comparar la notación asintótica esperada infla cobertura pero no valida el motor.

## Límites conocidos

- La cobertura global no reemplaza tests de contrato para dominios complejos (WHILE, recurrencias, DP).
- Los benchmarks y tests de estrés no contribuyen a la cobertura.
- La cobertura mide líneas ejecutadas, no calidad semántica de las aserciones.

## Archivos relacionados

- `testing-strategy.md`
- `algorithm-oracles.md`
- `ci-cd.md`
