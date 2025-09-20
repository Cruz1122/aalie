import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DocumentationPage() {
  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      {/* Contenido Principal */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 z-10 max-w-4xl mx-auto">
  {/* Card Documentación Técnica */}
  <div className="glass-card flex flex-col items-center justify-center text-center p-8 rounded-md">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">code</span>
          <h2 className="text-xl font-bold mb-2">Documentación Técnica</h2>
          <p className="text-sm text-dark-text mb-6">
            Guías detalladas para desarrolladores, APIs, arquitectura del sistema y ejemplos de código para integrar el analizador en tus proyectos.
          </p>
          <a href="/documentation/technical" className="glass-secondary flex items-center justify-center rounded-md h-10 px-4 text-white text-sm font-bold transition-colors">
            <span className="material-symbols-outlined mr-2">terminal</span>
            {" "}Ver Documentación Técnica
          </a>
        </div>

        {/* Card Documentación de Usuario */}
        <div className="glass-card flex flex-col items-center justify-center text-center p-8 rounded-md">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">menu_book</span>
          <h2 className="text-xl font-bold mb-2">Guía de Usuario</h2>
          <p className="text-sm text-dark-text mb-6">
            Tutoriales paso a paso, casos de uso comunes y guías para aprovechar al máximo las funcionalidades del analizador de complejidad.
          </p>
          <button className="glass-secondary flex items-center justify-center rounded-md h-10 px-4 text-white text-sm font-bold transition-colors" disabled title="Próximamente">
            <span className="material-symbols-outlined mr-2">school</span>
            {" "}Ver Guía de Usuario (próximamente)
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}