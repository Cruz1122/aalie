# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.10.0] — 2026-05-15

### Added
- **Detección estructural de técnicas algorítmicas desde AST** — nuevo módulo `technique-detection/` con pipeline completo:
  - Recolectores de hechos: `choiceFacts`, `collectFacts`, `decompositionFacts`, `mutationFacts`, `semanticFacts`
  - Reglas de clasificación: `backtracking`, `branchAndBound`, `decreaseAndConquer`, `divideAndConquer`, `dpTopDown`, `greedy`
  - Test suite: `catalogTechniqueDetection.test.ts` (validación contra catálogo completo) y `techniqueDetection.test.ts` (oráculos semánticos, 35+ tests)
- **Catálogo de ejemplos**: campo `expectedTechnique` agregado a todos los ejemplos (35+ algoritmos) para validación automática
- **Pseudocódigo corregido/mejorado**: Strassen (multiplicación matricial real con submatrices), Subset Sum (FOR + usado[]), Permutations (usado[] + perm[]), Maze Solver (FOR con direcciones), TSP B&B (visitado[] + bound), N-Queens B&B (bound + esSeguro), Least-Cost Path B&B (visitado[] + bound), MergeSort pedagógico (return values)
- **Desbloqueo de ejemplos**: Strassen, TSP B&B, N-Queens B&B, Least-Cost Path B&B — eliminado `catalogTier: "blocked"`
- **ADR-015**: Decisión arquitectónica sobre detección estructural de técnicas (reemplaza borrador `adr-xxx`)
- **Spec y oráculos** actualizados: `technique-detection-spec.md` y `technique-detection-oracles.md` con core definitions, casos soportados (35+) y excepciones semánticas
- **i18n**: Nuevos mensajes para detección de técnicas (en/es)
- **Integración frontend**: `RecursiveAnalysisView` y `AnalyzerPage` conectados al detector de técnicas; `useRunAnalysis` hook extendido
- **Manejo de errores**: `api-error-translator` extendido para cubrir detección de técnicas
- **Catalog integrity test**: Suite que valida coherencia entre `expectedTechnique` y detección real

### Changed
- README.md actualizado con descripción y features mejoradas
- Limpieza de imports y legibilidad del análisis en múltiples módulos (`98a1a14`)
- Eliminación de manejo no usado de method/technique badges en `ExampleCatalogCard` y `ExamplesHomeView`

### Fixed
- **Detección Branch & Bound** corregida (`1d03cc6`)
- **Inyección de procedimiento**: recurrencia recursiva ahora fuerza notación asintótica antes de enviarse
- **Modal UI**: props de modal corregidos, ruta de quizzes, Ctrl+Enter, stubs de catálogo, alcance de `maxSubarray`
- **Límites superior/inferior**: `bound_kind` con tipo inferido corregido
- **Notación \mathcal**: reemplazada por `BigO` en árbol lineal y dominante
- **Conclusión de árbol estándar**: ahora incluye prefijo `T(n)=`
- **Dominante**: especifica si es por hojas o raíz
- **Invariante recursivo**: botón aparece para TODOS los algoritmos recursivos; null safety en `AnalyzerPage`
- **Docker**: contenido de quizzes agregado a imagen + archivos adicionales
- **Ruff**: correcciones de lint
- **Dependencia Playwright** corregida

## [1.9.0] — 2026-05-14

### Changed
- Normalización de la notación asintótica de métodos recursivos según el tipo de cota: equivalencia Θ, cota superior O, cota inferior Ω y resultado parcial.
- Detección de exclusividad entre llamadas recursivas reforzada mediante análisis de caminos de ejecución y conteo máximo de llamadas por camino.
- Mejoras en la identificación del nivel dominante de los árboles de recursión y en la presentación de sus conclusiones.
- Clasificación de patrones recursivos ajustada para distinguir con mayor precisión entre llamadas independientes y ramas mutuamente exclusivas.

### Tests
- Oráculos deterministas endurecidos para validar resultados exactos y semántica de cotas.
- Pruebas de métodos recursivos, calidad del banco de quizzes y comprobaciones del repositorio reforzadas.
- Validaciones de lint y formato alineadas con los gates de calidad del proyecto.

## [1.8.1] — 2026-05-09

### Added
- **Invariante Recursivo — Completitud 100%**: Artefacto pedagógico completo con arquitectura formal, tests E2E y ejemplos de algoritmos reales.

#### Documentación Formal
- `docs/04-api/recursive-invariant-design.md` — Especificación arquitectónica completa con 30 secciones:
  - Modelo de dominio con path tracking y mutual exclusivity
  - Pipeline completo: extracción → clasificación → generación narrativa → payload
  - Decisiones de diseño: razonamiento de path tracking ('T'/'F'), cálculo de subproblemas, extracción de casos base
  - 5 puntos de extensibilidad futura (recursión cola, mutual recursion, verificación formal, visualización, herramientas educativas)
  - Integración backend/frontend/i18n documentada
  - Análisis de performance: O(n) tiempo, O(d) espacio (d = profundidad de nesting)
  - Estrategia de manejo de errores con degradación elegante
  - Roadmap de Fases 2-5 para mejoras futuras
- `docs/07-user/recursive-invariant-examples.md` — Guía de ejemplos con 7 algoritmos reales:
  - Fibonacci (exponencial, recursión múltiple)
  - Binary Search (divide-and-conquer)
  - Countdown (recursión lineal)
  - Merge Sort (recursión múltiple, O(n log n))
  - Quick Sort (recursión múltiple, análisis promedio)
  - Tower of Hanoi (recursión múltiple, O(2^n))
  - Binary Exponentiation (divide-and-conquer, 96% confianza)
  - Tabla comparativa de todos los algoritmos
  - Guía pedagógica de uso de invariantes para comprensión y optimización
- `RECURSIVE_INVARIANT_COMPLETION.md` — Resumen ejecutivo de completitud al 100% con checklist de deliverables, test coverage, métricas clave y status de producción.

#### Tests E2E Completos
- `apps/web/e2e/recursive-invariant.spec.ts` — Suite de 10 casos Playwright:
  - Renderización de invariante para Fibonacci (múltiple recursión)
  - Renderización de invariante para Binary Search (divide-and-conquer)
  - Renderización de invariante para Countdown (recursión lineal)
  - Validación que algoritmos no-recursivos muestran loop invariant en lugar de recursive
  - Soporte de locale español con verificación de strings UI
  - Validación de puntuaciones de confianza (0-100%)
  - Cierre de modal con botón X
  - Cierre de modal al hacer clic fuera (backdrop)
  - Sección de evidencia con base conditions
  - Llamadas recursivas detectadas correctamente
- `apps/web/playwright.config.ts` — Configuración lista para producción:
  - Soporte multi-browser (Chromium, Firefox)
  - Web server automático en localhost:3000
  - Reportes HTML + GitHub Actions
  - Trazas on-first-retry, screenshots on-failure

#### Tests Unitarios Complejos
- `apps/api/tests/unit/analysis/test_complex_recursive_algorithms.py` — 5 algoritmos avanzados:
  - Merge Sort: 2 llamadas no-exclusivas → multiple_recursive, 73% confianza
  - Tower of Hanoi: 3 llamadas → multiple_recursive, 73% confianza
  - Quick Sort: 2 llamadas no-exclusivas → multiple_recursive, 73% confianza
  - Binary Exponentiation: 2 llamadas exclusivas → divide_conquer, 96% confianza
  - Ackermann Function: 3 llamadas anidadas → multiple_recursive, 81% confianza

