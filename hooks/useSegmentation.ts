/**
 * useSegmentation Hook
 * Hook para segmentación de enfermedades usando la API del servidor
 * Procesamiento pesado en servidor, resultados visuales en cliente
 */

import { useState, useCallback } from 'react';

export interface ContourData {
  area: number;
  centroid: { x: number; y: number };
  boundingBox: { x: number; y: number; width: number; height: number };
  severity: 'low' | 'medium' | 'high';
}

export interface SegmentationResult {
  success: boolean;
  masks: {
    rust: string | null;
    scab: string | null;
    healthy: string | null;
  };
  overlayImage: string | null;
  percentages: {
    healthy: number;
    rust: number;
    scab: number;
    background: number;
  };
  contours: {
    rust: ContourData[];
    scab: ContourData[];
  };
  processingTime: number;
  timestamp?: string;
  error?: string;
}

export interface SegmentationState {
  status: 'idle' | 'processing' | 'complete' | 'error';
  result: SegmentationResult | null;
  error: string | null;
}

/**
 * Hook para segmentación de áreas afectadas en hojas
 */
export function useSegmentation() {
  const [state, setState] = useState<SegmentationState>({
    status: 'idle',
    result: null,
    error: null
  });

  /**
   * Procesa una imagen y devuelve la segmentación
   * @param imageData - Imagen en formato Base64 (data:image/...)
   */
  const segment = useCallback(async (imageData: string): Promise<SegmentationResult | null> => {
    setState({ status: 'processing', result: null, error: null });

    try {
      const response = await fetch('/api/segment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const result: SegmentationResult = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error en la segmentación');
      }

      setState({ status: 'complete', result, error: null });
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido en la segmentación';
      
      setState({ status: 'error', result: null, error: errorMessage });
      return null;
    }
  }, []);

  /**
   * Resetea el estado del hook
   */
  const reset = useCallback(() => {
    setState({ status: 'idle', result: null, error: null });
  }, []);

  return {
    // Estado
    state,
    result: state.result,
    error: state.error,
    
    // Estados derivados
    isProcessing: state.status === 'processing',
    isComplete: state.status === 'complete',
    isError: state.status === 'error',
    
    // Acciones
    segment,
    reset
  };
}

/**
 * Utilidades para trabajar con resultados de segmentación
 */
export const SegmentationUtils = {
  /**
   * Calcula la severidad general basada en los porcentajes
   */
  calculateOverallSeverity(percentages: SegmentationResult['percentages']): 'healthy' | 'mild' | 'moderate' | 'severe' {
    const diseasePercent = percentages.rust + percentages.scab;
    
    if (diseasePercent < 5) return 'healthy';
    if (diseasePercent < 15) return 'mild';
    if (diseasePercent < 30) return 'moderate';
    return 'severe';
  },

  /**
   * Genera recomendaciones basadas en la segmentación
   */
  getRecommendations(result: SegmentationResult): string[] {
    const recommendations: string[] = [];
    const { percentages, contours } = result;

    if (percentages.rust > 5) {
      recommendations.push('Se detectó roya (rust). Considere aplicar fungicida a base de cobre.');
      if (contours.rust.some(c => c.severity === 'high')) {
        recommendations.push('Hay áreas con roya severa. Se recomienda poda de las partes más afectadas.');
      }
    }

    if (percentages.scab > 5) {
      recommendations.push('Se detectó sarna (scab). Aplicar tratamiento preventivo con fungicida.');
      if (contours.scab.some(c => c.severity === 'high')) {
        recommendations.push('Sarna severa detectada. Considere tratamiento intensivo y mejorar ventilación.');
      }
    }

    if (percentages.healthy > 80) {
      recommendations.push('La hoja está mayormente sana. Continúe con mantenimiento preventivo.');
    }

    if (percentages.rust > 15 && percentages.scab > 15) {
      recommendations.push('Múltiples enfermedades detectadas. Consulte con un especialista agrícola.');
    }

    return recommendations;
  },

  /**
   * Formatea los porcentajes para mostrar
   */
  formatPercentages(percentages: SegmentationResult['percentages']): Record<string, string> {
    return {
      healthy: `${percentages.healthy.toFixed(1)}%`,
      rust: `${percentages.rust.toFixed(1)}%`,
      scab: `${percentages.scab.toFixed(1)}%`,
      background: `${percentages.background.toFixed(1)}%`
    };
  },

  /**
   * Obtiene el color de severidad para UI
   */
  getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
    const colors = {
      low: '#facc15',    // yellow-400
      medium: '#f97316', // orange-500
      high: '#ef4444'    // red-500
    };
    return colors[severity];
  }
};