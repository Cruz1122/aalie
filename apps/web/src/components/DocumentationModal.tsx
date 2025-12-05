"use client";

import {
  Zap,
  Package,
  Settings,
  Calculator,
  BarChart3,
  ArrowRight,
  Code2,
} from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

import Formula from "@/components/Formula";
import NavigationLink from "@/components/NavigationLink";
import {
  DocumentationSection,
  UIShowcaseContent,
  PackageContent,
  PackageInfo,
  ToolsContent,
  ToolInfo,
  CommandInfo,
  KaTeXContent,
  KaTeXComponent,
  KaTeXUtility,
  AnalyzerContent,
  AnalyzerColumn,
  AnalyzerBreakpoint,
  AnalyzerModalType,
  AnalyzerComponentInfo,
  AnalysisMode,
  VisitorInfo,
  AlgorithmCategory,
  GrammarContent,
  GrammarFeature,
  GrammarSyntaxSection,
  GrammarOperatorCategory,
  TextContent,
  TextSection,
} from "@/types/documentation";

export default function DocumentationModal({
  open,
  onClose,
  section,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  section: DocumentationSection | null;
}>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      // Guardar el valor actual de overflow
      const originalOverflow = document.body.style.overflow;
      // Bloquear scroll
      document.body.style.overflow = "hidden";

      return () => {
        // Restaurar overflow original cuando se cierre el modal
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  if (!open || !section) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute left-1/2 top-1/2 w-[min(90vw,800px)] max-h-[80vh] overflow-y-auto scrollbar-custom -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 p-6 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-white">{section.title}</h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Descripción completa (si quieres usarla distinta de la corta de la card) */}
        {section.description && (
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            {section.description}
          </p>
        )}

        {/* Render detallado por tipo */}
        <div className="mt-6 space-y-6">{renderSectionDetail(section)}</div>
      </div>
    </div>
  );
}

/** Renderizadores por tipo de contenido */
function renderSectionDetail(section: DocumentationSection) {
  const t = section.content?.type;

  switch (t) {
    case "ui-showcase":
      return <UIShowcaseDetail section={section} />;
    case "packages":
      return <PackagesDetail section={section} />;
    case "tools":
      return <ToolsDetail section={section} />;
    case "katex":
      return <KatexDetail section={section} />;
    case "analyzer":
      return <AnalyzerDetail section={section} />;
    case "grammar":
      return <GrammarDetail section={section} />;
    case "text":
      return <TextDetail section={section} />;
    default:
      // Por defecto solo muestra el diagrama si existe
      return (
        <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
          {section.image?.src && (
            <div className="flex justify-center">
              {/* Imagen redimensionada para el modal */}
              <Image
                src={section.image.src}
                alt={section.image.alt || section.title}
                width={section.image.width || 800}
                height={section.image.height || 400}
                className="rounded-lg border border-white/10 max-w-full max-h-[400px] object-contain"
              />
            </div>
          )}
        </div>
      );
  }
}

