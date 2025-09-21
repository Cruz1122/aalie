"use client";
import { useEffect } from "react";
import { Zap, Package, Settings, Calculator, BarChart3, ArrowRight } from "lucide-react";
import Formula from "@/components/Formula";
import { DocumentationSection } from "@/types/documentation";

export default function DocumentationModal({
  open,
  onClose,
  section,
}: {
  open: boolean;
  onClose: () => void;
  section: DocumentationSection | null;
}) {
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
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar overflow original cuando se cierre el modal
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  if (!open || !section) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(90vw,800px)] max-h-[80vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 p-6 ring-1 ring-white/10 shadow-2xl">
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
        <div className="mt-6 space-y-6">
          {renderSectionDetail(section)}
        </div>
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
    default:
      // Por defecto solo muestra el diagrama si existe
      return (
        <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
          {section.image?.src && (
            <div className="flex justify-center">
              {/* Imagen redimensionada para el modal */}
              <img
                src={section.image.src}
                alt={section.image.alt || section.title}
                className="rounded-lg border border-white/10 max-w-full max-h-[400px] object-contain"
              />
            </div>
          )}
        </div>
      );
  }
}

/* -------- Render: UI Showcase -------- */
function UIShowcaseDetail({ section }: { section: DocumentationSection }) {
  return (
    <article className="p-4 rounded-lg bg-gradient-to-b from-slate-800/50 to-slate-800/30 border border-purple-500/20">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-400/30">
            <Zap size={56} className="text-purple-400" />
          </div>
        </div>
        <h4 className="text-lg font-semibold text-white text-center">{section.title}</h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-6">
        {section.description}
      </p>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="font-semibold text-purple-300 mb-1">Componentes</div>
          <div className="text-slate-300">Button, Modal, TableCosts</div>
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="font-semibold text-blue-300">Interactivo</div>
          <div className="text-slate-300">Demos en vivo</div>
        </div>
      </div>

      {section.image?.caption && (
        <p className="text-xs text-slate-400 text-center mt-6">{section.image.caption}</p>
      )}
    </article>
  );
}

