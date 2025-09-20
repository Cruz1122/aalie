import { Eye, Package, ArrowRight, Zap, Settings } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import { DocumentationSection, ModalImageData } from "@/types/documentation";

import { DocumentationIcon, getIconConfig } from "./DocumentationIcons";

interface DocumentationCardProps {
  section: DocumentationSection;
  onImageClick: (imageData: ModalImageData) => void;
}

export const DocumentationCard = memo<DocumentationCardProps>(({ section, onImageClick }) => {
  const handleImageClick = () => {
    if (section.image) {
      onImageClick({
        src: section.image.src,
        alt: section.image.alt,
        width: section.image.width,
        height: section.image.height,
      });
    }
  };

  const iconConfig = getIconConfig(section.id);

  // Renderizar vista especial para showcase UI
  if (section.id === "ui-showcase") {
    return (
      <article className="documentation-card glass-card p-6 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-purple-500/30">
        <div className="documentation-card-content">
          {/* Header con ícono especial */}
          <header className="space-y-4 mb-6">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-400/30">
                <Zap size={56} className="text-purple-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight text-center">
              {section.title}
            </h2>
          </header>

          {/* Descripción */}
          <div className="flex-1 space-y-6 mb-6">
            <p className="text-sm text-dark-text leading-relaxed text-center">
              {section.description}
            </p>

            {/* Características destacadas */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="font-semibold text-purple-300 mb-1">Componentes</div>
                <div className="text-slate-300">Button, Modal, TableCosts</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="font-semibold text-blue-300">Interactivo</div>
                <div className="text-slate-300">Demos en vivo</div>
              </div>
            </div>
          </div>

          {/* Botón de acción especial */}
          <div className="flex justify-center">
            <Link
              href="/ui-test"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <Zap size={16} strokeWidth={2} />
              Probar Componentes
            </Link>
          </div>
        </div>

        {/* Footer */}
        {section.image && (
          <footer className="mt-6 pt-4 border-t border-purple-500/20">
            <p className="text-xs text-dark-text/80 text-center leading-relaxed">
              {section.image.caption}
            </p>
          </footer>
        )}
      </article>
    );
  }

  // Renderizar vista especial para paquetes del monorepo
  if (section.content?.type === "packages") {
    return (
      <article className="documentation-card glass-card p-6 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl col-span-2">
        <div className="documentation-card-content">
          {/* Header */}
          <header className="space-y-4 mb-6">
            <div className="flex justify-center">
              <Package size={56} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white leading-tight text-center">
              {section.title}
            </h2>
          </header>

          {/* Descripción general */}
          <div className="mb-8">
            <p className="text-sm text-dark-text leading-relaxed text-center">
              {section.description}
            </p>
          </div>

          {/* Grid de paquetes */}
          <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
            {section.content.packages.map((pkg) => (
              <div
                key={pkg.name}
                className="space-y-4 p-4 rounded-lg bg-slate-800/50 border border-white/10"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{pkg.name}</h3>
                  <p className="text-sm font-medium text-purple-300 mb-3">{pkg.purpose}</p>
                  <p className="text-xs text-dark-text leading-relaxed">{pkg.description}</p>
                </div>

                <div className="space-y-3">
                  {/* Input/Output */}
                  <div>
                    <h4 className="text-xs font-semibold text-blue-300 mb-1">Entrada</h4>
                    <p className="text-xs text-slate-300">{pkg.io.input}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-emerald-300 mb-1">Salidas</h4>
                    <ul className="space-y-1">
                      {pkg.io.outputs.map((output) => (
                        <li key={output} className="text-xs text-slate-300 flex items-start gap-1">
                          <ArrowRight size={10} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{output}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Usado por */}
                  <div>
                    <h4 className="text-xs font-semibold text-amber-300 mb-1">Usado por</h4>
                    <ul className="space-y-1">
                      {pkg.usedBy.map((user) => (
                        <li key={user} className="text-xs text-slate-300">
                          {user}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }

  // Renderizar vista especial para herramientas de calidad de código
  if (section.content?.type === "tools") {
    return (
      <article className="documentation-card glass-card p-6 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl col-span-2">
        <div className="documentation-card-content">
          {/* Header */}
          <header className="space-y-4 mb-6">
            <div className="flex justify-center">
              <Settings size={56} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white leading-tight text-center">
              {section.title}
            </h2>
          </header>

          {/* Descripción general */}
          <div className="mb-8">
            <p className="text-sm text-dark-text leading-relaxed text-center">
              {section.description}
            </p>
          </div>

          {/* Frontend y Backend */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Frontend */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-300 text-center">
                {section.content.frontend.title}
              </h3>
              <div className="space-y-4">
                {section.content.frontend.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="p-4 rounded-lg bg-blue-800/20 border border-blue-500/20"
                  >
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-blue-200 mb-1">{tool.name}</h4>
                      <p className="text-xs text-blue-300 mb-2">{tool.purpose}</p>
                      {tool.config && (
                        <p className="text-xs text-slate-400">Config: {tool.config}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <h5 className="text-xs font-semibold text-slate-300 mb-1">
                          Características
                        </h5>
                        <ul className="space-y-1">
                          {tool.features.map((feature, idx) => (
                            <li key={idx} className="text-xs text-slate-400 flex items-start gap-1">
                              <ArrowRight size={8} className="text-blue-400 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Backend */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-300 text-center">
                {section.content.backend.title}
              </h3>
              <div className="space-y-4">
                {section.content.backend.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="p-4 rounded-lg bg-green-800/20 border border-green-500/20"
                  >
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-green-200 mb-1">{tool.name}</h4>
                      <p className="text-xs text-green-300 mb-2">{tool.purpose}</p>
                      {tool.config && (
                        <p className="text-xs text-slate-400">Config: {tool.config}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <h5 className="text-xs font-semibold text-slate-300 mb-1">
                          Características
                        </h5>
                        <ul className="space-y-1">
                          {tool.features.map((feature, idx) => (
                            <li key={idx} className="text-xs text-slate-400 flex items-start gap-1">
                              <ArrowRight
                                size={8}
                                className="text-green-400 mt-0.5 flex-shrink-0"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scripts de Automatización */}
          <div className="p-4 rounded-lg bg-purple-800/20 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-purple-300 text-center mb-4">
              {section.content.automation.title}
            </h3>
            <div className="grid gap-3">
              {section.content.automation.commands.map((cmd, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                  <div className="flex items-start gap-3">
                    <code className="text-xs font-mono text-purple-300 bg-purple-900/30 px-2 py-1 rounded flex-shrink-0">
                      {cmd.command}
                    </code>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 mb-1">{cmd.description}</p>
                      {cmd.result && (
                        <p className="text-xs text-emerald-300 font-medium">{cmd.result}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Renderizar vista estándar con imagen
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
                ${iconConfig.color.replace("text-", "focus:ring-")}
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
        {section.image && (
          <footer className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-dark-text/80 text-center leading-relaxed">
              {section.image.caption}
            </p>
          </footer>
        )}
      </div>
    </article>
  );
});

DocumentationCard.displayName = "DocumentationCard";
