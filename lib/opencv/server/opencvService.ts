/**
 * OpenCV Service - Server-side processing using opencv-wasm
 * Optimizado para segmentación de enfermedades en hojas de manzano
 */

// opencv-wasm se carga síncronamente en Node.js
let cv: any = null;
let cvTranslateError: any = null;

// Lazy loading para evitar problemas en el cliente
async function getOpenCV() {
  if (cv) return { cv, cvTranslateError };
  
  const opencvWasm = await import('opencv-wasm');
  cv = opencvWasm.cv;
  cvTranslateError = opencvWasm.cvTranslateError;
  
  return { cv, cvTranslateError };
}

// Rangos de color HSV para detección de enfermedades
// H en OpenCV va de 0 a 180, S y V de 0 a 255
const DISEASE_COLOR_RANGES = {
  // Hojas saludables: verdes amplios, permitiendo variaciones de iluminación
  healthy: {
    lower: [30, 20, 20],
    upper: [90, 255, 255]
  },
  // Roya: tonos naranjas/amarillos más saturados y con buena iluminación
  rust_orange: {
    lower: [5, 80, 80],
    upper: [25, 255, 255]
  },
  rust_yellow: {
    lower: [20, 40, 80],
    upper: [40, 255, 255]
  },
  // Sarna: zonas muy oscuras y marrones
  scab_dark: {
    lower: [0, 0, 0],
    upper: [180, 255, 60]
  },
  scab_brown: {
    lower: [5, 40, 20],
    upper: [30, 255, 160]
  }
};

export interface SegmentationResult {
  success: boolean;
  masks: {
    rust: string | null;      // Base64 de la máscara
    scab: string | null;
    healthy: string | null;
  };
  overlayImage: string | null; // Imagen con contornos superpuestos
  percentages: {
    healthy: number;
    rust: number;
    scab: number;
    background: number;
  };
  contours: {
    rust: ContourData[];
    scab: ContourData[];
  };
  processingTime: number;
  error?: string;
}

export interface ContourData {
  area: number;
  centroid: { x: number; y: number };
  boundingBox: { x: number; y: number; width: number; height: number };
  severity: 'low' | 'medium' | 'high';
}

/**
 * Procesa una imagen y segmenta las áreas afectadas
 * @param imageBuffer - Buffer de la imagen (PNG/JPEG)
 * @returns Resultado de la segmentación con máscaras y contornos
 */
export async function segmentDiseaseAreas(
  imageBuffer: Buffer
): Promise<SegmentationResult> {
  const startTime = Date.now();
  const { cv, cvTranslateError } = await getOpenCV();
  
  // Variables para cleanup
  let src: any = null;
  let hsv: any = null;
  let rustMask: any = null;
  let scabMask: any = null;
  let healthyMask: any = null;
  let overlay: any = null;
  
  try {
    // Decodificar imagen desde buffer
    const imageArray = new Uint8Array(imageBuffer);
    const mat = cv.matFromArray(
      imageArray.length,
      1,
      cv.CV_8UC1,
      Array.from(imageArray)
    );
    src = cv.imdecode(mat, cv.IMREAD_COLOR);
    mat.delete();
    
    if (src.empty()) {
      throw new Error('No se pudo decodificar la imagen');
    }
    
    // Redimensionar si es muy grande (para rendimiento)
    const maxDim = 800;
    const scale = Math.min(maxDim / src.cols, maxDim / src.rows, 1);
    if (scale < 1) {
      const newSize = new cv.Size(
        Math.round(src.cols * scale),
        Math.round(src.rows * scale)
      );
      cv.resize(src, src, newSize, 0, 0, cv.INTER_AREA);
    }
    
    // Convertir a HSV
    hsv = new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_BGR2HSV);
    
    // Detectar cada tipo de enfermedad
    rustMask = detectRust(cv, hsv);
    scabMask = detectScab(cv, hsv);
    healthyMask = detectHealthy(cv, hsv);
    
    // Calcular porcentajes
    const totalPixels = src.rows * src.cols;
    const rustPixels = cv.countNonZero(rustMask);
    const scabPixels = cv.countNonZero(scabMask);
    const healthyPixels = cv.countNonZero(healthyMask);
    const backgroundPixels = totalPixels - rustPixels - scabPixels - healthyPixels;
    
    const percentages = {
      healthy: (healthyPixels / totalPixels) * 100,
      rust: (rustPixels / totalPixels) * 100,
      scab: (scabPixels / totalPixels) * 100,
      background: Math.max(0, (backgroundPixels / totalPixels) * 100)
    };
    
    // Encontrar contornos
    const rustContours = findAndAnalyzeContours(cv, rustMask, totalPixels);
    const scabContours = findAndAnalyzeContours(cv, scabMask, totalPixels);
    
    // Crear imagen con overlay de contornos
    overlay = src.clone();
    drawContours(cv, overlay, rustMask, [0, 165, 255]); // Naranja para rust
    drawContours(cv, overlay, scabMask, [139, 69, 19]);  // Marrón para scab
    
    // Convertir máscaras y overlay a Base64
    const rustMaskBase64 = matToBase64(cv, rustMask);
    const scabMaskBase64 = matToBase64(cv, scabMask);
    const healthyMaskBase64 = matToBase64(cv, healthyMask);
    const overlayBase64 = matToBase64(cv, overlay, true);
    
    return {
      success: true,
      masks: {
        rust: rustMaskBase64,
        scab: scabMaskBase64,
        healthy: healthyMaskBase64
      },
      overlayImage: overlayBase64,
      percentages,
      contours: {
        rust: rustContours,
        scab: scabContours
      },
      processingTime: Date.now() - startTime
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? cvTranslateError(cv, error) || error.message 
      : 'Error desconocido';
    
    return {
      success: false,
      masks: { rust: null, scab: null, healthy: null },
      overlayImage: null,
      percentages: { healthy: 0, rust: 0, scab: 0, background: 100 },
      contours: { rust: [], scab: [] },
      processingTime: Date.now() - startTime,
      error: errorMessage
    };
    
  } finally {
    // Cleanup - MUY IMPORTANTE para evitar memory leaks
    if (src) src.delete();
    if (hsv) hsv.delete();
    if (rustMask) rustMask.delete();
    if (scabMask) scabMask.delete();
    if (healthyMask) healthyMask.delete();
    if (overlay) overlay.delete();
  }
}

