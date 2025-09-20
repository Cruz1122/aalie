import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata = {
  title: "Política de Privacidad - Analizador de Complejidad",
  description: "Política de privacidad del Analizador de Complejidad Algorítmica",
};

export default function PrivacyPage() {
  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden">
      <Header />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">shield</span>
            <h1 className="text-4xl font-bold text-white">Política de Privacidad</h1>
          </div>
          <p className="text-lg text-dark-text max-w-3xl mx-auto leading-relaxed">
            Tu privacidad es nuestra prioridad. Este proyecto académico no requiere registro, no
            almacena datos personales y procesa tu código de forma temporal.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="h-1 w-1 rounded-full bg-green-400"></span>
            <p className="text-sm text-green-400 font-medium">
              Última actualización: Septiembre 2025
            </p>
          </div>
        </div>

        {/* Cards Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Card 1: Sin Datos Personales */}
          <div className="glass-card p-6 rounded-xl hover:scale-105 transition-transform duration-300">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-3">
                <span className="material-symbols-outlined text-green-400 text-3xl">
                  no_accounts
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sin Datos Personales</h3>
            </div>
            <ul className="space-y-2 text-dark-text text-sm">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span> Sin
                registro de usuarios
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span> Sin
                cookies de seguimiento
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span> Sin
                analítica de terceros
              </li>
            </ul>
          </div>

          {/* Card 2: Procesamiento Temporal */}
          <div className="glass-card p-6 rounded-xl hover:scale-105 transition-transform duration-300">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-3">
                <span className="material-symbols-outlined text-primary text-3xl">
                  hourglass_empty
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Procesamiento Temporal</h3>
            </div>
            <ul className="space-y-2 text-dark-text text-sm">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span> Análisis
                en memoria únicamente
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span> Sin
                almacenamiento permanente
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span> Backend
                propio (FastAPI + SymPy)
              </li>
            </ul>
          </div>

          {/* Card 3: Código Seguro */}
          <div className="glass-card p-6 rounded-xl hover:scale-105 transition-transform duration-300 md:col-span-2 lg:col-span-1">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-3">
                <span className="material-symbols-outlined text-blue-400 text-3xl">
                  code_blocks
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tu Código es Tuyo</h3>
            </div>
            <ul className="space-y-2 text-dark-text text-sm">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>{" "}
                Validación local en navegador
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>{" "}
                Eliminación automática post-análisis
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></span> Sin IA
                externa (por ahora)
              </li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="glass-card p-8 rounded-xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Preguntas Frecuentes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">¿Se almacena mi código?</h3>
                <p className="text-dark-text text-sm">
                  No. Tu código se procesa temporalmente en memoria y se elimina automáticamente al
                  finalizar el análisis.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Necesito crear una cuenta?
                </h3>
                <p className="text-dark-text text-sm">
                  No. El servicio funciona completamente sin registro. No solicitamos datos
                  personales de ningún tipo.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Usan servicios de IA externa?
                </h3>
                <p className="text-dark-text text-sm">
                  Actualmente no. Todo el análisis se realiza con nuestro backend propio. Si esto
                  cambia, te lo notificaremos.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Qué datos técnicos se registran?
                </h3>
                <p className="text-dark-text text-sm">
                  Solo logs mínimos de servidor (IP, User-Agent) para diagnóstico. No se vinculan a
                  identidades ni tienen uso comercial.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Es seguro analizar código sensible?
                </h3>
                <p className="text-dark-text text-sm">
                  El procesamiento es temporal y sin almacenamiento. Sin embargo, evita enviar
                  información crítica por precaución.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Cómo contactar para dudas?
                </h3>
                <p className="text-dark-text text-sm">
                  Puedes contactarnos a través de la Universidad de Caldas para cualquier consulta
                  sobre privacidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
