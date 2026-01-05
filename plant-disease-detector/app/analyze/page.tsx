"use client"

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { AnalysisResultComponent } from '@/components/analysis/AnalysisResult';
import { DiseaseOverlay } from '@/components/analysis/DiseaseOverlay';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, Loader2, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { analyzeLeafImage, type AnalysisResult } from '@/lib/opencv/colorAnalysis';

type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error';

export default function AnalyzePage() {
  const [state, setState] = useState<AnalysisState>('idle');
  const [imageData, setImageData] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Analizando imagen...');

  const handleImageCapture = useCallback(async (data: string) => {
    setImageData(data);
    setState('analyzing');
    setError(null);
    setLoadingMessage('Cargando OpenCV.js...');

    try {
      // Crear imagen para análisis
      const img = new Image();
      img.src = data;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      setLoadingMessage('Analizando colores...');

      // Crear canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('No se pudo crear el contexto de canvas');
      }
      
      ctx.drawImage(img, 0, 0);

      setLoadingMessage('Detectando enfermedades...');

      // Realizar análisis
      const analysisResult = await analyzeLeafImage(canvas);

      setResult(analysisResult);
      setState('complete');
    } catch (err) {
      console.error('Error en análisis:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido durante el análisis');
      setState('error');
    }
  }, []);

  const handleReset = () => {
    setState('idle');
    setImageData(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span>Volver</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              Analizar Planta
            </h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Estado: Selección de imagen */}
        {state === 'idle' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Captura o sube una imagen
              </h2>
              <p className="text-gray-600">
                Toma una foto de una hoja de manzano o sube una imagen para analizarla
              </p>
            </div>

            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="camera" className="text-base">
                  <Camera className="mr-2 h-4 w-4" />
                  Cámara
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-base">
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Imagen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="camera">
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
                      <CameraCapture onCapture={handleImageCapture} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upload">
                <Card>
                  <CardContent className="p-6">
                    <ImageUpload onImageSelect={handleImageCapture} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Tips */}
            <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">💡 Consejos para mejores resultados:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Asegúrate de que la hoja esté bien iluminada</li>
                <li>• Evita sombras sobre la hoja</li>
                <li>• Intenta que la hoja ocupe la mayor parte de la imagen</li>
                <li>• Enfoca claramente la superficie de la hoja</li>
              </ul>
            </div>
          </div>
        )}

        {/* Estado: Analizando */}
        {state === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-green-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 bg-green-100 rounded-full" />
              </div>
            </div>
            <p className="text-xl font-medium mt-6 text-gray-900">{loadingMessage}</p>
            <p className="text-gray-500 mt-2">Esto puede tomar unos segundos</p>
            
            {/* Preview de la imagen mientras se analiza */}
            {imageData && (
              <div className="mt-8 max-w-sm">
                <img 
                  src={imageData} 
                  alt="Analizando..." 
                  className="rounded-lg shadow-lg opacity-50"
                />
              </div>
            )}
          </div>
        )}

        {/* Estado: Completado */}
        {state === 'complete' && result && imageData && (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Resultados del Análisis
                </h2>
                <p className="text-gray-600">
                  Análisis completado correctamente
                </p>
              </div>
              <Button onClick={handleReset} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Nuevo Análisis
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Imagen con overlay */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Áreas Detectadas
                </h3>
                <DiseaseOverlay
                  imageUrl={imageData}
                  rustContours={result.contours.rust}
                  scabContours={result.contours.scab}
                  showRust={true}
                  showScab={true}
                />
                
                {/* Imagen original para comparar */}
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Imagen original:</p>
                  <img 
                    src={imageData} 
                    alt="Original" 
                    className="rounded-lg shadow w-full"
                  />
                </div>
              </div>

              {/* Resultados */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Diagnóstico
                </h3>
                <AnalysisResultComponent
                  result={result}
                  imageUrl={imageData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Estado: Error */}
        {state === 'error' && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Error en el Análisis
            </h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={handleReset} className="w-full">
                Intentar de nuevo
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
