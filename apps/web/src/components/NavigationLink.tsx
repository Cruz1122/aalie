"use client";

import type { ReactNode, MouseEvent } from "react";

import { useNavigation } from "@/contexts/NavigationContext";
import { Link } from "@/i18n/navigation";

interface NavigationLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export default function NavigationLink({
  href,
  children,
  className,
  title,
  onClick,
}: Readonly<NavigationLinkProps>) {
  const { startNavigation } = useNavigation();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // No activar loader para clicks modificados (nueva pestaña/ventana)
    // ni para clicks que no son el botón principal.
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      if (onClick) {
        onClick(e);
      }
      return;
    }

    // Si es el mismo path, no mostrar loader
    if (typeof globalThis.window !== "undefined") {
      const pathname = globalThis.window.location.pathname;
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";
      const normalizedHref = href === "/" ? "/" : href;
      if (pathWithoutLocale === normalizedHref) return;
    }

    // Iniciar animación de carga
    startNavigation();

    // Llamar onClick personalizado si existe
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link href={href} className={className} title={title} onClick={handleClick}>
      {children}
    </Link>
  );
}
