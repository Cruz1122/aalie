"use client";

import type { Program } from "@aa/types";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import AIModeView from "@/components/AIModeView";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ManualModeView, { ManualModeViewHandle } from "@/components/ManualModeView";
import ModeToggle from "@/components/ModeToggle";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { getApiKey } from "@/hooks/useApiKey";
import { useChatHistory } from "@/hooks/useChatHistory";
import { heuristicKind } from "@/lib/algorithm-classifier";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isError?: boolean;
  retryMessageId?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { animateProgress } = useAnalysisProgress();
  const manualViewRef = useRef<ManualModeViewHandle>(null);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { messages, setMessages } = useChatHistory();
  const [chatLoaderVisible, setChatLoaderVisible] = useState(false);
  const [chatAnalysisProgress, setChatAnalysisProgress] = useState(0);
  const [chatAnalysisMessage, setChatAnalysisMessage] = useState("Iniciando análisis...");
  const [chatAlgorithmType, setChatAlgorithmType] = useState<"iterative" | "recursive" | "hybrid" | "unknown" | undefined>(undefined);
  const [chatAnalysisComplete, setChatAnalysisComplete] = useState(false);
  const [chatAnalysisError, setChatAnalysisError] = useState<string | null>(null);
  const [isChatAnalyzing, setIsChatAnalyzing] = useState(false);

  // Función para analizar código desde el chatbot
  const handleAnalyzeCodeFromChat = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || isChatAnalyzing) return;

    void runChatAnalysis(trimmed);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setIsAnimating(true);
    setTimeout(() => {
      setChatOpen(true);
      setIsAnimating(false);
      setMessages((prev: Message[]) => {
        const userMsg: Message = {
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
            } as Message,
            userMsg,
          ];
        }
        return [...prev, userMsg];
      });
      setInputMessage("");
    }, 300);
  };

  const sendMessageDirectly = (messageText: string) => {
    if (!messageText.trim()) return;
    setIsAnimating(true);
    setTimeout(() => {
      setChatOpen(true);
      setIsAnimating(false);
      setMessages((prev: Message[]) => {
        const userMsg: Message = {
          id: `user-${Date.now()}`,
          content: messageText,
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
            } as Message,
            userMsg,
          ];
        }
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
    // Enviar el mensaje directamente sin depender del estado inputMessage
    sendMessageDirectly(suggestion);
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

  const runChatAnalysis = useCallback(async (sourceCode: string) => {
    if (!sourceCode) return;

    setIsChatAnalyzing(true);
    setChatLoaderVisible(true);
    setChatAnalysisProgress(0);
    setChatAnalysisMessage("Iniciando análisis...");
    setChatAlgorithmType(undefined);
    setChatAnalysisComplete(false);
    setChatAnalysisError(null);

    try {
      setChatAnalysisMessage("Parseando código...");
      const parsePromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/grammar/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: sourceCode }),
      }).then(r => r.json());

      const parseRes = await animateProgress(0, 20, 800, setChatAnalysisProgress, parsePromise) as { ok: boolean; ast?: Program; errors?: Array<{ line: number; column: number; message: string }> };

      if (!parseRes.ok) {
        const msg = parseRes.errors?.map((e) => `Línea ${e.line}:${e.column} ${e.message}`).join("\n") || "Error de parseo";
        setChatAnalysisError(`Errores de sintaxis:\n${msg}`);
        setChatAnalysisMessage("No se pudo parsear el código");
        setIsChatAnalyzing(false);
        return;
      }

      setChatAnalysisMessage("Clasificando algoritmo...");
      let kind: "iterative" | "recursive" | "hybrid" | "unknown";
      try {
        // No verificar API_KEY del servidor (no hacer peticiones)
        // El backend usará automáticamente la API_KEY de variables de entorno si está disponible
        const apiKey = getApiKey();
        
        const body: { source: string; mode: string; apiKey?: string } = { source: sourceCode, mode: "auto" };
        if (apiKey) {
          body.apiKey = apiKey;
        }
        // Si no hay apiKey, el backend intentará usar la de variables de entorno
        
        const clsPromise = fetch("/api/llm/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const clsResponse = await animateProgress(20, 40, 1200, setChatAnalysisProgress, clsPromise) as Response;

        if (clsResponse.ok) {
          const cls = await clsResponse.json() as { kind: "iterative" | "recursive" | "hybrid" | "unknown"; method?: string };
          kind = cls.kind;
          setChatAlgorithmType(kind);
          setChatAnalysisMessage(`Algoritmo identificado: ${formatAlgorithmKind(kind)}`);
        } else {
          throw new Error(`HTTP ${clsResponse.status}`);
        }
      } catch (error) {
        console.warn("[ChatAnalysis] Error en clasificación, usando heurística", error);
        kind = heuristicKind(parseRes.ast ?? null);
        setChatAlgorithmType(kind);
        setChatAnalysisMessage(`Algoritmo identificado: ${formatAlgorithmKind(kind)}`);
      }

      if (kind === "recursive" || kind === "hybrid") {
        setChatAnalysisError(`El algoritmo ${formatUnsupportedKindMessage(kind)} no está soportado en esta versión. Por favor, usa un algoritmo iterativo.`);
        setChatAnalysisMessage("Análisis abortado");
        setIsChatAnalyzing(false);
        return;
      }

      setChatAnalysisMessage("Hallando sumatorias...");
      await animateProgress(40, 50, 200, setChatAnalysisProgress);

      // Verificar estado de API_KEY (se mantiene para otras funciones como ChatBot)
      const apiKey = getApiKey();
      
      // Mensaje de carga actualizado (ya no depende de API key para simplificación)
      setChatAnalysisMessage("Cerrando sumatorias...");
      
      const body: { source: string; mode: string; api_key?: string } = { source: sourceCode, mode: "worst" };
      if (apiKey) {
        body.api_key = apiKey;  // Mantener por compatibilidad, pero backend ya no lo usa para simplificación
      }
      
      const analyzePromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyze/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(r => r.json());

      const analyzeRes = await animateProgress(50, 70, 2000, setChatAnalysisProgress, analyzePromise) as { ok: boolean; [key: string]: unknown };

      setChatAnalysisMessage("Generando forma polinómica...");
      await animateProgress(70, 80, 200, setChatAnalysisProgress);

      if (!analyzeRes.ok) {
        const errorMsg = (analyzeRes as { errors?: Array<{ message: string; line?: number; column?: number }> }).errors?.map((e) => e.message || `Error en línea ${e.line ?? '?'}`).join("\n") || "No se pudo analizar el algoritmo";
        setChatAnalysisError(errorMsg);
        setChatAnalysisMessage("Análisis detenido");
        setIsChatAnalyzing(false);
        return;
      }

      setChatAnalysisMessage("Finalizando análisis...");
      await animateProgress(80, 100, 200, setChatAnalysisProgress);

      // Guardar código y resultados en sessionStorage (igual que ManualModeView)
      if (globalThis.window !== undefined) {
        sessionStorage.setItem('analyzerCode', sourceCode);
        sessionStorage.setItem('analyzerResults', JSON.stringify(analyzeRes));
      }

      setChatAnalysisMessage("Análisis completo");
      setChatAnalysisComplete(true);

      // Esperar 2 segundos antes de navegar (igual que ManualModeView)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navegar a /analyzer con los datos (el loader se ocultará automáticamente al desmontarse)
      router.push('/analyzer');
    } catch (error) {
      console.error("[ChatAnalysis] Error inesperado", error);
      const message = error instanceof Error ? error.message : "Error inesperado durante el análisis";
      setChatAnalysisError(message);
      setChatAnalysisMessage("Ocurrió un error");
      setIsChatAnalyzing(false);
    }
  }, [animateProgress, router]);

  const handleChatLoaderClose = () => {
    setChatLoaderVisible(false);
    setChatAnalysisError(null);
    setChatAnalysisProgress(0);
    setChatAnalysisMessage("Iniciando análisis...");
    setChatAlgorithmType(undefined);
    setChatAnalysisComplete(false);
    setIsChatAnalyzing(false);
  };

  const formatAlgorithmKind = (value: "iterative" | "recursive" | "hybrid" | "unknown"): string => {
    switch (value) {
      case "iterative":
        return "Iterativo";
      case "recursive":
        return "Recursivo";
      case "hybrid":
        return "Híbrido";
      default:
        return "Desconocido";
    }
  };

  const formatUnsupportedKindMessage = (value: "iterative" | "recursive" | "hybrid" | "unknown"): string => {
    switch (value) {
      case "recursive":
        return "recursivo";
      case "hybrid":
        return "híbrido";
      default:
        return value;
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1 p-4 z-10">
        <ModeToggle mode={mode} isSwitching={isSwitching} onModeSwitch={handleModeSwitch} />

        <div className="max-w-7xl mx-auto">
          <div className={`transition-all duration-300 ${
            isSwitching ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}>
            {mode === 'ai' ? (
              <AIModeView
                chatOpen={chatOpen}
                isAnimating={isAnimating}
                inputMessage={inputMessage}
                messages={messages}
                setMessages={setMessages}
                onInputChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onSendMessage={handleSendMessage}
                onSuggestionClick={handleSuggestionClick}
                onClose={closeChatAndReset}
                onAnalyzeCode={handleAnalyzeCodeFromChat}
              />
            ) : (
              <ManualModeView
                ref={manualViewRef}
                messages={messages}
                setMessages={setMessages}
                onOpenChat={() => setChatOpen(true)}
                onSwitchToAIMode={() => setMode('ai')}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />

      {chatLoaderVisible && (
        <AnalysisLoader
          progress={chatAnalysisProgress}
          message={chatAnalysisMessage}
          algorithmType={chatAlgorithmType}
          isComplete={chatAnalysisComplete}
          error={chatAnalysisError}
          onClose={chatAnalysisError ? handleChatLoaderClose : undefined}
        />
      )}
    </div>
  );
}