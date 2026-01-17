/**
 * API Route: /api/segment
 * SOLUCIÓN FINAL: Filtrado por "Componente Conexa Más Grande" + Crop Central
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// INTERFACES
// ============================================================

interface ContourData {
  area: number;
  centroid: { x: number; y: number };
  boundingBox: { x: number; y: number; width: number; height: number };
  severity: 'low' | 'medium' | 'high';
}

interface SegmentationResponse {
  success: boolean;
  masks: {
    rust: string | null;
    scab: string | null;
    healthy: string | null;
  };
  overlayImage: string | null;
  percentages: {
    healthy: number;
    rust: number;
    scab: number;
    background: number;
  };
  contours: {
    rust: ContourData[];
    scab: ContourData[];
  };
  processingTime: number;
  error?: string;
}

// ============================================================
// GET - Health Check
// ============================================================

export async function GET(): Promise<NextResponse> {
  let sharpAvailable = false;
  try {
    await sharp({
      create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 0 } }
    }).png().toBuffer();
    sharpAvailable = true;
  } catch (error) {
    console.error(error);
  }

  return NextResponse.json({
    status: 'ok',
    service: 'Spatial Leaf Segmentation Service',
    sharpAvailable,
    timestamp: new Date().toISOString()
  });
}

// ============================================================
// POST - Segmentación de imagen
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('🚀 API Segment: Iniciando con Crop Central y Filtrado Espacial');
  const startTime = Date.now();

  try {
    const body = await request.json();
    if (!body.image) return NextResponse.json({ success: false, error: 'No image' }, { status: 400 });

    const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // ============================================================
    // 1. PRE-PROCESAMIENTO: CROP CENTER + RESIZE
    // ============================================================
    
    // Instanciar Sharp una vez
    const originalImage = sharp(imageBuffer);
    
    // Obtener dimensiones originales
    const metadata = await originalImage.metadata();
    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;

    // CONFIGURACIÓN DE RECORTE
    // 0.75 significa que mantenemos el 75% central de la imagen (hace zoom).
    // Reduce esto (ej. 0.6) para hacer más zoom, o auméntalo (ej. 0.9) para menos zoom.
    const CROP_SCALE = 0.75; 

    const cropW = Math.floor(origWidth * CROP_SCALE);
    const cropH = Math.floor(origHeight * CROP_SCALE);
    const left = Math.floor((origWidth - cropW) / 2);
    const top = Math.floor((origHeight - cropH) / 2);

    const maxDim = 400; // Tamaño final para procesamiento rápido

    // Aplicar Recorte (Extract) y luego Redimensión (Resize)
    const processedImage = originalImage
      .extract({ left: left, top: top, width: cropW, height: cropH }) 
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true });

    // Obtener buffer RGB crudo para análisis manual
    const { data: rgbData, info } = await processedImage
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const totalPixels = width * height;

    // ============================================================
    // PASO CRÍTICO: DETECTAR LA HOJA PRINCIPAL (MÁSCARA BINARIA)
    // ============================================================
    // Esto crea un "recorte" digital de la hoja más grande, ignorando el fondo verde.
    const mainLeafMask = getMainLeafMask(rgbData, width, height);

    // ============================================================
    // CLASIFICACIÓN DE ENFERMEDADES (Solo dentro de la máscara)
    // ============================================================

    let leafPixels = 0;
    let healthyPixels = 0;
    let rustPixels = 0;
    let scabPixels = 0;

    const healthyMaskData = Buffer.alloc(totalPixels);
    const rustMaskData = Buffer.alloc(totalPixels);
    const scabMaskData = Buffer.alloc(totalPixels);
    const overlayData = Buffer.alloc(totalPixels * 3);

    for (let i = 0; i < totalPixels; i++) {
      const r = rgbData[i * 3];
      const g = rgbData[i * 3 + 1];
      const b = rgbData[i * 3 + 2];

      // Copiar imagen base al overlay
      overlayData[i * 3] = r;
      overlayData[i * 3 + 1] = g;
      overlayData[i * 3 + 2] = b;

      // SI NO ES PARTE DE LA HOJA PRINCIPAL, IGNORAR E IR AL SIGUIENTE
      if (mainLeafMask[i] === 0) {
        // Oscurecer el fondo visualmente para que el usuario vea qué se descartó
        overlayData[i * 3] = Math.round(r * 0.3);
        overlayData[i * 3 + 1] = Math.round(g * 0.3);
        overlayData[i * 3 + 2] = Math.round(b * 0.3);
        continue;
      }

      leafPixels++;
      const [h, s, v] = rgbToHsv(r, g, b);

      // --- LÓGICA DE DETECCIÓN DE ENFERMEDADES ---

      // 1. ROYA (RUST)
      // Ampliado para incluir rojos oscuros/púrpuras y naranjas vivos
      const isRust = (
        // Naranja / Amarillo Vivos
        (h >= 5 && h <= 40 && s >= 50 && v >= 60) ||
        // Rojos oscuros / Púrpuras
        ((h >= 160 || h <= 10) && s >= 40 && v >= 40 && v <= 200)
      );

      // 2. SARNA (SCAB)
      // Manchas oscuras, marrones o grisáceas, mate.
      const isScab = (
        !isRust && // Prioridad a Roya
        v <= 120 && // Debe ser oscuro
        s >= 10 && // No puramente gris/negro (ruido)
        (
            (h >= 10 && h <= 50) || // Marrón
            (h >= 60 && h <= 150 && s <= 80) // Verde muy oscuro/podrido
        )
      );

      if (isRust) {
        rustMaskData[i] = 255;
        rustPixels++;
        // Overlay: Naranja Neón
        overlayData[i * 3] = 255;
        overlayData[i * 3 + 1] = 100;
        overlayData[i * 3 + 2] = 0;
      } else if (isScab) {
        scabMaskData[i] = 255;
        scabPixels++;
        // Overlay: Magenta
        overlayData[i * 3] = 255;
        overlayData[i * 3 + 1] = 0;
        overlayData[i * 3 + 2] = 255;
      } else {
        healthyMaskData[i] = 255;
        healthyPixels++;
        // Overlay: Dejar color original (verde)
      }
    }

    // ============================================================
    // RESULTADOS Y GENERACIÓN DE IMÁGENES
    // ============================================================
    
    // Calcular porcentajes
    const percentages = {
      healthy: leafPixels > 0 ? (healthyPixels / leafPixels) * 100 : 0,
      rust: leafPixels > 0 ? (rustPixels / leafPixels) * 100 : 0,
      scab: leafPixels > 0 ? (scabPixels / leafPixels) * 100 : 0,
      background: ((totalPixels - leafPixels) / totalPixels) * 100
    };

    // Generar imágenes Base64
    const [rustB64, scabB64, healthyB64, overlayB64] = await Promise.all([
      bufferToBase64Image(rustMaskData, width, height, true),
      bufferToBase64Image(scabMaskData, width, height, true),
      bufferToBase64Image(healthyMaskData, width, height, true),
      bufferToBase64Image(overlayData, width, height, false)
    ]);

    // Contornos (usando la máscara de enfermedad)
    const rustContours = analyzeContours(rustMaskData, width, height, leafPixels);
    const scabContours = analyzeContours(scabMaskData, width, height, leafPixels);

    return NextResponse.json({
      success: true,
      masks: { rust: rustB64, scab: scabB64, healthy: healthyB64 },
      overlayImage: overlayB64,
      percentages,
      contours: { rust: rustContours, scab: scabContours },
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

// ============================================================
// NUEVA FUNCIÓN: DETECCIÓN DE LA HOJA PRINCIPAL
// ============================================================

/**
 * Genera una máscara binaria que contiene SOLO la hoja más grande de la imagen.
 * Elimina el ruido de fondo desconectado.
 */
