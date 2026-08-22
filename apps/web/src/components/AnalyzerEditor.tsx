"use client";
import type { ParseError, Program } from "@aa/types";
import MonacoEditor, { Monaco as MonacoReact } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useLocale, useTranslations } from "next-intl";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getSnippetById,
  type SnippetDefinition,
} from "@/features/analyzer/editor-support/catalog/snippetCatalog";
import {
  insertSnippetIntoEditor,
} from "@/features/analyzer/editor-support/monaco/contextInsertionRules";
import { registerPseudocodeCommands } from "@/features/analyzer/editor-support/monaco/registerPseudocodeCommands";
import { registerPseudocodeCompletionProvider } from "@/features/analyzer/editor-support/monaco/registerPseudocodeCompletionProvider";
import {
  registerPseudocodeInlineCompletionProvider,
} from "@/features/analyzer/editor-support/monaco/registerPseudocodeInlineCompletionProvider";
import { useDebouncedSyntaxHints } from "@/features/analyzer/editor-support/parser/validateSourceDebounced";
import {
  resolveEditorContext,
  type EditorContext,
  type EditorCursor,
  type EditorSelection,
} from "@/features/analyzer/manual-guidance";
import type {
  GuidanceRecommendation,
} from "@/features/analyzer/manual-guidance/recommendations";
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
  /** Contexto puro del editor para consumidores no visuales. */
  readonly onEditorContextChange?: (context: EditorContext) => void;
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
  readonly activeRecommendation?: GuidanceRecommendation | null;
  readonly topRightActions?: ReactNode;
}

export interface AnalyzerEditorHandle {
  insertSnippet: (snippet: SnippetDefinition) => void;
  insertSnippetAtCursor: (snippetId: string) => void;
  wrapSelection: (snippetId: string) => void;
  insertTextAtCursor: (text: string) => void;
  insertParameterAtProcedure: (parameter: string) => void;
  focusAlgorithmBody: () => void;
  prepareAlgorithmBlockInsertion: () => void;
  prepareReturnInsertion: () => void;
  focus: () => void;
}

function findMatchingEndOffset(source: string, beginOffset: number) {
  const blockTokenPattern = /\bBEGIN\b|\bEND\b/gi;
  blockTokenPattern.lastIndex = beginOffset;
  let depth = 0;
  let match = blockTokenPattern.exec(source);

  while (match) {
    if (match[0].toUpperCase() === "BEGIN") {
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) return match.index;
    }
    match = blockTokenPattern.exec(source);
  }

  return null;
}

interface BlockRange {
  readonly beginOffset: number;
  readonly endOffset: number;
  readonly endEndOffset: number;
}

function findBlockRanges(source: string): BlockRange[] {
  const tokenPattern = /\bBEGIN\b|\bEND\b/gi;
  const openBlocks: number[] = [];
  const ranges: BlockRange[] = [];
  let match = tokenPattern.exec(source);

  while (match) {
    if (match[0].toUpperCase() === "BEGIN") {
      openBlocks.push(match.index);
    } else {
      const beginOffset = openBlocks.pop();
      if (beginOffset !== undefined) {
        ranges.push({
          beginOffset,
          endOffset: match.index,
          endEndOffset: match.index + match[0].length,
        });
      }
    }
    match = tokenPattern.exec(source);
  }

  return ranges;
}

function findSelectedBlock(
  source: string,
  selectionStart: number,
  selectionEnd: number,
): BlockRange | null {
  const ranges = findBlockRanges(source);
  const selectionLineStart = source.lastIndexOf("\n", selectionStart - 1) + 1;
  const headerBlock = ranges
    .filter((block) => {
      const blockLineStart = source.lastIndexOf("\n", block.beginOffset - 1) + 1;
      return (
        blockLineStart === selectionLineStart &&
        block.beginOffset >= selectionEnd
      );
    })
    .sort((left, right) => left.beginOffset - right.beginOffset)[0];
  if (headerBlock) return headerBlock;

  const containingSelection = ranges
    .filter(
      (block) =>
        block.beginOffset <= selectionStart &&
        block.endEndOffset >= selectionEnd,
    )
    .sort(
      (left, right) =>
        left.endEndOffset - left.beginOffset -
        (right.endEndOffset - right.beginOffset),
    );
  if (containingSelection[0]) return containingSelection[0];

  return (
    ranges
      .filter(
        (block) =>
          block.beginOffset >= selectionStart &&
          block.endEndOffset <= selectionEnd,
      )
      .sort(
        (left, right) =>
          Math.abs(left.beginOffset - selectionStart) +
          Math.abs(left.endEndOffset - selectionEnd) -
          (Math.abs(right.beginOffset - selectionStart) +
            Math.abs(right.endEndOffset - selectionEnd)),
      )[0] ?? null
  );
}

