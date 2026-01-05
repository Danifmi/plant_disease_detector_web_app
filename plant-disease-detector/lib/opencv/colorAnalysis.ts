import { loadOpenCV } from './loader';

// Rangos de color en HSV para cada tipo de enfermedad
const DISEASE_COLOR_RANGES = {
  healthy: {
    lower: [25, 40, 40],
    upper: [85, 255, 255]
  },
  rust_orange: {
    lower: [5, 100, 100],
    upper: [25, 255, 255]
  },
  rust_yellow: {
    lower: [20, 100, 100],
    upper: [35, 255, 255]
  },
  scab_dark: {
    lower: [0, 0, 0],
    upper: [180, 255, 80]
  },
  scab_brown: {
    lower: [0, 50, 20],
    upper: [20, 200, 100]
  }
};

export type DiagnosisType = 'healthy' | 'rust' | 'scab' | 'multiple_diseases';

export interface AnalysisResult {
  diagnosis: DiagnosisType;
  confidence: number;
  percentages: {
    healthy: number;
    rust: number;
    scab: number;
  };
  contours: {
    rust: number[][];
    scab: number[][];
  };
}

export async function analyzeLeafImage(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<AnalysisResult> {
  const cv = await loadOpenCV();

  // Crear Mat desde imagen
  const src = cv.imread(imageElement);
  
  // Convertir a HSV
  const rgb = new cv.Mat();
  cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
  
  const hsv = new cv.Mat();
  cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV);

  // Detectar cada tipo de enfermedad
  const rustMask = detectRust(cv, hsv);
  const scabMask = detectScab(cv, hsv);
  const healthyMask = detectHealthy(cv, hsv);

  // Calcular porcentajes
  const totalPixels = src.rows * src.cols;
  const rustPixels = cv.countNonZero(rustMask);
  const scabPixels = cv.countNonZero(scabMask);
  const healthyPixels = cv.countNonZero(healthyMask);

  const percentages = {
    rust: (rustPixels / totalPixels) * 100,
    scab: (scabPixels / totalPixels) * 100,
    healthy: (healthyPixels / totalPixels) * 100
  };

  // Encontrar contornos
  const rustContours = findContours(cv, rustMask);
  const scabContours = findContours(cv, scabMask);

  // Determinar diagnóstico
  const { diagnosis, confidence } = determineDiagnosis(percentages);

  // Limpiar memoria
  src.delete();
  rgb.delete();
  hsv.delete();
  rustMask.delete();
  scabMask.delete();
  healthyMask.delete();

  return {
    diagnosis,
    confidence,
    percentages,
    contours: {
      rust: rustContours,
      scab: scabContours
    }
  };
}

function detectRust(cv: any, hsv: any): any {
  const maskOrange = new cv.Mat();
  const maskYellow = new cv.Mat();
  const result = new cv.Mat();

  // Crear escalares para los rangos
  const lowerOrange = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.rust_orange.lower);
  const upperOrange = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.rust_orange.upper);
  const lowerYellow = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.rust_yellow.lower);
  const upperYellow = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.rust_yellow.upper);

  // Detectar naranja
  cv.inRange(hsv, lowerOrange, upperOrange, maskOrange);

  // Detectar amarillo  
  cv.inRange(hsv, lowerYellow, upperYellow, maskYellow);

  // Combinar
  cv.bitwise_or(maskOrange, maskYellow, result);

  // Limpiar con morfología
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
  cv.morphologyEx(result, result, cv.MORPH_OPEN, kernel);
  cv.morphologyEx(result, result, cv.MORPH_CLOSE, kernel);

  // Limpiar
  maskOrange.delete();
  maskYellow.delete();
  lowerOrange.delete();
  upperOrange.delete();
  lowerYellow.delete();
  upperYellow.delete();
  kernel.delete();

  return result;
}

function detectScab(cv: any, hsv: any): any {
  const maskDark = new cv.Mat();
  const maskBrown = new cv.Mat();
  const result = new cv.Mat();

  const lowerDark = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.scab_dark.lower);
  const upperDark = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.scab_dark.upper);
  const lowerBrown = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.scab_brown.lower);
  const upperBrown = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.scab_brown.upper);

  cv.inRange(hsv, lowerDark, upperDark, maskDark);
  cv.inRange(hsv, lowerBrown, upperBrown, maskBrown);

  cv.bitwise_or(maskDark, maskBrown, result);

  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
  cv.morphologyEx(result, result, cv.MORPH_OPEN, kernel);
  cv.morphologyEx(result, result, cv.MORPH_CLOSE, kernel);

  maskDark.delete();
  maskBrown.delete();
  lowerDark.delete();
  upperDark.delete();
  lowerBrown.delete();
  upperBrown.delete();
  kernel.delete();

  return result;
}

function detectHealthy(cv: any, hsv: any): any {
  const result = new cv.Mat();

  const lower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.healthy.lower);
  const upper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), DISEASE_COLOR_RANGES.healthy.upper);

  cv.inRange(hsv, lower, upper, result);

  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
  cv.morphologyEx(result, result, cv.MORPH_CLOSE, kernel);

  lower.delete();
  upper.delete();
  kernel.delete();

  return result;
}

function findContours(cv: any, mask: any): number[][] {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const result: number[][] = [];
  
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    
    // Solo incluir contornos significativos (área > 100 píxeles)
    if (area > 100) {
      const points: number[] = [];
      for (let j = 0; j < contour.rows; j++) {
        points.push(contour.data32S[j * 2], contour.data32S[j * 2 + 1]);
      }
      result.push(points);
    }
  }

  contours.delete();
  hierarchy.delete();

  return result;
}

function determineDiagnosis(percentages: { rust: number; scab: number; healthy: number }): {
  diagnosis: DiagnosisType;
  confidence: number;
} {
  const THRESHOLD = 1.0; // 1% mínimo para considerar enfermedad

  const hasRust = percentages.rust > THRESHOLD;
  const hasScab = percentages.scab > THRESHOLD;

  if (hasRust && hasScab) {
    const totalDisease = percentages.rust + percentages.scab;
    return {
      diagnosis: 'multiple_diseases',
      confidence: Math.min(totalDisease / 20, 1) // Normalizar a 0-1
    };
  } else if (hasRust) {
    return {
      diagnosis: 'rust',
      confidence: Math.min(percentages.rust / 10, 1)
    };
  } else if (hasScab) {
    return {
      diagnosis: 'scab',
      confidence: Math.min(percentages.scab / 10, 1)
    };
  } else {
    return {
      diagnosis: 'healthy',
      confidence: Math.min(percentages.healthy / 50, 1)
    };
  }
}
