// lib/ml/preprocess.ts
import * as tf from '@tensorflow/tfjs';

const IMAGE_SIZE = 224;

/**
 * Preprocesa una imagen para el modelo EfficientNetB0
 * Input: HTMLImageElement, HTMLCanvasElement, ImageData, o string (base64)
 * Output: Tensor4D normalizado [1, 224, 224, 3] en rango [0, 1]
 */
export async function preprocessImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageData | string
): Promise<tf.Tensor4D> {
  return tf.tidy(() => {
    let tensor: tf.Tensor3D;

    // Manejar diferentes tipos de entrada
    if (typeof imageSource === 'string') {
      // Si es base64, crear elemento de imagen
      throw new Error('Use imageDataToCanvas() primero para convertir base64 a canvas');
    } else if (imageSource instanceof ImageData) {
      // Convertir ImageData a tensor
      tensor = tf.browser.fromPixels(imageSource);
    } else {
      // HTMLImageElement o HTMLCanvasElement
      tensor = tf.browser.fromPixels(imageSource);
    }

    // 1. Redimensionar a 224x224
    const resized = tf.image.resizeBilinear(tensor, [IMAGE_SIZE, IMAGE_SIZE]);

    // 2. Normalizar a [0, 1] dividiendo por 255
    const normalized = resized.toFloat().div(255.0);

    // 3. Expandir dimensiones para batch [1, 224, 224, 3]
    const batched = normalized.expandDims(0) as tf.Tensor4D;

    return batched;
  });
}

/**
 * Convierte data URL (base64) a HTMLCanvasElement
 */
export async function imageDataToCanvas(imageData: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      } else {
        reject(new Error('No se pudo obtener contexto 2D'));
      }
    };
    
    img.onerror = () => reject(new Error('Error cargando imagen'));
    img.src = imageData;
  });
}

/**
 * Convierte File/Blob a HTMLCanvasElement
 */
export async function fileToCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const canvas = await imageDataToCanvas(dataUrl);
        resolve(canvas);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Valida que la imagen tenga el tamaño mínimo requerido
 */
export function validateImageSize(
  element: HTMLImageElement | HTMLCanvasElement,
  minSize: number = 224
): { valid: boolean; message?: string } {
  const width = element.width;
  const height = element.height;

  if (width < minSize || height < minSize) {
    return {
      valid: false,
      message: `La imagen es demasiado pequeña. Mínimo ${minSize}x${minSize}px, actual ${width}x${height}px`
    };
  }

  return { valid: true };
}

/**
 * Recorta imagen al centro (square crop)
 */
export function centerCrop(
  canvas: HTMLCanvasElement,
  targetSize: number = IMAGE_SIZE
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener contexto 2D');

  const size = Math.min(canvas.width, canvas.height);
  const x = (canvas.width - size) / 2;
  const y = (canvas.height - size) / 2;

  // Crear nuevo canvas con el recorte
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = targetSize;
  croppedCanvas.height = targetSize;
  
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) throw new Error('No se pudo obtener contexto 2D');

  croppedCtx.drawImage(
    canvas,
    x, y, size, size,  // fuente
    0, 0, targetSize, targetSize  // destino
  );

  return croppedCanvas;
}
