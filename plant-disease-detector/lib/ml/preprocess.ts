// Preprocesamiento de imágenes para el modelo

import * as tf from '@tensorflow/tfjs';
import { MODEL_CONFIG } from '@/lib/constants/config';

/**
 * Preprocesa una imagen para el modelo
 * Convierte a tensor normalizado de 224x224x3
 */
export async function preprocessImage(
  source: HTMLImageElement | HTMLCanvasElement | ImageData | string | File | Blob
): Promise<tf.Tensor4D> {
  let tensor: tf.Tensor3D;

  // Manejar diferentes tipos de entrada
  if (source instanceof File || source instanceof Blob) {
    const imageUrl = URL.createObjectURL(source);
    try {
      const img = await loadImage(imageUrl);
      tensor = tf.browser.fromPixels(img);
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  } else if (typeof source === 'string') {
    const img = await loadImage(source);
    tensor = tf.browser.fromPixels(img);
  } else if (source instanceof ImageData) {
    tensor = tf.browser.fromPixels(source);
  } else {
    tensor = tf.browser.fromPixels(source);
  }

  // Redimensionar a tamaño del modelo
  const resized = tf.image.resizeBilinear(tensor, [
    MODEL_CONFIG.inputSize,
    MODEL_CONFIG.inputSize
  ]);

  // Normalizar valores de 0-255 a 0-1
  const normalized = resized.div(255.0);

  // Agregar dimensión de batch
  const batched = normalized.expandDims(0) as tf.Tensor4D;

  // Liberar tensores intermedios
  tensor.dispose();
  resized.dispose();
  normalized.dispose();

  return batched;
}

/**
 * Carga una imagen desde URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preprocesa para detección de color (OpenCV style)
 * Convierte RGB a HSV y aplica máscaras de color
 */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = max === 0 ? 0 : diff / max;
  let v = max;

  if (diff !== 0) {
    switch (max) {
      case r:
        h = 60 * ((g - b) / diff + (g < b ? 6 : 0));
        break;
      case g:
        h = 60 * ((b - r) / diff + 2);
        break;
      case b:
        h = 60 * ((r - g) / diff + 4);
        break;
    }
  }

  return [h, s * 100, v * 100];
}

/**
 * Convierte ImageData a tensor normalizado
 */
export function imageDataToTensor(imageData: ImageData): tf.Tensor3D {
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(imageData);
    return tensor.div(255.0) as tf.Tensor3D;
  });
}

/**
 * Aplica augmentación básica para mejorar predicciones
 */
export function applyTestTimeAugmentation(
  tensor: tf.Tensor4D
): tf.Tensor4D[] {
  return tf.tidy(() => {
    const augmented: tf.Tensor4D[] = [tensor.clone()];

    // Flip horizontal - usar unknown para evitar errores de tipo estrictos
    const squeezed = tensor.squeeze([0]);
    const flipped = tf.image.flipLeftRight(squeezed as unknown as tf.Tensor4D);
    augmented.push(tf.expandDims(flipped, 0) as tf.Tensor4D);

    return augmented;
  });
}
