"use client";

import type { RecursionTreeBlock as RecursionTreeBlockType } from "@aa/content-catalog";

interface RecursionTreeBlockProps {
  block: RecursionTreeBlockType;
}

export function RecursionTreeBlock({ block }: RecursionTreeBlockProps) {
  const roots = block.nodes.filter((node) => !node.parentId);
  const childrenByParent = new Map<string, typeof block.nodes>();

  for (const node of block.nodes) {
    if (!node.parentId) {
      continue;
    }
    const current = childrenByParent.get(node.parentId) ?? [];
    current.push(node);
    childrenByParent.set(node.parentId, current);
  }

  const renderNode = (nodeId: string) => {
    const node = block.nodes.find((entry) => entry.nodeId === nodeId);
    if (!node) {
      return null;
    }
    const children = childrenByParent.get(nodeId) ?? [];
    return (
      <li key={node.nodeId} className="flex flex-col items-center gap-4">
        <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-50">
          {node.label}
        </div>
        {children.length ? (
          <ul className="flex flex-wrap justify-center gap-4">
            {children.map((child) => (
              <li
                key={child.nodeId}
                className="flex flex-col items-center gap-2"
              >
                {child.edgeLabel ? (
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {child.edgeLabel}
                  </span>
                ) : null}
                {renderNode(child.nodeId)}
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <section
      id={block.id}
      className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
    >
      {block.title ? (
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          {block.title}
        </h3>
      ) : null}
      <ul className="flex flex-wrap justify-center gap-6">
        {roots.map((root) => renderNode(root.nodeId))}
      </ul>
      {block.caption ? (
        <p className="text-xs text-slate-400">{block.caption}</p>
      ) : null}
    </section>
  );
}
