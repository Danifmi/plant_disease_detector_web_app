'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Download, Layers, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfidenceBar from './ConfidenceBar';
import DiseaseOverlay from './DiseaseOverlay';
import Recommendations from './Recommendations';
import { DISEASES_INFO, getTreatmentRecommendations } from '@/lib/constants/diseases';
import { AnalysisResult as AnalysisResultType } from '@/types/analysis';
import { formatProcessingTime } from '@/lib/ml/postprocess';

interface AnalysisResultProps {
  result: AnalysisResultType;
  imageUrl: string;
}

// Tipos para segmentación
interface ContourData {
  area: number;
  centroid: { x: number; y: number };
  boundingBox: { x: number; y: number; width: number; height: number };
  severity: 'low' | 'medium' | 'high';
}

interface SegmentationResult {
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
  error?: string;
}

export default function AnalysisResult({ result, imageUrl }: AnalysisResultProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  
  // Estado de segmentación
  const [segmentation, setSegmentation] = useState<SegmentationResult | null>(null);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [segmentationError, setSegmentationError] = useState<string | null>(null);
  const [showSegmentation, setShowSegmentation] = useState(false);
  const [viewMode, setViewMode] = useState<'original' | 'overlay' | 'rust' | 'scab'>('original');

  const diseaseInfo = DISEASES_INFO[result.prediction.disease];
  const recommendations = getTreatmentRecommendations(result.prediction.disease);

  // Ejecutar segmentación automáticamente al cargar
  useEffect(() => {
    // Convierte cualquier URL (blob:, http:, etc.) en un data URL base64
    const toDataUrl = async (source: string): Promise<string> => {
      if (source.startsWith('data:image/')) return source;

      const response = await fetch(source);
      const blob = await response.blob();

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const runSegmentation = async () => {
      // Evitar ejecutar si ya tenemos resultado o está en proceso
      if (!imageUrl || segmentation || isSegmenting) return;
      
      setIsSegmenting(true);
      setSegmentationError(null);
      
      console.log('🔄 Iniciando segmentación...');
      
      try {
        const dataUrl = await toDataUrl(imageUrl);

        const response = await fetch('/api/segment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        });

        console.log('📥 Respuesta recibida, status:', response.status);

        // Leer el texto de la respuesta primero para debug
        const responseText = await response.text();
        console.log('📥 Respuesta texto (primeros 200 chars):', responseText.substring(0, 200));

        // Intentar parsear como JSON
        let data: SegmentationResult;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Error parseando respuesta JSON:', parseError);
          throw new Error(`Respuesta no es JSON válido: ${responseText.substring(0, 100)}`);
        }
        
        if (data.success) {
          setSegmentation(data);
          console.log('✅ Segmentación completada:', data.percentages);
        } else {
          // La API devolvió success: false
          throw new Error(data.error || 'Error desconocido en segmentación');
        }
      } catch (error) {
        console.error('❌ Error en segmentación:', error);
        
        // Extraer mensaje de error de forma segura
        let errorMessage: string;
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String((error as any).message);
        } else {
          errorMessage = 'Error desconocido';
        }
        
        setSegmentationError(errorMessage);
      } finally {
        setIsSegmenting(false);
      }
    };

    runSegmentation();
  }, [imageUrl]); // Solo depende de imageUrl

  const handleFeedback = async (isPositive: boolean) => {
    setFeedbackGiven(isPositive ? 'positive' : 'negative');
    
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

  // Obtener imagen actual según el modo de vista
  const getCurrentDisplayImage = (): string => {
    if (!segmentation) return imageUrl;
    
    switch (viewMode) {
      case 'overlay':
        return segmentation.overlayImage || imageUrl;
      case 'rust':
        return segmentation.masks.rust || imageUrl;
      case 'scab':
        return segmentation.masks.scab || imageUrl;
      default:
        return imageUrl;
    }
  };

  // Generar recomendaciones basadas en segmentación
  const getSegmentationRecommendations = (): string[] => {
    if (!segmentation?.success) return [];
    
    const recs: string[] = [];
    const { percentages, contours } = segmentation;

    if (percentages.rust > 5) {
      recs.push('Se detectó roya (rust). Considere aplicar fungicida a base de cobre.');
      if (contours.rust.some(c => c.severity === 'high')) {
        recs.push('Hay áreas con roya severa. Se recomienda poda de las partes más afectadas.');
      }
    }

    if (percentages.scab > 5) {
      recs.push('Se detectó sarna (scab). Aplicar tratamiento preventivo con fungicida.');
      if (contours.scab.some(c => c.severity === 'high')) {
        recs.push('Sarna severa detectada. Considere tratamiento intensivo.');
      }
    }

    if (percentages.healthy > 80) {
      recs.push('La hoja está mayormente sana. Continúe con mantenimiento preventivo.');
    }

    return recs;
  };

  const segmentationRecommendations = getSegmentationRecommendations();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Image with overlay */}
      <Card className="overflow-hidden">
        <div className="relative">
          <img
            src={getCurrentDisplayImage()}
            alt="Imagen analizada"
            className="w-full aspect-[4/3] object-cover"
          />
          
          {showOverlay && result.affectedAreas && viewMode === 'original' && (
            <DiseaseOverlay
              areas={result.affectedAreas}
              diseaseColor={diseaseInfo.color}
            />
          )}

          {/* Controles de imagen */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {result.affectedAreas && result.affectedAreas.length > 0 && viewMode === 'original' && (
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className="px-3 py-1.5 bg-black/60 rounded-full text-white text-xs hover:bg-black/80 transition-colors"
              >
                {showOverlay ? 'Ocultar áreas' : 'Mostrar áreas'}
              </button>
            )}
          </div>

          {/* Indicador de segmentación en proceso */}
          {isSegmenting && (
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-blue-600 rounded-full text-white text-xs flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Segmentando...
            </div>
          )}
        </div>
      </Card>

      {/* Segmentación - Panel de control */}
      {segmentation?.success && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Análisis de Segmentación (OpenCV)
              </CardTitle>
              <Button
                variant={showSegmentation ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSegmentation(!showSegmentation)}
              >
                {showSegmentation ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showSegmentation ? 'Ocultar' : 'Mostrar'} detalles
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {segmentation.percentages.healthy.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Saludable</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-xl font-bold text-orange-500">
                  {segmentation.percentages.rust.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Roya</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-xl font-bold text-amber-700">
                  {segmentation.percentages.scab.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Sarna</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-500">
                  {segmentation.percentages.background.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Fondo</div>
              </div>
            </div>

            {/* Panel expandido */}
            {showSegmentation && (
              <div className="space-y-4 pt-4 border-t">
                {/* Selector de vista */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Modo de visualización:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === 'original' ? 'default' : 'outline'}
                      onClick={() => setViewMode('original')}
                    >
                      Original
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'overlay' ? 'default' : 'outline'}
                      onClick={() => setViewMode('overlay')}
                      disabled={!segmentation.overlayImage}
                    >
                      Con Contornos
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'rust' ? 'default' : 'outline'}
                      onClick={() => setViewMode('rust')}
                      disabled={!segmentation.masks.rust}
                      className="text-orange-600"
                    >
                      Máscara Roya
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'scab' ? 'default' : 'outline'}
                      onClick={() => setViewMode('scab')}
                      disabled={!segmentation.masks.scab}
                      className="text-amber-700"
                    >
                      Máscara Sarna
                    </Button>
                  </div>
                </div>

                {/* Detalles de contornos */}
                {(segmentation.contours.rust.length > 0 || segmentation.contours.scab.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {segmentation.contours.rust.length > 0 && (
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <h5 className="text-sm font-medium text-orange-700 mb-2">
                          Roya: {segmentation.contours.rust.length} áreas detectadas
                        </h5>
                        <div className="space-y-1 text-xs">
                          {segmentation.contours.rust.slice(0, 3).map((c, i) => (
                            <div key={i} className="flex justify-between">
                              <span>Área {i + 1}: {c.area.toFixed(0)}px²</span>
                              <span className={`
                                px-1.5 rounded font-medium
                                ${c.severity === 'high' ? 'bg-red-200 text-red-800' : 
                                  c.severity === 'medium' ? 'bg-orange-200 text-orange-800' : 
                                  'bg-yellow-200 text-yellow-800'}
                              `}>
                                {c.severity === 'high' ? 'Severo' : c.severity === 'medium' ? 'Medio' : 'Leve'}
                              </span>
                            </div>
                          ))}
                          {segmentation.contours.rust.length > 3 && (
                            <div className="text-gray-500">
                              +{segmentation.contours.rust.length - 3} más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {segmentation.contours.scab.length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <h5 className="text-sm font-medium text-amber-800 mb-2">
                          Sarna: {segmentation.contours.scab.length} áreas detectadas
                        </h5>
                        <div className="space-y-1 text-xs">
                          {segmentation.contours.scab.slice(0, 3).map((c, i) => (
                            <div key={i} className="flex justify-between">
                              <span>Área {i + 1}: {c.area.toFixed(0)}px²</span>
                              <span className={`
                                px-1.5 rounded font-medium
                                ${c.severity === 'high' ? 'bg-red-200 text-red-800' : 
                                  c.severity === 'medium' ? 'bg-orange-200 text-orange-800' : 
                                  'bg-yellow-200 text-yellow-800'}
                              `}>
                                {c.severity === 'high' ? 'Severo' : c.severity === 'medium' ? 'Medio' : 'Leve'}
                              </span>
                            </div>
                          ))}
                          {segmentation.contours.scab.length > 3 && (
                            <div className="text-gray-500">
                              +{segmentation.contours.scab.length - 3} más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tiempo de procesamiento */}
                <div className="text-xs text-gray-500">
                  Segmentación completada en {segmentation.processingTime}ms
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error de segmentación */}
      {segmentationError && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  La segmentación no está disponible
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {segmentationError}
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  El análisis ML principal sigue siendo válido.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <p className="text-gray-600">{diseaseInfo.description}</p>

          {/* Confidence bars */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Probabilidades (Modelo ML)</h4>
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

          <div className="text-sm text-gray-500">
            Tiempo de procesamiento del modelo: {formatProcessingTime(result.processingTime)}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Recommendations
        disease={result.prediction.disease}
        recommendations={recommendations}
        diseaseInfo={diseaseInfo}
      />

      {/* Recomendaciones adicionales de segmentación */}
      {segmentationRecommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              💡 Recomendaciones basadas en segmentación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {segmentationRecommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-blue-800">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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