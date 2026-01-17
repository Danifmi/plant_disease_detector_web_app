# 🌿 Plant Disease Detector

Aplicación web PWA para la detección de enfermedades en hojas de manzano utilizando **Machine Learning** y **Computer Vision**.

![Plant Disease Detector](./public/icons/icon-192x192.png)

## 📋 Descripción

Esta aplicación permite a agricultores, jardineros y entusiastas de las plantas detectar enfermedades en hojas de manzano de forma rápida y sencilla. Utiliza un modelo de Deep Learning basado en **EfficientNetB0** entrenado con el dataset Plant Pathology 2020 de Kaggle, combinado con técnicas de **visión por computadora** para segmentar y visualizar las áreas afectadas.

### 🎯 Enfermedades Detectadas

| Categoría           | Descripción               | Indicadores Visuales                     |
| ------------------- | ------------------------- | ---------------------------------------- |
| ✅ **Saludable**    | Hoja sin enfermedades     | Coloración verde uniforme                |
| 🟠 **Roya (Rust)**  | Infección fúngica         | Manchas anaranjadas/amarillas (H: 5-40°) |
| ⚫ **Sarna (Scab)** | Lesiones bacterianas      | Manchas oscuras y costrosas (V: 20-120)  |
| 🔴 **Múltiples**    | Combinación de patologías | Presencia de varios síntomas             |

---

## 🚀 Características Principales

### 📸 Captura y Entrada de Imágenes

- Captura en tiempo real con la cámara del dispositivo (WebRTC)
- Subida de imágenes mediante drag & drop o selector de archivos
- Soporte para formatos JPEG, PNG y WebP (máx. 10MB)
- Recorte central automático para optimizar la clasificación

### 🤖 Clasificación con Machine Learning

