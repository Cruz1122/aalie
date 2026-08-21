import { Key, Save, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useAssistantAvailability } from "@/hooks/useAssistantAvailability";
import { setApiKey, validateApiKey } from "@/hooks/useApiKey";
import type { AssistantContext } from "@/lib/assistant/types";

import AALIEEmotionIcon from "./AALIEEmotionIcon";
import AALIEIcon from "./AALIEIcon";
import ChatBot from "./ChatBot";

const suggestionBank = [
  { key: "notation", icon: "functions", iconClass: "text-cyan-300" },
  { key: "countOperations", icon: "calculate", iconClass: "text-blue-300" },
  { key: "bigO", icon: "trending_up", iconClass: "text-violet-300" },
  { key: "loops", icon: "repeat", iconClass: "text-emerald-300" },
  { key: "nestedLoops", icon: "account_tree", iconClass: "text-green-300" },
  { key: "recursion", icon: "hub", iconClass: "text-fuchsia-300" },
  { key: "recurrence", icon: "schema", iconClass: "text-purple-300" },
  { key: "masterTheorem", icon: "auto_graph", iconClass: "text-indigo-300" },
  { key: "divideAndConquer", icon: "call_split", iconClass: "text-sky-300" },
  { key: "binarySearch", icon: "search", iconClass: "text-teal-300" },
  { key: "bubbleSort", icon: "swap_vert", iconClass: "text-amber-300" },
  { key: "mergesort", icon: "merge_type", iconClass: "text-orange-300" },
  { key: "dynamicProgramming", icon: "grid_view", iconClass: "text-pink-300" },
  { key: "greedy", icon: "bolt", iconClass: "text-yellow-300" },
  { key: "backtracking", icon: "undo", iconClass: "text-rose-300" },
  { key: "invariant", icon: "verified", iconClass: "text-lime-300" },
  { key: "bestWorstCase", icon: "balance", iconClass: "text-slate-300" },
  { key: "spaceComplexity", icon: "memory", iconClass: "text-cyan-200" },
  { key: "traceAlgorithm", icon: "route", iconClass: "text-blue-200" },
  {
    key: "compareAlgorithms",
    icon: "compare_arrows",
    iconClass: "text-violet-200",
  },
] as const;

/**
 * Interfaz para mensajes del chat.
 */
interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
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
  readonly onOpenManual: () => void;
  readonly animateEntrance?: boolean;
  readonly onEntranceComplete?: () => void;
  readonly onAnalyzeCode?: (code: string) => void;
  readonly assistantContext?: AssistantContext | null;
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
  onOpenManual,
  animateEntrance = true,
  onEntranceComplete,
  onAnalyzeCode,
  assistantContext = null,
}: AIModeViewProps) {
  const t = useTranslations("home");
  const { hasAny: hasApiKey, isChecking: isCheckingApiKey } =
    useAssistantAvailability(!chatOpen);
  const viewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const suggestionCountRef = useRef(0);
  const suggestionStartTopRef = useRef<number | null>(null);
  const [entranceStage, setEntranceStage] = useState(animateEntrance ? 0 : 4);
  const [logoOffset, setLogoOffset] = useState(0);
  const [logoReady, setLogoReady] = useState(!animateEntrance);
  const [suggestionSelection, setSuggestionSelection] = useState([0, 1, 2]);
  const [suggestionsStarted, setSuggestionsStarted] = useState(false);
  const [visibleSuggestionCount, setVisibleSuggestionCount] = useState(0);
  const [contentShift, setContentShift] = useState(0);
  const [manualPromptVisible, setManualPromptVisible] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyPromptVisible, setApiKeyPromptVisible] = useState(false);
  const manualPromptVisibleRef = useRef(false);

  const apiKeyUnavailable =
    apiKeyPromptVisible && !isCheckingApiKey && !hasApiKey;

  const handleSaveApiKey = () => {
    if (!validateApiKey(apiKeyInput)) return;
    if (setApiKey(apiKeyInput)) {
      setApiKeyInput("");
    }
  };

  const handleMessageSubmit = () => {
    if (!isCheckingApiKey && !hasApiKey) {
      setApiKeyPromptVisible(true);
      return;
    }

    onSendMessage();
  };

  const handleMessageKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && !isCheckingApiKey && !hasApiKey) {
      event.preventDefault();
      setApiKeyPromptVisible(true);
      return;
    }

    onKeyPress(event);
  };

  const handleSuggestionSubmit = (suggestion: string) => {
    if (!isCheckingApiKey && !hasApiKey) {
      setApiKeyPromptVisible(true);
      return;
    }

    onSuggestionClick(suggestion);
  };

  useEffect(() => {
    if (chatOpen) return;

    if (!animateEntrance) {
      setEntranceStage(4);
      setLogoReady(true);
      return;
    }

    const logo = logoRef.current;
    if (logo) {
      const rect = logo.getBoundingClientRect();
      setLogoOffset(window.innerHeight / 2 - (rect.top + rect.height / 2));
      setLogoReady(true);
    }

    const frame = window.requestAnimationFrame(() => setEntranceStage(1));
    const greetingTimer = window.setTimeout(() => setEntranceStage(2), 1600);
    const questionTimer = window.setTimeout(() => setEntranceStage(3), 2050);
    const inputTimer = window.setTimeout(() => {
      setEntranceStage(4);
      onEntranceComplete?.();
    }, 2500);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(greetingTimer);
      window.clearTimeout(questionTimer);
      window.clearTimeout(inputTimer);
    };
  }, [animateEntrance, chatOpen, onEntranceComplete]);

  useEffect(() => {
    if (chatOpen || entranceStage < 4 || manualPromptVisibleRef.current) {
      return;
    }

    let idleTimer: number | undefined;

    const schedulePrompt = () => {
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        manualPromptVisibleRef.current = true;
        setManualPromptVisible(true);
      }, 5000);
    };

    schedulePrompt();
    window.addEventListener("pointerdown", schedulePrompt);
    window.addEventListener("keydown", schedulePrompt);
    window.addEventListener("touchstart", schedulePrompt);

    return () => {
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      window.removeEventListener("pointerdown", schedulePrompt);
      window.removeEventListener("keydown", schedulePrompt);
      window.removeEventListener("touchstart", schedulePrompt);
    };
  }, [chatOpen, entranceStage]);

  useLayoutEffect(() => {
    if (!suggestionsStarted || suggestionStartTopRef.current === null) {
      return;
    }

    const content = contentRef.current;
    if (!content) return;

    const newTop = content.getBoundingClientRect().top;
    const shift = suggestionStartTopRef.current - newTop;
    suggestionStartTopRef.current = null;
    setContentShift(shift);

    const frame = window.requestAnimationFrame(() => {
      setContentShift(0);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [suggestionsStarted]);

  useEffect(() => {
    if (chatOpen || entranceStage < 4 || suggestionCountRef.current > 0) {
      return;
    }

    let revealInterval: number | undefined;
    let idleTimer: number | undefined;
    let revealDelayTimer: number | undefined;

    const clearTimers = () => {
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      if (revealDelayTimer !== undefined) window.clearTimeout(revealDelayTimer);
      if (revealInterval !== undefined) window.clearInterval(revealInterval);
    };

    const revealSuggestions = () => {
      suggestionCountRef.current += 1;
      setVisibleSuggestionCount(suggestionCountRef.current);
      if (suggestionCountRef.current >= 3 && revealInterval !== undefined) {
        window.clearInterval(revealInterval);
      }
    };

    const scheduleReveal = () => {
      if (suggestionCountRef.current > 0) return;
      if (idleTimer !== undefined) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        const randomSelection = [...suggestionBank.keys()]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        setSuggestionSelection(randomSelection);
        const content = contentRef.current;
        suggestionStartTopRef.current = content
          ? content.getBoundingClientRect().top
          : null;
        setSuggestionsStarted(true);
        revealDelayTimer = window.setTimeout(() => {
          revealSuggestions();
          revealInterval = window.setInterval(revealSuggestions, 500);
        }, 250);
      }, 10000);
    };

    const handleActivity = () => scheduleReveal();
    scheduleReveal();
    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      clearTimers();
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [chatOpen, entranceStage]);

  if (chatOpen) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <ChatBot
          isOpen={chatOpen}
          onClose={onClose}
          messages={messages}
          setMessages={setMessages}
          onAnalyzeCode={onAnalyzeCode}
          assistantContext={assistantContext}
          welcomeMessage={t("welcome")}
        />
      </div>
    );
  }

  const animClass = isAnimating
    ? "opacity-0 scale-95"
    : "opacity-100 scale-100";
  const fadeClass = (
    visible: boolean,
    delay = "",
    hiddenTransform = "translate-y-4 scale-95",
  ) =>
    `transition-all duration-500 ${delay} ${isAnimating || !visible ? `pointer-events-none opacity-0 ${hiddenTransform}` : "opacity-100 translate-x-0 translate-y-0 scale-100"}`;

  const logoIsInPosition = entranceStage > 0;
  const homeCircleColor = apiKeyUnavailable
    ? "bg-gradient-to-br from-amber-500/30 to-yellow-500/20"
    : "bg-gradient-to-br from-purple-500/30 to-blue-500/30";
  const manualPrompt = manualPromptVisible ? (
    <div className="group manual-prompt-enter fixed right-4 top-16 z-30 flex max-w-[min(19rem,calc(100vw-2rem))] flex-row-reverse items-center gap-2 sm:right-6 sm:top-20">
      <button
        type="button"
        onClick={onOpenManual}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-300/40 bg-gradient-to-br from-blue-500/25 to-cyan-400/20 text-blue-100 transition-all duration-300 group-hover:scale-110 group-hover:border-blue-200/70 group-hover:bg-blue-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/70"
        aria-label={t("manualPromptAction")}
      >
        <AALIEEmotionIcon
          name="thinking"
          size={34}
          className="transition-transform duration-200 group-hover:scale-110"
        />
      </button>
      <div className="rounded-lg border border-blue-300/20 bg-blue-950/20 px-3 py-2 text-center transition-all duration-300 group-hover:border-blue-300/40 group-hover:bg-blue-400/[0.08] group-hover:-translate-x-0.5">
        <p className="text-xs leading-4 text-blue-100/80 transition-colors duration-300 group-hover:text-blue-50">
          {t("manualPromptQuestion")}
        </p>
        <p className="mt-0.5 text-xs font-semibold leading-4 text-blue-100">
          {t("manualPromptAffirmation")}
        </p>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={viewRef}
        className={`flex min-h-0 flex-1 flex-col items-center justify-center text-center transition-all duration-500 ${animClass}`}
      >
        <div
          ref={contentRef}
          className="flex w-full flex-col items-center"
          style={{
            transform: `translateY(${contentShift}px)`,
            transitionDuration: contentShift === 0 ? "900ms" : "0ms",
          }}
        >
          {/* Icono del robot */}
          <div
            ref={logoRef}
            className={`mb-4 sm:mb-6 transition-all ${logoReady && entranceStage > 0 ? "duration-[1500ms] ease-out" : "duration-0"} ${logoReady ? "opacity-100" : "opacity-0"} ${isAnimating ? "scale-0" : "scale-100"}`}
            style={{
              transform: logoReady
                ? entranceStage === 0
                  ? `translateY(${logoOffset}px) scale(1.65) rotate(-4deg)`
                  : "translateY(0) scale(1) rotate(0deg)"
                : "translateY(0) scale(1.65) rotate(-4deg)",
            }}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-700 sm:h-16 sm:w-16 ${homeCircleColor}`}
            >
              <div
                className={`transition-all duration-500 ease-out ${
                  apiKeyUnavailable
                    ? "scale-110 rotate-0 text-amber-300"
                    : `${logoIsInPosition ? "scale-75 sm:scale-100" : "scale-110"} rotate-0 text-purple-300`
                }`}
              >
                {apiKeyUnavailable ? (
                  <Key
                    className="block h-6 w-6 sm:h-8 sm:w-8"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                ) : (
                  <AALIEIcon size={52} />
                )}
              </div>
            </div>
          </div>

          {/* Título principal */}
          <h4
            className={`min-h-[1.5rem] whitespace-nowrap text-base font-semibold transition-all duration-500 sm:text-lg lg:text-xl ${apiKeyUnavailable ? "translate-y-0 scale-105 text-amber-300" : "translate-y-0 scale-100 text-purple-400"} ${fadeClass(entranceStage >= 2, "", "translate-y-6 scale-95")}`}
            style={{
              transform:
                entranceStage >= 2
                  ? apiKeyUnavailable
                    ? "translateY(0) scale(1.05)"
                    : "translateY(0) scale(1)"
                  : undefined,
            }}
          >
            {apiKeyUnavailable ? t("apiKeyGreeting") : t("greeting")}
          </h4>
          <h2
            className={`mb-4 min-h-[2.25rem] text-xl font-semibold text-white transition-all duration-500 sm:mb-8 sm:text-2xl lg:text-3xl ${apiKeyUnavailable ? "translate-y-0 scale-[1.03]" : "translate-y-0 scale-100"} ${fadeClass(entranceStage >= 3, "delay-75", "translate-y-6 scale-95")}`}
            style={{
              transform:
                entranceStage >= 3
                  ? apiKeyUnavailable
                    ? "translateY(0) scale(1.03)"
                    : "translateY(0) scale(1)"
                  : undefined,
            }}
          >
            {apiKeyUnavailable ? (
              <>
                {t("apiKeyPromptPrefix")}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/help/api-key"
                  className="text-amber-300 underline decoration-amber-300/60 underline-offset-4 transition-colors hover:text-amber-200"
                >
                  {t("apiKeyPromptLink")}
                </a>
                {t("apiKeyPromptSuffix")}
              </>
            ) : (
              t("greetingQuestion")
            )}
          </h2>

          {/* Input principal: flex para evitar solapamiento y centrado vertical del icono */}
          <div
            className={`w-full max-w-2xl mb-4 sm:mb-8 px-2 sm:px-0 ${fadeClass(entranceStage >= 4, "delay-150", "translate-y-5 scale-95")}`}
          >
            <div
              className={`flex min-w-0 items-center gap-2 rounded-xl border border-slate-600/50 bg-white/5 transition-all focus-within:border-transparent focus-within:ring-2 ${apiKeyUnavailable ? "focus-within:ring-amber-400/60" : "focus-within:ring-purple-500/50"}`}
            >
              <input
                type="text"
                placeholder={
                  apiKeyUnavailable ? t("apiKeyPlaceholder") : t("placeholder")
                }
                className="flex-1 min-w-0 bg-transparent px-3 sm:px-4 py-3 sm:py-4 text-white placeholder-slate-400 text-sm focus:outline-none"
                value={apiKeyUnavailable ? apiKeyInput : inputMessage}
                onChange={
                  apiKeyUnavailable
                    ? (event) => setApiKeyInput(event.target.value)
                    : onInputChange
                }
                onKeyDown={
                  apiKeyUnavailable
                    ? (event) => {
                        if (event.key === "Enter") handleSaveApiKey();
                      }
                    : handleMessageKeyDown
                }
                disabled={isAnimating}
              />
              <button
                className="flex-shrink-0 p-2 mr-3 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center text-slate-400 hover:text-white"
                onClick={
                  apiKeyUnavailable ? handleSaveApiKey : handleMessageSubmit
                }
                disabled={
                  isAnimating ||
                  (apiKeyUnavailable
                    ? !validateApiKey(apiKeyInput)
                    : !inputMessage.trim())
                }
              >
                {apiKeyUnavailable ? (
                  <Save size={18} className="shrink-0 text-amber-300" />
                ) : (
                  <Send size={18} className="shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Sugerencias pedagógicas: se muestran como máximo tres filas del banco */}
          {suggestionsStarted && (
            <div
              className={`w-full overflow-hidden transition-[max-height,opacity,margin] duration-700 ease-out ${apiKeyUnavailable || isAnimating ? "pointer-events-none max-h-0 opacity-0 mb-0" : "max-h-48 opacity-100 mb-4 sm:mb-8"}`}
            >
              <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-1 px-2 sm:px-0">
                {suggestionSelection.map((suggestionIndex, index) => {
                  const suggestion = suggestionBank[suggestionIndex];

                  return (
                    <SuggestionButton
                      key={suggestion.key}
                      icon={suggestion.icon}
                      iconClass={suggestion.iconClass}
                      text={t(`suggestions.${suggestion.key}`)}
                      onClick={handleSuggestionSubmit}
                      disabled={isAnimating || apiKeyUnavailable}
                      visible={index < visibleSuggestionCount}
                      hiddenTransform={
                        index === 1
                          ? "translate-y-3 scale-95"
                          : index === 2
                            ? "translate-x-4 scale-95"
                            : "-translate-x-4 scale-95"
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {manualPrompt && typeof document !== "undefined"
        ? createPortal(manualPrompt, document.body)
        : null}
    </>
  );
}

/**
 * Propiedades del botón de sugerencia.
 */
interface SuggestionButtonProps {
  readonly icon: string;
  readonly iconClass: string;
  readonly text: string;
  readonly onClick: (text: string) => void;
  readonly disabled: boolean;
  readonly visible: boolean;
  readonly hiddenTransform: string;
}

/**
 * Componente de botón de sugerencia para el modo IA.
 * @param props - Propiedades del botón de sugerencia
 * @returns Elemento React del botón de sugerencia
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
function SuggestionButton({
  icon,
  iconClass,
  text,
  onClick,
  disabled,
  visible,
  hiddenTransform,
}: SuggestionButtonProps) {
  return (
    <button
      className={`group inline-flex w-full min-w-0 items-center justify-start gap-3 rounded-lg bg-transparent px-2 py-2 text-left transition-all duration-500 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/50 disabled:cursor-not-allowed disabled:opacity-50 ${visible ? "translate-x-0 translate-y-0 scale-100 opacity-100" : `pointer-events-none opacity-0 ${hiddenTransform}`}`}
      onClick={() => onClick(text)}
      disabled={disabled}
    >
      <span
        className={`material-symbols-outlined text-base flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-125 group-hover:-rotate-6 ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0 text-sm leading-5 text-slate-200">{text}</span>
    </button>
  );
}
