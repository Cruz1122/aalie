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
  subsections?: { id: string; title: string }[];
}

const tableOfContents: TableOfContentsItem[] = [
  { id: "introduccion", title: "Introducción" },
  { id: "editor", title: "Uso del Editor", subsections: [
    { id: "editor-basico", title: "Funciones Básicas" },
    { id: "editor-validacion", title: "Validación en Tiempo Real" },
    { id: "editor-atajos", title: "Atajos de Teclado" },
  ]},
  { id: "gramatica", title: "Sintaxis de la Gramática", subsections: [
    { id: "gramatica-procedimientos", title: "Procedimientos" },
    { id: "gramatica-variables", title: "Variables y Asignación" },
    { id: "gramatica-estructuras", title: "Estructuras de Control" },
    { id: "gramatica-operadores", title: "Operadores" },
    { id: "gramatica-arrays", title: "Arrays" },
  ]},
  { id: "analisis", title: "Análisis de Complejidad" },
  { id: "ejemplos", title: "Ejemplos Rápidos" },
  { id: "errores", title: "Solución de Problemas" },
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
          <header className="space-y-3 text-center lg:text-left mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              Guía de Usuario
            </h1>
            <p className="text-dark-text text-sm sm:text-base lg:text-lg leading-relaxed max-w-4xl mx-auto lg:mx-0">
              Aprende a utilizar el analizador de complejidad algorítmica con esta guía completa
              que cubre desde la sintaxis básica hasta el análisis avanzado de algoritmos.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Índice lateral */}
            <aside className="lg:col-span-1">
              <div className="glass-card p-4 sticky top-4">
                <h2 className="text-lg font-bold text-white mb-4">Contenido</h2>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <div key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block text-sm py-1 px-2 rounded transition-colors ${
                          activeSection === item.id
                            ? "text-primary bg-white/10"
                            : "text-dark-text hover:text-white"
                        }`}
                        onClick={() => setActiveSection(item.id)}
                      >
                        {item.title}
                      </a>
                      {item.subsections && (
                        <div className="ml-4 space-y-1 mt-1">
                          {item.subsections.map((sub) => (
                            <a
                              key={sub.id}
                              href={`#${sub.id}`}
                              className={`block text-xs py-1 px-2 rounded transition-colors ${
                                activeSection === sub.id
                                  ? "text-primary bg-white/10"
                                  : "text-dark-text hover:text-white"
                              }`}
                              onClick={() => setActiveSection(sub.id)}
                            >
                              {sub.title}
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
              <section id="introduccion" className="glass-card p-6 scroll-mt-24">
                <h2 className="text-2xl font-bold text-white mb-4">Introducción</h2>
                <div className="space-y-4 text-dark-text">
                  <p>
                    Bienvenido al analizador de complejidad algorítmica. Esta herramienta te permite
                    escribir algoritmos en pseudocódigo y obtener automáticamente el análisis de su
                    complejidad temporal (Big O).
                  </p>
                  <p>
                    El sistema utiliza un lenguaje de pseudocódigo estructurado que es fácil de leer
                    y escribir, con validación en tiempo real y sugerencias automáticas para ayudarte
                    a escribir código correcto.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-300 text-sm">
                      <strong>💡 Consejo:</strong> Si eres nuevo, comienza revisando los{" "}
                      <NavigationLink href="/examples" className="underline hover:text-blue-200">
                        ejemplos
                      </NavigationLink>{" "}
                      para familiarizarte con la sintaxis.
                    </p>
                  </div>
                </div>
              </section>

              {/* Uso del Editor */}
              <section id="editor" className="glass-card p-6 scroll-mt-24">
                <h2 className="text-2xl font-bold text-white mb-4">Uso del Editor</h2>

                <div id="editor-basico" className="mb-6 scroll-mt-24">
                  <h3 className="text-xl font-semibold text-white mb-3">Funciones Básicas</h3>
                  <div className="space-y-3 text-dark-text">
                    <p>
                      El editor está basado en Monaco Editor (el mismo editor de Visual Studio Code)
                      y ofrece características avanzadas:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Resaltado de sintaxis específico para el lenguaje de pseudocódigo</li>
                      <li>Autocompletado de palabras clave (BEGIN, END, FOR, WHILE, etc.)</li>
                      <li>Numeración de líneas automática</li>
                      <li>Indentación automática inteligente</li>
                      <li>Búsqueda y reemplazo de texto (Ctrl+F)</li>
                    </ul>
                  </div>
                </div>

                <div id="editor-validacion" className="mb-6 scroll-mt-24">
                  <h3 className="text-xl font-semibold text-white mb-3">Validación en Tiempo Real</h3>
                  <div className="space-y-3 text-dark-text">
                    <p>
                      El editor valida tu código mientras escribes, mostrando errores y advertencias
                      de manera inmediata:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>
                        <strong className="text-red-400">Subrayado rojo:</strong> Errores de sintaxis
                        que deben corregirse
                      </li>
                      <li>
                        <strong className="text-yellow-400">Subrayado amarillo:</strong> Advertencias
                        o sugerencias de mejora
                      </li>
                      <li>Mensajes descriptivos al pasar el mouse sobre el error</li>
                      <li>Indicadores en el margen izquierdo para errores graves</li>
                    </ul>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                      <p className="text-yellow-300 text-sm">
                        <strong>⚠️ Nota:</strong> La validación ocurre en un Web Worker para no
                        bloquear la interfaz, por lo que puede haber un pequeño retraso.
                      </p>
                    </div>
                  </div>
                </div>

                <div id="editor-atajos" className="scroll-mt-24">
                  <h3 className="text-xl font-semibold text-white mb-3">Atajos de Teclado</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 px-4 text-white font-semibold">Atajo</th>
                          <th className="text-left py-2 px-4 text-white font-semibold">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="text-dark-text">
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-4 font-mono">Ctrl+S</td>
                          <td className="py-2 px-4">Guardar/Analizar código</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-4 font-mono">Ctrl+F</td>
                          <td className="py-2 px-4">Buscar texto</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-4 font-mono">Ctrl+H</td>
                          <td className="py-2 px-4">Buscar y reemplazar</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-4 font-mono">Ctrl+/</td>
                          <td className="py-2 px-4">Comentar/descomentar línea</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-4 font-mono">Tab</td>
                          <td className="py-2 px-4">Indentar selección</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-4 font-mono">Shift+Tab</td>
                          <td className="py-2 px-4">Desindentar selección</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Sintaxis de la Gramática */}
              <section id="gramatica" className="glass-card p-6 scroll-mt-24">
                <h2 className="text-2xl font-bold text-white mb-4">Sintaxis de la Gramática</h2>

                <div id="gramatica-procedimientos" className="mb-6 scroll-mt-24">
                  <h3 className="text-xl font-semibold text-white mb-3">Procedimientos</h3>
                  <div className="space-y-3 text-dark-text">
                    <p>Los procedimientos son la unidad básica del lenguaje. Se definen así:</p>
                    <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300">
{`nombreProcedimiento(parametros) BEGIN
    sentencias...
END`}
                      </pre>
                    </div>
                    <p className="mt-3">Tipos de parámetros:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>
                        <strong>Escalares:</strong> <code className="text-green-300">factorial(n)</code>
                      </li>
                      <li>
                        <strong>Arrays con dimensión:</strong>{" "}
                        <code className="text-green-300">buscar(A[n], x)</code>
                      </li>
                      <li>
                        <strong>Arrays con rango:</strong>{" "}
                        <code className="text-green-300">ordenar(A[1]..[n])</code>
                      </li>
                      <li>
                        <strong>Objetos tipados:</strong>{" "}
                        <code className="text-green-300">procesar(Lista lista)</code>
                      </li>
                    </ul>
                  </div>
                </div>

                <div id="gramatica-variables" className="mb-6 scroll-mt-24">
                  <h3 className="text-xl font-semibold text-white mb-3">Variables y Asignación</h3>
                  <div className="space-y-3 text-dark-text">
                    <p>
                      Las variables se asignan usando el operador de asignación. Se soportan
                      múltiples notaciones:
                    </p>
                    <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300">
                        {`variable <- expresion;    // Recomendado
                        variable := expresion;    // Estilo Pascal`}
                      </pre>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-3">
                      <p className="text-blue-300 text-sm">
                        <strong>💡 Importante:</strong> Todas las asignaciones deben terminar con
                        punto y coma (;)
                      </p>
                    </div>
                  </div>
                </div>

                <div id="gramatica-estructuras" className="mb-6 scroll-mt-24">
                  <h3 className="text-xl font-semibold text-white mb-3">Estructuras de Control</h3>
                  <div className="space-y-4 text-dark-text">
                    <div>
                      <h4 className="font-semibold text-white mb-2">IF-THEN-ELSE</h4>
                      <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300">
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
                      <h4 className="font-semibold text-white mb-2">FOR</h4>
                      <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300">
{`FOR variable <- inicio TO fin DO BEGIN
    sentencias...
END`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">WHILE</h4>
                      <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300">
{`WHILE (condicion) DO BEGIN
    sentencias...
END`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">REPEAT-UNTIL</h4>
                      <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="text-green-300">
{`REPEAT
    sentencias...
UNTIL (condicion);`}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-300 text-sm">
                        <strong>⚠️ Importante:</strong> Todas las estructuras de control requieren
                        bloques BEGIN...END o llaves {'{ }'}. No se permiten sentencias sueltas.
                      </p>
                    </div>
                  </div>
                </div>

                <div id="gramatica-operadores" className="mb-6 scroll-mt-24">
                  <h3 className="text-xl font-semibold text-white mb-3">Operadores</h3>
                  <div className="space-y-4 text-dark-text">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-4 text-white font-semibold">Tipo</th>
                            <th className="text-left py-2 px-4 text-white font-semibold">
                              Operadores
                            </th>
                            <th className="text-left py-2 px-4 text-white font-semibold">
                              Precedencia
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-4 font-semibold">Aritméticos</td>
                            <td className="py-2 px-4 font-mono">+ - * / DIV MOD</td>
                            <td className="py-2 px-4">*, /, DIV, MOD {'>'} +, -</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-4 font-semibold">Relacionales</td>
                            <td className="py-2 px-4 font-mono">= != {'<'} {'>'} {'<='} {'>='}</td>
                            <td className="py-2 px-4">Menor que lógicos</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-4 font-semibold">Lógicos</td>
                            <td className="py-2 px-4 font-mono">AND OR NOT</td>
                            <td className="py-2 px-4">NOT {'>'} AND {'>'} OR</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <p className="text-dark-text mb-2">Ejemplos:</p>
                      <pre className="text-green-300">
{`resultado <- (a + b) * c;
es_valido <- (x > 0) AND (x < 100);
cociente <- total DIV cantidad;
resto <- total MOD cantidad;`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div id="gramatica-arrays" className="scroll-mt-24">
                  <h3 className="text-xl font-semibold text-white mb-3">Arrays</h3>
                  <div className="space-y-3 text-dark-text">
                    <p>Declaración y uso de arrays:</p>
                    <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300">
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
              </section>

              {/* Análisis de Complejidad */}
              <section id="analisis" className="glass-card p-6 scroll-mt-24">
                <h2 className="text-2xl font-bold text-white mb-4">Análisis de Complejidad</h2>
                <div className="space-y-4 text-dark-text">
                  <p>
                    Una vez que tu código es válido, el sistema realiza automáticamente el análisis
                    de complejidad temporal:
                  </p>
                  <ol className="list-decimal list-inside space-y-3 ml-4">
                    <li>
                      <strong className="text-white">Validación:</strong> El parser verifica que la
                      sintaxis sea correcta
                    </li>
                    <li>
                      <strong className="text-white">AST:</strong> Se genera un árbol de sintaxis
                      abstracta (AST)
                    </li>
                    <li>
                      <strong className="text-white">Análisis:</strong> Se calcula el costo de cada
                      línea y el número de ejecuciones
                    </li>
                    <li>
                      <strong className="text-white">Visualización:</strong> Se muestran los
                      resultados en formato tabla y ecuaciones LaTeX
                    </li>
                  </ol>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                    <p className="text-green-300 text-sm">
                      <strong>✓ Resultado:</strong> Obtendrás la complejidad en Best Case, Average
                      Case y Worst Case con los pasos detallados del cálculo.
                    </p>
                  </div>
                </div>
              </section>

              {/* Ejemplos Rápidos */}
              <section id="ejemplos" className="glass-card p-6 scroll-mt-24">
                <h2 className="text-2xl font-bold text-white mb-4">Ejemplos Rápidos</h2>
                <div className="space-y-4 text-dark-text">
                  <p>Aquí tienes algunos ejemplos simples para empezar:</p>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Ejemplo 1: Factorial</h4>
                    <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300">
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
                    <h4 className="font-semibold text-white mb-2">Ejemplo 2: Búsqueda Lineal</h4>
                    <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-green-300">
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

                  <p className="mt-4">
                    Para ver más ejemplos completos, visita la{" "}
                    <NavigationLink href="/examples" className="text-blue-400 hover:text-blue-300 underline">
                      página de ejemplos
                    </NavigationLink>
                    .
                  </p>
                </div>
              </section>

              {/* Solución de Problemas */}
              <section id="errores" className="glass-card p-6 scroll-mt-24">
                <h2 className="text-2xl font-bold text-white mb-4">Solución de Problemas</h2>
                <div className="space-y-4 text-dark-text">
                  <div className="space-y-3">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-red-300 mb-2">
                        Error: &quot;unexpected token&quot;
                      </h4>
                      <p className="text-sm">
                        <strong>Causa:</strong> Token inesperado en la sintaxis.
                        <br />
                        <strong>Solución:</strong> Verifica que todas las palabras clave estén en
                        mayúsculas (BEGIN, END, IF, THEN, etc.) y que los bloques estén completos.
                      </p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-red-300 mb-2">
                        Error: &quot;missing BEGIN or END&quot;
                      </h4>
                      <p className="text-sm">
                        <strong>Causa:</strong> Falta un bloque BEGIN...END en una estructura de
                        control.
                        <br />
                        <strong>Solución:</strong> Todas las estructuras (IF, FOR, WHILE) requieren
                        bloques completos. No se permiten sentencias sueltas.
                      </p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-red-300 mb-2">
                        Error: &quot;missing semicolon&quot;
                      </h4>
                      <p className="text-sm">
                        <strong>Causa:</strong> Falta punto y coma al final de una sentencia.
                        <br />
                        <strong>Solución:</strong> Todas las asignaciones, declaraciones y llamadas
                        deben terminar con punto y coma (;).
                      </p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-300 mb-2">API no disponible</h4>
                      <p className="text-sm">
                        <strong>Causa:</strong> El servidor backend no está respondiendo.
                        <br />
                        <strong>Solución:</strong> El editor seguirá funcionando con validación
                        local, pero el análisis de complejidad no estará disponible. Verifica tu
                        conexión o intenta más tarde.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer de navegación */}
              <footer className="text-sm sm:text-base text-dark-text text-center border-t border-white/10 pt-6 mt-8">
                <div className="flex justify-between items-center">
                  <NavigationLink
                    href="/documentation"
                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                  >
                    ← Volver a Documentación
                  </NavigationLink>
                  <NavigationLink
                    href="/examples"
                    className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                  >
                    Ver Ejemplos →
                  </NavigationLink>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </main>

      <ImageModal image={selectedImage} isOpen={isModalOpen} onClose={closeModal} />

      <Footer />
    </div>
  );
}

