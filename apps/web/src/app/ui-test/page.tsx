"use client";
import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FlaskConical, Play, Calculator, Code, Sparkles, X } from "lucide-react";

// Datos de ejemplo
const sampleTableData = [
  { no: 1, code: "for i in range(n):", ck: "C1", execs: "n+1", cost: "C1*(n+1)" },
  { no: 2, code: "    sum += i", ck: "C2", execs: "n", cost: "C2*n" },
  { no: 3, code: "    if i % 2 == 0:", ck: "C3", execs: "n", cost: "C3*n" },
  { no: 4, code: "        print(f'Even: {i}')", ck: "C4", execs: "n/2", cost: "C4*(n/2)" },
];

const sampleProcedureData = {
  lines: sampleTableData,
  cases: {
    best: {
      assumptions: "Todos los elementos son pares, minimizando operaciones condicionales",
      stepsLatex: [
        "T(n) = C_1(n+1) + C_2 \\cdot n + C_3 \\cdot n + C_4 \\cdot \\frac{n}{2}",
        "T(n) = C_1 n + C_1 + C_2 n + C_3 n + C_4 \\frac{n}{2}",
        "T(n) = n(C_1 + C_2 + C_3 + \\frac{C_4}{2}) + C_1",
        "T(n) = \\Theta(n)"
      ],
      Tlatex: "T(n) = n(C_1 + C_2 + C_3 + \\frac{C_4}{2}) + C_1",
      Tclosed: "T(n) = Θ(n)"
    }
  }
};

// Componentes nativos optimizados
const NativeButton: React.FC<{ 
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ variant = "primary", onClick, children, className = "" }) => {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl focus:ring-green-500/50",
    secondary: "glass-card backdrop-blur-sm border border-white/20 text-white hover:bg-white/10 shadow-lg hover:shadow-xl focus:ring-white/50",
    ghost: "bg-transparent hover:bg-white/10 border border-transparent hover:border-white/20 text-slate-300 hover:text-white focus:ring-white/50"
  };

  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const NativeLatexBlock: React.FC<{ formula: string; className?: string }> = ({ formula, className = "" }) => (
  <pre className={`whitespace-pre-wrap text-sm leading-6 overflow-x-auto p-3 rounded-md bg-slate-900/40 text-slate-100 border border-white/10 ${className}`}>
    {formula}
  </pre>
);

