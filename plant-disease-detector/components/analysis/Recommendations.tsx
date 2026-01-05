'use client';

import { AlertTriangle, Clock, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiseaseInfo, TreatmentRecommendation } from '@/types/disease';
import { DiseaseType } from '@/types/analysis';

interface RecommendationsProps {
  disease: DiseaseType;
  recommendations: TreatmentRecommendation[];
  diseaseInfo: DiseaseInfo;
}

export default function Recommendations({
  disease,
  recommendations,
  diseaseInfo,
}: RecommendationsProps) {
  const getUrgencyIcon = (urgency: TreatmentRecommendation['urgency']) => {
    switch (urgency) {
      case 'immediate':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'soon':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'preventive':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getUrgencyLabel = (urgency: TreatmentRecommendation['urgency']) => {
    switch (urgency) {
      case 'immediate':
        return 'Acción inmediata';
      case 'soon':
        return 'Próximos días';
      case 'preventive':
        return 'Preventivo';
      default:
        return 'Recomendado';
    }
  };

  const getUrgencyBg = (urgency: TreatmentRecommendation['urgency']) => {
    switch (urgency) {
      case 'immediate':
        return 'bg-red-50 border-red-200';
      case 'soon':
        return 'bg-orange-50 border-orange-200';
      case 'preventive':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // Si es saludable, mostrar mensaje positivo
  if (disease === 'healthy') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            ¡Tu planta está saludable!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 mb-4">
            No se detectaron signos de enfermedad. Sigue estos consejos para mantenerla así:
          </p>
          <ul className="space-y-2">
            {diseaseInfo.prevention.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-green-700">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Recomendaciones de tratamiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Treatment recommendations */}
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-lg border ${getUrgencyBg(rec.urgency)}`}
          >
            <div className="flex items-start gap-3">
              {getUrgencyIcon(rec.urgency)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/60">
                    {getUrgencyLabel(rec.urgency)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{rec.description}</p>
                
                {rec.products && rec.products.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rec.products.map((product, pidx) => (
                      <span
                        key={pidx}
                        className="text-xs px-2 py-1 bg-white rounded-full text-gray-600"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Symptoms section */}
        {diseaseInfo.symptoms.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-2">Síntomas a vigilar</h4>
            <ul className="grid sm:grid-cols-2 gap-2">
              {diseaseInfo.symptoms.map((symptom, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: diseaseInfo.color }}
                  />
                  {symptom}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prevention tips */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold text-gray-900 mb-2">Prevención futura</h4>
          <ul className="space-y-1">
            {diseaseInfo.prevention.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <strong>Nota:</strong> Estas recomendaciones son orientativas. Para casos graves 
          o persistentes, consulta con un agrónomo o especialista en sanidad vegetal.
        </div>
      </CardContent>
    </Card>
  );
}
