// Análisis de color HSV para detección de enfermedades

import { getCV, ensureOpenCVLoaded } from './loader';
import { DiseaseType } from '@/types/analysis';

// Rangos de color HSV para cada enfermedad (en formato OpenCV: H 0-180, S 0-255, V 0-255)
export const COLOR_RANGES = {
  healthy: {
    lower: [35, 50, 50],   // Verde
    upper: [85, 255, 255]
  },
  rust: {
    lower: [5, 100, 100],  // Naranja/Marrón
    upper: [25, 255, 255]
  },
  scab: {
    lower: [0, 0, 30],     // Gris oscuro/Negro
    upper: [180, 50, 100]
  },
  yellowSpots: {
    lower: [20, 100, 100], // Amarillo (síntoma de enfermedad)
    upper: [35, 255, 255]
  }
};

/**
 * Analiza los colores dominantes en una imagen
 */
export async function analyzeColors(
  imageData: ImageData
): Promise<{
  healthyPixels: number;
  rustPixels: number;
  scabPixels: number;
  yellowPixels: number;
  totalPixels: number;
}> {
  const cv = await ensureOpenCVLoaded();

  // Crear Mat desde ImageData
  const src = cv.matFromImageData(imageData);
  const hsv = new cv.Mat();
  
  // Convertir a HSV
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  const hsvFinal = new cv.Mat();
  cv.cvtColor(hsv, hsvFinal, cv.COLOR_RGB2HSV);

  // Contar píxeles en cada rango
  const counts = {
    healthyPixels: countPixelsInRange(cv, hsvFinal, COLOR_RANGES.healthy),
    rustPixels: countPixelsInRange(cv, hsvFinal, COLOR_RANGES.rust),
    scabPixels: countPixelsInRange(cv, hsvFinal, COLOR_RANGES.scab),
    yellowPixels: countPixelsInRange(cv, hsvFinal, COLOR_RANGES.yellowSpots),
    totalPixels: imageData.width * imageData.height
  };

  // Limpiar
  src.delete();
  hsv.delete();
  hsvFinal.delete();

  return counts;
}

/**
 * Cuenta píxeles dentro de un rango de color
 */
function countPixelsInRange(
  cv: any,
  hsv: any,
  range: { lower: number[]; upper: number[] }
): number {
  const lower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), range.lower);
  const upper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), range.upper);
  const mask = new cv.Mat();

  cv.inRange(hsv, lower, upper, mask);
  const count = cv.countNonZero(mask);

  lower.delete();
  upper.delete();
  mask.delete();

  return count;
}

/**
 * Genera una máscara de color para una enfermedad específica
 */
export async function generateColorMask(
  imageData: ImageData,
  targetColor: 'healthy' | 'rust' | 'scab'
): Promise<ImageData> {
  const cv = await ensureOpenCVLoaded();

  const src = cv.matFromImageData(imageData);
  const hsv = new cv.Mat();
  const mask = new cv.Mat();
  const result = new cv.Mat();

  // Convertir a HSV
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  const hsvFinal = new cv.Mat();
  cv.cvtColor(hsv, hsvFinal, cv.COLOR_RGB2HSV);

  // Crear máscara
  const range = COLOR_RANGES[targetColor];
  const lower = new cv.Mat(hsvFinal.rows, hsvFinal.cols, hsvFinal.type(), range.lower);
  const upper = new cv.Mat(hsvFinal.rows, hsvFinal.cols, hsvFinal.type(), range.upper);

  cv.inRange(hsvFinal, lower, upper, mask);

  // Aplicar máscara
  cv.bitwise_and(src, src, result, mask);

  // Convertir a ImageData
  const outputData = new ImageData(
    new Uint8ClampedArray(result.data),
    result.cols,
    result.rows
  );

  // Limpiar
  src.delete();
  hsv.delete();
  hsvFinal.delete();
  mask.delete();
  result.delete();
  lower.delete();
  upper.delete();

  return outputData;
}

/**
 * Estima el tipo de enfermedad basándose en análisis de color
 */
export async function estimateDiseaseFromColors(
  imageData: ImageData
): Promise<{ disease: DiseaseType; confidence: number }> {
  const colors = await analyzeColors(imageData);
  
  const { healthyPixels, rustPixels, scabPixels, yellowPixels, totalPixels } = colors;

  // Calcular porcentajes
  const healthyRatio = healthyPixels / totalPixels;
  const rustRatio = rustPixels / totalPixels;
  const scabRatio = scabPixels / totalPixels;
  const yellowRatio = yellowPixels / totalPixels;
  const diseaseRatio = rustRatio + scabRatio + yellowRatio;

  // Determinar enfermedad
  if (healthyRatio > 0.6 && diseaseRatio < 0.1) {
    return { disease: 'healthy', confidence: healthyRatio };
  }

  if (rustRatio > scabRatio && rustRatio > 0.05) {
    if (scabRatio > 0.03) {
      return { disease: 'multiple_diseases', confidence: diseaseRatio };
    }
    return { disease: 'rust', confidence: rustRatio * 2 };
  }

  if (scabRatio > 0.05) {
    return { disease: 'scab', confidence: scabRatio * 2 };
  }

  return { disease: 'healthy', confidence: healthyRatio };
}
