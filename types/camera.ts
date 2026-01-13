// Tipos para la gestión de cámara

export interface CameraState {
  isAvailable: boolean;
  isActive: boolean;
  hasPermission: boolean;
  error?: string;
  facingMode: 'user' | 'environment';
  stream?: MediaStream;
}

export interface CameraConstraints {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  aspectRatio?: number;
}

export interface CaptureOptions {
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
}

export type CameraPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';
