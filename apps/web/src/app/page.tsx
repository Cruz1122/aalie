"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NavigationLink from "@/components/NavigationLink";
import ChatBot from "@/components/ChatBot";


export default function HomePage() {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [messages, setMessages] = useState([]);

  // Restaurar historial desde sessionStorage al montar
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("aa_chat_messages");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      }
    } catch (_) {
      // noop
    }
  }, []);

  // Guardar historial en sessionStorage en cada cambio
  useEffect(() => {
    try {
      const serializable = messages.map((m: any) => ({ ...m, timestamp: (m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp) }));
      sessionStorage.setItem("aa_chat_messages", JSON.stringify(serializable));
    } catch (_) {
      // noop
    }
  }, [messages]);

  // Inicializar el chat solo la primera vez
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setIsAnimating(true);
    setTimeout(() => {
      setChatOpen(true);
      setIsAnimating(false);
      setMessages((prev: any[]) => {
        const userMsg = {
          id: `user-${Date.now()}`,
          content: inputMessage,
          sender: 'user',
          timestamp: new Date(),
        };
        if (prev.length === 0) {
          return [
            {
              id: 'welcome',
              content: "¡Hola! Soy Jhon Jairo, tu asistente para análisis de algoritmos. ¿En qué puedo ayudarte hoy?",
              sender: 'bot',
              timestamp: new Date(),
            },
            userMsg,
          ];
        }
        // Si ya hay historial, añade el nuevo mensaje del usuario
        return [...prev, userMsg];
      });
      setInputMessage("");
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const closeChatAndReset = () => {
    setChatOpen(false);
    setInputMessage("");
  };

  const handleModeSwitch = (newMode: 'ai' | 'manual') => {
    if (newMode === mode) return;
    setIsSwitching(true);
    setTimeout(() => {
      setMode(newMode);
      setIsSwitching(false);
    }, 300);
  };

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
              onClick={() => handleModeSwitch('ai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'ai'
                  ? 'bg-purple-500/20 text-white border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              disabled={isSwitching}
            >
              <span className="material-symbols-outlined text-base">smart_toy</span>
              Jhon Jairo
            </button>
            <button
              onClick={() => handleModeSwitch('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'manual'
                  ? 'bg-blue-500/20 text-white border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              disabled={isSwitching}
            >
              <span className="material-symbols-outlined text-base">terminal</span>
              Modo Manual
            </button>
          </div>
        </div>

        {/* Contenedor Principal */}
        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-300 ${
            isSwitching ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}>
            {mode === 'ai' ? (
              <div className="w-full">
              {!chatOpen ? (
                /* Interfaz inicial del LLM */
                <div className={`flex flex-col items-center justify-center min-h-[300px] text-center transition-all duration-500 ${
                  isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}>
                  
                  {/* Icono del robot */}
                  <div className={`mb-6 transition-all duration-300 ${isAnimating ? 'scale-0' : 'scale-100'}`}>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-300 text-2xl">smart_toy</span>
                    </div>
                  </div>

                  {/* Título principal */}
                  <h4 className={`text-lg lg:text-xl font-semibold text-purple-400 transition-all duration-300 ${
                    isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                  }`}>
                    Hola, soy Jhon Jairo.
                  </h4>
                  <h2 className={`text-2xl lg:text-3xl font-semibold text-white mb-8 transition-all duration-300 delay-75 ${
                    isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                  }`}>
                    ¿En qué puedo ayudarte?
                  </h2>

                  {/* Input principal */}
                  <div className={`w-full max-w-2xl mb-8 transition-all duration-300 delay-150 ${
                    isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                  }`}>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Describe el algoritmo que necesitas..."
                        className="w-full bg-white/5 border border-slate-600/50 rounded-xl px-4 py-4 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                        value={inputMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        disabled={isAnimating}
                      />
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50" 
                        onClick={handleSendMessage}
                        disabled={isAnimating || !inputMessage.trim()}
                      >
                        <span className="material-symbols-outlined text-slate-400 text-lg">send</span>
                      </button>
                    </div>
                  </div>

                  {/* Sugerencias como chips simples */}
                  <div className={`flex flex-wrap gap-1 justify-center max-w-xl w-full mb-8 transition-all duration-300 delay-200 ${
                    isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                  }`}>
                    <button 
                      className="flex items-center gap-2 py-2 px-3 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75" 
                      onClick={() => handleSuggestionClick("Analiza la complejidad de un algoritmo de ordenamiento burbuja")}
                      disabled={isAnimating}
                    >
                      <span className="material-symbols-outlined text-blue-400 text-sm">sort</span>
                      <span className="text-xs text-slate-200">Ordenamiento</span>
                    </button>

                    <button 
                      className="flex items-center gap-2 py-2 px-3 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75" 
                      onClick={() => handleSuggestionClick("Necesito ayuda con la búsqueda binaria y su análisis")}
                      disabled={isAnimating}
                    >
                      <span className="material-symbols-outlined text-green-400 text-sm">search</span>
                      <span className="text-xs text-slate-200">Búsqueda binaria</span>
                    </button>

                    <button 
                      className="flex items-center gap-2 py-2 px-3 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75" 
                      onClick={() => handleSuggestionClick("Quiero analizar un algoritmo de recorrido de árbol")}
                      disabled={isAnimating}
                    >
                      <span className="material-symbols-outlined text-orange-400 text-sm">account_tree</span>
                      <span className="text-xs text-slate-200">Recorrido de árbol</span>
                    </button>

                    <button 
                      className="flex items-center gap-2 py-2 px-3 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75" 
                      onClick={() => handleSuggestionClick("Ayúdame con la secuencia de Fibonacci y su complejidad")}
                      disabled={isAnimating}
                    >
                      <span className="material-symbols-outlined text-purple-400 text-sm">functions</span>
                      <span className="text-xs text-slate-200">Fibonacci</span>
                    </button>
                  </div>

                  {/* Nota sobre funcionalidad - ahora funcional */}
                    <div className={`inline-flex items-center gap-2 text-xs text-yellow-500 transition-all duration-300 delay-250 ${
                    isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                    }`}>
                    <span className="material-symbols-outlined text-sm">handyman</span>
                    <span>Asistente en desarrollo</span>
                    </div>
                </div>
              ) : (
                /* Chat Interface - Inline */
                <div className="w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                  <ChatBot 
                    isOpen={chatOpen} 
                    onClose={closeChatAndReset}
                    messages={messages}
                    setMessages={setMessages}
                  />
                </div>
              )}
            </div>
            ) : (
              /* Modo Manual - Layout centrado */
              <div className="max-w-xl mx-auto">
                <div className="flex flex-col items-center">
                  {/* Mantener ChatBot montado pero oculto para preservar estado/timers */}
                  {chatOpen && (
                    <div className="hidden">
                      <ChatBot 
                        isOpen={true}
                        onClose={closeChatAndReset}
                        messages={messages}
                        setMessages={setMessages}
                      />
                    </div>
                  )}
                  
                  {/* Título para modo manual */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold text-white mb-2">
                      Editor de Código
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Escribe tu algoritmo y analizaremos su complejidad
                    </p>
                  </div>                {/* Mock del Editor de Código */}
                <div className="w-full mb-6">
                  <div className="bg-slate-900/80 rounded-xl border border-slate-600/50 overflow-hidden flex flex-col">
                    {/* Header del editor mock */}
                    <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-600/50 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                      </div>
                      <span className="text-sm text-slate-400 ml-2">Escribe tu código directamente</span>
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
        </div>
      </main>

      <Footer />
    </div>
  );
}