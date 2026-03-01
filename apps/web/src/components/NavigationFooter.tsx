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

const linkBase =
  "flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white min-h-[44px] min-w-0 flex-1 basis-0 overflow-hidden";

/**
 * Footer de navegación reutilizable para páginas de documentación y guías.
 * Estilo alineado con glass-secondary y enlaces tipo app (analizador, documentación).
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
    <nav
      className={`glass-secondary rounded-xl border border-white/10 p-2 sm:p-4 mt-6 sm:mt-8 min-w-0 ${className}`}
      aria-label="Navegación de página"
    >
      <div className="flex flex-row justify-between items-stretch gap-2 sm:gap-4 min-w-0">
        {prev ? (
          <NavigationLink
            href={prev.href}
            className={`${linkBase} justify-start group`}
            title={t(prev.labelKey)}
          >
            <span className="material-symbols-outlined text-base sm:text-lg text-slate-400 group-hover:text-slate-200 group-hover:-translate-x-0.5 transition-all flex-shrink-0">
              {prev.icon ?? "arrow_back"}
            </span>
            <span className="truncate">{t(prev.labelKey)}</span>
          </NavigationLink>
        ) : (
          <div className="flex-1 min-w-0" aria-hidden />
        )}
        {next ? (
          <NavigationLink
            href={next.href}
            className={`${linkBase} justify-end group`}
            title={t(next.labelKey)}
          >
            <span className="truncate">{t(next.labelKey)}</span>
            <span className="material-symbols-outlined text-base sm:text-lg text-slate-400 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all flex-shrink-0">
              {next.icon ?? "arrow_forward"}
            </span>
          </NavigationLink>
        ) : (
          <div className="flex-1 min-w-0" aria-hidden />
        )}
      </div>
    </nav>
  );
}
