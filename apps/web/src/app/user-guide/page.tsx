"use client";

import { useEffect, useState } from "react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ImageModal } from "@/components/ImageModal";
import NavigationLink from "@/components/NavigationLink";
import { useNavigation } from "@/contexts/NavigationContext";
import { useImageModal } from "@/hooks/useImageModal";

interface TableOfContentsItem {
  id: string;
  title: string;
  icon: string;
  subsections?: { id: string; title: string; icon?: string }[];
}

const tableOfContents: TableOfContentsItem[] = [
  { id: "introduccion", title: "Introducción", icon: "info" },
  {
    id: "editor",
    title: "Uso del Editor",
    icon: "edit",
    subsections: [
      { id: "editor-basico", title: "Funciones Básicas", icon: "settings" },
      {
        id: "editor-validacion",
        title: "Validación en Tiempo Real",
        icon: "verified",
      },
      { id: "editor-atajos", title: "Atajos de Teclado", icon: "keyboard" },
    ],
  },
  {
    id: "gramatica",
    title: "Sintaxis de la Gramática",
    icon: "code",
    subsections: [
      {
        id: "gramatica-procedimientos",
        title: "Procedimientos",
        icon: "functions",
      },
      {
        id: "gramatica-variables",
        title: "Variables y Asignación",
        icon: "variable_add",
      },
      {
        id: "gramatica-estructuras",
        title: "Estructuras de Control",
        icon: "account_tree",
      },
      { id: "gramatica-operadores", title: "Operadores", icon: "calculate" },
      { id: "gramatica-arrays", title: "Arrays", icon: "data_array" },
      { id: "gramatica-print", title: "Sentencias PRINT", icon: "print" },
    ],
  },
  {
    id: "analisis",
    title: "Análisis de Complejidad",
    icon: "analytics",
    subsections: [
      { id: "analisis-editor", title: "Desde el Editor Manual", icon: "code" },
      { id: "analisis-chatbot", title: "Desde el Chatbot", icon: "smart_toy" },
      {
        id: "analisis-resultados",
        title: "Interpretando Resultados",
        icon: "insights",
      },
      {
        id: "analisis-llm",
        title: "Comparación con LLM",
        icon: "compare_arrows",
      },
      {
        id: "analisis-gpu-cpu",
        title: "Análisis GPU vs CPU",
        icon: "memory",
      },
      {
        id: "analisis-trace",
        title: "Seguimiento de Pseudocódigo",
        icon: "route",
      },
    ],
  },
  { id: "ejemplos", title: "Ejemplos Rápidos", icon: "lightbulb" },
  { id: "errores", title: "Solución de Problemas", icon: "bug_report" },
];

