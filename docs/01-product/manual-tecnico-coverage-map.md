# Mapa de cobertura del manual técnico

**Tipo:** guía
**Estado:** requiere-validación
**Audiencia:** evaluador | dev
**Fuente de verdad:** `docs/`, `apps/`, `packages/`, `.github/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** 2.1–2.9 (plan de cobertura)

## Propósito

Mapear cada sección del futuro manual técnico (informe de proyecto) contra los docs fuente existentes en el repositorio, identificar qué está cubierto, qué falta, y quién es el responsable sugerido de redactar cada sección.

## Alcance

Cubre las secciones estándar de un manual técnico de proyecto académico (informe), más el anexo de uso de IA generativa. No cubre documentos administrativos ni actas de reunión.

## Fuente de verdad

- Documentos en `docs/` organizados por área (`01-product/`, `02-architecture/`, `03-specs/`, `04-api/`, `05-quality/`, `06-operations/`, `07-user/`, `08-content/`, `09-decisions/`).
- Código fuente y tests en `apps/` y `packages/`.
- README raíz.

## Estructura

| Sección del manual técnico | Docs fuente | Estado | Qué ya cubre | Qué falta | Responsable sugerido |
|---|---|---|---|---|---|
| **2.1 Resumen Ejecutivo** | `README.md`, `docs/01-product/vision.md`, `docs/01-product/final-scope.md` | Cubierto (requiere redacción narrativa) | Qué es AALIE, problema que resuelve, stack, estado actual, limitaciones principales | Síntesis ejecutiva en prosa académica (2-3 párrafos), datos cuantitativos (476 preguntas, 8 CI jobs, 70% coverage) | Juan Camilo Cruz |
| **2.2 Fundamentos Teóricos** | `docs/01-product/theoretical-foundations.md`, `docs/01-product/glossary.md`, `docs/03-specs/analysis-engine-spec.md` | Cubierto | Definiciones teóricas y operativas de cada concepto de complejidad, notación O/Ω/Θ, modelo de costo, recurrencias | Citas bibliográficas formales (Cormen, Sedgewick, etc.), conexión explícita con currículo universitario | Luz Enith Guerrero |
| **2.3 Arquitectura del Software** | `docs/02-architecture/system-architecture.md`, `docs/02-architecture/frontend-architecture.md`, `docs/02-architecture/backend-architecture.md`, `README.md` | Cubierto | Monorepo, flujo principal, capas FE/BE/packages, BFF, endpoints | Diagrama C4 nivel 1 y 2, justificación de decisiones técnicas, riesgos arquitectónicos | Juan Camilo Cruz |
| **2.4 Diseño Algorítmico** | `docs/03-specs/ast-schema.md`, `docs/03-specs/pseudocode-grammar-spec.md`, `docs/03-specs/while-heuristics-spec.md`, `apps/api/app/modules/analysis/while_engine/patterns/` | Cubierto | Gramática ANTLR, AST, patrones WHILE, clasificación, visitadores | Pseudocódigo de los patrones WHILE más importantes, diagrama de flujo del análisis, justificación de heurística conservadora | Juan Camilo Cruz (Jhon Hander como revisor) |
| **2.5 Análisis de Complejidad** | `docs/03-specs/analysis-engine-spec.md`, `docs/03-specs/recurrence-methods-spec.md`, `docs/03-specs/execution-trace-spec.md`, `docs/01-product/capability-map.md` | Cubierto | Motor determinista, análisis iterativo y recursivo, 4 métodos de recurrencia, trazas, invariantes | Ejemplos completos (insertion sort, merge sort, Fibonacci) con entrada y salida real del motor, casos borde | Juan Camilo Cruz |
| **2.6 Detalles de Implementación** | `docs/04-api/`, `docs/02-architecture/`, `docs/06-operations/`, `docs/09-decisions/` | Parcial | Endpoints, variables de entorno, BFF, estructura de paquetes | Detalles de implementación concreta por módulo (patrones de diseño usados: Strategy, Visitor, Registry), justificación de SymPy, Pipeline de pruebas | Juan Camilo Cruz (Jhon Hander para módulos post-MVP) |
| **2.7 Resultados Experimentales** | `docs/05-quality/benchmarking.md`, `docs/05-quality/algorithm-oracles.md`, `apps/api/tests/` | Parcial | Oráculos de algoritmos, estrategia de pruebas, cobertura | Tabla de resultados: algoritmos probados, tiempo de análisis, precisión vs expected, comparación con LLM, rendimiento de SymPy | Jhon Hander Patiño |
| **2.8 Limitaciones y Trabajo Futuro** | `docs/01-product/known-limitations.md`, `docs/01-product/final-scope.md` | Cubierto | Límites del parser, análisis, WHILE, recurrencias, trace, export, LLM, quizzes | Priorización de trabajo futuro, hoja de ruta estimada, dependencias externas | Luz Enith Guerrero (con input técnico de Cruz) |
| **2.9 Apéndices Técnicos** | `docs/04-api/endpoints-overview.md`, `docs/06-operations/environment-variables.md`, `docs/06-operations/deployment.md`, `docs/06-operations/local-development.md` | Parcial | Endpoints, variables de entorno, despliegue local/Docker | Código completo de ejemplos relevantes, schemas JSON de snapshot y quiz, extractos de tests críticos | Jhon Hander Patiño |
| **Uso de IA Generativa** | `docs/01-product/generative-ai-usage.md` | Cubierto | Herramientas usadas (GPT, Cursor, Claude, Codex, Copilot), prompts, validación humana, decisión de motor determinista | Tabla detallada por herramienta, etapa, uso, ejemplo de prompt, resultado, validación y riesgo | Juan Camilo Cruz |

## Archivos relacionados

- `vision.md` — visión del producto
- `final-scope.md` — alcance detallado
- `capability-map.md` — granularidad fina
- `../02-architecture/system-architecture.md` — arquitectura
- `../03-specs/` — contratos normativos
- `../05-quality/testing-strategy.md` — estrategia de pruebas
