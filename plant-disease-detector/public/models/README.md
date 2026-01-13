# Plant Disease Detection Model

Este directorio debe contener los archivos del modelo TensorFlow.js para la detección de enfermedades en plantas.

## Archivos Requeridos

1. **model.json** - Archivo de configuración del modelo
2. **group1-shard1of1.bin** (o múltiples shards) - Pesos del modelo

## Cómo Generar el Modelo

### Opción 1: Convertir desde Keras/TensorFlow

```python
import tensorflowjs as tfjs

# Si tienes un modelo Keras (.h5)
model = tf.keras.models.load_model('plant_disease_model.h5')
tfjs.converters.save_keras_model(model, 'public/models/')

# Si tienes un SavedModel
tfjs.converters.convert_tf_saved_model(
    'saved_model_dir/',
    'public/models/'
)
```

### Opción 2: Usar el Modelo Pre-entrenado del Proyecto

El notebook de Jupyter en el proyecto incluye código para entrenar el modelo con el dataset Plant Pathology 2020. Una vez entrenado:

1. Guarda el modelo en formato Keras:
```python
model.save('plant_disease_model.h5')
```

2. Convierte a TensorFlow.js:
```bash
pip install tensorflowjs
tensorflowjs_converter --input_format keras plant_disease_model.h5 public/models/
```

## Estructura del Modelo

- **Input**: Imagen RGB de 224x224 píxeles
- **Output**: 4 clases con probabilidades:
  - `healthy` - Hoja sana
  - `rust` - Roya
  - `scab` - Sarna
  - `multiple_diseases` - Múltiples enfermedades

## Verificación

Una vez colocados los archivos, el modelo se cargará automáticamente al iniciar la aplicación. Puedes verificar en la consola del navegador:

```javascript
// El modelo debería cargar sin errores
console.log('Model loaded successfully');
```

## Notas

- El modelo se carga de forma lazy (solo cuando se necesita)
- Los archivos se cachean en el Service Worker para uso offline
- El tamaño total no debe exceder 50MB para mejor rendimiento móvil
