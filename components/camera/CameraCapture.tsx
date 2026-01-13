// Componente principal de captura de cámara

'use client';

import { useEffect, useCallback } from 'react';
import { Camera, CameraOff, RotateCcw, Circle, X } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (data: { blob: Blob; dataUrl: string }) => void;
  onClose?: () => void;
  className?: string;
}

export function CameraCapture({ onCapture, onClose, className }: CameraCaptureProps) {
  const {
    state,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    switchCameraDirection,
    requestPermission
  } = useCamera();

  // Iniciar cámara al montar
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Manejar captura
  const handleCapture = useCallback(async () => {
    const result = await captureImage();
    if (result) {
      stopCamera();
      onCapture(result);
    }
  }, [captureImage, stopCamera, onCapture]);

  // Si no hay permiso
  if (!state.hasPermission && !state.isActive) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg', className)}>
        <CameraOff className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Permiso de cámara requerido</h3>
        <p className="text-muted-foreground text-center mb-4">
          Para usar esta función, necesitamos acceso a tu cámara.
        </p>
        <Button onClick={requestPermission}>
          <Camera className="mr-2 h-4 w-4" />
          Permitir acceso a la cámara
        </Button>
      </div>
    );
  }

  // Si hay error
  if (state.error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg', className)}>
        <CameraOff className="h-16 w-16 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error de cámara</h3>
        <p className="text-red-500 text-center mb-4">{state.error}</p>
        <Button onClick={() => startCamera()} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-lg overflow-hidden bg-black', className)}>
      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Overlay con guías */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Marco de enfoque */}
        <div className="absolute inset-8 border-2 border-white/50 rounded-lg">
          {/* Esquinas */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br" />
        </div>
        
        {/* Instrucción */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full">
          <p className="text-white text-sm">Centra la hoja en el marco</p>
        </div>
      </div>

      {/* Controles */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {/* Botón cerrar */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          )}

          {/* Botón de captura */}
          <button
            onClick={handleCapture}
            disabled={!state.isActive}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Circle className="h-14 w-14 text-green-500 fill-green-500" />
          </button>

          {/* Botón cambiar cámara */}
          <Button
            variant="ghost"
            size="icon"
            onClick={switchCameraDirection}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
