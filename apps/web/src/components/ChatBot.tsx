"use client";

import { RotateCcw, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import MarkdownRenderer from './MarkdownRenderer';

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

// ============== FUNCIONES API ==============

/**
 * Clasifica la intención del mensaje del usuario usando Grok-3-Mini
 */
async function classifyIntent(message: string): Promise<'parser_assist' | 'general'> {
  try {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job: 'classify',
        prompt: message
      })
    });

    if (!response.ok) {
      console.error('Error clasificando intención, usando general por defecto');
      return 'general';
    }

    const result = await response.json();
    // Backend ahora normaliza e incluye 'intent'
    const intentField = result?.intent as string | undefined;
    if (intentField === 'parser_assist' || intentField === 'general') {
      return intentField;
    }
    // Fallback: leer texto de Gemini
    const text = result?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const classification = String(text).trim().toLowerCase();
    return classification === 'parser_assist' ? 'parser_assist' : 'general';
  } catch (error) {
    console.error('Error en clasificación:', error);
    return 'general'; // Fallback a general si hay error
  }
}

/**
 * Obtiene respuesta del LLM con el job apropiado
 */
async function getLLMResponse(
  message: string, 
  job: 'parser_assist' | 'general',
  chatHistory: Message[]
): Promise<string> {
  try {
    // Convertir historial a formato para el LLM (últimos 10 mensajes)
    const historyForLLM = chatHistory
      .slice(-10)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: msg.content
      }));

    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job,
        prompt: message,
        chatHistory: historyForLLM
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // Extraer el contenido de la respuesta de Gemini
    const content = result?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!content || String(content).trim().length === 0) {
      throw new Error('Respuesta vacía del LLM');
    }
    return String(content);
  } catch (error) {
    console.error('Error obteniendo respuesta LLM:', error);
    throw error;
  }
}

export default function ChatBot({ isOpen, onClose, messages, setMessages }: Readonly<ChatBotProps>) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [llmStatus, setLlmStatus] = useState<{mode: 'LOCAL' | 'REMOTE', model?: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const animatedMessagesRef = useRef<Set<string>>(new Set());
  const processingRef = useRef(false); // Para evitar llamadas duplicadas

  // Obtener estado del LLM
  const fetchLlmStatus = async () => {
    try {
      const response = await fetch('/api/llm/status');
      if (response.ok) {
        const result = await response.json();
        setLlmStatus({ mode: result.status.mode, model: result.status.jobs.general });
      }
    } catch (error) {
      console.error('Error obteniendo estado LLM:', error);
    }
  };

  // Cargar estado del LLM al abrir el chat
  useEffect(() => {
    if (isOpen) {
      fetchLlmStatus();
    }
  }, [isOpen]);

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
    if (!messages || messages.length === 0 || isTyping || processingRef.current) return;
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

  const generateBotResponse = async () => {
    // Evitar llamadas duplicadas
    if (processingRef.current) return;
    
    processingRef.current = true;
    setIsTyping(true);
    
    // Hacer scroll inmediatamente para mostrar el indicador
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);

    try {
      // Obtener el último mensaje del usuario
      const lastUserMessage = [...messages]
        .reverse()
        .find(m => m.sender === 'user');

      if (!lastUserMessage) {
        setIsTyping(false);
        processingRef.current = false;
        return;
      }

      // Paso 1: Clasificar intención (rápido con Grok-3-Mini)
      const intent = await classifyIntent(lastUserMessage.content);
      
      // Paso 2: Obtener respuesta con el modelo apropiado (incluyendo historial)
      const responseText = await getLLMResponse(lastUserMessage.content, intent, messages);

      // Crear mensaje del bot
      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        content: responseText,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error generando respuesta:', error);
      
      // Mensaje de error amigable
      const errorResponse: Message = {
        id: `bot-error-${Date.now()}`,
        content: "Disculpa, tuve un problema al procesar tu mensaje. ¿Podrías intentarlo de nuevo?",
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      processingRef.current = false;
    }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      <div className="flex flex-col glass-modal-container rounded-2xl overflow-hidden" style={{ height: '70vh' }}>
        {/* Header */}
        <div className="glass-modal-header p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-purple-300 text-lg">smart_toy</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-xs">Jhon Jairo</h3>
                {llmStatus && (
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium flex-shrink-0 ${
                    llmStatus.mode === 'LOCAL' 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    <span className="w-1 h-1 rounded-full bg-current mr-1"></span>
                    {llmStatus.mode === 'LOCAL' ? 'Local' : 'Remoto'} • {llmStatus.model}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[10px] truncate">
                Asistente de análisis de algoritmos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
          {messages.map((message) => {
            const isNewMessage = !animatedMessagesRef.current.has(message.id);
            if (isNewMessage) {
              animatedMessagesRef.current.add(message.id);
            }
            
            return (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${
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
              <div className={`flex flex-col ${
                message.content.includes('**CÓDIGO ADJUNTO:**') ? 'max-w-[85%]' : 'max-w-[75%]'
              } ${
                message.sender === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`${
                  message.sender === 'bot' ? 'px-2 py-1.5' : 'px-2.5 py-1.5'
                } rounded-xl ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                    : 'glass-card border-white/10'
                } ${message.sender === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                  {message.sender === 'user' ? (
                    // Detectar si es un mensaje de ayuda con IA (contiene **CÓDIGO ADJUNTO:**)
                    (() => {
                      const isAIHelpMessage = message.content.includes('**CÓDIGO ADJUNTO:**');
                      
                      if (isAIHelpMessage) {
                        const codeRegex = /```pseudocode\n([\s\S]*?)\n```/;
                        const errorRegex = /```error\n([\s\S]*?)\n```/;
                        const codeMatch = codeRegex.exec(message.content);
                        const errorMatch = errorRegex.exec(message.content);
                        
                        return (
                          <div className="space-y-2.5 min-w-[250px]">
                            {/* Código Adjunto */}
                            <div className="space-y-1">
                              <div className="bg-slate-800/70 border border-slate-600/40 rounded-md p-2.5 overflow-x-auto max-h-[200px] overflow-y-auto">
                                <pre className="text-slate-200 text-[10px] font-mono whitespace-pre leading-relaxed">
                                  {codeMatch?.[1] || ''}
                                </pre>
                              </div>
                            </div>
                            
                            {/* Error Detectado */}
                            <div className="space-y-1">
                              <div className="bg-red-900/40 border border-red-500/40 rounded-md px-2.5 py-1.5">
                                <span className="text-red-200 text-[10px] font-medium">
                                  Error: {errorMatch?.[1] || ''}
                                </span>
                              </div>
                            </div>
                            
                            {/* Solicitud */}
                            <div className="pt-1">
                              <p className="text-white text-[11px] font-medium">
                                Ayúdame a solucionar este error
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <p className="text-white text-[11px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      );
                    })()
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 px-1">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
            );
          })}

          {/* Typing Indicator - Estilo WhatsApp */}
          {isTyping && (
            <div className="flex items-start gap-2 chat-message-slide-in">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-purple-300 text-xs">smart_toy</span>
              </div>
              <div className="glass-card border-white/10 px-2.5 py-1.5 rounded-xl rounded-bl-md min-w-[45px]">
                <div className="flex items-center justify-center space-x-1 h-3">
                  <div className="w-1 h-1 bg-slate-300 rounded-full typing-dots"></div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full typing-dots"></div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full typing-dots"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Container */}
        <div className="glass-modal-header p-2.5 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-white/5 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 hover:from-purple-500/30 hover:to-blue-500/30 hover:text-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}