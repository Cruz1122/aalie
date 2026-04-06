"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import AIModeView from "@/components/AIModeView";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ManualModeView, {
  ManualModeViewHandle,
} from "@/components/ManualModeView";
import ModeToggle from "@/components/ModeToggle";
import { useAnalysisProgressContext } from "@/contexts/AnalysisProgressContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import type { AssistantContext } from "@/lib/assistant/types";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  isError?: boolean;
  retryMessageId?: string;
}

export default function HomePage() {
  const locale = useLocale();
  const tHome = useTranslations("home");
  const tManual = useTranslations("analyzer.manualMode");
  const tNav = useTranslations("nav");
  const tView = useTranslations("analyzer.view");
  const manualViewRef = useRef<ManualModeViewHandle>(null);
  const { runAnalysis } = useRunAnalysis();
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const defaultCode = tManual("defaultCode");
  const [sharedCode, setSharedCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("manualModeCode");
      const savedLocale = localStorage.getItem("manualModeLocale");
      if (saved && savedLocale === locale) return saved;
    }
    return "";
  });
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("manualModeCode");
    const savedLocale = localStorage.getItem("manualModeLocale");
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (saved && savedLocale === locale) {
        setSharedCode(saved);
      } else {
        setSharedCode(defaultCode);
      }
    } else if (savedLocale !== locale) {
      setSharedCode(saved && savedLocale === locale ? saved : defaultCode);
    }
  }, [locale, defaultCode]);
  useEffect(() => {
    if (typeof window !== "undefined" && sharedCode !== "") {
      localStorage.setItem("manualModeCode", sharedCode);
      localStorage.setItem("manualModeLocale", locale);
    }
  }, [sharedCode, locale]);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { messages, setMessages } = useChatHistory();
  const { state: analysisState } = useAnalysisProgressContext();
  const isChatAnalyzing =
    analysisState.visible && analysisState.mode === "analysis";
  const assistantContext = useMemo<AssistantContext>(() => {
    const isSpanish = locale === "es";
    const text = (es: string, en: string) => (isSpanish ? es : en);

    return {
      surface: "home",
      locale,
      pageContext: {
        route: "/",
        view: mode,
        title: tNav("home"),
        description: text(
          "Pantalla inicial para empezar con el chat o ir al analizador manual.",
          "Landing screen to start with chat or switch to the manual analyzer.",
        ),
        notes: [
          `currentMode=${mode}`,
          "entrypoints=analyzer,examples,user-guide",
        ],
      },
      availableFeatures: [
        {
          id: "formal-analyzer",
          title: tNav("analyzer"),
          location: "/analyzer",
          description: text(
            "Analisis formal de complejidad con AST, casos, recurrencias y cotas asintoticas.",
            "Formal complexity analysis with AST, cases, recurrences, and asymptotic bounds.",
          ),
          availability: text("Disponible desde el menu principal", "Available from the main navigation"),
        },
        {
          id: "examples-catalog",
          title: tNav("examples"),
          location: "/examples",
          description: text(
            "Catalogo con cuatro secciones de algoritmos y su pseudocodigo listo para analizar.",
            "Catalog with four algorithm sections and ready-to-analyze pseudocode.",
          ),
          availability: text("Disponible desde el menu principal", "Available from the main navigation"),
        },
        {
          id: "user-guide",
          title: tNav("howToUse"),
          location: "/user-guide",
          description: text(
            "Guia para aprender la app, sus vistas y sus funcionalidades.",
            "Guide to learn the app, its views, and its features.",
          ),
          availability: text("Disponible desde el menu principal", "Available from the main navigation"),
        },
        {
          id: "import-txt",
          title: tView("importTxt"),
          location: "/analyzer",
          description: text(
            "Importa pseudocodigo desde un .txt al editor del analizador.",
            "Import pseudocode from a .txt file into the analyzer editor.",
          ),
          availability: text("En la tarjeta de codigo fuente del analizador", "In the analyzer source-code card"),
        },
        {
          id: "export-report",
          title: tView("exportReport"),
          location: "/analyzer",
          description: text(
            "Descarga el reporte del analisis en PDF o Markdown despues de analizar.",
            "Download the analysis report as PDF or Markdown after running an analysis.",
          ),
          availability: text("Se habilita despues de analizar", "Enabled after analysis"),
        },
        {
          id: "llm-comparison",
          title: tView("compareWithLLM"),
          location: "/analyzer",
          description: text(
            "Compara el resultado formal con un contraste complementario del LLM cuando tienes poco tiempo para validar.",
            "Compare the formal result with a complementary LLM cross-check when you are short on time to validate.",
          ),
          availability: text("Requiere API key y analisis completo", "Requires API key and completed analysis"),
        },
        {
          id: "trace-and-invariant",
          title: text("Seguimiento, loop invariant y GPU/CPU", "Trace, loop invariant, and GPU/CPU"),
          location: "/analyzer",
          description: text(
            "Tras el analisis puedes abrir seguimiento de ejecucion, loop invariant y evaluacion GPU/CPU.",
            "After analysis you can open execution tracing, loop invariant, and GPU/CPU evaluation.",
          ),
          availability: text("Se habilitan segun AST y resultados disponibles", "Enabled depending on available AST and results"),
        },
        {
          id: "ai-repair",
          title: tView("repairWithAI"),
          location: "/analyzer",
          description: text(
            "Repara pseudocodigo con errores de gramatica usando IA.",
            "Repair pseudocode with grammar issues using AI.",
          ),
          availability: text("Requiere API key", "Requires API key"),
        },
      ],
    };
  }, [locale, mode, tNav, tView]);

  const handleAnalyzeCodeFromChat = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || isChatAnalyzing) return;

    void runAnalysis(trimmed);
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
          sender: "user",
          timestamp: new Date(),
        };
        if (prev.length === 0) {
          return [
            {
              id: "welcome",
              content: tHome("welcome"),
              sender: "bot",
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
          sender: "user",
          timestamp: new Date(),
        };
        if (prev.length === 0) {
          return [
            {
              id: "welcome",
              content: tHome("welcome"),
              sender: "bot",
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
    if (e.key === "Enter") {
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

  const handleModeSwitch = (newMode: "ai" | "manual") => {
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

      <main className="flex-1 flex flex-col justify-center p-3 sm:p-4 z-10 min-h-0">
        <ModeToggle
          mode={mode}
          isSwitching={isSwitching}
          onModeSwitch={handleModeSwitch}
        />

        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
          <div
            className={`transition-all duration-300 ${
              isSwitching
                ? "opacity-0 translate-y-2"
                : "opacity-100 translate-y-0"
            }`}
          >
            {mode === "ai" ? (
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
                assistantContext={assistantContext}
              />
            ) : (
              <ManualModeView
                ref={manualViewRef}
                messages={messages}
                setMessages={setMessages}
                onOpenChat={() => setChatOpen(true)}
                onSwitchToAIMode={() => setMode("ai")}
                initialCode={sharedCode}
                onCodeChange={setSharedCode}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
