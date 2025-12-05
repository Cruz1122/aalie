import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NavigationLink from "@/components/NavigationLink";

export const metadata = {
  title: "Acerca de - Analizador de Complejidad",
  description:
    "Proyecto académico para análisis de complejidad algorítmica con herramientas modernas y enfoque educativo",
};

export default function AboutPage() {
  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">
              info
            </span>
            <h1 className="text-4xl font-bold text-white">
              Acerca del Proyecto
            </h1>
          </div>
          <p className="text-lg text-dark-text max-w-3xl mx-auto leading-relaxed">
            Una herramienta educativa moderna para analizar la complejidad
            algorítmica de pseudocódigo con visualizaciones interactivas y
            cálculos automáticos.
          </p>
        </div>

        {/* Qué es - Card Principal */}
        <div className="glass-card p-8 rounded-xl mb-12">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">
                  calculate
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                ¿Qué hace este analizador?
              </h2>
              <p className="text-dark-text leading-relaxed mb-4">
                Toma tu pseudocódigo, construye su estructura con una gramática
                formal y calcula automáticamente el costo computacional línea
                por línea. Genera fórmulas T(n) para mejor y peor caso con
                visualizaciones del flujo de control.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Análisis Automático
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                  Visualizaciones
                </span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                  Fórmulas LaTeX
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado y Tecnologías */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Estado Actual */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-green-400 text-2xl">
                rocket_launch
              </span>
              <h3 className="text-xl font-bold text-white">Estado Actual</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-text text-sm">
                  Editor Monaco con syntax highlighting y validación en tiempo real
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-text text-sm">
                  Parsing completo con ANTLR4 y generación de AST
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-text text-sm">
                  Análisis iterativo y recursivo (Teorema Maestro, Iteración, Árbol, Ecuación Característica)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-text text-sm">
                  Seguimiento de ejecución paso a paso con React Flow
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-text text-sm">
                  Comparación con LLM (Gemini 2.5 Pro) para validación
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-text text-sm">
                  Análisis GPU vs CPU con sistema de scoring
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-text text-sm">
                  Visualizaciones interactivas con diagramas de recursión
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-text text-sm">
                  Soporte para mejor/promedio/peor caso con modelos probabilísticos
                </span>
              </div>
            </div>
          </div>

          {/* Stack Tecnológico */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-blue-400 text-2xl">
                code
              </span>
              <h3 className="text-xl font-bold text-white">Tecnologías</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-medium mb-2 text-sm">
                  Frontend
                </h4>
                <ul className="text-dark-text text-xs space-y-1">
                  <li>Next.js 14 + TypeScript</li>
                  <li>Tailwind CSS + Framer Motion</li>
                  <li>Monaco Editor</li>
                  <li>React Flow (Diagramas)</li>
                  <li>KaTeX (Ecuaciones)</li>
                  <li>Zustand (Estado)</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2 text-sm">Backend</h4>
                <ul className="text-dark-text text-xs space-y-1">
                  <li>FastAPI (Python 3.11+)</li>
                  <li>ANTLR4 Parser</li>
                  <li>SymPy (Matemáticas)</li>
                  <li>Gemini 2.5 Pro/Flash (LLM)</li>
                  <li>Dagre (Layout de grafos)</li>
                  <li>Docker Compose</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Características Implementadas */}
        <div className="glass-card p-8 rounded-xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Características Implementadas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative">
              <div className="glass-secondary p-4 rounded-lg border-l-4 border-emerald-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  <h3 className="text-white font-semibold text-sm">
                    Análisis Recursivo Avanzado
                  </h3>
                </div>
                <p className="text-dark-text text-sm">
                  Teorema Maestro, Método de Iteración, Árbol de Recursión y
                  Ecuación Característica con detección automática
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="glass-secondary p-4 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <h3 className="text-white font-semibold text-sm">
                    Seguimiento de Ejecución
                  </h3>
                </div>
                <p className="text-dark-text text-sm">
                  Visualización paso a paso con React Flow para algoritmos
                  iterativos y diagramas de árbol para recursivos
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="glass-secondary p-4 rounded-lg border-l-4 border-purple-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <h3 className="text-white font-semibold text-sm">
                    Comparación con LLM
                  </h3>
                </div>
                <p className="text-dark-text text-sm">
                  Validación de análisis con Gemini 2.5 Pro, comparación
                  independiente y detección de discrepancias
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="glass-secondary p-4 rounded-lg border-l-4 border-orange-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  <h3 className="text-white font-semibold text-sm">
                    Análisis GPU vs CPU
                  </h3>
                </div>
                <p className="text-dark-text text-sm">
                  Sistema de scoring (0-100) que determina la idoneidad del
                  algoritmo para GPU o CPU según paralelismo y patrones de acceso
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="glass-secondary p-4 rounded-lg border-l-4 border-cyan-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  <h3 className="text-white font-semibold text-sm">
                    Visualizaciones Interactivas
                  </h3>
                </div>
                <p className="text-dark-text text-sm">
                  Diagramas de flujo con React Flow, árboles de recursión, AST
                  interactivo y tablas de costos detalladas
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="glass-secondary p-4 rounded-lg border-l-4 border-pink-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                  <h3 className="text-white font-semibold text-sm">
                    Memoización y Optimización
                  </h3>
                </div>
                <p className="text-dark-text text-sm">
                  Cache inteligente de análisis AST, optimización de bucles
                  anidados y reducción de complejidad computacional
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Características Clave */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-400 text-2xl">
                privacy_tip
              </span>
            </div>
            <h3 className="text-white font-bold mb-2">Sin Registro</h3>
            <p className="text-dark-text text-sm">
              No requiere cuentas ni almacena datos personales
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">
                school
              </span>
            </div>
            <h3 className="text-white font-bold mb-2">Educativo</h3>
            <p className="text-dark-text text-sm">
              Diseñado para aprender análisis de algoritmos
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400 text-2xl">
                speed
              </span>
            </div>
            <h3 className="text-white font-bold mb-2">Tiempo Real</h3>
            <p className="text-dark-text text-sm">
              Análisis instantáneo con feedback inmediato
            </p>
          </div>
        </div>

        {/* Cómo Funciona */}
        <div className="glass-card p-8 rounded-xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            ¿Cómo Funciona?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">
                Escribe Código
              </h3>
              <p className="text-dark-text text-xs">
                Ingresa tu pseudocódigo en el editor
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">
                Análisis AST
              </h3>
              <p className="text-dark-text text-xs">
                Construimos el árbol sintáctico
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">
                Cálculo T(n)
              </h3>
              <p className="text-dark-text text-xs">
                Generamos las fórmulas de complejidad
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold">4</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">
                Visualización
              </h3>
              <p className="text-dark-text text-xs">
                Mostramos gráficos y resultados
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Contacto */}
        <div className="glass-card p-8 rounded-xl mb-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">
                contact_mail
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Contacto</h2>
            <p className="text-dark-text text-sm max-w-2xl mx-auto">
              ¿Tienes preguntas, sugerencias o encontraste algún problema? No dudes en contactarnos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Email */}
            <a
              href="mailto:juan.cruz37552@ucaldas.edu.co"
              className="glass-secondary p-6 rounded-lg hover:scale-105 transition-all duration-300 border border-white/10 hover:border-primary/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-blue-400 text-2xl">
                    email
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1">Email</h3>
                  <p className="text-dark-text text-sm truncate">
                    juan.cruz37552@ucaldas.edu.co
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Camilo Cruz</p>
                </div>
              </div>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/Cruz1122"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-secondary p-6 rounded-lg hover:scale-105 transition-all duration-300 border border-white/10 hover:border-primary/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-purple-400 text-2xl">
                    code
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1">GitHub</h3>
                  <p className="text-dark-text text-sm">@Cruz1122</p>
                  <p className="text-xs text-slate-400 mt-1">Repositorio y Issues</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Enlaces Rápidos */}
        <div className="text-center glass-secondary p-8 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-6">Enlaces Útiles</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <NavigationLink
              href="/"
              className="glass-button inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined mr-2">home</span> Ir al
              Analizador
            </NavigationLink>
            <a
              href="/privacy"
              className="glass-secondary inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined mr-2">shield</span>{" "}
              Política de Privacidad
            </a>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="glass-secondary inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined mr-2">api</span> Estado
              de la API
            </a>
          </div>
          <p className="text-xs text-dark-text mt-6">
            Proyecto académico - Universidad de Caldas 2025-2
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
