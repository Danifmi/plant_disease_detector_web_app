'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfidenceBar from './ConfidenceBar';
import DiseaseOverlay from './DiseaseOverlay';
import Recommendations from './Recommendations';
import { DISEASES_INFO, getTreatmentRecommendations } from '@/lib/constants/diseases';
import { AnalysisResult as AnalysisResultType } from '@/types/analysis';

interface AnalysisResultProps {
  result: AnalysisResultType;
  imageUrl: string;
}

export default function AnalysisResult({ result, imageUrl }: AnalysisResultProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

  const diseaseInfo = DISEASES_INFO[result.prediction.disease];
  const recommendations = getTreatmentRecommendations(result.prediction.disease);

  const handleFeedback = async (isPositive: boolean) => {
    setFeedbackGiven(isPositive ? 'positive' : 'negative');
    
    // Enviar feedback a la API
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: result.id,
          predictedDisease: result.prediction.disease,
          isCorrect: isPositive,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Resultado de análisis de planta',
          text: `Diagnóstico: ${diseaseInfo.nameEs} (${(result.prediction.confidence * 100).toFixed(1)}% confianza)`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `analisis-${result.id}.jpg`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Image with overlay */}
      <Card className="overflow-hidden">
        <div className="relative">
          <img
            src={imageUrl}
            alt="Imagen analizada"
            className="w-full aspect-[4/3] object-cover"
          />
          
          {showOverlay && result.affectedAreas && (
            <DiseaseOverlay
              areas={result.affectedAreas}
              diseaseColor={diseaseInfo.color}
            />
          )}

          {/* Toggle overlay button */}
          {result.affectedAreas && result.affectedAreas.length > 0 && (
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 rounded-full text-white text-xs hover:bg-black/80 transition-colors"
            >
              {showOverlay ? 'Ocultar áreas' : 'Mostrar áreas'}
            </button>
          )}
        </div>
      </Card>

      {/* Main result */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${diseaseInfo.color}20` }}
              >
                {diseaseInfo.icon}
              </div>
              <div>
                <CardTitle className="text-2xl">{diseaseInfo.nameEs}</CardTitle>
                <p className="text-gray-500 text-sm">{diseaseInfo.name}</p>
              </div>
            </div>
            
            {/* Severity badge */}
            <span
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: diseaseInfo.color }}
            >
              {diseaseInfo.severity === 'none' ? 'Saludable' :
               diseaseInfo.severity === 'medium' ? 'Riesgo medio' : 'Riesgo alto'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <p className="text-gray-600">{diseaseInfo.description}</p>

          {/* Confidence bars */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Probabilidades</h4>
            <ConfidenceBar
              label="Saludable"
              value={result.prediction.probabilities.healthy}
              color="#22c55e"
              isMain={result.prediction.disease === 'healthy'}
            />
            <ConfidenceBar
              label="Roya"
              value={result.prediction.probabilities.rust}
              color="#f97316"
              isMain={result.prediction.disease === 'rust'}
            />
            <ConfidenceBar
              label="Sarna"
              value={result.prediction.probabilities.scab}
              color="#78716c"
              isMain={result.prediction.disease === 'scab'}
            />
            <ConfidenceBar
              label="Múltiples"
              value={result.prediction.probabilities.multiple_diseases}
              color="#ef4444"
              isMain={result.prediction.disease === 'multiple_diseases'}
            />
          </div>

          {/* Processing time */}
          <div className="text-sm text-gray-500">
            Tiempo de procesamiento: {result.processingTime.toFixed(2)}s
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Recommendations
        disease={result.prediction.disease}
        recommendations={recommendations}
        diseaseInfo={diseaseInfo}
      />

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            ¿Fue útil este diagnóstico?
          </h4>

          <div className="flex flex-wrap gap-3">
            <Button
              variant={feedbackGiven === 'positive' ? 'default' : 'outline'}
              onClick={() => handleFeedback(true)}
              disabled={feedbackGiven !== null}
              className="gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              Sí, es correcto
            </Button>
            
            <Button
              variant={feedbackGiven === 'negative' ? 'destructive' : 'outline'}
              onClick={() => handleFeedback(false)}
              disabled={feedbackGiven !== null}
              className="gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              No, es incorrecto
            </Button>

            <div className="flex-1" />

            <Button variant="ghost" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Compartir
            </Button>

            <Button variant="ghost" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Descargar
            </Button>
          </div>

          {feedbackGiven && (
            <p className="mt-4 text-sm text-green-600">
              ¡Gracias por tu feedback! Nos ayuda a mejorar el modelo.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
