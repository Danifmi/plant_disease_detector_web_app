// Hook personalizado para gestión de cámara

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CameraState, CameraConstraints, CaptureOptions } from '@/types/camera';
import {
  getCameraStream,
  stopMediaStream,
  captureImageFromVideo,
  switchCamera,
  isMediaDevicesSupported
} from '@/lib/camera/mediaDevices';
import {
  getCameraPermissionStatus,
  requestCameraPermission,
  getCameraSupport
} from '@/lib/camera/permissions';
import { CAMERA_CONFIG } from '@/lib/constants/config';

interface UseCameraReturn {
  state: CameraState;
  videoRef: React.RefObject<HTMLVideoElement>;
  startCamera: (constraints?: CameraConstraints) => Promise<void>;
  stopCamera: () => void;
  captureImage: (options?: CaptureOptions) => Promise<{ blob: Blob; dataUrl: string } | null>;
  switchCameraDirection: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>({
    isAvailable: false,
    isActive: false,
    hasPermission: false,
    facingMode: 'environment'
  });

  // Verificar disponibilidad al montar
  useEffect(() => {
    const support = getCameraSupport();
    setState((prev) => ({
      ...prev,
      isAvailable: support.supported,
      error: support.reason
    }));

    // Verificar permisos iniciales
    getCameraPermissionStatus().then((status) => {
      setState((prev) => ({
        ...prev,
        hasPermission: status === 'granted'
      }));
    });

    // Cleanup al desmontar
    return () => {
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
      }
    };
  }, []);

  // Iniciar cámara
  const startCamera = useCallback(async (constraints?: CameraConstraints) => {
    if (!isMediaDevicesSupported()) {
      setState((prev) => ({
        ...prev,
        error: 'MediaDevices no soportado'
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, error: undefined }));

      const stream = await getCameraStream({
        facingMode: constraints?.facingMode || state.facingMode,
        ...constraints
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState((prev) => ({
        ...prev,
        isActive: true,
        hasPermission: true,
        stream,
        facingMode: constraints?.facingMode || prev.facingMode
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido al acceder a la cámara';

      setState((prev) => ({
        ...prev,
        isActive: false,
        error: errorMessage
      }));
    }
  }, [state.facingMode]);

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
      stream: undefined
    }));
  }, []);

  // Capturar imagen
  const captureImage = useCallback(
    async (options?: CaptureOptions): Promise<{ blob: Blob; dataUrl: string } | null> => {
      if (!videoRef.current || !state.isActive) {
        return null;
      }

      const format = options?.format || CAMERA_CONFIG.captureOptions.format;
      const quality = options?.quality || CAMERA_CONFIG.captureOptions.quality;

      const { blob, dataUrl } = captureImageFromVideo(videoRef.current, format, quality);

      return { blob: await blob, dataUrl };
    },
    [state.isActive]
  );

  // Cambiar dirección de cámara
  const switchCameraDirection = useCallback(async () => {
    if (!streamRef.current) return;

    try {
      const result = await switchCamera(streamRef.current, state.facingMode);
      streamRef.current = result.stream;

      if (videoRef.current) {
        videoRef.current.srcObject = result.stream;
        await videoRef.current.play();
      }

      setState((prev) => ({
        ...prev,
        facingMode: result.facingMode,
        stream: result.stream
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al cambiar de cámara';

      setState((prev) => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [state.facingMode]);

  // Solicitar permiso
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const status = await requestCameraPermission();
      const granted = status === 'granted';

      setState((prev) => ({
        ...prev,
        hasPermission: granted
      }));

      return granted;
    } catch {
      return false;
    }
  }, []);

  return {
    state,
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    startCamera,
    stopCamera,
    captureImage,
    switchCameraDirection,
    requestPermission
  };
}
