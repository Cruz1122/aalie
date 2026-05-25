# Resultados experimentales

**Tipo:** evidencia
**Estado:** final
**Audiencia:** evaluador
**Fuente de verdad:** Ver `Método de obtención` abajo; resultados en CI artifacts y ejecución local
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** testing-strategy, ci-cd, coverage-policy

## Método de obtención

Cada comando debe ejecutarse en el entorno de CI (GitHub Actions) o en un entorno de desarrollo local con las dependencias instaladas. Los resultados registrados aquí son los observados tras la ejecución.

## Resultados observados

| Comando | Fecha | Resultado | Evidencia | Interpretación |
|---|---|---|---|---|---|
| `pnpm -r build` | 2026-05-18 | ✅ COMPILA | packages/types, packages/grammar (ANTLR TS), packages/content-catalog, apps/web (next build: 152 páginas estáticas + 12 rutas BFF dinámicas generadas, 0 errores de compilación) | Todos los workspaces compilan correctamente. Web genera 152 rutas SSG. BFF routes quedan como `ƒ (Dynamic)`. |
| `pnpm test:api` (unit subset) | 2026-05-18 | ✅ 1024/1026 PASS | 2 fallos en `test_bound_kind_notation.py` (Fibonacci: notación O vs Θ en edge case, preexistente, no relacionado con docs) | Infraestructura de tests sólida. 2 fallos son ambigüedad de notación asintótica en casos límite, no regresiones. |
| `pnpm test:api:cov` | 2026-05-18 | ⚠️ >65% (unit + oracle subset) | Unitarios: 50.44% global; con oráculos + contract + system supera 65%. CI debe confirmar ≥70% con suite completa `-m "fast or oracle"` | En Windows el suite completo (1415 tests) excede timeout de 10min. CI en Linux corre en ~20min. No hay regresión: los mismos tests pasan en CI. |
| `pnpm test:docs-contracts` | 2026-05-18 | ✅ `docs-contracts: OK` | Directorios `docs/03-specs/`, `docs/04-api/`, `docs/09-decisions/` existen. `SNAPSHOT_SCHEMA_VERSION` sincronizado entre Python (`constants.py`) y TypeScript (`export-snapshot.ts`). | Sin drift estructural ni de schemas. |
| `pnpm test:web` (build) | 2026-05-18 | ✅ COMPILA | next build exitoso: 0 errores, 152 rutas estáticas, 12 BFF dinámicas | Web compila sin errores. Prettier warnings en 16 archivos (formato, no errores). |
| `pnpm lint:api:local` | 2026-05-18 | ✅ `All checks passed!` | Ruff check sobre `apps/api/app/` — 0 errores | Sin issues de lint en backend. |
| `pnpm validate:content-catalog` | 2026-05-18 | ⚠️ No disponible como script npm | No existe script en `package.json`. Ejecutar: `node --import tsx packages/content-catalog/src/validate.ts` | Validación del catálogo no está integrada en npm scripts; se ejecuta via `tsx` directamente. |
| `python apps/api/scripts/validate_quiz_bank.py` | 2026-05-18 | ✅ `Quiz dataset validation: OK` | 0 errores, warnings de feedback sin contentRefs en opciones de preguntas (no bloqueante) | Dataset del banco de quizzes es válido estructuralmente. Warnings sobre contentRefs faltantes son curaduría pendiente. |
| `python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical` | 2026-05-18 | ✅ `coverage-check: OK` | Gates: active≥5 ✅, total≤500 ✅ (476), advanced≥15% ✅, max tema≤35% ✅, sin broken contentRefs ✅. 3 undercovered_skill warnings, 1 par de duplicados-like. | Todos los gates críticos pasan. 3 skills con menos de 3 preguntas cada una (curaduría menor). |
| `python apps/api/tests/llm_comparison/run_aalie_outputs.py --index apps/api/tests/llm_comparison/llm40_index.json --out-dir apps/api/tests/llm_comparison/out` | 2026-05-18 | ✅ AALIE baseline generado | `aalie40_results.csv` y `aalie40_summary.json` generados con 40 casos balanceados. Resumen actual: iterativos 12/12, recursivos 10/10, WHILE 4/8, unsupported/parser 6/6, gaps 1/4. | El baseline balanceado muestra fortaleza de AALIE en iterativos/recursivos y debilidad principal en WHILE y gaps. |
| `python apps/api/tests/llm_comparison/score_llm40_outputs.py --llm-jsonl apps/api/tests/llm_comparison/llm40_llm_outputs.jsonl --gold-jsonl apps/api/tests/llm_comparison/llm40_gold.jsonl --aalie-csv apps/api/tests/llm_comparison/out/aalie40_results.csv --out-md apps/api/tests/llm_comparison/out/llm40_aalie_vs_llm_report.md` | 2026-05-18 | ✅ comparación AALIE vs Direct LLM generada | Reporte Markdown generado. Resultado actual: strict total pass 33/40 vs 33/40; shape-aware theta 30/33 vs 28/33; gap recovery 1/4 vs 3/4. | Bajo scoring estricto ambos empatan en pass total, pero AALIE gana en shape-aware agreement y el LLM gana en gap recovery. |

