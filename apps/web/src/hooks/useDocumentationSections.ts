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
        },
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
            description:
              "Accede a la demostración completa de todos los componentes de la interfaz de usuario.",
            testRoute: "/ui-test",
            features: [
              "Botones con efectos glassmorphism",
              "Modales responsivos y accesibles",
              "Tablas de datos optimizadas",
              "Componentes LaTeX integrados",
              "Sistema de loaders avanzado",
              "Formularios con validación",
            ],
          },
        },
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
                usage:
                  "Renderizado básico de expresiones matemáticas individuales",
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
                security:
                  "Configurado para prevenir XSS y ejecutar de forma segura",
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
              import:
                "Importación automática de katex/dist/katex.min.css en layout.tsx",
              customization:
                "Estilos personalizados para tema oscuro y spacing",
              responsive: "Contenedores con overflow-x-auto para móviles",
            },
            themes: {
              dark: "Optimizado para fondo oscuro del sitio",
              responsive: "Adaptativo a diferentes tamaños de pantalla",
            },
          },
        },
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
        id: "analyzer-interface",
        title: "Interfaz de Análisis de Complejidad",
        description:
          "Analizador visual de complejidad algorítmica con interfaz de 3 columnas que muestra código numerado, tabla de costos por línea y visualizaciones matemáticas. Incluye modal de procedimiento detallado para Best, Average y Worst case con pasos en LaTeX. Soporte completo para análisis iterativo con modelos probabilísticos.",
        content: {
          type: "analyzer",
          interface: {
            title: "Diseño de 3 Columnas",
            layout: {
              description:
                "Distribución responsive optimizada para análisis completo",
              columns: [
                {
                  name: "Código Numerado",
                  purpose:
                    "Visualización del pseudocódigo con números de línea",
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
                content:
                  "Pasos generales de análisis de complejidad con T(n) o A(n)",
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
        },
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
              description:
                "Distribución responsive optimizada para análisis completo",
              columns: [
                {
                  name: "Código Numerado",
                  purpose:
                    "Visualización del pseudocódigo con números de línea",
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
                content:
                  "Pasos generales de análisis de complejidad con T(n) o A(n)",
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
            description:
              "Analizador iterativo unificado con soporte completo para múltiples modos de análisis",
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
                  predicates:
                    "Record<string, string> - Predicados personalizados",
                },
              },
              response: {
                ok: "boolean",
                byLine: "Array<LineCost> - Tabla de costos por línea",
                totals: {
                  T_open: "string - Ecuación de eficiencia",
                  A_of_n: "string - Esperanza para caso promedio",
                  avg_model_info:
                    "Object - Información del modelo probabilístico",
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
        },
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
            description:
              "El sistema detecta automáticamente algoritmos recursivos e híbridos y aplica el Teorema Maestro para determinar su complejidad temporal.",
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
            description:
              "El Teorema Maestro resuelve recurrencias de la forma T(n) = a·T(n/b) + f(n) donde a ≥ 1, b > 1, y f(n) es una función asintóticamente positiva.",
            cases: [
              {
                case: 1,
                condition: "f(n) < n^{\\log_b a}",
                result: "T(n) = \\Theta(n^{\\log_b a})",
                description:
                  "El trabajo no recursivo es menor que el trabajo en las hojas del árbol",
                example:
                  "\\text{Merge Sort: }T(n) = 2T(n/2) + n \\Rightarrow T(n) = \\Theta(n \\log n)",
              },
              {
                case: 2,
                condition: "f(n) = n^{\\log_b a}",
                result: "T(n) = \\Theta(n^{\\log_b a} \\cdot \\log n)",
                description:
                  "El trabajo no recursivo es igual al trabajo en las hojas",
                example:
                  "\\text{Binary Search: }T(n) = T(n/2) + 1 \\Rightarrow T(n) = \\Theta(\\log n)",
              },
              {
                case: 3,
                condition:
                  "f(n) > n^{\\log_b a} \\text{ y condición de regularidad}",
                result: "T(n) = \\Theta(f(n))",
                description:
                  "El trabajo no recursivo domina sobre el trabajo en las hojas",
                example:
                  "\\text{QuickSort (peor caso): }T(n) = T(n-1) + n \\Rightarrow T(n) = \\Theta(n^2)",
              },
            ],
          },
          iterationMethod: {
            title: "Método de Iteración (Unrolling)",
            description:
              "El Método de Iteración resuelve recurrencias de la forma T(n) = T(g(n)) + f(n) mediante expansión simbólica, donde hay un solo llamado recursivo y el subproblema es decrease-and-conquer.",
            criteria: [
              "Un solo llamado recursivo (a = 1)",
              "Subproblema decrease-and-conquer: n-1, n-k, n/c",
              "No divide-and-conquer (no múltiples subproblemas)",
              "Subproblema estrictamente más pequeño: g(n) < n",
              "No combina múltiples resultados recursivos",
            ],
            steps: [
              {
                step: 1,
                description: "Identificar la recurrencia T(n) = T(g(n)) + f(n)",
              },
              {
                step: 2,
                description:
                  "Expandir una vez: T(n) = T(g(g(n))) + f(g(n)) + f(n)",
              },
              {
                step: 3,
                description: "Expandir k veces: T(n) = T(g^k(n)) + Σ f(g^i(n))",
              },
              {
                step: 4,
                description: "Determinar k del caso base: g^k(n) = n₀",
              },
              {
                step: 5,
                description: "Sustituir k en la sumatoria",
              },
              {
                step: 6,
                description:
                  "Evaluar la sumatoria (aritmética, geométrica, constante)",
              },
              {
                step: 7,
                description: "Simplificar a notación Θ(·)",
              },
            ],
            examples: [
              {
                name: "Factorial",
                recurrence: "T(n) = T(n-1) + 1",
                result: "T(n) = \\Theta(n)",
              },
              {
                name: "Suma de arreglo",
                recurrence: "T(n) = T(n-1) + n",
                result: "T(n) = \\Theta(n^2)",
              },
            ],
          },
          recurrenceExtraction: {
            title: "Extracción de Recurrencias",
            description:
              "El sistema analiza el AST para identificar llamadas recursivas y extraer los parámetros de la recurrencia.",
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
                description:
                  "Visualización interactiva del árbol de llamadas recursivas",
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
              description:
                "Endpoint principal que detecta y analiza algoritmos recursivos automáticamente",
              request: {
                source: "string - Código pseudocódigo",
                mode: "worst | best | avg | all",
                algorithm_kind:
                  "string (opcional) - iterative | recursive | hybrid | unknown",
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
                    proof:
                      "Array<{id: string, text: string}> - Pasos de prueba",
                  },
                },
              },
            },
          },
        },
      },
      {
        id: "memoization",
        title: "Memoización (Programación Dinámica)",
        description:
          "Optimización del análisis mediante cacheo de resultados para nodos AST repetitivos",
        content: {
          type: "text",
          sections: [
            {
              title: "¿Cuándo se activa?",
              content:
                "La memoización se activa automáticamente cuando se analizan nodos del AST que pueden aparecer múltiples veces:\n\n• Bloques de código (Block)\n• Bucles (For, While, Repeat)\n• Condicionales (If) con ramas THEN y ELSE\n\nEsto evita re-analizar bloques idénticos en el mismo contexto, reduciendo significativamente el tiempo de análisis.",
            },
            {
              title: "Estrategia de Cache",
              content:
                "La clave de cache combina tres componentes críticos:\n\n1. Identificador del nodo (posición o hash del contenido)\n2. Modo de análisis (worst, best, avg)\n3. Contexto actual (hash del loop_stack)\n\nFormato de clave: $\\text{key} = \\text{node\\_id} | \\text{mode} | \\text{context\\_hash}$\n\nEsto garantiza que solo se reutilicen resultados cuando el contexto es idéntico.",
            },
            {
              title: "Beneficios de Rendimiento",
              content:
                "La memoización proporciona mejoras significativas:\n\n✓ Rendimiento: Evita re-analizar bloques idénticos\n✓ Consistencia: Garantiza resultados deterministas\n✓ Escalabilidad: Mejora exponencial en bucles anidados\n\nPara un algoritmo con $k$ bucles anidados, la complejidad de análisis se reduce de $O(n^k)$ a $O(n \\cdot k)$ en el mejor caso.",
            },
          ],
        },
      },
      {
        id: "llm-jobs-models",
        title: "LLM: Jobs y Modelos",
        description:
          "Configuración centralizada de LLM (Gemini) con diferentes jobs especializados. Cada job usa un modelo específico optimizado para su tarea. IMPORTANTE: El job 'classify' está DEPRECADO - la clasificación se hace por heurística en /classify (backend Python), NO usa LLM.",
        content: {
          type: "text",
          sections: [
            {
              title: "Jobs Activos",
              content:
                "parser_assist (Gemini 2.5 Flash): Generación de código y corrección de sintaxis. general (Gemini 2.5 Flash): Chatbot general para explicaciones. simplifier (Gemini 2.5 Flash): Simplificación matemática. repair (Gemini 2.5 Flash): Reparación de código con errores. compare (Gemini 2.5 Pro): Comparación de análisis del sistema con LLM.",
            },
            {
              title: "Jobs Legacy (NO SE USAN)",
              content:
                "classify (Gemini 2.0 Flash Lite): DEPRECADO. La clasificación de algoritmos se hace por HEURÍSTICA en el endpoint /classify del backend Python, NO usa LLM. Es 100% determinista basada en análisis del AST.",
            },
            {
              title: "Modelos Usados",
              content:
                "Gemini 2.5 Flash: Usado para parser_assist, general, simplifier, repair. Rápido y eficiente. Gemini 2.5 Pro: Usado para compare. Más potente y preciso para análisis matemático complejo. Gemini 2.0 Flash: Usado para recursion-diagram (endpoint específico).",
            },
          ],
        },
      },
      {
        id: "recursive-methods",
        title: "Métodos de Análisis Recursivo",
        description:
          "Detección automática y aplicación de métodos de resolución de recurrencias",
        content: {
          type: "text",
          sections: [
            {
              title: "Proceso de Detección Automática",
              content:
                "El sistema sigue un proceso sistemático:\n\n1. Extrae la recurrencia del AST\n2. Analiza la estructura matemática\n3. Determina métodos aplicables\n4. Prioriza según precisión y eficiencia\n5. Aplica el método óptimo\n\nLa prioridad es: Teorema Maestro > Ecuación Característica > Árbol de Recursión > Método de Iteración.",
            },
            {
              title: "Teorema Maestro",
              content:
                "Para recurrencias de la forma:\n\n$$T(n) = aT(n/b) + f(n)$$\n\nDonde $a \\geq 1$, $b > 1$, y $f(n)$ es asintóticamente positiva.\n\nTres casos según la comparación de $f(n)$ con $n^{\\log_b a}$:\n\n• Caso 1: Si $f(n) = O(n^{\\log_b a - \\epsilon})$ → $T(n) = \\Theta(n^{\\log_b a})$\n• Caso 2: Si $f(n) = \\Theta(n^{\\log_b a})$ → $T(n) = \\Theta(n^{\\log_b a} \\log n)$\n• Caso 3: Si $f(n) = \\Omega(n^{\\log_b a + \\epsilon})$ → $T(n) = \\Theta(f(n))$\n\nAplicable a algoritmos divide y conquista como Merge Sort, Quick Sort, Binary Search.",
            },
            {
              title: "Método de Iteración",
              content:
                "Expande la recurrencia iterativamente hasta encontrar un patrón:\n\n$$T(n) = T(n-1) + n$$\n$$T(n) = T(n-2) + (n-1) + n$$\n$$T(n) = T(n-3) + (n-2) + (n-1) + n$$\n$$\\vdots$$\n$$T(n) = T(0) + 1 + 2 + \\cdots + n = \\frac{n(n+1)}{2}$$\n\nSiempre aplicable. Útil cuando otros métodos no funcionan.",
            },
            {
              title: "Árbol de Recursión",
              content:
                "Visualiza el costo total mediante un árbol de llamadas recursivas.\n\nCada nivel $i$ del árbol tiene:\n• Número de nodos: $a^i$\n• Tamaño de subproblema: $n/b^i$\n• Costo por nodo: $f(n/b^i)$\n\nCosto total: $$T(n) = \\sum_{i=0}^{\\log_b n} a^i \\cdot f(n/b^i)$$\n\nAplicable cuando hay múltiples llamadas recursivas. Útil para entender la estructura del problema.",
            },
            {
              title: "Ecuación Característica",
              content:
                "Para recurrencias lineales homogéneas:\n\n$$T(n) = c_1 T(n-1) + c_2 T(n-2) + \\cdots + c_k T(n-k)$$\n\nSe resuelve la ecuación característica:\n\n$$x^k = c_1 x^{k-1} + c_2 x^{k-2} + \\cdots + c_k$$\n\nLas raíces $r_1, r_2, \\ldots, r_k$ determinan la solución:\n\n$$T(n) = A_1 r_1^n + A_2 r_2^n + \\cdots + A_k r_k^n$$\n\nEjemplo: Fibonacci → $T(n) = T(n-1) + T(n-2)$ → $T(n) = \\Theta(\\phi^n)$ donde $\\phi = \\frac{1+\\sqrt{5}}{2}$",
            },
          ],
        },
      },
      {
        id: "request-flow",
        title: "Flujo de Peticiones",
        description:
          "Flujo completo y preciso de peticiones desde el frontend hasta el backend. Incluye diagramas Mermaid de arquitectura, flujos de análisis iterativo/recursivo, y diagramas de secuencia. Next.js SOLO hace proxy para /api/llm/*, los endpoints principales van directo al backend Python.",
        content: {
          type: "text",
          sections: [
            {
              title: "Flujo Iterativo",
              content:
                "1. POST /grammar/parse → Parsea código y genera AST. 2. POST /classify → Clasifica por HEURÍSTICA (NO LLM). 3. POST /analyze/open → Usa IterativeAnalyzer, calcula worst/best/avg.",
            },
            {
              title: "Flujo Recursivo",
              content:
                "1. POST /grammar/parse → Parsea código. 2. POST /classify → Clasifica por HEURÍSTICA. 3. POST /analyze/detect-methods → Detecta métodos aplicables. 4. POST /analyze/open (con method) → Usa RecursiveAnalyzer, aplica método seleccionado.",
            },
            {
              title: "Proxies Next.js",
              content:
                "Next.js SOLO actúa como BFF para /api/llm/* (proteger API key). Los endpoints principales (/grammar/parse, /classify, /analyze/*) van DIRECTO al backend Python sin proxy.",
            },
          ],
        },
      },
      {
        id: "react-flow",
        title: "React Flow para Visualización",
        description:
          "Sistema de visualización de diagramas interactivos usando React Flow. Soporta árboles de recursión, grafos de ejecución, y diagramas de flujo de trace. Incluye layout automático con Dagre, nodos/edges personalizados, y optimizaciones de rendimiento.",
        content: {
          type: "text",
          sections: [
            {
              title: "Componentes Principales",
              content:
                "TraceFlowDiagram: Diagrama de flujo con React Flow. RecursionTreeModal: Modal con árbol de recursión interactivo. RecursiveTraceContent: Contenido de trace recursivo con diagrama LLM.",
            },
            {
              title: "Generación de Grafos",
              content:
                "Desde trace data: Convierte pasos de ejecución en nodos y edges. Desde recursion tree: Construye árbol jerárquico de llamadas recursivas. Layout automático: Usa Dagre para posicionar nodos automáticamente.",
            },
            {
              title: "Interactividad",
              content:
                "Zoom y pan: Navegación fluida del diagrama. Selección de nodos: Click para ver detalles. Highlight de paths: Resalta caminos de ejecución. Tooltips: Información adicional al hover.",
            },
            {
              title: "Optimizaciones",
              content:
                "Virtualización: Solo renderiza nodos visibles. Memoización: Evita re-renders innecesarios. Lazy loading: Carga diagramas bajo demanda. Debouncing: Optimiza eventos de interacción.",
            },
          ],
        },
      },
      {
        id: "gpu-cpu",
        title: "Análisis GPU vs CPU",
        description:
          "Sistema de scoring que determina la idoneidad de un algoritmo para GPU o CPU",
        content: {
          type: "text",
          sections: [
            {
              title: "Métricas Analizadas",
              content:
                "El sistema evalúa múltiples características del algoritmo:\n\n❌ Recursión: Penaliza GPU (difícil de paralelizar en hardware)\n❌ Branching: Penaliza GPU (divergencia de warps reduce eficiencia)\n✓ Loops independientes: Favorece GPU (paralelización masiva)\n✓ Arrays: Favorece GPU (acceso paralelo a memoria)\n✓ Operaciones matemáticas: Favorece GPU (ALUs especializadas)\n❌ Acceso irregular a memoria: Penaliza GPU (coalescencia)\n\nCada métrica contribuye al score final con un peso específico.",
            },
            {
              title: "Sistema de Scoring",
              content:
                "Scores calculados en rango [0, 100]:\n\n$$\\text{GPU Score} = \\sum_{i} w_i \\cdot m_i^{\\text{GPU}}$$\n$$\\text{CPU Score} = \\sum_{i} w_i \\cdot m_i^{\\text{CPU}}$$\n\nDonde $w_i$ son pesos y $m_i$ son métricas normalizadas.\n\nRecomendaciones:\n• GPU: Score GPU > 60 (altamente paralelizable)\n• CPU: Score CPU > 60 (secuencial o complejo)\n• Mixto: Ambos scores 40-60 (híbrido)\n\nEl sistema también considera el tamaño del problema $n$ para determinar si la sobrecarga de GPU se justifica.",
            },
            {
              title: "Visualización (GPUCPUModal)",
              content:
                "El modal muestra:\n\n✓ Barras de progreso para scores GPU y CPU\n✓ Desglose de métricas individuales\n✓ Recomendación clara con justificación\n✓ Explicación detallada de cada factor\n\nLos colores indican la recomendación:\n• Verde: GPU recomendado\n• Azul: CPU recomendado\n• Amarillo: Perfil mixto",
            },
          ],
        },
      },
      {
        id: "trace-environment",
        title: "Environment y Trace Endpoint",
        description:
          "Configuración de variables de entorno y metadata del endpoint de seguimiento de ejecución",
        content: {
          type: "text",
          sections: [
            {
              title: "Variables de Entorno (Backend)",
              content:
                "El backend Python utiliza las siguientes variables de entorno:\n\n• $\\text{CODE\\_EXECUTION\\_TIMEOUT}$: Timeout para ejecución de código\n  Default: 5000ms\n\n• $\\text{SYMPY\\_TIMEOUT}$: Timeout para operaciones SymPy\n  Default: 5000ms\n\n• $\\text{LLM\\_TIMEOUT}$: Timeout para llamadas a LLM\n  Default: 30000ms\n\n• $\\text{ENABLE\\_CACHE}$: Habilitar cache de resultados\n  Default: true\n\nEstas variables controlan los límites de tiempo para evitar bloqueos en operaciones costosas.",
            },
            {
              title: "Variables de Entorno (Frontend)",
              content:
                "El frontend Next.js utiliza:\n\n• $\\text{NEXT\\_PUBLIC\\_GEMINI\\_API\\_KEY}$\n  API key de Gemini (fallback si usuario no proporciona)\n\n• $\\text{NEXT\\_PUBLIC\\_API\\_URL}$\n  URL del backend\n  Default: http://localhost:8000\n\nLa API key puede ser proporcionada por el usuario en el footer de la aplicación, sobrescribiendo la variable de entorno.",
            },
            {
              title: "Metadata del Trace",
              content:
                "El endpoint /analyze/trace retorna metadata adicional:\n\n• $\\text{execution\\_time}$: Tiempo de ejecución en milisegundos\n• $\\text{tokens\\_used}$: Tokens consumidos por LLM (solo recursivos)\n• $\\text{cost}$: Costo estimado de la llamada LLM en USD\n• $\\text{model}$: Modelo usado (gemini-2.0-flash para diagramas)\n\nEsta información permite monitorear el uso de recursos y costos asociados al análisis.",
            },
          ],
        },
      },
    ],
    [],
  );
};
