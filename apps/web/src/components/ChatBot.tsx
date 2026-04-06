"use client";

import { Key, RotateCcw, Send, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { getApiKey, setApiKey, validateApiKey } from "@/hooks/useApiKey";
import {
  type AssistantAvailabilityState,
  useAssistantAvailability,
} from "@/hooks/useAssistantAvailability";
import type { AssistantContext, ChatMessage } from "@/lib/assistant/types";
import {
  createBotMessage,
  getLLMResponse,
  inferIntentFromMessage,
  isGeminiLikeError,
} from "@/lib/chatbot-core";
import { translateLlmError } from "@/lib/llm-error-translator";

import AALIEIcon from "./AALIEIcon";
import { GlobalLoader } from "./GlobalLoader";
import MarkdownRenderer from "./MarkdownRenderer";

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onAnalyzeCode?: (code: string) => void;
  assistantContext?: AssistantContext | null;
  variant?: "home" | "embedded";
  welcomeMessage: string;
  closeTitle?: string;
  availabilityOverride?: AssistantAvailabilityState;
}

export default function ChatBot({
  isOpen,
  onClose,
  messages,
  setMessages,
  onAnalyzeCode,
  assistantContext = null,
  variant = "home",
  welcomeMessage,
  closeTitle,
  availabilityOverride,
}: Readonly<ChatBotProps>) {
  const locale = useLocale();
  const t = useTranslations("chat");
  const tMessages = useTranslations("analyzer.messages");
  const tCommon = useTranslations("common");
  const tFooter = useTranslations("footer.apiKey");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const animatedMessagesRef = useRef<Set<string>>(new Set());
  const processingRef = useRef(false);
  const hookAvailability = useAssistantAvailability(
    availabilityOverride == null && isOpen,
  );
  const availability = availabilityOverride ?? hookAvailability;
  const isCheckingAvailability = availability.isChecking && !availability.hasAny;
  const showApiKeyCard = !isCheckingAvailability && !availability.hasAny;
  const closeButtonTitle = closeTitle || t("backToHome");

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

  const generateBotResponse = useCallback(
    async (retryMessageId?: string) => {
      if (processingRef.current || showApiKeyCard) {
        return;
      }

      const currentApiKey = getApiKey();
      processingRef.current = true;
      setIsTyping(true);

      setTimeout(() => {
        scrollToBottom(true);
      }, 50);

      try {
        const lastUserMessage = retryMessageId
          ? messages.find(
              (message) =>
                message.id === retryMessageId && message.sender === "user",
            )
          : [...messages].reverse().find((message) => message.sender === "user");

        if (!lastUserMessage) {
          setIsTyping(false);
          processingRef.current = false;
          return;
        }

        const intent = inferIntentFromMessage(lastUserMessage.content);
        const responseText = await getLLMResponse(
          lastUserMessage.content,
          intent,
          messages,
          currentApiKey,
          locale,
          tMessages,
          assistantContext,
        );

        setMessages((previous) => [...previous, createBotMessage(responseText)]);
      } catch (error) {
        console.error("Error generando respuesta:", error);

        const lastUserMessage = retryMessageId
          ? messages.find(
              (message) =>
                message.id === retryMessageId && message.sender === "user",
            )
          : [...messages].reverse().find((message) => message.sender === "user");

        const rawMessage = error instanceof Error ? error.message : String(error);
        const translatedError = tMessages(translateLlmError(rawMessage));
        const errorResponse: ChatMessage = {
          id: `bot-error-${Date.now()}`,
          content: isGeminiLikeError(error) ? translatedError : t("errorGeneric"),
          sender: "bot",
          timestamp: new Date(),
          isError: true,
          retryMessageId: lastUserMessage?.id,
        };

        setMessages((previous) => [...previous, errorResponse]);
      } finally {
        setIsTyping(false);
        processingRef.current = false;
      }
    },
    [
      assistantContext,
      locale,
      messages,
      setMessages,
      showApiKeyCard,
      t,
      tMessages,
    ],
  );

  useEffect(() => {
    if (
      !messages ||
      messages.length === 0 ||
      isTyping ||
      processingRef.current ||
      !isOpen ||
      showApiKeyCard ||
      isCheckingAvailability
    ) {
      return;
    }

    const lastUserIdx = [...messages].map((message) => message.sender).lastIndexOf("user");
    if (lastUserIdx === -1) {
      return;
    }

    const hasBotAfter = messages
      .slice(lastUserIdx + 1)
      .some((message) => message.sender === "bot");

    if (!hasBotAfter) {
      const timeoutId = setTimeout(() => {
        void generateBotResponse();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [
    generateBotResponse,
    isCheckingAvailability,
    isOpen,
    isTyping,
    messages,
    showApiKeyCard,
  ]);

  useEffect(() => {
    if (isTyping) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
  }, [isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current && !showApiKeyCard && !isCheckingAvailability) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isCheckingAvailability, isOpen, showApiKeyCard]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || showApiKeyCard || isCheckingAvailability) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((previous) => [...previous, userMessage]);
    setInputValue("");
  };

  const handleSaveApiKey = () => {
    if (validateApiKey(apiKeyInput)) {
      const success = setApiKey(apiKeyInput);
      if (success) {
        setApiKeyInput("");
        setMessages([createBotMessage(welcomeMessage)]);
      }
    }
  };

  const clearConversation = () => {
    setInputValue("");
    setIsTyping(false);
    animatedMessagesRef.current.clear();
    setMessages([createBotMessage(welcomeMessage)]);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!isOpen) {
    return null;
  }

  const outerClassName =
    variant === "embedded"
      ? "flex h-full w-full flex-col"
      : "w-full max-w-2xl mx-auto px-2 sm:px-0 flex flex-col items-center justify-center flex-1 min-h-0";
  const panelClassName =
    variant === "embedded"
      ? "flex flex-1 min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#182431]/95 shadow-none [transform:translateZ(0)] [backface-visibility:hidden] isolate"
      : "flex flex-col glass-modal-container rounded-2xl overflow-hidden min-h-[50vh] sm:min-h-[60vh] h-[50vh] sm:h-[70vh]";
  const headerClassName =
    variant === "embedded"
      ? "flex items-center justify-between border-b border-white/10 bg-[#101a23]/95 p-2.5 [transform:translateZ(0)] [backface-visibility:hidden]"
      : "glass-modal-header p-2.5 flex items-center justify-between";
  const footerClassName =
    variant === "embedded"
      ? "border-t border-white/10 bg-[#101a23]/95 p-2.5 [transform:translateZ(0)] [backface-visibility:hidden]"
      : "glass-modal-header p-2.5 border-t border-white/10";
  const botBubbleClassName =
    variant === "embedded"
      ? "border border-white/10 bg-[rgba(24,36,49,0.88)]"
      : "glass-card border-white/10";
  const errorBubbleClassName =
    variant === "embedded"
      ? "border border-red-500/20 bg-[rgba(69,18,28,0.72)]"
      : "glass-card border-red-500/20";
  const typingBubbleClassName =
    variant === "embedded"
      ? "border border-white/10 bg-[rgba(24,36,49,0.88)]"
      : "glass-card border-white/10";

  return (
    <div className={outerClassName}>
      <div className={panelClassName}>
        <div className={headerClassName}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
              <AALIEIcon className="text-purple-300" size={26} />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-white font-semibold text-xs">AALIE</h3>
              <p className="text-slate-400 text-[10px] truncate">
                {t("assistantTitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={clearConversation}
              className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white flex items-center justify-center"
              title={t("clearConversation")}
              disabled={isTyping}
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white flex items-center justify-center"
              title={closeButtonTitle}
            >
              <span className="material-symbols-outlined text-lg leading-none">
                {variant === "embedded" ? "close" : "arrow_back"}
              </span>
            </button>
          </div>
        </div>

        {isCheckingAvailability ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 bg-slate-900/30">
            <GlobalLoader
              variant="pulse"
              size="md"
              message={tFooter("checking")}
            />
          </div>
        ) : showApiKeyCard ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900/30">
            <div className="flex flex-col items-center max-w-md w-full space-y-6">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Key className="w-8 h-8 text-yellow-400" strokeWidth={2} />
              </div>
              <h4 className="text-white font-semibold text-lg text-center">
                {t("unavailable")}
              </h4>
              <p className="text-slate-300 text-sm text-center leading-relaxed">
                {t("apiKeyRequired")}{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  {tFooter("googleAIStudio")}
                </a>
                .
              </p>
              <div className="flex items-center gap-2 w-full max-w-[70%]">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(event) => setApiKeyInput(event.target.value)}
                  placeholder={tFooter("placeholder")}
                  className={`flex-1 px-3 py-2 rounded-lg bg-white/5 border ${
                    apiKeyInput && !validateApiKey(apiKeyInput)
                      ? "border-red-500/50 focus:border-red-500"
                      : apiKeyInput && validateApiKey(apiKeyInput)
                        ? "border-green-500/50 focus:border-green-500"
                        : "border-slate-600/50 focus:border-slate-500"
                  } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 ${
                    apiKeyInput && !validateApiKey(apiKeyInput)
                      ? "focus:ring-red-500/50"
                      : apiKeyInput && validateApiKey(apiKeyInput)
                        ? "focus:ring-green-500/50"
                        : "focus:ring-slate-500/50"
                  } transition-all`}
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={!validateApiKey(apiKeyInput)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    validateApiKey(apiKeyInput)
                      ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                      : "bg-slate-500/20 text-slate-500 border border-slate-500/30 cursor-not-allowed"
                  }`}
                >
                  {tCommon("save")}
                </button>
              </div>
              {apiKeyInput && !validateApiKey(apiKeyInput) && (
                <p className="text-red-400 text-xs">{tFooter("invalid")}</p>
              )}
            </div>
          </div>
        ) : (
          <>
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
                      message.sender === "user" ? "flex-row-reverse" : "flex-row"
                    } ${isNewMessage ? "chat-message-slide-in" : ""}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === "user"
                          ? "bg-gradient-to-br from-blue-500/30 to-cyan-500/30"
                          : "bg-gradient-to-br from-purple-500/30 to-blue-500/30"
                      }`}
                    >
                      {message.sender === "user" ? (
                        <User size={14} className="text-blue-300" />
                      ) : (
                        <AALIEIcon className="text-purple-300" size={22} />
                      )}
                    </div>

                    <div
                      className={`flex flex-col min-w-0 overflow-hidden ${
                        message.content.includes("**CÓDIGO ADJUNTO:**")
                          ? "max-w-[min(85%,420px)]"
                          : "max-w-[min(75%,420px)]"
                      } ${message.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`min-w-0 max-w-full overflow-hidden ${
                          message.sender === "bot" ? "px-2 py-1.5" : "px-2.5 py-1.5"
                        } rounded-xl ${
                          message.sender === "user"
                            ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                            : message.isError
                              ? errorBubbleClassName
                              : botBubbleClassName
                        } ${message.sender === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
                      >
                        {message.sender === "user" ? (
                          (() => {
                            const isAIHelpMessage = message.content.includes(
                              "**CÓDIGO ADJUNTO:**",
                            );

                            if (isAIHelpMessage) {
                              const codeRegex = /```pseudocode\n([\s\S]*?)\n```/;
                              const errorRegex = /```error\n([\s\S]*?)\n```/;
                              const codeMatch = codeRegex.exec(message.content);
                              const errorMatch = errorRegex.exec(message.content);

                              return (
                                <div className="space-y-2.5 min-w-0 max-w-[min(100%,420px)]">
                                  <div className="space-y-1 min-w-0">
                                    <div className="bg-slate-800/70 border border-slate-600/40 rounded-md p-2.5 max-h-[200px] overflow-y-auto max-w-full min-w-0 overflow-hidden">
                                      <pre className="text-slate-200 text-[10px] font-mono whitespace-pre-wrap break-words leading-relaxed">
                                        {codeMatch?.[1] || ""}
                                      </pre>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="bg-red-900/40 border border-red-500/40 rounded-md px-2.5 py-1.5">
                                      <span className="text-red-200 text-[10px] font-medium">
                                        Error: {errorMatch?.[1] || ""}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="pt-1">
                                    <p className="text-white text-[11px] font-medium">
                                      {t("helpRequest")}
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <p className="text-white text-[11px] leading-relaxed whitespace-pre-wrap break-words min-w-0 max-w-full">
                                {message.content}
                              </p>
                            );
                          })()
                        ) : message.isError ? (
                          <div className="space-y-1.5">
                            <p className="text-red-300 text-[11px] leading-relaxed break-words min-w-0 max-w-full">
                              {message.content}
                            </p>
                            {message.retryMessageId && (
                              <div className="flex justify-center">
                                <button
                                  onClick={() => {
                                    setMessages((previous) =>
                                      previous.filter((entry) => entry.id !== message.id),
                                    );
                                    setTimeout(() => {
                                      void generateBotResponse(message.retryMessageId);
                                    }, 100);
                                  }}
                                  disabled={isTyping}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-[10px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="material-symbols-outlined text-xs">
                                    refresh
                                  </span>
                                  {t("retry")}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <MarkdownRenderer
                            content={message.content}
                            onAnalyzeCode={onAnalyzeCode}
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 px-1">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-start gap-2 chat-message-slide-in">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <AALIEIcon className="text-purple-300" size={22} />
                  </div>
                  <div
                    className={`${typingBubbleClassName} px-2.5 py-1.5 rounded-xl rounded-bl-md min-w-[45px]`}
                  >
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

            <div className={footerClassName}>
              <div className="flex items-center gap-2 min-w-0 rounded-lg border border-slate-600/50 bg-white/5 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-transparent transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("placeholder")}
                  disabled={isTyping}
                  className="flex-1 min-w-0 bg-transparent pl-2.5 pr-2 py-2 text-white placeholder-slate-400 text-xs focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <Send size={18} className="shrink-0" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
