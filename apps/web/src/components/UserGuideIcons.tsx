"use client";

const ICON_MAP: Record<string, string> = {
  "mod-user-guide-introduccion": "info",
  "mod-user-guide-editor": "edit_square",
  "mod-user-guide-grammar": "functions",
  "mod-user-guide-analysis": "analytics",
  "mod-user-guide-examples": "lightbulb",
  "mod-user-guide-troubleshooting": "bug_report",
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
