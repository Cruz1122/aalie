"use client";

/**
 * Componente Header con navegación principal de la aplicación.
 * Incluye navegación responsive con menú móvil.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
import { useTranslations } from "next-intl";
import { useState } from "react";

import { usePathname } from "@/i18n/navigation";

import NavigationLink from "./NavigationLink";

/**
 * Interfaz para elementos de navegación.
 */
interface NavItem {
  /** URL del enlace */
  href: string;
  /** Clave de traducción para la etiqueta */
  labelKey: string;
  /** Nombre del ícono Material Symbols */
  icon: string;
  /** Color del tema del enlace */
  color: string;
}

const navItems: NavItem[] = [
  { href: "/", labelKey: "home", icon: "home", color: "purple" },
  {
    href: "/analyzer",
    labelKey: "analyzer",
    icon: "analytics",
    color: "orange",
  },
  {
    href: "/user-guide",
    labelKey: "howToUse",
    icon: "menu_book",
    color: "blue",
  },
  {
    href: "/examples",
    labelKey: "examples",
    icon: "code_blocks",
    color: "emerald",
  },
  { href: "/course", labelKey: "course", icon: "school", color: "amber" },
  { href: "/quizzes", labelKey: "quizzes", icon: "quiz", color: "teal" },
  { href: "/about-us", labelKey: "about", icon: "info", color: "cyan" },
];

const getColorClasses = (_color: string, isActiveItem: boolean) => {
  if (isActiveItem) {
    return "bg-transparent text-white border-white/55 shadow-[0_0_0_1px_rgba(255,255,255,0.16)]";
  }

  return "text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/25";
};

/**
 * Componente Header principal de la aplicación.
 * Renderiza la navegación principal con soporte responsive.
 *
 * @returns Elemento JSX del header
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * <Header />
 * ```
 */
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <header className="glass-header relative z-50">
      <div className="flex items-center justify-center whitespace-nowrap px-4 sm:px-6 py-2">
        {/* Navegación Desktop - Centrada */}
        <div className="hidden lg:flex items-center gap-4">
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${getColorClasses(item.color, active)}`}
                >
                  <span className="material-symbols-outlined text-base">
                    {item.icon}
                  </span>
                  <span>{t(item.labelKey)}</span>
                </NavigationLink>
              );
            })}
          </nav>
        </div>

        {/* Botón Hamburguesa para Mobile */}
        <button
          className="lg:hidden glass-secondary p-2 rounded-lg transition-colors flex items-center justify-center hover:bg-white/10"
          onClick={toggleMenu}
          aria-label={t("openMenu")}
        >
          <span className="material-symbols-outlined text-lg text-slate-300">
            {isMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Menú Mobile */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 glass-header border-t border-white/10 z-50 backdrop-blur-sm bg-slate-900/98">
          <nav className="flex flex-col p-3 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm font-medium transition-all ${getColorClasses(item.color, active)}`}
                  onClick={toggleMenu}
                >
                  <span className="material-symbols-outlined text-base">
                    {item.icon}
                  </span>
                  <span>{t(item.labelKey)}</span>
                </NavigationLink>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
