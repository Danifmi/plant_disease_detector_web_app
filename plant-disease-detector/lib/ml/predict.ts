// lib/ml/predict.ts
import * as tf from '@tensorflow/tfjs';
import { loadModel, loadMetadata } from './model-loader';
import { preprocessImage, imageDataToCanvas, fileToCanvas } from './preprocess';

export interface PredictionResult {
  class: string;
  classLabel: string; // Etiqueta en español
  confidence: number;
  probabilities: {
    healthy: number;
    multiple_diseases: number;
    rust: number;
    scab: number;
  };
  executionTime: number; // en ms
}

const CLASS_LABELS: Record<string, string> = {
  healthy: 'Saludable',
  multiple_diseases: 'Múltiples Enfermedades',
  rust: 'Roya',
  scab: 'Sarna'
};

/**
 * Predice la enfermedad en una hoja de planta
 */
export async function predictDisease(
  imageSource: HTMLImageElement | HTMLCanvasElement | string | File
): Promise<PredictionResult> {
  const startTime = performance.now();

  try {
    // 1. Cargar modelo si no está cargado
    const model = await loadModel();

    // 2. Preprocesar imagen
    let canvas: HTMLCanvasElement;
    
    if (typeof imageSource === 'string') {
      canvas = await imageDataToCanvas(imageSource);
    } else if (imageSource instanceof File) {
      canvas = await fileToCanvas(imageSource);
    } else {
      canvas = imageSource instanceof HTMLCanvasElement 
        ? imageSource 
        : await imageElementToCanvas(imageSource);
    }

    // 3. Convertir a tensor
    const inputTensor = await preprocessImage(canvas);

    // 4. Realizar predicción
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const probabilities = await predictions.data();

    // 5. Limpiar tensores
    inputTensor.dispose();
    predictions.dispose();

    // 6. Procesar resultados
    const classes = ['healthy', 'multiple_diseases', 'rust', 'scab'];
    let maxIndex = 0;
    let maxProb = probabilities[0];

    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    const predictedClass = classes[maxIndex];
    const executionTime = performance.now() - startTime;

    return {
      class: predictedClass,
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

/**
 * Predicción por lotes (múltiples imágenes)
 */
export async function predictBatch(
  imageSources: (HTMLImageElement | HTMLCanvasElement | string)[]
): Promise<PredictionResult[]> {
  const model = await loadModel();
  const results: PredictionResult[] = [];

  // Procesar en lotes de 4 para no saturar memoria
  const batchSize = 4;
  
  for (let i = 0; i < imageSources.length; i += batchSize) {
    const batch = imageSources.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(source => predictDisease(source))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Obtiene los top N resultados más probables
 */
export function getTopPredictions(
  result: PredictionResult,
  topN: number = 3
): Array<{ class: string; classLabel: string; probability: number }> {
  const entries = Object.entries(result.probabilities)
    .map(([cls, prob]) => ({
      class: cls,
      classLabel: CLASS_LABELS[cls],
      probability: prob
    }))
    .sort((a, b) => b.probability - a.probability);

  return entries.slice(0, topN);
}

// Helper: Convertir HTMLImageElement a Canvas
async function imageElementToCanvas(img: HTMLImageElement): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener contexto 2D');
  
  ctx.drawImage(img, 0, 0);
  return canvas;
}