/* -------- Render: Packages -------- */
function PackagesDetail({ section }: { section: DocumentationSection }) {
  const content = section.content as any;
  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <Package size={56} className="text-purple-400" />
        </div>
        <h4 className="text-lg font-semibold text-white text-center">{section.title}</h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-6">{section.description}</p>

      <div className="grid md:grid-cols-2 gap-6 mb-2 max-w-4xl mx-auto">
        {content?.packages?.map((pkg: any) => (
          <div key={pkg.name} className="space-y-4 p-4 rounded-lg bg-slate-800/50 border border-white/10">
            <div>
              <h5 className="text-base font-semibold text-white mb-1">{pkg.name}</h5>
              <p className="text-sm font-medium text-purple-300 mb-2">{pkg.purpose}</p>
              <p className="text-xs text-slate-400">{pkg.description}</p>
            </div>

            <div className="space-y-3">
              <div>
                <h6 className="text-xs font-semibold text-blue-300 mb-1">Entrada</h6>
                <p className="text-xs text-slate-300">{pkg.io?.input}</p>
              </div>

              <div>
                <h6 className="text-xs font-semibold text-emerald-300 mb-1">Salidas</h6>
                <ul className="space-y-1">
                  {pkg.io?.outputs?.map((output: string) => (
                    <li key={output} className="text-xs text-slate-300 flex items-start gap-1">
                      <ArrowRight size={10} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{output}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h6 className="text-xs font-semibold text-amber-300 mb-1">Usado por</h6>
                <ul className="space-y-1">
                  {pkg.usedBy?.map((user: string) => (
                    <li key={user} className="text-xs text-slate-300">{user}</li>
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
function ToolsDetail({ section }: { section: DocumentationSection }) {
  const content = section.content as any;

  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <Settings size={56} className="text-green-400" />
        </div>
        <h4 className="text-lg font-semibold text-white text-center">{section.title}</h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-8">{section.description}</p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Frontend */}
        <div className="space-y-4">
          <h5 className="text-lg font-semibold text-blue-300 text-center">
            {content?.frontend?.title}
          </h5>
          <div className="space-y-4">
            {content?.frontend?.tools?.map((tool: any) => (
              <div key={tool.name} className="p-4 rounded-lg bg-blue-800/20 border border-blue-500/20">
                <div className="mb-3">
                  <h6 className="text-sm font-semibold text-blue-200 mb-1">{tool.name}</h6>
                  <p className="text-xs text-blue-300 mb-2">{tool.purpose}</p>
                  {tool.config && <p className="text-xs text-slate-400">Config: {tool.config}</p>}
                </div>
                <div>
                  <h6 className="text-xs font-semibold text-slate-300 mb-1">Características</h6>
                  <ul className="space-y-1">
                    {tool.features?.map((feature: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-400 flex items-start gap-1">
                        <ArrowRight size={8} className="text-blue-400 mt-0.5 flex-shrink-0" />
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
            {content?.backend?.tools?.map((tool: any) => (
              <div key={tool.name} className="p-4 rounded-lg bg-green-800/20 border border-green-500/20">
                <div className="mb-3">
                  <h6 className="text-sm font-semibold text-green-200 mb-1">{tool.name}</h6>
                  <p className="text-xs text-green-300 mb-2">{tool.purpose}</p>
                  {tool.config && <p className="text-xs text-slate-400">Config: {tool.config}</p>}
                </div>
                <div>
                  <h6 className="text-xs font-semibold text-slate-300 mb-1">Características</h6>
                  <ul className="space-y-1">
                    {tool.features?.map((feature: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-400 flex items-start gap-1">
                        <ArrowRight size={8} className="text-green-400 mt-0.5 flex-shrink-0" />
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
          {content?.automation?.commands?.map((cmd: any, idx: number) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
              <div className="flex items-start gap-3">
                <code className="text-xs font-mono text-purple-300 bg-purple-900/30 px-2 py-1 rounded flex-shrink-0">
                  {cmd.command}
                </code>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 mb-1">{cmd.description}</p>
                  {cmd.result && <p className="text-xs text-emerald-300 font-medium">{cmd.result}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

/* -------- Render: KaTeX -------- */
function KatexDetail({ section }: { section: DocumentationSection }) {
  const content = section.content as any;

  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <Calculator size={56} className="text-emerald-400" />
        </div>
        <h4 className="text-lg font-semibold text-white text-center">{section.title}</h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-8">{section.description}</p>

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
          <h6 className="text-xs font-semibold text-slate-300 mb-2">Características</h6>
          <ul className="space-y-1">
            {content?.implementation?.library?.features?.map((f: string, idx: number) => (
              <li key={idx} className="text-xs text-slate-400 flex items-start gap-1">
                <ArrowRight size={8} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Componentes y utilidades */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Componentes */}
          <div className="space-y-4">
            <h6 className="text-sm font-semibold text-blue-300 text-center">Componentes React</h6>
            {content?.implementation?.components?.map((component: any) => (
              <div key={component.name} className="p-3 rounded-lg bg-blue-800/20 border border-blue-500/20">
                <h6 className="text-xs font-semibold text-blue-200 mb-1">{component.name}</h6>
                <p className="text-xs text-blue-300 mb-2">{component.purpose}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-300">Props:</p>
                  <ul className="space-y-1">
                    {component.props?.map((prop: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-400 ml-2">• {prop}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-slate-300 mt-2">{component.usage}</p>
              </div>
            ))}
          </div>

          {/* Utilidades */}
          <div className="space-y-4">
            <h6 className="text-sm font-semibold text-purple-300 text-center">Utilidades</h6>
            {content?.implementation?.utilities?.map((utility: any) => (
              <div key={utility.function} className="p-3 rounded-lg bg-purple-800/20 border border-purple-500/20">
                <div className="mb-2">
                  <h6 className="text-xs font-semibold text-purple-200">{utility.function}</h6>
                  <p className="text-xs text-slate-400">en {utility.file}</p>
                </div>
                <p className="text-xs text-purple-300 mb-2">{utility.purpose}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-300">Configuración:</p>
                  <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded font-mono">
                    {Object.entries(utility.config || {}).map(([k, v]) => (
                      <div key={k}>
                        {k}: {typeof v === "string" ? `"${v}"` : String(v)}
                      </div>
                    ))}
                  </div>
                </div>
                {utility.security && (
                  <p className="text-xs text-emerald-300 mt-2 font-medium">{utility.security}</p>
                )}
              </div>
            ))}
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
          <h6 className="text-sm font-semibold text-amber-200 mb-2">Matemáticas Inline</h6>
          <p className="text-xs text-amber-300 mb-3">{content?.examples?.inline?.description}</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Código:</p>
              <code className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded block">
                {content?.examples?.inline?.code}
              </code>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Resultado:</p>
              <div className="p-2 rounded bg-slate-900/50 text-center">
                <Formula latex="E = mc^2" />
              </div>
            </div>
          </div>
        </div>

        {/* Block */}
        <div className="p-4 rounded-lg bg-amber-800/20 border border-amber-500/20 mb-4">
          <h6 className="text-sm font-semibold text-amber-200 mb-2">Ecuaciones en Bloque</h6>
          <p className="text-xs text-amber-300 mb-3">{content?.examples?.block?.description}</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Código:</p>
              <code className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded block">
                {content?.examples?.block?.code}
              </code>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Resultado:</p>
              <div className="p-3 rounded bg-slate-900/50 text-center">
                <Formula latex="\sum_{i=1}^{n} i = \frac{n(n+1)}{2}" display />
              </div>
            </div>
          </div>
        </div>

        {/* Complex */}
        <div className="p-4 rounded-lg bg-amber-800/20 border border-amber-500/20">
          <h6 className="text-sm font-semibold text-amber-200 mb-2">Ecuaciones Complejas</h6>
          <p className="text-xs text-amber-300 mb-3">{content?.examples?.complex?.description}</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Código:</p>
              <code className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded block break-all">
                {content?.examples?.complex?.code}
              </code>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1">Resultado:</p>
              <div className="p-3 rounded bg-slate-900/50 overflow-x-auto">
                <div className="space-y-2">
                  <Formula latex="T(n) = \sum_{i=1}^{n} \sum_{j=1}^{i} O(1)" display />
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
                <span className="font-medium text-slate-300">Personalización:</span>{" "}
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

/* -------- Render: Analyzer -------- */
function AnalyzerDetail({ section }: { section: DocumentationSection }) {
  const content = section.content as any;

  return (
    <article className="p-4 rounded-lg bg-slate-800/50 border border-white/10">
      <header className="space-y-4 mb-6">
        <div className="flex justify-center">
          <BarChart3 size={56} className="text-cyan-400" />
        </div>
        <h4 className="text-lg font-semibold text-white text-center">{section.title}</h4>
      </header>

      <p className="text-sm text-slate-300 text-center mb-8">{section.description}</p>

      {/* Interfaz 3 columnas */}
      <section className="mb-8">
        <h5 className="text-lg font-semibold text-cyan-300 text-center mb-6">
          {content?.interface?.title}
        </h5>

        <div className="p-4 rounded-lg bg-cyan-800/20 border border-cyan-500/20 mb-6">
          <p className="text-xs text-cyan-300 mb-4 text-center">
            {content?.interface?.layout?.description}
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {content?.interface?.layout?.columns?.map((column: any) => (
              <div key={column.name} className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                <h6 className="text-sm font-semibold text-cyan-200 mb-2">{column.name}</h6>
                <p className="text-xs text-cyan-300 mb-2">{column.purpose}</p>
                <p className="text-xs text-slate-400 mb-2">Componente: {column.component}</p>
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-1">Características:</p>
                  <ul className="space-y-1">
                    {column.features?.map((feature: string) => (
                      <li key={feature} className="text-xs text-slate-400 flex items-start gap-1">
                        <ArrowRight size={8} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsiveness */}
        <div className="p-4 rounded-lg bg-blue-800/20 border border-blue-500/20">
          <h6 className="text-sm font-semibold text-blue-300 text-center mb-4">
            {content?.interface?.responsiveness?.title}
          </h6>
          <div className="grid gap-3">
            {content?.interface?.responsiveness?.breakpoints?.map((bp: any) => (
              <div key={bp.size} className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                <p className="text-xs font-semibold text-blue-200">{bp.size}</p>
                <p className="text-xs text-blue-300 mb-1">{bp.layout}</p>
                <p className="text-xs text-slate-400">{bp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <p className="text-xs font-medium text-slate-300">Características:</p>
            <ul className="space-y-1">
              {content?.modal?.features?.map((feature: string) => (
                <li key={feature} className="text-xs text-slate-400 flex items-start gap-1">
                  <ArrowRight size={8} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {content?.modal?.types?.map((type: any) => (
              <div key={type.name} className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
                <h6 className="text-xs font-semibold text-purple-200 mb-1">{type.name}</h6>
                <p className="text-xs text-purple-300 mb-2">{type.description}</p>
                <p className="text-xs text-slate-400">{type.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Componentes */}
      <section className="p-4 rounded-lg bg-green-800/20 border border-green-500/20">
        <h5 className="text-lg font-semibold text-green-300 text-center mb-4">
          {content?.components?.title}
        </h5>
        <div className="grid gap-4">
          {content?.components?.list?.map((comp: any) => (
            <div key={comp.name} className="p-3 rounded-lg bg-slate-800/50 border border-white/10">
              <div className="mb-2">
                <h6 className="text-sm font-semibold text-green-200">{comp.name}</h6>
                <p className="text-xs text-slate-400">{comp.file}</p>
              </div>
              <p className="text-xs text-green-300 mb-2">{comp.purpose}</p>
              <div>
                <p className="text-xs font-medium text-slate-300 mb-1">Props:</p>
                <ul className="space-y-1">
                  {comp.props?.map((prop: string) => (
                    <li key={prop} className="text-xs text-slate-400 ml-2">• {prop}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
