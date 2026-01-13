// lib/ml/model-loader.ts
// Cliente-Side Model Loader
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
      console.log('🔄 Cargando modelo TensorFlow.js...');
      
      // Configurar backend WebGL para mejor rendimiento
      await tf.setBackend('webgl');
      await tf.ready();

      // Cargar el modelo desde /public/models/
      const MODEL_URL = '/models/tfjs_model/model.json';
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

export async function loadMetadata(): Promise<ModelMetadata> {
  try {
    const response = await fetch('/models/tfjs_model/metadata.json');
    return await response.json();
  } catch (error) {
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

export function isModelLoaded(): boolean {
  return model !== null;
}

export function unloadModel(): void {
  if (model) {
    model.dispose();
    model = null;
    modelLoading = null;
    console.log('🗑️ Modelo descargado de memoria');
  }
}

// Obtener información de memoria del modelo
export function getMemoryInfo(): { numBytes: number; numTensors: number } | null {
  if (!model) return null;
  
  return {
    numBytes: tf.memory().numBytes,
    numTensors: tf.memory().numTensors
  };
}
