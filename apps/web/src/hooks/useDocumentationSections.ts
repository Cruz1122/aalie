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
          "El usuario escribe en Monaco (validación inmediata con parser TS en Web Worker); tras una pausa se llama a /parse y, con AST válido, a /analyze. La vista muestra código numerado, tabla de costos (C_k, #ejec, costo) y panel de visualizaciones; el modal ‘Procedimiento’ (Best/Avg/Worst) incluye supuestos, pasos en LaTeX con scroll horizontal y T(n) final; desde allí se dispara la comparación con el LLM.",
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
          "El LLM es parte del flujo: corrige gramática, reconoce patrones y estima T(n) con explicación; la web llama al BFF /api/llm/compare que invoca Gemini u OpenAI según variables de entorno y la UI muestra la comparativa (coincidencias, diferencias y supuestos).",
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
              code: '<Formula latex="\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" displayMode={true} />',
              result: "Ecuación centrada en bloque separado",
            },
            complex: {
              description: "Ecuaciones complejas con scroll",
              code: '<div><Formula latex="T(n) = \\sum_{i=1}^{n} \\sum_{j=1}^{i} O(1)" /><Formula latex="= \\sum_{i=1}^{n} i" /><Formula latex="= \\frac{n(n+1)}{2}" /></div>',
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
        id: "analyzer-interface",
        title: "Interfaz de Análisis de Complejidad",
        description:
          "Analizador visual de complejidad algorítmica con interfaz de 3 columnas que muestra código numerado, tabla de costos por línea y visualizaciones matemáticas. Incluye modal de procedimiento detallado para Best, Average y Worst case con pasos en LaTeX.",
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
                    "Notación Big O clara y legible",
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
          modal: {
            title: "Modal de Procedimiento Detallado",
            purpose: "Análisis paso a paso del cálculo de complejidad",
            features: [
              "Soporte para Best, Average y Worst case",
              "Pasos matemáticos detallados en LaTeX",
              "Scroll horizontal para ecuaciones largas",
              "Navegación por teclado (Escape para cerrar)",
              "Overlay semitransparente con backdrop blur",
            ],
            types: [
              {
                name: "Procedimiento General",
                description: "Análisis completo del algoritmo",
                content: "Pasos generales de análisis de complejidad",
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
    ],
    [],
  );
};
