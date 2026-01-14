// lib/ml/predict.ts
import * as tf from '@tensorflow/tfjs';
import { loadModel } from './model-loader';
import { preprocessImage, imageDataToCanvas, fileToCanvas, centerCrop } from './preprocess';
import { DiseaseType } from '@/types/analysis';

// Interfaz de resultado de predicción
export interface PredictionResult {
  disease: DiseaseType;
  classLabel: string;
  confidence: number;
  probabilities: {
    healthy: number;
    multiple_diseases: number;
    rust: number;
    scab: number;
  };
  executionTime: number;
}

const CLASS_LABELS: Record<string, string> = {
  healthy: 'Saludable',
  multiple_diseases: 'Múltiples Enfermedades',
  rust: 'Roya',
  scab: 'Sarna'
};

export async function predictDisease(
  imageSource: HTMLImageElement | HTMLCanvasElement | string | Blob
): Promise<PredictionResult> {
  const startTime = performance.now();

  try {
    const model = await loadModel();

    // 1. Convertir a Canvas utilizable
    let canvas: HTMLCanvasElement;
    if (typeof imageSource === 'string') {
      canvas = await imageDataToCanvas(imageSource);
    } else if (imageSource instanceof Blob) {
      canvas = await fileToCanvas(imageSource);
    } else {
      // Clonar canvas/imagen para no alterar el original
      const tempCanvas = document.createElement('canvas');
      const src = imageSource as HTMLImageElement | HTMLCanvasElement;
      tempCanvas.width = src.width;
      tempCanvas.height = src.height;
      tempCanvas.getContext('2d')?.drawImage(src, 0, 0);
      canvas = tempCanvas;
    }

    // 2. Recorte cuadrado para el modelo (usando tu fix anterior)
    const croppedCanvas = centerCrop(canvas);

    // 3. Preprocesamiento e Inferencia
    const inputTensor = await preprocessImage(croppedCanvas);
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const probabilities = await predictions.data();

    inputTensor.dispose();
    predictions.dispose();

    // 4. Determinar clase ganadora
    const classes = ['healthy', 'multiple_diseases', 'rust', 'scab'];
    let maxIndex = 0;
    let maxProb = probabilities[0];

    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    const predictedClass = classes[maxIndex] as DiseaseType;

    const executionTime = performance.now() - startTime;

    return {
      disease: predictedClass,
      classLabel: CLASS_LABELS[predictedClass],
      confidence: maxProb,
      probabilities: {
        healthy: probabilities[0],
        multiple_diseases: probabilities[1],
        rust: probabilities[2],
        scab: probabilities[3]
      },
      executionTime
    };

  } catch (error) {
    console.error('Error en predicción:', error);
    throw error;
  }
}

// ... Resto de funciones auxiliares (predictBatch, etc.) se mantienen igual ...
export async function predictBatch(
  imageSources: (HTMLImageElement | HTMLCanvasElement | string)[]
): Promise<PredictionResult[]> {
  const results: PredictionResult[] = [];
  const batchSize = 1; // Bajamos a 1 para evitar saturar con OpenCV + TF
  
  for (let i = 0; i < imageSources.length; i += batchSize) {
    const batch = imageSources.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(source => predictDisease(source))
    );
    results.push(...batchResults);
  }
  return results;
}

export const predict = predictDisease;