export default function UserGuidePage() {
  const { selectedImage, closeModal, isModalOpen } = useImageModal();
  const [activeSection, setActiveSection] = useState<string>("introduccion");
  const { finishNavigation } = useNavigation();

  // Finalizar la carga cuando el componente se monte
  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1 z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="space-y-4 text-center lg:text-left mb-8">
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">
                  menu_book
                </span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                  Guía de Usuario
                </h1>
              </div>
            </div>
            <p className="text-dark-text text-sm sm:text-base lg:text-lg leading-relaxed max-w-4xl mx-auto lg:mx-0">
              Aprende a utilizar el analizador de complejidad algorítmica con
              esta guía completa que cubre desde la sintaxis básica hasta el
              análisis avanzado de algoritmos.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Índice lateral mejorado */}
            <aside className="lg:col-span-1">
              <div className="glass-card p-5 sticky top-4 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-xl">
                    list
                  </span>
                  <h2 className="text-lg font-bold text-white">Contenido</h2>
                </div>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <div key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-all ${activeSection === item.id
                          ? "text-white bg-primary/20 border border-primary/30"
                          : "text-dark-text hover:text-white hover:bg-white/5"
                          }`}
                        onClick={() => setActiveSection(item.id)}
                      >
                        <span className="material-symbols-outlined text-base">
                          {item.icon}
                        </span>
                        <span>{item.title}</span>
                      </a>
                      {item.subsections && (
                        <div className="ml-6 space-y-1 mt-1 border-l border-white/10 pl-3">
                          {item.subsections.map((sub) => (
                            <a
                              key={sub.id}
                              href={`#${sub.id}`}
                              className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded transition-all ${activeSection === sub.id
                                ? "text-primary bg-white/10"
                                : "text-dark-text hover:text-white hover:bg-white/5"
                                }`}
                              onClick={() => setActiveSection(sub.id)}
                            >
                              {sub.icon && (
                                <span className="material-symbols-outlined text-xs">
                                  {sub.icon}
                                </span>
                              )}
                              <span>{sub.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Contenido principal */}
            <div className="lg:col-span-3 space-y-8">
              {/* Introducción */}
              <section
                id="introduccion"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      info
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Introducción
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <p className="text-base leading-relaxed">
                    Bienvenido al analizador de complejidad algorítmica. Esta
                    herramienta te permite escribir algoritmos en pseudocódigo y
                    obtener automáticamente el análisis de su complejidad
                    temporal (Big O).
                  </p>
                  <p className="text-base leading-relaxed">
                    El sistema utiliza un lenguaje de pseudocódigo estructurado
                    que es fácil de leer y escribir, con validación en tiempo
                    real y sugerencias automáticas para ayudarte a escribir
                    código correcto.
                  </p>
                  <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl">
                        lightbulb
                      </span>
                      <div>
                        <p className="text-blue-300 text-sm font-semibold mb-1">
                          Consejo
                        </p>
                        <p className="text-blue-200 text-sm">
                          Si eres nuevo, comienza revisando los{" "}
                          <NavigationLink
                            href="/examples"
                            className="underline hover:text-blue-100 font-medium"
                          >
                            ejemplos
                          </NavigationLink>{" "}
                          para familiarizarte con la sintaxis.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Uso del Editor */}
              <section
                id="editor"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      edit
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Uso del Editor
                  </h2>
                </div>

                <div id="editor-basico" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      settings
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Funciones Básicas
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-base leading-relaxed">
                      El editor está basado en Monaco Editor (el mismo editor de
                      Visual Studio Code) y ofrece características avanzadas:
                    </p>
                    <ul className="list-none space-y-2 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          Resaltado de sintaxis específico para el lenguaje de
                          pseudocódigo
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          Autocompletado de palabras clave (BEGIN, END, FOR,
                          WHILE, etc.)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>Numeración de líneas automática</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>Indentación automática inteligente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>Búsqueda y reemplazo de texto (Ctrl+F)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div id="editor-validacion" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      verified
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Validación en Tiempo Real
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-base leading-relaxed">
                      El editor valida tu código mientras escribes, mostrando
                      errores y advertencias de manera inmediata:
                    </p>
                    <ul className="list-none space-y-2 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">
                          error
                        </span>
                        <span>
                          <strong className="text-red-400">
                            Subrayado rojo:
                          </strong>{" "}
                          Errores de sintaxis que deben corregirse
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-yellow-400 text-sm mt-0.5">
                          warning
                        </span>
                        <span>
                          <strong className="text-yellow-400">
                            Subrayado amarillo:
                          </strong>{" "}
                          Advertencias o sugerencias de mejora
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-sm mt-0.5">
                          info
                        </span>
                        <span>
                          Mensajes descriptivos al pasar el mouse sobre el error
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-sm mt-0.5">
                          info
                        </span>
                        <span>
                          Indicadores en el margen izquierdo para errores graves
                        </span>
                      </li>
                    </ul>
                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-400 text-xl">
                          info
                        </span>
                        <div>
                          <p className="text-yellow-300 text-sm font-semibold mb-1">
                            Nota
                          </p>
                          <p className="text-yellow-200 text-sm">
                            La validación ocurre en un Web Worker para no
                            bloquear la interfaz, por lo que puede haber un
                            pequeño retraso.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="editor-atajos" className="scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      keyboard
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Atajos de Teclado
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="glass-secondary rounded-lg overflow-hidden">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="text-left py-3 px-4 text-white font-semibold">
                              Atajo
                            </th>
                            <th className="text-left py-3 px-4 text-white font-semibold">
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-dark-text">
                          <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-mono bg-slate-800/50">
                              <code className="text-cyan-300">Ctrl+S</code>
                            </td>
                            <td className="py-3 px-4">
                              Guardar/Analizar código
                            </td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-mono bg-slate-800/50">
                              <code className="text-cyan-300">Ctrl+F</code>
                            </td>
                            <td className="py-3 px-4">Buscar texto</td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-mono bg-slate-800/50">
                              <code className="text-cyan-300">Ctrl+H</code>
                            </td>
                            <td className="py-3 px-4">Buscar y reemplazar</td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-mono bg-slate-800/50">
                              <code className="text-cyan-300">Ctrl+/</code>
                            </td>
                            <td className="py-3 px-4">
                              Comentar/descomentar línea
                            </td>
                          </tr>
                          <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-mono bg-slate-800/50">
                              <code className="text-cyan-300">Tab</code>
                            </td>
                            <td className="py-3 px-4">Indentar selección</td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-mono bg-slate-800/50">
                              <code className="text-cyan-300">Shift+Tab</code>
                            </td>
                            <td className="py-3 px-4">Desindentar selección</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sintaxis de la Gramática */}
              <section
                id="gramatica"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      code
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Sintaxis de la Gramática
                  </h2>
                </div>

                <div
                  id="gramatica-procedimientos"
                  className="mb-8 scroll-mt-24"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      functions
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Procedimientos
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-base leading-relaxed">
                      Los procedimientos son la unidad básica del lenguaje. Se
                      definen así:
                    </p>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`nombreProcedimiento(parametros) BEGIN
    sentencias...
