"use client";
import type { ParseError, Program } from "@aa/types";
import MonacoEditor, { Monaco as MonacoReact } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useLocale, useTranslations } from "next-intl";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { SnippetDefinition } from "@/features/analyzer/editor-support/catalog/snippetCatalog";
import { insertSnippetIntoEditor } from "@/features/analyzer/editor-support/monaco/contextInsertionRules";
import { registerPseudocodeCommands } from "@/features/analyzer/editor-support/monaco/registerPseudocodeCommands";
import { registerPseudocodeCompletionProvider } from "@/features/analyzer/editor-support/monaco/registerPseudocodeCompletionProvider";
import { useDebouncedSyntaxHints } from "@/features/analyzer/editor-support/parser/validateSourceDebounced";
import { AlgorithmTechniqueCard } from "@/features/analyzer/technique-detection/AlgorithmTechniqueCard";
import { AlgorithmTechniqueModal } from "@/features/analyzer/technique-detection/AlgorithmTechniqueModal";
import { detectTechniqueFromAst } from "@/features/analyzer/technique-detection/detectTechniqueFromAst";

import AALIEIcon from "./AALIEIcon";
import { useParseWorker } from "../hooks/useParseWorker";
import {
  errorsToMarkers,
  registerPseudocodeLanguage,
} from "../lib/monaco-diagnostics";

/**
 * Propiedades del componente AnalyzerEditor.
 */
interface AnalyzerEditorProps {
  readonly initialValue?: string;
  readonly onChange?: (value: string) => void;
  readonly onAstChange?: (ast: Program) => void;
  readonly onParseStatusChange?: (ok: boolean, isParsing: boolean) => void;
  readonly onErrorsChange?: (errors: ParseError[] | undefined) => void;
  readonly height?: string;
  /** Callback para verificar parse (tooltip en esquina) */
  readonly onVerifyParse?: () => void;
  /** Callback para abrir modal AST (tooltip en esquina) */
  readonly onViewAst?: () => void;
  readonly isVerifyingParse?: boolean;
  readonly canViewAst?: boolean;
  readonly hasCode?: boolean;
  /** Resultado de verificar parse: reemplaza icono/color y muestra en tooltip */
  readonly verifyParseResult?: { success: boolean; message: string } | null;
  /** Mostrar botón Ayuda con IA en esquina */
  readonly showAIHelpButton?: boolean;
  readonly onAIHelpClick?: () => void;
  readonly onAnalyze?: () => void;
  readonly topRightActions?: ReactNode;
}

export interface AnalyzerEditorHandle {
  insertSnippet: (snippet: SnippetDefinition) => void;
  focus: () => void;
}

/**
 * Componente de editor de código basado en Monaco Editor.
 * Proporciona un editor de código con syntax highlighting, validación en tiempo real
 * mediante Web Workers, y notificaciones de cambios en el AST y estado de parsing.
 *
 * @param props - Propiedades del editor
 * @returns Componente React del editor de código
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * <AnalyzerEditor
 *   initialValue="factorial(n) BEGIN RETURN 1; END"
 *   onChange={(value) => setCode(value)}
 *   onAstChange={(ast) => setAst(ast)}
 *   onParseStatusChange={(ok, isParsing) => setParseOk(ok)}
 *   onErrorsChange={(errors) => setErrors(errors)}
 *   height="420px"
 * />
 * ```
 */
export const AnalyzerEditor = forwardRef<
  AnalyzerEditorHandle,
  AnalyzerEditorProps
