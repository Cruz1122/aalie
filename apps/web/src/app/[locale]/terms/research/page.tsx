import Footer from "@/components/Footer";
import Header from "@/components/Header";

type Props = { params: Promise<{ locale: string }> };

export default async function ResearchTermsPage({ params }: Props) {
  const { locale } = await params;
  const es = locale === "es";

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="z-10 flex-1 px-3 py-8 sm:px-4 lg:px-6">
        <article className="mx-auto w-full max-w-3xl space-y-8 text-[15px] leading-7 text-dark-text">
          <header className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {es ? "Condiciones de participación" : "Participation terms"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {es ? "Estudios académicos de AALIE" : "AALIE academic studies"}
            </h1>
          </header>

          <p>
            {es
              ? "Usar AALIE o iniciar sesión no te convierte en participante. La participación solo comienza cuando aceptas el consentimiento de un estudio ACTIVE. Puedes seguir usando las funciones pedagógicas normales si no participas o si retiras el consentimiento."
              : "Using AALIE or signing in does not make you a participant. Participation starts only when you accept the consent for an ACTIVE study. You may continue using normal pedagogical features if you do not participate or if you withdraw."}
          </p>
          <p>
            {es
              ? "La condición experimental AALIE o CONTROL la asigna exclusivamente el servidor o un ADMIN autorizado. El navegador no puede seleccionar ni modificar esa condición y, una vez exista evidencia experimental, no puede cambiarse mediante el flujo administrativo normal."
              : "The AALIE or CONTROL experimental condition is assigned exclusively by the server or an authorized ADMIN. The browser cannot select or modify it and, once experimental evidence exists, it cannot be changed through the normal administrative flow."}
          </p>
          <p>
            {es
              ? "Los quizzes de práctica continúan disponibles fuera de un estudio. Para participantes activos, las preguntas, adaptación y calificación son autoritativas en el servidor; el progreso local del navegador no decide la evidencia académica."
              : "Practice quizzes remain available outside a study. For active participants, question selection, adaptation, and grading are server-authoritative; browser-local progress does not determine academic evidence."}
          </p>
          <p>
            {es
              ? "Los datasets de investigación se exportan de forma pseudonimizada y excluyen identidad Google, nombre, correo, pseudocódigo, prompts, respuestas completas del LLM, IP y user-agent. Consulta el aviso específico de privacidad de investigación para el detalle de los campos recogidos."
              : "Research datasets are exported pseudonymously and exclude Google identity, name, email, pseudocode, prompts, full LLM responses, IP address, and user-agent. See the research privacy notice for the detailed field list."}
          </p>
          <a
            href={`/${locale}/privacy/research`}
            className="inline-flex text-sm font-semibold text-cyan-200 underline underline-offset-4"
          >
            {es ? "Ver privacidad de investigación" : "View research privacy"}
          </a>
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
