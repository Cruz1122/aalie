import { SnippetGrid } from "./SnippetGrid";
import type { SnippetDefinition } from "../catalog/snippetCatalog";

interface SupportPanelSectionProps {
  readonly snippets: readonly SnippetDefinition[];
  readonly onInsert: (snippet: SnippetDefinition) => void;
  readonly locale: string;
  readonly onHighlight: (snippet: SnippetDefinition) => void;
  readonly onClearHighlight: () => void;
}

export function SupportPanelSection({
  snippets,
  onInsert,
  locale,
  onHighlight,
  onClearHighlight,
}: Readonly<SupportPanelSectionProps>) {
  return (
    <section className="flex h-full min-h-0 flex-col">
      <SnippetGrid
        snippets={snippets}
        onInsert={onInsert}
        locale={locale}
        onHighlight={onHighlight}
        onClearHighlight={onClearHighlight}
      />
    </section>
  );
}
