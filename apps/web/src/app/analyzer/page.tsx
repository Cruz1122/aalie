"use client";

import { useState } from "react";

import CodePane from "@/components/CodePane";
import CostsTable from "@/components/CostsTable";
import Footer from "@/components/Footer";
import Formula from "@/components/Formula";
import Header from "@/components/Header";
import ProcedureModal from "@/components/ProcedureModal";

export default function AnalyzerPage() {
  const [open, setOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // Mock de código y costos (luego vendrá de /parse y /analyze)
  const code = [
    "function sum(n) {",
    "  let s = 0;",
    "  for (i = 1; i <= n; i = i + 1) {",
    "    s = s + i;",
    "  }",
    "  return s;",
    "}",
  ].join("\n");

  const rows = [
    { no: 1, code: "function sum(n) {", ck: "—", execs: "—", cost: "—" },
    { no: 2, code: "let s = 0;", ck: "C1", execs: "1", cost: "C1 × 1" },
    { no: 3, code: "for (i = 1; i <= n; i++) {", ck: "C2", execs: "n+1", cost: "C2 × (n+1)" },
    { no: 4, code: "s = s + i;", ck: "C3", execs: "n", cost: "C3 × n" },
    { no: 6, code: "return s;", ck: "C4", execs: "1", cost: "C4 × 1" },
  ];

  const fx1 = String.raw`\sum_{i=1}^{n} i = \frac{n(n+1)}{2}`;
  const fx2 = String.raw`T(n) = C_2 (n+1) + C_3 \sum_{i=1}^{n} 1 + C_4 \cdot 1 + C_1 \cdot 1`;
  const fx3 = String.raw`T(n) = (C_2 + C_3) n + (C_2 + C_1 + C_4)`;

  const handleViewLineProcedure = (lineNo: number) => {
    setSelectedLine(lineNo);
    setOpen(true);
  };

  const handleViewGeneralProcedure = () => {
    setSelectedLine(null);
    setOpen(true);
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />
      
      <main className="flex-1 p-6 z-10">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Analizador de Complejidad</h1>
            <p className="text-slate-300 text-sm">
              Análisis detallado de la complejidad algorítmica con visualización de costos y ecuaciones matemáticas
            </p>
          </div>

          {/* Main 3-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-10 gap-6 lg:items-start">
            {/* Columna izquierda: código */}
            <section className="lg:col-span-4 xl:col-span-3 h-full">
              <div className="glass-card p-4 rounded-lg h-full flex flex-col">
                <h2 className="text-white font-semibold mb-3 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-blue-400">code</span>{" "}
                  Código Fuente
                </h2>
                <div className="flex-1">
                  <CodePane code={code} />
                </div>
              </div>
            </section>

            {/* Columna centro: tabla costos */}
            <section className="lg:col-span-4 xl:col-span-4 h-full">
              <div className="glass-card p-4 rounded-lg h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold flex items-center">
                    <span className="material-symbols-outlined mr-2 text-amber-400">table_chart</span>{" "}
                    Costos por Línea
                  </h2>
                </div>
                <div className="flex-1 flex flex-col">
                  <CostsTable rows={rows} onViewProcedure={handleViewLineProcedure} />
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={handleViewGeneralProcedure}
                      className="w-full glass-secondary rounded-md text-white text-sm px-4 py-2 hover:bg-sky-500/20 transition-colors flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined mr-2 text-sm">analytics</span>{" "}
                      Ver Análisis Completo
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Columna derecha: ecuaciones (KaTeX) */}
            <section className="lg:col-span-4 xl:col-span-3 h-full">
              <div className="glass-card p-4 rounded-lg h-full flex flex-col">
                <h2 className="text-white font-semibold mb-3 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-green-400">functions</span>{" "}
                  Ecuaciones Matemáticas
                </h2>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-300">Fórmula base:</h3>
                    <div className="overflow-x-auto rounded-md border border-white/10 bg-slate-900/50 p-3">
                      <Formula latex={fx1} display />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-300">Función de costo T(n):</h3>
                    <div className="overflow-x-auto rounded-md border border-white/10 bg-slate-900/50 p-3">
                      <div className="min-w-fit">
                        <Formula latex={fx2} display />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-300">Forma simplificada:</h3>
                    <div className="overflow-x-auto rounded-md border border-white/10 bg-slate-900/50 p-3">
                      <Formula latex={fx3} display />
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <p className="text-xs text-slate-400 p-2 bg-slate-800/30 rounded border border-white/10">
                      💡 <strong>Tip:</strong> Las fórmulas largas incluyen scroll horizontal automático.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Additional info section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-400">trending_up</span>
              </div>
              <h3 className="font-semibold text-green-300 mb-1">Best Case</h3>
              <p className="text-xs text-slate-400">Escenario óptimo de ejecución</p>
            </div>
            
            <div className="glass-card p-4 rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-400">analytics</span>
              </div>
              <h3 className="font-semibold text-yellow-300 mb-1">Average Case</h3>
              <p className="text-xs text-slate-400">Comportamiento promedio esperado</p>
            </div>
            
            <div className="glass-card p-4 rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400">trending_down</span>
              </div>
              <h3 className="font-semibold text-red-300 mb-1">Worst Case</h3>
              <p className="text-xs text-slate-400">Escenario más desfavorable</p>
            </div>
          </div>
        </div>
      </main>

      <ProcedureModal 
        open={open} 
        onClose={() => setOpen(false)} 
        selectedLine={selectedLine} 
      />
      <Footer />
    </div>
  );
}