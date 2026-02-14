"use client";

import { Link } from "@/i18n/navigation";
import { useNavigation } from "@/contexts/NavigationContext";
import type { ReactNode, MouseEvent } from "react";

interface NavigationLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export default function NavigationLink({
  href,
  children,
  className,
  onClick,
}: Readonly<NavigationLinkProps>) {
  const { startNavigation } = useNavigation();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
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
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