#### Componentes Frontend Mejorados
- `apps/web/src/components/RecursiveInvariantModal.tsx` — Modal completo con:
  - Data-testid attributes para todas las secciones
  - Badge de estado con color semántico (esmeralda, ámbar, rojo)
  - Porcentaje de confianza visible
  - Estructura recursiva: condición base, resultado base, llamadas recursivas, tipo
  - Grid responsivo 3-columnas: base property | inductive hypothesis | recursive step
  - Sección de garantía de terminación
  - Resumen didáctico destacado
  - Sección de evidencia colapsable con llamadas detectadas y condiciones base

### Changed
- `apps/api/app/modules/analysis/recursive_invariants/extractor.py`:
  - **Path tracking mejorado**: cada llamada recursiva registra ruta ('T'/'F')
  - **Detección de mutual exclusivity**: comparación pairwise de paths
  - **Extracción de caso base**: solo procesa primera declaración If
  - **Extracción de resultado base**: solo extrae del consecuente de la primera If
  - **Cálculo dinámico de subproblemas**: 1 si exclusivas, else recursive_call_count
- `apps/api/app/modules/analysis/recursive_invariants/schemas.py`:
  - Nuevo campo `calls_are_mutually_exclusive: bool`
  - Nuevo campo `subproblems_per_call: int`
- `apps/api/app/modules/analysis/recursive_invariants/classifier.py`:
  - Reordenamiento: mutual_exclusivity → multiple_recursive → linear → unknown
  - Confidence: base 0.75, +0.08 si base claro, +0.10 si parámetro decrece, +0.05 si terminación clara
  - Detección inmediata de divide-and-conquer si calls_are_mutually_exclusive=True
- `apps/api/app/modules/analysis/recursive_invariants/templates.py`:
  - Contexto con `subproblems_per_call` para narrativa apropiada
  - Templates divide-and-conquer actualizados
  - Narrativas que reflejan semántica real (mutual vs independiente)
- `apps/api/app/modules/analysis/recursive.py`: IntegrationAnalyzer genera invariante post-análisis
- `apps/api/app/modules/analysis/service.py`: respuestas con `recursiveInvariant`, degradación elegante
- `apps/web/src/app/[locale]/analyzer/page.tsx`: lógica contextual `isAlgorithmRecursive()`
- `apps/web/messages/{en,es}.json`: strings de UI para invariante recursivo

### Fixed
- Clasificación de Binary Search: múltiple → divide-y-conquista (2 llamadas mutuamente exclusivas)
- Base result incorrecto: solo procesa primera If
- Subproblemas incorrectos: usa mutual exclusivity detection
- Generación consistente para 7 algoritmos reales (73-96% confianza)

## [1.8.0] — 2026-05-07

### Added
- **Artefacto pedagógico: Invariante Recursivo** — análogo a `loopInvariant` para algoritmos recursivos
  - Módulo backend: `apps/api/app/modules/analysis/recursive_invariants/` con extractor de hechos recursivos, clasificador de patrones, generador de plantillas y servicio orquestador
  - Tipos TypeScript en `@aa/types` y esquemas Pydantic en `apps/api/app/modules/analysis/schemas.py`
  - Componente React `RecursiveInvariantModal.tsx` con renderización de estructura recursiva, propiedades base, hipótesis inductiva, paso recursivo y garantía de terminación
  - Soporte i18n completo (inglés/español) con mensajes en `apps/web/messages/{en,es}.json`
  - Integración en `RecursiveAnalyzer` para generación automática durante análisis
  - Respuesta API enriquecida con campo `recursiveInvariant` en `AnalyzeOpenResponse`
- Clasificación automática de patrones recursivos: Recursión Lineal, Divide-y-Conquista, Recursión Múltiple
- Generación de narrativa inductiva estructurada con 4 componentes:
  - Base Property: propiedad garantizada por el caso base
  - Inductive Hypothesis: suposición de que la recursión funciona para problemas menores
  - Recursive Step: cómo el paso inductivo propaga la propiedad
  - Termination Guarantee: por qué el tamaño del problema siempre disminuye
- Extractor de hechos recursivos: llamadas recursivas, condiciones base, parámetros, patrones de decrecimiento, tipo de recursión
- Test suite: `test_recursive_invariant_generation.py` con Fibonacci, recursión lineal y multiidioma

### Changed
- `RecursiveAnalyzer.result()` y `clear()` gestionan campo `recursive_invariant`
- Servicio `analyze_algorithm()` en `service.py` enriquece respuestas recursivas automáticamente

## [1.7.0] — 2026-05-06

### Added
- Método de iteración ampliado para mostrar cota superior dinámica con justificación pedagógica explícita, incluyendo paso de desigualdad clave antes de la generalización por $k$
- Soporte para walkthroughs completos aun cuando la recurrencia no cierre de forma exacta, manteniendo `bound_kind` y paso a paso alineado
- Documentación: árbol de recursión como cota superior cuando la forma no cumple la variante canónica
- Árbol de recursión para algoritmos que no cumplen forma equivalente (Fibonacci, Tribonacci, etc.), con análisis paso a paso y generación del árbol

### Changed
- Selector de métodos y análisis por iteración ya no presentan conclusiones como equivalentes cuando producen cota superior, inferior o resultado parcial
- Narrativa del paso a paso de iteración muestra desigualdad concreta derivada de la recurrencia real
- Comportamiento del árbol de recursión documentado y alineado con casos de forma no canónica

## [1.6.1] — 2026-05-02

### Added
- Detección de técnicas de algoritmo con soporte de localización (`ae7ee17`)
- Componentes UI para presentación de técnicas mejorados (`4f17aa3`)
- Categorías de algoritmo actualizadas con localización (`cce3ab2`)
- Diagramas Mermaid integrados en catálogo de contenido con validación (`da18fff`)
- Paquete de catálogo de contenido con renderizado mejorado (`d6b5252`)
- Referencias de contenido y límites de validación actualizados (`81adab4`)
- Carga de datasets de quizzes con localización y refactorización (`fa52d8c`)
- Selección y filtrado de quizzes mejorado (`5f354c3`)
- Formateo y localización en módulos de curso (`dd12ec6`)
- Árbol de recursión para algoritmos que no cumplen forma equivalente (`feae730`)

### Changed
- Componentes de quizzes mejorados: estilos, localización, refactorización
- Banco de preguntas: eliminación de preguntas obsoletas (`49440fa`)

### Fixed
- Altura mínima en `ExamplesTypeSelector` (`337eb86`)

### Chores
- Auditoría de archivos residuales trackeados (`80e8997`)
- Ignorar artefactos locales generados (`7ff8c7d`)

## [1.6.0] — 2026-04-28

### Added
- Clasificación por método recursivo en detección contractual: cada método puede declararse como cota equivalente, superior, inferior o parcial
- Experiencia de trazado recursivo con stepping/playback interactivo sobre `structuredTrace`, mostrando llamadas, expansión y retornos como eventos separados
- Controles de seguimiento recursivo debajo del diagrama con play/pause, step, velocidad y contexto del nodo actual
- Navegación por niveles para diagramas recursivos, permitiendo acotar profundidad visible sin alterar traza contractual
- Soporte de snapshot para preservar `structuredTrace` junto con traza recursiva y detalle metodológico
- Documentación de seguimiento manual guiado, alcance operativo y checklist formal de validación manual con casos canónicos
- Nuevas claves de i18n para seguimiento recursivo y estados de expansión/retorno

