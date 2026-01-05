// Configuración global de la aplicación

export const APP_CONFIG = {
  name: 'Plant Disease Detector',
  version: '1.0.0',
  description: 'Detecta enfermedades en plantas usando IA'
};

export const MODEL_CONFIG = {
  modelPath: '/models/model.json',
  inputSize: 224,
  classes: ['healthy', 'multiple_diseases', 'rust', 'scab'] as const,
  confidenceThreshold: 0.5
};

export const CAMERA_CONFIG = {
  defaultConstraints: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    facingMode: 'environment' as const,
    aspectRatio: 16 / 9
  },
  captureOptions: {
    format: 'image/jpeg' as const,
    quality: 0.92,
    maxWidth: 1920,
    maxHeight: 1080
  }
};

export const IMAGE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  processingSize: 224
};

export const STORAGE_KEYS = {
  analysisHistory: 'plant-detector-history',
  modelCache: 'plant-detector-model',
  userPreferences: 'plant-detector-preferences'
};

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 30000
};
