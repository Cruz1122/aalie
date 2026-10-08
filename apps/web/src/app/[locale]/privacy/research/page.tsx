import Footer from "@/components/Footer";
import Header from "@/components/Header";

type Props = { params: Promise<{ locale: string }> };

export default async function ResearchPrivacyPage({ params }: Props) {
  const { locale } = await params;
  const es = locale === "es";
  const recordedItems = es
    ? [
        "ID de participante seudónimo y condición experimental: AALIE o CONTROL.",
        "Versión y hash del consentimiento, junto con su historial de aceptación o retiro.",
        "Identificadores, versiones y huellas de las preguntas mostradas, puntajes y notas de quiz.",
        "Uso de funcionalidades autorizadas y duración de las operaciones.",
        "Mediciones académicas registradas por el protocolo, con su métrica y versión.",
      ]
    : [
        "Pseudonymous participant ID and experimental condition: AALIE or CONTROL.",
        "Consent version and hash, together with its acceptance or withdrawal history.",
        "Identifiers, versions, and fingerprints of displayed questions, scores, and quiz notes.",
        "Use of allowlisted features and duration of operations.",
        "Academic measurements recorded by the protocol, with their metric and version.",
      ];
  const excludedItems = es
    ? [
        "Nombre y correo electrónico.",
        "Identificador de Google u otros identificadores del proveedor.",
        "Código fuente o pseudocódigo introducido en el analizador.",
        "Preguntas y respuestas completas del modelo de lenguaje.",
        "Dirección IP y agente de usuario como evidencia académica.",
      ]
    : [
        "Name and email address.",
        "Google identifier or other provider identifiers.",
        "Source code or pseudocode entered into the analyzer.",
        "Complete prompts and responses from the language model.",
        "IP address and user-agent as academic evidence.",
      ];

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
              {recordedItems.map((item) => (
                <li key={item}>• {item}</li>
              ))}
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
              {excludedItems.map((item) => (
                <li key={item}>• {item}</li>
              ))}
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
              ? "Última actualización: 21 de agosto de 2026 · Versión 2.0."
              : "Last updated: August 21, 2026 · Version 2.0."}
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
