"use client";

import { useEffect, useState } from "react";

import { DocumentationCard } from "@/components/DocumentationCard";
import { DocumentationIndex } from "@/components/DocumentationIndex";
import DocumentationModal from "@/components/DocumentationModal";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ImageModal } from "@/components/ImageModal";
import { LoaderDemo } from "@/components/LoaderDemo";
import NavigationLink from "@/components/NavigationLink";
import { useNavigation } from "@/contexts/NavigationContext";
import { useDocumentationSections } from "@/hooks/useDocumentationSections";
import { useImageModal } from "@/hooks/useImageModal";
import { DocumentationSection } from "@/types/documentation";

export default function TechnicalDocsPage() {
  const { selectedImage, openModal, closeModal, isModalOpen } = useImageModal();
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
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          <header className="space-y-3 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              Documentación Técnica
            </h1>
            <p className="text-dark-text text-sm sm:text-base lg:text-lg leading-relaxed max-w-4xl mx-auto lg:mx-0">
              Visión general del flujo, arquitectura del monorepo y contratos
              iniciales de API. Este documento es un borrador inicial y se
              actualizará conforme evolucione el proyecto.
            </p>
          </header>

          {/* Índice de navegación */}
          <DocumentationIndex
            sections={sections}
            onSectionClick={handleSectionClick}
          />

          {/* Grid de documentación */}
          <section aria-label="Secciones de documentación técnica">
            <div className="documentation-grid">
              {sections.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-24">
                  <DocumentationCard
                    section={section}
                    onImageClick={openModal}
                    onOpenSection={openDocumentationModal}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Demo del loader global y modal */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              Prueba el Sistema de Loader Global
            </h2>
            <LoaderDemo />
          </section>

          {/* Documentación Técnica Completa */}
          <section className="mt-12">
            <div className="glass-card p-6 lg:p-8 rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    description
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Documentación Técnica Completa
                </h2>
              </div>
              <p className="text-dark-text mb-6 text-base leading-relaxed">
                Para documentación técnica detallada, consulta los siguientes
                recursos en el repositorio:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Documentación de API */}
                <div className="glass-secondary p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      api
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Documentación de API
                    </h3>
                  </div>
                  <p className="text-dark-text text-sm mb-4">
                    Documentación completa de la API backend, incluyendo
                    endpoints, modelos de datos, arquitectura y manejo de
                    errores.
                  </p>
                  <ul className="list-none space-y-2 text-sm text-dark-text">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <code className="text-cyan-300">
                          docs/api/README.md
                        </code>{" "}
                        - Índice general
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <code className="text-cyan-300">
                          docs/api/endpoints.md
                        </code>{" "}
                        - Endpoints REST
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <code className="text-cyan-300">
                          docs/api/models.md
                        </code>{" "}
                        - Modelos de datos
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <code className="text-cyan-300">
                          docs/api/architecture.md
                        </code>{" "}
                        - Arquitectura
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <code className="text-cyan-300">
                          docs/api/errors.md
                        </code>{" "}
                        - Manejo de errores
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Documentación de Aplicación Web */}
                <div className="glass-secondary p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">
                      web
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      Documentación de App
                    </h3>
                  </div>
                  <p className="text-dark-text text-sm mb-4">
                    Documentación completa del frontend, incluyendo componentes,
                    routing, gestión de estado, estilos e integración con API.
                  </p>
                  <ul className="list-none space-y-2 text-sm text-dark-text">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <code className="text-cyan-300">
                          docs/app/README.md
                        </code>{" "}
                        - Índice general
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <code className="text-cyan-300">
                          docs/app/architecture.md
                        </code>{" "}
                        - Arquitectura
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <code className="text-cyan-300">
                          docs/app/components.md
                        </code>{" "}
                        - Componentes
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-green-400 text-sm mt-0.5">
                        check_circle
                      </span>
                      <span>
                        <code className="text-cyan-300">
                          docs/app/routing.md
                        </code>{" "}
                        - Sistema de rutas
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
                        - Estado
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
                        - Estilos
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
                        - Integración API
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
                      Nota
                    </p>
                    <p className="text-blue-200 text-sm">
                      Esta documentación está disponible en el repositorio del
                      proyecto en las carpetas{" "}
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

          {/* Footer de navegación */}
          <footer className="text-sm sm:text-base text-dark-text text-center lg:text-left border-t border-white/10 pt-6 mt-8">
            <p>
              Esta página se está actualizando constantemente.{" "}
              <NavigationLink
                href="/documentation"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/50 rounded px-1 py-0.5"
              >
                Volver a Documentación
              </NavigationLink>
            </p>
          </footer>
        </div>
      </main>

      {/* Modal de imagen */}
      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

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
