"use client";
import { Eye, Info } from "lucide-react";
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

function truncate(text: string, max = 160) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export const DocumentationCard = memo<DocumentationCardProps>(
  ({ section, onOpenSection, onImageClick, maxDescriptionChars = 180 }) => {
    const iconConfig = getIconConfig(section.id);
    const shortDescription = useMemo(
      () => truncate(section.description || "", maxDescriptionChars),
      [section.description, maxDescriptionChars]
    );

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

    return (
      <article
        className="documentation-card glass-card p-6 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-white/10 h-[480px] flex flex-col"
        aria-labelledby={`doc-card-${section.id}-title`}
      >
        <div className="documentation-card-content flex-1 flex flex-col">
          {/* Header con ícono */}
          <header className="space-y-4 mb-6">
            <div className="flex justify-center">
              <DocumentationIcon sectionId={section.id} size={56} />
            </div>
            <h2
              id={`doc-card-${section.id}-title`}
              className="text-xl font-bold text-white leading-tight text-center min-h-[3rem] flex items-center justify-center"
              title={section.title}
            >
              <span className="line-clamp-2">
                {section.title}
              </span>
            </h2>
          </header>

          {/* Descripción breve (uniforme) */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="mb-6">
              <p className="text-sm text-dark-text leading-relaxed text-center line-clamp-5">
                {shortDescription}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handlePrimaryClick}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
                  border transition-all duration-200 font-medium text-sm
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                  hover:scale-105 active:scale-95
                  ${iconConfig.color.replace("text-", "focus:ring-")}
                  ${iconConfig.bgColor} hover:brightness-110
                  ${iconConfig.color} hover:text-white
                  border-current/30 hover:border-current/50
                `}
                aria-label={`Abrir detalle de ${section.title}`}
              >
                <Info size={16} strokeWidth={2} />
                Ver Detalles
              </button>

              {/* Botón para ver diagrama - mismo tamaño que el principal */}
              {section.image && onImageClick && (
                <button
                  onClick={handleImageClick}
                  className="
                    inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
                    border border-white/20 text-slate-300 hover:text-white
                    hover:bg-white/5 hover:border-white/30 transition-all duration-200 font-medium text-sm
                    focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-gray-900
                    hover:scale-105 active:scale-95
                  "
                  aria-label={`Ver diagrama de ${section.title}`}
                >
                  <Eye size={16} strokeWidth={2} />
                  Ver Diagrama
                </button>
              )}
            </div>
          </div>

          {/* Footer - siempre presente para consistencia */}
          <footer className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <DocumentationIcon sectionId={section.id} size={14} />
                <span className="capitalize">{section.id.replace('-', ' ')}</span>
              </span>
              {section.image ? (
                <span className="text-emerald-400">• Con diagrama</span>
              ) : (
                <span className="text-slate-500">• Solo contenido</span>
              )}
            </div>
            {section.image?.caption && (
              <p className="text-xs text-slate-400/80 text-center leading-relaxed mt-2">
                {section.image.caption}
              </p>
            )}
          </footer>
        </div>
      </article>
    );
  }
);

DocumentationCard.displayName = "DocumentationCard";