function getAlgorithmBodyPosition(
  model: Monaco.editor.ITextModel,
): { lineNumber: number; column: number } | null {
  const source = model.getValue();
  const beginMatch = /\bBEGIN\b/i.exec(source);
  if (!beginMatch || beginMatch.index === undefined) return null;

  const beginEndOffset = beginMatch.index + beginMatch[0].length;
  const firstBodyLineBreak = source.indexOf("\n", beginEndOffset);
  if (firstBodyLineBreak < 0) {
    return model.getPositionAt(beginEndOffset);
  }

  const firstBodyLineStart = firstBodyLineBreak + 1;
  const nextLineBreak = source.indexOf("\n", firstBodyLineStart);
  const firstBodyLine = source.slice(
    firstBodyLineStart,
    nextLineBreak < 0 ? source.length : nextLineBreak,
  );
  const leadingWhitespace = firstBodyLine.match(/^[ \t]*/)?.[0] ?? "";

  return model.getPositionAt(firstBodyLineStart + leadingWhitespace.length);
}

function getAlgorithmBodyEndPosition(
  model: Monaco.editor.ITextModel,
): { lineNumber: number; column: number } | null {
  const source = model.getValue();
  const beginMatch = /\bBEGIN\b/i.exec(source);
  if (!beginMatch || beginMatch.index === undefined) return null;

  const closingOffset = findMatchingEndOffset(source, beginMatch.index);
  if (closingOffset === null) return null;

  const closingPosition = model.getPositionAt(closingOffset);
  const beginPosition = model.getPositionAt(beginMatch.index);
  for (
    let lineNumber = closingPosition.lineNumber - 1;
    lineNumber >= beginPosition.lineNumber;
    lineNumber -= 1
  ) {
    const lineContent = model.getLineContent(lineNumber);
    if (lineContent.trim()) {
      return {
        lineNumber,
        column: lineContent.length + 1,
      };
    }
  }

  return closingPosition;
}

function getElseBranchBlocks(
  source: string,
  selectedBlock: BlockRange,
): BlockRange[] {
  const ranges = findBlockRanges(source).sort(
    (left, right) => left.beginOffset - right.beginOffset,
  );
  const selectedIndex = ranges.findIndex(
    (range) =>
      range.beginOffset === selectedBlock.beginOffset &&
      range.endOffset === selectedBlock.endOffset,
  );
  if (selectedIndex < 0) return [selectedBlock];

  const isElsePair = (left: BlockRange, right: BlockRange) =>
    /^\s*ELSE\s*$/i.test(
      source.slice(left.endEndOffset, right.beginOffset),
    );

  const nextRange = ranges
    .slice(selectedIndex + 1)
    .find((range) => isElsePair(selectedBlock, range));
  if (nextRange) return [selectedBlock, nextRange];

  const previousRange = [...ranges.slice(0, selectedIndex)]
    .reverse()
    .find((range) => isElsePair(range, selectedBlock));
  if (previousRange) return [previousRange, selectedBlock];

  return [selectedBlock];
}

