"use client";

import AALIEIcon from "@/components/AALIEIcon";

const ICON_MAP: Record<string, string> = {
  introduccion: "info",
  "editor-basico": "settings",
  "editor-validacion": "verified",
  "editor-atajos": "keyboard",
  "gramatica-procedimientos": "functions",
  "gramatica-variables": "variable_add",
  "gramatica-estructuras": "account_tree",
  "gramatica-operadores": "calculate",
  "gramatica-arrays": "data_array",
  "gramatica-print": "print",
  "analisis-editor": "code",
  "analisis-chatbot": "aalie",
  "analisis-resultados": "insights",
  "analisis-llm": "compare_arrows",
  "analisis-gpu-cpu": "memory",
  "analisis-trace": "route",
  ejemplos: "lightbulb",
  errores: "bug_report",
};

interface UserGuideIconProps {
  sectionId: string;
  size?: number;
  className?: string;
}

/**
 * Icono para secciones de la guía de usuario.
 * Usa Material Symbols o AALIEIcon para la sección del chatbot.
 * Author: @Cruz1122
 * Version: 0.1.0
 */
export function UserGuideIcon({
  sectionId,
  size = 36,
  className = "",
}: UserGuideIconProps) {
  const iconName = ICON_MAP[sectionId] ?? "info";

  if (iconName === "aalie") {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl border border-slate-500/30 bg-slate-500/20 transition-all duration-200 hover:scale-110 hover:shadow-lg ${className}`}
        style={{ width: size + 24, height: size + 24 }}
      >
        <AALIEIcon className="text-primary drop-shadow-sm" size={size} />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl border border-slate-500/30 bg-slate-500/20 transition-all duration-200 hover:scale-110 hover:shadow-lg ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <span
        className="material-symbols-outlined text-slate-400 drop-shadow-sm"
        style={{ fontSize: size }}
      >
        {iconName}
      </span>
    </div>
  );
}
