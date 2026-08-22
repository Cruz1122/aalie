import type { ParseError, Program } from "@aa/types";
import { useLocale, useTranslations } from "next-intl";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";

import { useAnalysisProgressContext } from "@/contexts/AnalysisProgressContext";
import { getSnippetById } from "@/features/analyzer/editor-support/catalog/snippetCatalog";
import { getImportNormalizationSuggestions } from "@/features/analyzer/editor-support/parser/normalizeImportSuggestions";
import {
  resolveEditorContext,
  type EditorContext,
  type ManualEditorActions,
} from "@/features/analyzer/manual-guidance";
import type {
  GuidanceRecommendation,
} from "@/features/analyzer/manual-guidance/recommendations";
import { ManualGuidancePanel } from "@/features/analyzer/manual-guidance/ui";
import { getApiKey, getApiKeyStatus } from "@/hooks/useApiKey";
import { useRunAnalysis } from "@/hooks/useRunAnalysis";
import {
  MAX_TXT_IMPORT_BYTES,
  looksLikeAlgorithmSourceText,
  readAndValidateTxtFile,
} from "@/lib/txt-import";
import { GrammarApiService } from "@/services/grammar-api";

import AAButton from "./AAButton";
import { AAProgressLoader } from "./AAProgressLoader";
import { AnalyzerEditor, type AnalyzerEditorHandle } from "./AnalyzerEditor";
import { ASTTreeView } from "./ASTTreeView";
import RepairModal from "./RepairModal";

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
    const t = useTranslations("analyzer.messages");
    const locale = useLocale();
    const tManual = useTranslations("analyzer.manualMode");
    const tView = useTranslations("analyzer.view");
    const tCommon = useTranslations("common");
    const tLoader = useTranslations("analyzer.loader");

    const defaultCode = "";
    const isControlled = initialCode !== undefined;
    const [internalCode, setInternalCode] = useState(defaultCode);
    const code = isControlled ? initialCode : internalCode;
    const setCode = useCallback(
      (value: string | ((prev: string) => string)) => {
        const next = typeof value === "function" ? value(code) : value;
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
    const [parseErrors, setParseErrors] = useState<ParseError[] | undefined>(
      undefined,
    );
    const [isImportingTxt, setIsImportingTxt] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importMessage, setImportMessage] = useState("");
    const [isImportComplete, setIsImportComplete] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importErrorActionLabel, setImportErrorActionLabel] = useState<
      string | null
    >(null);
    const txtInputRef = useRef<HTMLInputElement | null>(null);
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [pendingImportSourceForRepair, setPendingImportSourceForRepair] =
      useState<string | null>(null);
    const [pendingImportErrorsForRepair, setPendingImportErrorsForRepair] =
      useState<ParseError[] | undefined>(undefined);
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
    const editorRef = useRef<AnalyzerEditorHandle | null>(null);
    const [editorContext, setEditorContext] = useState<EditorContext>(() =>
      resolveEditorContext({
        source: code,
        cursor: { line: 1, column: 0, offset: 0 },
      }),
    );
    const [activeRecommendation, setActiveRecommendation] =
      useState<GuidanceRecommendation | null>(null);
    const editorActions = useMemo<ManualEditorActions>(
      () => ({
        insertSnippet: (snippetId) => {
          const snippet = getSnippetById(snippetId);
          if (snippet) editorRef.current?.insertSnippet(snippet);
        },
        insertSnippetAtCursor: (snippetId) =>
          editorRef.current?.insertSnippetAtCursor(snippetId),
        wrapSelection: (snippetId) =>
          editorRef.current?.wrapSelection(snippetId),
        focusEditor: () => editorRef.current?.focus(),
        focusAlgorithmBody: () => editorRef.current?.focusAlgorithmBody(),
        prepareAlgorithmBlockInsertion: () =>
          editorRef.current?.prepareAlgorithmBlockInsertion(),
        prepareReturnInsertion: () => editorRef.current?.prepareReturnInsertion(),
        insertTextAtCursor: (text) =>
          editorRef.current?.insertTextAtCursor(text),
        insertParameterAtProcedure: (parameter) =>
          editorRef.current?.insertParameterAtProcedure(parameter),
      }),
      [],
    );

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

    const handleTxtImport = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) {
        return;
      }

      setIsImportingTxt(true);
      setImportProgress(0);
      setImportMessage(tLoader("importPleaseWait"));
      setIsImportComplete(false);
      setImportError(null);
      setImportErrorActionLabel(null);

      setImportProgress(10);
      setImportMessage("Validating file...");
      const validation = await readAndValidateTxtFile(file);
      if (!validation.ok) {
        let errorMsg: string;
        if (validation.reason === "invalidExtension") {
          errorMsg = tView("txtImportOnlyTxt");
        } else if (validation.reason === "empty") {
          errorMsg = tView("txtImportEmpty");
        } else if (validation.reason === "tooLarge") {
          errorMsg = tView("txtImportTooLarge", {
            maxKb: Math.floor(MAX_TXT_IMPORT_BYTES / 1024),
          });
        } else if (validation.reason === "invalidFormat") {
          errorMsg = tView("txtImportInvalidFormat");
        } else {
          errorMsg = tView("txtImportReadError");
        }
        setImportProgress(100);
        setImportError(errorMsg);
        return;
      }

      setImportProgress(40);
      setImportMessage("Parsing algorithm...");
      try {
        const parseRes = await GrammarApiService.parseCode(
          validation.normalizedSource,
        );

        setImportProgress(90);
        setImportMessage("Finalizing import...");

        if (parseRes.ok) {
          setCode(validation.normalizedSource);
          setParseErrors(undefined);
          setLocalParseOk(true);
          setPendingImportSourceForRepair(null);
          setPendingImportErrorsForRepair(undefined);
          setImportProgress(100);
          setIsImportComplete(true);
          return;
        }

        const errors = parseRes.errors || undefined;
        setParseErrors(errors);
        setLocalParseOk(false);

        if (!looksLikeAlgorithmSourceText(validation.normalizedSource)) {
          setImportProgress(100);
          setImportError(tView("txtImportNotAlgorithm"));
          return;
        }

        const errorDetails = (errors || []).slice(0, 3).map((e) =>
          t("lineErrorFormat", {
            line: e.line ?? 0,
            column: e.column ?? 0,
            message: e.message ?? "",
          }),
        );

        const suggestionDetails = getImportNormalizationSuggestions(
          validation.normalizedSource,
        ).map((suggestion) => suggestion.reason);

        const fullError = [
          tView("txtImportParseFailed"),
          "",
          ...errorDetails,
          ...(suggestionDetails.length > 0 ? ["", ...suggestionDetails] : []),
        ].join("\n");

        setImportProgress(100);
        setImportError(fullError);
        setImportErrorActionLabel(tView("repairWithAI"));
        setPendingImportSourceForRepair(validation.normalizedSource);
        setPendingImportErrorsForRepair(errors);
      } catch {
        setPendingImportSourceForRepair(null);
        setPendingImportErrorsForRepair(undefined);
        setImportProgress(100);
        setImportError(tView("txtImportReadError"));
      }
    };

    const handleImportRepair = useCallback(() => {
      if (pendingImportSourceForRepair) {
        setCode(pendingImportSourceForRepair);
      }
      setParseErrors(pendingImportErrorsForRepair);
      setIsImportingTxt(false);
      setImportProgress(0);
      setImportMessage("");
      setIsImportComplete(false);
      setImportError(null);
      setImportErrorActionLabel(null);
      setPendingImportSourceForRepair(null);
      setPendingImportErrorsForRepair(undefined);
      setShowRepairModal(true);
    }, [pendingImportSourceForRepair, pendingImportErrorsForRepair, setCode]);

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
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1240px] flex-1 flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-1 flex-col items-center">
          <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
            <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:items-stretch">
              <div className="flex min-h-0 min-w-0 max-md:min-h-[280px] flex-1 basis-0 flex-col gap-4 md:flex-none md:basis-[calc(100%-376px)] md:max-w-[calc(100%-376px)] lg:basis-[calc(100%-516px)] lg:max-w-[calc(100%-516px)] xl:flex-1 xl:basis-0 xl:max-w-none">
                <AnalyzerEditor
                  ref={editorRef}
                  initialValue={code}
                  onChange={setCode}
                  onAstChange={setAst}
                  onParseStatusChange={handleParseStatusChange}
                  onEditorContextChange={setEditorContext}
                  onVerifyParse={handleAnalyzeCode}
                  onViewAst={() => setShowAstModal(true)}
                  isVerifyingParse={isVerifyingParse}
                  canViewAst={localParseOk && ast != null}
                  hasCode={code.trim() !== ""}
                  verifyParseResult={verifyParseResult}
                  activeRecommendation={activeRecommendation}
                  showAIHelpButton={
                    showAIHelpButton && !!backendParseError && hasValidApiKey
                  }
                  topRightActions={
                    <>
                      <div className="rounded-full bg-[#101820] p-0.5 shadow-lg">
                        <button
                          type="button"
                          onClick={() => txtInputRef.current?.click()}
                          disabled={isImportingTxt}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-500/20 bg-slate-500/12 text-slate-300/70 transition-all duration-300 ease-out hover:bg-slate-500/25 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            isImportingTxt
                              ? tView("importingTxt")
                              : tView("importTxt")
                          }
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isImportingTxt ? "progress_activity" : "upload"}
                          </span>
                        </button>
                      </div>
                      <div className="rounded-full bg-[#101820] p-0.5 shadow-lg">
                        <button
                          type="button"
                          onClick={handleAnalyzeComplexity}
                          disabled={
                            isAnalyzing || !localParseOk || code.trim() === ""
                          }
                          className="inline-flex h-8 min-w-[95px] items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/12 px-3 text-xs font-semibold text-blue-300/70 transition-all duration-300 ease-out hover:bg-blue-500/25 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            isAnalyzing
                              ? tManual("analyzing")
                              : tManual("analyzeComplexity")
                          }
                        >
                          {isAnalyzing
                            ? tManual("analyzing")
                            : tManual("analyzeComplexity")}
                        </button>
                      </div>
                    </>
                  }
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
                    const errorHash =
                      backendParseError?.trim().slice(0, 50) || "";
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
                                "¡Hola! Soy AALIE (Algorithm Analysis Learning Interactive Environment), tu asistente para análisis de algoritmos. ¿En qué puedo ayudarte hoy?",
                              sender: "bot",
                              timestamp: new Date(),
                            },
                            newMessage,
                          ],
                    );

                    setTimeout(() => {
                      onSwitchToAIMode();
                      setTimeout(() => onOpenChat(), 150);
                    }, 100);
                  }}
                  height="100%"
                />
                <input
                  ref={txtInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={handleTxtImport}
                />
              </div>
              <div className="flex min-h-0 max-h-[52vh] shrink-0 overflow-hidden md:min-h-0 md:max-h-none md:w-[360px] md:flex-col md:self-stretch lg:w-[500px] xl:w-[500px]">
                <ManualGuidancePanel
                  context={editorContext}
                  editorActions={editorActions}
                  onAnalyze={handleAnalyzeComplexity}
                  onActiveRecommendationChange={setActiveRecommendation}
                />
              </div>
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
                      <AAButton
                        onClick={() => setShowAstModal(false)}
                        variant="amber"
                        size="sm"
                      >
                        {tCommon("close")}
                      </AAButton>
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          <RepairModal
            open={showRepairModal}
            onClose={() => {
              setShowRepairModal(false);
              setPendingImportSourceForRepair(null);
              setPendingImportErrorsForRepair(undefined);
            }}
            onAccept={(repairedCode) => {
              setCode(repairedCode);
              setParseErrors(undefined);
              setLocalParseOk(false);
              setShowRepairModal(false);
              setPendingImportSourceForRepair(null);
              setPendingImportErrorsForRepair(undefined);
            }}
            originalCode={pendingImportSourceForRepair ?? code}
            parseErrors={pendingImportErrorsForRepair ?? parseErrors}
          />

          {isImportingTxt && (
            <AAProgressLoader
              mode="import"
              progress={importProgress}
              message={importMessage}
              isComplete={isImportComplete}
              error={importError}
              errorActionLabel={importErrorActionLabel ?? undefined}
              onErrorAction={
                importErrorActionLabel ? handleImportRepair : undefined
              }
              onClose={() => {
                setIsImportingTxt(false);
                setImportProgress(0);
                setImportMessage("");
                setIsImportComplete(false);
                setImportError(null);
                setImportErrorActionLabel(null);
              }}
            />
          )}
        </div>
      </div>
    );
  },
);

export default ManualModeView;
