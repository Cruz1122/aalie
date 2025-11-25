"use client";

import type { Route } from "next";
import Link from "next/link";
import { ReactNode, MouseEvent } from "react";

import { useNavigation } from "@/contexts/NavigationContext";

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
    if (
      typeof globalThis.window !== "undefined" &&
      globalThis.window.location.pathname === href
    ) {
      return;
    }

    // Iniciar animación de carga
    startNavigation();

    // Llamar onClick personalizado si existe
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link href={href as Route} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
