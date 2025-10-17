import ChatBot from "./ChatBot";
import NavigationLink from "./NavigationLink";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ManualModeViewProps {
  readonly chatOpen: boolean;
  readonly messages: Message[];
  readonly setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  readonly onClose: () => void;
}

export default function ManualModeView({ chatOpen, messages, setMessages, onClose }: ManualModeViewProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex flex-col items-center">
        {/* Mantener ChatBot montado pero oculto para preservar estado/timers */}
        {chatOpen && (
          <div className="hidden">
            <ChatBot 
              isOpen={true}
              onClose={onClose}
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
        </div>
        
        {/* Mock del Editor de Código */}
        <CodeEditorMock />

        {/* Botón Analizar */}
        <NavigationLink 
          href="/analyzer"
          className="glass-button flex items-center justify-center gap-3 py-3 px-8 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          <span className="material-symbols-outlined text-lg">analytics</span>
          {" "}Analizar Código
        </NavigationLink>
      </div>
    </div>
  );
}

function CodeEditorMock() {
  return (
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
              <div><span className="text-purple-400">def</span>{" "}<span className="text-blue-300">bubble_sort</span><span className="text-slate-300">(</span><span className="text-orange-300">arr</span><span className="text-slate-300">):</span></div>
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
  );
}

