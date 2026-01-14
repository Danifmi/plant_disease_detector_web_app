// lib/opencv/segmentation.ts
import { ensureOpenCVLoaded } from './loader';
import { AffectedArea } from '@/types/analysis';
import { COLOR_RANGES } from './colorAnalysis';

export interface SegmentationResult {
  areas: AffectedArea[];
  processedImage: string; // Base64 de la imagen con contornos dibujados
  totalAffectedPercentage: number;
}

/**
 * Segmenta y dibuja las áreas afectadas sobre la imagen original
 */
export async function segmentDiseaseAreas(
  imageSource: HTMLImageElement | HTMLCanvasElement | string,
  diseaseType: 'rust' | 'scab' | 'multiple_diseases',
  width: number,
  height: number
): Promise<SegmentationResult | null> {
  try {
    // 1. ESPERAR a que cargue OpenCV (Solución al error "OpenCV no disponible")
    const cv = await ensureOpenCVLoaded();
    
    // 2. Preparar imagen
    let src = new cv.Mat();
    
    // Convertir input a Mat de OpenCV
    if (typeof imageSource === 'string') {
       // Si es base64, necesitamos cargarla primero (asumimos que ya viene como elemento o canvas en la mayoría de casos)
       // Para simplificar integración, si viene string asumimos que predict.ts lo maneja, 
       // pero aquí implementamos carga básica si es necesario.
       // Por eficiencia, predict.ts debería pasar el canvas.
       throw new Error("Pasa un HTMLCanvasElement para mayor eficiencia");
    } else {
       // Leer desde Canvas o Imagen
       src = cv.imread(imageSource);
    }
    
    // Redimensionar si es necesario para consistencia (opcional, aquí usamos el tamaño original)
    const dsize = new cv.Size(width, height);
    cv.resize(src, src, dsize, 0, 0, cv.INTER_AREA);

    // 3. Convertir a HSV
    const hsv = new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB); // Eliminar alfa si existe
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    // 4. Crear máscara según enfermedad
    let mask = new cv.Mat();
    
    if (diseaseType === 'multiple_diseases') {
      // Combinar máscaras de Rust y Scab
      const mask1 = createMask(cv, hsv, COLOR_RANGES.rust);
      const mask2 = createMask(cv, hsv, COLOR_RANGES.scab);
      cv.bitwise_or(mask1, mask2, mask);
      mask1.delete(); mask2.delete();
    } else {
      // Usar rango específico
      const range = COLOR_RANGES[diseaseType] || COLOR_RANGES.rust; // Fallback
      mask = createMask(cv, hsv, range);
    }

    // 5. Limpiar ruido (Morfología)
    const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
    cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);
    
    // 6. Encontrar contornos
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // 7. Procesar áreas y DIBUJAR resultados
    const areas: AffectedArea[] = [];
    const minArea = (width * height) * 0.001; // Filtrar ruido muy pequeño (0.1% de la imagen)

    // Clonar imagen original para dibujar encima
    const outputMat = src.clone();
    
    // Color del contorno (Rojo: R=255, G=0, B=0, A=255)
    const contourColor = new cv.Scalar(255, 0, 0, 255); 
    const lineWidth = 2;

    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);

      if (area > minArea) {
        const rect = cv.boundingRect(contour);
        
        // Guardar metadata del área
        areas.push({
          id: `area_${i}`,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          confidence: 0.9, // Estimado
          severity: calculateSeverity(area, width * height)
        });

        // DIBUJAR contorno en la imagen
        cv.drawContours(outputMat, contours, i, contourColor, lineWidth);
      }
    }

    // 8. Convertir resultado a Base64 para mostrar en frontend
    const outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    cv.imshow(outCanvas, outputMat);
    const processedImageBase64 = outCanvas.toDataURL('image/jpeg', 0.9);

    // 9. Calcular porcentaje total
    const totalPercentage = areas.reduce((acc, a) => acc + (a.width * a.height), 0) / (width * height);

    // Limpiar memoria OpenCV
    src.delete(); hsv.delete(); mask.delete(); kernel.delete();
    contours.delete(); hierarchy.delete(); outputMat.delete();

    return {
      areas,
      processedImage: processedImageBase64,
      totalAffectedPercentage: totalPercentage
    };

  } catch (error) {
    console.error('Error en segmentación:', error);
    return null;
  }
}

function createMask(cv: any, hsv: any, range: { lower: number[], upper: number[] }) {
  const mask = new cv.Mat();
  const low = new cv.matFromArray(1, 3, cv.CV_64F, range.lower);
  const high = new cv.matFromArray(1, 3, cv.CV_64F, range.upper);
  
  // Nota: inRange en JS suele requerir enteros o matrices del tipo correcto
  // Convertimos los arrays a Mat para mayor compatibilidad
  const lowSc = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), range.lower); 
  const highSc = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), range.upper);

  cv.inRange(hsv, lowSc, highSc, mask);
  
  low.delete(); high.delete(); lowSc.delete(); highSc.delete();
  return mask;
}

function calculateSeverity(areaPixels: number, totalPixels: number): 'low' | 'medium' | 'high' {
  const ratio = areaPixels / totalPixels;
  if (ratio > 0.10) return 'high';
  if (ratio > 0.03) return 'medium';
  return 'low';
}