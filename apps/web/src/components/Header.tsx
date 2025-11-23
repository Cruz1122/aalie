"use client";

/**
 * Componente Header con navegación principal de la aplicación.
 * Incluye navegación responsive con menú móvil.
 * 
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
import { usePathname } from "next/navigation";
import { useState } from "react";

import NavigationLink from "./NavigationLink";

/**
 * Interfaz para elementos de navegación.
 */
interface NavItem {
  /** URL del enlace */
  href: string;
  /** Etiqueta visible del enlace */
  label: string;
  /** Nombre del ícono Material Symbols */
  icon: string;
  /** Color del tema del enlace */
  color: string;
}

const navItems: NavItem[] = [
  { href: "/", label: "Inicio", icon: "home", color: "purple" },
  { href: "/analyzer", label: "Analizador", icon: "analytics", color: "orange" },
  { href: "/documentation", label: "Documentación", icon: "menu_book", color: "blue" },
  { href: "/examples", label: "Ejemplos", icon: "code_blocks", color: "emerald" },
  { href: "/about-us", label: "Acerca de", icon: "info", color: "cyan" },
];

const getColorClasses = (color: string, isActiveItem: boolean) => {
  if (isActiveItem) {
    switch (color) {
      case "purple":
        return "bg-purple-500/20 text-white border-purple-500/30";
      case "orange":
        return "bg-orange-500/20 text-white border-orange-500/30";
      case "blue":
        return "bg-blue-500/20 text-white border-blue-500/30";
      case "emerald":
        return "bg-emerald-500/20 text-white border-emerald-500/30";
      case "cyan":
        return "bg-cyan-500/20 text-white border-cyan-500/30";
      default:
        return "bg-purple-500/20 text-white border-purple-500/30";
    }
  }
  switch (color) {
    case "purple":
      return "text-slate-400 hover:text-white hover:bg-purple-500/10 hover:border-purple-500/20";
    case "orange":
      return "text-slate-400 hover:text-white hover:bg-orange-500/10 hover:border-orange-500/20";
    case "blue":
      return "text-slate-400 hover:text-white hover:bg-blue-500/10 hover:border-blue-500/20";
    case "emerald":
      return "text-slate-400 hover:text-white hover:bg-emerald-500/10 hover:border-emerald-500/20";
    case "cyan":
      return "text-slate-400 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/20";
    default:
      return "text-slate-400 hover:text-white hover:bg-purple-500/10 hover:border-purple-500/20";
  }
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
        <div className="hidden lg:flex items-center gap-2">
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${getColorClasses(item.color, active)}`}
                >
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </NavigationLink>
              );
            })}
          </nav>
        </div>

        {/* Botón Hamburguesa para Mobile */}
        <button
          className="lg:hidden glass-secondary p-2 rounded-lg transition-colors flex items-center justify-center hover:bg-white/10"
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined text-lg text-slate-300">{isMenuOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {/* Menú Mobile */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 glass-header border-t border-white/10 z-50 backdrop-blur-sm">
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
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </NavigationLink>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
