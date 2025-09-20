"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ImageModal } from "@/components/ImageModal";
import { DocumentationCard } from "@/components/DocumentationCard";
import { LoaderDemo } from "@/components/LoaderDemo";
import { useImageModal } from "@/hooks/useImageModal";
import { useDocumentationSections } from "@/hooks/useDocumentationSections";

export default function TechnicalDocsPage() {
  const { selectedImage, openModal, closeModal, isModalOpen } = useImageModal();
  const sections = useDocumentationSections();

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
              Visión general del flujo, arquitectura del monorepo y contratos iniciales de API. 
              Este documento es un borrador inicial y se actualizará conforme evolucione el proyecto.
            </p>
          </header>

          {/* Grid de documentación */}
          <section aria-label="Secciones de documentación técnica">
            <div className="documentation-grid">
              {sections.map((section) => (
                <DocumentationCard
                  key={section.id}
                  section={section}
                  onImageClick={openModal}
                />
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

          {/* Footer de navegación */}
          <footer className="text-sm sm:text-base text-dark-text text-center lg:text-left border-t border-white/10 pt-6 mt-8">
            <p>
              Esta página se está actualizando constantemente. {" "}
              <Link 
                href="/documentation" 
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/50 rounded px-1 py-0.5"
              >
                Volver a Documentación
              </Link>
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

      <Footer />
    </div>
  );
}
