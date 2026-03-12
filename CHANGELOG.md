# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- **Trace recursivo:** Tokens y microsegundos por nodo en el árbol de llamadas (suma de steps por callId). Formato de llamadas `funcion(a, b, c)` en lugar de `fn(k=v)`. Explicación determinista `explain_recursion_tree` para el árbol de recursión. Botón recargar invalida cache (forceRefresh). Layout del call tree con nodos más grandes y mayor separación para evitar solapamiento.

### Fixed
- **buscarLista y árbol de llamadas:** (1) `_execute_return` ejecuta llamadas recursivas en RETURN (ej. `RETURN buscarLista(nodo.siguiente, valor)`) para registrar el árbol. (2) `_evaluate_condition` no sobrescribe condiciones con valores concretos (nodo==null) con heurística best/worst. (3) Comparación explícita con None para listas enlazadas. (4) `_has_recursive_call` considera `callee` además de `name` en nodos Call. (5) `call_tree_builder` maneja `base_case` nulo. (6) `environment`: Literal con dict/None se devuelve sin SymPy; Field con base Literal resuelve campos; Identifier con dict/None se resuelve a Literal.
- **Vista trace recursiva:** La columna derecha (diagrama, controles) ahora tiene altura mínima visible (`min-h-[420px]`). Loader mientras se detecta el algoritmo. Mensaje `callTreeUnavailable` cuando el árbol de llamadas no se puede generar (ej. factorial con retorno en expresión).

### Removed
- **LLM de diagramas eliminado por completo:** Rutas `/api/llm/generate-diagram` y `/api/llm/recursion-diagram`, prompts asociados, `CallTreeView`, `RecursionTreeView`. Los diagramas (iterativo y árbol de llamadas recursivas) provienen exclusivamente del backend determinista vía `/api/analyze/trace` con `include_execution_diagram` e `include_call_tree`. Eliminados `GEMINI_DIAGRAM_MODELS`, `DiagramGraphResponse`, probes de monitoring para esos endpoints.

### Added
- Traducciones i18n para eventKind en StepInfo: `eventKind_assign`, `eventKind_return_emit`, `eventKind_condition_eval`, etc. (es/en).
- Estimación determinista de tokens y microsegundos en TraceBuilder: `_estimate_step_cost()` por tipo de paso; propagación a nodos del diagrama de seguimiento.
- `DiagramKind` en tipos trace: `execution_diagram` | `call_tree` | `recurrence_tree` para distinguir semánticamente los diagramas.
- Generadores deterministas de diagramas (sin LLM): `execution_diagram_builder`, `call_tree_builder`, `recurrence_tree_builder`.
- Flags en `/analyze/trace`: `include_execution_diagram`, `include_call_tree` para artefactos opcionales.
- Feature flag `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS` para migración progresiva.
- Componentes: `ExecutionGraphView`, `CallTreeView`, `RecurrenceTreeView`.
- `explanation_templates.py` para explicaciones deterministas por plantillas.
- Tests oráculo: `test_execution_diagram_builder`, `test_call_tree_builder`.
- `AAButton`: componente reutilizable con variantes de color (primary, amber, purple, blue, cyan, secondary) alineado al estilo de las cards de ejemplos (`bg-{color}/25 border-{color}/40 hover:bg-{color}/35`).
- Vista dedicada de seguimiento de pseudocódigo (iterativo y recursivo): reemplaza el modal por una vista full-page con patrón de cambio tipo homepage (animación opacity/translate-y). Panel izquierdo tipo chat bloqueado con pseudocódigo y progreso por línea; área principal con árbol/diagrama, tablas y explicación.
- `TraceDedicatedView` y `TraceChatPanel`: componentes para la vista de seguimiento con layout responsive (mobile: columna única; desktop: panel chat + contenido).
- Persistencia del trace en sessionStorage (TTL 5 min) para evitar recargas al volver a la vista.
- Tests de sistema para `/analyze/trace`: factorial, búsqueda binaria, Fibonacci, búsqueda lineal.
- `docs/api/trace-format.md`: documentación del contrato de datos del trace para el frontend.
- `docs/recursion-tree-edge-cases.md`: Registro de algoritmos de referencia, patrones problemáticos y casos límite del árbol de recursión para futuros sprints.
- Tests de estructura del árbol (`test_recursion_tree_structure.py`): Merge sort, búsqueda binaria, Fibonacci, Quicksort peor caso.
- Reingeniería del motor WHILE: núcleo `ir/` (ast_normalizer, expr_utils, node_identity) unificado.
- Módulo `semantics/` (symbol_table, type_inference, scope_resolver) para inferencia de roles sin heurísticas por nombre.
- Motor `while_engine/` con CFG local, guard_analysis, update_analysis, control_variables, progress_proofs, sympy_bridge, iteration_bounds.
- Patrones estructurales: linear_counter, flag_kill, euclid_mod, binary_search_interval.
- WhileEngine.analyze() integrado en el visitor; delegación al engine antes del clasificador legacy.
- Pruebas metamórficas (test_while_metamorphic.py): renombrar variables no cambia clasificación.
- Marcador pytest `while_domain` para tests del dominio WHILE.
- Test de regresión para bubble sort con variable `longitud` decreciente (BUBBLE_SORT_LONGITUD) que valida ausencia de conteos negativos.
- `assert_notation_no_array_symbols` en assertions.py para validar que la notación no contenga símbolos de arrays.
- Test `test_bubble_sort_longitud_correct_complexity` que valida Θ(n²) worst/avg, Θ(n) best y ausencia de símbolos de array en BUBBLE_SORT_LONGITUD.

