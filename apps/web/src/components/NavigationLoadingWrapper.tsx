"use client";

/**
 * Componente wrapper para manejar el estado de carga durante navegación.
 * Muestra un PageLoader cuando isLoading es true.
 *
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */
import { useNavigation } from "@/contexts/NavigationContext";

import PageLoader from "./PageLoader";

/**
 * Propiedades del componente NavigationLoadingWrapper.
 */
interface NavigationLoadingWrapperProps {
  /** Contenido hijo a renderizar */
  children: React.ReactNode;
}

/**
 * Componente wrapper que muestra un loader durante la navegación.
 *
 * @param props - Propiedades del componente
 * @returns Elemento JSX que contiene los hijos y el PageLoader si isLoading es true
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 *
 * @example
 * ```tsx
 * <NavigationLoadingWrapper>
 *   <App />
 * </NavigationLoadingWrapper>
 * ```
 */
export default function NavigationLoadingWrapper({
  children,
}: Readonly<NavigationLoadingWrapperProps>) {
  const { isLoading } = useNavigation();

  return (
    <>
      {children}
      <PageLoader isLoading={isLoading} />
    </>
  );
}
