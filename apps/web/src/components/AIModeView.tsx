import ChatBot from "./ChatBot";

/**
 * Interfaz para mensajes del chat.
 */
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
  retryMessageId?: string;
}

/**
 * Propiedades del componente AIModeView.
 */
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
  readonly onAnalyzeCode?: (code: string) => void;
}

/**
 * Componente principal para el modo de asistente con IA.
 * Muestra la interfaz del chatbot cuando está abierto, o una pantalla de bienvenida
 * con input y sugerencias cuando el chat está cerrado.
 * 
 * @param props - Propiedades del componente
 * @returns Componente React con la vista del modo IA
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * 
 * @example
 * ```tsx
 * <AIModeView
 *   chatOpen={isChatOpen}
 *   isAnimating={isAnimating}
 *   inputMessage={inputMessage}
 *   messages={messages}
 *   setMessages={setMessages}
 *   onInputChange={handleInputChange}
 *   onKeyPress={handleKeyPress}
 *   onSendMessage={handleSendMessage}
 *   onSuggestionClick={handleSuggestionClick}
 *   onClose={handleCloseChat}
 *   onAnalyzeCode={handleAnalyzeCode}
 * />
 * ```
 */
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
  onAnalyzeCode,
}: AIModeViewProps) {
  if (chatOpen) {
    return (
      <div className="w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <ChatBot 
          isOpen={chatOpen} 
          onClose={onClose}
          messages={messages}
          setMessages={setMessages}
          onAnalyzeCode={onAnalyzeCode}
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
      <div className={`flex flex-wrap gap-2 justify-center max-w-2xl w-full mb-8 ${fadeClass('delay-200')}`}>
        <SuggestionButton
          icon="science"
          iconColor="blue-400"
          text="¿Qué es la notación asintótica?"
          onClick={onSuggestionClick}
          disabled={isAnimating}
        />
        <SuggestionButton
          icon="account_tree"
          iconColor="green-400"
          text="¿Cómo funciona bubble sort?"
          onClick={onSuggestionClick}
          disabled={isAnimating}
        />
        <SuggestionButton
          icon="code"
          iconColor="purple-400"
          text="Dame el código de mergesort"
          onClick={onSuggestionClick}
          disabled={isAnimating}
        />
      </div>
    </div>
  );
}

/**
 * Propiedades del botón de sugerencia.
 */
interface SuggestionButtonProps {
  readonly icon: string;
  readonly iconColor: string;
  readonly text: string;
  readonly onClick: (text: string) => void;
  readonly disabled: boolean;
}

/**
 * Componente de botón de sugerencia para el modo IA.
 * @param props - Propiedades del botón de sugerencia
 * @returns Elemento React del botón de sugerencia
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
function SuggestionButton({ icon, iconColor, text, onClick, disabled }: SuggestionButtonProps) {
  return (
    <button 
      className="flex items-center gap-2 py-2.5 px-4 rounded-lg border border-slate-600/30 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-75 max-w-sm" 
      onClick={() => onClick(text)}
      disabled={disabled}
    >
      <span className={`material-symbols-outlined text-${iconColor} text-base flex-shrink-0`}>{icon}</span>
      <span className="text-sm text-slate-200">{text}</span>
    </button>
  );
}

