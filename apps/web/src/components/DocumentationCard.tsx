"use client";

import { Eye, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useMemo } from "react";

import { DocumentationSection, ModalImageData } from "@/types/documentation";

import { DocumentationIcon, getIconConfig } from "./DocumentationIcons";

interface DocumentationCardProps {
  section: DocumentationSection;
  onOpenSection: (section: DocumentationSection) => void; // abre modal con el contenido
  /** opcional, si quieres seguir abriendo un visor de imagen (diagramas) */
  onImageClick?: (imageData: ModalImageData) => void;
  /** longitud máxima de la descripción visible en la card */
  maxDescriptionChars?: number;
}

function truncate(text: string, max = 100) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export const DocumentationCard = memo<DocumentationCardProps>(
  ({ section, onOpenSection, onImageClick, maxDescriptionChars = 100 }) => {
    const t = useTranslations("documentation.technical");
    const iconConfig = getIconConfig(section.id);
    const shortDescription = useMemo(() => {
      if (section.descriptionKey) {
        return t(`descriptions.${section.descriptionKey}`);
      }
      return truncate(section.description || "", maxDescriptionChars);
    }, [section.descriptionKey, section.description, maxDescriptionChars, t]);

    const handlePrimaryClick = () => {
      // Abrimos SIEMPRE modal con el contenido completo de la sección
      onOpenSection(section);
    };

    const handleImageClick = () => {
      if (section.image && onImageClick) {
        onImageClick({
          src: section.image.src,
          alt: section.image.alt,
          width: section.image.width,
          height: section.image.height,
        });
      }
    };

    const hasDiagram = Boolean(section.image && onImageClick);

    return (
      <article
        className="documentation-card glass-card p-4 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-white/10 h-[300px] flex flex-col"
        aria-labelledby={`doc-card-${section.id}-title`}
      >
        <div className="documentation-card-content flex-1 flex flex-col items-center justify-center text-center min-h-0">
          {/* Header centrado */}
          <header className="flex flex-col items-center gap-2 mb-3">
            <DocumentationIcon sectionId={section.id} size={36} />
            <h2
              id={`doc-card-${section.id}-title`}
              className="text-base font-bold text-white leading-tight line-clamp-2"
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
          <p className="text-xs text-dark-text leading-snug line-clamp-2 mb-4 max-w-full">
            {shortDescription}
          </p>

          {/* Área de botones */}
          <div className="flex items-center justify-center gap-2 min-h-[40px] shrink-0">
            <button
              onClick={handlePrimaryClick}
              className={`
                inline-flex items-center gap-1.5 px-3 py-2 rounded-lg
                border transition-all duration-200 font-medium text-xs shrink-0
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                hover:scale-105 active:scale-95
                ${iconConfig.color.replace("text-", "focus:ring-")}
                ${iconConfig.bgColor} hover:brightness-110
                ${iconConfig.color} hover:text-white
                border-current/30 hover:border-current/50
              `}
              aria-label={
                section.titleKey
                  ? t("viewDetails") + " " + t(`sections.${section.titleKey}`)
                  : t("viewDetails") + " " + section.title
              }
            >
              <Info size={14} strokeWidth={2} />
              {t("viewDetails")}
            </button>
            {hasDiagram && (
              <button
                onClick={handleImageClick}
                className="
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-lg shrink-0
                  border border-white/20 text-slate-300 hover:text-white
                  hover:bg-white/5 hover:border-white/30 transition-all duration-200 font-medium text-xs
                  focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-gray-900
                  hover:scale-105 active:scale-95
                "
                aria-label={
                  section.titleKey
                    ? t("viewDiagram") + " " + t(`sections.${section.titleKey}`)
                    : t("viewDiagram") + " " + section.title
                }
              >
                <Eye size={14} strokeWidth={2} />
                {t("viewDiagram")}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  },
);

DocumentationCard.displayName = "DocumentationCard";
