// Utilidades para procesamiento de imágenes

import { IMAGE_CONFIG } from '@/lib/constants/config';

/**
 * Redimensiona una imagen manteniendo la proporción
 */
export async function resizeImage(
  file: File | Blob,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calcular nuevas dimensiones manteniendo proporción
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Crear canvas y dibujar
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al crear blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = url;
  });
}

/**
 * Convierte una imagen a base64
 */
export function imageToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte base64 a Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeType });
}

/**
 * Valida si el archivo es una imagen válida
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!IMAGE_CONFIG.acceptedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no soportado. Use: ${IMAGE_CONFIG.acceptedFormats.join(', ')}`
    };
  }

  if (file.size > IMAGE_CONFIG.maxFileSize) {
    const maxSizeMB = IMAGE_CONFIG.maxFileSize / (1024 * 1024);
    return {
      valid: false,
      error: `El archivo es demasiado grande. Máximo: ${maxSizeMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Obtiene las dimensiones de una imagen
 */
export function getImageDimensions(
  source: File | Blob | string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      if (typeof source !== 'string') {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(img.src);
      }
      reject(new Error('Error al obtener dimensiones'));
    };

    img.src = typeof source === 'string' ? source : URL.createObjectURL(source);
  });
}

/**
 * Crea una URL de objeto para una imagen
 */
export function createImageUrl(file: File | Blob): string {
  return URL.createObjectURL(file);
}

/**
 * Libera una URL de objeto
 */
export function revokeImageUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Preprocesa imagen para el modelo ML (224x224)
 */
export async function preprocessForModel(
  source: File | Blob | string,
  size: number = 224
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener contexto'));
        return;
      }
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      resolve(imageData);
      
      if (typeof source !== 'string') {
        URL.revokeObjectURL(img.src);
      }
    };
    
    img.onerror = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(img.src);
      }
      reject(new Error('Error al cargar imagen'));
    };
    
    img.src = typeof source === 'string' ? source : URL.createObjectURL(source);
  });
}
