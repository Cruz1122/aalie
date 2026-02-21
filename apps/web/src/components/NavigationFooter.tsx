"use client";

import { useTranslations } from "next-intl";

import NavigationLink from "./NavigationLink";

export interface NavLinkConfig {
  href: string;
  labelKey: string;
  icon?: "arrow_back" | "arrow_forward";
}

interface NavigationFooterProps {
  /** Namespace de traducciones (ej: "userGuide", "documentation.technical") */
  namespace: string;
  /** Enlace "anterior" (izquierda) */
  prev?: NavLinkConfig;
  /** Enlace "siguiente" (derecha) */
  next?: NavLinkConfig;
  /** Clases adicionales para el contenedor */
  className?: string;
}

/**
 * Footer de navegación reutilizable para páginas de documentación y guías.
 * Muestra enlaces de navegación anterior/siguiente con estilo consistente.
 *
 * @author AALIE
 * @version 0.1.0
 */
export function NavigationFooter({
  namespace,
  prev,
  next,
  className = "",
}: NavigationFooterProps) {
  const t = useTranslations(namespace);

  if (!prev && !next) return null;

  return (
    <footer
      className={`glass-card p-4 sm:p-6 rounded-xl mt-8 border border-white/5 min-w-0 ${className}`}
      aria-label="Navegación de página"
    >
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 min-w-0">
        {prev ? (
          <NavigationLink
            href={prev.href}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group min-w-0 py-2 sm:py-0 min-h-[44px] sm:min-h-0"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform flex-shrink-0">
              {prev.icon ?? "arrow_back"}
            </span>
            <span className="font-medium truncate">{t(prev.labelKey)}</span>
          </NavigationLink>
        ) : (
          <div />
        )}
        {next ? (
          <NavigationLink
            href={next.href}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors group min-w-0 py-2 sm:py-0 min-h-[44px] sm:min-h-0 justify-end sm:justify-start"
          >
            <span className="font-medium truncate">{t(next.labelKey)}</span>
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform flex-shrink-0">
              {next.icon ?? "arrow_forward"}
            </span>
          </NavigationLink>
        ) : (
          <div />
        )}
      </div>
    </footer>
  );
}
