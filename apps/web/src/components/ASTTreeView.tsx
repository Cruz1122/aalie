import { useState } from "react";

interface ASTTreeViewProps {
  readonly node: unknown;
  readonly level?: number;
}

/**
 * Componente para renderizar el árbol AST de forma interactiva
 */
export function ASTTreeView({ node, level = 0 }: ASTTreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Expandir solo los primeros 2 niveles

  if (!node || typeof node !== "object") {
    return (
      <span className="text-yellow-200 font-mono text-xs">
        {JSON.stringify(node)}
      </span>
    );
  }

  if (Array.isArray(node)) {
    if (node.length === 0) {
      return <span className="text-slate-500 text-xs">[]</span>;
    }
    return (
      <div className="ml-4">
        {node.map((item, index) => (
          <div key={index} className="border-l-2 border-slate-700 pl-3 py-1">
            <span className="text-yellow-400 text-xs font-mono">[{index}]</span>
            <ASTTreeView node={item} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(node);
  if (entries.length === 0) {
    return <span className="text-slate-500 text-xs">{"{}"}</span>;
  }

  const nodeType =
    "type" in node && typeof node.type === "string" ? node.type : "Object";

  return (
    <div className={level > 0 ? "ml-4" : ""}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-left hover:bg-white/5 rounded px-2 py-1 transition-colors group"
      >
        <span
          className={`material-symbols-outlined text-sm text-yellow-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        >
          chevron_right
        </span>
        <span className="text-yellow-300 font-semibold text-sm">
          {nodeType}
        </span>
        {!isExpanded && (
          <span className="text-slate-500 text-xs">
            ({entries.length}{" "}
            {entries.length === 1 ? "propiedad" : "propiedades"})
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="ml-6 border-l-2 border-yellow-500/30 pl-3 mt-1">
          {entries.map(([key, value]) => (
            <div key={key} className="py-1">
              <div className="flex items-start gap-2">
                <span className="text-amber-300 text-xs font-mono font-semibold min-w-fit">
                  {key}:
                </span>
                {typeof value === "object" && value !== null ? (
                  <ASTTreeView node={value} level={level + 1} />
                ) : (
                  <span className="text-xs font-mono text-slate-300">
                    {typeof value === "string" ? `"${value}"` : String(value)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