const NativeTableCosts: React.FC<{ rows: typeof sampleTableData }> = ({ rows }) => (
  <div className="overflow-x-auto rounded-lg border border-white/10">
    <table className="min-w-[720px] w-full text-sm">
      <thead className="bg-slate-800 text-slate-100">
        <tr>
          <th className="px-3 py-2 text-left">#</th>
          <th className="px-3 py-2 text-left">Código</th>
          <th className="px-3 py-2 text-left">C_k</th>
          <th className="px-3 py-2 text-left">#ejec</th>
          <th className="px-3 py-2 text-left">Costo</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/10">
        {rows.map(r => (
          <tr key={r.no} className="bg-slate-900/40 hover:bg-slate-800/50 transition-colors">
            <td className="px-3 py-2 text-slate-200">{r.no}</td>
            <td className="px-3 py-2 font-mono text-[12px] text-slate-100">{r.code}</td>
            <td className="px-3 py-2 text-sky-300">{r.ck}</td>
            <td className="px-3 py-2 text-emerald-300">{r.execs}</td>
            <td className="px-3 py-2 text-amber-300">{r.cost}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function UITestPage() {
  const [showModal, setShowModal] = useState(false);
  const [showProcedure, setShowProcedure] = useState(false);

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />
      
      <main className="flex-1 z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <header className="space-y-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10">
                <FlaskConical size={48} className="text-purple-400" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Componentes Nativos de UI
            </h1>
            <p className="text-dark-text text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto">
              Demostración de componentes nativos optimizados para máximo rendimiento, 
              sin dependencias externas.
            </p>
          </header>

          <div className="grid gap-8">
            {/* Buttons Section */}
            <section className="glass-card p-6 sm:p-8 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Play size={24} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Botones Nativos</h2>
                  <p className="text-dark-text text-sm">Botones con estilo glass-card, gradientes y transiciones optimizadas</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <NativeButton variant="primary">Primary Button</NativeButton>
                  <NativeButton variant="secondary">Secondary Button</NativeButton>
                  <NativeButton variant="ghost">Ghost Button</NativeButton>
                </div>
                <p className="text-xs text-slate-400">
                  Construidos con clases nativas de Tailwind, sin JavaScript adicional
                </p>
              </div>
            </section>

            {/* Table Section */}
            <section className="glass-card p-6 sm:p-8 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Code size={24} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Tabla de Análisis de Costos</h2>
                  <p className="text-dark-text text-sm">Tabla nativa con scroll horizontal y colores optimizados</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-sm text-slate-300 bg-slate-800/50 p-4 rounded-lg border border-white/10">
                  <h3 className="font-semibold text-amber-300 mb-2">Código de ejemplo:</h3>
                  <pre className="font-mono text-xs leading-relaxed">
{`for i in range(n):
    sum += i
    if i % 2 == 0:
        print(f'Even: {i}')`}
                  </pre>
                </div>
                
                <NativeTableCosts rows={sampleTableData} />
                
                <p className="text-xs text-slate-400 text-center mt-4">
                  Renderizado nativo con hover effects y responsive design
                </p>
              </div>
            </section>

            {/* LaTeX Section */}
            <section className="glass-card p-6 sm:p-8 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Calculator size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Bloques LaTeX</h2>
                  <p className="text-dark-text text-sm">Renderizado simple de fórmulas con scroll horizontal</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  Muestra las fórmulas como texto plano con formato preservado. 
                  Se puede mejorar más tarde con un renderizador LaTeX si es necesario.
                </p>
                
                <div className="space-y-3">
                  <NativeLatexBlock formula="T(n) = C_1(n+1) + C_2 \cdot n + C_3 \cdot n + C_4 \cdot \frac{n}{2}" />
                  <NativeLatexBlock formula="T(n) = n(C_1 + C_2 + C_3 + \frac{C_4}{2}) + C_1" />
                  <NativeLatexBlock formula="T(n) = \Theta(n)" />
                </div>
                
                <p className="text-xs text-slate-400">
                  Simple y eficiente, con opción de upgrade a KaTeX más tarde
                </p>
              </div>
            </section>

            {/* Interactive Demo */}
            <section className="glass-card p-6 sm:p-8 rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Sparkles size={24} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Demostración Interactiva</h2>
                  <p className="text-dark-text text-sm">Modales nativos optimizados sin glitches</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4 p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <h3 className="text-lg font-semibold text-blue-300">Modal Simple</h3>
                  <p className="text-sm text-slate-300">
                    Modal nativo sin dependencias externas, posicionamiento optimizado.
                  </p>
                  <NativeButton variant="secondary" onClick={() => setShowModal(true)}>
                    Abrir Modal
                  </NativeButton>
                </div>
                
                <div className="space-y-4 p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-purple-300">Análisis Completo</h3>
                  <p className="text-sm text-slate-300">
                    Modal complejo con componentes nativos y máximo rendimiento.
                  </p>
                  <NativeButton variant="secondary" onClick={() => setShowProcedure(true)}>
                    Ver Análisis
                  </NativeButton>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Modales nativos optimizados */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[600px] glass-card rounded-xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-4">
              <h3 className="text-xl font-semibold text-white">Modal Nativo Optimizado</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-slate-300">
                Este modal usa componentes 100% nativos para máximo rendimiento.
              </p>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
                <h4 className="font-semibold text-white mb-2">Beneficios del enfoque nativo:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>Sin dependencias externas</li>
                  <li>Posicionamiento flexbox estable</li>
                  <li>Carga más rápida</li>
                  <li>Menos bundle size</li>
                  <li>Estilo glass-card consistente</li>
                </ul>
              </div>
              <div className="flex gap-3 pt-2">
                <NativeButton variant="primary" onClick={() => setShowModal(false)}>
                  Perfecto
                </NativeButton>
                <NativeButton variant="ghost" onClick={() => setShowModal(false)}>
                  Cerrar
                </NativeButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProcedure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowProcedure(false)} />
          <div className="relative w-full max-w-[1000px] max-h-[90vh] glass-card rounded-xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/20 p-6">
              <h3 className="text-xl font-semibold text-white">Análisis con Componentes Nativos</h3>
              <button 
                onClick={() => setShowProcedure(false)} 
                className="text-slate-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-6">
                {/* Supuestos */}
                <section className="space-y-3">
                  <h4 className="font-semibold text-white">Supuestos (Best Case)</h4>
                  <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded-lg border border-white/10">
                    {sampleProcedureData.cases.best?.assumptions}
                  </p>
                </section>

                {/* Pasos en LaTeX */}
                <section className="space-y-3">
                  <h4 className="font-semibold text-white">Pasos del Procedimiento</h4>
                  <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-900/50 p-4">
                    <div className="min-w-[600px] space-y-2">
                      {sampleProcedureData.cases.best?.stepsLatex.map((step, i) => (
                        <NativeLatexBlock key={i} formula={step} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Scroll horizontal para ecuaciones largas, renderizado eficiente
                  </p>
                </section>

                {/* T(n) y forma cerrada */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-white/10 bg-slate-800/50">
                    <h4 className="font-semibold text-white mb-2">T(n) (LaTeX)</h4>
                    <NativeLatexBlock formula={sampleProcedureData.cases.best?.Tlatex || ""} />
                  </div>
                  <div className="p-4 rounded-lg border border-white/10 bg-slate-800/50">
                    <h4 className="font-semibold text-white mb-2">T(n) (forma cerrada)</h4>
                    <div className="p-3 rounded bg-slate-900/50 font-mono text-sm text-slate-100 border border-white/10">
                      {sampleProcedureData.cases.best?.Tclosed}
                    </div>
                  </div>
                </div>

                {/* Botón de comparación */}
                <div className="pt-4 border-t border-white/10">
                  <NativeButton 
                    variant="secondary" 
                    onClick={() => console.log("Funcionalidad nativa activada")}
                  >
                    Listo para producción
                  </NativeButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}