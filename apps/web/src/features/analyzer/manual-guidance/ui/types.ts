export interface ManualEditorActions {
  insertSnippet(snippetId: string): void;
  insertSnippetAtCursor(snippetId: string): void;
  wrapSelection(snippetId: string): void;
  focusEditor(): void;
  focusAlgorithmBody?(): void;
  insertTextAtCursor?(text: string): void;
  insertParameterAtProcedure?(parameter: string): void;
}
