// Detección de contornos para visualización de enfermedades

import { getCV, ensureOpenCVLoaded } from './loader';

export interface ContourInfo {
  points: number[];
  area: number;
  perimeter: number;
  boundingRect: { x: number; y: number; width: number; height: number };
}

/**
 * Detecta contornos en una imagen preprocesada
 */
export async function detectContours(
  imageData: ImageData,
  threshold: number = 127
): Promise<ContourInfo[]> {
  const cv = await ensureOpenCVLoaded();

  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const binary = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  // Convertir a escala de grises
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // Aplicar umbral
  cv.threshold(gray, binary, threshold, 255, cv.THRESH_BINARY);

  // Detectar contornos
  cv.findContours(
    binary,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  // Extraer información de contornos
  const contourInfos: ContourInfo[] = [];

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    const perimeter = cv.arcLength(contour, true);
    const rect = cv.boundingRect(contour);

    // Extraer puntos del contorno
    const points: number[] = [];
    for (let j = 0; j < contour.rows; j++) {
      points.push(contour.intAt(j, 0), contour.intAt(j, 1));
    }

    contourInfos.push({
      points,
      area,
      perimeter,
      boundingRect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }
    });
  }

  // Limpiar
  src.delete();
  gray.delete();
  binary.delete();
  contours.delete();
  hierarchy.delete();

  return contourInfos;
}

/**
 * Dibuja contornos en un canvas
 */
export async function drawContoursOnCanvas(
  canvas: HTMLCanvasElement,
  contours: ContourInfo[],
  color: string = '#ef4444',
  lineWidth: number = 2
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  contours.forEach((contour) => {
    if (contour.points.length < 4) return;

    ctx.beginPath();
    ctx.moveTo(contour.points[0], contour.points[1]);

    for (let i = 2; i < contour.points.length; i += 2) {
      ctx.lineTo(contour.points[i], contour.points[i + 1]);
    }

    ctx.closePath();
    ctx.stroke();
  });
}

/**
 * Filtra contornos por área mínima
 */
export function filterContoursByArea(
  contours: ContourInfo[],
  minArea: number
): ContourInfo[] {
  return contours.filter((c) => c.area >= minArea);
}

/**
 * Agrupa contornos cercanos
 */
export function groupNearbyContours(
  contours: ContourInfo[],
  maxDistance: number = 20
): ContourInfo[][] {
  const groups: ContourInfo[][] = [];
  const used = new Set<number>();

  contours.forEach((contour, i) => {
    if (used.has(i)) return;

    const group: ContourInfo[] = [contour];
    used.add(i);

    contours.forEach((other, j) => {
      if (used.has(j)) return;

      const distance = calculateContourDistance(contour, other);
      if (distance <= maxDistance) {
        group.push(other);
        used.add(j);
      }
    });

    groups.push(group);
  });

  return groups;
}

/**
 * Calcula la distancia entre dos contornos
 */
function calculateContourDistance(a: ContourInfo, b: ContourInfo): number {
  const centerA = {
    x: a.boundingRect.x + a.boundingRect.width / 2,
    y: a.boundingRect.y + a.boundingRect.height / 2
  };
  const centerB = {
    x: b.boundingRect.x + b.boundingRect.width / 2,
    y: b.boundingRect.y + b.boundingRect.height / 2
  };

  return Math.sqrt(
    Math.pow(centerA.x - centerB.x, 2) + Math.pow(centerA.y - centerB.y, 2)
  );
}
