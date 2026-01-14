// hooks/useAnalysis.ts
import { useState, useCallback } from 'react';
import { AnalysisState, AnalysisResult } from '@/types/analysis';
import { predict } from '@/lib/ml/predict';
import { createAnalysisResult } from '@/lib/ml/postprocess';
import { saveAnalysisToHistory } from '@/lib/utils/storageUtils';

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle'
  });

  const analyze = useCallback(async (
    imageData: string,
    options?: {
      saveToHistory?: boolean;
    }
  ): Promise<AnalysisResult> => {
    const {
      saveToHistory = true
    } = options || {};

    try {
      setState({ status: 'processing', progress: 0 });

      setState({ status: 'processing', progress: 30 });
      // TTA disabled to remove OpenCV dependency
      const prediction = await predict(imageData);

      setState({ status: 'processing', progress: 80 });
      const result: AnalysisResult = createAnalysisResult(
        {
          disease: prediction.disease,
          confidence: prediction.confidence,
          probabilities: prediction.probabilities
        },
        imageData,
        prediction.executionTime
      );

      if (saveToHistory) {
        await saveAnalysisToHistory(result);
      }

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

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  const analyzeBatch = useCallback(async (
    images: string[]
  ): Promise<AnalysisResult[]> => {
    setState({ status: 'processing', progress: 0 });
    
    const results: AnalysisResult[] = [];
    const totalImages = images.length;

    for (let i = 0; i < totalImages; i++) {
      try {
        const result = await analyze(images[i], { 
          saveToHistory: false
        });
        results.push(result);
        
        const progress = ((i + 1) / totalImages) * 100;
        setState({ status: 'processing', progress });
      } catch (error) {
        console.error(`Error analizando imagen ${i}:`, error);
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
    isAnalyzing: state.status === 'processing',
    isComplete: state.status === 'complete',
    isError: state.status === 'error',
    result: state.result,
    error: state.error,
    progress: state.progress
  };
}