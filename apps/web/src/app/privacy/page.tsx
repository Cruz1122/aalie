import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata = {
  title: "Política de Privacidad - Analizador de Complejidad",
  description:
    "Política de privacidad del Analizador de Complejidad Algorítmica",
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
            <span className="material-symbols-outlined text-4xl text-primary">
              shield
            </span>
            <h1 className="text-4xl font-bold text-white">
              Política de Privacidad
            </h1>
          </div>
          <p className="text-lg text-dark-text max-w-3xl mx-auto leading-relaxed">
            Tu privacidad es nuestra prioridad. Este proyecto académico no
            requiere registro, no almacena datos personales y procesa tu código
            de forma temporal.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="h-1 w-1 rounded-full bg-green-400"></span>
            <p className="text-sm text-green-400 font-medium">
              Última actualización: Diciembre 2025
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
              <h3 className="text-xl font-bold text-white mb-2">
                Sin Datos Personales
              </h3>
            </div>
            <ul className="space-y-2 text-dark-text text-sm">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span>{" "}
                Sin registro de usuarios
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span>{" "}
                Sin cookies de seguimiento
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0"></span>{" "}
                Sin analítica de terceros
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
              <h3 className="text-xl font-bold text-white mb-2">
                Procesamiento Temporal
              </h3>
            </div>
            <ul className="space-y-2 text-dark-text text-sm">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>{" "}
                Análisis en memoria únicamente
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>{" "}
                Sin almacenamiento permanente
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>{" "}
                Backend propio (FastAPI + SymPy + ANTLR4)
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
              <h3 className="text-xl font-bold text-white mb-2">
                Tu Código es Tuyo
              </h3>
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
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>{" "}
                IA externa para chatbot, comparación y diagramas (Gemini)
              </li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="glass-card p-8 rounded-xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Preguntas Frecuentes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Se almacena mi código?
                </h3>
                <p className="text-dark-text text-sm">
                  No. Tu código se procesa temporalmente en memoria y se elimina
                  automáticamente al finalizar el análisis.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Necesito crear una cuenta?
                </h3>
                <p className="text-dark-text text-sm">
                  No. El servicio funciona completamente sin registro. No
                  solicitamos datos personales de ningún tipo.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Usan servicios de IA externa?
                </h3>
                <p className="text-dark-text text-sm">
                  Sí, utilizamos Google Gemini para tres funcionalidades específicas:
                  (1) Chatbot de asistencia general, (2) Comparación de análisis con LLM (Gemini 2.5 Pro),
                  y (3) Generación de diagramas para algoritmos recursivos (Gemini 2.0 Flash).
                  El análisis de complejidad principal se realiza completamente con nuestro
                  backend propio (FastAPI + ANTLR4 + SymPy) sin uso de IA. Los datos enviados
                  a Gemini se procesan según la política de privacidad de Google.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Cómo se maneja mi API Key de Gemini?
                </h3>
                <p className="text-dark-text text-sm">
                  Si proporcionas tu propia API Key de Gemini, se almacena únicamente
                  en tu navegador de forma local (localStorage). No se envía ni almacena
                  en nuestros servidores. La API key se usa directamente desde tu navegador
                  para llamadas a Gemini API (chatbot, comparación LLM, diagramas recursivos).
                  Te recomendamos usar API keys con permisos limitados y monitorear su uso
                  en Google Cloud Console. Puedes eliminar tu API key en cualquier momento
                  desde el footer de la aplicación.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Qué datos técnicos se registran?
                </h3>
                <p className="text-dark-text text-sm">
                  Solo logs mínimos de servidor (IP, User-Agent, timestamps) para
                  diagnóstico y monitoreo del servicio. No se vinculan a identidades
                  ni tienen uso comercial. Los mensajes del chatbot y código enviado
                  para comparación/diagramas pueden ser procesados por Gemini API
                  según los términos de servicio de Google. No almacenamos historial
                  de análisis ni código procesado.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Es seguro analizar código sensible?
                </h3>
                <p className="text-dark-text text-sm">
                  El análisis de complejidad principal se procesa temporalmente sin
                  almacenamiento. Sin embargo, si usas funcionalidades con LLM (chatbot,
                  comparación, diagramas recursivos), tu código puede ser enviado a
                  Gemini API. Evita enviar información crítica, contraseñas, secretos
                  o datos sensibles. Para código confidencial, usa solo el análisis
                  básico sin funcionalidades de IA.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  ¿Cómo contactar para dudas?
                </h3>
                <p className="text-dark-text text-sm mb-3">
                  Para cualquier consulta sobre privacidad, sugerencias o problemas,
                  puedes contactarnos:
                </p>
                <ul className="space-y-2 text-dark-text text-sm">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-sm">
                      email
                    </span>
                    <a
                      href="mailto:juan.cruz37552@ucaldas.edu.co"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      juan.cruz37552@ucaldas.edu.co
                    </a>
                    <span className="text-xs text-slate-500">(Camilo Cruz)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400 text-sm">
                      code
                    </span>
                    <a
                      href="https://github.com/Cruz1122"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      GitHub @Cruz1122
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
