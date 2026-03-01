import type { Program } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";

import { useAnalysisProgressContext } from "@/contexts/AnalysisProgressContext";
import { getApiKey, getApiKeyStatus } from "@/hooks/useApiKey";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import { GrammarApiService } from "@/services/grammar-api";

import { AnalyzerEditor } from "./AnalyzerEditor";
import { ASTTreeView } from "./ASTTreeView";

// Constantes
const COPY_FEEDBACK_DURATION = 2000; // 2 segundos

type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  isError?: boolean;
  retryMessageId?: string;
};


/**
 * Propiedades del componente ManualModeView.
 */
interface ManualModeViewProps {
  readonly messages: Message[];
  readonly setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  readonly onOpenChat: () => void;
  readonly onSwitchToAIMode: () => void;
  /** Código controlado desde el padre (persiste al cambiar de modo) */
  readonly initialCode?: string;
  /** Callback cuando cambia el código (para sincronizar con el padre) */
  readonly onCodeChange?: (code: string) => void;
}

/**
 * Referencia imperativa para el componente ManualModeView.
 */
export interface ManualModeViewHandle {
  analyzeCode: (source: string) => Promise<void>;
}

/**
 * Componente principal para el modo manual de análisis.
 * Permite editar código, verificar sintaxis, analizar complejidad y visualizar el AST.
 * Incluye integración con el asistente IA para ayuda con errores de sintaxis.
 *
 * @param props - Propiedades del componente
 * @param ref - Referencia imperativa para controlar el componente desde el exterior
 * @returns Componente React con la vista del modo manual
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * const manualModeRef = useRef<ManualModeViewHandle>(null);
 *
 * <ManualModeView
 *   ref={manualModeRef}
 *   messages={messages}
 *   setMessages={setMessages}
 *   onOpenChat={handleOpenChat}
 *   onSwitchToAIMode={handleSwitchToAIMode}
 * />
 *
 * // Analizar código desde fuera del componente
 * manualModeRef.current?.analyzeCode(sourceCode);
 * ```
 */
