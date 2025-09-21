"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";

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

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Detectar cambios de ruta para terminar la carga
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const startNavigation = () => {
    setIsLoading(true);
  };

  const finishNavigation = () => {
    setIsLoading(false);
  };

  return (
    <NavigationContext.Provider value={{
      isLoading,
      setLoading,
      startNavigation,
      finishNavigation
    }}>
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