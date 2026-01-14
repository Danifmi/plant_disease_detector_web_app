'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/common/Header';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { ImageUpload } from '@/components/upload/ImageUpload';
import AnalysisResult from '@/components/analysis/AnalysisResult';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAnalysis } from '@/hooks/useAnalysis';

type InputMode = 'select' | 'camera' | 'upload';

export default function AnalyzePage() {
  const [mode, setMode] = useState<InputMode>('select');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { state, analyze, reset } = useAnalysis();

  const handleCameraCapture = useCallback(async (data: { blob: Blob; dataUrl: string }) => {
    // Usamos la dataUrl (string) tanto para mostrar como para analizar y guardar en historial
    setCapturedImage(data.dataUrl);
    await analyze(data.dataUrl);
  }, [analyze]);

  const handleImageSelect = useCallback(async (file: File, previewUrl: string) => {
    // Usamos la URL de preview generada como string para el análisis e historial
    setCapturedImage(previewUrl);
    await analyze(previewUrl);
  }, [analyze]);

  const handleReset = useCallback(() => {
    setCapturedImage(null);
    reset();
    setMode('select');
  }, [reset]);

  const handleBackToSelect = useCallback(() => {
    if (state.status === 'idle') {
      setMode('select');
    }
  }, [state.status]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Header />

      <main className="flex-1 px-4 py-6">
        {/* Mode Selection */}
        {mode === 'select' && !capturedImage && state.status === 'idle' && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Analizar Planta
              </h1>
              <p className="text-gray-600">
                Elige cómo quieres capturar la imagen de la hoja
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setMode('camera')}
                className="w-full bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Usar Cámara</h3>
                  <p className="text-sm text-gray-500">
                    Toma una foto en tiempo real
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode('upload')}
                className="w-full bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Subir Imagen</h3>
                  <p className="text-sm text-gray-500">
                    Selecciona una foto de tu galería
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Camera Mode */}
        {mode === 'camera' && !capturedImage && state.status === 'idle' && (
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelect}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Capturar Imagen</h1>
            </div>

            <CameraCapture 
              onCapture={handleCameraCapture} 
              onClose={handleBackToSelect}
              className="aspect-[4/3]"
            />

            <div className="mt-4 bg-green-50 rounded-xl p-4 text-center">
              <p className="text-sm text-green-800">
                <strong>Consejo:</strong> Asegúrate de que la hoja esté bien iluminada
                y ocupe la mayor parte de la imagen.
              </p>
            </div>
          </div>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && !capturedImage && state.status === 'idle' && (
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelect}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Subir Imagen</h1>
            </div>

            <ImageUpload 
              onImageSelect={handleImageSelect}
              className="min-h-[300px]"
            />

            <div className="mt-4 bg-green-50 rounded-xl p-4 text-center">
              <p className="text-sm text-green-800">
                <strong>Consejo:</strong> Las mejores imágenes muestran una sola hoja
                con buena iluminación y enfoque.
              </p>
            </div>
          </div>
        )}

        {/* Processing State */}
        {(state.status === 'loading' || state.status === 'processing') && (
          <div className="max-w-lg mx-auto text-center py-16">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">
              {state.status === 'loading' ? 'Preparando análisis...' : 'Analizando imagen...'}
            </p>
            {state.progress !== undefined && (
              <div className="mt-4 w-full max-w-xs mx-auto">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full transition-all duration-300"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">{state.progress}%</p>
              </div>
            )}
          </div>
        )}

        {/* Results State */}
        {state.status === 'complete' && state.result && capturedImage && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-900">Resultados</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Nuevo análisis
              </Button>
            </div>

            <AnalysisResult 
              result={state.result} 
              imageUrl={capturedImage} 
            />
          </div>
        )}

        {/* Error State */}
        {state.status === 'error' && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Error en el análisis
            </h2>
            <p className="text-gray-600 mb-6">
              {state.error || 'Ha ocurrido un error al procesar la imagen.'}
            </p>
            <Button onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Intentar de nuevo
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