const ManualModeView = forwardRef<ManualModeViewHandle, ManualModeViewProps>(
  function ManualModeView(
    {
      messages,
      setMessages,
      onOpenChat,
      onSwitchToAIMode,
      initialCode,
      onCodeChange,
    },
    ref,
  ) {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const t = useTranslations("analyzer.messages");
    const locale = useLocale();
    const tManual = useTranslations("analyzer.manualMode");
    const tView = useTranslations("analyzer.view");
    const tCommon = useTranslations("common");

    const defaultCode = tManual("defaultCode");
    const isControlled = initialCode !== undefined;
    const [internalCode, setInternalCode] = useState(defaultCode);
    const code = isControlled ? initialCode : internalCode;
    const setCode = useCallback(
      (value: string | ((prev: string) => string)) => {
        const next =
          typeof value === "function" ? value(code) : value;
        if (!isControlled) setInternalCode(next);
        onCodeChange?.(next);
      },
      [isControlled, onCodeChange, code],
    );

    // Solo cargar desde localStorage si no está controlado por el padre
    useEffect(() => {
      if (isControlled || globalThis.window === undefined) return;
      const savedCode = localStorage.getItem("manualModeCode");
      const savedLocale = localStorage.getItem("manualModeLocale");
      if (savedCode && savedLocale === locale) {
        setInternalCode(savedCode);
      } else {
        setInternalCode(defaultCode);
      }
    }, [locale, defaultCode, isControlled]);
    const [ast, setAst] = useState<Program | null>(null);
    const [showAstModal, setShowAstModal] = useState(false);
    const [localParseOk, setLocalParseOk] = useState(false);
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState<"tree" | "json">("tree");
    const [isVerifyingParse, setIsVerifyingParse] = useState(false);
    const [verifyParseResult, setVerifyParseResult] = useState<{
      success: boolean;
      message: string;
    } | null>(null);
    const [showAIHelpButton, setShowAIHelpButton] = useState(false);
    const [backendParseError, setBackendParseError] = useState<string | null>(
      null,
    );
    const [hasValidApiKey, setHasValidApiKey] = useState<boolean>(false);

    const { state: analysisState } = useAnalysisProgressContext();
    const { runAnalysis } = useRunAnalysis({
      blurScope: "container",
      onParseFail: () => setLocalParseOk(false),
    });
    const isAnalyzing =
      analysisState.visible && analysisState.mode === "analysis";

    // Refs para evitar memory leaks con timeouts
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const aiHelpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Manejar cambios en el estado de parsing local
    const handleParseStatusChange = (ok: boolean, _isParsing: boolean) => {
      setLocalParseOk(ok);
    };

    // Verificar API_KEY al montar y cuando cambie (sin hacer requests innecesarios)
    useEffect(() => {
      const checkApiKey = () => {
        // Verificar solo localStorage primero (sin hacer request al servidor)
        const stored = getApiKey();
        if (stored) {
          setHasValidApiKey(true);
          return;
        }

        // Solo verificar servidor si no hay en localStorage
        // Hacer esto de forma asíncrona pero sin bloquear
        getApiKeyStatus()
          .then((status) => {
            setHasValidApiKey(status.hasAny);
          })
          .catch((error) => {
            console.error("[ManualModeView] Error verificando API_KEY:", error);
            setHasValidApiKey(false);
          });
      };

      checkApiKey();

      // Escuchar cambios en la API_KEY (solo eventos, sin polling)
      const handleApiKeyChange = () => {
        // Verificar localStorage primero
        const stored = getApiKey();
        if (stored) {
          setHasValidApiKey(true);
        } else {
          // Solo si no hay en localStorage, verificar servidor
          getApiKeyStatus()
            .then((status) => {
              setHasValidApiKey(status.hasAny);
            })
            .catch(() => {
              setHasValidApiKey(false);
            });
        }
      };

      globalThis.window.addEventListener("apiKeyChanged", handleApiKeyChange);
      globalThis.window.addEventListener("storage", handleApiKeyChange);

      return () => {
        globalThis.window.removeEventListener(
          "apiKeyChanged",
          handleApiKeyChange,
        );
        globalThis.window.removeEventListener("storage", handleApiKeyChange);
      };
    }, []);

    // Cleanup de timeouts al desmontar
    useEffect(() => {
      return () => {
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        if (analysisTimeoutRef.current) {
          clearTimeout(analysisTimeoutRef.current);
        }
        if (aiHelpTimeoutRef.current) {
          clearTimeout(aiHelpTimeoutRef.current);
        }
      };
    }, []);

    // Detectar errores de parsing y mostrar botón de ayuda después de 3 segundos
    useEffect(() => {
      // Limpiar timeout anterior
      if (aiHelpTimeoutRef.current) {
        clearTimeout(aiHelpTimeoutRef.current);
      }

      // Si no hay errores locales, ocultar el botón
      if (localParseOk) {
        setShowAIHelpButton(false);
        setBackendParseError(null);
        return;
      }

      // Si hay errores locales, esperar 3 segundos y consultar backend
      aiHelpTimeoutRef.current = setTimeout(async () => {
        try {
          const data = await GrammarApiService.parseCode(code);
          if (data.ok) {
            setShowAIHelpButton(false);
            setBackendParseError(null);
          } else {
            setBackendParseError(data.error || t("parseErrorDetected"));
            setShowAIHelpButton(true);
          }
        } catch (e) {
          console.error("Error al verificar parse:", e);
          setBackendParseError(t("verifyError"));
          setShowAIHelpButton(true);
        }
      }, 3000);

      return () => {
        if (aiHelpTimeoutRef.current) {
          clearTimeout(aiHelpTimeoutRef.current);
        }
      };
    }, [localParseOk, code, t]);

    // Guardar código y locale en localStorage cuando cambia
    useEffect(() => {
      if (globalThis.window !== undefined) {
        localStorage.setItem("manualModeCode", code);
        localStorage.setItem("manualModeLocale", locale);
      }
    }, [code, locale]);

    // Resetear estado de copiado cuando se cierra el modal
    useEffect(() => {
      if (!showAstModal) {
        setCopied(false);
        setViewMode("tree");
      }
    }, [showAstModal]);

    // Función para copiar JSON
    const handleCopyJson = async () => {
      if (!ast) return;

      // Limpiar timeout anterior si existe
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      try {
        await navigator.clipboard.writeText(JSON.stringify(ast, null, 2));
        setCopied(true);
        copyTimeoutRef.current = setTimeout(() => {
          setCopied(false);
          copyTimeoutRef.current = null;
        }, COPY_FEEDBACK_DURATION);
      } catch (err) {
        console.error("Error al copiar:", err);
      }
    };

    // Función para verificar parse (estado independiente)
    const handleAnalyzeCode = async () => {
      setIsVerifyingParse(true);
      setVerifyParseResult(null);

      // Limpiar timeout anterior si existe
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      try {
        const data = await GrammarApiService.parseCode(code);

        if (data.ok) {
          setVerifyParseResult({
            success: true,
            message: t("success"),
          });
        } else {
          setVerifyParseResult({
            success: false,
            message: data.error || t("errorSyntax"),
          });
        }
      } catch (e) {
        console.error("Error analyzing code:", e);
        setVerifyParseResult({
          success: false,
          message: t("errorConnection"),
        });
      } finally {
        setIsVerifyingParse(false);
        // Auto-ocultar el resultado del verify después de 4 segundos
        analysisTimeoutRef.current = setTimeout(() => {
          setVerifyParseResult(null);
          analysisTimeoutRef.current = null;
        }, 4000);
      }
    };

    const handleAnalyzeComplexity = () => {
      void runAnalysis(code);
    };

    useImperativeHandle(
      ref,
      () => ({
        analyzeCode: async (source: string) => {
          if (!source.trim()) return;

          setCode(source);
          setLocalParseOk(false);

          if (globalThis.window !== undefined) {
            localStorage.setItem("manualModeCode", source);
            localStorage.setItem("manualModeLocale", locale);
          }

          await runAnalysis(source);
        },
      }),
      [runAnalysis, locale, setCode],
    );

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          {/* Contenedor flex: editor a la izquierda, botón Analizar a la derecha; items-start evita espacio muerto */}
          <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
            {/* Editor de Código con Monaco - 75% en desktop, 100% en mobile; tooltips Verificar parse y Ver AST en esquina */}
            <div className="w-full lg:w-[75%]">
              <AnalyzerEditor
                initialValue={code}
                onChange={setCode}
                onAstChange={setAst}
                onParseStatusChange={handleParseStatusChange}
                onVerifyParse={handleAnalyzeCode}
                onViewAst={() => setShowAstModal(true)}
                isVerifyingParse={isVerifyingParse}
                canViewAst={localParseOk && ast != null}
                hasCode={code.trim() !== ""}
                verifyParseResult={verifyParseResult}
                showAIHelpButton={showAIHelpButton && !!backendParseError && hasValidApiKey}
                onAIHelpClick={async () => {
                  const errorMessage = `Necesito ayuda con un error de sintaxis en mi código de pseudocódigo.

**CÓDIGO ADJUNTO:**
\`\`\`pseudocode
${code}
\`\`\`

**ERROR DETECTADO:**
\`\`\`error
${backendParseError}
\`\`\`

**SOLICITUD:**
Por favor, analiza el código y el error, identifica la causa del problema y proporciona una solución corregida. Explica qué estaba mal y cómo solucionarlo.`;

                  const newMessage: Message = {
                    id: `user-help-${Date.now()}`,
                    content: errorMessage,
                    sender: "user",
                    timestamp: new Date(),
                  };

                  const codeHash = code.trim().slice(0, 100);
                  const errorHash = backendParseError?.trim().slice(0, 50) || "";
                  const messageExists = messages.some(
                    (msg) =>
                      msg.sender === "user" &&
                      msg.content.includes("**CÓDIGO ADJUNTO:**") &&
                      msg.content.includes(codeHash) &&
                      msg.content.includes(errorHash),
                  );

                  if (messageExists) {
                    onSwitchToAIMode();
                    setTimeout(() => onOpenChat(), 100);
                    return;
                  }

                  setMessages((prev) =>
                    prev.length > 0
                      ? [...prev, newMessage]
                      : [
                          {
                            id: "welcome",
                            content:
                              "¡Hola! Soy AALIE (Algorithmic Analysis Live Interaction Expert), tu asistente para análisis de algoritmos. ¿En qué puedo ayudarte hoy?",
                            sender: "bot",
                            timestamp: new Date(),
                          },
                          newMessage,
                        ]
                  );

                  setTimeout(() => {
                    onSwitchToAIMode();
                    setTimeout(() => onOpenChat(), 150);
                  }, 100);
                }}
                height={isDesktop ? "420px" : "280px"}
              />
            </div>

            {/* Botón Analizar - 25% en desktop, 100% en mobile; azul con icono play como ejemplos */}
            <div className="w-full lg:w-[25%] flex flex-col gap-3 relative z-10">
              <button
                onClick={handleAnalyzeComplexity}
                disabled={isAnalyzing || !localParseOk || code.trim() === ""}
                className="flex items-center justify-center gap-2 py-2.5 px-4 sm:px-6 rounded-lg text-white text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-400/50 bg-primary/25 border border-primary/40 hover:bg-primary/35 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isAnalyzing ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">
                      progress_activity
                    </span>{" "}
                    {tManual("analyzing")}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      play_arrow
                    </span>{" "}
                    {tManual("analyzeComplexity")}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Modal AST - Portal a body para overlay fijo sobre todo */}
          {showAstModal &&
            ast &&
            typeof document !== "undefined" &&
            ReactDOM.createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center glass-modal-overlay glass-modal-overlay-fixed modal-animate-in">
                <div className="glass-modal-container rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col m-4 modal-animate-in">
                {/* Header compacto */}
                <div className="glass-modal-header flex items-center justify-between px-5 py-3 rounded-t-xl border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-yellow-400">
                      account_tree
                    </span>
                    <h2 className="text-lg font-bold text-white">
                      {tView("abstractSyntaxTree")}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAstModal(false)}
                    className="text-slate-400 hover:text-white text-2xl leading-none transition-all hover:rotate-90 transform duration-200"
                  >
                    ×
                  </button>
                </div>

                {/* Tabs para cambiar vista */}
                <div className="flex gap-2 px-5 py-3 border-b border-white/10">
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      viewMode === "tree"
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">
                        account_tree
                      </span>{" "}
                      {tView("treeView")}
                    </span>
                  </button>
                  <button
                    onClick={() => setViewMode("json")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      viewMode === "json"
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">
                        code
                      </span>{" "}
                      {tView("jsonView")}
                    </span>
                  </button>
                </div>

                {/* Content con altura fija */}
                <div className="h-[300px] overflow-auto p-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                  {viewMode === "tree" ? (
                    <ASTTreeView node={ast} />
                  ) : (
                    <pre className="text-xs text-slate-200 p-4 rounded-lg border border-white/10 overflow-x-auto font-mono h-full">
                      {JSON.stringify(ast, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Footer compacto */}
                <div className="flex justify-between items-center gap-3 px-5 py-3 border-t border-white/10 rounded-b-xl">
                  <div className="text-xs text-slate-400">
                    {viewMode === "tree"
                      ? tView("astTreeViewDesc")
                      : tView("astJsonViewDesc")}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyJson}
                      className={`glass-secondary px-4 py-2 text-xs font-semibold rounded-lg transition-all hover:scale-105 flex items-center gap-2 ${
                        copied
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "text-slate-200"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {copied ? "check" : "content_copy"}
                      </span>
                      {copied ? tView("astModalCopied") : tView("copyJson")}
                    </button>
                    <button
                      onClick={() => setShowAstModal(false)}
                      className="glass-button px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all hover:scale-105 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-amber-500/30"
                    >
                      {tCommon("close")}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
              document.body,
            )}
        </div>
      </div>
    );
  },
);

export default ManualModeView;
