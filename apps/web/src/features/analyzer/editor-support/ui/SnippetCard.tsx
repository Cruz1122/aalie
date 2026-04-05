import type { SnippetDefinition } from "../catalog/snippetCatalog";
import { localizeSnippet } from "../catalog/snippetCatalog";

interface SnippetCardProps {
  readonly snippet: SnippetDefinition;
  readonly onInsert: (snippet: SnippetDefinition) => void;
  readonly locale: string;
  readonly onHighlight: (snippet: SnippetDefinition) => void;
  readonly onClearHighlight: () => void;
}

export function SnippetCard({
  snippet,
  onInsert,
  locale,
  onHighlight,
  onClearHighlight,
}: Readonly<SnippetCardProps>) {
  const localizedSnippet = localizeSnippet(snippet, locale);
  return (
    <button
      type="button"
      onClick={() => onInsert(snippet)}
      onMouseEnter={() => onHighlight(snippet)}
      onFocus={() => onHighlight(snippet)}
      onMouseLeave={onClearHighlight}
      onBlur={onClearHighlight}
      className="group relative flex min-h-[64px] items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 p-3 text-center transition-all hover:scale-[1.01] hover:border-blue-500/30 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-500/30 focus:bg-blue-500/20"
      aria-label={`${localizedSnippet.label}. ${localizedSnippet.documentationShort}`}
    >
      <span className="text-sm font-semibold text-white">
        {localizedSnippet.shortLabel}
      </span>
    </button>
  );
}
