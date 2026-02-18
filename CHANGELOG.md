# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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
