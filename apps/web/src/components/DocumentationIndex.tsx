"use client";

import {
  ChevronDown,
  ChevronRight,
  FileText,
  Package,
  Settings,
  Calculator,
  BarChart3,
  Zap,
  Cpu,
} from "lucide-react";
import { useState } from "react";

import { DocumentationSection } from "@/types/documentation";

interface DocumentationIndexProps {
  sections: DocumentationSection[];
  onSectionClick: (sectionId: string) => void;
}

const getSectionIcon = (sectionId: string, size: number = 16) => {
  const iconProps = { size, className: "flex-shrink-0" };

  switch (sectionId) {
    case "monorepo-packages":
      return (
        <Package
          {...iconProps}
          className={`${iconProps.className} text-purple-400`}
        />
      );
    case "code-quality":
      return (
        <Settings
          {...iconProps}
          className={`${iconProps.className} text-green-400`}
        />
      );
    case "katex-integration":
      return (
        <Calculator
          {...iconProps}
          className={`${iconProps.className} text-emerald-400`}
        />
      );
    case "analyzer-interface":
      return (
        <BarChart3
          {...iconProps}
          className={`${iconProps.className} text-cyan-400`}
        />
      );
    case "iterative-analyzer":
      return (
        <Cpu
          {...iconProps}
          className={`${iconProps.className} text-cyan-400`}
        />
      );
    case "ui-showcase":
      return (
        <Zap
          {...iconProps}
          className={`${iconProps.className} text-purple-400`}
        />
      );
    default:
      return (
        <FileText
          {...iconProps}
          className={`${iconProps.className} text-blue-400`}
        />
      );
  }
};

const getCategoryInfo = (section: DocumentationSection) => {
  if (section.content?.type === "packages")
    return { category: "Arquitectura", priority: 1 };
  if (section.content?.type === "tools")
    return { category: "Herramientas", priority: 2 };
  if (section.content?.type === "katex")
    return { category: "Componentes", priority: 3 };
  if (section.content?.type === "analyzer")
    return { category: "Interfaces", priority: 4 };
  if (section.id === "ui-showcase")
    return { category: "Demostración", priority: 5 };
  return { category: "Documentación", priority: 0 };
};

export const DocumentationIndex = ({
  sections,
  onSectionClick,
}: DocumentationIndexProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    Arquitectura: false,
    Herramientas: false,
    Componentes: false,
    Interfaces: false,
    Demostración: false,
    Documentación: false,
  });

  // Agrupar secciones por categoría
  const groupedSections = sections.reduce(
    (acc, section) => {
      const { category } = getCategoryInfo(section);
      if (!acc[category]) acc[category] = [];
      acc[category].push(section);
      return acc;
    },
    {} as Record<string, DocumentationSection[]>,
  );

  // Ordenar categorías por prioridad
  const sortedCategories = Object.entries(groupedSections).sort(
    ([_catA, sectionsA], [_catB, sectionsB]) => {
      const priorityA = getCategoryInfo(sectionsA[0]).priority;
      const priorityB = getCategoryInfo(sectionsB[0]).priority;
      return priorityA - priorityB;
    },
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSectionClick = (sectionId: string) => {
    onSectionClick(sectionId);
    // Scroll suave al elemento
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!isExpanded) {
    return (
      <div className="documentation-index glass-card p-3 rounded-lg border border-white/10 mb-6">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
        >
          <ChevronRight size={16} />
          <span className="font-medium">Índice de Contenidos</span>
        </button>
      </div>
    );
  }

  return (
    <div className="documentation-index glass-card p-4 rounded-lg border border-white/10 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Índice de Contenidos
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <nav className="space-y-3">
        {sortedCategories.map(([category, categorySections]) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center gap-2 w-full text-left text-sm font-medium text-slate-300 hover:text-white transition-colors mb-2"
            >
              {expandedCategories[category] ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              <span>{category}</span>
              <span className="text-xs text-slate-500">
                ({categorySections.length})
              </span>
            </button>

            {expandedCategories[category] && (
              <div className="ml-4 space-y-2">
                {categorySections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    {getSectionIcon(section.id)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-300 group-hover:text-white truncate">
                        {section.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {section.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Estadísticas */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">
              {sections.length}
            </div>
            <div className="text-xs text-slate-400">Secciones</div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {sortedCategories.length}
            </div>
            <div className="text-xs text-slate-400">Categorías</div>
          </div>
        </div>
      </div>
    </div>
  );
};
