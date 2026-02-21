"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import AALIEIcon from "@/components/AALIEIcon";
import { UserGuideSection } from "@/types/user-guide";

interface TocGroup {
  id: string;
  titleKey: string;
  icon: string;
  sectionIds: string[];
}

interface UserGuideTableOfContentsProps {
  sections: UserGuideSection[];
  onSectionClick?: (sectionId: string) => void;
}

const TOC_GROUPS: TocGroup[] = [
  { id: "introduccion", titleKey: "introduccion", icon: "info", sectionIds: ["introduccion"] },
  {
    id: "editor",
    titleKey: "editor",
    icon: "edit",
    sectionIds: ["editor-basico", "editor-validacion", "editor-atajos"],
  },
  {
    id: "gramatica",
    titleKey: "gramatica",
    icon: "code",
    sectionIds: [
      "gramatica-procedimientos",
      "gramatica-variables",
      "gramatica-estructuras",
      "gramatica-operadores",
      "gramatica-arrays",
      "gramatica-print",
    ],
  },
  {
    id: "analisis",
    titleKey: "analisis",
    icon: "analytics",
    sectionIds: [
      "analisis-editor",
      "analisis-chatbot",
      "analisis-resultados",
      "analisis-llm",
      "analisis-gpu-cpu",
      "analisis-trace",
    ],
  },
  { id: "ejemplos", titleKey: "ejemplos", icon: "lightbulb", sectionIds: ["ejemplos"] },
  { id: "errores", titleKey: "errores", icon: "bug_report", sectionIds: ["errores"] },
];

const SUB_ICONS: Record<string, string> = {
  "editor-basico": "settings",
  "editor-validacion": "verified",
  "editor-atajos": "keyboard",
  "gramatica-procedimientos": "functions",
  "gramatica-variables": "variable_add",
  "gramatica-estructuras": "account_tree",
  "gramatica-operadores": "calculate",
  "gramatica-arrays": "data_array",
  "gramatica-print": "print",
  "analisis-editor": "code",
  "analisis-chatbot": "aalie",
  "analisis-resultados": "insights",
  "analisis-llm": "compare_arrows",
  "analisis-gpu-cpu": "memory",
  "analisis-trace": "route",
};

/**
 * Tabla de contenidos para la guía de usuario.
 * Navegación jerárquica con scroll suave a las cards.
 * Author: @Cruz1122
 * Version: 0.1.0
 */
export function UserGuideTableOfContents({
  sections,
  onSectionClick,
}: UserGuideTableOfContentsProps) {
  const t = useTranslations("userGuide");
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [sections]);

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
          {TOC_GROUPS.map((group) => {
            const isSingle = group.sectionIds.length === 1;
            const firstId = group.sectionIds[0];

            if (isSingle) {
              const section = sectionMap.get(firstId);
              if (!section) return null;
              const isActive = activeSection === firstId;
              return (
                <a
                  key={group.id}
                  href={`#${firstId}`}
                  className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-all ${
                    isActive
                      ? "text-white bg-primary/20 border border-primary/30"
                      : "text-dark-text hover:text-white hover:bg-white/5"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSectionClick(firstId);
                  }}
                >
                  {group.icon === "aalie" ? (
                    <AALIEIcon className="text-primary flex-shrink-0" size={18} />
                  ) : (
                    <span className="material-symbols-outlined text-base flex-shrink-0">
                      {group.icon}
                    </span>
                  )}
                  <span>{t(section.titleKey)}</span>
                </a>
              );
            }

            return (
              <div key={group.id}>
                <div className="flex items-center gap-2 text-sm py-2 px-3 rounded-lg text-dark-text">
                  <span className="material-symbols-outlined text-base flex-shrink-0 text-primary">
                    {group.icon}
                  </span>
                  <span className="font-semibold text-white">{t(group.titleKey)}</span>
                </div>
                <div className="ml-6 space-y-1 mt-1 border-l border-white/10 pl-3">
                  {group.sectionIds.map((sectionId) => {
                    const section = sectionMap.get(sectionId);
                    if (!section) return null;
                    const isActive = activeSection === sectionId;
                    const subIcon = SUB_ICONS[sectionId];
                    return (
                      <a
                        key={sectionId}
                        href={`#${sectionId}`}
                        className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded transition-all ${
                          isActive
                            ? "text-primary bg-white/10"
                            : "text-dark-text hover:text-white hover:bg-white/5"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSectionClick(sectionId);
                        }}
                      >
                        {subIcon === "aalie" ? (
                          <AALIEIcon className="text-primary flex-shrink-0" size={24} />
                        ) : (
                          <span className="material-symbols-outlined text-xs flex-shrink-0">
                            {subIcon ?? "arrow_right"}
                          </span>
                        )}
                        <span>{t(section.titleKey)}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