### Fixed
- **StepInfo:** El tipo de paso (eventKind) se muestra traducido (ej. "Retorno" en lugar de "return_emit").
- **Executor:** Soporte para `callee` en nodos Call (gramática usa `callee`, no `name`).
- **Árbol de llamadas:** Logging cuando `build_call_tree` falla; test `test_trace_with_call_tree_deterministic` para validar callTree con include_call_tree.
- **Árbol de llamadas determinista:** Con `NEXT_PUBLIC_USE_DETERMINISTIC_DIAGRAMS=true`, ya no se usa LLM como fallback; se muestra placeholder si no hay callTree. Cache de trace aplica graph/recursionDiagram deterministas.
- **Trace iterativo:** El contenido ya no desaparece al cambiar de caso (best/avg/worst). Solo se resetea `algorithmKind` cuando cambia el código fuente; al cambiar solo caso o tamaño de entrada se mantiene la vista iterativa con estado de carga.
- **recursion-diagram:** (1) Aceptar respuestas con `nodes`/`edges` en raíz o dentro de `graph`. (2) Fallback: si edges vacío pero hay nodos con posición, inferir aristas desde layout (árbol por Y). (3) Prompt reforzado: edges obligatorios. (4) Evitar spam; JSON malformado con jsonrepair.
- **Árbol de recursión:** Texto `irregularTree` corregido: "Árbol con subproblemas duplicados (ej. Fibonacci)" en lugar de "los nodos se duplican", alineado con terminología pedagógica (subproblemas vs nodos).
- **Fibonacci con método árbol:** Rama explícita en `_apply_recursion_tree_method` para recurrencias multi-término (T(n)=T(n-1)+T(n-2)) que evita caer en estructura divide-and-conquer incorrecta. Preservar type=linear_shift en recurrencia cuando method=recursion_tree y has_subtraction con múltiples coeficientes.
- **Modal árbol de recursión:** Blur del fondo completo (z-[70], glass-modal-overlay-fixed), tamaño mayor (1400px × 90vh), eliminado minimapa.
- **Bubble sort con i < n AND swapped:** (1) Engine WHILE: en best case, si `classify_while` devuelve `iterations_expr="1"` (flag kill), se prioriza sobre el patrón `linear_counter` que devolvía n, corrigiendo Θ(n²) → Θ(n) en best case. (2) T_polynomial: `powsimp` en coeficientes y en el término completo (coeff·n^degree) antes de LaTeX, evitando "- 4 n n" → "-4 n²". (3) Procedimiento: todos los pasos que generan LaTeX desde SymPy usan `_sympy_to_latex` (ParensLatexPrinter), evitando ambigüedades como `n · - i + n` → `n · (-i + n)`.
- **Análisis bubble sort mejorado (y genérico):** (1) `detect_size_variables_from_proc` extrae variable de tamaño desde `ArrayParam.start`/`end` (ej. A[n] → n), evitando O(1) incorrecto. (2) Fallback `expr_has_size` en `IterativeAnalyzer`: si `t_open_expr` contiene la variable principal en `free_symbols`, se calcula la complejidad real aunque la heurística falle. (3) Normalización de potencias con `powsimp` antes de LaTeX: productos repetidos (n·n, m·m·m) se muestran como potencias. (4) Sustitución de alias (`longitud`, `tam`, etc.) antes de `close_summation` para que el cierre evalúe correctamente. (5) `_sympy_to_latex` con printer que envuelve Add en paréntesis cuando es factor de Mul (n·(k-1), m·(i+1), etc.).
- Euclides MCD: `count_str` ya no se corrompe a `n + 1`; se preservan parámetros `a` y `b` en `min(a,b)` gracias a `preserve_symbols` en `_sanitize_expression` cuando la fila tiene `euclid_pattern`.
- Parámetros de tipo array (A, B, arr, etc.) ya no aparecen en la notación de complejidad: se excluyen en `detect_size_variables_from_proc` (ArrayParam, nombres típicos y penalización cuando vienen del cuerpo), en `_fallback_dominant_from_string` (tokens alternativos) y en `_sanitize_expression` (sustitución por variable principal).
- Variables de control en límites de Sum (ej. `longitud` en `FOR j=1..longitud-1`) ya no se sustituyen por 0, evitando conteos negativos como `-n` en algoritmos tipo bubble sort mejorado.
- `_sanitize_expression` e `IterativeAnalyzer`: no sustituir por 0 cuando el resultado sería negativo; usar variable principal (n) como cota conservadora.
- `SummationCloser`: sustitución segura de variables de iteración (i, j, k) que evita resultados negativos mediante `_safe_substitute_iteration_var`.

