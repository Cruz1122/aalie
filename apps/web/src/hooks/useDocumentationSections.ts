import { useMemo } from "react";

import { DocumentationSection } from "@/types/documentation";

export const useDocumentationSections = (): DocumentationSection[] => {
  return useMemo(
    () => [
      {
        id: "arquitectura",
        titleKey: "arquitectura",
        descriptionKey: "arquitectura",
        title: "Arquitectura y flujo de peticiones",
        description:
          "Monorepo con web (Next.js+TS) y api (FastAPI+Py 3.11). REST para /parse, /analyze; BFF solo para /api/llm/*. Procesamiento sin estado.",
        image: {
          src: "/docs/arquitectura.webp",
          alt: "Arquitectura y flujo general",
          width: 1600,
          height: 900,
          caption: "Arquitectura y flujo principal",
        },
        content: {
          type: "text",
          sections: [
            {
              title: "Visión general",
              content:
                "Monorepo: web (Next.js+TS), api (FastAPI+Py 3.11), packages @aa/grammar y @aa/types. Sin BD ni persistencia; todo en memoria por solicitud.",
            },
            {
              title: "Flujo de peticiones",
              content:
                "Iterativo: POST /grammar/parse → AST. POST /classify → heurística (NO LLM). POST /analyze/open → IterativeAnalyzer (worst/best/avg).\n\nRecursivo: /parse → /classify → /analyze/detect-methods → /analyze/open con RecursiveAnalyzer.\n\nNext.js SOLO hace proxy para /api/llm/*. Endpoints /grammar/*, /classify, /analyze/* van directo al backend Python.",
            },
            {
              title: "Parse y Analyze",
              content:
                "/parse: ANTLR devuelve AST canónico o errores con línea/columna. /analyze: recibe AST, aplica reglas de conteo, arma sumatorias con SymPy, produce T_best/T_avg/T_worst en LaTeX.",
            },
          ],
        },
      },
      {
        id: "flujo-ui",
        titleKey: "flujoUi",
        descriptionKey: "flujoUi",
        title: "Flujo de análisis en la UI",
        description:
          "El usuario escribe en Monaco (validación inmediata con parser TS en Web Worker); tras una pausa se llama a /parse y, con AST válido, a /analyze. El análisis puede iniciarse desde el editor manual o desde el chatbot. Durante el análisis, un loader a pantalla completa muestra el progreso, etapas (parseo, clasificación, sumatorias, simplificación) y el tipo de algoritmo identificado. La vista muestra código numerado, tabla de costos (C_k, #ejec, costo) con selector de casos (Best/Avg/Worst), tarjetas de resumen con notación asintótica, y modales de procedimiento detallado (general y por línea) con pasos en LaTeX normalizados.",
        image: {
          src: "/docs/ui-flujo.webp",
          alt: "Flujo de UI y resultados",
          width: 1600,
          height: 1200,
          caption: "Flujo UI: editor, tabla de costos y modal de procedimiento",
        },
      },
      {
        id: "visualizaciones",
        titleKey: "visualizaciones",
        descriptionKey: "visualizaciones",
        title: "Visualizaciones",
        description:
          "CFG, árbol de recursión y diagramas de trace con React Flow. Layout Dagre, nodos personalizados.",
        image: {
          src: "/docs/cfg-recursion.webp",
          alt: "CFG y árbol de recursión",
          width: 1400,
          height: 900,
          caption: "CFG y árbol de recursión desde el AST",
        },
        content: {
          type: "text",
          sections: [
            {
              title: "CFG y árbol de recursión",
              content:
                "Desde el AST se generan CFG (bloques y flujo) y árbol de recursión. Render con Cytoscape.js, sincronizado con líneas del código.",
            },
            {
              title: "React Flow",
              content:
                "TraceFlowDiagram, RecursionTreeModal, RecursiveTraceContent. Layout Dagre, zoom/pan, virtualización. Convierte trace data en nodos y edges.",
            },
          ],
        },
      },
      {
        id: "errores",
        titleKey: "errores",
        descriptionKey: "errores",
        title: "Manejo de errores",
        description:
          "API caída → UX limitada con parser cliente y banner; gramática inválida → errores con línea/columna y sugerencias del LLM; sumatoria no cerrable → se muestra sumatoria abierta con recomendaciones (rango, cambio de variable, particiones) y diagnóstico asistido por LLM; no hay BD y los logs son técnicos y temporales.",
        image: {
          src: "/docs/errores.webp",
          alt: "Estrategias de manejo de errores",
          width: 1400,
          height: 900,
          caption: "Decisiones de UI frente a errores comunes",
        },
      },
      {
        id: "llm",
        titleKey: "llm",
        descriptionKey: "llm",
        title: "Integración con LLM",
        description:
          "Corrección de gramática, análisis desde chat, simplificación matemática, generación de procedimientos. Jobs: parser_assist, general, simplifier, repair, compare.",
        image: {
          src: "/docs/llm.webp",
          alt: "Flujo de uso de LLM",
          width: 2000,
          height: 750,
          caption: "Ruta de comparación con LLM",
        },
        content: {
          type: "text",
          sections: [
            {
              title: "Usos en el flujo",
              content:
                "(1) Corrección de gramática en errores de sintaxis. (2) Análisis directo desde bloques de código en el chat. (3) Simplificación matemática con SymPy. (4) Generación de procedimientos en LaTeX. BFF /api/llm/* invoca Gemini u OpenAI por env.",
            },
            {
              title: "Jobs y modelos",
              content:
                "parser_assist, general, simplifier, repair: Gemini 2.5 Flash. compare: Gemini 2.5 Pro. recursion-diagram: Gemini 2.0 Flash. NOTA: classify está DEPRECADO; la clasificación es por heurística en /classify (backend), NO usa LLM.",
            },
          ],
        },
      },
      {
        id: "i18n-labels-prompts",
        titleKey: "i18n",
        descriptionKey: "i18n",
        title: "Internacionalización, Labels y Prompts",
        description:
          "Soporte multiidioma (es/en), sistema de labels en backend para procedimientos y trace, y prompts de LLM parametrizados por locale.",
        content: {
          type: "text",
          sections: [
            {
              title: "Internacionalización",
              content:
                "next-intl con messages/es.json y messages/en.json. Rutas con prefijo [locale] (/es/analyzer, /en/analyzer). LocaleSwitcher en Header, useLocale(), useTranslations(). Navegación con @/i18n/navigation. El frontend envía locale en el body de las peticiones a /analyze/open, /api/llm y /analyze/trace.",
            },
            {
              title: "Sistema de Labels (Backend)",
              content:
                "apps/api/app/modules/analysis/translations.py: PROCEDURE_LABELS, NOTES_LABELS, TRACE_STEP_LABELS (en/es). Funciones get_labels(locale), get_note_labels(locale), get_trace_step_labels(locale). Usados en BaseAnalyzer, IterativeAnalyzer, RecursiveAnalyzer, SummationCloser, Executor. Fallback a 'en' si locale no existe.",
            },
            {
              title: "Prompts por Idioma",
              content:
                "apps/web/src/app/api/llm/prompts/index.ts: getPrompt(job, locale). Jobs con prompts localizados: classify, parser_assist, general, simplifier, repair, compare. response-language.ts: getResponseLanguageInstruction, getExplanationLanguageInstruction. Prompts de diagramas: getGenerateDiagramSystemPrompt(locale), getRecursionDiagramSystemPrompt(locale). Parámetro locale en requests a /api/llm.",
            },
          ],
        },
      },
      {
        id: "monorepo",
        titleKey: "monorepo",
        descriptionKey: "monorepo",
        title: "Paquetes del Monorepo",
        description:
          "Este monorepo está organizado en dos paquetes especializados que trabajan en conjunto. El paquete @aa/grammar se encarga de definir la gramática ANTLR y generar parsers tanto para TypeScript como Python, garantizando que el AST sea idéntico entre cliente y servidor. Por otro lado, @aa/types centraliza todos los contratos de API y DTOs compartidos entre la web y el API, proporcionando tipado fuerte y consistencia. La interfaz de usuario utiliza componentes nativos cuidadosamente optimizados para ofrecer el máximo rendimiento.",
        content: {
          type: "packages",
          packages: [
            {
              name: "@aa/grammar",
              purpose: "Gramática ANTLR y parsers",
              description:
                "Este paquete define la gramática del lenguaje y se encarga de generar parsers especializados. Para TypeScript, proporciona validación en tiempo real en el cliente, mientras que para Python genera el análisis formal en el servidor. Su objetivo principal es garantizar que ambos entornos interpreten el código de manera absolutamente idéntica, manteniendo un AST canónico.",
              io: {
                input: "Pseudocódigo del usuario",
                outputs: [
                  "TypeScript: src/ts/* (validación/UX)",
                  "Python: out/py/* (análisis formal)",
                ],
              },
              usedBy: ["Web (validación en vivo)", "API (parse canónico)"],
              notes: [
                "Parsers Python pre-generados para evitar dependencia Java",
                "No persiste datos, solo transforma a AST",
                "Crítico para consistencia cliente-servidor",
              ],
            },
            {
              name: "@aa/types",
              purpose: "Tipos y contratos compartidos",
              description:
                "Funciona como la fuente central de verdad para todos los tipos y contratos del sistema. Contiene las interfaces TypeScript compartidas que definen la estructura de requests, responses, modelos de interfaz de usuario y estructuras de costes. Su importancia radica en prevenir desajustes entre el frontend y backend, asegurando comunicación perfecta.",
              io: {
                input: "Definiciones TypeScript en src/",
                outputs: [
                  "dist/index.{js,d.ts} consumible por cualquier paquete",
                ],
              },
              usedBy: [
                "Web (tipado de llamadas/render)",
                "API (contratos y validación)",
              ],
              notes: [
                "Source of truth de contratos",
                "Cambios requieren versionar y alinear web/API",
                "Evita desajustes y 'tipo-copia'",
              ],
            },
          ],
        },
      },
      {
        id: "herramientas",
        titleKey: "herramientas",
        descriptionKey: "herramientas",
        title: "Herramientas de desarrollo",
        description:
          "Lint (ESLint, Ruff), format (Prettier, Black), scripts. Variables de entorno y metadata del trace.",
        content: {
          type: "text",
          sections: [
            {
              title: "Lint y format",
              content:
                "Frontend: ESLint v9 (eslint.config.mjs), Prettier (.prettierrc). Backend: Ruff, Black (pyproject.toml). Scripts: pnpm run lint:all, format:all, lint:web, lint:api.",
            },
            {
              title: "Variables de entorno",
              content:
                "Backend: CODE_EXECUTION_TIMEOUT (5000ms), SYMPY_TIMEOUT (5000ms), LLM_TIMEOUT (30000ms), ENABLE_CACHE (true). Frontend: NEXT_PUBLIC_GEMINI_API_KEY, NEXT_PUBLIC_API_URL (default localhost:8000).",
            },
            {
              title: "Metadata del trace",
              content:
                "/analyze/trace retorna: execution_time, tokens_used, cost, model.",
            },
          ],
        },
      },
      {
        id: "analisis",
        titleKey: "analisis",
        descriptionKey: "analisis",
        title: "Análisis de complejidad",
        description:
          "Interfaz 3 columnas, modos iterativo/recursivo, Teorema Maestro, memoización, scoring GPU/CPU, renderizado LaTeX.",
        content: {
          type: "text",
          sections: [
            {
              title: "Interfaz",
              content:
                "3 columnas: código numerado, tabla de costos (C_k, #ejec, costo), visualizaciones LaTeX. Selector Best/Avg/Worst. Modal de procedimiento con pasos detallados. Componentes: CodePane, CostsTable, ProcedureModal.",
            },
            {
              title: "Análisis iterativo",
              content:
                "FOR, WHILE, REPEAT, IF. Modos best/worst/avg con modelos probabilísticos (uniform, symbolic). Visitors: ForVisitor, IfVisitor, WhileRepeatVisitor, SimpleVisitor. Endpoint POST /analyze/open.",
            },
            {
              title: "Análisis recursivo",
              content:
                "Teorema Maestro para T(n)=a·T(n/b)+f(n). Método de iteración para decrease-and-conquer. Detección automática de recurrencias. Árbol de recursión, procedimiento con pasos LaTeX. Ejemplos: Merge Sort Θ(n log n), Binary Search Θ(log n), Factorial Θ(n).",
            },
            {
              title: "Memoización",
              content:
                "Cache de nodos AST repetitivos (Block, For, If). Clave: node_id | mode | context_hash. Reduce O(n^k) a O(n·k) en bucles anidados.",
            },
            {
              title: "GPU vs CPU",
              content:
                "Scoring 0-100. Penaliza: recursión, branching. Favorece GPU: loops independientes, arrays, operaciones matemáticas. Recomendación según scores.",
            },
            {
              title: "Renderizado LaTeX",
              content:
                "KaTeX para Formula/FormulaBlock. SSR-safe con renderLatexToHtml. Componentes inline y display.",
            },
          ],
        },
      },
      {
        id: "grammar",
        titleKey: "grammar",
        descriptionKey: "grammar",
        title: "Gramática y Parser",
        description:
          "Sistema completo de parsing basado en ANTLR4 que define la sintaxis del lenguaje de pseudocódigo y genera parsers para TypeScript y Python. Soporta procedimientos, estructuras de control, arrays con rangos, operadores normalizados y produce un AST canónico con información de posición para diagnósticos precisos.",
        content: {
          type: "grammar",
          overview: {
            title: "Visión General",
            description:
              "La gramática define un lenguaje de pseudocódigo estructurado para análisis algorítmico, con soporte completo para procedimientos, estructuras de control y expresiones matemáticas.",
            technology: "ANTLR 4.13.2",
            location: "packages/grammar/grammar/Language.g4",
            generators: [
              "TypeScript: validación en tiempo real en el cliente (Web Worker)",
              "Python: análisis formal en el servidor (FastAPI)",
            ],
          },
          features: {
            title: "Características Principales",
            items: [
              {
                name: "Procedimientos con Parámetros Tipados",
                description:
                  "Define funciones con parámetros escalares, arrays con rangos (A[1]..[n]) y objetos tipados.",
                example: "factorial(n) BEGIN ... END",
              },
              {
                name: "Estructuras de Control",
                description:
                  "Soporte completo para IF-THEN-ELSE, FOR, WHILE y REPEAT-UNTIL con bloques obligatorios.",
                example: "FOR i <- 1 TO n DO BEGIN ... END",
              },
              {
                name: "Operadores Normalizados",
                description:
                  "Conjunto cerrado de operadores aritméticos, relacionales y lógicos con precedencia estándar.",
                example: "resultado <- (a + b) * c DIV 2",
              },
              {
                name: "Arrays Multidimensionales",
                description:
                  "Soporte para declaración y acceso a arrays con múltiples dimensiones.",
                example: "matriz[i][j] <- valor",
              },
              {
                name: "Sentencias PRINT",
                description:
                  "Permite mostrar valores en consola con soporte para strings literales, variables y expresiones.",
                example: 'print("Total: ", resultado);',
              },
            ],
          },
          syntax: {
            title: "Sintaxis del Lenguaje",
            sections: [
              {
                name: "Definición de Procedimientos",
                code: String.raw`nombreProcedimiento(parametros) BEGIN
    sentencias...
END`,
                notes: [
                  "Parámetros escalares: procedimiento(a, b, c)",
                  "Arrays: procedimiento(A[n]) o procedimiento(A[1]..[n])",
                  "Objetos: procedimiento(Clase objeto)",
                ],
              },
              {
                name: "Asignación",
                code: String.raw`variable <- expresion;
variable := expresion;
variable 🡨 expresion;
variable ← expresion;
variable ⟵ expresion;`,
                notes: [
                  "Soporta múltiples operadores de asignación (ASCII y Unicode)",
                  "Punto y coma obligatorio",
                  "Símbolos Unicode: 🡨, ←, ⟵",
                ],
              },
              {
                name: "Estructuras de Control",
                code: "IF (condicion) THEN BEGIN ... END ELSE BEGIN ... END\nFOR variable <- inicio TO fin DO BEGIN ... END\nWHILE (condicion) DO BEGIN ... END\nREPEAT ... UNTIL (condicion);",
                notes: [
                  "Bloques BEGIN...END obligatorios",
                  "También se pueden usar llaves { }",
                  "Condiciones entre paréntesis",
                ],
              },
              {
                name: "Llamadas a Procedimientos",
                code: "CALL nombreProcedimiento(argumentos);\nresultado <- funcion(argumentos);",
                notes: [
                  "CALL para statements",
                  "Sin CALL para expresiones",
                  "Soporte para recursión",
                ],
              },
              {
                name: "Sentencias PRINT",
                code: 'print("Texto literal", variable1, expresion2);\nprint("Total: " + n);',
                notes: [
                  "Soporta múltiples argumentos separados por coma",
                  "Strings literales entre comillas dobles",
                  'Escapar comillas internas con \\"',
                  "Puede incluir variables y expresiones",
                ],
              },
            ],
          },
          operators: {
            title: "Operadores Soportados",
            categories: [
              {
                name: "Aritméticos",
                operators: ["+", "-", "*", "/", "DIV", "MOD"],
                precedence: "Multiplicativos > Aditivos",
              },
              {
                name: "Relacionales",
                operators: [
                  "=",
                  "!=",
                  "<>",
                  "≠",
                  "<",
                  ">",
                  "<=",
                  "≤",
                  ">=",
                  "≥",
                ],
                precedence: "Menor que operadores lógicos",
              },
              {
                name: "Lógicos",
                operators: ["AND", "OR", "NOT"],
                precedence: "NOT > AND > OR",
              },
            ],
          },
          ast: {
            title: "Estructura del AST",
            description:
              "El AST generado es canónico e idéntico entre TypeScript y Python, garantizando consistencia entre cliente y servidor.",
            nodeTypes: [
              "Program: Nodo raíz con array de procedimientos",
              "ProcDef: Definición de procedimiento con nombre, parámetros y cuerpo",
              "Block: Bloque de sentencias",
              "Assign: Asignación de variable",
              "For/While/If: Estructuras de control",
              "Binary/Unary: Expresiones con operadores",
              "Call: Llamada a procedimiento (con flag statement: true/false)",
              "Print: Sentencia de impresión con múltiples argumentos",
              "Return: Retorno de valor",
              "Identifier/Literal: Valores y referencias (incluye strings)",
            ],
            example: {
              input:
                "factorial(n) BEGIN\n  resultado <- 1;\n  RETURN resultado;\nEND",
              astFragment:
                '{\n  "type": "ProcDef",\n  "name": "factorial",\n  "params": [{"type": "Param", "name": "n"}],\n  "body": {"type": "Block", "body": [...]},\n  "pos": {"line": 1, "column": 0}\n}',
            },
          },
          validation: {
            title: "Validación en Tiempo Real",
            client: {
              technology: "Parser TypeScript en Web Worker",
              purpose: "Validación inmediata durante la edición",
              features: [
                "Subrayado de errores en Monaco Editor",
                "Diagnósticos con línea y columna",
                "Sin bloquear el thread principal",
                "Fallback cuando API no disponible",
              ],
            },
            server: {
              technology: "Parser Python con ANTLR",
              purpose: "Análisis formal y generación de AST canónico",
              endpoint: "/grammar/parse",
              features: [
                "AST completo y validado",
                "Errores detallados con posiciones",
                "Procesamiento sin estado",
                "Pre-generado (sin dependencia Java en runtime)",
              ],
            },
          },
          errorHandling: {
            title: "Manejo de Errores",
            features: [
              "Mensajes descriptivos con línea y columna exacta",
              "Sugerencias contextuales del parser",
              "Visualización en Monaco con markers",
              "Asistencia opcional del LLM para corrección",
            ],
            errorTypes: [
              "Errores sintácticos: tokens inesperados, bloques incompletos",
              "Errores semánticos: tipos incompatibles, variables no declaradas (análisis futuro)",
              "Errores de estructura: falta de BEGIN/END, paréntesis no cerrados",
            ],
          },
        },
      },
      {
        id: "mcp",
        titleKey: "mcp",
        descriptionKey: "mcp",
        title: "MCP AALIE Conventions",
        description:
          "Servidor MCP que expone herramientas para seguir convenciones del proyecto. Compatible con Cursor y editores que soporten Model Context Protocol.",
        content: {
          type: "text",
          sections: [
            {
              title: "Instalación",
              content:
                "pip install -r mcp/requirements.txt\n\nEl servidor usa stdio; Cursor lo invoca automáticamente al abrir el proyecto.",
            },
            {
              title: "Configuración",
              content:
                "La configuración está en .cursor/mcp.json. Cursor la carga automáticamente. En VS Code u otros IDEs con soporte MCP, añadir el servidor en la configuración correspondiente.",
            },
            {
              title: "Herramientas",
              content:
                "read_conventions: OBLIGATORIO antes de crear/modificar código. Devuelve convenciones AALIE.\n\nread_doc: Lee documentación por ruta (ej: app/i18n-labels-prompts.md, api/endpoints.md).\n\nlist_components: Lista componentes en apps/web/src/components. Revisar antes de crear uno nuevo.\n\nchangelog_template: Formato para CHANGELOG.md. Añadir entrada en [Unreleased] antes de commit.\n\ni18n_reminder: Recordatorio i18n: no literales en UI. Usar useTranslations + messages/.",
            },
            {
              title: "Verificar MCP",
              content:
                "python mcp/server.py\n\nEl servidor responde por stdio; para pruebas manuales puede ejecutarse directamente.",
            },
          ],
        },
      },
    ],
    [],
  );
};