- **Modelo**: EfficientNetB0 (~83.8% accuracy)
- **Inferencia**: TensorFlow.js con backend WebGL en cliente
- **Preprocesamiento**: Resize a 224x224, normalización específica para EfficientNet
- **Modelo hospedado en**: [Hugging Face](https://huggingface.co/fidalg0/plant-disease-classifier)

### 🔬 Segmentación por Computer Vision

- **Procesamiento server-side** usando Sharp y algoritmos HSV
- Detección de áreas afectadas mediante rangos de color calibrados:
  - **Roya**: H(5-40), S(≥60), V(≥60)
  - **Sarna**: H(0-30), S(20-180), V(20-120)
- Filtrado por componente conexa más grande (eliminación de ruido)
- Generación de máscaras y overlay visual con contornos
- Cálculo de porcentajes de área afectada por enfermedad

### 📊 Visualización de Resultados

- Gráficas de confianza para cada diagnóstico
- Overlay visual con contornos de áreas afectadas
- Máscaras individuales por tipo de enfermedad
- Porcentajes de cobertura (healthy, rust, scab, background)

### 💊 Sistema de Recomendaciones

- Tratamientos personalizados según enfermedad detectada
- Severidad calculada por área afectada (low/medium/high)
- Recomendaciones adicionales basadas en segmentación

### 📱 Progressive Web App (PWA)

- Instalable en dispositivos móviles y desktop
- Funcionamiento offline con Service Worker
- Caché de recursos estáticos y modelo ML

### 📜 Historial de Análisis

- Almacenamiento local con IndexedDB
- Persistencia de resultados y imágenes analizadas
- Sistema de feedback para mejora continua

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología   | Versión | Propósito                      |
| ------------ | ------- | ------------------------------ |
| Next.js      | 14.x    | Framework React con App Router |
| React        | 18.x    | Biblioteca UI                  |
| TypeScript   | 5.x     | Tipado estático                |
| Tailwind CSS | 3.4     | Estilos utility-first          |
| shadcn/ui    | -       | Componentes accesibles         |
| Zustand      | 4.5     | Estado global                  |

### Machine Learning

| Tecnología     | Propósito               |
| -------------- | ----------------------- |
| TensorFlow.js  | Inferencia en cliente   |
| WebGL Backend  | Aceleración GPU         |
| EfficientNetB0 | Arquitectura del modelo |
| Hugging Face   | Hosting del modelo      |

### Computer Vision (Server-Side)

| Tecnología                                             | Propósito                                   |
| ------------------------------------------------------ | ------------------------------------------- |
| Sharp                                                  | Manipulación de imágenes                    |
| [opencv-wasm](https://github.com/echamudi/opencv-wasm) | OpenCV compilado a WebAssembly para Node.js |
| Algoritmos HSV                                         | Detección de enfermedades por color         |

> **Nota**: Se utiliza [opencv-wasm](https://github.com/echamudi/opencv-wasm) de Ezzat Chamudi, que proporciona OpenCV 4.3.0 compilado a WebAssembly, permitiendo ejecutar operaciones de visión por computadora en entornos Node.js sin dependencias nativas.

### Almacenamiento

| Tecnología      | Propósito               |
| --------------- | ----------------------- |
| IndexedDB (idb) | Historial de análisis   |
| LocalStorage    | Preferencias de usuario |
| Service Worker  | Caché offline           |

---

## 📁 Estructura del Proyecto

```
plant-disease-detector/
├── app/                          # Next.js App Router
│   ├── analyze/                  # Página de análisis
│   ├── guide/                    # Guía de enfermedades
│   ├── history/                  # Historial de análisis
│   ├── api/
│   │   ├── segment/              # API de segmentación (POST)
│   │   └── feedback/             # API de feedback
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── analysis/
│   │   ├── AnalysisResult.tsx    # Resultados completos
│   │   ├── SegmentationViewer.tsx # Visualización de máscaras
│   │   └── Recommendations.tsx   # Panel de recomendaciones
│   ├── camera/                   # Componentes de cámara
│   ├── upload/                   # Drag & drop uploader
│   ├── common/                   # Header, Footer
│   └── ui/                       # shadcn/ui components
│
├── hooks/
│   ├── useAnalysis.ts            # Lógica de análisis completo
│   ├── useSegmentation.ts        # Hook para API de segmentación
│   ├── useCamera.ts              # Control WebRTC
│   └── useModel.ts               # Carga del modelo TF.js
│
├── lib/
│   ├── ml/
│   │   ├── model-loader.ts       # Carga desde Hugging Face
│   │   ├── predict.ts            # Inferencia y clasificación
│   │   ├── preprocess.ts         # Preprocesamiento de imágenes
│   │   └── postprocess.ts        # Procesamiento de resultados
│   ├── opencv/
│   │   └── server/
│   │       └── opencvService.ts  # Servicio de segmentación
│   ├── storage/                  # IndexedDB helpers
│   └── constants/
│       └── config.ts             # Configuración global
│
├── public/
│   ├── icons/                    # Íconos PWA (72-512px)
│   ├── manifest.json             # Web App Manifest
│   └── sw.js                     # Service Worker
│
├── types/
│   └── analysis.ts               # TypeScript definitions
│
└── styles/                       # Estilos adicionales
```

---

## 🏃‍♂️ Instalación y Desarrollo

### Prerequisitos

- Node.js 18+
- npm o yarn
- Git

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd plant-disease-detector

# 2. Instalar dependencias
npm install

# 3. Iniciar en desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:3000
```

### Variables de Entorno (Opcionales)

```env
NEXT_PUBLIC_API_URL=           # URL base para API (vacío para local)
```

---

## 🧠 Modelo de Machine Learning

### Especificaciones

| Propiedad        | Valor                            |
| ---------------- | -------------------------------- |
| **Arquitectura** | EfficientNetB0                   |
| **Framework**    | TensorFlow/Keras → TensorFlow.js |
| **Input Shape**  | [1, 224, 224, 3]                 |
| **Output**       | 4 clases (softmax)               |
| **Precisión**    | ~83.8% (validation)              |
| **Hosting**      | Hugging Face Hub                 |

### Clases de Salida

```typescript
const CLASSES = ["healthy", "multiple_diseases", "rust", "scab"];
```

### URL del Modelo

```
https://huggingface.co/fidalg0/plant-disease-classifier/resolve/main/model.json
```

### Preprocesamiento

El modelo requiere preprocesamiento específico de EfficientNet:

- Resize bilinear a 224×224
- Conversión a Float32 (rango 0-255, **sin dividir por 255**)
- Center crop cuadrado previo al resize

---

## 🔬 API de Segmentación

### Endpoint

```
POST /api/segment
```

### Request Body

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

### Response

```json
{
  "success": true,
  "masks": {
    "rust": "data:image/png;base64,...",
    "scab": "data:image/png;base64,...",
    "healthy": "data:image/png;base64,..."
  },
  "overlayImage": "data:image/png;base64,...",
  "percentages": {
    "healthy": 72.5,
    "rust": 15.3,
    "scab": 8.2,
    "background": 4.0
  },
  "contours": {
    "rust": [{ "area": 1250, "severity": "medium", ... }],
    "scab": [{ "area": 890, "severity": "low", ... }]
  },
  "processingTime": 342
}
```

### Health Check

```
GET /api/segment
```

---

## 📱 PWA - Instalación

La aplicación es una **Progressive Web App** completamente instalable:

1. Abre la aplicación en Chrome, Safari o Edge
2. Haz clic en "Añadir a pantalla de inicio" o el ícono de instalación
3. La app funcionará offline con las siguientes capacidades:
   - Navegación entre páginas
   - Modelo ML cacheado
   - Historial de análisis local

### Manifest

```json
{
  "name": "Plant Disease Detector",
  "short_name": "PlantDetector",
  "display": "standalone",
  "theme_color": "#16a34a",
  "background_color": "#ffffff"
}
```

---

## 🚀 Despliegue

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy a producción
vercel --prod
```

### Build de Producción Local

```bash
# Construir
npm run build

# Ejecutar
npm run start
```

### Consideraciones de Deploy

- El endpoint `/api/segment` requiere Node.js runtime (no Edge)
- Las dependencias `sharp` y `opencv-wasm` se instalan automáticamente
- Vercel maneja correctamente los API Routes con estas dependencias

---

## 🧪 Testing y Calidad

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Build de prueba
npm run build
```

---

## 📊 Dataset

Este proyecto utiliza el dataset **[Plant Pathology 2020 - FGVC7](https://www.kaggle.com/c/plant-pathology-2020-fgvc7)** de Kaggle para entrenar el modelo.

### Características del Dataset

| Propiedad      | Valor                             |
| -------------- | --------------------------------- |
| **Imágenes**   | ~3,600                            |
| **Clases**     | 4 (healthy, rust, scab, multiple) |
| **Formato**    | JPEG                              |
| **Resolución** | Variable (~2000×1300)             |
| **Split**      | Train/Test proporcionado          |

---

## 🔧 Configuración

Edita `lib/constants/config.ts` para personalizar:

```typescript
export const MODEL_CONFIG = {
  modelPath:
    "https://huggingface.co/fidalg0/plant-disease-classifier/resolve/main/model.json",
  inputSize: 224,
  classes: ["healthy", "multiple_diseases", "rust", "scab"] as const,
  confidenceThreshold: 0.5,
};

export const IMAGE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedFormats: ["image/jpeg", "image/png", "image/webp"],
  processingSize: 224,
};
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-feature`)
3. Commit cambios (`git commit -m 'Add: nueva feature'`)
4. Push (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

## 👥 Autor

**Daniel Fidalgo Millán**  
Proyecto Final - Unit 25: Applied Machine Learning  
PEARSON HND - Computer Science & AI/Data Science  
Curso 2025-2026

---

## 🙏 Agradecimientos

- **Kaggle** y los organizadores de Plant Pathology 2020
- **TensorFlow.js** team
- **Next.js** team
- **Hugging Face** por el hosting del modelo
- **Vercel** por la plataforma de despliegue
- **[Ezzat Chamudi](https://github.com/echamudi)** por [opencv-wasm](https://github.com/echamudi/opencv-wasm) - OpenCV 4.3.0 compilado a WebAssembly

---

## 📚 Referencias

- Plant Pathology 2020 - FGVC7 Challenge: [Kaggle](https://www.kaggle.com/c/plant-pathology-2020-fgvc7)
- EfficientNet Paper: [arXiv:1905.11946](https://arxiv.org/abs/1905.11946)
- TensorFlow.js Documentation: [tensorflow.org/js](https://www.tensorflow.org/js)
- Next.js Documentation: [nextjs.org](https://nextjs.org)
- opencv-wasm: [github.com/echamudi/opencv-wasm](https://github.com/echamudi/opencv-wasm)
