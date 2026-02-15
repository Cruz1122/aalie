"use client";

import type { Program } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import AIModeView from "@/components/AIModeView";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ManualModeView, {
  ManualModeViewHandle,
} from "@/components/ManualModeView";
import MethodSelector, { MethodType } from "@/components/MethodSelector";
import ModeToggle from "@/components/ModeToggle";
import { useAnalysisProgress } from "@/hooks/useAnalysisProgress";
import { getApiKey } from "@/hooks/useApiKey";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useRouter } from "@/i18n/navigation";

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
  const router = useRouter();
  const t = useTranslations("analyzer.progress");
  const tAlgorithmType = useTranslations("analyzer.algorithmType");
  const tHome = useTranslations("home");
  const { animateProgress } = useAnalysisProgress();
  const manualViewRef = useRef<ManualModeViewHandle>(null);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const { messages, setMessages } = useChatHistory();
  const [chatLoaderVisible, setChatLoaderVisible] = useState(false);
  const [chatAnalysisProgress, setChatAnalysisProgress] = useState(0);
  const [chatAnalysisMessage, setChatAnalysisMessage] = useState(() => t("init"));
  const [chatAlgorithmType, setChatAlgorithmType] = useState<
    "iterative" | "recursive" | "hybrid" | "unknown" | undefined
  >(undefined);
  const [chatAnalysisComplete, setChatAnalysisComplete] = useState(false);
  const [chatAnalysisError, setChatAnalysisError] = useState<string | null>(
    null,
  );
  const [isChatAnalyzing, setIsChatAnalyzing] = useState(false);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [applicableMethods, setApplicableMethods] = useState<MethodType[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<MethodType>("master");
  const methodSelectionPromiseRef = useRef<{
    resolve: (method: MethodType) => void;
    reject: () => void;
  } | null>(null);
  const minProgressRef = useRef<number>(0);

  // Efecto para mantener el progreso mínimo cuando el selector está visible
  useEffect(() => {
    if (showMethodSelector && minProgressRef.current > 0) {
      // Establecer el progreso al mínimo inmediatamente
      setChatAnalysisProgress(minProgressRef.current);

      // Usar un intervalo para mantener el progreso mientras el selector está visible
      const intervalId = setInterval(() => {
        setChatAnalysisProgress((prev) => {
          const minProgress = minProgressRef.current;
          if (prev < minProgress) {
            return minProgress;
          }
          return prev;
        });
      }, 100); // Verificar cada 100ms

      return () => clearInterval(intervalId);
    }
  }, [showMethodSelector]);

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

  type AlgorithmKind = "iterative" | "recursive" | "hybrid" | "unknown";

  const formatAlgorithmKind = useCallback(
    (value: "iterative" | "recursive" | "hybrid" | "unknown"): string =>
      tAlgorithmType(value === "unknown" ? "unknown" : value),
    [tAlgorithmType],
  );

  const handleMethodSelectionForRecursive = useCallback(
    async (
      defaultMethodValue: MethodType,
      progressBeforeMethodSelection: number,
    ): Promise<MethodType> => {
      setChatAnalysisMessage(t("selectMethod"));
      minProgressRef.current = progressBeforeMethodSelection;
      setChatAnalysisProgress(progressBeforeMethodSelection);
      setShowMethodSelector(true);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const selectedMethod = await new Promise<MethodType>((resolve) => {
        methodSelectionPromiseRef.current = {
          resolve,
          reject: () => resolve(defaultMethodValue),
        };
        setTimeout(() => {
          if (methodSelectionPromiseRef.current) {
            methodSelectionPromiseRef.current.resolve(defaultMethodValue);
            methodSelectionPromiseRef.current = null;
          }
        }, 60000);
      }).catch(() => defaultMethodValue);

      setShowMethodSelector(false);
      methodSelectionPromiseRef.current = null;
      minProgressRef.current = 0;
      setChatAnalysisMessage(t("methodSelected"));
      await animateProgress(
        progressBeforeMethodSelection,
        90,
        400,
        setChatAnalysisProgress,
      );
      return selectedMethod;
    },
    [animateProgress, t],
  );

  const detectAndSelectMethodForRecursive = useCallback(
    async (
      sourceCode: string,
      kind: AlgorithmKind,
    ): Promise<MethodType | undefined> => {
      const progressBeforeMethodSelection = 85;

      try {
        const detectMethodsResponse = await fetch(
          "/api/analyze/detect-methods",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source: sourceCode, algorithm_kind: kind }),
          },
        );
        const detectMethodsResult = (await detectMethodsResponse.json()) as {
          ok: boolean;
          applicable_methods?: MethodType[];
          default_method?: MethodType;
          errors?: Array<{ message: string }>;
        };

        if (
          !detectMethodsResult.ok ||
          !detectMethodsResult.applicable_methods
        ) {
          setChatAnalysisMessage(t("analyzingComplexity"));
          await animateProgress(
            progressBeforeMethodSelection,
            90,
            400,
            setChatAnalysisProgress,
          );
          return undefined;
        }

        const methods = detectMethodsResult.applicable_methods;
        const defaultMethodValue: MethodType =
          detectMethodsResult.default_method || "master";
        setApplicableMethods(methods);
        setDefaultMethod(defaultMethodValue);

        if (methods.length > 1) {
          return await handleMethodSelectionForRecursive(
            defaultMethodValue,
            progressBeforeMethodSelection,
          );
        }

        setChatAnalysisMessage(t("analyzingComplexity"));
        await animateProgress(
          progressBeforeMethodSelection,
          90,
          400,
          setChatAnalysisProgress,
        );
        return defaultMethodValue;
      } catch (error) {
        console.warn(
          "Error detectando métodos, usando método por defecto:",
          error,
        );
        setChatAnalysisMessage(t("analyzingComplexity"));
        await animateProgress(
          progressBeforeMethodSelection,
          90,
          400,
          setChatAnalysisProgress,
        );
        return "master";
      }
    },
    [animateProgress, handleMethodSelectionForRecursive, t],
  );

  const prepareRecursiveAnalysisSteps = useCallback(async (): Promise<void> => {
    setChatAnalysisMessage(t("verifyingConditions"));
    await animateProgress(40, 50, 300, setChatAnalysisProgress);
    setChatAnalysisMessage(t("extractingRecurrence"));
    await animateProgress(50, 65, 400, setChatAnalysisProgress);
    setChatAnalysisMessage(t("normalizingRecurrence"));
    await animateProgress(65, 75, 300, setChatAnalysisProgress);
    setChatAnalysisMessage(t("detectingMethod"));
    await animateProgress(75, 85, 500, setChatAnalysisProgress);
  }, [animateProgress, t]);

  const prepareIterativeAnalysisSteps = useCallback(async (): Promise<void> => {
    setChatAnalysisMessage(t("findingSums"));
    await animateProgress(40, 50, 200, setChatAnalysisProgress);
    setChatAnalysisMessage(t("closingSums"));
    await animateProgress(50, 55, 200, setChatAnalysisProgress);
  }, [animateProgress, t]);

  const runChatAnalysis = useCallback(
    async (sourceCode: string) => {
      if (!sourceCode) return;

      setIsChatAnalyzing(true);
      setChatLoaderVisible(true);
      setChatAnalysisProgress(0);
      setChatAnalysisMessage(t("init"));
      setChatAlgorithmType(undefined);
      setChatAnalysisComplete(false);
      setChatAnalysisError(null);

      try {
        // Parse source code
        setChatAnalysisMessage(t("parsing"));
        const parsePromise = fetch("/api/grammar/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: sourceCode }),
        }).then((r) => r.json());
        const parseRes = (await animateProgress(
          0,
          20,
          800,
          setChatAnalysisProgress,
          parsePromise,
        )) as {
          ok: boolean;
          ast?: Program;
          errors?: Array<{ line: number; column: number; message: string }>;
        };

        if (!parseRes.ok) {
          const msg =
            parseRes.errors
              ?.map((e) => `Línea ${e.line}:${e.column} ${e.message}`)
              .join("\n") || "Error de parseo";
          setChatAnalysisError(`Errores de sintaxis:\n${msg}`);
          setChatAnalysisMessage(t("parseError"));
          setIsChatAnalyzing(false);
          return;
        }

        // Classify algorithm
        setChatAnalysisMessage(t("classifying"));
        let kind: AlgorithmKind;
        try {
          const apiKey = getApiKey();
          const body: { source: string; mode: string; apiKey?: string } = {
            source: sourceCode,
            mode: "local",
          };
          if (apiKey) {
            body.apiKey = apiKey;
          }
          const clsPromise = fetch("/api/llm/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const clsResponse = (await animateProgress(
            20,
            40,
            1200,
            setChatAnalysisProgress,
            clsPromise,
          )) as Response;
          if (clsResponse.ok) {
            const cls = (await clsResponse.json()) as {
              kind: AlgorithmKind;
              method?: string;
            };
            kind = cls.kind;
            setChatAlgorithmType(kind);
            setChatAnalysisMessage(
              t("algorithmIdentified", { type: formatAlgorithmKind(kind) }),
            );
          } else {
            throw new Error(`HTTP ${clsResponse.status}`);
          }
        } catch (error) {
          console.warn("[ChatAnalysis] Error en clasificación", error);
          kind = "unknown";
          setChatAlgorithmType(kind);
          setChatAnalysisMessage(t("classifyError"));
        }

        const isRecursive = kind === "recursive" || kind === "hybrid";
        let selectedMethod: MethodType | undefined = undefined;

        // Prepare and detect methods for recursive algorithms
        if (isRecursive) {
          await prepareRecursiveAnalysisSteps();
          selectedMethod = await detectAndSelectMethodForRecursive(
            sourceCode,
            kind,
          );
        } else {
          await prepareIterativeAnalysisSteps();
        }

        // Perform analysis
        const apiKey = getApiKey();
        const analyzeBody: {
          source: string;
          mode: string;
          api_key?: string;
          avgModel?: { mode: string; predicates?: Record<string, string> };
          algorithm_kind?: string;
          preferred_method?: MethodType;
          locale?: string;
        } = {
          source: sourceCode,
          mode: "all",
          avgModel: { mode: "uniform", predicates: {} },
          algorithm_kind: kind,
          locale: locale === "es" ? "es" : "en",
        };

        if (isRecursive && selectedMethod) {
          analyzeBody.preferred_method = selectedMethod;
        }
        if (apiKey) {
          analyzeBody.api_key = apiKey;
        }

        const analyzePromise = fetch("/api/analyze/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(analyzeBody),
        }).then((r) => r.json());

        const progressStart = isRecursive ? 90 : 55;
        setChatAnalysisMessage(t("analyzing"));
        const analyzeRes = (await animateProgress(
          progressStart,
          70,
          2000,
          setChatAnalysisProgress,
          analyzePromise,
        )) as {
          ok: boolean;
          worst?: unknown;
          best?: unknown;
          avg?: unknown;
          errors?: Array<{ message: string; line?: number; column?: number }>;
          [key: string]: unknown;
        };

        setChatAnalysisMessage(t("generatingPolynomial"));
        await animateProgress(70, 80, 200, setChatAnalysisProgress);

        // Finalize analysis
        if (!analyzeRes.ok) {
          const errorMsg =
            analyzeRes.errors
              ?.map((e) => e.message || `Error en línea ${e.line ?? "?"}`)
              .join("\n") || "No se pudo analizar el algoritmo";
          setChatAnalysisError(errorMsg);
          setChatAnalysisMessage(t("analysisStopped"));
          setIsChatAnalyzing(false);
          return;
        }

        setChatAnalysisMessage(t("finalizing"));
        await animateProgress(80, 100, 200, setChatAnalysisProgress);

        if (globalThis.window !== undefined) {
          sessionStorage.setItem("analyzerCode", sourceCode);
          sessionStorage.setItem("analyzerResults", JSON.stringify(analyzeRes));
        }

        setChatAnalysisMessage(t("complete"));
        setChatAnalysisComplete(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        router.push("/analyzer");
      } catch (error) {
        console.error("[ChatAnalysis] Error inesperado", error);
        const message =
          error instanceof Error
            ? error.message
            : "Error inesperado durante el análisis";
        setChatAnalysisError(message);
        setChatAnalysisMessage(t("errorOccurred"));
        setIsChatAnalyzing(false);
      }
    },
    [
      animateProgress,
      formatAlgorithmKind,
      locale,
      router,
      t,
      detectAndSelectMethodForRecursive,
      prepareIterativeAnalysisSteps,
      prepareRecursiveAnalysisSteps,
    ],
  );

  const handleChatLoaderClose = () => {
    setChatLoaderVisible(false);
    setChatAnalysisError(null);
    setChatAnalysisProgress(0);
    setChatAnalysisMessage(t("init"));
    setChatAlgorithmType(undefined);
    setChatAnalysisComplete(false);
    setIsChatAnalyzing(false);
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1 p-4 z-10">
        <ModeToggle
          mode={mode}
          isSwitching={isSwitching}
          onModeSwitch={handleModeSwitch}
        />

        <div className="max-w-7xl mx-auto">
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

      {showMethodSelector &&
        applicableMethods.length > 0 &&
        isChatAnalyzing && (
          <MethodSelector
            applicableMethods={applicableMethods}
            defaultMethod={defaultMethod}
            onSelect={(method) => {
              console.log("[MethodSelector] Método seleccionado:", method);
              if (methodSelectionPromiseRef.current) {
                methodSelectionPromiseRef.current.resolve(method);
              }
            }}
            onCancel={() => {
              console.log(
                "[MethodSelector] Cancelado, usando método por defecto:",
                defaultMethod,
              );
              if (methodSelectionPromiseRef.current) {
                methodSelectionPromiseRef.current.resolve(defaultMethod);
              }
            }}
          />
        )}
    </div>
  );
}
