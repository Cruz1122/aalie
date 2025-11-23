import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

/**
 * Hook para animar el progreso de análisis
 * El progreso avanza gradualmente pero espera a que la promesa real se resuelva
 * La animación actualiza el estado (porcentaje) independientemente de la promesa
 */
export function useAnalysisProgress() {
  const animateProgress = useCallback(async <T,>(
    start: number,
    end: number,
    duration: number,
    onUpdate: Dispatch<SetStateAction<number>>,
    waitForPromise?: Promise<T>
  ): Promise<T | void> => {
    // Si no hay promesa, solo animar el progreso
    if (!waitForPromise) {
      return new Promise((resolve) => {
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / duration);
          const currentProgress = start + (end - start) * progress;
          // Asegurar que nunca retroceda - usar función de actualización que previene retrocesos
          // Si el progreso actual es mayor que el calculado, mantener el mayor
          onUpdate((prev) => Math.max(prev, Math.min(100, currentProgress)));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            onUpdate((prev) => Math.max(prev, Math.min(100, end)));
            resolve();
          }
        };
        animate();
      });
    }
    
    // Si hay promesa, animar el progreso independientemente
    // pero esperar a que la promesa se resuelva antes de continuar
    // La animación actualiza el estado (porcentaje) independientemente de la promesa
    let animationId: number | null = null;
    let promiseResult: T | undefined = undefined;
    let promiseError: unknown = undefined;
    
    // Iniciar la promesa en paralelo
    const promiseTask = waitForPromise
      .then((result) => {
        promiseResult = result;
      })
      .catch((error) => {
        promiseError = error;
      });
    
    // Animar el progreso independientemente (actualiza el porcentaje)
    const animationPromise = new Promise<void>((resolve) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        const currentProgress = start + (end - start) * progress;
        // Actualizar el porcentaje basándose en el tiempo, no en la promesa
        // Asegurar que nunca retroceda y no exceda 100%
        // Usar función de actualización que previene retrocesos
        // Si el progreso actual es mayor que el calculado, mantener el mayor
        onUpdate((prev) => Math.max(prev, Math.min(100, currentProgress)));
        
        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          // Asegurar que llegue al final (sin exceder 100%) pero nunca retroceda
          onUpdate((prev) => Math.max(prev, Math.min(100, end)));
          resolve();
        }
      };
      animate();
    });
    
    // Esperar a que ambas terminen (animación y promesa)
    // La animación actualiza el porcentaje, la promesa controla cuándo continuar
    try {
      await Promise.all([promiseTask, animationPromise]);
      // Limpiar animación si aún está corriendo
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
      // Asegurar que el progreso esté en el final (sin exceder 100%) pero nunca retroceda
      onUpdate((prev) => Math.max(prev, Math.min(100, end)));
      return promiseResult;
    } catch (error) {
      // Si hay error, asegurar que el progreso llegue al final (sin exceder 100%) pero nunca retroceda
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
      onUpdate((prev) => Math.max(prev, Math.min(100, end)));
      throw promiseError || error;
    }
  }, []);

  return { animateProgress };
}