function getBlockBodyEndPosition(
  model: Monaco.editor.ITextModel,
  block: BlockRange,
): { lineNumber: number; column: number } {
  const closingPosition = model.getPositionAt(block.endOffset);
  const beginPosition = model.getPositionAt(block.beginOffset);

  for (
    let lineNumber = closingPosition.lineNumber - 1;
    lineNumber > beginPosition.lineNumber;
    lineNumber -= 1
  ) {
    const lineContent = model.getLineContent(lineNumber);
    if (lineContent.trim()) {
      return {
        lineNumber,
        column: lineContent.length + 1,
      };
    }
  }

  if (closingPosition.lineNumber > beginPosition.lineNumber) {
    const firstBodyLine = beginPosition.lineNumber + 1;
    const firstBodyContent = model.getLineContent(firstBodyLine);
    return {
      lineNumber: firstBodyLine,
      column: (firstBodyContent.match(/^[ \t]*/)?.[0].length ?? 0) + 1,
    };
  }

  return closingPosition;
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
    onEditorContextChange,
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
    activeRecommendation = null,
  } = props;
  const fillHeight = height === undefined || height === "100%";
  const [code, setCode] = useState(initialValue);
  const tManual = useTranslations("analyzer.manualMode");
  const tTechnique = useTranslations("analyzer.techniques");
  const locale = useLocale();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<MonacoReact | null>(null);
  const editorListenersRef = useRef<Array<{ dispose: () => void }>>([]);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const rafLayoutRef = useRef<number | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [monacoMountKey, setMonacoMountKey] = useState(0);
  const [techniqueModalOpen, setTechniqueModalOpen] = useState(false);
  const didRemountAfterZeroHeightRef = useRef(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [editorCursor, setEditorCursor] = useState<EditorCursor>({
    line: 1,
    column: 0,
    offset: 0,
  });
  const [editorSelection, setEditorSelection] = useState<EditorSelection>();
  const onAnalyzeRef = useRef(props.onAnalyze);
  onAnalyzeRef.current = props.onAnalyze;
  const editorContextRef = useRef<EditorContext | null>(null);
  const activeRecommendationRef =
    useRef<GuidanceRecommendation | null>(null);

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

  // Ref para distinguir cambios internos (desde el editor) vs externos (desde el padre)
  const isInternalChangeRef = useRef(false);

  // Sincronizar cambios externos del código (e.g. resetear plantilla, cargar archivo)
  // Omitimos setValue() porque el editor ya tiene el valor cuando el cambio es interno.
  // El flag isInternalChangeRef evita doble-sincronización en el mismo ciclo.
  useEffect(() => {
    setCode(initialValue);
    if (
      !isInternalChangeRef.current &&
      editorRef.current &&
      editorRef.current.getValue() !== initialValue
    ) {
      editorRef.current.setValue(initialValue);
    }
    isInternalChangeRef.current = false;
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
  const editorContext = useMemo(() => {
    const parseStatus =
      code.trim().length === 0
        ? "idle"
        : parseResult.isParsing
          ? "pending"
          : parseResult.ok
            ? "valid"
            : "invalid";

    return resolveEditorContext({
      source: code,
      cursor: editorCursor,
      selection: editorSelection,
      parseResult: {
        status: parseStatus,
        errors: parseResult.errors,
      },
      ast: parseResult.ast,
    });
  }, [
    code,
    editorCursor,
    editorSelection,
    parseResult.ast,
    parseResult.errors,
    parseResult.isParsing,
    parseResult.ok,
  ]);

  useEffect(() => {
    onEditorContextChange?.(editorContext);
  }, [editorContext, onEditorContextChange]);

  useEffect(() => {
    editorContextRef.current = editorContext;
    activeRecommendationRef.current = activeRecommendation;
  }, [activeRecommendation, editorContext]);

  useEffect(() => {
    return () => {
      for (const listener of editorListenersRef.current) listener.dispose();
      editorListenersRef.current = [];
    };
  }, []);

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

  useEffect(() => {
    if (!isEditorReady || !monacoRef.current) return;

    const disposable = registerPseudocodeInlineCompletionProvider(
      monacoRef.current,
      () => ({
        context: editorContextRef.current,
        recommendation: activeRecommendationRef.current,
        locale,
      }),
    );
    return () => disposable.dispose();
  }, [isEditorReady, locale]);

  useEffect(() => {
    if (!isEditorReady || !editorRef.current) return;

    const editor = editorRef.current;
    editor.trigger("editor-support", "editor.action.inlineSuggest.hide", {});
    if (!activeRecommendation) return;

    const frame = globalThis.window.requestAnimationFrame(() => {
      editor.trigger("editor-support", "editor.action.inlineSuggest.trigger", {});
    });
    return () => globalThis.window.cancelAnimationFrame(frame);
  }, [
    activeRecommendation?.action,
    activeRecommendation?.id,
    activeRecommendation?.intent,
    activeRecommendation?.priority,
    activeRecommendation?.reason,
    activeRecommendation?.snippetId,
    code,
    editorContext.cursor.offset,
    editorContext.location.primary,
    isEditorReady,
    locale,
  ]);

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

    for (const listener of editorListenersRef.current) listener.dispose();
    const syncEditorPosition = () => {
      const model = editor.getModel();
      const position = editor.getPosition();
      const selection = editor.getSelection();
      if (!model || !position) return;

      setEditorCursor({
        line: position.lineNumber,
        column: Math.max(0, position.column - 1),
        offset: model.getOffsetAt(position),
      });

      if (!selection) {
        setEditorSelection(undefined);
        return;
      }

      const startOffset = model.getOffsetAt({
        lineNumber: selection.startLineNumber,
        column: selection.startColumn,
      });
      const endOffset = model.getOffsetAt({
        lineNumber: selection.endLineNumber,
        column: selection.endColumn,
      });
      setEditorSelection({
        active: startOffset !== endOffset,
        text: model.getValueInRange(selection),
        startOffset: Math.min(startOffset, endOffset),
        endOffset: Math.max(startOffset, endOffset),
      });
    };

    editorListenersRef.current = [
      editor.onDidChangeCursorPosition(syncEditorPosition),
      editor.onDidChangeCursorSelection(syncEditorPosition),
    ];
    syncEditorPosition();

    // Mantener el proveedor actualizado también durante HMR/remontajes.
    registerPseudocodeLanguage(monaco);
    registerPseudocodeCompletionProvider(monaco, locale);
    registerPseudocodeCommands(
      editor,
      monaco,
      onAnalyzeRef,
    );

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

  function handleEditorWillMount(monaco: MonacoReact) {
    // Registrar el lenguaje antes de crear el modelo para que Monaco
    // tokenice correctamente desde el primer render.
    registerPseudocodeLanguage(monaco);
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
   * Envuelto en useCallback para mantener referencia estable y evitar que
   * @monaco-editor/react des-registre y re-registre el listener onDidChangeModelContent
   * en cada tecleo.
   * @param value - Nuevo valor del editor
   * @author Juan Camilo Cruz Parra (@Cruz1122)
   */
  const handleEditorChange = useCallback(
    (value = "") => {
      isInternalChangeRef.current = true;
      setCode(value);
      if (onChange) {
        onChange(value);
      }
    },
    [onChange],
  );

  useImperativeHandle(ref, () => ({
    insertSnippet(snippet) {
      if (!editorRef.current) return;
      insertSnippetIntoEditor(editorRef.current, snippet, locale);
    },
    insertSnippetAtCursor(snippetId) {
      const editor = editorRef.current;
      const snippet = getSnippetById(snippetId);
      if (!editor || !snippet) return;
      insertSnippetIntoEditor(editor, snippet, locale);
    },
    wrapSelection(snippetId) {
      const editor = editorRef.current;
      const snippet = getSnippetById(snippetId);
      if (!editor || !snippet) return;
      insertSnippetIntoEditor(editor, snippet, locale);
    },
    insertTextAtCursor(text) {
      const editor = editorRef.current;
      const model = editor?.getModel();
      const selection = editor?.getSelection();
      if (!editor || !model || !selection) return;
      editor.focus();
      editor.executeEdits("manual-guidance", [
        { range: selection, text, forceMoveMarkers: true },
      ]);
    },
    insertParameterAtProcedure(parameter) {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model || !parameter.trim()) return;

      const source = model.getValue();
      const procedureMatch = /^\s*[A-Za-z_][A-Za-z0-9_]*\s*\(/gm.exec(
        source,
      );
      if (!procedureMatch || procedureMatch.index === undefined) {
        return;
      }

      const openingOffset = source.indexOf("(", procedureMatch.index);
      const closingOffset = source.indexOf(")", openingOffset + 1);
      if (openingOffset < 0 || closingOffset < 0) return;

      const parameterSection = source.slice(
        openingOffset + 1,
        closingOffset,
      );
      const trailingWhitespace =
        parameterSection.match(/\s*$/)?.[0] ?? "";
      const existingParameters = parameterSection.slice(
        0,
        parameterSection.length - trailingWhitespace.length,
      );
      const insertionOffset = closingOffset - trailingWhitespace.length;
      const normalizedParameters = existingParameters
        .trim()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const replacesDefaultPlaceholder = [
        "parametro",
        "parametros",
        "parameter",
        "parameters",
        "params",
      ].includes(normalizedParameters);
      const separator =
        existingParameters.trim() && !replacesDefaultPlaceholder ? ", " : "";
      const editStartOffset = replacesDefaultPlaceholder
        ? openingOffset + 1
        : insertionOffset;
      const editEndOffset = replacesDefaultPlaceholder
        ? closingOffset
        : insertionOffset;
      const insertionText = replacesDefaultPlaceholder
        ? parameter
        : separator + parameter + trailingWhitespace;
      const insertionPosition = model.getPositionAt(editStartOffset);
      const editEndPosition = model.getPositionAt(editEndOffset);

      editor.focus();
      editor.executeEdits("manual-guidance", [
        {
          range: {
            startLineNumber: insertionPosition.lineNumber,
            startColumn: insertionPosition.column,
            endLineNumber: editEndPosition.lineNumber,
            endColumn: editEndPosition.column,
          },
          text: insertionText,
          forceMoveMarkers: true,
        },
      ]);

      const parameterStart = model.getPositionAt(
        editStartOffset + (replacesDefaultPlaceholder ? 0 : separator.length),
      );
      const parameterEnd = model.getPositionAt(
        editStartOffset +
          (replacesDefaultPlaceholder ? 0 : separator.length) +
          parameter.length,
      );
      editor.setSelection({
        startLineNumber: parameterStart.lineNumber,
        startColumn: parameterStart.column,
        endLineNumber: parameterEnd.lineNumber,
        endColumn: parameterEnd.column,
      });
      editor.revealPositionInCenterIfOutsideViewport(parameterEnd);
    },
    focusAlgorithmBody() {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model || !model.getValue().trim()) return;

      const position = getAlgorithmBodyPosition(model);
      if (!position) return;

      editor.focus();
      editor.setPosition(position);
      editor.setSelection({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      editor.revealPositionInCenterIfOutsideViewport(position);
    },
    prepareAlgorithmBlockInsertion() {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model || !model.getValue().trim()) return;

      // El efecto del tutorial puede ejecutarse más de una vez en desarrollo.
      // Si ya estamos en una línea vacía, no agregamos otra ni desplazamos el
      // punto de inserción.
      const currentPosition = editor.getPosition();
      if (currentPosition) {
        const currentLine = model.getLineContent(currentPosition.lineNumber);
        const beforeCursor = currentLine.slice(0, currentPosition.column - 1);
        const afterCursor = currentLine.slice(currentPosition.column - 1);
        if (!beforeCursor.trim() && !afterCursor.trim()) {
          editor.focus();
          editor.setSelection({
            startLineNumber: currentPosition.lineNumber,
            startColumn: currentPosition.column,
            endLineNumber: currentPosition.lineNumber,
            endColumn: currentPosition.column,
          });
          return;
        }
      }

      const position = getAlgorithmBodyEndPosition(model);
      if (!position) return;

      const lineContent = model.getLineContent(position.lineNumber);
      const lineIndent = lineContent.match(/^[ \t]*/)?.[0] ?? "";
      const positionOffset = model.getOffsetAt(position);
      const isClosingLine = /^END\b/i.test(lineContent.trim());
      const insertionText = isClosingLine
        ? `\n${lineIndent}  `
        : `\n${lineIndent}`;

      editor.focus();
      editor.executeEdits("manual-guidance", [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: insertionText,
          forceMoveMarkers: true,
        },
      ]);

      const nextPosition = model.getPositionAt(
        positionOffset + insertionText.length,
      );
      editor.setPosition(nextPosition);
      editor.setSelection({
        startLineNumber: nextPosition.lineNumber,
        startColumn: nextPosition.column,
        endLineNumber: nextPosition.lineNumber,
        endColumn: nextPosition.column,
      });
      editor.revealPositionInCenterIfOutsideViewport(nextPosition);
    },
    prepareReturnInsertion() {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model || !model.getValue().trim()) return;

      const source = model.getValue();
      const selection = editor.getSelection();
      const selectionStart = selection
        ? model.getOffsetAt({
            lineNumber: selection.startLineNumber,
            column: selection.startColumn,
          })
        : source.length;
      const selectionEnd = selection
        ? model.getOffsetAt({
            lineNumber: selection.endLineNumber,
            column: selection.endColumn,
          })
        : selectionStart;
      const selectedBlock = findSelectedBlock(
        source,
        selectionStart,
        selectionEnd,
      );
      const positions = selectedBlock
        ? getElseBranchBlocks(source, selectedBlock).map((block) =>
            getBlockBodyEndPosition(model, block),
          )
        : [getAlgorithmBodyEndPosition(model)].filter(
            (position): position is { lineNumber: number; column: number } =>
              position !== null,
          );
      if (positions.length === 0) return;

      // Preparar RETURN debe preservar el modelo: solo ubicamos los cursores.
      // La inserción line-based de `return-value` creará una línea por rama
      // al pulsar el botón, evitando reemplazar cualquier selección existente.
      editor.focus();
      editor.setSelections(
        positions.map((position) => ({
          selectionStartLineNumber: position.lineNumber,
          selectionStartColumn: position.column,
          positionLineNumber: position.lineNumber,
          positionColumn: position.column,
        })),
      );
      editor.revealPositionInCenterIfOutsideViewport(positions[0]!);
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
          beforeMount={handleEditorWillMount}
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
            inlineSuggest: {
              enabled: true,
              suppressSuggestions: false,
            },
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
