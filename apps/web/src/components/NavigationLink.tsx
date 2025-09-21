"use client";

import Link from "next/link";
import { useNavigation } from "@/contexts/NavigationContext";
import { ReactNode, MouseEvent } from "react";

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
  onClick 
}: NavigationLinkProps) {
  const { startNavigation } = useNavigation();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Si es el mismo path, no mostrar loader
    if (typeof window !== "undefined" && window.location.pathname === href) {
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
    <Link 
      href={href as any}
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}