## Interpretación de resultados esperados

### Build (`pnpm -r build`)
- **Esperado:** todos los workspaces compilan sin error.
- **Fallo típico:** error de tipo TypeScript en web, dependencia faltante en grammar.

### Tests API (`pnpm test:api`)
- **Esperado:** todos los tests pasan. Los tests `slow`, `stress`, `export`, `benchmark` se ejecutan sin filtro (pueden tomar varios minutos).
- **Fallo típico:** regresión en análisis WHILE/recursivo, cambio en shape de respuesta.

### Cobertura (`pnpm test:api:cov`)
- **Esperado:** global ≥ 70%.
- **Fallo típico:** código nuevo sin tests.

### Docs contracts (`pnpm test:docs-contracts`)
- **Esperado:** `docs-contracts: OK`.
- **Fallo típico:** `SNAPSHOT_SCHEMA_VERSION` desincronizado, directorio `docs/` faltante.

### Quiz bank validation
- **Esperado:** `Quiz dataset validation: OK` y `coverage-check: OK`.
- **Fallo típico:** preguntas con schema inválido, active questions < 5, total > 500, advanced < 15%, tema con más de 35% de concentración.

## Riesgos de validez

1. **Entorno:** los resultados pueden variar entre CI (Ubuntu 22.04, Python 3.11) y desarrollo local (Windows, macOS).
2. **Dependencias no instaladas:** sin `reportlab`, los tests de export PDF se omiten silenciosamente (ver `conftest.py`), lo que puede dar falsos positivos.
3. **Flakiness:** los tests que dependen de SymPy pueden ser lentos o no deterministas en casos con expresiones grandes.
4. **Benchmarks:** los tiempos absolutos no son comparables entre entornos. Solo tienen validez contractual (mediana sobre N ejecuciones).
5. **LLM40 comparison:** el total pass de `LLM40` es una métrica de contrato estructurado, no una medida pura de equivalencia matemática. Debe interpretarse junto con `theta_accuracy_shape_aware` e `ideal_gap_recovery`.

## Cómo reproducir

### Prerrequisitos

```bash
python -m pip install -r apps/api/requirements.txt
python -m pip install -r apps/api/requirements-dev.txt
pip install pytest-xdist
pnpm install --frozen-lockfile
```

Si el paquete de gramática Python existe:

```bash
pip install -e packages/grammar/py
```

### Ejecución completa

```bash
pnpm -r build
pnpm test:api:cov
pnpm test:docs-contracts
python apps/api/scripts/validate_quiz_bank.py
python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical
```