END`}
                      </pre>
                    </div>
                    <p className="mt-4 text-base">Tipos de parámetros:</p>
                    <ul className="list-none space-y-2 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">Escalares:</strong>{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            factorial(n)
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">
                            Arrays con dimensión:
                          </strong>{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            buscar(A[n], x)
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">
                            Arrays con rango:
                          </strong>{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            ordenar(A[1]..[n])
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">
                            Objetos tipados:
                          </strong>{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            procesar(Lista lista)
                          </code>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div id="gramatica-variables" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      variable_add
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Variables y Asignación
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-base leading-relaxed">
                      Las variables se asignan usando el operador de asignación.
                      Se soportan múltiples notaciones:
                    </p>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`variable <- expresion;    // Recomendado
variable := expresion;    // Estilo Pascal
variable 🡨 expresion;     // Unicode
variable ← expresion;     // Unicode
variable ⟵ expresion;     // Unicode`}
                      </pre>
                    </div>
                    <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-xl">
                          info
                        </span>
                        <div>
                          <p className="text-blue-300 text-sm font-semibold mb-1">
                            Importante
                          </p>
                          <p className="text-blue-200 text-sm">
                            Todas las asignaciones deben terminar con punto y
                            coma (;)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="gramatica-estructuras" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      account_tree
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Estructuras de Control
                    </h3>
                  </div>
                  <div className="space-y-4 text-dark-text">
                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">
                          code
                        </span>
                        IF-THEN-ELSE
                      </h4>
                      <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300 m-0">
                          {`IF (condicion) THEN BEGIN
    sentencias...
END
ELSE BEGIN
    sentencias...
END`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">
                          loop
                        </span>
                        FOR
                      </h4>
                      <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300 m-0">
                          {`FOR variable <- inicio TO fin DO BEGIN
    sentencias...
END`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">
                          repeat
                        </span>
                        WHILE
                      </h4>
                      <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300 m-0">
                          {`WHILE (condicion) DO BEGIN
    sentencias...
END`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">
                          repeat_one
                        </span>
                        REPEAT-UNTIL
                      </h4>
                      <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300 m-0">
                          {`REPEAT
    sentencias...
UNTIL (condicion);`}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-400 text-xl">
                          warning
                        </span>
                        <div>
                          <p className="text-yellow-300 text-sm font-semibold mb-1">
                            Importante
                          </p>
                          <p className="text-yellow-200 text-sm">
                            Todas las estructuras de control requieren bloques
                            BEGIN...END o llaves {"{ }"}. No se permiten
                            sentencias sueltas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="gramatica-operadores" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      calculate
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Operadores
                    </h3>
                  </div>
                  <div className="space-y-4 text-dark-text">
                    <div className="overflow-x-auto">
                      <div className="glass-secondary rounded-lg overflow-hidden">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                              <th className="text-left py-3 px-4 text-white font-semibold">
                                Tipo
                              </th>
                              <th className="text-left py-3 px-4 text-white font-semibold">
                                Operadores
                              </th>
                              <th className="text-left py-3 px-4 text-white font-semibold">
                                Precedencia
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-semibold">
                                Aritméticos
                              </td>
                              <td className="py-3 px-4 font-mono">
                                <code className="text-cyan-300">
                                  + - * / DIV MOD
                                </code>
                              </td>
                              <td className="py-3 px-4">
                                *, /, DIV, MOD {">"} +, -
                              </td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-semibold">
                                Relacionales
                              </td>
                              <td className="py-3 px-4 font-mono">
                                <code className="text-cyan-300">
                                  = != {"<"} {">"} {"<="} {">="}
                                </code>
                              </td>
                              <td className="py-3 px-4">Menor que lógicos</td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-semibold">
                                Lógicos
                              </td>
                              <td className="py-3 px-4 font-mono">
                                <code className="text-cyan-300">
                                  AND OR NOT
                                </code>
                              </td>
                              <td className="py-3 px-4">
                                NOT {">"} AND {">"} OR
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <p className="text-dark-text mb-2 text-base">Ejemplos:</p>
                      <pre className="text-green-300 m-0">
                        {`resultado <- (a + b) * c;
es_valido <- (x > 0) AND (x < 100);
cociente <- total DIV cantidad;
resto <- total MOD cantidad;`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div id="gramatica-arrays" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      data_array
                    </span>
                    <h3 className="text-xl font-semibold text-white">Arrays</h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-base leading-relaxed">
                      Declaración y uso de arrays:
                    </p>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`// Declaración
A[10];              // Array de 10 elementos
matriz[5][5];       // Matriz 5x5

// Acceso
elemento <- A[i];
valor <- matriz[i][j];

// Asignación
A[i] <- valor;
matriz[i][j] <- A[i] + 1;`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div id="gramatica-print" className="scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      print
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Sentencias PRINT
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-base leading-relaxed">
                      La sentencia{" "}
                      <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                        print
                      </code>{" "}
                      permite mostrar valores en la consola:
                    </p>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`print("Hola mundo");
print("Total: ", resultado);
print("Valor de n: " + n);
print("Suma: ", a + b);

// Escapar comillas internas
print("Dijo \"hola\" y salió");`}
                      </pre>
                    </div>
                    <ul className="list-none space-y-2 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">
                            Strings literales:
                          </strong>{" "}
                          Entre comillas dobles{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            &quot;texto&quot;
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">
                            Múltiples argumentos:
                          </strong>{" "}
                          Separados por coma, se concatenan automáticamente
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">Expresiones:</strong>{" "}
                          Puedes incluir variables y operaciones matemáticas
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">
                            Escapar comillas:
                          </strong>{" "}
                          Usa{" "}
                          <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            \&quot;
                          </code>{" "}
                          para comillas dentro del string
                        </span>
                      </li>
                    </ul>
                    <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-xl">
                          info
                        </span>
                        <div>
                          <p className="text-blue-300 text-sm font-semibold mb-1">
                            Nota
                          </p>
                          <p className="text-blue-200 text-sm">
                            El costo de{" "}
                            <code className="text-green-300 bg-slate-800/50 px-1.5 py-0.5 rounded">
                              print
                            </code>{" "}
                            es constante (O(1)) más el costo de evaluar sus
                            argumentos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Análisis de Complejidad */}
              <section
                id="analisis"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      analytics
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Análisis de Complejidad
                  </h2>
                </div>

                <div id="analisis-editor" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      code
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Desde el Editor Manual
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-base leading-relaxed">
                      En el modo manual, puedes escribir código directamente en
                      el editor y analizarlo:
                    </p>
                    <ol className="list-none space-y-3 ml-2">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          1
                        </span>
                        <div>
                          <strong className="text-white">
                            Escribe tu código:
                          </strong>{" "}
                          El editor valida la sintaxis en tiempo real
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          2
                        </span>
                        <div>
                          <strong className="text-white">
                            Verifica el parse:
                          </strong>{" "}
                          Usa el botón &quot;Verificar Parse&quot; para validar
                          la sintaxis
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          3
                        </span>
                        <div>
                          <strong className="text-white">
                            Analiza complejidad:
                          </strong>{" "}
                          Haz clic en &quot;Analizar Complejidad&quot; para
                          iniciar el análisis completo
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          4
                        </span>
                        <div>
                          <strong className="text-white">
                            Revisa resultados:
                          </strong>{" "}
                          Se abrirá la página de resultados con tabla de costos
                          y procedimientos detallados
                        </div>
                      </li>
                    </ol>
                    <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-xl">
                          lightbulb
                        </span>
                        <div>
                          <p className="text-blue-300 text-sm font-semibold mb-1">
                            Consejo
                          </p>
                          <p className="text-blue-200 text-sm">
                            Si hay errores de sintaxis, espera 3 segundos y
                            aparecerá un botón &quot;Ayuda con IA&quot; que
                            enviará tu código al chatbot para corrección
                            automática.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="analisis-chatbot" className="mb-8 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      smart_toy
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Desde el Chatbot
                    </h3>
                  </div>
                  <div className="space-y-3 text-dark-text">
                    <p className="text-base leading-relaxed">
                      También puedes analizar código directamente desde el
                      chatbot:
                    </p>
                    <ol className="list-none space-y-3 ml-2">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          1
                        </span>
                        <div>
                          <strong className="text-white">
                            Pide código al chatbot:
                          </strong>{" "}
                          Solicita un algoritmo o pega código en el chat
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          2
                        </span>
                        <div>
                          <strong className="text-white">
                            Botón &quot;Analizar&quot;:
                          </strong>{" "}
                          Cuando el chatbot devuelve código en un bloque de
                          pseudocódigo, aparecerá un botón verde
                          &quot;Analizar&quot; junto al botón de copiar
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          3
                        </span>
                        <div>
                          <strong className="text-white">
                            Loader en el chat:
                          </strong>{" "}
                          El análisis se ejecuta directamente en la vista del
                          chat con el mismo loader que el editor manual
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                          4
                        </span>
                        <div>
                          <strong className="text-white">
                            Navegación automática:
                          </strong>{" "}
                          Al completar el análisis, se navega automáticamente a
                          la página de resultados
                        </div>
                      </li>
                    </ol>
                    <div className="bg-green-500/10 border-l-4 border-green-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-green-400 text-xl">
                          check_circle
                        </span>
                        <div>
                          <p className="text-green-300 text-sm font-semibold mb-1">
                            Ventaja
                          </p>
                          <p className="text-green-200 text-sm">
                            Puedes pedir correcciones al chatbot y analizar el
                            código corregido sin salir del chat.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div id="analisis-resultados" className="scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      insights
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Interpretando Resultados
                    </h3>
                  </div>
                  <div className="space-y-4 text-dark-text">
                    <p className="text-base leading-relaxed">
                      Una vez completado el análisis, verás:
                    </p>
                    <ul className="list-none space-y-2 ml-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">
                            Tabla de costos por línea:
                          </strong>{" "}
                          Muestra el costo elemental (Cₖ), número de ejecuciones
                          y costo total por línea
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">
                            Selector de casos:
                          </strong>{" "}
                          En la esquina superior derecha, cambia entre
                          Mejor/Promedio/Peor caso
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <span>
                          <strong className="text-white">
                            Tarjetas de resumen:
                          </strong>{" "}
                          Tres tarjetas muestran la notación asintótica (Big-O)
                          para cada caso, con botones &quot;Ver
                          Procedimiento&quot; en cada tarjeta
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                          check_circle
                        </span>
                        <div>
                          <strong className="text-white">
                            Procedimientos detallados:
                          </strong>
                          <ul className="list-none ml-4 mt-2 space-y-1">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 text-xs mt-1">
                                •
                              </span>
                              <span className="text-sm">
                                Procedimiento general: Haz clic en &quot;Ver
                                Procedimiento&quot; en cualquier tarjeta para
                                ver el análisis completo
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 text-xs mt-1">
                                •
                              </span>
                              <span className="text-sm">
                                Procedimiento por línea: Haz clic en cualquier
                                línea de la tabla para ver los pasos específicos
                                de esa línea
                              </span>
                            </li>
                          </ul>
                        </div>
                      </li>
                    </ul>

                    <div className="mt-6">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">
                          tune
                        </span>
                        Modos de Análisis
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-green-500/10 border-l-4 border-green-500/50 rounded-r-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-green-400">
                              trending_up
                            </span>
                            <h5 className="font-semibold text-green-300">
                              Best Case (Mejor Caso)
                            </h5>
                          </div>
                          <p className="text-sm text-dark-text mb-2">
                            Analiza el mejor caso del algoritmo, considerando:
                          </p>
                          <ul className="list-none ml-2 mt-2 text-sm text-dark-text space-y-1">
                            <li className="flex items-start gap-2">
                              <span className="text-green-400 text-xs mt-1">
                                •
                              </span>
                              <span>
                                Ramas de IF con menos líneas de código
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-400 text-xs mt-1">
                                •
                              </span>
                              <span>
                                Mínimo número de iteraciones en bucles
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-400 text-xs mt-1">
                                •
                              </span>
                              <span>
                                Complejidad mínima esperada (cota inferior)
                              </span>
                            </li>
                          </ul>
                          <p className="text-sm text-dark-text mt-2">
                            <strong>Ejemplo:</strong> En búsqueda lineal, el
                            best case es O(1) si el elemento está en la primera
                            posición.
                          </p>
                        </div>

                        <div className="bg-red-500/10 border-l-4 border-red-500/50 rounded-r-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-red-400">
                              trending_down
                            </span>
                            <h5 className="font-semibold text-red-300">
                              Worst Case (Peor Caso)
                            </h5>
                          </div>
                          <p className="text-sm text-dark-text mb-2">
                            Analiza el peor caso del algoritmo, considerando:
                          </p>
                          <ul className="list-none ml-2 mt-2 text-sm text-dark-text space-y-1">
                            <li className="flex items-start gap-2">
                              <span className="text-red-400 text-xs mt-1">
                                •
                              </span>
                              <span>Ramas de IF con más líneas de código</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400 text-xs mt-1">
                                •
                              </span>
                              <span>
                                Máximo número de iteraciones en bucles
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-400 text-xs mt-1">
                                •
                              </span>
                              <span>
                                Complejidad máxima esperada (cota superior)
                              </span>
                            </li>
                          </ul>
                          <p className="text-sm text-dark-text mt-2">
                            <strong>Ejemplo:</strong> En búsqueda lineal, el
                            worst case es O(n) si el elemento no existe o está
                            al final.
                          </p>
                        </div>

                        <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-blue-400">
                              show_chart
                            </span>
                            <h5 className="font-semibold text-blue-300">
                              Average Case (Caso Promedio)
                            </h5>
                          </div>
                          <p className="text-sm text-dark-text mb-2">
                            Analiza el caso promedio usando modelos
                            probabilísticos:
                          </p>
                          <ul className="list-none ml-2 mt-2 text-sm text-dark-text space-y-1">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 text-xs mt-1">
                                •
                              </span>
                              <span>
                                <strong>Modelo Uniforme:</strong> Distribución
                                uniforme de probabilidades (p = 1/2 por defecto)
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 text-xs mt-1">
                                •
                              </span>
                              <span>
                                <strong>Modelo Simbólico:</strong>{" "}
                                Probabilidades expresadas simbólicamente
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 text-xs mt-1">
                                •
                              </span>
                              <span>
                                Esperanzas matemáticas (expectedRuns) para cada
                                línea
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-400 text-xs mt-1">
                                •
                              </span>
                              <span>
                                Complejidad promedio esperada A(n) = E[T(n)]
                              </span>
                            </li>
                          </ul>
                          <p className="text-sm text-dark-text mt-2">
                            <strong>Ejemplo:</strong> En búsqueda lineal, el
                            average case es O(n/2) ≈ O(n) asumiendo distribución
                            uniforme.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-400 text-xl">
                          info
                        </span>
                        <div>
                          <p className="text-yellow-300 text-sm font-semibold mb-1">
                            Nota
                          </p>
                          <p className="text-yellow-200 text-sm">
                            Los procedimientos muestran pasos detallados en
                            LaTeX, desde la expresión original hasta la forma
                            polinómica final y la notación asintótica. Para caso
                            promedio, se muestra A(n) en lugar de T(n).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Comparación con LLM */}
              <section
                id="analisis-llm"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      compare_arrows
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Comparación con LLM
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <p className="text-base leading-relaxed">
                    El sistema permite comparar el análisis automático con un análisis
                    independiente generado por un LLM (Gemini 2.5 Pro):
                  </p>
                  <ul className="list-none space-y-2 ml-2">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <strong className="text-white">Análisis Independiente:</strong>{" "}
                        El LLM analiza el código sin conocer el resultado del sistema
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <strong className="text-white">Validación:</strong> Compara
                        ambos análisis y detecta discrepancias
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <strong className="text-white">Nota de Validación:</strong>{" "}
                        Genera una nota breve (≤100 caracteres) indicando si el
                        análisis es correcto
                      </span>
                    </li>
                  </ul>
                  <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl">
                        info
                      </span>
                      <div>
                        <p className="text-blue-300 text-sm font-semibold mb-1">
                          Nota
                        </p>
                        <p className="text-blue-200 text-sm">
                          La comparación con LLM requiere una API key de Gemini. Puedes
                          configurarla en el footer de la aplicación.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Análisis GPU vs CPU */}
              <section
                id="analisis-gpu-cpu"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      memory
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Análisis GPU vs CPU
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <p className="text-base leading-relaxed">
                    El sistema analiza si tu algoritmo es más adecuado para GPU o CPU
                    mediante un sistema de scoring (0-100):
                  </p>
                  <div className="space-y-4 mt-4">
                    <div className="bg-purple-500/10 border-l-4 border-purple-500/50 rounded-r-lg p-4">
                      <h3 className="font-semibold text-purple-300 mb-2 text-lg">
                        Métricas Analizadas
                      </h3>
                      <ul className="list-none ml-2 text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span>
                            <strong>Recursión:</strong> Penaliza GPU (difícil de
                            paralelizar)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span>
                            <strong>Branching:</strong> Penaliza GPU (divergencia de
                            warps)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span>
                            <strong>Loops:</strong> Favorece GPU si son independientes
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span>
                            <strong>Arrays:</strong> Favorece GPU (acceso paralelo)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 text-xs mt-1">•</span>
                          <span>
                            <strong>Operaciones matemáticas:</strong> Favorece GPU
                            (ALUs especializadas)
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-cyan-500/10 border-l-4 border-cyan-500/50 rounded-r-lg p-4">
                      <h3 className="font-semibold text-cyan-300 mb-2 text-lg">
                        Recomendaciones
                      </h3>
                      <ul className="list-none ml-2 text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 text-xs mt-1">•</span>
                          <span>
                            <strong>GPU:</strong> Score GPU {">"}60 (altamente
                            paralelizable)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 text-xs mt-1">•</span>
                          <span>
                            <strong>CPU:</strong> Score CPU {">"}60 (secuencial o
                            complejo)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 text-xs mt-1">•</span>
                          <span>
                            <strong>Mixto:</strong> Ambos scores 40-60 (híbrido)
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Seguimiento de Pseudocódigo */}
              <section
                id="analisis-trace"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      route
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Seguimiento de Pseudocódigo
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <p className="text-base leading-relaxed">
                    El sistema permite visualizar la ejecución paso a paso de tu
                    algoritmo con valores de entrada específicos:
                  </p>
                  <div className="space-y-4 mt-4">
                    <div className="bg-green-500/10 border-l-4 border-green-500/50 rounded-r-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-green-400">
                          code
                        </span>
                        <h3 className="font-semibold text-green-300 text-lg">
                          Algoritmos Iterativos
                        </h3>
                      </div>
                      <ul className="list-none ml-2 text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 text-xs mt-1">•</span>
                          <span>
                            Instrumenta el código para capturar el estado en cada paso
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 text-xs mt-1">•</span>
                          <span>Muestra valores de variables en cada iteración</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 text-xs mt-1">•</span>
                          <span>Visualiza el flujo de ejecución con React Flow</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 text-xs mt-1">•</span>
                          <span>
                            Permite ingresar valores de entrada personalizados
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-orange-500/10 border-l-4 border-orange-500/50 rounded-r-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-orange-400">
                          account_tree
                        </span>
                        <h3 className="font-semibold text-orange-300 text-lg">
                          Algoritmos Recursivos
                        </h3>
                      </div>
                      <ul className="list-none ml-2 text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 text-xs mt-1">•</span>
                          <span>
                            Genera diagrama de árbol de recursión con LLM (Gemini 2.0
                            Flash)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 text-xs mt-1">•</span>
                          <span>
                            Muestra llamadas recursivas con valores de entrada/salida
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 text-xs mt-1">•</span>
                          <span>Visualiza el árbol completo con React Flow</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 text-xs mt-1">•</span>
                          <span>Incluye explicación del proceso de recursión</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-yellow-400 text-xl">
                        info
                      </span>
                      <div>
                        <p className="text-yellow-300 text-sm font-semibold mb-1">
                          Nota
                        </p>
                        <p className="text-yellow-200 text-sm">
                          El seguimiento de algoritmos recursivos requiere una API key
                          de Gemini para generar los diagramas. El seguimiento
                          iterativo no requiere API key.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Ejemplos Rápidos */}
              <section
                id="ejemplos"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      lightbulb
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Ejemplos Rápidos
                  </h2>
                </div>
                <div className="space-y-6 text-dark-text">
                  <p className="text-base leading-relaxed">
                    Aquí tienes algunos ejemplos simples para empezar:
                  </p>

                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">
                        calculate
                      </span>
                      Ejemplo 1: Factorial
                    </h4>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`factorial(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">
                        search
                      </span>
                      Ejemplo 2: Búsqueda Lineal
                    </h4>
                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300 m-0">
                        {`busquedaLineal(A[n], x, n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END`}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl">
                        arrow_forward
                      </span>
                      <div>
                        <p className="text-blue-300 text-sm font-semibold mb-1">
                          Más ejemplos
                        </p>
                        <p className="text-blue-200 text-sm">
                          Para ver más ejemplos completos, visita la{" "}
                          <NavigationLink
                            href="/examples"
                            className="underline hover:text-blue-100 font-medium"
                          >
                            página de ejemplos
                          </NavigationLink>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Solución de Problemas */}
              <section
                id="errores"
                className="glass-card p-6 lg:p-8 rounded-xl scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      bug_report
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Solución de Problemas
                  </h2>
                </div>
                <div className="space-y-4 text-dark-text">
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border-l-4 border-red-500/50 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-400 text-xl">
                          error
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-300 mb-2">
                            Error: &quot;unexpected token&quot;
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong className="text-white">Causa:</strong>{" "}
                              Token inesperado en la sintaxis.
                            </p>
                            <p>
                              <strong className="text-white">Solución:</strong>{" "}
                              Verifica que todas las palabras clave estén en
                              mayúsculas (BEGIN, END, IF, THEN, etc.) y que los
                              bloques estén completos.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border-l-4 border-red-500/50 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-400 text-xl">
                          error
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-300 mb-2">
                            Error: &quot;missing BEGIN or END&quot;
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong className="text-white">Causa:</strong>{" "}
                              Falta un bloque BEGIN...END en una estructura de
                              control.
                            </p>
                            <p>
                              <strong className="text-white">Solución:</strong>{" "}
                              Todas las estructuras (IF, FOR, WHILE) requieren
                              bloques completos. No se permiten sentencias
                              sueltas.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border-l-4 border-red-500/50 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-400 text-xl">
                          error
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-300 mb-2">
                            Error: &quot;missing semicolon&quot;
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong className="text-white">Causa:</strong>{" "}
                              Falta punto y coma al final de una sentencia.
                            </p>
                            <p>
                              <strong className="text-white">Solución:</strong>{" "}
                              Todas las asignaciones, declaraciones y llamadas
                              deben terminar con punto y coma (;).
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-yellow-400 text-xl">
                          warning
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-300 mb-2">
                            API no disponible
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong className="text-white">Causa:</strong> El
                              servidor backend no está respondiendo.
                            </p>
                            <p>
                              <strong className="text-white">Solución:</strong>{" "}
                              El editor seguirá funcionando con validación
                              local, pero el análisis de complejidad no estará
                              disponible. Verifica tu conexión o intenta más
                              tarde.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer de navegación mejorado */}
              <footer className="glass-card p-6 rounded-xl mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <NavigationLink
                    href="/documentation"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
                      arrow_back
                    </span>
                    <span className="font-medium">Volver a Documentación</span>
                  </NavigationLink>
                  <NavigationLink
                    href="/examples"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group"
                  >
                    <span className="font-medium">Ver Ejemplos</span>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </NavigationLink>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </main>

      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      <Footer />
    </div>
  );
}
