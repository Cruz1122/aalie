"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { DocumentationCard } from "@/components/DocumentationCard";
import { DocumentationIndex } from "@/components/DocumentationIndex";
import DocumentationModal from "@/components/DocumentationModal";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { NavigationFooter } from "@/components/NavigationFooter";
import { PageHeader } from "@/components/PageHeader";
import { useNavigation } from "@/contexts/NavigationContext";
import { useDocumentationSections } from "@/hooks/useDocumentationSections";
import { DocumentationSection } from "@/types/documentation";

export default function TechnicalDocsPage() {
  const t = useTranslations("documentation.technical");
  const [selectedSection, setSelectedSection] =
    useState<DocumentationSection | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const sections = useDocumentationSections();
  const { finishNavigation } = useNavigation();

  // Finalizar la carga cuando el componente se monte
  useEffect(() => {
    finishNavigation();
  }, [finishNavigation]);

  const handleSectionClick = (_sectionId: string) => {
    // El scroll se maneja en el componente DocumentationIndex
  };

  const openDocumentationModal = (section: DocumentationSection) => {
    setSelectedSection(section);
    setIsDocModalOpen(true);
  };

  const closeDocumentationModal = () => {
    setSelectedSection(null);
    setIsDocModalOpen(false);
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1 z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            icon="code"
            title={t("title")}
            description={t("subtitle")}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <DocumentationIndex
              sections={sections}
              onSectionClick={handleSectionClick}
            />

            <div className="lg:col-span-3 space-y-8 min-w-0">
              {/* Grid de documentación */}
              <section aria-label="Secciones de documentación técnica" className="min-w-0">
                <div className="documentation-grid">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-24 min-w-0 overflow-hidden"
                    >
                      <DocumentationCard
                        section={section}
                        onOpenSection={openDocumentationModal}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Documentación Técnica Completa */}
              <section className="mt-12 min-w-0">
                <div className="glass-card p-6 lg:p-8 rounded-xl min-w-0 overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 min-w-0">
                    <div className="w-12 h-12 shrink-0 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-2xl">
                        description
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white min-w-0 break-words">
                      {t("fullTitle")}
                    </h2>
                  </div>
                  <p className="text-dark-text mb-6 text-base leading-relaxed min-w-0 break-words">
                    {t("fullDesc")}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                    {/* Documentación de API */}
                    <div className="glass-secondary p-6 rounded-lg min-w-0 overflow-hidden">
                      <div className="flex items-center gap-3 mb-4 min-w-0">
                        <span className="material-symbols-outlined text-primary text-xl shrink-0">
                          api
                        </span>
                        <h3 className="text-xl font-semibold text-white min-w-0 break-words">
                          {t("apiTitle")}
                        </h3>
                      </div>
                      <p className="text-dark-text text-sm mb-4 min-w-0 break-words">
                        {t("apiDesc")}
                      </p>
                      <ul className="list-none space-y-2 text-sm text-dark-text min-w-0">
                        <li className="flex items-start gap-2 min-w-0">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="min-w-0 break-words">
                            <code className="text-cyan-300">
                              docs/api/README.md
                            </code>{" "}
                            - {t("indexGeneral")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 min-w-0">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="min-w-0 break-words">
                            <code className="text-cyan-300">
                              docs/api/endpoints.md
                            </code>{" "}
                            - {t("endpoints")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 min-w-0">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="min-w-0 break-words">
                            <code className="text-cyan-300">
                              docs/api/models.md
                            </code>{" "}
                            - {t("models")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 min-w-0">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="min-w-0 break-words">
                            <code className="text-cyan-300">
                              docs/api/architecture.md
                            </code>{" "}
                            - {t("architecture")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 min-w-0">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="min-w-0 break-words">
                            <code className="text-cyan-300">
                              docs/api/errors.md
                            </code>{" "}
                            - {t("errors")}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Documentación de Aplicación Web */}
                    <div className="glass-secondary p-6 rounded-lg min-w-0 overflow-hidden">
                      <div className="flex items-center gap-3 mb-4 min-w-0">
                        <span className="material-symbols-outlined text-primary text-xl shrink-0">
                          web
                        </span>
                        <h3 className="text-xl font-semibold text-white min-w-0 break-words">
                          {t("appTitle")}
                        </h3>
                      </div>
                      <p className="text-dark-text text-sm mb-4 min-w-0 break-words">
                        {t("appDesc")}
                      </p>
                      <ul className="list-none space-y-2 text-sm text-dark-text min-w-0">
                        <li className="flex items-start gap-2 min-w-0">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="min-w-0 break-words">
                            <code className="text-cyan-300">
                              docs/app/README.md
                            </code>{" "}
                            - {t("indexGeneral")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 min-w-0">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="min-w-0 break-words">
                            <code className="text-cyan-300">
                              docs/app/architecture.md
                            </code>{" "}
                            - {t("architecture")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 min-w-0">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="min-w-0 break-words">
                            <code className="text-cyan-300">
                              docs/app/components.md
                            </code>{" "}
                            - {t("components")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 min-w-0">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5 shrink-0">
                            check_circle
                          </span>
                          <span className="min-w-0 break-words">
                            <code className="text-cyan-300">
                              docs/app/routing.md
                            </code>{" "}
                            - {t("routing")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                            check_circle
                          </span>
                          <span>
                            <code className="text-cyan-300">
                              docs/app/state-management.md
                            </code>{" "}
                            - {t("state")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                            check_circle
                          </span>
                          <span>
                            <code className="text-cyan-300">
                              docs/app/styling.md
                            </code>{" "}
                            - {t("styling")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                            check_circle
                          </span>
                          <span>
                            <code className="text-cyan-300">
                              docs/app/api-integration.md
                            </code>{" "}
                            - {t("apiIntegration")}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                            check_circle
                          </span>
                          <span>
                            <code className="text-cyan-300">
                              docs/development/i18n-labels-prompts.md
                            </code>{" "}
                            - {t("i18nLabels")}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-400 text-xl">
                        info
                      </span>
                      <div>
                        <p className="text-blue-300 text-sm font-semibold mb-1">
                          {t("note")}
                        </p>
                        <p className="text-blue-200 text-sm">
                          {t("noteText")}{" "}
                          <code className="text-blue-100 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            docs/api/
                          </code>{" "}
                          y{" "}
                          <code className="text-blue-100 bg-slate-800/50 px-1.5 py-0.5 rounded">
                            docs/app/
                          </code>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <NavigationFooter
                namespace="documentation.technical"
                prev={{ href: "/documentation", labelKey: "backToDocs" }}
                next={{ href: "/user-guide", labelKey: "nextToUserGuide" }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modal de documentación */}
      <DocumentationModal
        open={isDocModalOpen}
        onClose={closeDocumentationModal}
        section={selectedSection}
      />

      <Footer />
    </div>
  );
}