### Changed
- `structuredTrace` consolidado como artefacto derivado único para visualización del árbol de recursión
- Vista de diagrama recursivo comparte misma fuente de verdad para construcción automática y seguimiento manual
- Render de nodos y aristas recursivas ajustado para mostrar profundidad, fase, retorno y orden de ejecución
- Panel de seguimiento recursivo integrado en experiencia de trazado dedicada y vista de diagrama
- Sliders de paso y velocidad unificados con barra de progreso, color consistente y mejor alineación
- Referencias cruzadas desde guía de usuario hacia checklist formal de QA

### Fixed
- Compilación del panel de seguimiento recursivo: JSX mal formado en `RecursionSteppingControls.tsx`
- Alineación visual del slider de paso, estilo del slider de velocidad y presentación del nodo final/retorno
- Frontend dejó de inventar aristas de retorno; ahora consume aristas contractuales del grafo estructurado
- Snapshot de export conserva `structuredTrace` en artefactos de trazado recursivo
- Manejo de trazas parciales, profundas o no concluyentes con degradación limpia

## [1.5.1] — 2026-04-27

### Added
- Módulo RAG completo: router, normalización de documentos, chunking, indexing híbrido persistente, query rewriting y generación con métricas de rendimiento
- Integración de Tesseract OCR en Docker para procesamiento de documentos (`ec7bd5e`)
- Benchmarking de RAG y scripts asociados (`9be02f4`)
- Reparación de pseudocódigo con RAG (`0c7ff8b`)
- Proveedor GroqQwen con parseo JSON robusto (`d41df23`)
- Esquema JSON de quizzes y dataset de banco de preguntas (`91ee339`)
- Integración de funcionalidad de quizzes en la aplicación (`4d3c0a0`)

### Changed
- Configuración LLM y modelos de respuesta mejorados (`72519da`)
- Dockerfile actualizado con dependencias OCR

### Fixed
- RAG: reindexing no elimina el directorio de trabajo actual (`ec68de1`)
- Mejora en respuestas RAG y migración de PROMPT (`3c81ce0`)

## [1.5.0] — 2026-04-12

### Added
- Nuevo gateway LLM en backend (`apps/api/app/modules/llm`) con router, servicio, schemas y proveedores desacoplados
- Endpoints backend `POST /llm` y `GET /llm/status` con `requestId`, `errorCode` y payload normalizado para frontend
- Soporte de proveedor adicional `openai_compatible` en backend
- Helper frontend `apps/web/src/lib/llm-response.ts` para consumir respuestas normalizadas (`data.text`, `data.structured`, `data.metadata`)
- Tests de sistema backend para LLM (`test_llm_endpoint.py`, `test_llm_status_endpoint.py`)
- Plantilla `apps/api/.env.example` para configuración LLM del backend

### Changed
- Migración de integración LLM: frontend dejó de llamar al proveedor directamente, ahora usa proxy interno (`/api/llm`, `/api/llm/status`) hacia backend
- `apps/web/src/app/api/llm/route.ts` y `apps/web/src/app/api/llm/status/route.ts` simplificados a proxy puro
- Registro del router LLM en backend (`apps/api/app/main.py`)
- Separación de responsabilidades: análisis determinista ya no recibe `api_key` en contrato de `analyze/open`
- Normalización backend de respuestas LLM para desacoplar frontend de `candidates/content/parts` de Gemini
- Reducción de `max_tokens` por job y control de `thinkingConfig` para latencia
- Prompting reforzado de gramática para `repair`, `parser_assist` y `general`
- Documentación técnica actualizada para reflejar arquitectura backend-first

### Fixed
- Clasificación de timeout de proveedor a `LLM_TIMEOUT` con retry controlado
- Flujo `repair`: envío de `apiKey` de cliente cuando no hay `API_KEY` de servidor
- Modal de reparación: compatibilidad con múltiples formatos de `removedLines`/`addedLines`, normalización de código reparado, formateo por bloques `BEGIN/END`
- Visualización de comparación en repair con resaltado correcto de líneas

### Docs
- Consistencia de variables LLM entre `.env.example` y documentación operativa
- Limpieza de referencias obsoletas en docs

## [1.4.1] — 2026-04-06

### Added
- **Cobertura agresiva de módulo `export`**: 26 nuevos tests unitarios (+1,022 líneas cubiertas, 70.08% → 75.51%)
- Validación de eficiencia de los 30 algoritmos de ejemplos
- Mejora en análisis de bucles WHILE: detección de early return y nuevas estructuras de costo
- Análisis asintótico con localización y reporting mejorado
- Ejemplos iterativos en catálogo con nuevos algoritmos de ordenamiento
- Comparación LLM: integración de payload y salida paso a paso mejorada
- Análisis recursivo: nuevas estructuras de datos, construcción de perfiles, seguimiento de procedimientos auxiliares
- Reutilización de símbolos y manejo de bucles mejorado en análisis de complejidad
- Funcionalidad de asistente embebido con localización (`e0cd9b0`)
- Soporte de escritura con características de editor y localización (`b025361`)
- Catálogo de contenido con validación y documentación (`78750ad`)
- Guía de usuario con componentes y localización (`83c8dfa`)
- Dependencia server-only y legibilidad de schemas (`19772f0`)
- Procesos de linting y formateo para web app (`b82719d`)

### Changed
- Optimización CI: ejecución paralela (`pytest -n auto`), exclusión de suite lenta del gate principal
- Workflow CI: PR gate, validación extendida, lanes nocturnas
- Análisis iterativo y recursivo mejorado para detección de complejidad
- Manejo de estado de carga en `NavigationContext`
- Favicon actualizado a nuevo diseño

### Fixed
- `object.__new__()` MRO issue en herencia múltiple
- Cadena MRO cooperativa en `BaseAnalyzer`
- Invariant crash: análisis ya no falla completo si generación de invariante lanza excepción
- Tests de export: salto de test dependiente de pdflatex en sistemas sin pdflatex
- Sincronización de pnpm lockfile para antlr4ts

### Refactored
- Eliminación de agente logging de executor y trace builder
- Limpieza de código y formato en múltiples módulos
- Reorganización de tests y eliminación de tests de contrato obsoletos

## [1.4.0] — 2026-03-29

### Added
- **Procedimiento general didáctico de 4 pasos para análisis iterativo** en mejor y peor caso: identificación de líneas contables, cálculo de ejecuciones por línea, construcción de ecuación completa y cierre asintótico
- Procedimiento didáctico de 4 pasos para **caso promedio** en flujo independiente, manteniendo semántica de esperanza $E[N_{\ell}]$ por línea
- Subpaso explícito para reemplazar sumatorias por formas cerradas cuando el costo crudo contiene $\sum$
- Subpaso explícito para sustitución de constantes $C_k \to 1$ en caso promedio
- Campo `line_procedure` en cada fila: procedimiento detallado de cómo se llegó al costo de esa línea
- Utilidades para manejo de expresiones LaTeX
- Localización para texto de análisis en español e inglés
- Pruebas de documentación y verificación de contratos
- Análisis de lazo cerrado con bundles de pasos estructurados para:
  - Ecuación característica paso a paso
  - Método de iteración con bundles estructurados
  - Teorema Maestro con bundles estructurados
  - Árbol de recursión con bundles estructurados
- Clasificaciones de recurrencia y manejo de método preferido

