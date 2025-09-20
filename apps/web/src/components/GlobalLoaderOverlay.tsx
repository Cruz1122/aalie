'use client';

import React, { useEffect } from 'react';
import { GlobalLoader } from './GlobalLoader';
import { useGlobalLoader } from '@/contexts/GlobalLoaderContext';

export const GlobalLoaderOverlay: React.FC = () => {
  const { isLoading, config } = useGlobalLoader();

  // Manejar tecla Escape para cerrar loader si no es persistente
  useEffect(() => {
    if (!isLoading || config.persistent) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Solo permitir cerrar si no es persistente
        if (!config.persistent) {
          // El usuario puede decidir si implementar esta funcionalidad
          console.log('Loader can be closed with Escape');
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isLoading, config.persistent]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Overlay con efecto glass si está habilitado */}
      {config.overlay && (
        <div className="absolute inset-0 glass-modal-overlay" />
      )}
      
      {/* Contenedor del loader */}
      <div className="relative z-10 glass-modal-container rounded-2xl p-8 max-w-sm mx-4 shadow-2xl modal-animate-in">
        <GlobalLoader
          variant={config.variant}
          size={config.size}
          message={config.message}
          progress={config.progress}
        />
        
        {/* Indicación de escape si no es persistente */}
        {!config.persistent && (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Presiona <kbd className="bg-white/10 px-2 py-1 rounded text-white font-medium">Esc</kbd> para cancelar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};