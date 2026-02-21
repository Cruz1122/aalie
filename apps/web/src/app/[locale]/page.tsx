"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import AIModeView from "@/components/AIModeView";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ManualModeView, {
  ManualModeViewHandle,
} from "@/components/ManualModeView";
import ModeToggle from "@/components/ModeToggle";
import { useAnalysisProgressContext } from "@/contexts/AnalysisProgressContext";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import { useChatHistory } from "@/hooks/useChatHistory";

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
