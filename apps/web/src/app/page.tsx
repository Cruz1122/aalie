"use client";

import { useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NavigationLink from "@/components/NavigationLink";

export default function HomePage() {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 z-10">
        {/* Título Principal Centrado */}
        <div className="text-center mb-8">          
          {/* Toggle entre modos */}
            <div className="inline-flex items-center bg-slate-800/60 border border-slate-600/50 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode('ai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'ai'
                  ? 'bg-purple-500/20 text-white border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-base">smart_toy</span>
              Asistente IA
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'manual'
                  ? 'bg-blue-500/20 text-white border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-base">code</span>
              Editor Manual
            </button>
          </div>
        </div>

        {/* Contenedor Principal */}
        <div className="max-w-7xl mx-auto">
          {mode === 'ai' ? (
            /* Modo IA - Pantalla completa centrada */
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              
              {/* Icono del robot */}
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-300 text-2xl">smart_toy</span>
                </div>
              </div>

              {/* Título principal */}
              <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-8">
                ¿En qué puedo ayudarte?
              </h2>

              {/* Input principal */}
              <div className="w-full max-w-2xl mb-8">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Describe el algoritmo que necesitas..."
                    className="w-full bg-white/5 border border-slate-600/50 rounded-xl px-4 py-4 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    disabled
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50" disabled>
                    <span className="material-symbols-outlined text-slate-400 text-lg">send</span>
                  </button>
                </div>
              </div>

              {/* Sugerencias como chips simples */}
              <div className="flex flex-wrap gap-1 justify-center max-w-xl w-full mb-8">
                <button className="flex items-center gap-2 py-2 px-3 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75" disabled>
                  <span className="material-symbols-outlined text-blue-400 text-sm">sort</span>
                  <span className="text-xs text-slate-200">Ordenamiento</span>
                </button>

                <button className="flex items-center gap-2 py-2 px-3 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75" disabled>
                  <span className="material-symbols-outlined text-green-400 text-sm">search</span>
                  <span className="text-xs text-slate-200">Búsqueda binaria</span>
                </button>

                <button className="flex items-center gap-2 py-2 px-3 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75" disabled>
                  <span className="material-symbols-outlined text-orange-400 text-sm">account_tree</span>
                  <span className="text-xs text-slate-200">Recorrido de árbol</span>
                </button>

                <button className="flex items-center gap-2 py-2 px-3 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75" disabled>
                  <span className="material-symbols-outlined text-purple-400 text-sm">functions</span>
                  <span className="text-xs text-slate-200">Fibonacci</span>
                </button>
              </div>

              {/* Nota sobre funcionalidad */}
              <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                <span className="material-symbols-outlined text-sm">construction</span>
                <span>Próximamente disponible</span>
              </div>
            </div>
          ) : (
            /* Modo Manual - Layout centrado */
            <div className="max-w-xl mx-auto">
              <div className="flex flex-col items-center">

                {/* Mock del Editor de Código */}
                <div className="w-full mb-6">
                  <div className="bg-slate-900/80 rounded-xl border border-slate-600/50 overflow-hidden flex flex-col">
                    {/* Header del editor mock */}
                    <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-600/50 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                      </div>
                      <span className="text-sm text-slate-400 ml-2">Escribe tu algoritmo directamente</span>
                    </div>
                    
                    {/* Contenido del editor mock */}
                    <div className="flex-1 p-4 font-mono text-sm">
                      <div className="flex">
                        <div className="text-slate-500 select-none mr-4 text-right" style={{ minWidth: '2rem' }}>
                          <div>1</div>
                          <div>2</div>
                          <div>3</div>
                          <div>4</div>
                          <div>5</div>
                          <div>6</div>
                          <div>7</div>
                        </div>
                        <div className="flex-1">
                          <div><span className="text-purple-400">def</span> <span className="text-blue-300">bubble_sort</span><span className="text-slate-300">(</span><span className="text-orange-300">arr</span><span className="text-slate-300">):</span></div>
                          <div className="ml-4"><span className="text-purple-400">for</span> <span className="text-orange-300">i</span> <span className="text-purple-400">in</span> <span className="text-blue-300">range</span><span className="text-slate-300">(</span><span className="text-blue-300">len</span><span className="text-slate-300">(</span><span className="text-orange-300">arr</span><span className="text-slate-300">)):</span></div>
                          <div className="ml-8"><span className="text-purple-400">for</span> <span className="text-orange-300">j</span> <span className="text-purple-400">in</span> <span className="text-blue-300">range</span><span className="text-slate-300">(</span><span className="text-red-300">0</span><span className="text-slate-300">, </span><span className="text-blue-300">len</span><span className="text-slate-300">(</span><span className="text-orange-300">arr</span><span className="text-slate-300">) - </span><span className="text-orange-300">i</span><span className="text-slate-300"> - </span><span className="text-red-300">1</span><span className="text-slate-300">):</span></div>
                          <div className="ml-12"><span className="text-purple-400">if</span> <span className="text-orange-300">arr</span><span className="text-slate-300">[</span><span className="text-orange-300">j</span><span className="text-slate-300">] &gt; </span><span className="text-orange-300">arr</span><span className="text-slate-300">[</span><span className="text-orange-300">j</span> <span className="text-slate-300">+ </span><span className="text-red-300">1</span><span className="text-slate-300">]:</span></div>
                          <div className="ml-16"><span className="text-orange-300">arr</span><span className="text-slate-300">[</span><span className="text-orange-300">j</span><span className="text-slate-300">], </span><span className="text-orange-300">arr</span><span className="text-slate-300">[</span><span className="text-orange-300">j</span> <span className="text-slate-300">+ </span><span className="text-red-300">1</span><span className="text-slate-300">] = </span><span className="text-orange-300">arr</span><span className="text-slate-300">[</span><span className="text-orange-300">j</span> <span className="text-slate-300">+ </span><span className="text-red-300">1</span><span className="text-slate-300">], </span><span className="text-orange-300">arr</span><span className="text-slate-300">[</span><span className="text-orange-300">j</span><span className="text-slate-300">]</span></div>
                          <div className="ml-4"><span className="text-purple-400">return</span> <span className="text-orange-300">arr</span></div>
                          <div className="text-slate-600 animate-pulse">|</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón Analizar */}
                <NavigationLink 
                  href="/analyzer"
                  className="glass-button flex items-center justify-center gap-3 py-3 px-8 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <span className="material-symbols-outlined text-lg">analytics</span>
                  Analizar Código
                </NavigationLink>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