function getMainLeafMask(rgbData: Buffer, width: number, height: number): Buffer {
  const totalPixels = width * height;
  const tempMask = Buffer.alloc(totalPixels); // 0 = fondo, 255 = posible planta

  // 1. FILTRO DE COLOR AMPLIO
  for (let i = 0; i < totalPixels; i++) {
    const r = rgbData[i * 3];
    const g = rgbData[i * 3 + 1];
    const b = rgbData[i * 3 + 2];
    const [h, s, v] = rgbToHsv(r, g, b);

    const isGreen = h >= 25 && h <= 100 && s >= 20 && v >= 20;
    const isBrownOrange = (h >= 5 && h <= 40) || (h >= 160) || (h <= 5); 
    const isVegetation = (isGreen || isBrownOrange) && v >= 20 && s >= 15;

    tempMask[i] = isVegetation ? 255 : 0;
  }

  // 2. ENCONTRAR LA "ISLA" MÁS GRANDE
  const visited = new Set<number>();
  let maxArea = 0;
  let bestBlob: number[] = [];

  for (let y = 0; y < height; y += 2) { 
    for (let x = 0; x < width; x += 2) {
      const idx = y * width + x;
      if (tempMask[idx] === 255 && !visited.has(idx)) {
        const blob = floodFill(tempMask, width, height, x, y, visited);
        if (blob.pixels.length > maxArea) {
          maxArea = blob.pixels.length;
          bestBlob = blob.pixels;
        }
      }
    }
  }

  // 3. CREAR MÁSCARA FINAL LIMPIA
  const cleanMask = Buffer.alloc(totalPixels);
  
  if (maxArea > (totalPixels * 0.05)) {
    for (const idx of bestBlob) {
      cleanMask[idx] = 255;
    }
  } else {
    return tempMask;
  }

  return cleanMask;
}

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0, s = 0, v = max;

  if (delta !== 0) {
    s = delta / max;
    if (max === rNorm) h = ((gNorm - bNorm) / delta) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / delta + 2;
    else h = (rNorm - gNorm) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return [Math.round(h / 2), Math.round(s * 255), Math.round(v * 255)];
}

