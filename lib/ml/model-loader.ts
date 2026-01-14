// lib/ml/model-loader.ts
// Cliente-Side Model Loader - Versión completa
import * as tf from '@tensorflow/tfjs';

let model: tf.GraphModel | null = null;
let modelLoading: Promise<tf.GraphModel> | null = null;

export interface ModelMetadata {
  model_name: string;
  version: string;
  architecture: string;
  classes: string[];
  input: {
    shape: number[];
    preprocessing: {
      resize: number[];
      normalize: string;
    };
  };
}

export interface ModelInfo {
  loaded: boolean;
  name: string;
  version: string;
  architecture: string;
  inputShape: number[];
  outputShape: number[];
  memoryUsage?: {
    numBytes: number;
    numTensors: number;
  };
}

/**
 * Carga el modelo desde Hugging Face
 */
export async function loadModel(): Promise<tf.GraphModel> {
  // Si el modelo ya está cargado, devolverlo
  if (model) {
    return model;
  }

  // Si ya está en proceso de carga, esperar a que termine
  if (modelLoading) {
    return modelLoading;
  }

  // Iniciar carga del modelo
  modelLoading = (async () => {
    try {
      console.log('🔄 Cargando modelo TensorFlow.js desde Hugging Face...');
      
      // Configurar backend WebGL para mejor rendimiento
      await tf.setBackend('webgl');
      await tf.ready();

      // Cargar el modelo desde Hugging Face
      const MODEL_URL = 'https://huggingface.co/fidalg0/plant-disease-classifier/resolve/main/model.json';
      model = await tf.loadGraphModel(MODEL_URL);

      console.log('✅ Modelo cargado exitosamente');
      console.log('📊 Input shape:', model.inputs[0].shape);
      console.log('📊 Output shape:', model.outputs[0].shape);

      // Warm-up: ejecutar una predicción dummy para inicializar
      const dummyInput = tf.zeros([1, 224, 224, 3]);
      const warmupResult = model.predict(dummyInput) as tf.Tensor;
      await warmupResult.data(); // Forzar ejecución
      
      // Limpiar
      dummyInput.dispose();
      warmupResult.dispose();

      console.log('✅ Warm-up completado');

      return model;
    } catch (error) {
      console.error('❌ Error cargando modelo:', error);
      modelLoading = null; // Reset para permitir reintentos
      throw error;
    }
  })();

  return modelLoading;
}

/**
 * Carga metadata del modelo desde Hugging Face
 */
export async function loadMetadata(): Promise<ModelMetadata> {
  try {
    const response = await fetch('https://huggingface.co/fidalg0/plant-disease-classifier/resolve/main/metadata.json');
    return await response.json();
  } catch {
    console.warn('⚠️ No se pudo cargar metadata, usando valores por defecto');
    return {
      model_name: 'PlantDiseaseClassifier',
      version: '1.0.0',
      architecture: 'EfficientNetB0',
      classes: ['healthy', 'multiple_diseases', 'rust', 'scab'],
      input: {
        shape: [1, 224, 224, 3],
        preprocessing: {
          resize: [224, 224],
          normalize: 'divide_by_255'
        }
      }
    };
  }
}

/**
 * Verifica si el modelo está cargado
 */
export function isModelLoaded(): boolean {
  return model !== null;
}

/**
 * Descarga el modelo de memoria
 * @alias unloadModel - nombre alternativo para compatibilidad
 */
export function disposeModel(): void {
  if (model) {
    model.dispose();
    model = null;
    modelLoading = null;
    console.log('🗑️ Modelo descargado de memoria');
  }
}

/**
 * Alias de disposeModel para compatibilidad
 */
export function unloadModel(): void {
  disposeModel();
}

/**
 * Obtiene información completa del modelo
 */
export function getModelInfo(): ModelInfo {
  if (!model) {
    return {
      loaded: false,
      name: 'PlantDiseaseClassifier',
      version: '1.0.0',
      architecture: 'EfficientNetB0',
      inputShape: [1, 224, 224, 3],
      outputShape: [1, 4]
    };
  }

  const memInfo = getMemoryInfo();
  
  return {
    loaded: true,
    name: 'PlantDiseaseClassifier',
    version: '1.0.0',
    architecture: 'EfficientNetB0',
    inputShape: model.inputs[0].shape || [1, 224, 224, 3],
    outputShape: model.outputs[0].shape || [1, 4],
    memoryUsage: memInfo ? {
      numBytes: memInfo.numBytes,
      numTensors: memInfo.numTensors
    } : undefined
  };
}

/**
 * Obtiene información de memoria del modelo
 */
export function getMemoryInfo(): { numBytes: number; numTensors: number } | null {
  if (!model) return null;
  
  return {
    numBytes: tf.memory().numBytes,
    numTensors: tf.memory().numTensors
  };
}

/**
 * Limpia todos los tensores huérfanos en memoria
 */
export function cleanupMemory(): void {
  const numTensorsBefore = tf.memory().numTensors;
  tf.dispose();
  const numTensorsAfter = tf.memory().numTensors;
  
  if (numTensorsBefore > numTensorsAfter) {
    console.log(`🧹 Limpiados ${numTensorsBefore - numTensorsAfter} tensores huérfanos`);
  }
}

/**
 * Obtiene el modelo cargado (para uso avanzado)
 * @returns El modelo o null si no está cargado
 */
export function getModel(): tf.GraphModel | null {
  return model;
}

/**
 * Pre-calienta el modelo ejecutando una predicción dummy
 */
export async function warmupModel(): Promise<void> {
  if (!model) {
    throw new Error('Modelo no cargado. Llama a loadModel() primero.');
  }

  console.log('🔥 Calentando modelo...');
  const dummyInput = tf.zeros([1, 224, 224, 3]);
  const warmupResult = model.predict(dummyInput) as tf.Tensor;
  await warmupResult.data();
  
  dummyInput.dispose();
  warmupResult.dispose();
  console.log('✅ Modelo calentado');
}

/**
 * Verifica si el backend de TensorFlow está listo
 */
export async function isBackendReady(): Promise<boolean> {
  try {
    await tf.ready();
    return true;
  } catch (error) {
    console.error('Backend no disponible:', error);
    return false;
  }
}

/**
 * Obtiene información del backend actual
 */
export function getBackendInfo(): {
  name: string;
  available: boolean;
} {
  return {
    name: tf.getBackend(),
    available: tf.getBackend() !== undefined
  };
}