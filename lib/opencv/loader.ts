// lib/opencv/loader.ts
'use client';

declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let cvInstance: any = null;
let loadPromise: Promise<any> | null = null;

// USAMOS UNPKG: Este CDN sí tiene las cabeceras CORS correctas
// Usamos la versión 4.9.0 que es más moderna y estable para web
const OPENCV_URL = 'https://unpkg.com/@techstark/opencv-js@4.9.0-release.2/dist/opencv.js';

export async function loadOpenCV(): Promise<any> {
  // 1. Si ya está en memoria, devolverlo
  if (cvInstance) return cvInstance;
  if (typeof window !== 'undefined' && window.cv && window.cv.Mat) {
    cvInstance = window.cv;
    return cvInstance;
  }

  // 2. Si ya se está cargando, esperar a la promesa actual
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('OpenCV solo funciona en el cliente'));
      return;
    }

    // Configuración global para cuando OpenCV se inicialice
    window.Module = {
      onRuntimeInitialized: () => {
        console.log('✅ OpenCV cargado desde CDN');
        cvInstance = window.cv;
        // No resolvemos aquí porque a veces el objeto tarda unos milisegundos más
        // dejamos que el polling de abajo se encargue del resolve final
      },
      onError: (err: any) => {
        console.warn('Aviso de OpenCV:', err);
      }
    };

    // Verificar si ya insertamos el script
    let script = document.querySelector(`script[src="${OPENCV_URL}"]`) as HTMLScriptElement;
    
    if (!script) {
      console.log(`🌐 Descargando OpenCV (9MB) desde CDN...`);
      script = document.createElement('script');
      script.src = OPENCV_URL;
      script.async = true;
      script.type = 'text/javascript';
      
      // CRUCIAL: Esto permite la descarga desde otro dominio
      script.crossOrigin = "anonymous"; 
      
      // Manejo de errores de red básicos
      script.onerror = () => {
        reject(new Error('Fallo al conectar con el CDN de OpenCV. Revisa tu conexión.'));
      };

      document.body.appendChild(script);
    }

    // 3. POLLING (Espera activa)
    // Esperamos hasta 60 segundos (la primera vez puede tardar por los 9MB)
    let checks = 0;
    const maxChecks = 600; // 600 * 100ms = 60 segundos

    const intervalId = setInterval(() => {
      // Comprobamos si 'cv' existe y si tiene la función 'Mat' (indicador de carga completa)
      if (window.cv && window.cv.Mat) {
        clearInterval(intervalId);
        cvInstance = window.cv;
        console.log('🚀 OpenCV listo para usarse');
        resolve(window.cv);
      } else {
        checks++;
        if (checks >= maxChecks) {
          clearInterval(intervalId);
          reject(new Error('Tiempo de espera agotado cargando OpenCV. La conexión es lenta o el CDN no responde.'));
        }
      }
    }, 100);
  });

  return loadPromise;
}

export const ensureOpenCVLoaded = loadOpenCV;
export const getCV = loadOpenCV;