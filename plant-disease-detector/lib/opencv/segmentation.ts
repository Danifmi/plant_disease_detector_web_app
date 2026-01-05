// Segmentación de áreas afectadas por enfermedades

import { getCV, ensureOpenCVLoaded } from './loader';
import { AffectedArea } from '@/types/analysis';
import { COLOR_RANGES } from './colorAnalysis';

/**
 * Segmenta y encuentra áreas afectadas por enfermedad
 */
export async function segmentDiseaseAreas(
  imageData: ImageData,
  diseaseType: 'rust' | 'scab' | 'multiple_diseases'
): Promise<AffectedArea[]> {
  const cv = await ensureOpenCVLoaded();

  const src = cv.matFromImageData(imageData);
  const hsv = new cv.Mat();
  const mask = new cv.Mat();
  const morphed = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  // Convertir a HSV
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  const hsvFinal = new cv.Mat();
  cv.cvtColor(hsv, hsvFinal, cv.COLOR_RGB2HSV);

  // Crear máscara combinada para el tipo de enfermedad
  let combinedMask = new cv.Mat.zeros(hsv.rows, hsv.cols, cv.CV_8UC1);

  if (diseaseType === 'rust' || diseaseType === 'multiple_diseases') {
    const rustMask = createMask(cv, hsvFinal, COLOR_RANGES.rust);
    cv.add(combinedMask, rustMask, combinedMask);
    rustMask.delete();
  }

  if (diseaseType === 'scab' || diseaseType === 'multiple_diseases') {
    const scabMask = createMask(cv, hsvFinal, COLOR_RANGES.scab);
    cv.add(combinedMask, scabMask, combinedMask);
    scabMask.delete();
  }

  // Aplicar operaciones morfológicas para limpiar la máscara
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
  cv.morphologyEx(combinedMask, morphed, cv.MORPH_CLOSE, kernel);
  cv.morphologyEx(morphed, morphed, cv.MORPH_OPEN, kernel);

  // Encontrar contornos
  cv.findContours(
    morphed,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  // Convertir contornos a áreas afectadas
  const areas: AffectedArea[] = [];
  const minArea = (imageData.width * imageData.height) * 0.001; // Mínimo 0.1% del área total

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);

    if (area > minArea) {
      const rect = cv.boundingRect(contour);
      const severity = calculateAreaSeverity(area, imageData.width * imageData.height);

      areas.push({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        severity
      });
    }
  }

  // Limpiar
  src.delete();
  hsv.delete();
  hsvFinal.delete();
  mask.delete();
  morphed.delete();
  combinedMask.delete();
  contours.delete();
  hierarchy.delete();
  kernel.delete();

  return areas;
}

/**
 * Crea una máscara para un rango de color
 */
function createMask(
  cv: any,
  hsv: any,
  range: { lower: number[]; upper: number[] }
): any {
  const mask = new cv.Mat();
  const lower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), range.lower);
  const upper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), range.upper);

  cv.inRange(hsv, lower, upper, mask);

  lower.delete();
  upper.delete();

  return mask;
}

/**
 * Calcula la severidad basada en el área afectada
 */
function calculateAreaSeverity(
  affectedArea: number,
  totalArea: number
): 'low' | 'medium' | 'high' {
  const ratio = affectedArea / totalArea;

  if (ratio > 0.1) return 'high';
  if (ratio > 0.03) return 'medium';
  return 'low';
}

/**
 * Genera una imagen con las áreas afectadas resaltadas
 */
export async function highlightDiseaseAreas(
  imageData: ImageData,
  areas: AffectedArea[],
  color: [number, number, number] = [255, 0, 0]
): Promise<ImageData> {
  const cv = await ensureOpenCVLoaded();

  const src = cv.matFromImageData(imageData);
  const result = src.clone();

  // Dibujar rectángulos para cada área
  areas.forEach((area) => {
    const point1 = new cv.Point(area.x, area.y);
    const point2 = new cv.Point(area.x + area.width, area.y + area.height);

    // Color según severidad
    let lineColor: [number, number, number, number];
    switch (area.severity) {
      case 'high':
        lineColor = [255, 0, 0, 255];
        break;
      case 'medium':
        lineColor = [255, 165, 0, 255];
        break;
      default:
        lineColor = [255, 255, 0, 255];
    }

    cv.rectangle(result, point1, point2, lineColor, 2);
  });

  // Convertir a ImageData
  const outputData = new ImageData(
    new Uint8ClampedArray(result.data),
    result.cols,
    result.rows
  );

  // Limpiar
  src.delete();
  result.delete();

  return outputData;
}

/**
 * Calcula el porcentaje total de área afectada
 */
export function calculateTotalAffectedPercentage(
  areas: AffectedArea[],
  imageWidth: number,
  imageHeight: number
): number {
  const totalImageArea = imageWidth * imageHeight;
  const totalAffectedArea = areas.reduce(
    (sum, area) => sum + area.width * area.height,
    0
  );

  return (totalAffectedArea / totalImageArea) * 100;
}