### Changed
- **Separación de responsabilidades en modales para iterativos**:
  - Pasos 1-2 (líneas contables + resolución de sumatorias): distribuidos a `row["line_procedure"]`, mostrados en `ProcedureModal` bajo "How this cost was derived"
  - Pasos 3-4 (sumar costos + simplificar): conservados en `procedure_steps` general, mostrados en `GeneralProcedureModal`
- Frontend `ProcedureModal.tsx` renderiza `line_procedure` en sección con borde ámbar
- Sección bajo "Número de ejecuciones" usa `line_procedure` como fuente principal, `procedure` como fallback
- Reordenamiento de procedimiento mejor/peor caso para consistencia en 4 pasos
- Caso promedio sigue mismo esquema de 4 pasos respetando modelo probabilístico
- Resoluciones de sumatoria condicionadas a evidencia real (no solo plantilla)
- Ecuación simplificada final conservada para cierre asintótico
- Análisis de bucles WHILE con estructura de costo por bloques y reporting

### Fixed
- Invariant crash: análisis ya no falla si generación de invariante lanza excepción (degrada a `unavailable`)
- Expresiones no-SymPy en `count_raw_expr` usan fallback de texto plano
- Inconsistencia pedagógica: caso promedio ahora refleja misma estructura de 4 pasos
- Omisiones en subpasos de sumatorias: se muestran solo cuando aplican y con trazabilidad completa
- Refactorización de `_generate_iterative_four_step_procedure`: separa pasos por línea de pasos generales

## [1.3.2] — 2026-03-27

### Added
- Paquete exportador con selección de formato y caché de datos (`2309aaa`)
- Motor modular de análisis de idoneidad de hardware con extracción de features, detección de patrones y scoring (`8307f82`)
- Detección de recursión para extracción de features de hardware (`d996ac2`)
- Análisis paso a paso estructurado para ecuación característica (`4cf35e4`)
- Análisis paso a paso para método de iteración con bundles (`c73fb49`)
- Análisis paso a paso para Teorema Maestro con bundles (`1768de3`)
- Análisis paso a paso para árbol de recursión con bundles (`c0f205f`)
- Clasificaciones de recurrencia mejoradas y manejo estructurado (`80e29c7`)
- Método preferido en solicitudes de exportación (`e5d3e9f`)
- Soporte del operador `div` en análisis de complejidad (`1d728ca`)
- Comando `AALIEDisplayMath` para ecuaciones largas en LaTeX (`8310a83`)
- Resúmenes de comportamiento de algoritmos para invariantes de ciclo iterativos (`56ce92e`)
- Mejoras en catálogo de ejemplos con localización y filtrado (`f43c452`)
- Reestructuración de documentación y navegación de usuario (`ab4b6ea`)
- Capacidades de linting y formateo para el módulo API (`6d06230`)
- Documentación de infraestructura de export de reportes (`docs/reports-export-infrastructure.md`)
- Dependencias y framework de testing mejorados (`ea8a619`)

### Changed
- Watermark y colección de assets en exportador (`2ecb5b4`)
- Lógica de reportes migrada a backend (`9cb3d09`)
- Política CORS para reportes (`b002987`)
- Plantillas de análisis y manejo numérico mejorado (`f094adb`)
- Layout y responsividad del componente `AnalyzerEditor` (`2830de8`)
- Workflow CI actualizado para verificaciones de Black (`4ca7cd0`)

### Fixed
- Altura del editor Monaco al cambiar tamaño de pantalla (`0f9400f`)
- Aserciones de tipo en tests de `RecursiveAnalyzer` (int/float) (`b4e916e`)

### Refactored
- Eliminación de componentes dummy de análisis (`7b3ad9c`)
- Limpieza de `pnpm-lock.yaml` (dependencias no usadas) (`dce97b7`)
- Eliminación de props `recursionDiagram` no usadas (`b55e148`)
- Formato y legibilidad en múltiples módulos (`e993856`)

## [1.3.1] — 2026-03-23

### Added
- Importación de algoritmos desde archivo `.txt` en modo manual (`/es`) y en vista del analizador (`/es/analyzer`)
- Modal dedicado para validación de importación TXT con mensajes por tipo de error (archivo inválido, no algoritmo, gramática inválida)
- Flujo de reparación con IA tras importación fallida por gramática, manteniendo edición final en Monaco antes de analizar
- Utilidades de validación y normalización de TXT en frontend (`apps/web/src/lib/txt-import.ts`)
- Normalización de entrada en backend de parsing (BOM + saltos de línea) y tests unitarios asociados
- Análisis de lazo cerrado con análisis de invariante de ciclo y documentación (`1d039c0`)
- Paquete exportador integrado y dependencias actualizadas (`e236071`)
- Fallback para parámetros escalares no resueltos en `CodeExecutor` (`735f0e5`)

### Changed
- Botón de importación en `/es/analyzer` con estilo de icono + tooltip (consistente con resto de acciones)
- Flujo de importación solo pega contenido en Monaco cuando validación completa es exitosa
- Si la importación falla, el editor conserva contenido previo; si usuario confirma reparar con IA, recién se usa contenido importado

### Fixed
- Clasificación errónea durante importación: errores de gramática se reportan como "gramática inválida", no "no parece algoritmo"
- Parseo de importación unificado entre `/es` y `/es/analyzer` usando mismo servicio (`GrammarApiService`)
- Solapamiento visual de modales (importación y reparación IA): ambos se renderizan por portal a `document.body` con z-index alto
- Reparación IA: prompt endurecido y normalización de salida para evitar prefijos incompatibles con gramática

## [1.3.0] — 2026-03-16

### Added
- Documentación de supuestos del caso promedio (`docs/average-case-assumptions.md`) y auditoría (`docs/average-case-audit.md`)
- Bandera `avg_foundation` (well_founded / approximate) en el análisis de caso promedio
- Tests de verificación de fórmulas y `avg_foundation` en `test_avg_case.py` y `test_avg_formulas.py`
- Narrativa pedagógica en modal de procedimiento general: explicación del caso promedio, qué se promedia, cuándo es representativo
- Etiquetas descriptivas en tarjetas de casos (mejor: salida temprana, promedio: E[ejecuciones], peor: máximo de iteraciones)
- Badge "Bien fundamentado" / "Aproximado" según modelo del caso promedio
- Tabla alineada para notaciones O/Ω/Θ en modal de procedimiento general
- Columnas con anchos fijos en LineTable y CostsTable para alinear fórmulas
- Inferencia de parámetros y logging mejorado en flujo de ejecución (`038363b`)
- Manejo refinado de early return en `RecursiveAnalyzer` (`1600ab3`)
- Notación de potencias refactorizada en `RecursiveAnalyzer` (`463ff4a`)
- Función de explicación con IA y localización asociada (`16ed1fa`)
- Selector de métodos con niveles de precisión y metadatos (`9f9b30f`)
- Mejora en caso promedio: análisis y documentación (`7877cd0`)
- Umbral de cobertura actualizado en CI (`d655f49`)

### Changed
- `GeneralProcedureModal`: bloque de narrativa para caso promedio, advertencia cuando es aproximado, mini-notas de supuestos
- `IterativeAnalysisView`: hints descriptivos en cada tarjeta de caso
- Documentación de `loopInvariant` en `docs/api/loop-invariant-deterministic.md`: alcance actual, módulos, flujo, orden de reglas del clasificador, política de confianza y pruebas mantenidas

