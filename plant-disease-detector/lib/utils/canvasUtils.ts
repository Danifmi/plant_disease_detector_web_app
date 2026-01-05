// Utilidades para manipulación de Canvas

import { AffectedArea } from '@/types/analysis';
import { DISEASE_COLORS } from '@/types/disease';
import { DiseaseType } from '@/types/analysis';

/**
 * Dibuja áreas afectadas sobre un canvas
 */
export function drawAffectedAreas(
  ctx: CanvasRenderingContext2D,
  areas: AffectedArea[],
  disease: DiseaseType,
  scale: number = 1
): void {
  const color = DISEASE_COLORS[disease];
  
  areas.forEach((area) => {
    const x = area.x * scale;
    const y = area.y * scale;
    const width = area.width * scale;
    const height = area.height * scale;

    // Color según severidad
    let alpha = 0.3;
    if (area.severity === 'medium') alpha = 0.5;
    if (area.severity === 'high') alpha = 0.7;

    // Dibujar rectángulo semi-transparente
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.fillRect(x, y, width, height);

    // Dibujar borde
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
  });
}

/**
 * Dibuja contornos de enfermedad
 */
export function drawContours(
  ctx: CanvasRenderingContext2D,
  contours: number[][],
  color: string = '#ef4444',
  lineWidth: number = 2
): void {
  if (contours.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  contours.forEach((contour) => {
    if (contour.length < 4) return;

    ctx.beginPath();
    ctx.moveTo(contour[0], contour[1]);

    for (let i = 2; i < contour.length; i += 2) {
      ctx.lineTo(contour[i], contour[i + 1]);
    }

    ctx.closePath();
    ctx.stroke();
  });
}

/**
 * Aplica overlay de color sobre el canvas
 */
export function applyColorOverlay(
  ctx: CanvasRenderingContext2D,
  mask: ImageData,
  color: string,
  alpha: number = 0.5
): void {
  const overlay = ctx.createImageData(mask.width, mask.height);
  const rgb = hexToRgb(color);

  for (let i = 0; i < mask.data.length; i += 4) {
    if (mask.data[i] > 0) { // Si el pixel está en la máscara
      overlay.data[i] = rgb.r;
      overlay.data[i + 1] = rgb.g;
      overlay.data[i + 2] = rgb.b;
      overlay.data[i + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(overlay, 0, 0);
}

/**
 * Crea un canvas desde una imagen
 */
export function createCanvasFromImage(
  img: HTMLImageElement,
  width?: number,
  height?: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width || img.width;
  canvas.height = height || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto del canvas');
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return { canvas, ctx };
}

/**
 * Obtiene ImageData de un canvas
 */
export function getImageData(
  canvas: HTMLCanvasElement
): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto del canvas');
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Dibuja una barra de progreso circular
 */
export function drawCircularProgress(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  progress: number,
  color: string = '#22c55e',
  lineWidth: number = 8
): void {
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (2 * Math.PI * progress);

  // Fondo
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Progreso
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// Funciones auxiliares
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
