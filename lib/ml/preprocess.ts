import * as tf from '@tensorflow/tfjs';

const IMAGE_SIZE = 224;

// ----------------------------------------------------------------------
// FUNCIONES AUXILIARES (Carga de imágenes y Canvas)
// ----------------------------------------------------------------------

/**
 * Convierte una cadena base64 o URL a un elemento Canvas
 */
export async function imageDataToCanvas(imageDataStr: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = (err) => reject(err);
    img.src = imageDataStr;
  });
}

/**
 * Convierte un archivo Blob/File a Canvas
 */
export async function fileToCanvas(file: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        imageDataToCanvas(e.target.result).then(resolve).catch(reject);
      } else {
        reject(new Error('Error leyendo el archivo'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Valida el tamaño de la imagen
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
 * Recorta la imagen al centro para que sea cuadrada (Square Crop)
 * Crucial para evitar que la hoja se deforme al redimensionar.
 */
export function centerCrop(
  canvas: HTMLCanvasElement,
  targetSize: number = IMAGE_SIZE
): HTMLCanvasElement {
  // Calcular el tamaño del cuadrado más grande posible en el centro
  const size = Math.min(canvas.width, canvas.height);
  const sx = (canvas.width - size) / 2;
  const sy = (canvas.height - size) / 2;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = targetSize;
  croppedCanvas.height = targetSize;
  
  const ctx = croppedCanvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener contexto 2D');

  // Recortar centro y redimensionar al targetSize (224)
  ctx.drawImage(canvas, sx, sy, size, size, 0, 0, targetSize, targetSize);
  
  return croppedCanvas;
}

// ----------------------------------------------------------------------
// FUNCIÓN PRINCIPAL DE PREPROCESAMIENTO
// ----------------------------------------------------------------------

/**
 * Preprocesa la imagen para EfficientNet (Rango 0-255)
 * IMPORTANTE: El modelo espera valores de píxeles entre 0 y 255.
 * NO dividir por 255.
 */
export async function preprocessImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageData | string
): Promise<tf.Tensor4D> {
  return tf.tidy(() => {
    let tensor: tf.Tensor3D;

    // 1. Convertir fuente a Tensor de píxeles [0, 255] (int32)
    if (typeof imageSource === 'string') {
       throw new Error('Usa imageDataToCanvas() antes de llamar a preprocessImage con un string');
    } else if (imageSource instanceof ImageData) {
      tensor = tf.browser.fromPixels(imageSource);
    } else {
      // HTMLImageElement o HTMLCanvasElement
      tensor = tf.browser.fromPixels(imageSource);
    }

    // 2. Redimensionar a 224x224
    // Usamos resizeBilinear para suavizar.
    // Nota: Si usaste centerCrop antes, esto solo asegura el tamaño 224x224 final.
    const resized = tf.image.resizeBilinear(tensor, [IMAGE_SIZE, IMAGE_SIZE]);

    // 3. Convertir a Float32 (sin dividir por 255)
    // Dejamos los valores en rango 0-255
    const floatTensor = resized.toFloat(); 

    // 4. Expandir dimensiones a [1, 224, 224, 3] y forzar el tipo Tensor4D
    return floatTensor.expandDims(0) as tf.Tensor4D;
  });
}