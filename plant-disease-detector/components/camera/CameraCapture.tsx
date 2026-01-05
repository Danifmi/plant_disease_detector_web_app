"use client"

import React, { useState, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { Camera, SwitchCamera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose?: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const {
    videoRef,
    canvasRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
    hasMultipleCameras
  } = useCamera({ facingMode: 'environment' });

  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Auto-iniciar cámara al montar
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleCapture = () => {
    setIsCapturing(true);
    setShowFlash(true);
    
    // Efecto flash
    setTimeout(() => {
      setShowFlash(false);
      const imageData = captureImage();
      if (imageData) {
        onCapture(imageData);
        stopCamera();
      }
      setIsCapturing(false);
    }, 150);
  };

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay de captura (flash) */}
      {showFlash && (
        <div className="absolute inset-0 bg-white animate-pulse z-10" />
      )}

      {/* Guía de encuadre */}
      {isStreaming && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-8 border-2 border-white/50 rounded-lg">
            {/* Esquinas */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
          </div>
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            Encuadra la hoja dentro del marco
          </p>
        </div>
      )}

      {/* Controles */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {/* Botón cerrar */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          )}

          {/* Botón capturar */}
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={!isStreaming || isCapturing}
            className="w-16 h-16 rounded-full bg-white hover:bg-gray-200 text-black p-0"
          >
            {isCapturing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Camera className="h-8 w-8" />
            )}
          </Button>

          {/* Botón cambiar cámara */}
          {hasMultipleCameras ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="text-white hover:bg-white/20"
            >
              <SwitchCamera className="h-6 w-6" />
            </Button>
          ) : (
            <div className="w-10" /> // Spacer para mantener centrado el botón de captura
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={startCamera} variant="outline">
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {/* Estado de carga inicial */}
      {!isStreaming && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto mb-4" />
            <p className="text-white">Iniciando cámara...</p>
          </div>
        </div>
      )}
    </div>
  );
}