>(function AnalyzerEditor(props, ref) {
  const {
    initialValue = "",
    onChange,
    onAstChange,
    onParseStatusChange,
    onErrorsChange,
    height,
    onVerifyParse,
    onViewAst,
    isVerifyingParse = false,
    canViewAst = false,
    hasCode = true,
    verifyParseResult = null,
    showAIHelpButton = false,
    onAIHelpClick,
    topRightActions,
  } = props;
  const fillHeight = height === undefined || height === "100%";
  const [code, setCode] = useState(initialValue);
  const tManual = useTranslations("analyzer.manualMode");
  const tTechnique = useTranslations("analyzer.techniques");
  const locale = useLocale();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<MonacoReact | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const rafLayoutRef = useRef<number | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [monacoMountKey, setMonacoMountKey] = useState(0);
  const [techniqueModalOpen, setTechniqueModalOpen] = useState(false);
  const didRemountAfterZeroHeightRef = useRef(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const onAnalyzeRef = useRef(props.onAnalyze);
  onAnalyzeRef.current = props.onAnalyze;

  useEffect(() => {
    const syncViewport = () => {
      setIsMobileViewport((globalThis.window?.innerWidth ?? 1024) < 768);
    };
    syncViewport();
    globalThis.window?.addEventListener("resize", syncViewport);
    return () => {
      globalThis.window?.removeEventListener("resize", syncViewport);
    };
  }, []);

  // Sincronizar cambios externos del código
  useEffect(() => {
    setCode(initialValue);
    if (editorRef.current && editorRef.current.getValue() !== initialValue) {
      editorRef.current.setValue(initialValue);
    }
  }, [initialValue]);

  // Si el editor se montó antes de que el layout final estuviera listo (reload responsive),
  // los cambios posteriores de contenido/estado pueden coincidir con recalculo de tamaños.
  // Forzamos un layout adicional para asegurar consistencia.
  useEffect(() => {
    if (!editorRef.current) return;
    const id = requestAnimationFrame(() => {
      editorRef.current?.layout();
    });
    return () => cancelAnimationFrame(id);
  }, [initialValue]);

  // Parsear código con worker
  const parseResult = useParseWorker(code);
  const syntaxHints = useDebouncedSyntaxHints(parseResult);
  const techniqueDetection = useMemo(
    () => detectTechniqueFromAst(parseResult.ast, code, tTechnique),
    [code, parseResult.ast, tTechnique],
  );
  const showTechniqueCard = code.trim().length > 0;

  // Actualizar markers cuando cambien los errores
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    // Convertir errores a markers
    const markers = parseResult.errors
      ? errorsToMarkers(parseResult.errors)
      : [];

    // Actualizar markers
    monaco.editor.setModelMarkers(model, "pseudocode-parser", markers);
  }, [parseResult.errors]);

  // Notificar cambios de AST
  useEffect(() => {
    if (onAstChange && parseResult.ast) {
      onAstChange(parseResult.ast);
    }
  }, [parseResult.ast]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notificar cambios de estado de parsing
  useEffect(() => {
    if (onParseStatusChange) {
      onParseStatusChange(parseResult.ok, parseResult.isParsing);
    }
  }, [parseResult.ok, parseResult.isParsing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notificar cambios de errores
  useEffect(() => {
    if (onErrorsChange) {
      onErrorsChange(parseResult.errors);
    }
  }, [parseResult.errors]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEditorReady || !monacoRef.current) {
      return;
    }

    registerPseudocodeCompletionProvider(monacoRef.current, locale);
  }, [isEditorReady, locale]);

  /**
   * Maneja el montaje del editor y configura el lenguaje pseudocódigo.
   * @param editor - Instancia del editor de Monaco
   * @param monaco - Instancia de Monaco
   * @author Juan Camilo Cruz Parra (@Cruz1122)
   */
  function handleEditorDidMount(
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: MonacoReact,
  ) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    // Registrar lenguaje pseudocódigo
    registerPseudocodeLanguage(monaco);
    registerPseudocodeCompletionProvider(monaco, locale);
    registerPseudocodeCommands(editor, monaco, onAnalyzeRef);

    // Aplicar tema
    monaco.editor.setTheme("pseudocode-theme");

    // Monaco a veces monta con tamaño incorrecto en contenedores flex/percent
    // (p.ej. al recargar en modo responsive). Fuerza un layout tras el paint.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          editor.layout();
        } catch {
          // Monaco puede lanzar si todavía no está listo; en ese caso el RO lo reintentará.
        }
      });
    });
  }

  // Recalcula el layout del editor cuando el tamaño del contenedor cambia.
  useEffect(() => {
    if (!isEditorReady) return;
    if (!editorRef.current) return;
    const container = editorContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (!editorRef.current) return;
      const boxHeight = container.getBoundingClientRect().height;

      // Si el primer montaje vino "con altura 0" (comprimido), un remount
      // asegura que el wrapper interno de Monaco calcule tamaño bien.
      if (!didRemountAfterZeroHeightRef.current && boxHeight >= 120) {
        didRemountAfterZeroHeightRef.current = true;
        setMonacoMountKey((k) => k + 1);
      }
      if (rafLayoutRef.current != null)
        cancelAnimationFrame(rafLayoutRef.current);
      rafLayoutRef.current = requestAnimationFrame(() => {
        editorRef.current?.layout();
      });
    });

    ro.observe(container);
    return () => {
      ro.disconnect();
      if (rafLayoutRef.current != null)
        cancelAnimationFrame(rafLayoutRef.current);
      rafLayoutRef.current = null;
    };
  }, [isEditorReady]);

  const monacoHeightProp = fillHeight ? "100%" : (height ?? "100%");
  const suggestFontSize = isMobileViewport ? 11 : 13;
  const suggestLineHeight = isMobileViewport ? 18 : 22;
  const editorPadding =
    topRightActions != null || onVerifyParse != null || onViewAst != null
      ? { top: 44, bottom: 88 }
      : { top: 20, bottom: 84 };
  const hasLocalParseErrors =
    Boolean(code.trim()) &&
    !parseResult.isParsing &&
    !parseResult.ok &&
    (parseResult.errors?.length ?? 0) > 0;
  const localParseTooltip =
    syntaxHints[0]?.message ??
    parseResult.errors?.[0]?.message ??
    tManual("verifyParse");

  /**
   * Maneja los cambios en el contenido del editor.
   * @param value - Nuevo valor del editor
   * @author Juan Camilo Cruz Parra (@Cruz1122)
   */
  function handleEditorChange(value = "") {
    setCode(value);
    if (onChange) {
      onChange(value);
    }
  }

  useImperativeHandle(ref, () => ({
    insertSnippet(snippet) {
      if (!editorRef.current) return;
      insertSnippetIntoEditor(editorRef.current, snippet, locale);
    },
    focus() {
      editorRef.current?.focus();
    },
  }));

  return (
    <div className="relative flex h-full min-h-0 flex-1 basis-0 flex-col">
      {/* Botones fuera del overflow-hidden para que los tooltips no se recorten */}
      {(topRightActions != null ||
        onVerifyParse != null ||
        onViewAst != null ||
        showAIHelpButton) && (
        <div className="absolute top-2 right-5 z-20 flex items-center gap-1">
          {showAIHelpButton && onAIHelpClick != null && (
            <div className="rounded-full bg-[#101820] p-0.5 shadow-lg">
              <button
                type="button"
                onClick={onAIHelpClick}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/12 text-purple-300/70 transition-all duration-300 ease-out hover:bg-purple-500/25 hover:text-purple-300 animate-pulse-slow"
                title={tManual("aiHelp")}
              >
                <AALIEIcon size={20} />
              </button>
            </div>
          )}
          {onVerifyParse != null && (
            <div className="rounded-full bg-[#101820] p-0.5 shadow-lg">
              <button
                type="button"
                onClick={onVerifyParse}
                disabled={isVerifyingParse || !hasCode}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-40 ${
                  verifyParseResult != null
                    ? verifyParseResult.success
                      ? "border border-emerald-500/20 bg-emerald-500/12 text-emerald-300/70 hover:bg-emerald-500/25 hover:text-emerald-300"
                      : "border border-red-500/20 bg-red-500/12 text-red-300/70 hover:bg-red-500/25 hover:text-red-300"
                    : hasLocalParseErrors
                      ? "animate-pulse-slow border border-red-500/20 bg-red-500/12 text-red-300/70 hover:bg-red-500/25 hover:text-red-300"
                      : "border border-blue-500/20 bg-blue-500/12 text-blue-300/70 hover:bg-blue-500/25 hover:text-blue-300"
                }`}
                title={
                  verifyParseResult?.message ??
                  (hasLocalParseErrors
                    ? localParseTooltip
                    : tManual("verifyParse"))
                }
              >
                {isVerifyingParse ? (
                  <span
                    className="material-symbols-outlined animate-spin"
                    style={{ fontSize: 16 }}
                  >
                    progress_activity
                  </span>
                ) : verifyParseResult != null ? (
                  <span
                    key={verifyParseResult.success ? "ok" : "err"}
                    className="material-symbols-outlined animate-fade-in"
                    style={{ fontSize: 16 }}
                  >
                    {verifyParseResult.success ? "check_circle" : "error"}
                  </span>
                ) : hasLocalParseErrors ? (
                  <span className="text-[16px] font-bold leading-none">!</span>
                ) : (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16 }}
                  >
                    check_circle
                  </span>
                )}
              </button>
            </div>
          )}
          {onViewAst != null && (
            <div className="rounded-full bg-[#101820] p-0.5 shadow-lg">
              <button
                type="button"
                onClick={onViewAst}
                disabled={!canViewAst}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/12 text-amber-300/70 transition-all duration-300 ease-out hover:bg-amber-500/25 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                title={tManual("viewAst")}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16 }}
                >
                  account_tree
                </span>
              </button>
            </div>
          )}
          {topRightActions}
        </div>
      )}
      {/* Editor: glass-card-editor sin hover difuminado */}
      <div
        ref={editorContainerRef}
        className="glass-card glass-card-editor relative !z-0 flex h-full min-h-0 flex-1 basis-0 w-full overflow-hidden rounded-xl"
      >
        <MonacoEditor
          key={monacoMountKey}
          height={monacoHeightProp}
          defaultLanguage="pseudocode"
          defaultValue={initialValue}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
                  <div className="absolute w-6 h-6 bg-blue-500 rounded-full" />
                </div>
                <span className="text-sm text-slate-300 font-medium">
                  Cargando editor...
                </span>
              </div>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            rulers: [],
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: "selection",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            roundedSelection: true,
            padding: editorPadding,
            lineHeight: 1.6,
            bracketPairColorization: {
              enabled: true,
            },
            guides: {
              indentation: true,
              bracketPairs: true,
            },
            renderLineHighlight: "none",
            wordBasedSuggestions: "off",
            suggestFontSize,
            suggestLineHeight,
            suggest: {
              showWords: false,
            },
          }}
        />
        {showTechniqueCard && (
          <AlgorithmTechniqueCard
            detection={techniqueDetection}
            onOpenDetails={() => setTechniqueModalOpen(true)}
          />
        )}
      </div>
      <AlgorithmTechniqueModal
        open={techniqueModalOpen}
        onOpenChange={setTechniqueModalOpen}
        detection={techniqueDetection}
      />
    </div>
  );
});
