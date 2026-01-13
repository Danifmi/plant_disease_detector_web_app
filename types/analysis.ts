// Tipos para el análisis de enfermedades

export type DiseaseType = 'healthy' | 'rust' | 'scab' | 'multiple_diseases';

export interface PredictionResult {
  disease: DiseaseType;
  confidence: number;
  probabilities: {
    healthy: number;
    rust: number;
    scab: number;
    multiple_diseases: number;
  };
}

export interface AnalysisResult {
  id: string;
  timestamp: Date;
  imageUrl: string;
  prediction: PredictionResult;
  processingTime: number;
  affectedAreas?: AffectedArea[];
}

export interface AffectedArea {
  x: number;
  y: number;
  width: number;
  height: number;
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisState {
  status: 'idle' | 'loading' | 'processing' | 'complete' | 'error';
  error?: string;
  result?: AnalysisResult;
  progress?: number;
}

export interface HistoryItem extends AnalysisResult {
  notes?: string;
  location?: string;
}
