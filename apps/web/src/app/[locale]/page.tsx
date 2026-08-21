"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import AIModeView from "@/components/AIModeView";
import AALIEIcon from "@/components/AALIEIcon";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ManualModeView from "@/components/ManualModeView";
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
  const tNav = useTranslations("nav");
  const tView = useTranslations("analyzer.view");
  const { runAnalysis } = useRunAnalysis();
  const [chatOpen, setChatOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [homeIntroDone, setHomeIntroDone] = useState(false);
  const [isManualTransitioning, setIsManualTransitioning] = useState(false);
  const [manualTransitionTarget, setManualTransitionTarget] = useState<
    "manual" | "ai" | null
  >(null);
  const handleEntranceComplete = useCallback(() => {
    setHomeIntroDone(true);
  }, []);
  const [inputMessage, setInputMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
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
        view: "ai",
        title: tNav("home"),
        description: text(
          "Pantalla inicial para empezar con el chat o ir al analizador manual.",
          "Landing screen to start with chat or switch to the manual analyzer.",
        ),
        notes: ["currentMode=ai", "entrypoints=analyzer,examples,user-guide"],
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
          availability: text(
            "Disponible desde el menu principal",
            "Available from the main navigation",
          ),
        },
        {
          id: "examples-catalog",
          title: tNav("examples"),
          location: "/examples",
          description: text(
            "Catalogo con cuatro secciones de algoritmos y su pseudocodigo listo para analizar.",
            "Catalog with four algorithm sections and ready-to-analyze pseudocode.",
          ),
          availability: text(
            "Disponible desde el menu principal",
            "Available from the main navigation",
          ),
        },
        {
          id: "user-guide",
          title: tNav("howToUse"),
          location: "/user-guide",
          description: text(
            "Guia para aprender la app, sus vistas y sus funcionalidades.",
            "Guide to learn the app, its views, and its features.",
          ),
          availability: text(
            "Disponible desde el menu principal",
            "Available from the main navigation",
          ),
        },
        {
          id: "import-txt",
          title: tView("importTxt"),
          location: "/analyzer",
          description: text(
            "Importa pseudocodigo desde un .txt al editor del analizador.",
            "Import pseudocode from a .txt file into the analyzer editor.",
          ),
          availability: text(
            "En la tarjeta de codigo fuente del analizador",
            "In the analyzer source-code card",
          ),
        },
        {
          id: "export-report",
          title: tView("exportReport"),
          location: "/analyzer",
          description: text(
            "Descarga el reporte del analisis en PDF o Markdown despues de analizar.",
            "Download the analysis report as PDF or Markdown after running an analysis.",
          ),
          availability: text(
            "Se habilita despues de analizar",
            "Enabled after analysis",
          ),
        },
        {
          id: "llm-comparison",
          title: tView("compareWithLLM"),
          location: "/analyzer",
          description: text(
            "Compara el resultado formal con un contraste complementario del LLM cuando tienes poco tiempo para validar.",
            "Compare the formal result with a complementary LLM cross-check when you are short on time to validate.",
          ),
          availability: text(
            "Requiere API key y analisis completo",
            "Requires API key and completed analysis",
          ),
        },
        {
          id: "trace-and-invariant",
          title: text(
            "Seguimiento, loop invariant y GPU/CPU",
            "Trace, loop invariant, and GPU/CPU",
          ),
          location: "/analyzer",
          description: text(
            "Tras el analisis puedes abrir seguimiento de ejecucion, loop invariant y evaluacion GPU/CPU.",
            "After analysis you can open execution tracing, loop invariant, and GPU/CPU evaluation.",
          ),
          availability: text(
            "Se habilitan segun AST y resultados disponibles",
            "Enabled depending on available AST and results",
          ),
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
  }, [locale, tNav, tView]);

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

  const transitionToManual = (open: boolean) => {
    setManualTransitionTarget(open ? "manual" : "ai");
    setIsManualTransitioning(true);
    window.setTimeout(() => setManualOpen(open), 500);
    window.setTimeout(() => {
      setIsManualTransitioning(false);
      setManualTransitionTarget(null);
    }, 1400);
  };

  return (
    <div className="relative flex w-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="z-10 flex flex-1 flex-col p-3 sm:p-4">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            {manualOpen ? (
              <ManualModeView
                messages={messages}
                setMessages={setMessages}
                onOpenChat={() => {
                  setManualOpen(false);
                  setChatOpen(true);
                }}
                onSwitchToAIMode={() => transitionToManual(false)}
              />
            ) : (
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
                onOpenManual={() => transitionToManual(true)}
                animateEntrance={!homeIntroDone}
                onEntranceComplete={handleEntranceComplete}
                onAnalyzeCode={handleAnalyzeCodeFromChat}
                assistantContext={assistantContext}
              />
            )}
          </div>
        </div>
      </main>

      {manualOpen && (
        <button
          type="button"
          onClick={() => transitionToManual(false)}
          className="fixed right-4 top-16 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-purple-300/40 bg-gradient-to-br from-purple-500/25 to-violet-400/20 text-purple-100 transition-all duration-300 hover:scale-110 hover:border-purple-200/70 hover:bg-purple-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 sm:right-6 sm:top-20"
          aria-label={locale === "es" ? "Volver a AALIE" : "Back to AALIE"}
        >
          <span className="material-symbols-outlined text-[22px] leading-none">
            arrow_back
          </span>
        </button>
      )}

      {isManualTransitioning && manualTransitionTarget && (
        <div className="mode-wipe" aria-hidden>
          <div className="mode-wipe-content">
            {manualTransitionTarget === "manual" ? (
              <span
                className="material-symbols-outlined leading-none text-blue-300"
                style={{ fontSize: "clamp(8rem, 21vw, 15rem)" }}
              >
                terminal
              </span>
            ) : (
              <AALIEIcon
                className="h-[clamp(8rem,21vw,15rem)] w-[clamp(8rem,21vw,15rem)] text-purple-300"
                size={240}
              />
            )}
            <span className="mode-wipe-label">
              {tHome(
                manualTransitionTarget === "manual"
                  ? "modeTransition.manual"
                  : "modeTransition.ai",
              )}
            </span>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
