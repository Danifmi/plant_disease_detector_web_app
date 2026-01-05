// Cargador de OpenCV.js

declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let cvInstance: any = null;
let loadPromise: Promise<any> | null = null;
let isLoading = false;

const OPENCV_CDN_URL = 'https://docs.opencv.org/4.8.0/opencv.js';

/**
 * Carga OpenCV.js dinámicamente
 */
export async function loadOpenCV(): Promise<any> {
  // Si ya está cargado, retornarlo
  if (cvInstance) return cvInstance;

  // Si ya está cargando, esperar
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Verificar si está disponible globalmente
  if (typeof window !== 'undefined' && window.cv && window.cv.Mat) {
    cvInstance = window.cv;
    return cvInstance;
  }

  isLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      reject(new Error('OpenCV solo funciona en el navegador'));
      return;
    }

    // Configurar callback para cuando OpenCV esté listo
    window.Module = {
      onRuntimeInitialized: () => {
        cvInstance = window.cv;
        isLoading = false;
        console.log('OpenCV.js cargado correctamente');
        resolve(cvInstance);
      }
    };

    // Cargar script
    const script = document.createElement('script');
    script.src = OPENCV_CDN_URL;
    script.async = true;

    script.onload = () => {
      // El callback onRuntimeInitialized se encarga del resolve
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Error cargando OpenCV.js'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Verifica si OpenCV está disponible
 */
export function isOpenCVLoaded(): boolean {
  return cvInstance !== null;
}

/**
 * Obtiene la instancia de OpenCV
 */
export function getCV(): any {
  if (!cvInstance) {
    throw new Error('OpenCV no está cargado. Llame a loadOpenCV() primero.');
  }
  return cvInstance;
}

/**
 * Carga OpenCV de forma lazy solo cuando se necesita
 */
export async function ensureOpenCVLoaded(): Promise<any> {
  if (cvInstance) return cvInstance;
  return loadOpenCV();
}
