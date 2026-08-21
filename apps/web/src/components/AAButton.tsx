"use client";

import React from "react";

/**
 * Botón reutilizable con variantes de color alineadas al estilo de las cards de ejemplos.
 * Reemplaza glass-button con el patrón bg-{color}/25 border-{color}/40 hover:bg-{color}/35.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * @version 0.1.0
 */

export type AAButtonVariant =
  | "primary"
  | "amber"
  | "purple"
  | "blue"
  | "cyan"
  | "google"
  | "secondary";

const VARIANT_CLASSES: Record<AAButtonVariant, string> = {
  primary:
    "bg-primary/25 border border-primary/40 hover:bg-primary/35 text-white",
  amber:
    "bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:from-yellow-500/30 hover:to-amber-500/30 text-white",
  purple:
    "bg-gradient-to-br from-purple-500/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-500/30 text-white",
  blue: "bg-gradient-to-br from-blue-500/20 to-blue-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-blue-500/30 text-white",
  cyan: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 text-white",
  google:
    "border border-white/80 bg-white text-slate-950 shadow-sm shadow-black/20 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
  secondary:
    "border border-white/10 hover:bg-white/5 hover:border-white/20 text-slate-300",
};

export type AAButtonSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AAButtonSize, string> = {
  sm: "py-1.5 px-3 text-xs",
  md: "py-2 px-4 text-sm",
  lg: "py-2.5 px-6 text-sm",
};

export interface AAButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: AAButtonVariant;
  readonly size?: AAButtonSize;
  readonly children: React.ReactNode;
}

export default function AAButton({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...rest
}: AAButtonProps): React.JSX.Element {
  const base =
    "rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2";
  const combined = [
    base,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={combined} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
