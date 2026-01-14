// Hook para análisis de imágenes

'use client';

import { useState, useCallback } from 'react';
import { AnalysisState, AnalysisResult, DiseaseType } from '@/types/analysis';
import { predict, predictWithTTA } from '@/lib/ml/predict';
import { createAnalysisResult } from '@/lib/ml/postprocess';
import { segmentDiseaseAreas } from '@/lib/opencv/segmentation';
import { preprocessForModel } from '@/lib/utils/imageUtils';
import { saveAnalysisToHistory } from '@/lib/utils/storageUtils';
import { loadModel, isModelLoaded } from '@/lib/ml/model-loader';

interface UseAnalysisOptions {
  useOpenCV?: boolean;
  useTTA?: boolean;
  autoSave?: boolean;
}

interface UseAnalysisReturn {
  state: AnalysisState;
  analyze: (
    source: File | Blob | string,
    options?: UseAnalysisOptions
  ) => Promise<AnalysisResult | null>;
  reset: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle'
  });

  const analyze = useCallback(
    async (
      source: File | Blob | string,
      options: UseAnalysisOptions = {}
    ): Promise<AnalysisResult | null> => {
      const { useOpenCV = true, useTTA = false, autoSave = true } = options;

      setState({ status: 'loading', progress: 0 });

      try {
        const startTime = performance.now();

        // Cargar modelo si no está cargado
        if (!isModelLoaded()) {
          setState({ status: 'loading', progress: 10 });
          await loadModel();
        }

        setState({ status: 'processing', progress: 30 });

        // Realizar predicción
        const prediction = useTTA
          ? await predictWithTTA(source)
          : await predict(source);

        setState({ status: 'processing', progress: 60 });

        // Crear URL de imagen
        let imageUrl: string;
        if (typeof source === 'string') {
          imageUrl = source;
        } else {
          imageUrl = URL.createObjectURL(source);
        }

        // Segmentar áreas afectadas si hay enfermedad y OpenCV está habilitado
        let affectedAreas;
        if (
          useOpenCV &&
          prediction.disease !== 'healthy' &&
          typeof window !== 'undefined'
        ) {
          try {
            setState({ status: 'processing', progress: 80 });
            const imageData = await preprocessForModel(source, 224);
            affectedAreas = await segmentDiseaseAreas(
              imageData,
              prediction.disease as Exclude<DiseaseType, 'healthy'>
            );
          } catch (error) {
            console.warn('Error en segmentación OpenCV:', error);
            // Continuar sin segmentación
          }
        }

        const processingTime = performance.now() - startTime;

        // Crear resultado
        const result = createAnalysisResult(
          prediction,
          imageUrl,
          processingTime,
          affectedAreas
        );

        // Guardar en historial si está habilitado
        if (autoSave && typeof source !== 'string') {
          try {
            await saveAnalysisToHistory(result, source as Blob);
          } catch (error) {
            console.warn('Error guardando en historial:', error);
          }
        }

        setState({
          status: 'complete',
          result,
          progress: 100
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error durante el análisis';

        setState({
          status: 'error',
          error: errorMessage
        });

        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return {
    state,
    analyze,
    reset
  };
}
