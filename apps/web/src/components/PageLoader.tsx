"use client";

/**
 * Componente de loader de página con animación pulse.
 * Se muestra durante la navegación entre páginas.
 * 
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 */

/**
 * Propiedades del componente PageLoader.
 */
interface PageLoaderProps {
  /** Indica si el loader debe mostrarse */
  readonly isLoading: boolean;
}

/**
 * Componente de loader de página.
 * Muestra una animación pulse centrada en pantalla cuando isLoading es true.
 * 
 * @param props - Propiedades del componente
 * @returns Loader de página o null si isLoading es false
 * @author Juan Camilo Cruz Parra (@Cruz1122)
 * 
 * @example
 * ```tsx
 * <PageLoader isLoading={isNavigating} />
 * ```
 */
export default function PageLoader({ isLoading }: PageLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] glass animate-in fade-in duration-100">
      <div className="flex items-center justify-center min-h-screen">
        {/* Loader tipo pulse - elegante y minimalista */}
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
          <div className="absolute w-6 h-6 bg-blue-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}