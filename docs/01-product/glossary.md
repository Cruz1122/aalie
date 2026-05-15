# Glosario

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | docente | estudiante | evaluador
**Fuente de verdad:** `packages/types/src/index.ts`, `apps/api/app/modules/`, `apps/web/src/app/`, contratos en `03-specs/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** 2.2 Fundamentos Teóricos, 2.5 Análisis de Complejidad

## Propósito

Fijar el significado operativo de cada término usado por el producto, el motor y la documentación. No son definiciones enciclopédicas; son definiciones contractuales: describen cómo se comporta el sistema en cada concepto.

## Alcance

Incluye términos de análisis, notación, trazas, snapshot, export, LLM, contenido y quizzes.

## Fuente de verdad

- tipos compartidos en `packages/types/src/index.ts`;
- respuestas reales de endpoints `POST /analyze/open`, `POST /analyze/trace`, `POST /export/report`;
- contratos en `03-specs/` y `04-api/`;
- esquemas Pydantic en `apps/api/app/modules/`.

## Contrato

Cada definición es un compromiso de comportamiento. Si el término aparece en UI, API o export, debe corresponder exactamente a esta definición.

## Estructura

| Término | Significado operativo |
|---|---|
| **AALIE** | Algorithmic Analysis Live Interaction Expert. Plataforma educativa para análisis de pseudocódigo. El nombre suena como "ally" (aliado). Es el nombre de la asistente virtual. |
| **Pseudocódigo** | Lenguaje controlado definido por `Language.g4` (ANTLR4). No es un lenguaje de propósito general. La notación aceptada puede ser más amplia que la cobertura efectiva del motor. |
| **ANTLR** | Generador de parser usado para la gramática del pseudocódigo. Produce parsers en TypeScript (frontend) y Python (backend) desde una misma gramática. |
| **AST** | Árbol de sintaxis abstracta con nodos tipados. Cada nodo tiene `type`, `pos` (line/column). Incluye Program, ProcDef, Block, For, While, Repeat, If, Assign, Call, Binary, etc. |
| **Clasificación** | Proceso de determinar si un algoritmo es iterativo, recursivo, híbrido o desconocido basado en el AST. `detect_algorithm_kind()` en `apps/api/app/modules/classification/classifier.py`. |
| **Análisis determinista** | Ruta principal de análisis. Usa reglas, contratos y patrones fijos. No depende de IA. Produce resultados reproducibles. Es la fuente de verdad del sistema. |
| **T_open** | Forma abierta de la función de costo. Expresión simbólica (KaTeX) con sumatorias sin simplificar. Producida por `IterativeAnalyzer`. Ej: `\sum_{i=1}^{n} C_1 + \sum_{i=1}^{n} C_2`. |
| **T_polynomial** | Simplificación algebraica de T_open cuando SymPy puede cerrar las sumatorias. Ej: `C_1 n + C_2 n`. |
| **byLine** | Tabla por línea con costo elemental (`ck`), tipo de operación (`kind`), número de ejecuciones (`count`) y notas. Artefacto central del análisis iterativo. |
| **avgModel** | Configuración del caso promedio para análisis probabilístico. Modos: `uniform` (predicados equiprobables) o `symbolic` (predicados con probabilidades explícitas). |
| **loopInvariant** | Artefacto determinista asociado al ciclo más significativo del AST. Incluye `propertyStatement`, `initialization`, `maintenance`, `finalization`. Estados: `ok`, `unavailable`, `low_confidence`. |
| **Heurística conservadora (WHILE)** | Estrategia del motor WHILE: reconocer patrones frecuentes y solo producir cota cuando hay evidencia suficiente. Estados: `bounded`/`unbounded`/`unknown`. Niveles de evidencia: `strong`, `medium`, `weak`. Cuando no hay evidencia suficiente, reporta `unknown` en lugar de inventar. |
| **trace** | Rastro de ejecución paso a paso con pasos, resumen y diagnósticos. Artefacto producido por `POST /analyze/trace`. Incluye `ExecutionStepCanonical` con eventKind, variablesSnapshot, decision, cost. |
| **structuredTrace** | Representación derivada del trace para diagrama y clasificación visual (React Flow). Producida por `build_structured_trace_result`. |
| **seguimiento manual guiado** | Modo pedagógico donde la UI avanza por pasos o niveles usando el mismo trace contractual sin reinterpretarlo. |
| **callTreeSource** | Árbol de llamadas recursivas (CallTreeCanonical) usado por UI y export. Incluye `CallNodeCanonical` con depth, argumentsSnapshot, returnValue, aggregateCost. |
| **snapshot** | Objeto versionado que concentra input, metadatos, resultados, trazas y advertencias. Unidad de verdad para export. Incluye `schemaVersion`, `snapshotId`, `contentHash`. |
| **contentHash** | Hash SHA-256 del snapshot normalizado (sin `createdAt`). Permite verificar integridad y detectar drift entre UI y export. |
| **snapshotId** | UUID v5 estable derivado del contenido del snapshot. Mismo estado de análisis produce siempre el mismo snapshotId. |
| **schemaVersion** | Versión del esquema del snapshot. Valor actual: `"1.0.0"`. |
| **método aplicable** | Método recursivo que el detector considera defendible para la recurrencia observada. Valores: `master`, `iteration`, `recursion_tree`, `characteristic_equation`. |
| **conclusivo** | Resultado cuyo contrato y soporte entran en cobertura actual del motor. Tiene notación O/Ω/Θ definida. |
| **no concluyente** | Resultado parcial, no soportado o con advertencias suficientes para impedir afirmaciones fuertes. El motor reporta `unsupported`, `partial` o `unknown`. |
| **normativa** | Documento que fija contrato obligatorio. Su modificación requiere actualizar tests, código y ADR asociado. |
| **descriptiva** | Documento que explica el sistema actual sin crear contrato nuevo. Su modificación no requiere cambios en tests. |
| **legacy** | Documento histórico retirado del flujo principal. Se conserva por trazabilidad. |
| **Export institucional** | Generación de reportes desde un snapshot versionado. Formatos: Markdown, LaTeX, PDF, ZIP. El snapshot es la fuente única; no hay recálculo durante export. |
| **BFF** | Backend For Frontend. Capa Next.js que actúa como proxy entre el frontend y el backend FastAPI. Rutas bajo `/api/`. |
| **BFF proxy** | Endpoints en Next.js que delegan al backend FastAPI. Mantienen la misma interfaz que los endpoints directos de FastAPI. |
| **Contenido modular** | Estructura JSON versionada organizada en espacios (`space`), módulos (`module`), capítulos (`chapter`), secciones (`section`) y bloques (`block`). Dos espacios actuales: `course` y `user-guide`. |
| **Space** | Espacio de contenido. Ej: `course` (contenido curricular), `user-guide` (guía de uso del analizador). |
| **Quiz** | Instrumento de práctica con preguntas de 5 tipos. Cada pregunta tiene estado (`draft`/`active`/`deprecated`/`archived`), dificultad, nivel cognitivo, metadatos de selección y política de calificación. |
| **Sesión de quiz** | Conjunto de preguntas seleccionadas adaptativamente. `POST /quizzes/attempts` crea la sesión; `POST /quizzes/attempts/evaluate` la evalúa. |
| **Intento de quiz** | Sinónimo de sesión de quiz. Un intento = una sesión. |
| **Evaluación determinista (quiz)** | El backend evalúa respuestas contra respuestas correctas conocidas. No hay IA involucrada en la calificación. |
| **i18n** | Internacionalización. AALIE soporta español (`es`) e inglés (`en`). Usa `next-intl` para rutas y contenido localizado. |
| **Locale** | Identificador de idioma. Valores: `"es"` (español), `"en"` (inglés). Controla idioma de UI, contenido curricular y etiquetas de análisis. |
| **Provider LLM** | Proveedor de modelo de lenguaje configurable. Soportados: `gemini` (Gemini API), `openai_compatible` (cualquier API compatible con OpenAI). Configurable vía `LLM_PROVIDER`. |
| **RAG** | Retrieval-Augmented Generation. **No implementado en AALIE.** No hay pipeline de retrieval, embeddings ni vector store. |
| **GPU vs CPU (heurístico)** | Lectura orientativa de idoneidad estructural para CPU o GPU basada en patrones del algoritmo. No es benchmark científico. Se muestra para discusión didáctica. |
| **Recurrencia** | Ecuación que describe el costo de un algoritmo recursivo en términos de sí mismo. AALIE detecta dos tipos: `divide_conquer` (T(n) = a·T(n/b) + f(n)) y `linear_shift` (T(n) = c₁T(n-1) + ... + cₖT(n-k) + g(n)). |
| **Teorema Maestro** | Método para resolver recurrencias de la forma T(n) = a·T(n/b) + f(n). AALIE implementa los 3 casos con verificación de regularidad para caso 3. |
| **Pseudocódigo** (en glosario) | Lenguaje controlado definido por `Language.g4`. Sintaxis: nombre(params) BEGIN ... END. Usa `<-` para asignación, `MOD` para módulo, `DIV` para división entera. Sin tipos en variables. |

## Ejemplos

- Si `loopInvariant.status = low_confidence`, el sistema no debe venderlo como conclusión fuerte.
- Si el export cambia pero el snapshot no cambia, el problema está en render, no en análisis.
- Si un WHILE no coincide con ningún patrón, `cost_block.status = "unknown"` y `evidence_level = "weak"`.
- Si una respuesta de quiz se evalúa, el backend usa calificación determinista contra respuestas correctas conocidas.
- Si el export se solicita como PDF y no hay `pdflatex`, el error debe ser explícito ("pdflatex not found"), no un PDF vacío.

## Limitaciones

- Algunos términos conservan nombres en inglés porque así existen en tipos, APIs y exports. Ej: `byLine`, `loopInvariant`, `snapshotId`, `contentHash`.
- No hay término definido para análisis espacial porque AALIE no lo implementa.
- Backtracking, branch and bound y voraces existen como módulos de contenido pedagógico, pero no tienen análisis formal asociado.

## Archivos relacionados

- `vision.md` — visión del producto
- `known-limitations.md` — límites conocidos
- `../03-specs/analysis-engine-spec.md` — contrato normativo del motor
- `../03-specs/report-snapshot-spec.md` — contrato de snapshot
