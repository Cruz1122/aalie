import type * as Monaco from "monaco-editor";

import { buildMonacoSnippet } from "./buildMonacoSnippet";
import {
  buildCompletionCandidates,
  type CompletionCandidate,
} from "./completionCandidates";

const REGISTERED_COMPLETION_PROVIDERS = new WeakMap<
  typeof Monaco,
  Monaco.IDisposable
>();

function buildIdentifierCompletion(
  monaco: typeof Monaco,
  candidate: Extract<CompletionCandidate, { type: "identifier" }>,
  range: Monaco.IRange,
): Monaco.languages.CompletionItem {
  const detail =
    candidate.identifierKind === "parameter" ? "Parameter" : "Variable";
  const sortText = candidate.identifierKind === "parameter" ? "00000" : "00001";

  return {
    label: candidate.label,
    detail,
    documentation: `${detail} detected in the current algorithm.`,
    kind:
      candidate.identifierKind === "parameter"
        ? monaco.languages.CompletionItemKind.Variable
        : monaco.languages.CompletionItemKind.Field,
    insertText: candidate.label,
    range,
    sortText,
    filterText: candidate.label,
  };
}

export function registerPseudocodeCompletionProvider(
  monaco: typeof Monaco,
  locale = "es",
) {
  const previous = REGISTERED_COMPLETION_PROVIDERS.get(monaco);
  previous?.dispose();

  const disposable = monaco.languages.registerCompletionItemProvider(
    "pseudocode",
    {
      triggerCharacters:
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const prefix = word.word;
        const candidates = buildCompletionCandidates(
          model.getValue(),
          prefix,
          locale,
        );

        return {
          suggestions: candidates.map((candidate) =>
            candidate.type === "identifier"
              ? buildIdentifierCompletion(monaco, candidate, range)
              : buildMonacoSnippet(monaco, candidate.snippet, range, locale),
          ),
        };
      },
    },
  );

  REGISTERED_COMPLETION_PROVIDERS.set(monaco, disposable);
  return disposable;
}
