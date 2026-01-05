"use client"

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isStreaming: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => string | null;
  switchCamera: () => Promise<void>;
  hasMultipleCameras: boolean;
  currentFacingMode: 'user' | 'environment';
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    facingMode = 'environment',
    width = 1280,
    height = 720
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(facingMode);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Verificar dispositivos disponibles
  useEffect(() => {
    async function checkDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }
    }
    
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      checkDevices();
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Verificar soporte
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      // Detener stream anterior si existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: width },
          height: { ideal: height }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      let message = 'Error al acceder a la cámara';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          message = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.';
        } else if (err.name === 'NotFoundError') {
          message = 'No se encontró ninguna cámara en el dispositivo.';
        } else if (err.name === 'NotReadableError') {
          message = 'La cámara está siendo usada por otra aplicación.';
        } else {
          message = err.message;
        }
      }
      
      setError(message);
      console.error('Camera error:', err);
    }
  }, [currentFacingMode, width, height]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Ajustar canvas al tamaño del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar frame actual
    ctx.drawImage(video, 0, 0);

    // Devolver como data URL
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  const switchCamera = useCallback(async () => {
    const newMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newMode);
    
    if (isStreaming) {
      stopCamera();
      // Pequeño delay para asegurar que la cámara se libera
      setTimeout(async () => {
        try {
          const constraints: MediaStreamConstraints = {
            video: {
              facingMode: newMode,
              width: { ideal: width },
              height: { ideal: height }
            },
            audio: false
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setIsStreaming(true);
          }
        } catch (err) {
          console.error('Error switching camera:', err);
          setError('Error al cambiar de cámara');
        }
      }, 300);
    }
  }, [currentFacingMode, isStreaming, stopCamera, width, height]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
    hasMultipleCameras,
    currentFacingMode
  };
}
