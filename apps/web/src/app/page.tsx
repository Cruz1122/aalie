"use client";

import { useState } from "react";

import AIModeView from "@/components/AIModeView";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ManualModeView from "@/components/ManualModeView";
import ModeToggle from "@/components/ModeToggle";
import { useChatHistory } from "@/hooks/useChatHistory";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function HomePage() {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { messages, setMessages } = useChatHistory();

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
              />
            ) : (
              <ManualModeView
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
    </div>
  );
}