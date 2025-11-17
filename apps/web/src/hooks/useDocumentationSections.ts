import { useMemo } from "react";

import { DocumentationSection } from "@/types/documentation";

export const useDocumentationSections = (): DocumentationSection[] => {
  return useMemo(
    () => [
      {
        id: "arquitectura",
        title: "Arquitectura general",
        description:
          "Monorepo con web (Next.js+TS) y api (FastAPI+Py 3.11), más packages compartidos (grammar, types, ui). La web consume REST del backend (/parse para AST canónico, /analyze para conteos y T(n), /health) y expone un BFF /api/llm/compare para el LLM (Gemini u OpenAI, por env). Procesamiento sin estado: sin BD ni persistencia; todo en memoria por solicitud; desarrollo con Docker Compose.",
        image: {
          src: "/docs/arquitectura.webp",
          alt: "Arquitectura y flujo general",
          width: 1600,
          height: 900,
          caption: "Arquitectura y flujo principal (borrador)",
        },
      },
      {
        id: "ui-flujo",
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
        id: "parse-analyze",
        title: "Backend: parse y analyze",
        description:
          "/parse usa ANTLR (Python) para devolver un AST canónico o errores con línea/columna; /analyze recibe el AST y opciones (C_k, modo, promedio), aplica reglas de conteo por línea, arma sumatorias y las cierra con SymPy para producir T_best/T_avg/T_worst con pasos en LaTeX y formas cerradas, sin almacenar código ni resultados.",
        image: {
          src: "/docs/parse-analyze.webp",
          alt: "Secuencia parse/analyze",
          width: 1600,
          height: 900,
          caption: "Secuencia de mensajes entre Web y API",
        },
      },
      {
        id: "cfg-recursion",
        title: "Visualizaciones: CFG y Recursión",
        description:
          "Desde el AST canónico se generan el CFG (bloques y flujo) y, si aplica, el árbol de recursión; ambos se renderizan con Cytoscape.js y se sincronizan con las líneas del código para trazabilidad y comprensión del origen de los términos de T(n).",
        image: {
          src: "/docs/cfg-recursion.webp",
          alt: "Generación de CFG y árbol de recursión",
          width: 1400,
          height: 900,
          caption: "Derivación de CFG y árbol de recursión desde el AST",
        },
      },
      {
        id: "errores",
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
        title: "Integración con LLM",
        description:
          "El LLM es parte del flujo en múltiples puntos: (1) Corrección de gramática: cuando hay errores de sintaxis, el chatbot puede sugerir correcciones; (2) Análisis directo: desde bloques de código en el chat, se puede iniciar análisis completo con el mismo loader que el editor manual; (3) Simplificación matemática: el backend usa Gemini para simplificar expresiones count_raw y generar formas polinómicas canónicas; (4) Generación de procedimientos: se usa un modelo más ligero (Gemini Flash Lite) para generar pasos detallados en LaTeX con notación asintótica. La web llama al BFF /api/llm/* que invoca Gemini u OpenAI según variables de entorno.",
        image: {
          src: "/docs/llm.webp",
          alt: "Flujo de uso de LLM",
          width: 2000,
          height: 750,
          caption: "Ruta de comparación con LLM y retorno a la UI",
        },
      },
      {
        id: "export",
        title: "Exportación de reportes",
        description:
          "Exporta Markdown/HTML con tabla por línea, pasos en LaTeX y T(n) final para Best/Avg/Worst (opcionalmente con resumen de la comparativa LLM); la exportación no persiste datos y el archivo se genera y descarga al instante.",
        image: {
          src: "/docs/export.webp",
          alt: "Flujo de exportación de reportes",
          width: 1765,
          height: 768,
          caption: "Secuencia de exportación desde la UI",
        },
      },
      {
        id: "monorepo-packages",
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
                outputs: ["dist/index.{js,d.ts} consumible por cualquier paquete"],
              },
              usedBy: ["Web (tipado de llamadas/render)", "API (contratos y validación)"],
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
        id: "code-quality",
        title: "Calidad de Código y Herramientas",
        description:
          "Sistema integral de linting y formateo automatizado que garantiza consistencia y alta calidad de código en todo el monorepo. Implementa herramientas modernas tanto para el frontend (ESLint v9, Prettier) como el backend (Ruff, Black) con scripts orquestados que permiten validar y formatear ambos mundos simultáneamente.",
        content: {
          type: "tools",
          frontend: {
            title: "Frontend (Next.js + TypeScript)",
            tools: [
              {
                name: "ESLint v9",
                purpose: "Linting moderno con configuración plana",
                config: "eslint.config.mjs",
                features: [
                  "Migración desde .eslintrc a formato moderno",
                  "Detección de elementos <a> que deberían ser <Link>",
                  "Validación de tipos TypeScript seguros",
                  "Organización automática de imports",
                  "Compatibilidad con Next.js 14 y App Router",
                ],
              },
              {
                name: "Prettier",
                purpose: "Formateo automático de código",
                config: ".prettierrc",
                features: [
                  "Configuración consistente en .prettierrc",
                  "Formateo automático de JSX, TypeScript, CSS",
                  "Integración perfecta con ESLint",
                  "Corrección automática de formato",
                ],
              },
            ],
          },
          backend: {
            title: "Backend (FastAPI + Python)",
            tools: [
              {
                name: "Ruff",
                purpose: "Linter moderno ultra-rápido para Python",
                config: "pyproject.toml",
                features: [
                  "Configuración en [tool.ruff.lint]",
                  "Ordenamiento automático de imports (isort)",
                  "Detección de variables no usadas",
                  "Validación de buenas prácticas Python",
                  "Integración con Docker para consistencia",
                ],
              },
              {
                name: "Black",
                purpose: "Formateador de código Python",
                config: "pyproject.toml",
                features: [
                  "Configuración de 100 caracteres por línea",
                  "Formateo automático y consistente",
                  "Compatibilidad con Python 3.11+",
                  "Integración Docker para entornos reproducibles",
                ],
              },
            ],
          },
          automation: {
            title: "Scripts Orquestados",
            commands: [
              {
                command: "pnpm run lint:all",
                description: "Ejecuta linting en frontend y backend",
              },
              {
                command: "pnpm run format:all",
                description: "Aplica formateo en todo el monorepo",
              },
              {
                command: "pnpm run lint:web",
                description: "Linting específico del frontend",
              },
              {
                command: "pnpm run lint:api",
                description: "Linting específico del backend (vía Docker)",
              },
            ],
          },
        }
      },
      {
        id: "ui-showcase",
        title: "Demostración de Componentes Nativos",
        description:
          "Prueba interactiva de componentes nativos optimizados. Explora botones, modales, bloques LaTeX y tablas de costos implementados directamente con Tailwind CSS para máximo rendimiento.",
        content: {
          type: "ui-showcase" as const,
          implementation: {
            title: "Componentes Interactivos",
            description: "Accede a la demostración completa de todos los componentes de la interfaz de usuario.",
            testRoute: "/ui-test",
            features: [
              "Botones con efectos glassmorphism",
              "Modales responsivos y accesibles",
              "Tablas de datos optimizadas",
              "Componentes LaTeX integrados",
              "Sistema de loaders avanzado",
              "Formularios con validación",
            ]
          }
        }
      },
      {
        id: "katex-integration",
        title: "Renderizado LaTeX con KaTeX",
        description:
          "Sistema completo de renderizado matemático usando KaTeX para ecuaciones LaTeX tanto inline como en bloque. Optimizado para SSR, incluye componentes reutilizables, utilidades de renderizado seguro y soporte para ecuaciones complejas con scroll horizontal.",
        content: {
          type: "katex",
          implementation: {
            title: "Implementación Técnica",
            library: {
              name: "KaTeX 0.16.10",
              purpose: "Renderizado rápido de matemáticas en el navegador",
              features: [
                "Renderizado del lado del servidor (SSR compatible)",
                "Sin dependencias de MathJax o fuentes externas",
                "Soporte completo para sintaxis LaTeX",
                "Optimizado para rendimiento en aplicaciones React",
                "Configuración segura contra XSS",
              ],
            },
            components: [
              {
                name: "Formula.tsx",
                purpose: "Componente para matemáticas inline y display",
                props: [
                  "latex: string - Expresión LaTeX a renderizar",
                  "displayMode?: boolean - Modo bloque (centrado) vs inline",
                  "className?: string - Clases CSS adicionales",
                ],
                usage: "Renderizado básico de expresiones matemáticas individuales",
              },
              {
                name: "FormulaBlock.tsx",
                purpose: "Contenedor con scroll para ecuaciones largas",
                props: [
                  "latex: string - Expresión LaTeX compleja",
                  "className?: string - Estilos personalizados del contenedor",
                ],
                usage: "Ecuaciones complejas que requieren scroll horizontal",
              },
            ],
            utilities: [
              {
                file: "lib/katex.ts",
                function: "renderLatexToHtml",
                purpose: "Utilitario SSR-safe para convertir LaTeX a HTML",
                config: {
                  throwOnError: false,
                  trust: false,
                  strict: "warn",
                },
                security: "Configurado para prevenir XSS y ejecutar de forma segura",
              },
            ],
          },
          examples: {
            title: "Ejemplos de Uso",
            inline: {
              description: "Matemáticas dentro del texto",
              code: '<Formula latex="E = mc^2" />',
              result: "Renderiza E = mc² inline con el texto",
            },
            block: {
              description: "Ecuaciones centradas en modo display",
              code: String.raw`<Formula latex="\sum_{i=1}^{n} i = \frac{n(n+1)}{2}" displayMode={true} />`,
              result: "Ecuación centrada en bloque separado",
            },
            complex: {
              description: "Ecuaciones complejas con scroll",
              code: String.raw`<div><Formula latex="T(n) = \sum_{i=1}^{n} \sum_{j=1}^{i} O(1)" /><Formula latex="= \sum_{i=1}^{n} i" /><Formula latex="= \frac{n(n+1)}{2}" /></div>`,
              result: "Ecuación larga con múltiples pasos separados",
            },
          },
          styling: {
            title: "Estilos y Configuración",
            css: {
              import: "Importación automática de katex/dist/katex.min.css en layout.tsx",
              customization: "Estilos personalizados para tema oscuro y spacing",
              responsive: "Contenedores con overflow-x-auto para móviles",
            },
            themes: {
              dark: "Optimizado para fondo oscuro del sitio",
              responsive: "Adaptativo a diferentes tamaños de pantalla",
            },
          },
        }
      },
      {
        id: "grammar-parser",
        title: "Gramática y Parser",
        description:
          "Sistema completo de parsing basado en ANTLR4 que define la sintaxis del lenguaje de pseudocódigo y genera parsers para TypeScript y Python. Soporta procedimientos, estructuras de control, arrays con rangos, operadores normalizados y produce un AST canónico con información de posición para diagnósticos precisos.",
        content: {
          type: "grammar",
          overview: {
            title: "Visión General",
            description: "La gramática define un lenguaje de pseudocódigo estructurado para análisis algorítmico, con soporte completo para procedimientos, estructuras de control y expresiones matemáticas.",
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
                description: "Define funciones con parámetros escalares, arrays con rangos (A[1]..[n]) y objetos tipados.",
                example: "factorial(n) BEGIN ... END",
              },
              {
                name: "Estructuras de Control",
                description: "Soporte completo para IF-THEN-ELSE, FOR, WHILE y REPEAT-UNTIL con bloques obligatorios.",
                example: "FOR i <- 1 TO n DO BEGIN ... END",
              },
              {
                name: "Operadores Normalizados",
                description: "Conjunto cerrado de operadores aritméticos, relacionales y lógicos con precedencia estándar.",
                example: "resultado <- (a + b) * c DIV 2",
              },
              {
                name: "Arrays Multidimensionales",
                description: "Soporte para declaración y acceso a arrays con múltiples dimensiones.",
                example: "matriz[i][j] <- valor",
              },
              {
                name: "Sentencias PRINT",
                description: "Permite mostrar valores en consola con soporte para strings literales, variables y expresiones.",
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
                  "Escapar comillas internas con \\\"",
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
                operators: ["=", "!=", "<>", "≠", "<", ">", "<=", "≤", ">=", "≥"],
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
            description: "El AST generado es canónico e idéntico entre TypeScript y Python, garantizando consistencia entre cliente y servidor.",
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
              input: "factorial(n) BEGIN\n  resultado <- 1;\n  RETURN resultado;\nEND",
              astFragment: '{\n  "type": "ProcDef",\n  "name": "factorial",\n  "params": [{"type": "Param", "name": "n"}],\n  "body": {"type": "Block", "body": [...]},\n  "pos": {"line": 1, "column": 0}\n}',
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
        id: "analyzer-interface",
        title: "Interfaz de Análisis de Complejidad",
        description:
          "Analizador visual de complejidad algorítmica con interfaz de 3 columnas que muestra código numerado, tabla de costos por línea y visualizaciones matemáticas. Incluye modal de procedimiento detallado para Best, Average y Worst case con pasos en LaTeX. Soporte completo para análisis iterativo con modelos probabilísticos.",
        content: {
          type: "analyzer",
          interface: {
            title: "Diseño de 3 Columnas",
            layout: {
              description: "Distribución responsive optimizada para análisis completo",
              columns: [
                {
                  name: "Código Numerado",
                  purpose: "Visualización del pseudocódigo con números de línea",
                  component: "CodePane",
                  features: [
                    "Numeración automática de líneas",
                    "Fuente monoespaciada para legibilidad",
                    "Alturas iguales con otras columnas",
                    "Scroll vertical independiente",
                  ],
                },
                {
                  name: "Tabla de Costos",
                  purpose: "Análisis de complejidad por línea de código",
                  component: "CostsTable",
                  features: [
                    "Costo unitario (C_k) por línea",
                    "Número de ejecuciones estimado",
                    "Costo total calculado",
                    "Selector de casos (Best/Avg/Worst)",
                    "ExpectedRuns para caso promedio",
                    "Botones individuales para ver procedimiento",
                    "Código truncado para mejor visualización",
                  ],
                },
                {
                  name: "Visualizaciones",
                  purpose: "Ecuaciones matemáticas y resultados finales",
                  component: "Formula/FormulaBlock",
                  features: [
                    "Renderizado LaTeX de ecuaciones complejas",
                    "Scroll horizontal para ecuaciones largas",
                    "Fórmulas T(n) para Best/Avg/Worst case",
                    "Fórmula A(n) para caso promedio",
                    "Notación Big O clara y legible",
                    "Tarjetas de resumen por caso",
                  ],
                },
              ],
            },
            responsiveness: {
              title: "Diseño Responsive",
              breakpoints: [
                {
                  size: "lg (1024px+)",
                  layout: "3 columnas iguales (4-4-4 grid)",
                  description: "Vista completa en desktop",
                },
                {
                  size: "xl (1280px+)",
                  layout: "3-4-3 grid para mejor visibilidad de tabla",
                  description: "Optimizado para tabla de costos",
                },
                {
                  size: "md y menor",
                  layout: "Columna única apilada verticalmente",
                  description: "Vista móvil optimizada",
                },
              ],
            },
          },
          analysisModes: {
            title: "Modos de Análisis",
            modes: [
              {
                name: "Best Case",
                description: "Analiza el mejor caso del algoritmo",
                features: [
                  "Selecciona ramas de IF con menos líneas",
                  "Considera mínimo número de iteraciones",
                  "Genera cotas inferiores de complejidad",
                  "Complejidad mínima esperada",
                ],
              },
              {
                name: "Worst Case",
                description: "Analiza el peor caso del algoritmo",
                features: [
                  "Selecciona ramas de IF con más líneas",
                  "Considera máximo número de iteraciones",
                  "Genera cotas superiores de complejidad",
                  "Complejidad máxima esperada",
                ],
              },
              {
                name: "Average Case",
                description: "Analiza el caso promedio del algoritmo",
                features: [
                  "Utiliza modelos probabilísticos (uniform, symbolic)",
                  "Aplica esperanzas matemáticas (expectedRuns)",
                  "Genera complejidad promedio esperada",
                  "Modelo uniforme: distribución uniforme de probabilidades",
                  "Modelo simbólico: probabilidades expresadas simbólicamente",
                ],
              },
            ],
          },
          modal: {
            title: "Modal de Procedimiento Detallado",
            purpose: "Análisis paso a paso del cálculo de complejidad",
            features: [
              "Soporte para Best, Average y Worst case",
              "Pasos matemáticos detallados en LaTeX",
              "Scroll horizontal para ecuaciones largas",
              "Navegación por teclado (Escape para cerrar)",
              "Overlay semitransparente con backdrop blur",
              "Información de modelo probabilístico para avg case",
            ],
            types: [
              {
                name: "Procedimiento General",
                description: "Análisis completo del algoritmo",
                content: "Pasos generales de análisis de complejidad con T(n) o A(n)",
              },
              {
                name: "Procedimiento por Línea",
                description: "Análisis específico de una línea",
                content: "Detalles del costo y ejecuciones de línea específica",
              },
            ],
          },
          components: {
            title: "Componentes Principales",
            list: [
              {
                name: "CodePane",
                file: "components/CodePane.tsx",
                purpose: "Mostrar código con numeración",
                props: ["lines: string[]", "className?: string"],
              },
              {
                name: "CostsTable", 
                file: "components/CostsTable.tsx",
                purpose: "Tabla interactiva de análisis de costos",
                props: [
                  "costs: CostAnalysis[]",
                  "onProcedureClick: (line?: number) => void",
                  "className?: string",
                ],
              },
              {
                name: "ProcedureModal",
                file: "components/ProcedureModal.tsx", 
                purpose: "Modal para mostrar análisis detallado",
                props: [
                  "isOpen: boolean",
                  "onClose: () => void",
                  "selectedLine?: number",
                  "procedure: ProcedureData",
                ],
              },
            ],
          },
        }
      },
      {
        id: "iterative-analyzer",
        title: "Analizador Iterativo Unificado",
        description:
          "Sistema completo de análisis iterativo que soporta best/worst/average case con modelos probabilísticos. Analiza bucles FOR, WHILE, REPEAT, condicionales IF, y líneas simples con precisión matemática.",
        content: {
          type: "analyzer",
          interface: {
            title: "Diseño de 3 Columnas",
            layout: {
              description: "Distribución responsive optimizada para análisis completo",
              columns: [
                {
                  name: "Código Numerado",
                  purpose: "Visualización del pseudocódigo con números de línea",
                  component: "CodePane",
                  features: [
                    "Numeración automática de líneas",
                    "Fuente monoespaciada para legibilidad",
                    "Alturas iguales con otras columnas",
                    "Scroll vertical independiente",
                  ],
                },
                {
                  name: "Tabla de Costos",
                  purpose: "Análisis de complejidad por línea de código",
                  component: "CostsTable",
                  features: [
                    "Costo unitario (C_k) por línea",
                    "Número de ejecuciones estimado",
                    "Costo total calculado",
                    "Selector de casos (Best/Avg/Worst)",
                    "ExpectedRuns para caso promedio",
                    "Botones individuales para ver procedimiento",
                    "Código truncado para mejor visualización",
                  ],
                },
                {
                  name: "Visualizaciones",
                  purpose: "Ecuaciones matemáticas y resultados finales",
                  component: "Formula/FormulaBlock",
                  features: [
                    "Renderizado LaTeX de ecuaciones complejas",
                    "Scroll horizontal para ecuaciones largas",
                    "Fórmulas T(n) para Best/Avg/Worst case",
                    "Fórmula A(n) para caso promedio",
                    "Notación Big O clara y legible",
                    "Tarjetas de resumen por caso",
                  ],
                },
              ],
            },
            responsiveness: {
              title: "Diseño Responsive",
              breakpoints: [
                {
                  size: "lg (1024px+)",
                  layout: "3 columnas iguales (4-4-4 grid)",
                  description: "Vista completa en desktop",
                },
                {
                  size: "xl (1280px+)",
                  layout: "3-4-3 grid para mejor visibilidad de tabla",
                  description: "Optimizado para tabla de costos",
                },
                {
                  size: "md y menor",
                  layout: "Columna única apilada verticalmente",
                  description: "Vista móvil optimizada",
                },
              ],
            },
          },
          analysisModes: {
            title: "Modos de Análisis",
            modes: [
              {
                name: "Best Case",
                description: "Analiza el mejor caso del algoritmo",
                features: [
                  "Selecciona ramas de IF con menos líneas",
                  "Considera mínimo número de iteraciones",
                  "Genera cotas inferiores de complejidad",
                  "Complejidad mínima esperada",
                ],
              },
              {
                name: "Worst Case",
                description: "Analiza el peor caso del algoritmo",
                features: [
                  "Selecciona ramas de IF con más líneas",
                  "Considera máximo número de iteraciones",
                  "Genera cotas superiores de complejidad",
                  "Complejidad máxima esperada",
                ],
              },
              {
                name: "Average Case",
                description: "Analiza el caso promedio del algoritmo",
                features: [
                  "Utiliza modelos probabilísticos (uniform, symbolic)",
                  "Aplica esperanzas matemáticas (expectedRuns)",
                  "Genera complejidad promedio esperada",
                  "Modelo uniforme: distribución uniforme de probabilidades",
                  "Modelo simbólico: probabilidades expresadas simbólicamente",
                ],
              },
            ],
          },
          modal: {
            title: "Modal de Procedimiento Detallado",
            purpose: "Análisis paso a paso del cálculo de complejidad",
            features: [
              "Soporte para Best, Average y Worst case",
              "Pasos matemáticos detallados en LaTeX",
              "Scroll horizontal para ecuaciones largas",
              "Navegación por teclado (Escape para cerrar)",
              "Overlay semitransparente con backdrop blur",
              "Información de modelo probabilístico para avg case",
            ],
            types: [
              {
                name: "Procedimiento General",
                description: "Análisis completo del algoritmo",
                content: "Pasos generales de análisis de complejidad con T(n) o A(n)",
              },
              {
                name: "Procedimiento por Línea",
                description: "Análisis específico de una línea",
                content: "Detalles del costo y ejecuciones de línea específica",
              },
            ],
          },
          implementation: {
            title: "Implementación Técnica",
            description: "Analizador iterativo unificado con soporte completo para múltiples modos de análisis",
            features: [
              "Herencia múltiple: BaseAnalyzer + todos los visitors",
              "Dispatcher centralizado para todos los tipos de nodos AST",
              "Análisis completo: FOR, IF, WHILE, REPEAT, ASSIGN, CALL, RETURN",
              "Soporte para best/worst/average case",
              "Modelos probabilísticos: uniform y symbolic",
              "Cálculo de esperanzas matemáticas para caso promedio",
              "Simplificación de sumatorias con SymPy",
              "Generación de T_open y A_of_n",
            ],
          },
          visitors: {
            title: "Visitors Especializados",
            list: [
              {
                name: "ForVisitor",
                description: "Análisis de bucles FOR",
                features: [
                  "Cabecera del FOR: (b - a + 2) evaluaciones",
                  "Multiplicador del cuerpo: Σ_{v=a}^{b} 1",
                  "Soporte para límites variables",
                  "Procedimiento explicativo",
                ],
              },
              {
                name: "IfVisitor",
                description: "Análisis de condicionales IF",
                features: [
                  "Guardia: siempre se evalúa una vez",
                  "Selección de rama dominante en worst case",
                  "Selección de rama mínima en best case",
                  "Aplicación de probabilidades en avg case",
                  "Manejo completo de THEN/ELSE",
                ],
              },
              {
                name: "WhileRepeatVisitor",
                description: "Análisis de bucles WHILE y REPEAT",
                features: [
                  "WHILE: condición (t_{while_L} + 1) veces, cuerpo por t_{while_L}",
                  "REPEAT: cuerpo y condición (1 + t_{repeat_L}) veces",
                  "Símbolos de iteración deterministas",
                  "Análisis de condiciones complejas (AND/OR)",
                ],
              },
              {
                name: "SimpleVisitor",
                description: "Análisis de líneas simples",
                features: [
                  "Asignaciones: descompone en accesos, aritmética, asignación",
                  "Llamadas: costo de llamada + argumentos",
                  "Returns: costo de expresión + return",
                  "Expresiones: recursión sobre operadores binarios, unarios, indexación",
                ],
              },
            ],
          },
          algorithms: {
            title: "Algoritmos Soportados",
            categories: [
              {
                name: "Algoritmos Comunes",
                examples: [
                  "Búsqueda lineal: Best O(1), Worst O(n), Avg O(n/2)",
                  "Búsqueda binaria iterativa: Best O(1), Worst O(log n)",
                  "Factorial iterativo: O(n)",
                  "Suma de array: O(n)",
                  "Máximo de array: O(n)",
                ],
              },
              {
                name: "Algoritmos Intermedios",
                examples: [
                  "Selection sort: O(n²)",
                  "Bubble sort optimizado: Best O(n), Worst O(n²), Avg O(n²)",
                  "Insertion sort: Best O(n), Worst O(n²), Avg O(n²)",
                  "Multiplicación de matrices: O(n³)",
                ],
              },
              {
                name: "Algoritmos Complejos",
                examples: [
                  "Bucles anidados con límites variables",
                  "WHILE con condiciones complejas (AND/OR)",
                  "IF anidados dentro de FOR",
                  "REPEAT-UNTIL con condiciones dependientes",
                  "Arrays con indexación compleja (A[i+j], A[i*2])",
                ],
              },
            ],
          },
          api: {
            title: "API y Endpoints",
            endpoint: {
              name: "POST /analyze/open",
              description: "Endpoint principal para análisis de complejidad",
              request: {
                source: "string - Código pseudocódigo",
                mode: "worst | best | avg | all",
                avgModel: {
                  mode: "uniform | symbolic",
                  predicates: "Record<string, string> - Predicados personalizados",
                },
              },
              response: {
                ok: "boolean",
                byLine: "Array<LineCost> - Tabla de costos por línea",
                totals: {
                  T_open: "string - Ecuación de eficiencia",
                  A_of_n: "string - Esperanza para caso promedio",
                  avg_model_info: "Object - Información del modelo probabilístico",
                  procedure: "Array<string> - Pasos del análisis",
                  symbols: "Record<string, string> - Símbolos y descripciones",
                },
              },
            },
          },
          components: {
            title: "Componentes Principales",
            list: [
              {
                name: "CodePane",
                file: "components/CodePane.tsx",
                purpose: "Mostrar código con numeración",
                props: ["lines: string[]", "className?: string"],
              },
              {
                name: "CostsTable", 
                file: "components/CostsTable.tsx",
                purpose: "Tabla interactiva de análisis de costos",
                props: [
                  "costs: CostAnalysis[]",
                  "onProcedureClick: (line?: number) => void",
                  "className?: string",
                ],
              },
              {
                name: "ProcedureModal",
                file: "components/ProcedureModal.tsx", 
                purpose: "Modal para mostrar análisis detallado",
                props: [
                  "isOpen: boolean",
                  "onClose: () => void",
                  "selectedLine?: number",
                  "procedure: ProcedureData",
                ],
              },
            ],
          },
        }
      },
      {
        id: "recursive-analyzer",
        title: "Analizador Recursivo y Teorema Maestro",
        description:
          "Sistema completo de análisis para algoritmos recursivos e híbridos que utiliza el Teorema Maestro para resolver recurrencias de la forma T(n) = a·T(n/b) + f(n). Incluye extracción automática de recurrencias, visualización del árbol de recursión, y procedimiento completo con pasos de prueba.",
        content: {
          type: "analyzer",
          interface: {
            title: "Análisis Recursivo",
            description: "El sistema detecta automáticamente algoritmos recursivos e híbridos y aplica el Teorema Maestro para determinar su complejidad temporal.",
            features: [
              "Detección automática de llamadas recursivas",
              "Extracción de parámetros a, b y f(n) de la recurrencia",
              "Aplicación del Teorema Maestro con los 3 casos",
              "Visualización del árbol de recursión",
              "Procedimiento completo con pasos de prueba en LaTeX",
              "Ecuación de eficiencia final T(n) = Θ(...)",
            ],
          },
          masterTheorem: {
            title: "Teorema Maestro",
            description: "El Teorema Maestro resuelve recurrencias de la forma T(n) = a·T(n/b) + f(n) donde a ≥ 1, b > 1, y f(n) es una función asintóticamente positiva.",
            cases: [
              {
                case: 1,
                condition: "f(n) < n^{\\log_b a}",
                result: "T(n) = \\Theta(n^{\\log_b a})",
                description: "El trabajo no recursivo es menor que el trabajo en las hojas del árbol",
                example: "\\text{Merge Sort: }T(n) = 2T(n/2) + n \\Rightarrow T(n) = \\Theta(n \\log n)",
              },
              {
                case: 2,
                condition: "f(n) = n^{\\log_b a}",
                result: "T(n) = \\Theta(n^{\\log_b a} \\cdot \\log n)",
                description: "El trabajo no recursivo es igual al trabajo en las hojas",
                example: "\\text{Binary Search: }T(n) = T(n/2) + 1 \\Rightarrow T(n) = \\Theta(\\log n)",
              },
              {
                case: 3,
                condition: "f(n) > n^{\\log_b a} \\text{ y condición de regularidad}",
                result: "T(n) = \\Theta(f(n))",
                description: "El trabajo no recursivo domina sobre el trabajo en las hojas",
                example: "\\text{QuickSort (peor caso): }T(n) = T(n-1) + n \\Rightarrow T(n) = \\Theta(n^2)",
              },
            ],
          },
          recurrenceExtraction: {
            title: "Extracción de Recurrencias",
            description: "El sistema analiza el AST para identificar llamadas recursivas y extraer los parámetros de la recurrencia.",
            process: [
              "Identificación del procedimiento principal",
              "Búsqueda de llamadas recursivas al mismo procedimiento",
              "Análisis de los parámetros de las llamadas recursivas",
              "Detección del tamaño del subproblema (n/b)",
              "Conteo del número de llamadas recursivas (a)",
              "Identificación del trabajo no recursivo f(n)",
              "Normalización a la forma T(n) = a·T(n/b) + f(n)",
            ],
            requirements: [
              "El algoritmo debe tener llamadas recursivas al mismo procedimiento",
              "Los parámetros recursivos deben dividir el problema de forma constante (n/b)",
              "El número de llamadas recursivas debe ser constante (a)",
              "El trabajo no recursivo debe ser identificable",
            ],
          },
          visualization: {
            title: "Visualizaciones",
            components: [
              {
                name: "Árbol de Recursión",
                description: "Visualización interactiva del árbol de llamadas recursivas",
                features: [
                  "Nodos representan llamadas recursivas",
                  "Etiquetas muestran el tamaño del problema en cada nivel",
                  "Conexiones muestran la estructura de la recursión",
                  "Colores indican diferentes niveles del árbol",
                ],
              },
              {
                name: "Procedimiento Completo",
                description: "Modal detallado con todos los pasos del análisis",
                features: [
                  "Modal interactivo con scroll",
                  "Renderizado LaTeX de ecuaciones",
                  "Navegación por teclado (Escape para cerrar)",
                  "Overlay semitransparente con backdrop blur",
                ],
                sections: [
                  "Ecuación de recurrencia extraída",
                  "Parámetros a, b, f(n) y n₀",
                  "Cálculo de g(n) = n^(log_b a)",
                  "Comparación de f(n) vs g(n)",
                  "Aplicación del caso correspondiente",
                  "Pasos de prueba en LaTeX",
                  "Ecuación de eficiencia final T(n) = Θ(...)",
                ],
              },
            ],
          },
          examples: {
            title: "Algoritmos Soportados",
            categories: [
              {
                name: "Divide and Conquer",
                examples: [
                  "Merge Sort: T(n) = 2T(n/2) + n → Θ(n log n)",
                  "Binary Search: T(n) = T(n/2) + 1 → Θ(log n)",
                  "Quick Sort (mejor caso): T(n) = 2T(n/2) + n → Θ(n log n)",
                  "Strassen: T(n) = 7T(n/2) + n² → Θ(n^(log₂ 7))",
                ],
              },
              {
                name: "Recursión Simple",
                examples: [
                  "Factorial recursivo: T(n) = T(n-1) + 1 → Θ(n)",
                  "Fibonacci recursivo: T(n) = T(n-1) + T(n-2) + 1 → Θ(2ⁿ)",
                  "Torres de Hanoi: T(n) = 2T(n-1) + 1 → Θ(2ⁿ)",
                ],
              },
            ],
          },
          api: {
            title: "API y Endpoints",
            endpoint: {
              name: "POST /analyze/open",
              description: "Endpoint principal que detecta y analiza algoritmos recursivos automáticamente",
              request: {
                source: "string - Código pseudocódigo",
                mode: "worst | best | avg | all",
                algorithm_kind: "string (opcional) - iterative | recursive | hybrid | unknown",
              },
              response: {
                ok: "boolean",
                worst: {
                  totals: {
                    recurrence: {
                      form: "string - T(n) = a·T(n/b) + f(n)",
                      a: "number - número de subproblemas",
                      b: "number - factor de reducción",
                      f: "string - trabajo no recursivo (LaTeX)",
                      n0: "number - umbral base",
                      applicable: "boolean",
                    },
                    master: {
                      case: "1 | 2 | 3 - caso del Teorema Maestro",
                      nlogba: "string - n^(log_b a) en LaTeX",
                      comparison: "smaller | equal | larger",
                      theta: "string - T(n) = Θ(...) en LaTeX",
                      regularity: {
                        checked: "boolean",
                        note: "string",
                      },
                    },
                    T_open: "string - Ecuación de eficiencia final",
                    proof: "Array<{id: string, text: string}> - Pasos de prueba",
                  },
                },
              },
            },
          },
        },
      },
    ],
    [],
  );
};
