// Función principal de predicción

import * as tf from '@tensorflow/tfjs';
import { getModel } from './model';
import { preprocessImage } from './preprocess';
import { PredictionResult, DiseaseType } from '@/types/analysis';
import { MODEL_CONFIG } from '@/lib/constants/config';

/**
 * Realiza una predicción sobre una imagen
 */
export async function predict(
  source: HTMLImageElement | HTMLCanvasElement | ImageData | string | File | Blob
): Promise<PredictionResult> {
  const model = await getModel();

  // Preprocesar imagen
  const tensor = await preprocessImage(source);

  try {
    // Realizar predicción
    const predictions = model.predict(tensor) as tf.Tensor;
    const probabilities = await predictions.data();

    // Obtener clase con mayor probabilidad
    const maxIndex = probabilities.indexOf(Math.max(...Array.from(probabilities)));
    const disease = MODEL_CONFIG.classes[maxIndex] as DiseaseType;
    const confidence = probabilities[maxIndex];

    // Construir resultado
    const result: PredictionResult = {
      disease,
      confidence,
      probabilities: {
        healthy: probabilities[0],
        multiple_diseases: probabilities[1],
        rust: probabilities[2],
        scab: probabilities[3]
      }
    };

    // Limpiar tensores
    predictions.dispose();

    return result;
  } finally {
    tensor.dispose();
  }
}

/**
 * Predicción con Test Time Augmentation para mayor precisión
 */
export async function predictWithTTA(
  source: HTMLImageElement | HTMLCanvasElement | ImageData | string | File | Blob
): Promise<PredictionResult> {
  const model = await getModel();
  const tensor = await preprocessImage(source);

  try {
    // Original
    const pred1 = model.predict(tensor) as tf.Tensor;

    // Flipped horizontalmente usando tidy para manejo de memoria
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flipped = tf.tidy(() => {
      const squeezed = tf.squeeze(tensor, [0]);
      // flipLeftRight acepta Tensor3D o Tensor4D
      const flippedImg = tf.image.flipLeftRight(squeezed as unknown as tf.Tensor4D);
      return tf.expandDims(flippedImg, 0);
    }) as tf.Tensor4D;
    const pred2 = model.predict(flipped) as tf.Tensor;

    // Promediar predicciones
    const avgPred = tf.tidy(() => {
      return pred1.add(pred2).div(2);
    });

    const probabilities = await avgPred.data();

    const maxIndex = probabilities.indexOf(Math.max(...Array.from(probabilities)));
    const disease = MODEL_CONFIG.classes[maxIndex] as DiseaseType;
    const confidence = probabilities[maxIndex];

    const result: PredictionResult = {
      disease,
      confidence,
      probabilities: {
        healthy: probabilities[0],
        multiple_diseases: probabilities[1],
        rust: probabilities[2],
        scab: probabilities[3]
      }
    };

    // Limpiar
    pred1.dispose();
    pred2.dispose();
    flipped.dispose();
    avgPred.dispose();

    return result;
  } finally {
    tensor.dispose();
  }
}

/**
 * Predicción batch para múltiples imágenes
 */
export async function predictBatch(
  sources: Array<HTMLImageElement | HTMLCanvasElement | ImageData | string | File | Blob>
): Promise<PredictionResult[]> {
  const model = await getModel();
  const results: PredictionResult[] = [];

  for (const source of sources) {
    const result = await predict(source);
    results.push(result);
  }

  return results;
}

/**
 * Obtiene las probabilidades formateadas como porcentaje
 */
export function formatProbabilities(probs: PredictionResult['probabilities']): {
  label: string;
  value: number;
  percentage: string;
}[] {
  const labels: Record<string, string> = {
    healthy: 'Saludable',
    multiple_diseases: 'Múltiples Enfermedades',
    rust: 'Roya',
    scab: 'Sarna'
  };

  return Object.entries(probs)
    .map(([key, value]) => ({
      label: labels[key] || key,
      value,
      percentage: `${(value * 100).toFixed(1)}%`
    }))
    .sort((a, b) => b.value - a.value);
}
