declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let cvReady = false;
let cvPromise: Promise<any> | null = null;

export async function loadOpenCV(): Promise<any> {
  // Solo ejecutar en cliente
  if (typeof window === 'undefined') {
    throw new Error('OpenCV.js solo puede cargarse en el navegador');
  }

  if (cvReady && window.cv) {
    return window.cv;
  }

  if (cvPromise) {
    return cvPromise;
  }

  cvPromise = new Promise((resolve, reject) => {
    // Verificar si ya está cargado
    if (window.cv && window.cv.Mat) {
      cvReady = true;
      resolve(window.cv);
      return;
    }

    // Cargar script
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.x/opencv.js';
    script.async = true;

    script.onload = () => {
      // OpenCV.js usa un callback onRuntimeInitialized
      const checkReady = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(checkReady);
          cvReady = true;
          console.log('✅ OpenCV.js cargado correctamente');
          resolve(window.cv);
        }
      }, 100);

      // Timeout después de 30 segundos
      setTimeout(() => {
        clearInterval(checkReady);
        if (!cvReady) {
          reject(new Error('Timeout cargando OpenCV.js'));
        }
      }, 30000);
    };

    script.onerror = () => {
      reject(new Error('Error al cargar OpenCV.js'));
    };

    document.head.appendChild(script);
  });

  return cvPromise;
}

export function isOpenCVReady(): boolean {
  return cvReady;
}