async function bufferToBase64Image(data: Buffer, width: number, height: number, isMono: boolean) {
  try {
    const img = sharp(data, { raw: { width, height, channels: isMono ? 1 : 3 } });
    const buf = await img.png().toBuffer();
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch (e) { return ''; }
}

function analyzeContours(mask: Buffer, w: number, h: number, leafPix: number): ContourData[] {
    const visited = new Set<number>();
    const contours: ContourData[] = [];
    for (let i=0; i<w*h; i++) {
        if(mask[i]===255 && !visited.has(i)) {
            const region = floodFill(mask, w, h, i%w, Math.floor(i/w), visited);
            if(region.pixels.length > 10) {
                const area = region.pixels.length;
                contours.push({
                    area, 
                    centroid: region.centroid, 
                    boundingBox: region.boundingBox,
                    severity: (area/leafPix)*100 > 5 ? 'high' : ((area/leafPix)*100 > 1 ? 'medium' : 'low')
                });
            }
        }
    }
    return contours.sort((a,b)=>b.area-a.area).slice(0,50);
}

function floodFill(mask: Buffer, w: number, h: number, startX: number, startY: number, visited: Set<number>) {
  const pixels: number[] = [];
  const stack = [[startX, startY]];
  let minX=startX, maxX=startX, minY=startY, maxY=startY;
  let sumX=0, sumY=0;

  while (stack.length) {
    const [x, y] = stack.pop()!;
    const idx = y * w + x;
    if (x<0 || x>=w || y<0 || y>=h || visited.has(idx) || mask[idx] !== 255) continue;
    
    visited.add(idx);
    pixels.push(idx);
    sumX+=x; sumY+=y;
    if(x<minX) minX=x; if(x>maxX) maxX=x;
    if(y<minY) minY=y; if(y>maxY) maxY=y;

    stack.push([x+1,y], [x-1,y], [x,y+1], [x,y-1]);
  }
  return { 
      pixels, 
      centroid: { x: pixels.length ? Math.round(sumX/pixels.length) : startX, y: pixels.length ? Math.round(sumY/pixels.length) : startY },
      boundingBox: { x: minX, y: minY, width: maxX-minX+1, height: maxY-minY+1 } 
  };
}