import Footer from "@/components/Footer";
import Header from "@/components/Header";

type Props = { params: Promise<{ locale: string }> };

export default async function ResearchPrivacyPage({ params }: Props) {
  const { locale } = await params;
  const es = locale === "es";

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 flex-1 px-3 py-8 sm:px-4 lg:px-6">
        <article className="mx-auto w-full max-w-3xl space-y-10 text-[15px] leading-7 text-dark-text">
          <header className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {es ? "Privacidad de investigación" : "Research privacy"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {es
                ? "Tratamiento de datos para estudios con AALIE"
                : "Data handling for AALIE research studies"}
            </h1>
            <p>
              {es
                ? "Este aviso complementa la política general de privacidad. Iniciar sesión con Google no significa participar en investigación ni otorgar consentimiento. La participación exige una acción explícita dentro de la página del estudio."
                : "This notice supplements the general privacy policy. Signing in with Google does not mean joining research or giving consent. Participation requires an explicit action on the study page."}
            </p>
          </header>

          <Section
            title={
              es
                ? "Datos que puede registrar el estudio"
                : "Data a study may record"
            }
          >
            <ul className="space-y-2">
              <li>
                • participant ID pseudónimo y condición experimental AALIE o
                CONTROL;
              </li>
              <li>
                • versión y hash del consentimiento y su historial de aceptación
                o retiro;
              </li>
              <li>
                • IDs, versiones y fingerprints de preguntas mostradas, puntajes
                y notas de quiz;
              </li>
              <li>
                • uso de funcionalidades allowlisted y duración de operaciones;
              </li>
              <li>
                • measurements académicas registradas por el protocolo, con
                métrica y versión.
              </li>
            </ul>
          </Section>

          <Section
            title={es ? "Separación de identidad" : "Identity separation"}
          >
            <p>
              {es
                ? "La cuenta Google se usa como identidad operativa. La evidencia académica referencia un participant ID separado. El vínculo entre ambos se mantiene fuera del dataset académico exportable y solo se usa para resolver la participación server-side."
                : "The Google account is used as operational identity. Academic evidence references a separate participant ID. The link between them is excluded from the exportable academic dataset and is used only to resolve participation server-side."}
            </p>
          </Section>

          <Section
            title={
              es
                ? "Datos excluidos del dataset académico"
                : "Data excluded from the academic dataset"
            }
          >
            <ul className="space-y-2">
              <li>• nombre y correo;</li>
              <li>• Google subject u otros identificadores del proveedor;</li>
              <li>
                • código fuente o pseudocódigo introducido en el analizador;
              </li>
              <li>• prompts y respuestas completas del LLM;</li>
              <li>• dirección IP y user-agent como evidencia académica.</li>
            </ul>
          </Section>

          <Section title={es ? "Telemetría" : "Telemetry"}>
            <p>
              {es
                ? "La telemetría de estudio está desactivada globalmente por defecto. Solo puede registrar eventos si el estudio está ACTIVE, el participante consintió, no está retirado ni excluido, tiene condición asignada, el estudio habilitó telemetría y la bandera global está activa. Un fallo de telemetría no cambia el resultado determinista de AALIE."
                : "Study telemetry is globally disabled by default. Events may be recorded only when the study is ACTIVE, the participant has consented, is not withdrawn or excluded, has an assigned condition, the study enables telemetry, and the global flag is enabled. A telemetry failure does not change AALIE's deterministic result."}
            </p>
          </Section>

          <Section title={es ? "Retiro" : "Withdrawal"}>
            <p>
              {es
                ? "Puedes retirar el consentimiento desde la página del estudio. El retiro detiene nueva evidencia experimental y queda registrado como una nueva acción de consentimiento; no reactiva silenciosamente la participación ni borra la historia necesaria para documentar el protocolo."
                : "You can withdraw consent from the study page. Withdrawal stops new experimental evidence and is recorded as a new consent action; participation is not silently reactivated and the history required to document the protocol is not rewritten."}
            </p>
          </Section>

          <p className="text-sm text-slate-400">
            {es
              ? "Última actualización: agosto de 2026."
              : "Last updated: August 2026."}
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}
