import Link from "next/link";

import Footer from "@/components/Footer";
import Header from "@/components/Header";

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
            <span className="material-symbols-outlined text-4xl text-primary">info</span>
            <h1 className="text-4xl font-bold text-white">Acerca del Proyecto</h1>
          </div>
          <p className="text-lg text-dark-text max-w-3xl mx-auto leading-relaxed">
            Una herramienta educativa moderna para analizar la complejidad algorítmica de
            pseudocódigo con visualizaciones interactivas y cálculos automáticos.
          </p>
        </div>

        {/* Qué es - Card Principal */}
        <div className="glass-card p-8 rounded-xl mb-12">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">calculate</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">¿Qué hace este analizador?</h2>
              <p className="text-dark-text leading-relaxed mb-4">
                Toma tu pseudocódigo, construye su estructura con una gramática formal y calcula
                automáticamente el costo computacional línea por línea. Genera fórmulas T(n) para
                mejor y peor caso con visualizaciones del flujo de control.
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
                <span className="text-dark-text text-sm">Base del proyecto completada</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-dark-text text-sm">Arquitectura monorepo funcional</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-dark-text text-sm">Editor y parsing en desarrollo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-dark-text text-sm">Análisis de complejidad próximamente</span>
              </div>
            </div>
          </div>

          {/* Stack Tecnológico */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-blue-400 text-2xl">code</span>
              <h3 className="text-xl font-bold text-white">Tecnologías</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-medium mb-2 text-sm">Frontend</h4>
                <ul className="text-dark-text text-xs space-y-1">
                  <li>Next.js + TypeScript</li>
                  <li>Tailwind CSS</li>
                  <li>Monaco Editor</li>
                  <li>KaTeX & Cytoscape.js</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2 text-sm">Backend</h4>
                <ul className="text-dark-text text-xs space-y-1">
                  <li>FastAPI (Python)</li>
                  <li>ANTLR4 Parser</li>
                  <li>SymPy (Matemáticas)</li>
                  <li>Docker Compose</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="glass-card p-8 rounded-xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Roadmap de Desarrollo</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative">
              <div className="glass-secondary p-4 rounded-lg border-l-4 border-green-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <h3 className="text-white font-semibold text-sm">Sprint 2-3</h3>
                </div>
                <p className="text-dark-text text-sm">
                  Editor Monaco + Gramática ANTLR4 + Parsing dual
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="glass-secondary p-4 rounded-lg border-l-4 border-yellow-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <h3 className="text-white font-semibold text-sm">Sprint 4</h3>
                </div>
                <p className="text-dark-text text-sm">
                  Análisis de complejidad + Cierre de sumatorias
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="glass-secondary p-4 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <h3 className="text-white font-semibold text-sm">Sprint 5-6</h3>
                </div>
                <p className="text-dark-text text-sm">Visualizaciones + CFG + Documentación</p>
              </div>
            </div>
          </div>
        </div>

        {/* Características Clave */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-400 text-2xl">privacy_tip</span>
            </div>
            <h3 className="text-white font-bold mb-2">Sin Registro</h3>
            <p className="text-dark-text text-sm">
              No requiere cuentas ni almacena datos personales
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">school</span>
            </div>
            <h3 className="text-white font-bold mb-2">Educativo</h3>
            <p className="text-dark-text text-sm">Diseñado para aprender análisis de algoritmos</p>
          </div>

          <div className="glass-card p-6 rounded-xl text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-400 text-2xl">speed</span>
            </div>
            <h3 className="text-white font-bold mb-2">Tiempo Real</h3>
            <p className="text-dark-text text-sm">Análisis instantáneo con feedback inmediato</p>
          </div>
        </div>

        {/* Cómo Funciona */}
        <div className="glass-card p-8 rounded-xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">¿Cómo Funciona?</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">Escribe Código</h3>
              <p className="text-dark-text text-xs">Ingresa tu pseudocódigo en el editor</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">Análisis AST</h3>
              <p className="text-dark-text text-xs">Construimos el árbol sintáctico</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">Cálculo T(n)</h3>
              <p className="text-dark-text text-xs">Generamos las fórmulas de complejidad</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary font-bold">4</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">Visualización</h3>
              <p className="text-dark-text text-xs">Mostramos gráficos y resultados</p>
            </div>
          </div>
        </div>

        {/* Enlaces Rápidos */}
        <div className="text-center glass-secondary p-8 rounded-xl">
          <h3 className="text-xl font-bold text-white mb-6">Enlaces Útiles</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="glass-button inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined mr-2">home</span> Ir al Analizador
            </Link>
            <a
              href="/privacy"
              className="glass-secondary inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined mr-2">shield</span> Política de Privacidad
            </a>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="glass-secondary inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined mr-2">api</span> Estado de la API
            </a>
          </div>
          <p className="text-xs text-dark-text mt-6">
            Proyecto académico - Universidad de Caldas 2025
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
