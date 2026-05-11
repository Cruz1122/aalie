"use client";

import type { MermaidDiagramBlock as MermaidDiagramBlockType } from "@aa/content-catalog";
import { useEffect, useMemo, useState } from "react";

interface MermaidDiagramBlockProps {
  block: MermaidDiagramBlockType;
}

export function MermaidDiagramBlock({ block }: MermaidDiagramBlockProps) {
  const diagramId = useMemo(
    () => `mermaid-${block.id}-${Math.random().toString(36).slice(2, 8)}`,
    [block.id],
  );
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "dark",
          suppressErrorRendering: true,
        });
        const renderResult = await mermaid.render(diagramId, block.code);
        if (!cancelled) {
          setSvg(renderResult.svg);
          setError(null);
        }
      } catch (renderError) {
        if (!cancelled) {
          setSvg("");
          setError(
            renderError instanceof Error
              ? renderError.message
              : "No se pudo renderizar Mermaid.",
          );
        }
      }
    };

    void renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [block.code, diagramId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const renderDiagramContainer = (extraClassName = "") => (
    <div
      className={`scrollbar-custom overflow-x-auto rounded-xl border border-white/10 bg-[#08111a] p-3 ${extraClassName}`.trim()}
    >
      {error ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
            Mermaid inválido. Mostrando código fuente.
          </p>
          <pre className="text-sm leading-6 text-amber-100">
            <code>{block.code}</code>
          </pre>
          <p className="text-xs text-amber-300/90">{error}</p>
        </div>
      ) : svg ? (
        <div
          className="min-w-[720px]"
          dangerouslySetInnerHTML={{ __html: svg }}
          aria-label="Mermaid diagram"
        />
      ) : (
        <p className="text-xs text-slate-300">Renderizando diagrama...</p>
      )}
    </div>
  );

  return (
    <section
      id={block.id}
      className="space-y-3 rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
          {block.title ?? "Mermaid"}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/20"
          >
            {copied ? "Copiado" : "Copiar Mermaid"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Ampliar
          </button>
        </div>
      </div>
      {renderDiagramContainer()}
      {block.caption ? (
        <p className="text-xs text-slate-400">{block.caption}</p>
      ) : null}
      {expanded ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
          <div className="scrollbar-custom max-h-[90vh] w-full max-w-7xl space-y-3 overflow-auto rounded-2xl border border-white/15 bg-slate-900 p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-cyan-100">
                {block.title ?? "Mermaid"}
              </h4>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-md border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
            {renderDiagramContainer("max-h-[75vh]")}
          </div>
        </div>
      ) : null}
    </section>
  );
}
