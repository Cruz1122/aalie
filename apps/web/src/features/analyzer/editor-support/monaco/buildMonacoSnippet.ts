import type * as Monaco from "monaco-editor";

import {
  getSnippetSearchTerms,
  localizeSnippet,
  type SnippetDefinition,
} from "../catalog/snippetCatalog";

function inferCompletionKind(
  monaco: typeof Monaco,
  snippet: SnippetDefinition,
): Monaco.languages.CompletionItemKind {
  if (snippet.insertKind === "template") {
    return monaco.languages.CompletionItemKind.Module;
  }
  if (snippet.insertKind === "block" || snippet.insertKind === "wrap-selection") {
    return monaco.languages.CompletionItemKind.Snippet;
  }
  return monaco.languages.CompletionItemKind.Keyword;
}

export function buildMonacoSnippet(
  monaco: typeof Monaco,
  snippet: SnippetDefinition,
  range: Monaco.IRange,
  locale = "es",
): Monaco.languages.CompletionItem {
  const localizedSnippet = localizeSnippet(snippet, locale);
  return {
    label: localizedSnippet.label,
    detail: localizedSnippet.preview,
    documentation: {
      value: `${localizedSnippet.documentationShort}\n\n${localizedSnippet.documentationPedagogical}`,
    },
    kind: inferCompletionKind(monaco, snippet),
    insertText: localizedSnippet.insertText,
    insertTextRules:
      monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range,
    sortText: String(10000 - snippet.priority).padStart(5, "0"),
    filterText: getSnippetSearchTerms(snippet, locale).join(" "),
  };
}