/**
 * Detecta áreas con roya (rust) - tonos naranjas/amarillos
 */
function detectRust(cv: any, hsvImg: any): any {
  const maskOrange = new cv.Mat();
  const maskYellow = new cv.Mat();
  const result = new cv.Mat();
  
  try {
    // Rango naranja
    const lowerOrange = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.rust_orange.lower);
    const upperOrange = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.rust_orange.upper);
    cv.inRange(hsvImg, lowerOrange, upperOrange, maskOrange);
    lowerOrange.delete();
    upperOrange.delete();
    
    // Rango amarillo
    const lowerYellow = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.rust_yellow.lower);
    const upperYellow = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.rust_yellow.upper);
    cv.inRange(hsvImg, lowerYellow, upperYellow, maskYellow);
    lowerYellow.delete();
    upperYellow.delete();
    
    // Combinar máscaras
    cv.bitwise_or(maskOrange, maskYellow, result);
    
    // Operaciones morfológicas para limpiar ruido
    const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
    cv.morphologyEx(result, result, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(result, result, cv.MORPH_CLOSE, kernel);
    kernel.delete();
    
    return result;
    
  } finally {
    maskOrange.delete();
    maskYellow.delete();
  }
}

/**
 * Detecta áreas con sarna (scab) - tonos oscuros/marrones
 */
function detectScab(cv: any, hsvImg: any): any {
  const maskDark = new cv.Mat();
  const maskBrown = new cv.Mat();
  const result = new cv.Mat();
  
  try {
    // Rango oscuro
    const lowerDark = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.scab_dark.lower);
    const upperDark = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.scab_dark.upper);
    cv.inRange(hsvImg, lowerDark, upperDark, maskDark);
    lowerDark.delete();
    upperDark.delete();
    
    // Rango marrón
    const lowerBrown = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.scab_brown.lower);
    const upperBrown = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.scab_brown.upper);
    cv.inRange(hsvImg, lowerBrown, upperBrown, maskBrown);
    lowerBrown.delete();
    upperBrown.delete();
    
    // Combinar
    cv.bitwise_or(maskDark, maskBrown, result);
    
    // Limpiar ruido
    const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
    cv.morphologyEx(result, result, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(result, result, cv.MORPH_CLOSE, kernel);
    kernel.delete();
    
    return result;
    
  } finally {
    maskDark.delete();
    maskBrown.delete();
  }
}

/**
 * Detecta áreas saludables - tonos verdes
 */
function detectHealthy(cv: any, hsvImg: any): any {
  const result = new cv.Mat();
  
  const lower = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.healthy.lower);
  const upper = cv.matFromArray(1, 3, cv.CV_8UC1, DISEASE_COLOR_RANGES.healthy.upper);
  
  cv.inRange(hsvImg, lower, upper, result);
  
  lower.delete();
  upper.delete();
  
  // Limpiar ruido
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
  cv.morphologyEx(result, result, cv.MORPH_CLOSE, kernel);
  kernel.delete();
  
  return result;
}

/**
 * Encuentra contornos y los analiza
 */
function findAndAnalyzeContours(cv: any, mask: any, totalPixels: number): ContourData[] {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const results: ContourData[] = [];
  
  try {
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      // Filtrar contornos muy pequeños (ruido)
      if (area < 100) continue;
      
      // Calcular momentos para el centroide
      const moments = cv.moments(contour);
      const cx = moments.m10 / moments.m00;
      const cy = moments.m01 / moments.m00;
      
      // Bounding box
      const rect = cv.boundingRect(contour);
      
      // Determinar severidad basada en el área relativa
      const areaPercentage = (area / totalPixels) * 100;
      let severity: 'low' | 'medium' | 'high';
      if (areaPercentage < 2) {
        severity = 'low';
      } else if (areaPercentage < 5) {
        severity = 'medium';
      } else {
        severity = 'high';
      }
      
      results.push({
        area,
        centroid: { x: cx, y: cy },
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        },
        severity
      });
    }
    
    return results;
    
  } finally {
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Dibuja contornos sobre la imagen
 */
function drawContours(cv: any, image: any, mask: any, color: number[]): void {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  
  try {
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    const scalarColor = new cv.Scalar(color[0], color[1], color[2], 255);
    cv.drawContours(image, contours, -1, scalarColor, 2);
    
  } finally {
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Convierte un Mat a Base64
 */
function matToBase64(cv: any, mat: any, isColor: boolean = false): string | null {
  try {
    const params = new cv.IntVector();
    params.push_back(cv.IMWRITE_PNG_COMPRESSION);
    params.push_back(9);
    
    const encoded = new cv.Mat();
    
    if (isColor) {
      cv.imencode('.png', mat, encoded, params);
    } else {
      // Para máscaras en escala de grises
      cv.imencode('.png', mat, encoded, params);
    }
    
    const data = encoded.data;
    const base64 = Buffer.from(data).toString('base64');
    
    encoded.delete();
    params.delete();
    
    return `data:image/png;base64,${base64}`;
    
  } catch {
    return null;
  }
}