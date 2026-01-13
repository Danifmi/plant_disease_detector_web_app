// Tipos e información de enfermedades

import { DiseaseType } from './analysis';

export interface DiseaseInfo {
  id: DiseaseType;
  name: string;
  nameEs: string;
  description: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  prevention: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
  color: string;
  icon: string;
}

export interface TreatmentRecommendation {
  title: string;
  description: string;
  urgency: 'immediate' | 'soon' | 'preventive';
  products?: string[];
}

export const DISEASE_LABELS: Record<DiseaseType, string> = {
  healthy: 'Saludable',
  rust: 'Roya',
  scab: 'Sarna',
  multiple_diseases: 'Múltiples Enfermedades'
};

export const DISEASE_COLORS: Record<DiseaseType, string> = {
  healthy: '#22c55e',
  rust: '#f97316',
  scab: '#78716c',
  multiple_diseases: '#ef4444'
};
