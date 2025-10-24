import ChatBot from "./ChatBot";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface AIModeViewProps {
  readonly chatOpen: boolean;
  readonly isAnimating: boolean;
  readonly inputMessage: string;
  readonly messages: Message[];
  readonly setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  readonly onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly onSendMessage: () => void;
  readonly onSuggestionClick: (suggestion: string) => void;
  readonly onClose: () => void;
}

export default function AIModeView({
  chatOpen,
  isAnimating,
  inputMessage,
  messages,
  setMessages,
  onInputChange,
  onKeyPress,
  onSendMessage,
  onSuggestionClick,
  onClose,
}: AIModeViewProps) {
  if (chatOpen) {
    return (
      <div className="w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <ChatBot 
          isOpen={chatOpen} 
          onClose={onClose}
          messages={messages}
          setMessages={setMessages}
        />
      </div>
    );
  }

  const animClass = isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100';
  const fadeClass = (delay = '') => 
    `transition-all duration-300 ${delay} ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`;

  return (
    <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center transition-all duration-500 ${animClass}`}>
      {/* Icono del robot */}
      <div className={`mb-6 transition-all duration-300 ${isAnimating ? 'scale-0' : 'scale-100'}`}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-purple-300 text-3xl">smart_toy</span>
        </div>
      </div>

      {/* Título principal */}
      <h4 className={`text-lg lg:text-xl font-semibold text-purple-400 ${fadeClass()}`}>
        Hola, soy Jhon Jairo.
      </h4>
      <h2 className={`text-2xl lg:text-3xl font-semibold text-white mb-8 ${fadeClass('delay-75')}`}>
        ¿En qué puedo ayudarte?
      </h2>

      {/* Input principal */}
      <div className={`w-full max-w-2xl mb-8 ${fadeClass('delay-150')}`}>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Describe el algoritmo que necesitas..."
            className="w-full bg-white/5 border border-slate-600/50 rounded-xl px-4 py-4 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
            value={inputMessage}
            onChange={onInputChange}
            onKeyDown={onKeyPress}
            disabled={isAnimating}
          />
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50" 
            onClick={onSendMessage}
            disabled={isAnimating || !inputMessage.trim()}
          >
            <span className="material-symbols-outlined text-slate-400 text-lg">send</span>
          </button>
        </div>
      </div>

      {/* Sugerencias como chips simples */}
      <div className={`flex flex-wrap gap-1 justify-center max-w-xl w-full mb-8 ${fadeClass('delay-200')}`}>
        <SuggestionButton
          icon="sort"
          iconColor="blue-400"
          label="Ordenamiento"
          text="Analiza la complejidad de un algoritmo de ordenamiento burbuja"
          onClick={onSuggestionClick}
          disabled={isAnimating}
        />
        <SuggestionButton
          icon="search"
          iconColor="green-400"
          label="Búsqueda binaria"
          text="Necesito ayuda con la búsqueda binaria y su análisis"
          onClick={onSuggestionClick}
          disabled={isAnimating}
        />
        <SuggestionButton
          icon="account_tree"
          iconColor="orange-400"
          label="Recorrido de árbol"
          text="Quiero analizar un algoritmo de recorrido de árbol"
          onClick={onSuggestionClick}
          disabled={isAnimating}
        />
        <SuggestionButton
          icon="functions"
          iconColor="purple-400"
          label="Fibonacci"
          text="Ayúdame con la secuencia de Fibonacci y su complejidad"
          onClick={onSuggestionClick}
          disabled={isAnimating}
        />
      </div>

      {/* Nota sobre funcionalidad */}
      <div className={`inline-flex items-center gap-2 text-xs text-yellow-500 ${fadeClass('delay-250')}`}>
        <span className="material-symbols-outlined text-sm">handyman</span>
        <span>Asistente en desarrollo</span>
      </div>
    </div>
  );
}

interface SuggestionButtonProps {
  readonly icon: string;
  readonly iconColor: string;
  readonly label: string;
  readonly text: string;
  readonly onClick: (text: string) => void;
  readonly disabled: boolean;
}

function SuggestionButton({ icon, iconColor, label, text, onClick, disabled }: SuggestionButtonProps) {
  return (
    <button 
      className="flex items-center gap-2 py-2 px-3 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75" 
      onClick={() => onClick(text)}
      disabled={disabled}
    >
      <span className={`material-symbols-outlined text-${iconColor} text-sm`}>{icon}</span>
      <span className="text-xs text-slate-200">{label}</span>
    </button>
  );
}