### Removed
- Benchmark de invariantes de ciclo basado en oráculo JSON: carpeta `tests/_support/algorithms/oracle/`, `loop_invariant_oracle.json`, runner, script de generación de informe, test de contrato asociado y `docs/loop-invariants-benchmark.md`

### Fixed
- Simplificación de mensajes de cálculo de g(n) en inglés y español (`96d248b`)

## [1.2.2] — 2026-03-14

### Cambios
- **Comparación con IA:** Las etiquetas técnicas se sustituyeron por "Ecuación de eficiencia completa" y "Forma polinómica". Al comparar con el asistente, las notas se generan en un lenguaje más claro y comprensible.
- **Fórmulas con potencias en recursión:** Se reorganizó la forma en que se muestran y calculan expresiones con exponentes para que los resultados sean más claros y consistentes.
- **Detección temprana en recursión:** Cuando un algoritmo termina antes de lo esperado en algún camino, ahora se reconoce mejor ese caso y se evita contar pasos de más.
- **Parámetros y seguimiento de ejecución:** Se mejoró cómo se deducen los datos de entrada y cómo se registran los pasos internos, para dar explicaciones más fiables durante la ejecución.

### Correcciones
- **Panel de variables:** Se corrigió un fallo que impedía compilar la aplicación; el aviso que indica que el tamaño (n) es la longitud del array se muestra correctamente.
- **Bucles que crecen muy rápido:** En algoritmos donde el índice se multiplica o crece de forma explosiva, ya no se muestra "infinito" cuando no corresponde; el sistema elige mejor el respaldo y evita clasificaciones erróneas.
- **Fórmulas con log(n):** Se evita mostrar símbolos de infinito incorrectos en expresiones que incluyen logaritmos; esos términos se muestran de forma adecuada.
- **Fórmulas matemáticas en la comparación:** Las expresiones entre $ se procesan bien antes de mostrarlas en pantalla.
- **Panel de variables:** Los cambios solo se aplican al pulsar el botón "Aplicar", no al salir del campo con el cursor.
- **Arrays que empiezan en 0:** El ejecutor interpreta correctamente cuando el primer elemento del array está en la posición 0.
- **Búsqueda lineal con "encontrado":** El mejor caso (encontrar el elemento al primer intento) se reconoce bien y se muestra como tiempo constante.
- **Editar el array a mano:** Al modificar la lista de valores, el tamaño n se actualiza solo y los datos enviados quedan coherentes.
- **Seguimiento de bucles con bandera:** Cuando se usa una variable tipo "encontrado", las condiciones se evalúan bien y el seguimiento paso a paso muestra el flujo correcto.
- **Análisis del mejor caso:** Se corrige la detección en búsqueda con bandera para no confundir el primer elemento.
- **Caso promedio en búsqueda lineal:** Se usa la fórmula correcta del número de pasos esperados.
- **Diagrama de ejecución:** Al salir de un bucle se muestra la condición exacta que hizo que terminara (por ejemplo la comparación que dio falso), no solo "Fin bucle".
- **Panel de variables (n y tamaño):** El tamaño del array (n, length, size, len) se trata como fijo y no es editable; sí se pueden editar el resto de valores (por ejemplo el valor a buscar).

## [1.2.1]

### Added
- Nueva vista de seguimiento más clara y cómoda, tanto para escritorio como para móvil.
- Sistema de trazas unificado para mostrar mejor el recorrido de algoritmos iterativos y recursivos.
- Más pruebas automáticas y documentación para asegurar resultados consistentes en diagramas y complejidad.
- Mejoras de internacionalización en mensajes y etiquetas del seguimiento.
- Se añadieron más pruebas para casos recursivos donde antes podían salir recomendaciones confusas.
- Se agregaron mensajes más claros en español e inglés para explicar cuándo conviene usar Programación Dinámica.

### Fixed
- Correcciones en recursividad para evitar llamadas repetidas o árboles de llamadas incorrectos.
- Solucionados bloqueos ocasionales al detectar el tipo de algoritmo.
- Arreglos en casos límite de diagramas (por ejemplo, árboles con un solo nodo).
- Mejoras en el análisis de bucles y expresiones para evitar resultados negativos o notaciones confusas.
- Ajustes en Bubble Sort, Euclides y otros casos donde la complejidad podía salir mal en escenarios concretos.
- Se evitó recomendar Programación Dinámica en situaciones donde no aplica o no aporta mejora real.
- Se corrigió cuándo sugerir la optimización de "ventana deslizante" para no mostrarla donde no corresponde.

### Changed
- Se simplificó la experiencia de seguimiento: menos pasos innecesarios y vista más directa.
- El seguimiento recursivo ahora muestra explicaciones más legibles y parámetros más claros.
- Se renovaron componentes de interfaz para mantener una apariencia más consistente.
- Reorganización interna del motor de análisis para hacerlo más mantenible.
- En la interfaz se cambió el tono para hablar de "hipótesis" en vez de afirmaciones absolutas al sugerir Programación Dinámica.
- Se ajustaron ejemplos y modal para explicar mejor el nivel de confianza de cada sugerencia.

### Removed
- Se retiró el sistema antiguo de diagramas y código obsoleto relacionado.
- Se eliminaron rutas y piezas heredadas que ya no se usan en el flujo actual.

## [1.2.0]
### Added
- Plantilla de entorno de ejemplo para configurar fácilmente los modelos LLM del frontend sin tocar código.
- Documentación y script de monitoreo local para registrar rendimiento y errores de las operaciones LLM.
- Configuración base centralizada de LLM en el frontend para unificar modelos y endpoint y evitar fallos por variables ausentes.

### Fixed
- El endpoint de trazas devuelve también información completa para algoritmos recursivos e híbridos, y los diagramas recursivos en el frontend ya no se quedan bloqueados ni fallan por respuestas JSON mal formadas del LLM.
- El flujo de monitoreo corrige el manejo de métodos HTTP y amplía la cobertura de endpoints LLM, reduciendo errores silenciosos.
- El frontend deja de depender de modelos LLM hardcodeados y se comporta de forma resiliente cuando faltan variables de entorno.

