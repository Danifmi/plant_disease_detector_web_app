"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Leaf,
  Bug,
  Droplets
} from 'lucide-react';
import type { AnalysisResult, DiagnosisType } from '@/lib/opencv/colorAnalysis';

interface AnalysisResultProps {
  result: AnalysisResult;
  imageUrl: string;
}

const diagnosisConfig: Record<DiagnosisType, {
  label: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  icon: any;
  description: string;
}> = {
  healthy: {
    label: 'Saludable',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    description: 'La hoja no muestra signos de enfermedad.'
  },
  rust: {
    label: 'Roya (Rust)',
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: Bug,
    description: 'Se detectaron manchas características de roya (Gymnosporangium).'
  },
  scab: {
    label: 'Sarna (Scab)',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Droplets,
    description: 'Se detectaron lesiones características de sarna (Venturia inaequalis).'
  },
  multiple_diseases: {
    label: 'Múltiples Enfermedades',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    description: 'Se detectaron síntomas de múltiples enfermedades.'
  }
};

const recommendations: Record<DiagnosisType, string[]> = {
  healthy: [
    'Continúa con el monitoreo regular del cultivo',
    'Mantén buenas prácticas de riego y fertilización',
    'Inspecciona otras hojas periódicamente'
  ],
  rust: [
    'Aplica fungicidas a base de cobre',
    'Elimina hojas severamente afectadas',
    'Mejora la circulación de aire entre plantas',
    'Evita el riego por aspersión'
  ],
  scab: [
    'Aplica fungicidas preventivos',
    'Recoge y destruye hojas caídas',
    'Poda para mejorar ventilación',
    'Considera variedades resistentes'
  ],
  multiple_diseases: [
    'Consulta con un agrónomo especialista',
    'Considera tratamiento fungicida de amplio espectro',
    'Evalúa condiciones ambientales del cultivo',
    'Aísla las plantas afectadas si es posible'
  ]
};

export function AnalysisResultComponent({ result, imageUrl }: AnalysisResultProps) {
  const config = diagnosisConfig[result.diagnosis];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Resultado Principal */}
      <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${config.color}`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${config.textColor}`}>
                {config.label}
              </h2>
              <p className="text-gray-600">{config.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confianza */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Nivel de Confianza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Análisis OpenCV</span>
              <span className="font-semibold">
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={result.confidence * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Distribución de Áreas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribución de Áreas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="flex-1">Área Saludable</span>
              <Badge variant="outline">
                {result.percentages.healthy.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span className="flex-1">Área con Roya</span>
              <Badge variant="outline">
                {result.percentages.rust.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-purple-500" />
              <span className="flex-1">Área con Sarna</span>
              <Badge variant="outline">
                {result.percentages.scab.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations[result.diagnosis].map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