### Changed
- **TraceBuilder y CodeExecutor enriquecidos (Fase 3):** eventKind semántico (assign, condition_eval, loop_iter_enter, call_enter, return_emit, print), decision en steps (conditionText, result), RecursionCall con parent_id, return_value, base_case, function_name, entry_line. record_return_value y record_base_case.
- **TraceFlowDiagram** renombrado a `ExecutionGraphView`; `RecursionTreeView` separado en `CallTreeView` (llamadas) y `RecurrenceTreeView` (analítico).
- **Corrección terminológica global (Fase 0):** Traza de ejecución, diagrama de seguimiento, árbol de llamadas recursivas, árbol de recurrencia. i18n: `callTreeTitle`, `recurrenceTreeTitle`, `executionDiagram`, `executionDiagramSection`, `generatingExecutionDiagram`, `generatingCallTree`. Docs: `trace-format.md` con glosario. Tipos: `DiagramKind`.
- **Trace iterativo (vista dedicada):** Rediseño completo: layout grid 2 columnas (lg:grid-cols-2) con glass-card; columna izquierda: seguimiento paso a paso; columna derecha: controles, variables y diagrama. Eliminadas alturas fijas; secciones flexibles con min-h-0 overflow-hidden. Selector de caso (best/avg/worst) integrado en header de la tarjeta de seguimiento.
- **Trace iterativo (componentes):** StepInfo con grid responsive (grid-cols-2 sm:grid-cols-3 lg:grid-cols-5); StepControls compacto en fila horizontal; DiagramSection con altura flexible (min-h-[200px] h-[min(400px,50vh)]); VariablesPanel e InputSizeControl con orden y espaciado mejorados. Mejoras aplicadas también al variant modal.
- **Accesibilidad trace:** StepInfo con aria-live="polite" y aria-atomic; StepControls con aria-label en todos los botones.
- Botones del analyzer y ManualModeView: reemplazo de `glass-button` por `AAButton` con variantes primary/amber.
- ExampleCard: botón Analizar migrado a `AAButton` variant="primary".
- LoaderDemo: hover de cards usa `hover:bg-primary/25 hover:border-primary/40` en lugar de `hover:glass-button`.
- Eliminada clase `.glass-button` de globals.css; usar `AAButton` en su lugar.
- Vista trace: persistencia al volver (TraceDedicatedView se mantiene montada tras abrir); sin flash de versión iterativa (placeholder cuando algorithmKind es null); modal diagrama fullscreen con fondo opaco y sin fragmentos de contenido previo.
- Vista trace: eliminado botón recargar; sin loader al cambiar a vista de seguimiento (se muestra layout directamente).
- Vista trace recursivo (dedicated): Diagrama y Explicación apilados verticalmente (uno encima del otro) en lugar de columnas; eliminados labels repetidos (Diagrama de Recursión / Árbol de Recursión); eliminadas líneas divisorias largas entre columnas; `MarkdownRenderer` con prop `hideHorizontalRules` para ocultar `---`/`***` en explicaciones.
- Botón "Ver seguimiento" abre vista dedicada en lugar del modal; botón "Volver" en esquina superior izquierda restaura la vista de análisis.
- `IterativeTraceContent` y `RecursiveTraceContent`: prop `variant` ("modal" | "dedicated") para layout de 2 o 3 columnas.
- `TraceFlowDiagram`: zoom mejorado (minZoom 0.15, maxZoom 2), nodos más compactos, fitView con padding 0.35, textos i18n.
- `DiagramSection`: altura del diagrama iterativo aumentada a min-h-[350px] h-[400px].
- Microcopys y secuencia explicativa: setupIntro, stepShows, complexitySummary en executionTrace.
- `PseudocodeViewer`: prop `hideHeader` para uso dentro de TraceChatPanel.
- Página de ejemplos: notación asintótica teórica de Bubble Sort actualizada a O(n²) en todos los casos (versión canónica con FOR anidado).
- Prompts LLM (general y parser_assist): menos comentarios en código (preferir sin comentarios; máx 1-2 si se usan, ≤30 caracteres). Reforzada sección GRAMÁTICA: referencia explícita a packages/grammar/grammar/Language.g4 como fuente de verdad.
- Motor WHILE: migración de `while_analysis/` a `while_engine/`; guard, updates y classifier ahora en `while_engine/`.
- Eliminada duplicidad de carpetas; visitor e engine importan desde `while_engine`.

### Removed
- `ExecutionTraceModal` del analyzer: reemplazado por TraceDedicatedView integrada en la página.
- Carpeta `while_analysis/` (guard.py, updates.py, classifier.py migrados a while_engine).
- `while_engine/average_models.py`, `cfg.py`, `iteration_bounds.py` (código muerto no usado).

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
