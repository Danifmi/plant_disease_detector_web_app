// Carga y gestión del modelo TensorFlow.js

import * as tf from '@tensorflow/tfjs';
import { MODEL_CONFIG } from '@/lib/constants/config';

let model: tf.LayersModel | null = null;
let isLoading = false;
let loadPromise: Promise<tf.LayersModel> | null = null;

/**
 * Carga el modelo TensorFlow.js
 */
export async function loadModel(): Promise<tf.LayersModel> {
  // Si ya está cargado, retornarlo
  if (model) return model;

  // Si ya está cargando, esperar
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = (async () => {
    try {
      // Configurar backend WebGL para mejor rendimiento
      await tf.setBackend('webgl');
      await tf.ready();

      console.log('Cargando modelo desde:', MODEL_CONFIG.modelPath);

      // Cargar modelo
      model = await tf.loadLayersModel(MODEL_CONFIG.modelPath);

      // Warm up - hacer una predicción vacía para inicializar
      const warmupInput = tf.zeros([1, MODEL_CONFIG.inputSize, MODEL_CONFIG.inputSize, 3]);
      await model.predict(warmupInput);
      warmupInput.dispose();

      console.log('Modelo cargado exitosamente');
      return model;
    } catch (error) {
      console.error('Error cargando modelo:', error);
      throw new Error('No se pudo cargar el modelo de detección');
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Verifica si el modelo está cargado
 */
export function isModelLoaded(): boolean {
  return model !== null;
}

/**
 * Libera recursos del modelo
 */
export function disposeModel(): void {
  if (model) {
    model.dispose();
    model = null;
  }
  loadPromise = null;
}

/**
 * Obtiene información del modelo
 */
export function getModelInfo(): {
  loaded: boolean;
  inputShape: number[] | null;
  outputShape: number[] | null;
} {
  if (!model) {
    return { loaded: false, inputShape: null, outputShape: null };
  }

  const inputShape = model.inputs[0].shape as number[];
  const outputShape = model.outputs[0].shape as number[];

  return { loaded: true, inputShape, outputShape };
}

/**
 * Obtiene el modelo cargado (o lo carga si no está)
 */
export async function getModel(): Promise<tf.LayersModel> {
  if (model) return model;
  return loadModel();
}
