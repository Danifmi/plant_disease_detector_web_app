// hooks/useAnalysis.ts
import { useState, useCallback } from 'react';
import { AnalysisState, AnalysisResult, DiseaseType } from '@/types/analysis';
import { predict, predictWithTTA } from '@/lib/ml/predict';
import { createAnalysisResult } from '@/lib/ml/postprocess';
import { segmentDiseaseAreas, SegmentationResult } from '@/lib/opencv/segmentation';
import { loadOpenCV, isOpenCVLoaded } from '@/lib/opencv/loader';
import { saveAnalysisToHistory } from '@/lib/utils/storageUtils';

// Extender AnalysisResult para incluir imagen procesada
export interface ExtendedAnalysisResult extends AnalysisResult {
  processedImage?: string;
  segmentation?: SegmentationResult;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle'
  });

  const [processedImage, setProcessedImage] = useState<string | null>(null);

  /**
   * Pre-carga OpenCV en segundo plano
   */
  const preloadOpenCV = useCallback(async () => {
    if (!isOpenCVLoaded()) {
      try {
        console.log('📦 Pre-cargando OpenCV.js...');
        await loadOpenCV();
        console.log('✅ OpenCV pre-cargado');
      } catch (error) {
        console.warn('⚠️ No se pudo pre-cargar OpenCV:', error);
      }
    }
  }, []);

  /**
   * Analiza una imagen y retorna el resultado
   */
  const analyze = useCallback(async (
    imageData: string,
    options?: {
      useTTA?: boolean;
      useSegmentation?: boolean;
      saveToHistory?: boolean;
    }
  ): Promise<ExtendedAnalysisResult> => {
    const {
      useTTA = false,
      useSegmentation = true, // Habilitado por defecto
      saveToHistory = true
    } = options || {};

    try {
      // Cambiar estado a procesando
      setState({ status: 'processing', progress: 0 });

      // 1. Realizar predicción (con o sin TTA)
      setState({ status: 'processing', progress: 30 });
      const prediction = useTTA 
        ? await predictWithTTA(imageData)
        : await predict(imageData);

      // 2. Segmentación con OpenCV (si está habilitada)
      let segmentationResult: SegmentationResult | null = null;
      let processedImg: string | null = null;

      if (useSegmentation && prediction.disease !== 'healthy') {
        setState({ status: 'processing', progress: 60 });
        
        try {
          segmentationResult = await segmentDiseaseAreas(
            imageData,
            prediction.disease as 'rust' | 'scab' | 'multiple_diseases'
          );
          
          if (segmentationResult) {
            processedImg = segmentationResult.processedImage;
            setProcessedImage(processedImg);
            console.log('✅ Segmentación completada:', {
              areasDetectadas: segmentationResult.areas.length,
              porcentajeAfectado: segmentationResult.totalAffectedPercentage.toFixed(2) + '%'
            });
          }
        } catch (error) {
          console.warn('⚠️ Error en segmentación (continuando sin ella):', error);
        }
      }

      // 3. Crear resultado completo
      setState({ status: 'processing', progress: 80 });
      const result: ExtendedAnalysisResult = {
        ...createAnalysisResult(
          {
            disease: prediction.disease,
            confidence: prediction.confidence,
            probabilities: prediction.probabilities
          },
          imageData,
          prediction.executionTime,
          segmentationResult?.areas
        ),
        processedImage: processedImg || undefined,
        segmentation: segmentationResult || undefined
      };

      // 4. Guardar en historial si se solicita
      if (saveToHistory) {
        await saveAnalysisToHistory(result);
      }

      // 5. Actualizar estado a completo
      setState({ status: 'complete', result, progress: 100 });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el análisis';
      setState({ 
        status: 'error', 
        error: errorMessage 
      });
      throw error;
    }
  }, []);

  /**
   * Reinicia el estado del análisis
   */
  const reset = useCallback(() => {
    setState({ status: 'idle' });
    setProcessedImage(null);
  }, []);

  /**
   * Analiza múltiples imágenes en lote
   */
  const analyzeBatch = useCallback(async (
    images: string[]
  ): Promise<ExtendedAnalysisResult[]> => {
    setState({ status: 'processing', progress: 0 });
    
    const results: ExtendedAnalysisResult[] = [];
    const totalImages = images.length;

    for (let i = 0; i < totalImages; i++) {
      try {
        const result = await analyze(images[i], { 
          saveToHistory: false // No guardar automáticamente en batch
        });
        results.push(result);
        
        // Actualizar progreso
        const progress = ((i + 1) / totalImages) * 100;
        setState({ status: 'processing', progress });
      } catch (error) {
        console.error(`Error analizando imagen ${i}:`, error);
        // Continuar con las siguientes imágenes
      }
    }

    setState({ status: 'complete', progress: 100 });
    return results;
  }, [analyze]);

  return {
    state,
    analyze,
    analyzeBatch,
    reset,
    preloadOpenCV,
    processedImage,
    isAnalyzing: state.status === 'processing',
    isComplete: state.status === 'complete',
    isError: state.status === 'error',
    result: state.result,
    error: state.error,
    progress: state.progress
  };
}