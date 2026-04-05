import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SupportPanelSection } from "./SupportPanelSection";
import {
  getCategorizedSnippets,
  localizeSnippet,
  type SnippetDefinition,
} from "../catalog/snippetCatalog";

interface EditorSupportPanelProps {
  readonly onInsert: (snippet: SnippetDefinition) => void;
  readonly title?: string;
}

const HOVER_RESET_DELAY_MS = 120;
const HELP_PANEL_HEIGHT_PX = 110;

export function EditorSupportPanel({
  onInsert,
  title,
}: Readonly<EditorSupportPanelProps>) {
  const t = useTranslations("analyzer.editorSupport");
  const locale = useLocale();
  const sections = useMemo(() => getCategorizedSnippets(), []);
  const [activeCategory, setActiveCategory] = useState(
    sections[0]?.category ?? "recommended",
  );
  const [highlightedSnippet, setHighlightedSnippet] =
    useState<SnippetDefinition | null>(null);
  const clearHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const activeSection =
    sections.find((section) => section.category === activeCategory) ??
    sections[0] ??
    null;
  const localizedHighlightedSnippet = highlightedSnippet
    ? localizeSnippet(highlightedSnippet, locale)
    : null;
  const helpTitle =
    localizedHighlightedSnippet?.label ?? title ?? t("helpDefaultTitle");
  const helpDetails =
    localizedHighlightedSnippet?.documentationPedagogical ??
    t("helpDefaultDetails");
  const helpExample = localizedHighlightedSnippet
    ? localizedHighlightedSnippet.expectedUseCase
      ? `${t("helpExamplePrefix")} ${localizedHighlightedSnippet.expectedUseCase}`
      : `${t("helpPreviewPrefix")} ${localizedHighlightedSnippet.preview}`
    : null;

  const cancelPendingClear = useCallback(() => {
    if (!clearHighlightTimeoutRef.current) {
      return;
    }
    clearTimeout(clearHighlightTimeoutRef.current);
    clearHighlightTimeoutRef.current = null;
  }, []);

  const handleHighlight = useCallback(
    (snippet: SnippetDefinition) => {
      cancelPendingClear();
      setHighlightedSnippet(snippet);
    },
    [cancelPendingClear],
  );

  const handleClearHighlight = useCallback(() => {
    cancelPendingClear();
    clearHighlightTimeoutRef.current = setTimeout(() => {
      setHighlightedSnippet(null);
      clearHighlightTimeoutRef.current = null;
    }, HOVER_RESET_DELAY_MS);
  }, [cancelPendingClear]);

  useEffect(() => {
    return () => {
      cancelPendingClear();
    };
  }, [cancelPendingClear]);

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-xl border border-white/10 bg-slate-950/45">
      <div
        className="shrink-0 overflow-hidden border-b border-white/10 px-4 py-4"
        style={{
          height: HELP_PANEL_HEIGHT_PX,
          minHeight: HELP_PANEL_HEIGHT_PX,
          maxHeight: HELP_PANEL_HEIGHT_PX,
          flexBasis: HELP_PANEL_HEIGHT_PX,
        }}
      >
        <div className="scrollbar-custom h-full overflow-y-auto pr-1">
          <p className="text-sm font-semibold text-white">{helpTitle}</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">{helpDetails}</p>
          {helpExample && (
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {helpExample}
            </p>
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="pb-1">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))",
            }}
          >
            {sections.map((section) => (
              <button
                key={section.category}
                type="button"
                onClick={() => {
                  cancelPendingClear();
                  setActiveCategory(section.category);
                  setHighlightedSnippet(null);
                }}
                className={`min-h-[38px] rounded-lg border px-2.5 py-1.5 text-[11px] font-medium leading-tight transition sm:text-xs ${
                  section.category === activeCategory
                    ? "border-blue-500/30 bg-blue-500/20 text-white"
                    : "border-slate-500/20 bg-slate-500/10 text-slate-300 hover:border-blue-500/30 hover:bg-blue-500/20 hover:text-white"
                }`}
              >
                {t(`categories.${section.labelKey}`)}
              </button>
            ))}
          </div>
        </div>
        {activeSection && (
          <div className="min-h-0 flex-1">
            <SupportPanelSection
              snippets={activeSection.snippets}
              onInsert={onInsert}
              locale={locale}
              onHighlight={handleHighlight}
              onClearHighlight={handleClearHighlight}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