### Changed
- **Prompts LLM (parser_assist y general):** Reglas de estilo canónico al generar pseudocódigo: una sola solución (1 procedimiento, 1 bloque \`pseudocode\`), versión canónica por defecto sin optimizaciones salvo petición explícita, variables convencionales (i, j, k, n, temp, etc.), máximo 3-5 comentarios cortos en el bloque, explicación breve fuera del bloque. Prioridad de bucles ajustada a "canónico" (FOR/WHILE según el algoritmo) en lugar de evitar WHILE.
- **Prompts LLM (renderizado):** Se refuerza uso de KaTeX con delimitadores $...$ / $$...$$ para complejidad y fórmulas (p.ej. $O(n^2)$) y se pide usar más **negrita** y \`código inline\` en explicaciones sin alargar.
- **Motor de análisis (iterativo y recursivo):** El motor calcula la complejidad con más precisión gracias a un mejor manejo de variables y tamaños. El analizador base admite más tipos de expresiones (mínimo, máximo) y sustituye alias cuando una variable es una copia del tamaño (por ejemplo `k <- n`). En algoritmos iterativos se identifican mejor las variables que controlan los bucles y los alias de tamaño, de modo que se analizan bien bucles anidados y límites que cambian (por ejemplo un bucle interno cuyo tope decrece). En recursivos se tienen en cuenta varios tamaños de subproblemas en divide y vencerás. Las utilidades de clases de complejidad normalizan mejor la variable de tamaño.
- **Bucles WHILE:** Se determina si un bucle está acotado según la condición y cómo se actualizan las variables, y se aplican nuevos patrones para inferir la complejidad.
- **Casos concretos:** Ajustes para que algoritmos como Bubble Sort (mejor caso) y otros con detección de tamaño y heurísticas específicas den el resultado esperado.
- **Tests:** Más pruebas para algoritmos con límites decrecientes y bucles anidados con reinicio de variable interna, que validan las nuevas mejoras.

### Removed
- Job `simplifier` eliminado del flujo LLM (tipos, configuración y documentación asociada), junto con su prompt y las claves de i18n obsoletas, para simplificar la superficie de configuración.

## [1.1.5]

### Added

- Scripts en el proyecto para lanzar tests (API, contrato, cobertura, etc.) y herramienta MCP para ejecutarlos; convenciones y documentación actualizadas.
- Animación suave al cambiar entre modo AALIE y modo manual en el selector.
- Tests que comprueban peor caso, mejor caso y caso promedio en algoritmos de estrés, contrato, canónicos y otros; cada algoritmo puede definir qué complejidad se espera en cada caso.
- Motor: algoritmos con recursión dentro de un bucle (por ejemplo generación de subconjuntos) se analizan con árbol de recursión y dan la complejidad correcta Θ(2^n).
- Motor: recurrencias tipo Euclides (MOD) → Θ(log n); recursión dentro de FOR por sustracción.
- Tests: algoritmos de estrés Prueba1–Prueba7, reestructuración de tests con soporte común (algoritmos, expectativas, aserciones), benchmark de 40 tests y oráculo de aserciones.

### Fixed

- Tests de complejidad: el mejor caso se comprueba según la teoría (búsqueda lineal, insertion sort, búsqueda binaria, WHILE compuesto); los tests ya no exigen que best sea igual que worst cuando no lo es.
- Motor: corrección al eliminar índices de bucle (i, j, k) de la expresión de coste final en algoritmos como insertion sort, evitando errores cuando la expresión los arrastraba.
- Prueba7 y tests de estrés: complejidad exponencial correcta y comprobación en todos los casos cuando hay especificación.
- Tests de contrato: solo se exige mejor caso o promedio cuando la especificación del algoritmo lo indica.
- Interfaz: textos de documentación y selector de idioma ya no se desbordan en pantallas pequeñas; cards y modales de documentación contienen bien el contenido; bloques de código con scroll horizontal cuando las líneas son largas.
- Motor: merge_sort, bucles rectangulares, exponenciación rápida, gramática ELSE IF, Torres de Hanoi, búsqueda binaria, quicksort, bucles infinitos y otros casos corregidos.
- Loader de análisis: botón cerrar bien colocado en error; Chatbot: campo de mensaje y icono de enviar sin solapamientos.

### Changed

- Botones principales (Ver Guía de Usuario, Ir a AALIE) y pie de página con estilo unificado y mejor comportamiento en móvil.

### Removed

- docs/test-architecture.md y test-baseline.md (contenido centralizado en tests/README.md); carpeta tests/integration.

## [1.1.4] - 2026-02-21

### Added

- Ejemplo de informe LaTeX (docs/latex-example/main.tex) con resultados del análisis de búsqueda lineal
- Hook useMediaQuery para detección responsive
- AAProgressLoader unificado (análisis y comparación), AnalysisProgressContext, hook useRunAnalysis; loader persistente durante navegación
- Guía de usuario: cards con modales (UserGuideCard, UserGuideModal, UserGuideTableOfContents); tipos estructurados (user-guide.ts)
- Módulo MCP: read_conventions, read_doc, list_components, changelog_template, i18n_reminder

### Changed

- Responsividad: inicio (AIModeView, ManualModeView, ChatBot), modals Execution Trace y GPU vs CPU, centrado de contenido y switcher de modo
- Traducciones centralizadas: `backend-content-translator.ts`; ComparisonModal, ComparisonLoader y proof steps con useTranslations; eliminado `proof-step-translator` deprecado
- Loader de análisis: unificado en AAProgressLoader; ManualModeView, examples, chat y analyzer migrados; barra y tooltip en mismo modal; barra más alta al inicio, fixed abajo al clasificar
- Editor Monaco: tema paleta app, JetBrains Mono; tooltips en esquina; botón Analizar azul; modal AST portaled a body
- Guía de usuario: grid de cards; documentación técnica: 11 secciones, paleta neutra
- Manual mode: blur en fondo (glass-modal-overlay-container-only con backdrop-filter)

### Removed

- AnalysisLoader.tsx y ComparisonLoader.tsx (reemplazados por AAProgressLoader)
- Página ui-test, ui-showcase, sección export, botón "Ver diagrama" e ImageModal de documentación

### Fixed

- Componentes glass que desaparecían al hacer scroll (Edge, Chrome, Firefox, Safari): añadido `position: relative` y `z-index: 1` a todas las clases glass para mantener stacking context correcto durante scroll
- Modals: bloqueo de scroll, botón cerrar (X) estilo DocumentationModal, spam de generate diagram (isGeneratingRef)
- Desbordes: StepInfo, cards GPU/CPU, ChatBot (bloques 420px, botones Copiar/Analizar), switcher Efficiency Equation, labels analysis method, badges, FormulaBlock, efecto glass (isolation)
- Errores LLM traducidos a mensajes legibles (`llm-error-translator`)
- Inferencia de variables: Bubble Sort O(1), ArrayParam, T_polynomial; bucles unbounded solo ∞
- Hydration error en analyzer: source y data cargados en useEffect (no en useState) para coincidir servidor/cliente
- Tooltips editor: `title` nativo; código persiste al cambiar modo; errores de parse reales; modal AST position fixed
- Loader global de navegación: NavigationLoadingWrapper restaurado en layout para PageLoader durante transiciones

## [1.1.3] - 2026-02-17

### Added

- Columna "Ops" en tabla de costos iterativos
- Validación de eficiencia de los 30 algoritmos de ejemplos (docs/pruebas-algoritmos.md)
- Módulo `while_analysis` y clasificación de bucles WHILE (bounded/unbounded/unknown)
- Campos `unbounded` y `unbounded_kind` en LineCost; badge "Puede no terminar" en LineTable
- Componente AALIEIcon; tests auténticos y exhaustivos para WHILE, determinísticos y casos promedio

### Changed

- Página ejemplos: complexity actualizada (Bubble Sort O(n²), Hanoi O(1), etc.); BST con raiz.izquierda/derecha
- Ck única por línea; SimpleVisitor/ForVisitor/IfVisitor/WhileVisitor con ops por expresión
- T_open y T_polynomial incluyen factor ops; fórmula T(n) = Σ C_k · ops_k · count_k
- Icono `smart_toy` por `aalie.svg`; WhileRepeatVisitor usa classify_while
- Tests de integración usan `analyze_algorithm(source)`
- Selector de idioma movido del header al footer
- Mejorada responsividad del footer

### Fixed

- RecursiveAnalyzer: subproblemas type "division" (raiz.izquierda/derecha) no añadían "b"
- IterativeAnalyzer: AST inválido, O(1) incorrecto para WHILE con log, parseo LaTeX `\log_k` y `\frac`
- Bucles unbounded: mostrar ∞ en costos y notación O(∞)/Θ(∞) en lugar de t_while
- Caso promedio determinístico y algoritmos con banderas (param-controlled)
- IterativeAnalysisView: ocultar bolitas cuando notación demasiado larga

## [1.1.2] - 2026-02-14

### Added

- Internacionalización con next-intl para soporte multiidioma
- Mensajes de error y feedback de usuario localizados
- Soporte de locale en análisis y trace de ejecución
- Integración de localización en la API de análisis y parser
- Referencia a convenciones de desarrollo en documentación de request-flow
- Componente `NavigationFooter` reutilizable para páginas de documentación y guías
- Referencia a `docs/development/i18n-labels-prompts.md` en documentación técnica

### Changed

- User-guide, documentación técnica y ejemplos usan `NavigationFooter` normalizado
- Editor Monaco: restaurada indentación (sin letterSpacing, detectIndentation: false) y loader pulse unificado
- Restaurada carga de fuentes original (Google Fonts directo) en lugar de next/font
- Eliminado separador (border-t) sobre footer en documentación técnica

## [1.1.1] - 2026-02-08

### Added

- Directrices de prioridad para generación de código en configuración LLM

## [1.1.0] - 2026-02-07

### Changed

- Referencias del proyecto actualizadas a AALIE en todo el codebase
- Umbral de cobertura en CI reducido de 70% a 60%
- Eliminada referencia a paquete local en requirements.txt

### Fixed

- Referencia a paquete local y versión de setuptools en requirements
- Tests de avg_model y avg_case: pasar `locale="es"` para compatibilidad con parametrización de idioma 
- Error de compilación: parámetro requerido tras opcional en `detectAndSelectMethod` (analyzer-helpers)
- Error de tipos: `locale` string no asignable a `"es" | "en"` en layout de locale
- Avisos de lint: dependencias exhaustivas en hooks (useCallback/useEffect) y variable `locale` no usada en ComparisonModal
- Error de tipos: `ComparisonT.view` no aceptaba segundo argumento para placeholders (caseNumber)
- Error de tipos: `locale` no existía en el tipo de `analyzeBody` en ManualModeView
- Error de tipos: `tRecursionTree` en RecursiveAnalysisView no aceptaba segundo argumento (levelWithNumber)
- Error de tipos: `routing.locales.includes(requested)` en request.ts (string vs "es"|"en")
- INVALID_MESSAGE EMPTY_ARGUMENT: reemplazo de t.rich por mensajes simples en user-guide y Footer (geminiHint); fallback para alt vacío en ImageModal

### Security

- Corrección de vulnerabilidades CVE en React Server Components

## [1.0.2] - 2025-12-05

### Added

- Detección refinada de early return en estructuras recursivas
- Detección mejorada del parámetro de tamaño en llamadas recursivas
- Sanitización de expresiones eliminando variables de iteración
- Manejo mejorado de variables de iteración en expresiones
- UI y funcionalidad mejoradas en ComparisonModal para datos recursivos
- Directrices de explicación de algoritmos priorizando concisión en español

### Changed

- Reorganización de imports y carga de variables de entorno en la API
- Estilo y tipografía del componente GPUCPUModal

### Fixed

- Lógica de extracción de datos para casos best y average en el analyzer

## [1.0.1] - 2025-12-04

### Added

- Lógica de ejecución de programas y mapeo de parámetros
- Manejo de API key en generación de diagramas y endpoints de recursión
- Lógica de ejecución optimizada y seguimiento de profundidad
- Documentación, guía de usuario y componentes de visualización de trace
- Soporte para dimensiones y rangos en parámetros de arrays
- Seguimiento de pasos de ejecución con microsegundos y tokens
- Análisis GPU vs CPU para algoritmos
- Trace de ejecución mejorado para algoritmos recursivos e híbridos

### Changed

- Limpieza de estructura del proyecto y archivos no usados

## [1.0.0] - 2025-12-02

### Added

- Trace de ejecución de pseudocódigo con gestión de entorno dedicada
- Rutas API y componentes UI para visualización de trace
- Generación de diagramas de trace con LLM
- Modal y diagrama de flujo para trace de ejecución paso a paso
- Endpoint de trace de ejecución para análisis iterativo y recursivo

## [0.8.2] - 2025-11-25

### Added

- Manejo del caso "same_as_worst" en componentes de análisis
- Criterios de simplificación actualizados en BaseAnalyzer

### Fixed

- Alineación de iconos en ComparisonModal

## [0.8.1] - 2025-11-24

### Added

- Manejo del caso "same_as_worst" en ComparisonModal e IterativeAnalysisView
- Verificación de datos comparables y lógica del botón de comparación en AnalyzerPage

## [0.8.0] - 2025-11-23

### Added

- Memoización en BaseAnalyzer y visitantes para optimizar análisis AST
- Detección de variabilidad de casos e integración en mensajes de análisis
- Detección de métodos y mensajes instructivos para análisis recursivo
- Animación de progreso y actualizaciones de mensajes durante análisis LLM
- Cálculo determinístico de T_polynomial con SymPy Poly
- Funcionalidad de comparación con LLM en AnalyzerPage
- Lógica de linealidad mejorada en RecursiveAnalyzer
- Botones de acción para métodos maestro e iteración en RecursiveAnalysisView
- Funcionalidad de reparación y manejo de errores en AnalyzerPage
- Validación de API key y modal para reparación de código

### Changed

- RecursionTreeModal ajustado para encajar en vista solo cuando está abierto
- Eliminación de enlaces de documentación obsoletos
- URLs de endpoints API actualizadas a rutas relativas
- Eliminación de .prettierrc y actualización de formato en componentes

### Fixed

- Casos de prueba en IterativeAnalyzer y RecursiveAnalyzer con expresiones constantes

## [0.7.3] - 2025-11-22

### Added

- Tests unitarios extensivos para RecursiveAnalyzer e IterativeAnalyzer
- Documentación mejorada en módulos de análisis, parsing y UI

### Changed

- Estructura de componentes y estrategias de reducción de complejidad
- README con descripción, características e instrucciones detalladas
- Rutas de import en módulos de análisis
- Guía de usuario y documentación mejoradas
- Instrucciones de testing y reporting de cobertura en CI
- Eliminación de endpoints de análisis obsoletos
- Dockerfile, requirements y archivos de test obsoletos limpiados
- Umbral de cobertura en CI de 80% a 70%

### Fixed

- Cobertura de tests

## [0.7.2] - 2025-11-22

### Added

- Selección de métodos y pasos de análisis para algoritmos recursivos en HomePage
- Detección de reducción de rango en RecursiveAnalyzer
- Selección de método preferido en RecursiveAnalyzer
- Soporte para recurrencias con desplazamiento lineal
- Método de ecuación característica para recurrencias lineales
- Método de árbol de recursión en RecursiveAnalyzer
- Detección de reducción de tamaño de variable (ej. QuickSort)
- Soporte del método de iteración en RecursiveAnalyzer

### Changed

- Formato y estructura en RecursiveAnalyzer

### Fixed

- Formato y estructura en RecursiveAnalyzer y manejo de respuestas

## [0.7.1] - 2025-11-16

### Added

- Sistema de análisis recursivo con Teorema Maestro
- Integración de ReactFlow para visualización de árboles de recursión
- Detección de early return y análisis de complejidad best/average/worst
- Soporte para múltiples llamadas recursivas y decrease-and-conquer

### Changed

- Protección de comandos LaTeX durante simplificación en RecursiveAnalyzer
- Integración de clasificación de algoritmos en flujo de análisis
- Estructura de request de análisis unificada

## [0.7.0] - 2025-11-10

### Added

- Análisis de caso promedio con AvgModel
- Manejo de expresiones constantes y evaluación de best case

### Changed

- Documentación y tests para análisis iterativo
- Estructura de request de análisis unificada
- Manejo de errores en Message y ChatBot

## [0.6.4] - 2025-11-09

### Added

- Soporte de API key opcional para interacciones LLM

### Changed

- Type safety en request bodies de API
- Simplificación de AnalyzerPage eliminando verificaciones de API key no usadas

## [0.6.3] - 2025-11-07

### Added

- Soporte de PRINT en gramática y componentes de análisis
- Configuración JOB_CONFIG más estricta para inicialización de variables
- Guía de usuario para flujo de análisis, LLM y operadores
- Modal de procedimiento general y selección de casos
- Formas finales y notación asintótica en ProcedureModal
- Multiplicador de bucles en BaseAnalyzer y generación de procedimientos
- procedures_by_line para seguimiento detallado de pasos

### Changed

- LLM simplifier y ProcedureModal con detalles mejorados

## [0.6.2] - 2025-11-06

### Added

- Loader animado para análisis de algoritmos
- Análisis de cierre en WhileRepeatVisitor para bucles WHILE
- Integración de dotenv y simplificación de conteo con LLM
- Estructura de respuesta con forma polinomial T(n)

### Changed

- Hooks para clasificación heurística y animación de progreso
- Configuración LLM y lógica de clasificación simplificadas

## [0.6.1] - 2025-10-25

### Added

- Simplificación algebraica en ForVisitor para cálculos de header
- Simplificación de conteo y almacenamiento raw en analyzers
- Simplificación de conteo en IterativeAnalyzer para sumatorias adicionales
- Pasos de derivación para ecuación T(n) en ProcedureModal
- Extracción de patrones y agrupación de términos en ProcedureModal
- Filtrado de pasos duplicados en ProcedureModal

### Changed

- Flujo de análisis con renombrado de funciones y mejor manejo de errores

## [0.6.0] - 2025-10-24

### Added

- ForAnalyzer y endpoints para bucles FOR anidados
- IfAnalyzer y endpoints para condiciones IF y escenarios FOR-IF
- SimpleAnalyzer y endpoints para líneas simples, llamadas y return
- WhileRepeatAnalyzer y endpoints para bucles WHILE y REPEAT
- IterativeAnalyzer unificado reemplazando analizadores específicos
- Endpoint de análisis dummy y modelo LineCost con notas opcionales
- Memoización y renderizado virtualizado en CostsTable y ProcedureModal
- Estructura de datos de análisis integrada en componentes UI
- Scrollbar personalizado y layout mejorado

## [0.5.3] - 2025-10-24

### Added

- react-markdown, rehype-highlight y remark-gfm para UI
- Configuración de modelo LLM y estilos mejorados en componentes

## [0.5.2] - 2025-10-18

### Added

- Integración de Azure AI Inference para clasificación y respuestas en ChatBot
- Modos de LLM local y remoto con verificación de conectividad
- Indicador de carga en AnalyzerEditor
- Animación shake en botón de ayuda IA y ManualModeView

### Changed

- Estructura de ManualModeView simplificada

## [0.5.1] - 2025-10-17

### Added

- Monaco Editor y paquetes relacionados
- Configuración de Next.js para Web Workers
- Mensajes de error estructurados en endpoint de parse
- Gramática extendida con clases, statements y nuevas keywords

### Changed

- Integración de AIModeView y ManualModeView en HomePage
- Manejo de animaciones y ajustes UI en ChatBot
- Estructura de mensajes y estado en HomePage
- Estructura del proyecto e instrucciones en README

## [0.5.0] - 2025-10-16

### Added

- Manejo de animaciones y ajustes UI en ChatBot
- Estructura de mensajes refinada y estado en HomePage

## [0.4.3] - 2025-10-15

### Added

- Codegen Python y endpoint POST /parse en FastAPI

## [0.4.2] - 2025-09-26

### Added

- Gramática v0.1 mínima del lenguaje de pseudocódigo

## [0.4.1] - 2025-09-22

### Added

- Componente Chatbot con animaciones y respuestas mock
- Manejo y persistencia de mensajes en ChatBot

## [0.4.0] - 2025-09-21

### Added

- Integración de asistente LLM y vista manual de código en página principal
- Nombre del asistente actualizado a Jhon Jairo con mensaje de bienvenida
- Contexto de navegación y componentes de carga
- Secciones de documentación y modal de showcase de UI, paquetes, herramientas y analyzer

## [0.3.4] - 2025-09-20

### Added

- Página de analyzer de complejidad con visualización de código y análisis de costos
- Componentes CodePane, CostsTable, Formula, FormulaBlock y ProcedureModal
- Integración de KaTeX para fórmulas matemáticas

### Fixed

- Directorio de salida y patrones include/exclude en tsconfig
- Contexto de build de Docker en CI
- Errores de build de TypeScript para CI
- Problemas de formato Prettier y arquitectura CI
- Errores de lint en workflow de CI

## [0.3.3] - 2025-09-20

### Added

- Configuración de CI para build, lint y testing
- Integración de Docker en tests de CI
- Configuración de CI con rama ci-test y versión de pnpm

### Changed

- Job de Docker renombrado a docker-integration
- Arquitectura de CI con gestión de dependencias
- Eliminación de archivos de configuración CI obsoletos
- Solo pnpm, eliminados lockfiles de npm

## [0.3.2] - 2025-09-20

### Added

- Paquete @aa/types completo
- Gramática ANTLR con parsers generados
- Parsers de gramática habilitados en contenedor API
- Configuración de pnpm para parsers Python
- Estructura de documentación con secciones de monorepo y UI showcase

### Changed

- Estructura de código mejorada para legibilidad
- Componente HealthStatus y descripciones de documentación

## [0.3.1] - 2025-09-20

### Changed

- Estructura de documentación mejorada

## [0.3.0] - 2025-09-19

### Added

- Cambios de código para mejorar funcionalidad y rendimiento
- Dependencia lucide-react y estilos glassmorphism en modals
- Loader global y componentes de carga
- Diagramas útiles para documentación
- Páginas y componentes de documentación para guías técnicas y de usuario

### Changed

- Eliminación de archivos no usados

## [0.2.2] - 2025-09-19

### Added

- Scaffold de tipos compartidos (Health y GrammarParse) en workspace

### Changed

- Directorios scaffold mantenidos con .gitkeep

## [0.2.1] - 2025-09-15

### Added

- Scaffold de gramática ANTLR4 compartida (targets TS y Py) con scripts de build

## [0.2.0] - 2025-09-14

### Added

- CORS solo para desarrollo vía variable de entorno (DEV_ALLOWED_ORIGINS)
- Instalación de recursos base del proyecto

## [0.1.2] - 2025-09-09

### Added

- Páginas about-us, home y privacy con estilos glassmorphism

## [0.1.1] - 2025-09-08

### Added

- Conexión API con health check
- Dockerfile para frontend
- Entorno venv Python local para API
- Integración de Tailwind CSS
- Proyecto Next.js con TypeScript, archivos de configuración y versiones fijas

### Fixed

- Versión de pnpm actualizada a una válida

### Changed

- Restricciones de versión de Node actualizadas para compatibilidad con pnpm

## [0.1.0] - 2025-09-08

### Added

- Monorepo con pnpm workspaces y configuración base
