// Utilidades para acceso a dispositivos de media (cámara)

import { CameraDevice, CameraConstraints } from '@/types/camera';
import { CAMERA_CONFIG } from '@/lib/constants/config';

/**
 * Verifica si la API de MediaDevices está disponible
 */
export function isMediaDevicesSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
}

/**
 * Obtiene la lista de cámaras disponibles
 */
export async function getCameraDevices(): Promise<CameraDevice[]> {
  if (!isMediaDevicesSupported()) {
    throw new Error('MediaDevices API no soportada');
  }

  // Primero necesitamos pedir permisos para enumerar dispositivos
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
  } catch {
    // Si falla, aún podemos intentar enumerar
  }

  const devices = await navigator.mediaDevices.enumerateDevices();

  return devices
    .filter((device) => device.kind === 'videoinput')
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label || `Cámara ${device.deviceId.slice(0, 8)}`,
      kind: 'videoinput' as const
    }));
}

/**
 * Obtiene el stream de la cámara con las restricciones especificadas
 */
export async function getCameraStream(
  constraints?: CameraConstraints
): Promise<MediaStream> {
  if (!isMediaDevicesSupported()) {
    throw new Error('MediaDevices API no soportada en este navegador');
  }

  const videoConstraints: MediaTrackConstraints = {
    width: constraints?.width || CAMERA_CONFIG.defaultConstraints.width,
    height: constraints?.height || CAMERA_CONFIG.defaultConstraints.height,
    facingMode: constraints?.facingMode || CAMERA_CONFIG.defaultConstraints.facingMode,
    aspectRatio: constraints?.aspectRatio || CAMERA_CONFIG.defaultConstraints.aspectRatio
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false
    });

    return stream;
  } catch (error) {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          throw new Error('Permiso de cámara denegado');
        case 'NotFoundError':
          throw new Error('No se encontró ninguna cámara');
        case 'NotReadableError':
          throw new Error('La cámara está siendo usada por otra aplicación');
        case 'OverconstrainedError':
          throw new Error('Las restricciones de cámara no se pueden satisfacer');
        default:
          throw new Error(`Error de cámara: ${error.message}`);
      }
    }
    throw error;
  }
}

/**
 * Detiene un stream de media
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Captura una imagen del video
 */
export function captureImageFromVideo(
  video: HTMLVideoElement,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  quality: number = 0.92
): { blob: Promise<Blob>; dataUrl: string } {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto del canvas');
  }

  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL(format, quality);

  const blob = new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Error al crear blob'));
      },
      format,
      quality
    );
  });

  return { blob, dataUrl };
}

/**
 * Cambia entre cámara frontal y trasera
 */
export async function switchCamera(
  currentStream: MediaStream,
  currentFacingMode: 'user' | 'environment'
): Promise<{ stream: MediaStream; facingMode: 'user' | 'environment' }> {
  // Detener stream actual
  stopMediaStream(currentStream);

  // Obtener nuevo stream con la otra cámara
  const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

  const stream = await getCameraStream({ facingMode: newFacingMode });

  return { stream, facingMode: newFacingMode };
}

/**
 * Obtiene las capacidades de una pista de video
 */
export function getVideoTrackCapabilities(
  stream: MediaStream
): MediaTrackCapabilities | null {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return null;

  return videoTrack.getCapabilities?.() || null;
}

/**
 * Aplica restricciones adicionales a un stream existente
 */
export async function applyConstraints(
  stream: MediaStream,
  constraints: MediaTrackConstraints
): Promise<void> {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) {
    throw new Error('No hay pista de video');
  }

  await videoTrack.applyConstraints(constraints);
}
