"use client";

import Image from "next/image";

const ICON_MAP: Record<string, string> = {
  "mod-user-guide-linear-search-analyzer": "manage_search",
  "mod-user-guide-examples-bubble-sort": "view_list",
  "mod-user-guide-recursive-fibonacci": "account_tree",
  "mod-user-guide-loop-and-recursive-invariants": "verified_user",
  "mod-user-guide-export-pdf": "picture_as_pdf",
  "mod-user-guide-ai-assistant": "smart_toy",
  "mod-user-guide-courses-progress": "school",
  "mod-user-guide-quizzes": "quiz",
  "mod-complejidad-temporal-espacial": "timer",
  "mod-loop-invariant": "verified_user",
  "mod-algoritmos-iterativos-patrones-costos": "repeat",
  "mod-notaciones-asintoticas": "functions",
  "mod-tabla-maestra-notaciones-convenciones": "table_chart",
  "mod-relaciones-notaciones": "hub",
  "mod-demostraciones-completas-teorema-limites": "fact_check",
  "mod-matriz-comparaciones-notaciones": "grid_view",
  "mod-tabla-sumatorias-comunes": "calculate",
  "mod-cheatsheet-resumen-rapido": "description",
  "mod-algoritmos-recursivos": "account_tree",
  "mod-teorema-maestro": "gavel",
  "mod-arbol-recursion": "schema",
  "mod-ecuacion-caracteristica": "function",
  "mod-suposiciones-inteligentes": "psychology",
  "mod-programacion-dinamica": "auto_graph",
  "mod-algoritmos-voraces": "bolt",
  "mod-backtracking": "u_turn_left",
  "mod-branch-and-bound": "alt_route",
  "mod-comparacion-tecnicas-algoritmicas": "compare_arrows",
};

interface UserGuideIconProps {
  moduleId: string;
  size?: number;
  className?: string;
}

export function UserGuideIcon({
  moduleId,
  size = 36,
  className = "",
}: UserGuideIconProps) {
  if (moduleId === "mod-user-guide-getting-started") {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl border border-slate-500/30 bg-slate-500/20 ${className}`}
        style={{ width: size + 24, height: size + 24 }}
      >
        <Image
          src="/aalie.svg"
          alt="AALIE"
          width={size}
          height={size}
          className="brightness-0 invert"
          unoptimized
        />
      </div>
    );
  }

  const iconName = ICON_MAP[moduleId] ?? "menu_book";

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl border border-slate-500/30 bg-slate-500/20 ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <span
        className="material-symbols-outlined text-slate-200"
        style={{ fontSize: size }}
      >
        {iconName}
      </span>
    </div>
  );
}
