'use client';

import { useCallback } from 'react';
import { useGlobalLoader } from '@/contexts/GlobalLoaderContext';

export const useLoaderExamples = () => {
  const { show, hide, updateProgress, updateMessage } = useGlobalLoader();

  // Ejemplo 1: Carga simple con spinner
  const showSimpleLoader = useCallback(() => {
    show({
      variant: 'spinner',
      size: 'md',
      message: 'Cargando imagen...',
      overlay: true,
      persistent: false
    });

    // Simular carga de 3 segundos
    setTimeout(() => {
      hide();
    }, 3000);
  }, [show, hide]);

  // Ejemplo 2: Análisis de algoritmo con progreso
  const analyzeAlgorithm = useCallback(async () => {
    show({
      variant: 'progress',
      size: 'lg',
      message: 'Analizando algoritmo...',
      progress: 0,
      overlay: true,
      persistent: true // No se puede cancelar
    });

    // Simular análisis paso a paso
    const steps = [
      { progress: 20, message: 'Parseando código...' },
      { progress: 40, message: 'Generando AST...' },
      { progress: 60, message: 'Calculando complejidad...' },
      { progress: 80, message: 'Generando visualizaciones...' },
      { progress: 100, message: 'Análisis completado!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateProgress(step.progress);
      updateMessage(step.message);
    }

    // Esperar un momento antes de ocultar
    await new Promise(resolve => setTimeout(resolve, 1000));
    hide();
  }, [show, hide, updateProgress, updateMessage]);

  // Ejemplo 3: Loader con dots para operaciones rápidas
  const quickOperation = useCallback(() => {
    show({
      variant: 'dots',
      size: 'sm',
      message: 'Guardando configuración...',
      overlay: true,
      persistent: false
    });

    setTimeout(() => {
      hide();
    }, 1500);
  }, [show, hide]);

  // Ejemplo 4: Loader pulsante para esperas
  const waitingLoader = useCallback(() => {
    show({
      variant: 'pulse',
      size: 'xl',
      message: 'Conectando con el servidor...',
      overlay: true,
      persistent: false
    });

    setTimeout(() => {
      hide();
    }, 4000);
  }, [show, hide]);

  return {
    showSimpleLoader,
    analyzeAlgorithm,
    quickOperation,
    waitingLoader
  };
};