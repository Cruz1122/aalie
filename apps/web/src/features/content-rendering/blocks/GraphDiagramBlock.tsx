"use client";

import type { GraphDiagramBlock as GraphDiagramBlockType } from "@aa/content-catalog";

interface GraphDiagramBlockProps {
  block: GraphDiagramBlockType;
}

export function GraphDiagramBlock({ block }: GraphDiagramBlockProps) {
  return (
    <section
      id={block.id}
      className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
    >
      {block.title ? (
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          {block.title}
        </h3>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-400">
            Nodos
          </div>
          <div className="flex flex-wrap gap-2">
            {block.nodes.map((node) => (
              <span
                key={node.nodeId}
                className="rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-sm text-sky-100"
              >
                {node.label}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-400">
            Aristas
          </div>
          <ul className="space-y-2 text-sm text-slate-200">
            {block.edges.map((edge) => (
              <li key={edge.edgeId}>
                {edge.source} {"->"} {edge.target}
                {edge.label ? ` (${edge.label})` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {block.caption ? (
        <p className="text-xs text-slate-400">{block.caption}</p>
      ) : null}
    </section>
  );
}
