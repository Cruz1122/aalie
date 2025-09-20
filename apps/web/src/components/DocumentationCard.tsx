import { memo } from 'react';
import { Eye } from 'lucide-react';
import { DocumentationSection, ModalImageData } from '@/types/documentation';
import { DocumentationIcon, getIconConfig } from './DocumentationIcons';

interface DocumentationCardProps {
  section: DocumentationSection;
  onImageClick: (imageData: ModalImageData) => void;
}

export const DocumentationCard = memo<DocumentationCardProps>(({ 
  section, 
  onImageClick 
}) => {
  const handleImageClick = () => {
    onImageClick({
      src: section.image.src,
      alt: section.image.alt,
      width: section.image.width,
      height: section.image.height,
    });
  };

  const iconConfig = getIconConfig(section.id);

  return (
    <article className="documentation-card glass-card p-6 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
      <div className="documentation-card-content">
        {/* Header con ícono */}
        <header className="space-y-4 mb-6">
          <div className="flex justify-center">
            <DocumentationIcon sectionId={section.id} size={56} />
          </div>
          <h2 className="text-xl font-bold text-white leading-tight text-center">
            {section.title}
          </h2>
        </header>
        
        {/* Contenido */}
        <div className="flex-1 space-y-6">
          <p className="text-sm text-dark-text leading-relaxed text-center">
            {section.description}
          </p>
          
          {/* Botón de acción */}
          <div className="flex justify-center">
            <button
              onClick={handleImageClick}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
                border transition-all duration-200 font-medium text-sm
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                hover:scale-105 active:scale-95
                ${iconConfig.color.replace('text-', 'focus:ring-')}
                ${iconConfig.bgColor} hover:brightness-110
                ${iconConfig.color} hover:text-white
                border-current/30 hover:border-current/50
              `}
              aria-label={`Ver diagrama de ${section.title}`}
            >
              <Eye size={16} strokeWidth={2} />
              Ver Diagrama
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-dark-text/80 text-center leading-relaxed">
            {section.image.caption}
          </p>
        </footer>
      </div>
    </article>
  );
});

DocumentationCard.displayName = 'DocumentationCard';