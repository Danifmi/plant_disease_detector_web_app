import { NextRequest, NextResponse } from 'next/server';

// API Route de backup para análisis del lado del servidor
// En producción, el análisis se hace en el cliente con TensorFlow.js
// Esta API sirve como fallback o para dispositivos con recursos limitados

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      );
    }

    // Validar que sea una imagen base64 válida
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Formato de imagen inválido' },
        { status: 400 }
      );
    }

    // En una implementación completa, aquí se procesaría la imagen
    // con un modelo en el servidor (Python/TensorFlow Serving)
    // Por ahora, retornamos una respuesta de demostración

    // Simular tiempo de procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Respuesta de demostración
    const mockResult = {
      disease: 'healthy',
      confidence: 0.92,
      probabilities: {
        healthy: 0.92,
        rust: 0.04,
        scab: 0.03,
        multiple_diseases: 0.01,
      },
      processingTime: 1.2,
      message: 'Análisis realizado en el servidor (modo demo)',
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('Error en análisis:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'available',
    message: 'API de análisis disponible. Usar POST para enviar imágenes.',
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: '5MB',
  });
}
