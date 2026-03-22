"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useMemo } from "react";

import { DocumentationSection } from "@/types/documentation";

import { DocumentationIcon } from "./DocumentationIcons";

interface DocumentationCardProps {
  section: DocumentationSection;
  onOpenSection: (section: DocumentationSection) => void;
  /** longitud máxima de la descripción visible en la card */
  maxDescriptionChars?: number;
}

function truncate(text: string, max = 100) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export const DocumentationCard = memo<DocumentationCardProps>(
  ({ section, onOpenSection, maxDescriptionChars = 100 }) => {
    const t = useTranslations("documentation.technical");
    const shortDescription = useMemo(() => {
      if (section.descriptionKey) {
        return t(`descriptions.${section.descriptionKey}`);
      }
      return truncate(section.description || "", maxDescriptionChars);
    }, [section.descriptionKey, section.description, maxDescriptionChars, t]);

    const handlePrimaryClick = () => {
      onOpenSection(section);
    };

    return (
      <article
        className="documentation-card glass-card p-4 rounded-lg transition-all duration-200 hover:scale-[1.02] border border-white/10 h-[300px] flex flex-col min-w-0 max-w-full overflow-hidden"
        aria-labelledby={`doc-card-${section.id}-title`}
      >
        <div className="documentation-card-content flex-1 flex flex-col items-center justify-center text-center min-h-0 min-w-0 w-full overflow-hidden px-1">
          {/* Header centrado */}
          <header className="flex flex-col items-center gap-2 mb-3 min-w-0 w-full">
            <DocumentationIcon sectionId={section.id} size={36} />
            <h2
              id={`doc-card-${section.id}-title`}
              className="text-base font-bold text-white leading-tight line-clamp-2 w-full min-w-0 break-words"
              title={
                section.titleKey
                  ? t(`sections.${section.titleKey}`)
                  : section.title
              }
            >
              {section.titleKey
                ? t(`sections.${section.titleKey}`)
                : section.title}
            </h2>
          </header>

          {/* Descripción breve */}
          <p className="text-xs text-dark-text leading-snug line-clamp-2 mb-4 w-full min-w-0 break-words">
            {shortDescription}
          </p>

          {/* Botón Ver detalles */}
          <div className="flex items-center justify-center min-h-[40px] shrink-0">
            <button
              onClick={handlePrimaryClick}
              className="
                inline-flex items-center gap-1.5 px-3 py-2 rounded-lg shrink-0
                border border-slate-500/30 bg-slate-700/50 text-slate-300
                hover:bg-slate-600/50 hover:text-white hover:border-slate-400/50
                transition-all duration-200 font-medium text-xs
                focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 focus:ring-offset-gray-900
                hover:scale-105 active:scale-95
              "
              aria-label={
                section.titleKey
                  ? t("viewDetails") + " " + t(`sections.${section.titleKey}`)
                  : t("viewDetails") + " " + section.title
              }
            >
              <Info size={14} strokeWidth={2} />
              {t("viewDetails")}
            </button>
          </div>
        </div>
      </article>
    );
  },
);

DocumentationCard.displayName = "DocumentationCard";
