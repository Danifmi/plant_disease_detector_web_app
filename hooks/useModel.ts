// Hook para gestión del modelo ML

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { loadModel, isModelLoaded, disposeModel, getModelInfo } from '@/lib/ml/model';

interface ModelState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  progress: number;
}

interface UseModelReturn {
  state: ModelState;
  load: () => Promise<void>;
  unload: () => void;
  getInfo: () => ReturnType<typeof getModelInfo>;
}

export function useModel(autoLoad: boolean = false): UseModelReturn {
  const [state, setState] = useState<ModelState>({
    isLoading: false,
    isLoaded: isModelLoaded(),
    error: null,
    progress: 0
  });

  const loadingRef = useRef(false);

  // Cargar modelo
  const load = useCallback(async () => {
    if (loadingRef.current || isModelLoaded()) {
      setState((prev) => ({ ...prev, isLoaded: true }));
      return;
    }

    loadingRef.current = true;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 0
    }));

    try {
      // Simular progreso (TF.js no proporciona eventos de progreso)
      const progressInterval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      await loadModel();

      clearInterval(progressInterval);

      setState({
        isLoading: false,
        isLoaded: true,
        error: null,
        progress: 100
      });
    } catch (error) {
      setState({
        isLoading: false,
        isLoaded: false,
        error: error instanceof Error ? error.message : 'Error al cargar el modelo',
        progress: 0
      });
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // Descargar modelo
  const unload = useCallback(() => {
    disposeModel();
    setState({
      isLoading: false,
      isLoaded: false,
      error: null,
      progress: 0
    });
  }, []);

  // Obtener info del modelo
  const getInfo = useCallback(() => {
    return getModelInfo();
  }, []);

  // Auto-cargar si está habilitado
  useEffect(() => {
    if (autoLoad && !isModelLoaded() && !loadingRef.current) {
      load();
    }
  }, [autoLoad, load]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      // No descargamos el modelo al desmontar para mantenerlo en caché
    };
  }, []);

  return {
    state,
    load,
    unload,
    getInfo
  };
}
