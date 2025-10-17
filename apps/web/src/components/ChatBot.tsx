"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

// Respuestas mockeadas para prueba
const MOCK_RESPONSES = [
  "¡Excelente! Veo que quieres analizar un algoritmo. Para empezar, necesito que me proporciones el código del algoritmo que deseas analizar. ¿Podrías pegarlo o escribirlo?",
  
  "Entiendo que necesitas ayuda con análisis de complejidad. Te puedo ayudar a determinar la complejidad temporal y espacial de tu código. ¿Qué algoritmo específico te interesa?",
  
  "Para hacer un análisis completo, necesito más detalles. ¿El algoritmo es de ordenamiento, búsqueda, o algún otro tipo? Esto me ayudará a darte mejor orientación.",
  
  "Perfecto. Una vez que tengas el código listo, podremos analizarlo línea por línea y calcular su complejidad usando el método de conteo de operaciones. ¿Tienes alguna duda específica sobre el algoritmo?",
  
  "¡Genial! Recuerda que puedo ayudarte con diferentes tipos de análisis: mejor caso, caso promedio y peor caso. También puedo explicarte cada paso del análisis matemático.",
  
  "Interesante. Para el análisis de complejidad, primero identificamos las operaciones básicas, luego contamos cuántas veces se ejecutan en función del tamaño de entrada n. ¿Ya tienes el código que quieres analizar?",
  
  "Te ayudo con eso. El análisis de algoritmos incluye complejidad temporal O(n), complejidad espacial, y casos de uso. ¿Qué aspecto específico te interesa más?",
  
  "¡Buena pregunta! Para algoritmos recursivos, usamos ecuaciones de recurrencia y el teorema maestro. Para algoritmos iterativos, contamos directamente los ciclos. ¿Cuál es tu caso?",
  
  "Me parece que necesitas un análisis detallado. Puedo explicarte paso a paso: identificación de operaciones, conteo de ejecuciones, formulación matemática y simplificación a notación Big-O.",
  
  "Claro, te puedo ayudar. El análisis incluye: supuestos del problema, identificación de la línea más costosa, cálculo de T(n), y determinación de la complejidad asintótica. ¿Por dónde empezamos?"
];

export default function ChatBot({ isOpen, onClose, messages, setMessages }: Readonly<ChatBotProps>) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const animatedMessagesRef = useRef<Set<string>>(new Set());

  // Auto-scroll al final cuando hay nuevos mensajes
  const scrollToBottom = (immediate = false) => {
    const delay = immediate ? 50 : 100;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }, delay);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Responder automáticamente si el último mensaje del historial es del usuario
  useEffect(() => {
    if (!messages || messages.length === 0 || isTyping) return;
    const lastUserIdx = [...messages].map((m) => m.sender).lastIndexOf('user');
    if (lastUserIdx === -1) return;
    // Verificar si después de ese mensaje hay una respuesta del bot
    const hasBotAfter = messages.slice(lastUserIdx + 1).some((m) => m.sender === 'bot');
    if (!hasBotAfter) {
      generateBotResponse();
    }
  }, [messages]);

  // Scroll automático cuando aparece el indicador de escritura
  useEffect(() => {
    if (isTyping) {
      // Scroll más rápido cuando aparece el indicador
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
  }, [isTyping]);

  // Scroll automático cuando se abra el chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  // Focus en el input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // El historial y bienvenida se maneja en HomePage

  const generateBotResponse = () => {
    setIsTyping(true);
    
    // Hacer scroll inmediatamente para mostrar el indicador
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);
    
    // Simular tiempo de "escritura" más realista
    const typingTime = 800 + Math.random() * 400; // Entre 0.8 y 1.2 segundos
    
    setTimeout(() => {
      const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      
      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        content: randomResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, typingTime);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

  setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // La respuesta del bot se gestiona en el useEffect que observa 'messages'
  };

  const clearConversation = () => {
    setInputValue("");
    setIsTyping(false);
    animatedMessagesRef.current.clear();
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      content: "¡Hola! Soy Jhon Jairo, tu asistente para análisis de algoritmos. ¿En qué puedo ayudarte hoy?",
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col glass-modal-container rounded-2xl overflow-hidden" style={{ height: '55vh' }}>
        {/* Header */}
        <div className="glass-modal-header p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-300 text-lg">smart_toy</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Jhon Jairo</h3>
              <p className="text-slate-400 text-sm">
                Asistente de análisis de algoritmos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearConversation}
              className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white flex items-center justify-center"
              title="Limpiar conversación"
              disabled={isTyping}
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white flex items-center justify-center"
              title="Volver al inicio"
            >
              <span className="material-symbols-outlined text-lg leading-none">arrow_back</span>
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
          {messages.map((message) => {
            const isNewMessage = !animatedMessagesRef.current.has(message.id);
            if (isNewMessage) {
              animatedMessagesRef.current.add(message.id);
            }
            
            return (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              } ${isNewMessage ? 'chat-message-slide-in' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' 
                  ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30' 
                  : 'bg-gradient-to-br from-purple-500/30 to-blue-500/30'
              }`}>
                {message.sender === 'user' ? (
                  <User size={14} className="text-blue-300" />
                ) : (
                  <span className="material-symbols-outlined text-purple-300 text-xs">smart_toy</span>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col max-w-[75%] ${
                message.sender === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`px-3 py-2 rounded-xl ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                    : 'glass-card border-white/10'
                } ${message.sender === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                  <p className="text-white text-xs leading-relaxed">{message.content}</p>
                </div>
                <span className="text-xs text-slate-500 mt-1 px-1">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
            );
          })}

          {/* Typing Indicator - Estilo WhatsApp */}
          {isTyping && (
            <div className="flex items-start gap-3 chat-message-slide-in">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-purple-300 text-xs">smart_toy</span>
              </div>
              <div className="glass-card border-white/10 px-3 py-2 rounded-xl rounded-bl-md min-w-[50px]">
                <div className="flex items-center justify-center space-x-1 h-4">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full typing-dots"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full typing-dots"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full typing-dots"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Container */}
        <div className="glass-modal-header p-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-white/5 border border-slate-600/50 rounded-lg px-3 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-blue-500/30 hover:text-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}