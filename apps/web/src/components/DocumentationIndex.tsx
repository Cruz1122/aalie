"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { DocumentationSection } from "@/types/documentation";

import { getIconConfig } from "./DocumentationIcons";

interface DocumentationIndexProps {
  sections: DocumentationSection[];
  onSectionClick?: (sectionId: string) => void;
}

export const DocumentationIndex = ({
  sections,
  onSectionClick,
}: DocumentationIndexProps) => {
  const t = useTranslations("documentation.technical");
  const [activeSection, setActiveSection] = useState<string>(
    sections[0]?.id ?? "",
  );

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    onSectionClick?.(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="lg:col-span-1">
      <div className="glass-card p-5 sticky top-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary text-xl">
            list
          </span>
          <h2 className="text-lg font-bold text-white">{t("toc")}</h2>
        </div>
        <nav className="space-y-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-all ${
                activeSection === section.id
                  ? "text-white bg-primary/20 border border-primary/30"
                  : "text-dark-text hover:text-white hover:bg-white/5"
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleSectionClick(section.id);
              }}
            >
              {(() => {
                const config = getIconConfig(section.id);
                const Icon = config.icon;
                return (
                  <Icon
                    size={18}
                    className={`${config.color} flex-shrink-0`}
                    strokeWidth={1.5}
                  />
                );
              })()}
              <span className="line-clamp-2">
                {section.titleKey
                  ? t(`sections.${section.titleKey}`)
                  : section.title}
              </span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
};
