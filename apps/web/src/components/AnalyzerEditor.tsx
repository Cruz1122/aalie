"use client";
import type { Program } from "@aa/types";
import MonacoEditor, { Monaco as MonacoReact } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useEffect, useRef, useState } from "react";

import { useParseWorker } from "../hooks/useParseWorker";
import {
  errorsToMarkers,
  registerPseudocodeLanguage,
} from "../lib/monaco-diagnostics";

interface AnalyzerEditorProps {
  readonly initialValue?: string;
  readonly onChange?: (value: string) => void;
  readonly onAstChange?: (ast: Program) => void;
  readonly onParseStatusChange?: (ok: boolean, isParsing: boolean) => void;
  readonly height?: string;
  readonly showToolbar?: boolean;
}

export function AnalyzerEditor(props: AnalyzerEditorProps) {
  const {
    initialValue = "",
    onChange,
    onAstChange,
    onParseStatusChange,
    height,
    showToolbar = true,
  } = props;
  const [code, setCode] = useState(initialValue);
  const [showAstModal, setShowAstModal] = useState(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = useRef<MonacoReact | null>(null);

  // Parsear código con worker
  const parseResult = useParseWorker(code);

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
  }, [parseResult.ast, onAstChange]);

  // Notificar cambios de estado de parsing
  useEffect(() => {
    if (onParseStatusChange) {
      onParseStatusChange(parseResult.ok, parseResult.isParsing);
    }
  }, [parseResult.ok, parseResult.isParsing, onParseStatusChange]);

  function handleEditorDidMount(
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: MonacoReact
  ) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Registrar lenguaje pseudocódigo
    registerPseudocodeLanguage(monaco);

    // Aplicar tema
    monaco.editor.setTheme("pseudocode-theme");
  }

  function handleEditorChange(value = "") {
    setCode(value);
    if (onChange) {
      onChange(value);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Editor con borde glass */}
      <div className="glass-card rounded-xl overflow-hidden">
        <MonacoEditor
          height={height || "300px"}
          defaultLanguage="pseudocode"
          defaultValue={initialValue}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-300 font-medium">Cargando editor...</span>
              </div>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Spline Sans', 'Noto Sans', 'Monaco', 'Menlo', 'Consolas', monospace",
            fontLigatures: true,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            rulers: [],
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            renderWhitespace: "selection",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            roundedSelection: true,
            padding: { top: 16, bottom: 16 },
            lineHeight: 1.6,
            letterSpacing: 0.5,
            bracketPairColorization: {
              enabled: true,
            },
            guides: {
              indentation: true,
              bracketPairs: true,
            },
          }}
        />
      </div>

      {/* Modal AST con estilo glass */}
      {showAstModal && parseResult.ast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-modal-overlay modal-animate-in">
          <div className="glass-modal-container rounded-2xl shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col m-4 modal-animate-in">
            {/* Header con estilo glass */}
            <div className="glass-modal-header flex items-center justify-between px-6 py-4 rounded-t-2xl border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                AST (Abstract Syntax Tree)
              </h2>
              <button
                onClick={() => setShowAstModal(false)}
                className="text-slate-400 hover:text-white text-3xl leading-none transition-colors hover:rotate-90 transform duration-200"
              >
                ×
              </button>
            </div>

            {/* Content con scroll personalizado */}
            <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
              <pre className="text-sm bg-slate-900/50 text-emerald-300 p-6 rounded-xl border border-white/10 overflow-x-auto font-mono backdrop-blur-sm">
                {JSON.stringify(parseResult.ast, null, 2)}
              </pre>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 rounded-b-2xl">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(parseResult.ast, null, 2)
                  );
                }}
                className="glass-secondary px-5 py-2.5 text-sm font-semibold text-slate-200 rounded-lg transition-all hover:scale-105"
              >
                Copiar JSON
              </button>
              <button
                onClick={() => setShowAstModal(false)}
                className="glass-button px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all hover:scale-105"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

