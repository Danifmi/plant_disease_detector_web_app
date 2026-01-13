'use client';

import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { DISEASES_INFO } from '@/lib/constants/diseases';
import { DiseaseType } from '@/types/analysis';

export default function GuidePage() {
  const diseaseOrder: DiseaseType[] = ['healthy', 'rust', 'scab', 'multiple_diseases'];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'none':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Sin riesgo
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <AlertTriangle className="w-3 h-3" />
            Riesgo medio
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" />
            Riesgo alto
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 mb-4">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </Button>
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Guía de Enfermedades
            </h1>
            <p className="text-gray-600">
              Información detallada sobre las enfermedades que nuestro sistema puede detectar 
              en hojas de manzano.
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Acerca de la detección</h3>
              <p className="text-sm text-blue-700 mt-1">
                Este sistema está entrenado específicamente para detectar enfermedades en hojas 
                de manzano (Apple leaves). Los resultados son orientativos y no sustituyen el 
                diagnóstico de un profesional agrónomo.
              </p>
            </div>
          </div>

          {/* Disease Cards */}
          <div className="space-y-6">
            {diseaseOrder.map((diseaseKey) => {
              const disease = DISEASES_INFO[diseaseKey];
              return (
                <Card key={disease.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${disease.color}20` }}
                        >
                          {disease.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {disease.nameEs}
                            <span className="text-gray-400 font-normal ml-2">
                              ({disease.name})
                            </span>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {disease.description}
                          </CardDescription>
                        </div>
                      </div>
                      {getSeverityBadge(disease.severity)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Symptoms */}
                    {disease.symptoms.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Síntomas
                        </h4>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {disease.symptoms.map((symptom, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-gray-600"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: disease.color }}
                              />
                              {symptom}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Causes */}
                    {disease.causes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Causas
                        </h4>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {disease.causes.map((cause, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-gray-600"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Treatments */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Tratamiento
                      </h4>
                      <ul className="space-y-2">
                        {disease.treatments.map((treatment, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-600"
                          >
                            <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-green-600 text-xs font-medium">
                                {idx + 1}
                              </span>
                            </span>
                            {treatment}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prevention */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Prevención
                      </h4>
                      <ul className="grid sm:grid-cols-2 gap-2">
                        {disease.prevention.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-600"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              ¿Quieres analizar tus plantas?
            </h2>
            <Link href="/analyze">
              <Button size="lg" className="gap-2">
                Comenzar análisis
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