/* -------- Render: UI Showcase -------- */
function UIShowcaseDetail({
  section,
}: Readonly<{ section: DocumentationSection }>) {
  const content = section.content as UIShowcaseContent;

  return (
    <article className="p-4 rounded-lg bg-gradient-to-b from-slate-800/50 to-slate-800/30 border border-purple-500/20">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-400/30">
            <Zap size={56} className="text-purple-400" />
          </div>
        </div>
        <h4 className="text-lg font-semibold text-white text-center">
          {section.title}
        </h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-6">
        {section.description}
      </p>

      {/* Lista de características */}
      {content?.implementation?.features && (
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-purple-300 mb-3">
            Componentes Disponibles:
          </h5>
          <div className="grid grid-cols-1 gap-2">
            {content.implementation.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-slate-300"
              >
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón de redirección */}
      {content?.implementation?.testRoute && (
        <div className="text-center">
          <NavigationLink
            href={content.implementation.testRoute}
            className="inline-flex items-center gap-2 glass-button px-6 py-3 rounded-lg text-white font-semibold transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
          >
            <Zap size={16} />
            Ver Demostración Interactiva
          </NavigationLink>
        </div>
      )}
    </article>
  );
}

/* -------- Render: Packages -------- */
function PackagesDetail({
  section,
}: Readonly<{ section: DocumentationSection }>) {
  const content = section.content as PackageContent;
  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <Package size={56} className="text-purple-400" />
        </div>
        <h4 className="text-lg font-semibold text-white text-center">
          {section.title}
        </h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-6">
        {section.description}
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-2 max-w-4xl mx-auto">
        {content?.packages?.map((pkg: PackageInfo) => (
          <div
            key={pkg.name}
            className="space-y-4 p-4 rounded-lg bg-slate-800/50 border border-white/10"
          >
            <div>
              <h5 className="text-base font-semibold text-white mb-1">
                {pkg.name}
              </h5>
              <p className="text-sm font-medium text-purple-300 mb-2">
                {pkg.purpose}
              </p>
              <p className="text-xs text-slate-400">{pkg.description}</p>
            </div>

            <div className="space-y-3">
              <div>
                <h6 className="text-xs font-semibold text-blue-300 mb-1">
                  Entrada
                </h6>
                <p className="text-xs text-slate-300">{pkg.io?.input}</p>
              </div>

              <div>
                <h6 className="text-xs font-semibold text-emerald-300 mb-1">
                  Salidas
                </h6>
                <ul className="space-y-1">
                  {pkg.io?.outputs?.map((output: string) => (
                    <li
                      key={output}
                      className="text-xs text-slate-300 flex items-start gap-1"
                    >
                      <ArrowRight
                        size={10}
                        className="text-emerald-400 mt-0.5 flex-shrink-0"
                      />
                      <span>{output}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h6 className="text-xs font-semibold text-amber-300 mb-1">
                  Usado por
                </h6>
                <ul className="space-y-1">
                  {pkg.usedBy?.map((user: string) => (
                    <li key={user} className="text-xs text-slate-300">
                      {user}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

/* -------- Render: Tools (frontend/backend/automation) -------- */
function ToolsDetail({ section }: Readonly<{ section: DocumentationSection }>) {
  const content = section.content as ToolsContent;

  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <Settings size={56} className="text-green-400" />
        </div>
        <h4 className="text-lg font-semibold text-white text-center">
          {section.title}
        </h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-8">
        {section.description}
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Frontend */}
        <div className="space-y-4">
          <h5 className="text-lg font-semibold text-blue-300 text-center">
            {content?.frontend?.title}
          </h5>
          <div className="space-y-4">
            {content?.frontend?.tools?.map((tool: ToolInfo) => (
              <div
                key={tool.name}
                className="p-4 rounded-lg bg-blue-800/20 border border-blue-500/20"
              >
                <div className="mb-3">
                  <h6 className="text-sm font-semibold text-blue-200 mb-1">
                    {tool.name}
                  </h6>
                  <p className="text-xs text-blue-300 mb-2">{tool.purpose}</p>
                  {tool.config && (
                    <p className="text-xs text-slate-400">
                      Config: {tool.config}
                    </p>
                  )}
                </div>
                <div>
                  <h6 className="text-xs font-semibold text-slate-300 mb-1">
                    Características
                  </h6>
                  <ul className="space-y-1">
                    {tool.features?.map((feature: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-400 flex items-start gap-1"
                      >
                        <ArrowRight
                          size={8}
                          className="text-blue-400 mt-0.5 flex-shrink-0"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backend */}
        <div className="space-y-4">
          <h5 className="text-lg font-semibold text-green-300 text-center">
            {content?.backend?.title}
          </h5>
          <div className="space-y-4">
            {content?.backend?.tools?.map((tool: ToolInfo) => (
              <div
                key={tool.name}
                className="p-4 rounded-lg bg-green-800/20 border border-green-500/20"
              >
                <div className="mb-3">
                  <h6 className="text-sm font-semibold text-green-200 mb-1">
                    {tool.name}
                  </h6>
                  <p className="text-xs text-green-300 mb-2">{tool.purpose}</p>
                  {tool.config && (
                    <p className="text-xs text-slate-400">
                      Config: {tool.config}
                    </p>
                  )}
                </div>
                <div>
                  <h6 className="text-xs font-semibold text-slate-300 mb-1">
                    Características
                  </h6>
                  <ul className="space-y-1">
                    {tool.features?.map((feature: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-400 flex items-start gap-1"
                      >
                        <ArrowRight
                          size={8}
                          className="text-green-400 mt-0.5 flex-shrink-0"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Automatización */}
      <div className="p-4 rounded-lg bg-purple-800/20 border border-purple-500/20">
        <h5 className="text-lg font-semibold text-purple-300 text-center mb-4">
          {content?.automation?.title}
        </h5>
        <div className="grid gap-3">
          {content?.automation?.commands?.map(
            (cmd: CommandInfo, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-800/50 border border-white/10"
              >
                <div className="flex items-start gap-3">
                  <code className="text-xs font-mono text-purple-300 bg-purple-900/30 px-2 py-1 rounded flex-shrink-0">
                    {cmd.command}
                  </code>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 mb-1">
                      {cmd.description}
                    </p>
                    {cmd.result && (
                      <p className="text-xs text-emerald-300 font-medium">
                        {cmd.result}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </article>
  );
}

/* -------- Render: KaTeX -------- */
function KatexDetail({ section }: Readonly<{ section: DocumentationSection }>) {
  const content = section.content as KaTeXContent;

  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <Calculator size={56} className="text-emerald-400" />
        </div>
        <h4 className="text-lg font-semibold text-white text-center">
          {section.title}
        </h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-8">
        {section.description}
      </p>

      {/* Implementación Técnica */}
      <section className="mb-8">
        <h5 className="text-lg font-semibold text-emerald-300 text-center mb-6">
          {content?.implementation?.title}
        </h5>

        {/* Librería */}
        <div className="p-4 rounded-lg bg-emerald-800/20 border border-emerald-500/20 mb-6">
          <h6 className="text-sm font-semibold text-emerald-200 mb-2">
            {content?.implementation?.library?.name}
          </h6>
          <p className="text-xs text-emerald-300 mb-3">
            {content?.implementation?.library?.purpose}
          </p>
          <h6 className="text-xs font-semibold text-slate-300 mb-2">
            Características
          </h6>
          <ul className="space-y-1">
            {content?.implementation?.library?.features?.map(
              (f: string, idx: number) => (
                <li
                  key={idx}
                  className="text-xs text-slate-400 flex items-start gap-1"
                >
                  <ArrowRight
                    size={8}
                    className="text-emerald-400 mt-0.5 flex-shrink-0"
                  />
                  <span>{f}</span>
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Componentes y utilidades */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Componentes */}
          <div className="space-y-4">
            <h6 className="text-sm font-semibold text-blue-300 text-center">
              Componentes React
            </h6>
            {content?.implementation?.components?.map(
              (component: KaTeXComponent) => (
                <div
                  key={component.name}
                  className="p-3 rounded-lg bg-blue-800/20 border border-blue-500/20"
                >
                  <h6 className="text-xs font-semibold text-blue-200 mb-1">
                    {component.name}
                  </h6>
                  <p className="text-xs text-blue-300 mb-2">
                    {component.purpose}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-300">Props:</p>
                    <ul className="space-y-1">
                      {component.props?.map((prop: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-400 ml-2">
                          • {prop}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    {component.usage}
                  </p>
                </div>
              ),
            )}
          </div>

          {/* Utilidades */}
          <div className="space-y-4">
            <h6 className="text-sm font-semibold text-purple-300 text-center">
              Utilidades
            </h6>
            {content?.implementation?.utilities?.map(
              (utility: KaTeXUtility) => (
                <div
                  key={utility.function}
                  className="p-3 rounded-lg bg-purple-800/20 border border-purple-500/20"
                >
                  <div className="mb-2">
                    <h6 className="text-xs font-semibold text-purple-200">
                      {utility.function}
                    </h6>
                    <p className="text-xs text-slate-400">en {utility.file}</p>
                  </div>
                  <p className="text-xs text-purple-300 mb-2">
                    {utility.purpose}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-300">
                      Configuración:
                    </p>
                    <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded font-mono">
                      {Object.entries(utility.config || {}).map(([k, v]) => (
                        <div key={k}>
                          {k}: {typeof v === "string" ? `"${v}"` : String(v)}
                        </div>
                      ))}
                    </div>
                  </div>
                  {utility.security && (
                    <p className="text-xs text-emerald-300 mt-2 font-medium">
                      {utility.security}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Ejemplos */}
      <section className="mb-8">
        <h5 className="text-lg font-semibold text-amber-300 text-center mb-6">
          {content?.examples?.title}
        </h5>

        {/* Inline */}
        <div className="p-4 rounded-lg bg-amber-800/20 border border-amber-500/20 mb-4">
          <h6 className="text-sm font-semibold text-amber-200 mb-2">
            Matemáticas Inline
          </h6>
          <p className="text-xs text-amber-300 mb-3">
            {content?.examples?.inline?.description}
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Código:</p>
              <code className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded block">
                {content?.examples?.inline?.code}
              </code>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">
                Resultado:
              </p>
              <div className="p-2 rounded bg-slate-900/50 text-center">
                <Formula latex="E = mc^2" />
              </div>
            </div>
          </div>
        </div>

        {/* Block */}
        <div className="p-4 rounded-lg bg-amber-800/20 border border-amber-500/20 mb-4">
          <h6 className="text-sm font-semibold text-amber-200 mb-2">
            Ecuaciones en Bloque
          </h6>
          <p className="text-xs text-amber-300 mb-3">
            {content?.examples?.block?.description}
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Código:</p>
              <code className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded block">
                {content?.examples?.block?.code}
              </code>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">
                Resultado:
              </p>
              <div className="p-3 rounded bg-slate-900/50 text-center">
                <Formula latex="\sum_{i=1}^{n} i = \frac{n(n+1)}{2}" display />
              </div>
            </div>
          </div>
        </div>

        {/* Complex */}
        <div className="p-4 rounded-lg bg-amber-800/20 border border-amber-500/20">
          <h6 className="text-sm font-semibold text-amber-200 mb-2">
            Ecuaciones Complejas
          </h6>
          <p className="text-xs text-amber-300 mb-3">
            {content?.examples?.complex?.description}
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Código:</p>
              <code className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded block break-all">
                {content?.examples?.complex?.code}
              </code>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">
                Resultado:
              </p>
              <div className="p-3 rounded bg-slate-900/50 overflow-x-auto">
                <div className="space-y-2">
                  <Formula
                    latex="T(n) = \sum_{i=1}^{n} \sum_{j=1}^{i} O(1)"
                    display
                  />
                  <Formula latex="= \sum_{i=1}^{n} i" display />
                  <Formula latex="= \frac{n(n+1)}{2}" display />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estilos */}
      <section className="p-4 rounded-lg bg-slate-800/50 border border-slate-500/20">
        <h5 className="text-lg font-semibold text-slate-300 text-center mb-4">
          {content?.styling?.title}
        </h5>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h6 className="text-sm font-semibold text-blue-300 mb-2">CSS</h6>
            <ul className="space-y-2">
              <li className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">Importación:</span>{" "}
                {content?.styling?.css?.import}
              </li>
              <li className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">
                  Personalización:
                </span>{" "}
                {content?.styling?.css?.customization}
              </li>
              <li className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">Responsive:</span>{" "}
                {content?.styling?.css?.responsive}
              </li>
            </ul>
          </div>
          <div>
            <h6 className="text-sm font-semibold text-green-300 mb-2">Temas</h6>
            <ul className="space-y-2">
              <li className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">Oscuro:</span>{" "}
                {content?.styling?.themes?.dark}
              </li>
              <li className="text-xs text-slate-400">
                <span className="font-medium text-slate-300">Adaptativo:</span>{" "}
                {content?.styling?.themes?.responsive}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </article>
  );
}

/* -------- Render: Grammar -------- */
function GrammarDetail({
  section,
}: Readonly<{ section: DocumentationSection }>) {
  const content = section.content as GrammarContent;

  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <Code2 size={56} className="text-green-400" />
        </div>
        <h4 className="text-lg font-semibold text-white text-center">
          {section.title}
        </h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-8">
        {section.description}
      </p>

      {/* Overview */}
      <section className="mb-8 p-4 rounded-lg bg-green-800/20 border border-green-500/20">
        <h5 className="text-lg font-semibold text-green-300 text-center mb-4">
          {content?.overview?.title}
        </h5>
        <p className="text-sm text-slate-300 text-center mb-4">
          {content?.overview?.description}
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="text-xs">
            <p className="text-slate-400">
              <span className="font-semibold text-green-300">Tecnología:</span>{" "}
              {content?.overview?.technology}
            </p>
          </div>
          <div className="text-xs">
            <p className="text-slate-400">
              <span className="font-semibold text-green-300">Ubicación:</span>{" "}
              <code className="bg-slate-900/50 px-1 rounded">
                {content?.overview?.location}
              </code>
            </p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-green-300 mb-2">
            Generadores:
          </p>
          <ul className="space-y-1">
            {content?.overview?.generators?.map((gen: string, idx: number) => (
              <li
                key={idx}
                className="text-xs text-slate-400 flex items-start gap-1"
              >
                <ArrowRight
                  size={8}
                  className="text-green-400 mt-0.5 flex-shrink-0"
                />
                <span>{gen}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Características */}
      <section className="mb-8">
        <h5 className="text-lg font-semibold text-blue-300 text-center mb-6">
          {content?.features?.title}
        </h5>
        <div className="grid gap-4">
          {content?.features?.items?.map(
            (feature: GrammarFeature, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-blue-800/20 border border-blue-500/20"
              >
                <h6 className="text-sm font-semibold text-blue-200 mb-2">
                  {feature.name}
                </h6>
                <p className="text-xs text-blue-300 mb-2">
                  {feature.description}
                </p>
                <div className="bg-slate-900/50 p-2 rounded">
                  <code className="text-xs font-mono text-green-300">
                    {feature.example}
                  </code>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Sintaxis */}
      <section className="mb-8">
        <h5 className="text-lg font-semibold text-purple-300 text-center mb-6">
          {content?.syntax?.title}
        </h5>
        <div className="grid gap-4">
          {content?.syntax?.sections?.map(
            (syntaxSection: GrammarSyntaxSection, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-purple-800/20 border border-purple-500/20"
              >
                <h6 className="text-sm font-semibold text-purple-200 mb-3">
                  {syntaxSection.name}
                </h6>
                <div className="bg-slate-900/50 p-3 rounded mb-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-green-300 whitespace-pre">
                    {syntaxSection.code}
                  </pre>
                </div>
                {syntaxSection.notes && syntaxSection.notes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-1">
                      Notas:
                    </p>
                    <ul className="space-y-1">
                      {syntaxSection.notes.map(
                        (note: string, noteIdx: number) => (
                          <li
                            key={noteIdx}
                            className="text-xs text-slate-400 flex items-start gap-1"
                          >
                            <ArrowRight
                              size={8}
                              className="text-purple-400 mt-0.5 flex-shrink-0"
                            />
                            <span>{note}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      </section>

      {/* Operadores */}
      <section className="mb-8">
        <h5 className="text-lg font-semibold text-amber-300 text-center mb-6">
          {content?.operators?.title}
        </h5>
        <div className="grid md:grid-cols-3 gap-4">
          {content?.operators?.categories?.map(
            (category: GrammarOperatorCategory, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-amber-800/20 border border-amber-500/20"
              >
                <h6 className="text-sm font-semibold text-amber-200 mb-2">
                  {category.name}
                </h6>
                <div className="mb-2">
                  <p className="text-xs font-semibold text-slate-300 mb-1">
                    Operadores:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {category.operators?.map((op: string, opIdx: number) => (
                      <code
                        key={opIdx}
                        className="text-xs font-mono text-amber-300 bg-slate-900/50 px-2 py-0.5 rounded"
                      >
                        {op}
                      </code>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">
                    Precedencia:
                  </span>{" "}
                  {category.precedence}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* AST */}
      <section className="mb-8 p-4 rounded-lg bg-cyan-800/20 border border-cyan-500/20">
        <h5 className="text-lg font-semibold text-cyan-300 text-center mb-4">
          {content?.ast?.title}
        </h5>
        <p className="text-sm text-slate-300 text-center mb-4">
          {content?.ast?.description}
        </p>

        <div className="mb-4">
          <p className="text-xs font-semibold text-cyan-300 mb-2">
            Tipos de Nodos:
          </p>
          <div className="grid md:grid-cols-2 gap-2">
            {content?.ast?.nodeTypes?.map((nodeType: string, idx: number) => (
              <div
                key={idx}
                className="text-xs text-slate-400 flex items-start gap-1"
              >
                <ArrowRight
                  size={8}
                  className="text-cyan-400 mt-0.5 flex-shrink-0"
                />
                <code className="text-cyan-300">{nodeType}</code>
              </div>
            ))}
          </div>
        </div>

        {content?.ast?.example && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-cyan-300 mb-2">Ejemplo:</p>
            <div className="mb-2">
              <p className="text-xs text-slate-400 mb-1">Entrada:</p>
              <div className="bg-slate-900/50 p-2 rounded overflow-x-auto">
                <pre className="text-xs font-mono text-green-300 whitespace-pre">
                  {content.ast.example.input}
                </pre>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">AST (fragmento):</p>
              <div className="bg-slate-900/50 p-2 rounded overflow-x-auto">
                <pre className="text-xs font-mono text-cyan-300 whitespace-pre">
                  {content.ast.example.astFragment}
                </pre>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Validación */}
      <section className="mb-8">
        <h5 className="text-lg font-semibold text-emerald-300 text-center mb-6">
          {content?.validation?.title}
        </h5>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Cliente */}
          <div className="p-4 rounded-lg bg-emerald-800/20 border border-emerald-500/20">
            <h6 className="text-sm font-semibold text-emerald-200 mb-3">
              Cliente (TypeScript)
            </h6>
            <p className="text-xs text-emerald-300 mb-2">
              <span className="font-semibold">Tecnología:</span>{" "}
              {content?.validation?.client?.technology}
            </p>
            <p className="text-xs text-emerald-300 mb-3">
              <span className="font-semibold">Propósito:</span>{" "}
              {content?.validation?.client?.purpose}
            </p>
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1">
                Características:
              </p>
              <ul className="space-y-1">
                {content?.validation?.client?.features?.map(
                  (feature: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-400 flex items-start gap-1"
                    >
                      <ArrowRight
                        size={8}
                        className="text-emerald-400 mt-0.5 flex-shrink-0"
                      />
                      <span>{feature}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Servidor */}
          <div className="p-4 rounded-lg bg-blue-800/20 border border-blue-500/20">
            <h6 className="text-sm font-semibold text-blue-200 mb-3">
              Servidor (Python)
            </h6>
            <p className="text-xs text-blue-300 mb-2">
              <span className="font-semibold">Tecnología:</span>{" "}
              {content?.validation?.server?.technology}
            </p>
            <p className="text-xs text-blue-300 mb-2">
              <span className="font-semibold">Endpoint:</span>{" "}
              <code className="bg-slate-900/50 px-1 rounded">
                {content?.validation?.server?.endpoint}
              </code>
            </p>
            <p className="text-xs text-blue-300 mb-3">
              <span className="font-semibold">Propósito:</span>{" "}
              {content?.validation?.server?.purpose}
            </p>
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1">
                Características:
              </p>
              <ul className="space-y-1">
                {content?.validation?.server?.features?.map(
                  (feature: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-400 flex items-start gap-1"
                    >
                      <ArrowRight
                        size={8}
                        className="text-blue-400 mt-0.5 flex-shrink-0"
                      />
                      <span>{feature}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Manejo de Errores */}
      <section className="p-4 rounded-lg bg-red-800/20 border border-red-500/20">
        <h5 className="text-lg font-semibold text-red-300 text-center mb-4">
          {content?.errorHandling?.title}
        </h5>
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-300 mb-2">
            Características:
          </p>
          <ul className="space-y-1">
            {content?.errorHandling?.features?.map(
              (feature: string, idx: number) => (
                <li
                  key={idx}
                  className="text-xs text-slate-400 flex items-start gap-1"
                >
                  <ArrowRight
                    size={8}
                    className="text-red-400 mt-0.5 flex-shrink-0"
                  />
                  <span>{feature}</span>
                </li>
              ),
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-300 mb-2">
            Tipos de Errores:
          </p>
          <ul className="space-y-1">
            {content?.errorHandling?.errorTypes?.map(
              (errorType: string, idx: number) => (
                <li
                  key={idx}
                  className="text-xs text-slate-400 flex items-start gap-1"
                >
                  <ArrowRight
                    size={8}
                    className="text-red-400 mt-0.5 flex-shrink-0"
                  />
                  <span>{errorType}</span>
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* Enlace a guía de usuario */}
      <div className="text-center mt-6">
        <NavigationLink
          href="/user-guide"
          className="inline-flex items-center gap-2 glass-button px-6 py-3 rounded-lg text-white font-semibold transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400/50"
        >
          <Code2 size={16} />
          Ver Guía de Usuario Completa
        </NavigationLink>
      </div>
    </article>
  );
}

/* -------- Render: Analyzer -------- */
function AnalyzerDetail({
  section,
}: Readonly<{ section: DocumentationSection }>) {
  const content = section.content as AnalyzerContent;

  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <BarChart3 size={56} className="text-cyan-400" />
        </div>
        <h4 className="text-lg font-semibold text-white text-center">
          {section.title}
        </h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-8">
        {section.description}
      </p>

      {/* Interfaz - puede ser 3 columnas o descripción simple */}
      {content?.interface && (
        <section className="mb-8">
          <h5 className="text-lg font-semibold text-cyan-300 text-center mb-6">
            {content.interface.title}
          </h5>

          {content.interface.description && (
            <div className="p-4 rounded-lg bg-cyan-800/20 border border-cyan-500/20 mb-6">
              <p className="text-xs text-cyan-300 text-center">
                {content.interface.description}
              </p>
            </div>
          )}

          {content.interface.features &&
            content.interface.features.length > 0 &&
            !content.interface.layout && (
              <div className="p-4 rounded-lg bg-cyan-800/20 border border-cyan-500/20 mb-6">
                <p className="text-xs font-medium text-cyan-300 mb-2">
                  Características:
                </p>
                <ul className="space-y-1">
                  {content.interface.features.map((feature: string) => (
                    <li
                      key={feature}
                      className="text-xs text-slate-400 flex items-start gap-1"
                    >
                      <ArrowRight
                        size={8}
                        className="text-cyan-400 mt-0.5 flex-shrink-0"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {content.interface.layout && (
            <div className="p-4 rounded-lg bg-cyan-800/20 border border-cyan-500/20 mb-6">
              <p className="text-xs text-cyan-300 mb-4 text-center">
                {content.interface.layout.description}
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {content?.interface?.layout?.columns?.map(
                  (column: AnalyzerColumn) => (
                    <div
                      key={column.name}
                      className="p-3 rounded-lg bg-slate-800/50 border border-white/10"
                    >
                      <h6 className="text-sm font-semibold text-cyan-200 mb-2">
                        {column.name}
                      </h6>
                      <p className="text-xs text-cyan-300 mb-2">
                        {column.purpose}
                      </p>
                      <p className="text-xs text-slate-400 mb-2">
                        Componente: {column.component}
                      </p>
                      {column.features && column.features.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-300 mb-1">
                            Características:
                          </p>
                          <ul className="space-y-1">
                            {column.features.map((feature: string) => (
                              <li
                                key={feature}
                                className="text-xs text-slate-400 flex items-start gap-1"
                              >
                                <ArrowRight
                                  size={8}
                                  className="text-cyan-400 mt-0.5 flex-shrink-0"
                                />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Responsiveness */}
          {content.interface.responsiveness && (
            <div className="p-4 rounded-lg bg-blue-800/20 border border-blue-500/20">
              <h6 className="text-sm font-semibold text-blue-300 text-center mb-4">
                {content.interface.responsiveness.title}
              </h6>
              <div className="grid gap-3">
                {content.interface.responsiveness.breakpoints?.map(
                  (bp: AnalyzerBreakpoint) => (
                    <div
                      key={bp.size}
                      className="p-3 rounded-lg bg-slate-800/50 border border-white/10"
                    >
                      <p className="text-xs font-semibold text-blue-200">
                        {bp.size}
                      </p>
                      <p className="text-xs text-blue-300 mb-1">{bp.layout}</p>
                      <p className="text-xs text-slate-400">{bp.description}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Modal de procedimiento (documentación) */}
      <section className="mb-8">
        <h5 className="text-lg font-semibold text-purple-300 text-center mb-6">
          {content?.modal?.title}
        </h5>

        <div className="p-4 rounded-lg bg-purple-800/20 border border-purple-500/20 mb-4">
          <p className="text-xs text-purple-300 mb-4 text-center">
            {content?.modal?.purpose}
          </p>

          <div className="space-y-3 mb-4">
            <p className="text-xs font-medium text-slate-300">
              Características:
            </p>
            <ul className="space-y-1">
              {content?.modal?.features?.map((feature: string) => (
                <li
                  key={feature}
                  className="text-xs text-slate-400 flex items-start gap-1"
                >
                  <ArrowRight
                    size={8}
                    className="text-purple-400 mt-0.5 flex-shrink-0"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {content?.modal?.types?.map((type: AnalyzerModalType) => (
              <div
                key={type.name}
                className="p-3 rounded-lg bg-slate-800/50 border border-white/10"
              >
                <h6 className="text-xs font-semibold text-purple-200 mb-1">
                  {type.name}
                </h6>
                <p className="text-xs text-purple-300 mb-2">
                  {type.description}
                </p>
                <p className="text-xs text-slate-400">{type.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modos de Análisis */}
      {content?.analysisModes && (
        <section className="mb-8">
          <h5 className="text-lg font-semibold text-yellow-300 text-center mb-6">
            {content.analysisModes.title}
          </h5>
          <div className="grid md:grid-cols-3 gap-4">
            {content.analysisModes.modes.map((mode: AnalysisMode) => (
              <div
                key={mode.name}
                className="p-3 rounded-lg bg-slate-800/50 border border-white/10"
              >
                <h6 className="text-sm font-semibold text-yellow-200 mb-2">
                  {mode.name}
                </h6>
                <p className="text-xs text-yellow-300 mb-2">
                  {mode.description}
                </p>
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-1">
                    Características:
                  </p>
                  <ul className="space-y-1">
                    {mode.features.map((feature: string) => (
                      <li
                        key={feature}
                        className="text-xs text-slate-400 flex items-start gap-1"
                      >
                        <ArrowRight
                          size={8}
                          className="text-yellow-400 mt-0.5 flex-shrink-0"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Implementación Técnica */}
      {content?.implementation && (
        <section className="mb-8">
          <h5 className="text-lg font-semibold text-orange-300 text-center mb-6">
            {content.implementation.title}
          </h5>
          <div className="p-4 rounded-lg bg-orange-800/20 border border-orange-500/20">
            <p className="text-xs text-orange-300 mb-4 text-center">
              {content.implementation.description}
            </p>
            <div>
              <p className="text-xs font-medium text-slate-300 mb-2">
                Características:
              </p>
              <ul className="space-y-1">
                {content.implementation.features.map((feature: string) => (
                  <li
                    key={feature}
                    className="text-xs text-slate-400 flex items-start gap-1"
                  >
                    <ArrowRight
                      size={8}
                      className="text-orange-400 mt-0.5 flex-shrink-0"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Visitors Especializados */}
      {content?.visitors && (
        <section className="mb-8">
          <h5 className="text-lg font-semibold text-indigo-300 text-center mb-6">
            {content.visitors.title}
          </h5>
          <div className="grid md:grid-cols-2 gap-4">
            {content.visitors.list.map((visitor: VisitorInfo) => (
              <div
                key={visitor.name}
                className="p-3 rounded-lg bg-slate-800/50 border border-white/10"
              >
                <h6 className="text-sm font-semibold text-indigo-200 mb-2">
                  {visitor.name}
                </h6>
                <p className="text-xs text-indigo-300 mb-2">
                  {visitor.description}
                </p>
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-1">
                    Características:
                  </p>
                  <ul className="space-y-1">
                    {visitor.features.map((feature: string) => (
                      <li
                        key={feature}
                        className="text-xs text-slate-400 flex items-start gap-1"
                      >
                        <ArrowRight
                          size={8}
                          className="text-indigo-400 mt-0.5 flex-shrink-0"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Algoritmos Soportados */}
      {content?.algorithms && (
        <section className="mb-8">
          <h5 className="text-lg font-semibold text-teal-300 text-center mb-6">
            {content.algorithms.title}
          </h5>
          <div className="space-y-4">
            {content.algorithms.categories.map(
              (category: AlgorithmCategory) => (
                <div
                  key={category.name}
                  className="p-4 rounded-lg bg-teal-800/20 border border-teal-500/20"
                >
                  <h6 className="text-sm font-semibold text-teal-200 mb-3">
                    {category.name}
                  </h6>
                  <ul className="space-y-1">
                    {category.examples.map((example: string) => (
                      <li
                        key={example}
                        className="text-xs text-slate-400 flex items-start gap-1"
                      >
                        <ArrowRight
                          size={8}
                          className="text-teal-400 mt-0.5 flex-shrink-0"
                        />
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {/* API y Endpoints */}
      {content?.api && (
        <section className="mb-8">
          <h5 className="text-lg font-semibold text-pink-300 text-center mb-6">
            {content.api.title}
          </h5>
          <div className="p-4 rounded-lg bg-pink-800/20 border border-pink-500/20">
            <div className="mb-4">
              <h6 className="text-sm font-semibold text-pink-200 mb-2">
                {content.api.endpoint.name}
              </h6>
              <p className="text-xs text-pink-300 mb-3">
                {content.api.endpoint.description}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                <p className="text-xs font-medium text-slate-300 mb-2">
                  Request:
                </p>
                <pre className="text-xs text-slate-400 overflow-x-auto">
                  {JSON.stringify(content.api.endpoint.request, null, 2)}
                </pre>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                <p className="text-xs font-medium text-slate-300 mb-2">
                  Response:
                </p>
                <pre className="text-xs text-slate-400 overflow-x-auto">
                  {JSON.stringify(content.api.endpoint.response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Componentes */}
      {content?.components && (
        <section className="p-4 rounded-lg bg-green-800/20 border border-green-500/20 mb-8">
          <h5 className="text-lg font-semibold text-green-300 text-center mb-4">
            {content.components.title}
          </h5>
          <div className="grid gap-4">
            {content.components.list?.map((comp: AnalyzerComponentInfo) => (
              <div
                key={comp.name}
                className="p-3 rounded-lg bg-slate-800/50 border border-white/10"
              >
                <div className="mb-2">
                  <h6 className="text-sm font-semibold text-green-200">
                    {comp.name}
                  </h6>
                  <p className="text-xs text-slate-400">{comp.file}</p>
                </div>
                <p className="text-xs text-green-300 mb-2">{comp.purpose}</p>
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-1">
                    Props:
                  </p>
                  <ul className="space-y-1">
                    {comp.props?.map((prop: string) => (
                      <li key={prop} className="text-xs text-slate-400 ml-2">
                        • {prop}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Teorema Maestro (solo para analizador recursivo) */}
      {content?.masterTheorem && (
        <section className="mb-8">
          <h5 className="text-lg font-semibold text-emerald-300 text-center mb-6">
            {content.masterTheorem.title}
          </h5>
          <div className="p-4 rounded-lg bg-emerald-800/20 border border-emerald-500/20 mb-4">
            <div className="text-xs text-emerald-300 mb-4 text-center space-y-2">
              <p>El Teorema Maestro resuelve recurrencias de la forma</p>
              <div className="flex justify-center">
                <Formula latex="T(n) = a \\cdot T(n/b) + f(n)" display />
              </div>
              <p>
                donde <Formula latex="a \\geq 1" />, <Formula latex="b > 1" />,
                y <Formula latex="f(n)" /> es una función asintóticamente
                positiva.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {content.masterTheorem.cases.map((theoremCase) => (
                <div
                  key={theoremCase.case}
                  className="p-3 rounded-lg bg-slate-800/50 border border-white/10"
                >
                  <h6 className="text-sm font-semibold text-emerald-200 mb-2">
                    Caso {theoremCase.case}
                  </h6>
                  <div className="text-xs text-emerald-300 mb-2 font-medium flex justify-center">
                    <Formula latex={theoremCase.condition} />
                  </div>
                  <div className="text-xs text-slate-300 mb-2 flex justify-center">
                    <Formula latex={theoremCase.result} />
                  </div>
                  <p className="text-xs text-slate-400 mb-2">
                    {theoremCase.description}
                  </p>
                  <div className="text-xs text-slate-500 flex justify-center">
                    <Formula latex={theoremCase.example} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Extracción de Recurrencias (solo para analizador recursivo) */}
      {content?.recurrenceExtraction && (
        <section className="mb-8">
          <h5 className="text-lg font-semibold text-amber-300 text-center mb-6">
            {content.recurrenceExtraction.title}
          </h5>
          <div className="p-4 rounded-lg bg-amber-800/20 border border-amber-500/20">
            <p className="text-xs text-amber-300 mb-4 text-center">
              {content.recurrenceExtraction.description}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-300 mb-2">
                  Proceso:
                </p>
                <ol className="space-y-1">
                  {content.recurrenceExtraction.process.map(
                    (step: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-400 flex items-start gap-1"
                      >
                        <span className="text-amber-400">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ),
                  )}
                </ol>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-300 mb-2">
                  Requisitos:
                </p>
                <ul className="space-y-1">
                  {content.recurrenceExtraction.requirements.map(
                    (req: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-400 flex items-start gap-1"
                      >
                        <ArrowRight
                          size={8}
                          className="text-amber-400 mt-0.5 flex-shrink-0"
                        />
                        <span>{req}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Visualizaciones (solo para analizador recursivo) */}
      {content?.visualization && (
        <section className="mb-8">
          <h5 className="text-lg font-semibold text-violet-300 text-center mb-6">
            {content.visualization.title}
          </h5>
          <div className="grid md:grid-cols-2 gap-4">
            {content.visualization.components.map((component) => (
              <div
                key={component.name}
                className="p-4 rounded-lg bg-violet-800/20 border border-violet-500/20"
              >
                <h6 className="text-sm font-semibold text-violet-200 mb-2">
                  {component.name}
                </h6>
                <p className="text-xs text-violet-300 mb-3">
                  {component.description}
                </p>
                {component.features && component.features.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-300 mb-1">
                      Características:
                    </p>
                    <ul className="space-y-1">
                      {component.features.map((feature: string) => (
                        <li
                          key={feature}
                          className="text-xs text-slate-400 flex items-start gap-1"
                        >
                          <ArrowRight
                            size={8}
                            className="text-violet-400 mt-0.5 flex-shrink-0"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {component.sections && component.sections.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-300 mb-1">
                      Secciones:
                    </p>
                    <ul className="space-y-1">
                      {component.sections.map((section: string) => (
                        <li
                          key={section}
                          className="text-xs text-slate-400 flex items-start gap-1"
                        >
                          <ArrowRight
                            size={8}
                            className="text-violet-400 mt-0.5 flex-shrink-0"
                          />
                          <span>{section}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

/* -------- Render: Text -------- */
function TextDetail({ section }: Readonly<{ section: DocumentationSection }>) {
  const content = section.content as TextContent;

  // Helper function to render text with LaTeX support
  const renderContent = (text: string) => {
    // Split text by LaTeX delimiters (inline: $...$ or display: $$...$$)
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);

    return parts.map((part, idx) => {
      // Display math ($$...$$)
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latex = part.slice(2, -2).trim();
        return <Formula key={idx} latex={latex} display />;
      }
      // Inline math ($...$)
      if (part.startsWith('$') && part.endsWith('$')) {
        const latex = part.slice(1, -1).trim();
        return <Formula key={idx} latex={latex} />;
      }
      // Regular text - preserve line breaks
      return (
        <span key={idx} className="whitespace-pre-line">
          {part}
        </span>
      );
    });
  };

  // Get icon and color based on section ID
  const getSectionStyle = (sectionId: string) => {
    const styles: Record<string, { icon: JSX.Element; bgColor: string; borderColor: string; iconColor: string }> = {
      'memoization': {
        icon: <BarChart3 size={20} />,
        bgColor: 'bg-blue-800/20',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400'
      },
      'llm-jobs-models': {
        icon: <Zap size={20} />,
        bgColor: 'bg-purple-800/20',
        borderColor: 'border-purple-500/30',
        iconColor: 'text-purple-400'
      },
      'recursive-methods': {
        icon: <Calculator size={20} />,
        bgColor: 'bg-emerald-800/20',
        borderColor: 'border-emerald-500/30',
        iconColor: 'text-emerald-400'
      },
      'request-flow': {
        icon: <ArrowRight size={20} />,
        bgColor: 'bg-cyan-800/20',
        borderColor: 'border-cyan-500/30',
        iconColor: 'text-cyan-400'
      },
      'react-flow': {
        icon: <Code2 size={20} />,
        bgColor: 'bg-violet-800/20',
        borderColor: 'border-violet-500/30',
        iconColor: 'text-violet-400'
      },
      'gpu-cpu': {
        icon: <Settings size={20} />,
        bgColor: 'bg-orange-800/20',
        borderColor: 'border-orange-500/30',
        iconColor: 'text-orange-400'
      },
      'trace-env': {
        icon: <Package size={20} />,
        bgColor: 'bg-pink-800/20',
        borderColor: 'border-pink-500/30',
        iconColor: 'text-pink-400'
      },
      'trace-environment': {
        icon: <Package size={20} />,
        bgColor: 'bg-pink-800/20',
        borderColor: 'border-pink-500/30',
        iconColor: 'text-pink-400'
      }
    };

    return styles[sectionId] || {
      icon: <ArrowRight size={20} />,
      bgColor: 'bg-slate-700/30',
      borderColor: 'border-white/10',
      iconColor: 'text-slate-400'
    };
  };

  const style = getSectionStyle(section.id);

  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      {/* Header with icon */}
      <header className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${style.bgColor} border ${style.borderColor}`}>
          <div className={style.iconColor}>
            {style.icon}
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white">{section.title}</h4>
          <p className="text-xs text-slate-400">{section.description}</p>
        </div>
      </header>

      {/* Content sections */}
      <div className="space-y-4">
        {content?.sections?.map((textSection: TextSection, idx: number) => (
          <div
            key={idx}
            className={`p-4 rounded-lg ${style.bgColor} border ${style.borderColor} transition-all hover:border-opacity-50`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
              <h5 className="text-sm font-semibold text-white">
                {textSection.title}
              </h5>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed">
              {renderContent(textSection.content)}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
