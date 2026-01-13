// Postprocesamiento de resultados de predicción

import { PredictionResult, AnalysisResult, AffectedArea, DiseaseType } from '@/types/analysis';
import { MODEL_CONFIG } from '@/lib/constants/config';

/**
 * Genera un ID único para el análisis
 */
export function generateAnalysisId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crea un resultado de análisis completo
 */
export function createAnalysisResult(
  prediction: PredictionResult,
  imageUrl: string,
  processingTime: number,
  affectedAreas?: AffectedArea[]
): AnalysisResult {
  return {
    id: generateAnalysisId(),
    timestamp: new Date(),
    imageUrl,
    prediction,
    processingTime,
    affectedAreas
  };
}

/**
 * Evalúa el nivel de confianza
 */
export function evaluateConfidence(confidence: number): {
  level: 'high' | 'medium' | 'low';
  message: string;
} {
  if (confidence >= 0.85) {
    return {
      level: 'high',
      message: 'Alta confianza en el diagnóstico'
    };
  } else if (confidence >= 0.6) {
    return {
      level: 'medium',
      message: 'Confianza moderada - considere una segunda opinión'
    };
  } else {
    return {
      level: 'low',
      message: 'Baja confianza - se recomienda análisis adicional'
    };
  }
}

/**
 * Determina si la predicción es confiable
 */
export function isPredictionReliable(prediction: PredictionResult): boolean {
  return prediction.confidence >= MODEL_CONFIG.confidenceThreshold;
}

/**
 * Obtiene la segunda mejor predicción
 */
export function getSecondBestPrediction(prediction: PredictionResult): {
  disease: DiseaseType;
  confidence: number;
} | null {
  const probs = prediction.probabilities;
  const sorted = Object.entries(probs)
    .sort(([, a], [, b]) => b - a)
    .slice(1);

  if (sorted.length > 0 && sorted[0][1] > 0.1) {
    return {
      disease: sorted[0][0] as DiseaseType,
      confidence: sorted[0][1]
    };
  }

  return null;
}

/**
 * Formatea el tiempo de procesamiento
 */
export function formatProcessingTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Calcula la severidad general basada en el tipo de enfermedad y confianza
 */
export function calculateSeverity(
  disease: DiseaseType,
  confidence: number,
  affectedAreas?: AffectedArea[]
): 'none' | 'low' | 'medium' | 'high' {
  if (disease === 'healthy') return 'none';

  // Calcular severidad base según tipo de enfermedad
  let baseSeverity = disease === 'multiple_diseases' ? 0.8 : 0.5;

  // Ajustar por confianza
  baseSeverity *= confidence;

  // Ajustar por áreas afectadas si están disponibles
  if (affectedAreas && affectedAreas.length > 0) {
    const highSeverityAreas = affectedAreas.filter((a) => a.severity === 'high').length;
    const totalAreas = affectedAreas.length;
    baseSeverity += (highSeverityAreas / totalAreas) * 0.2;
  }

  if (baseSeverity >= 0.7) return 'high';
  if (baseSeverity >= 0.4) return 'medium';
  return 'low';
}

/**
 * Genera un resumen textual del análisis
 */
export function generateSummary(result: AnalysisResult): string {
  const { prediction } = result;
  const confidenceEval = evaluateConfidence(prediction.confidence);
  const severity = calculateSeverity(
    prediction.disease,
    prediction.confidence,
    result.affectedAreas
  );

  const diseaseNames: Record<DiseaseType, string> = {
    healthy: 'saludable',
    rust: 'roya',
    scab: 'sarna',
    multiple_diseases: 'múltiples enfermedades'
  };

  if (prediction.disease === 'healthy') {
    return `La hoja analizada parece estar ${diseaseNames.healthy}. ${confidenceEval.message}.`;
  }

  return `Se ha detectado ${diseaseNames[prediction.disease]} con una confianza del ${(
    prediction.confidence * 100
  ).toFixed(1)}%. Severidad: ${severity}. ${confidenceEval.message}.`;
}
