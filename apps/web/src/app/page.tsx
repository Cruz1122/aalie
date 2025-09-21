import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      {/* Contenido Principal */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 z-10">
        {/* Card Comenzar */}
        <div className="glass-card flex flex-col items-center justify-center text-center p-8 rounded-md">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">code</span>
          <h2 className="text-xl font-bold mb-2">Comenzar Análisis</h2>
          <p className="text-sm text-dark-text mb-6">
            Accede al analizador de complejidad para evaluar tu código y obtener métricas detalladas.
          </p>
          <Link 
            href="/analyzer"
            className="glass-secondary flex items-center justify-center rounded-md h-10 px-4 text-white text-sm font-bold transition-colors hover:bg-primary/20"
          >
            <span className="material-symbols-outlined mr-2">analytics</span>{" "}Ir al Analizador
          </Link>
        </div>

        {/* Card Resultados del Análisis */}
        <div className="glass-card flex flex-col items-center justify-center text-center p-8 rounded-md">
          <span className="material-symbols-outlined text-5xl text-primary mb-4">analytics</span>
          <h2 className="text-xl font-bold mb-2">Resultados del Análisis</h2>
          <p className="text-sm text-dark-text">
            Las métricas detalladas de complejidad y los insights se mostrarán aquí una vez que se
            complete un análisis.
          </p>
        </div>

        {/* Card Visualizaciones */}
        <div className="glass-card flex flex-col items-center justify-center text-center p-8 rounded-md">
          <span className="material-symbols-outlined text-5xl text-primary mb-4">monitoring</span>
          <h2 className="text-xl font-bold mb-2">Visualizaciones</h2>
          <p className="text-sm text-dark-text">
            Gráficos interactivos y diagramas que visualizan la complejidad de tu código aparecerán
            aquí.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
