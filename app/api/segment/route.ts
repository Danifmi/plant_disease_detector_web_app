/**
 * API Route: /api/segment
 * Procesa imágenes de hojas y segmenta las áreas afectadas
 * Usa sharp para decodificar + opencv-wasm para contornos
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/segment - Health check
 */
export async function GET(): Promise<NextResponse> {
  let opencvAvailable = false;
  let sharpAvailable = false;
  let errorMessage = '';
  
  try {
    const opencvWasm = await import('opencv-wasm');
    opencvAvailable = !!opencvWasm.cv;
  } catch (error) {
    errorMessage = `opencv-wasm: ${error instanceof Error ? error.message : 'Error'}`;
  }
  
  try {
    // Verificar que sharp funciona
    await sharp({
      create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 0 } }
    }).png().toBuffer();
    sharpAvailable = true;
  } catch (error) {
    errorMessage += ` sharp: ${error instanceof Error ? error.message : 'Error'}`;
  }
  
  return NextResponse.json({
    status: opencvAvailable && sharpAvailable ? 'ok' : 'error',
    service: 'OpenCV Segmentation Service',
    opencvAvailable,
    sharpAvailable,
    error: errorMessage || undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * POST /api/segment
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('🚀 API Segment: Iniciando (versión con OpenCV opcional)');
  console.log('📥 API /api/segment: Recibida petición POST');
  const startTime = Date.now();
  
  try {
    // Parsear body
    const body = await request.json();
    
    if (!body.image) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó imagen' },
        { status: 400 }
      );
    }
    
    console.log('📊 Imagen recibida, longitud:', body.image.length);
    
    // Importar opencv-wasm (opcional)
    let cv: any = null;
    try {
      const opencvWasm: any = await import('opencv-wasm');
      // El paquete está publicado como CommonJS (module.exports = { cv, cvTranslateError })
      // En Next/webpack, el import dinámico devuelve ese objeto directamente.
      cv = opencvWasm.cv || (opencvWasm.default && opencvWasm.default.cv);

      if (!cv) {
        throw new Error('opencv-wasm cargado pero sin propiedad cv');
      }

      console.log('✅ opencv-wasm cargado correctamente');
    } catch (importError: any) {
      const message = importError instanceof Error ? importError.message : String(importError);
      console.warn('⚠️ No se pudo importar opencv-wasm, se usará modo básico:', message);
      cv = null;
    }
    
    // Decodificar imagen con sharp
    console.log('🔄 Decodificando imagen con sharp...');
    const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Redimensionar imagen y obtener datos RGB raw
    const maxDim = 300;
    const resizedImage = sharp(imageBuffer)
      .resize(maxDim, maxDim, {
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true
      });
    
    const { data: rgbData, info } = await resizedImage
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const width = info.width;
    const height = info.height;
    const totalPixels = width * height;
    
    console.log('✅ Imagen procesada:', width, 'x', height);
    console.log('📊 Píxeles totales:', totalPixels);
    
    // Convertir RGB a HSV y detectar colores
    // Ajuste de rangos:
    //  - Healthy: verdes con saturación y brillo medios-altos.
    //  - Rust: naranjas/amarillos muy saturados y relativamente brillantes.
    //  - Scab: zonas oscuras o poco saturadas (marrones/olivas/negros) dentro de la hoja.
    const RANGES = {
      healthy: { lower: [35, 40, 40], upper: [85, 255, 255] },
      rust:    { lower: [10, 100, 80], upper: [35, 255, 255] },
      scab:    { lower: [0, 0, 0],     upper: [180, 120, 160] }
    };
    
    let healthyPixels = 0;
    let rustPixels = 0;
    let scabPixels = 0;
    
    const healthyMaskData = Buffer.alloc(totalPixels);
    const rustMaskData = Buffer.alloc(totalPixels);
    const scabMaskData = Buffer.alloc(totalPixels);
    const overlayData = Buffer.alloc(totalPixels * 3);
    
    // Primera pasada: clasificar píxeles y construir máscaras iniciales
    // Regla de prioridad: si un píxel encaja como Sarna y como Roya, se marca como Sarna.
    for (let i = 0; i < totalPixels; i++) {
      const r = rgbData[i * 3];
      const g = rgbData[i * 3 + 1];
      const b = rgbData[i * 3 + 2];
      
      // Convertir a HSV
      const [h, s, v] = rgbToHsv(r, g, b);
      
      // Detectar colores
      const isHealthy = h >= RANGES.healthy.lower[0] && h <= RANGES.healthy.upper[0] &&
                        s >= RANGES.healthy.lower[1] && s <= RANGES.healthy.upper[1] &&
                        v >= RANGES.healthy.lower[2] && v <= RANGES.healthy.upper[2];
      
      const isRust = h >= RANGES.rust.lower[0] && h <= RANGES.rust.upper[0] &&
                     s >= RANGES.rust.lower[1] && s <= RANGES.rust.upper[1] &&
                     v >= RANGES.rust.lower[2] && v <= RANGES.rust.upper[2];
      
      const isScab = h >= RANGES.scab.lower[0] && h <= RANGES.scab.upper[0] &&
                     s >= RANGES.scab.lower[1] && s <= RANGES.scab.upper[1] &&
                     v >= RANGES.scab.lower[2] && v <= RANGES.scab.upper[2];
      
      let label = 0; // 0: nada, 1: healthy, 2: rust, 3: scab
      
      if (isScab) {
        label = 3;
      } else if (isRust) {
        label = 2;
      } else if (isHealthy) {
        label = 1;
      }
      
      healthyMaskData[i] = label === 1 ? 255 : 0;
      rustMaskData[i] = label === 2 ? 255 : 0;
      scabMaskData[i] = label === 3 ? 255 : 0;
    }

    // Procesamiento morfológico con OpenCV para definir la región de interés (ROI) de la hoja
    try {
      if (cv) {
        // Combinar Healthy + Rust para definir la estructura de la hoja
        // (Excluimos Scab en la definición de la forma porque se confunde con el fondo oscuro)
        const combinedMat = new cv.Mat(height, width, cv.CV_8UC1);
        const healthyMat = cv.matFromArray(height, width, cv.CV_8UC1, Array.from(healthyMaskData));
        const rustMat = cv.matFromArray(height, width, cv.CV_8UC1, Array.from(rustMaskData));
        
        cv.add(healthyMat, rustMat, combinedMat); // combined = healthy OR rust

        // 1. Cerrar huecos pequeños en la estructura de la hoja
        // Usamos un kernel más grande para asegurar que conectamos partes fragmentadas
        const kernelClose = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(30, 30)); 
        cv.morphologyEx(combinedMat, combinedMat, cv.MORPH_CLOSE, kernelClose);
        
        // 2. Encontrar contornos
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(combinedMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // 3. Identificar la hoja principal (asumimos que es el contorno más grande)
        let maxArea = 0;
        let maxContourIndex = -1;
        
        for (let i = 0; i < contours.size(); i++) {
          const area = cv.contourArea(contours.get(i));
          // Filtramos ruido muy pequeño, pero buscamos el máximo
          if (area > totalPixels * 0.05 && area > maxArea) {
             maxArea = area;
             maxContourIndex = i;
          }
        }
        
        // Crear una máscara sólida de la hoja
        const leafMask = cv.Mat.zeros(height, width, cv.CV_8UC1);
        const white = new cv.Scalar(255);
        
        if (maxContourIndex !== -1) {
           // Dibujar SOLO el contorno más grande, relleno (-1)
           cv.drawContours(leafMask, contours, maxContourIndex, white, -1);
        }
        
        // 4. Filtrar TODO (Healthy, Rust, Scab) usando la máscara de la hoja
        // Esto elimina cualquier detección en el fondo (especialmente Scab en fondo negro)
        const leafMaskData = leafMask.data;
        
        rustPixels = 0;
        scabPixels = 0;
        healthyPixels = 0; // Recalcular
        
        for (let i = 0; i < totalPixels; i++) {
           const isLeaf = leafMaskData[i] === 255;
           
           if (!isLeaf) {
             // Si está fuera de la hoja principal, borrar todo
             rustMaskData[i] = 0;
             scabMaskData[i] = 0;
             healthyMaskData[i] = 0; 
           } else {
             // Si está dentro, mantenemos y contamos
             if (rustMaskData[i] === 255) rustPixels++;
             if (scabMaskData[i] === 255) scabPixels++;
             if (healthyMaskData[i] === 255) healthyPixels++;
           }
        }
        
        // Cleanup
        healthyMat.delete();
        rustMat.delete();
        combinedMat.delete();
        kernelClose.delete();
        contours.delete();
        hierarchy.delete();
        leafMask.delete();
      }
    } catch (e) {
      console.warn('⚠️ Error en procesamiento morfológico:', e);
      // Fallback: conteo simple si falla OpenCV
      healthyPixels = 0; rustPixels = 0; scabPixels = 0;
      for(let i=0; i<totalPixels; i++) {
        if(healthyMaskData[i]) healthyPixels++;
        if(rustMaskData[i]) rustPixels++;
        if(scabMaskData[i]) scabPixels++;
      }
    }

    // Tercera pasada: crear overlay a partir de las máscaras filtradas
    for (let i = 0; i < totalPixels; i++) {
      const r = rgbData[i * 3];
      const g = rgbData[i * 3 + 1];
      const b = rgbData[i * 3 + 2];
      
      if (rustMaskData[i] === 255) {
        // Naranja para rust
        overlayData[i * 3] = Math.min(255, Math.round(r * 0.5 + 255 * 0.5));
        overlayData[i * 3 + 1] = Math.min(255, Math.round(g * 0.5 + 165 * 0.5));
        overlayData[i * 3 + 2] = Math.min(255, Math.round(b * 0.5 + 0 * 0.5));
      } else if (scabMaskData[i] === 255) {
        // Marrón para scab
        overlayData[i * 3] = Math.min(255, Math.round(r * 0.5 + 139 * 0.5));
        overlayData[i * 3 + 1] = Math.min(255, Math.round(g * 0.5 + 69 * 0.5));
        overlayData[i * 3 + 2] = Math.min(255, Math.round(b * 0.5 + 19 * 0.5));
      } else {
        // Original
        overlayData[i * 3] = r;
        overlayData[i * 3 + 1] = g;
        overlayData[i * 3 + 2] = b;
      }
    }
    
    console.log('✅ Detección por color completada');
    
    // Calcular porcentajes
    const percentages = {
      healthy: (healthyPixels / totalPixels) * 100,
      rust: (rustPixels / totalPixels) * 100,
      scab: (scabPixels / totalPixels) * 100,
      background: Math.max(0, 100 - (healthyPixels + rustPixels + scabPixels) / totalPixels * 100)
    };
    
    console.log('📊 Porcentajes:', percentages);
    
    // Analizar contornos con OpenCV (si está disponible)
    let rustContourData: any[] = [];
    let scabContourData: any[] = [];
    
    if (cv) {
      try {
        const rustMat = cv.matFromArray(height, width, cv.CV_8UC1, Array.from(rustMaskData));
        const scabMat = cv.matFromArray(height, width, cv.CV_8UC1, Array.from(scabMaskData));
        
        // Operaciones morfológicas
        const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
        cv.morphologyEx(rustMat, rustMat, cv.MORPH_OPEN, kernel);
        cv.morphologyEx(scabMat, scabMat, cv.MORPH_OPEN, kernel);
        
        // Contornos rust
        const rustContours = new cv.MatVector();
        const rustHierarchy = new cv.Mat();
        cv.findContours(rustMat, rustContours, rustHierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        rustContourData = analyzeContours(cv, rustContours, totalPixels);
        
        // Contornos scab
        const scabContours = new cv.MatVector();
        const scabHierarchy = new cv.Mat();
        cv.findContours(scabMat, scabContours, scabHierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        scabContourData = analyzeContours(cv, scabContours, totalPixels);
        
        // Cleanup
        rustMat.delete();
        scabMat.delete();
        kernel.delete();
        rustContours.delete();
        rustHierarchy.delete();
        scabContours.delete();
        scabHierarchy.delete();
        
        console.log('✅ Contornos:', rustContourData.length, 'rust,', scabContourData.length, 'scab');
      } catch (e) {
        console.warn('⚠️ Error en contornos:', e);
      }
    }
    
    // Generar imágenes PNG con sharp
    const [overlayBase64, rustMaskBase64, scabMaskBase64, healthyMaskBase64] = await Promise.all([
      sharp(overlayData, { raw: { width, height, channels: 3 } })
        .png()
        .toBuffer()
        .then(buf => `data:image/png;base64,${buf.toString('base64')}`),
      
      sharp(rustMaskData, { raw: { width, height, channels: 1 } })
        .png()
        .toBuffer()
        .then(buf => `data:image/png;base64,${buf.toString('base64')}`),
      
      sharp(scabMaskData, { raw: { width, height, channels: 1 } })
        .png()
        .toBuffer()
        .then(buf => `data:image/png;base64,${buf.toString('base64')}`),
      
      sharp(healthyMaskData, { raw: { width, height, channels: 1 } })
        .png()
        .toBuffer()
        .then(buf => `data:image/png;base64,${buf.toString('base64')}`)
    ]);
    
    const processingTime = Date.now() - startTime;
    console.log('✅ Segmentación completada en', processingTime, 'ms');
    
    return NextResponse.json({
      success: true,
      masks: {
        rust: rustMaskBase64,
        scab: scabMaskBase64,
        healthy: healthyMaskBase64
      },
      overlayImage: overlayBase64,
      percentages,
      contours: {
        rust: rustContourData,
        scab: scabContourData
      },
      processingTime
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno',
      masks: { rust: null, scab: null, healthy: null },
      overlayImage: null,
      percentages: { healthy: 0, rust: 0, scab: 0, background: 100 },
      contours: { rust: [], scab: [] },
      processingTime: Date.now() - startTime
    }, { status: 500 });
  }
}

/**
 * Convierte RGB a HSV (H: 0-180 como OpenCV)
 */
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const v = max;
  
  if (diff !== 0) {
    s = diff / max;
    
    if (max === r) {
      h = 60 * (((g - b) / diff) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / diff + 2);
    } else {
      h = 60 * ((r - g) / diff + 4);
    }
    
    if (h < 0) h += 360;
  }
  
  return [
    Math.round(h / 2),    // H: 0-180
    Math.round(s * 255),  // S: 0-255
    Math.round(v * 255)   // V: 0-255
  ];
}

/**
 * Analiza contornos
 */
function analyzeContours(cv: any, contours: any, totalPixels: number): any[] {
  const results: any[] = [];
  
  try {
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      if (area < 50) continue;
      
      const moments = cv.moments(contour);
      const cx = moments.m00 > 0 ? moments.m10 / moments.m00 : 0;
      const cy = moments.m00 > 0 ? moments.m01 / moments.m00 : 0;
      const rect = cv.boundingRect(contour);
      
      const areaPercentage = (area / totalPixels) * 100;
      const severity = areaPercentage < 2 ? 'low' : areaPercentage < 5 ? 'medium' : 'high';
      
      results.push({
        area,
        centroid: { x: cx, y: cy },
        boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        severity
      });
    }
  } catch (e) {
    // Silenciar
  }
  
  return results;
}