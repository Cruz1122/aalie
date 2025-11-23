"use client";

import { usePathname } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface NavigationContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  startNavigation: () => void;
  finishNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: Readonly<NavigationProviderProps>) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar cambios de ruta - dar un tiempo para que la página se monte
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      // Si cambió la ruta y está cargando, esperar un poco para que la página se monte
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      prevPathname.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Limpiar timeout cuando se desmonte
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const startNavigation = useCallback(() => {
    setIsLoading(true);
    // Auto-hide después de 10 segundos para evitar que se quede pegado si algo falla
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    navigationTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
  }, []);

  const finishNavigation = useCallback(() => {
    setIsLoading(false);
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
  }, []);

  const contextValue = useMemo(() => ({
    isLoading,
    setLoading,
    startNavigation,
    finishNavigation
  }), [isLoading, setLoading, startNavigation, finishNavigation]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}