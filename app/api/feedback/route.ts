import { NextRequest, NextResponse } from 'next/server';

// API Route para recibir feedback de usuarios sobre los diagnósticos
// Esto ayuda a mejorar el modelo con correcciones de los usuarios

interface FeedbackData {
  analysisId: string;
  predictedDisease: string;
  actualDisease?: string;
  isCorrect: boolean;
  comments?: string;
  imageData?: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackData = await request.json();

    // Validar campos requeridos
    if (!body.analysisId || body.isCorrect === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: analysisId, isCorrect' },
        { status: 400 }
      );
    }

    // En producción, aquí se guardaría el feedback en una base de datos
    // Por ejemplo: Firebase, Supabase, PostgreSQL, etc.
    
    console.log('Feedback recibido:', {
      analysisId: body.analysisId,
      predictedDisease: body.predictedDisease,
      actualDisease: body.actualDisease,
      isCorrect: body.isCorrect,
      hasComments: !!body.comments,
      timestamp: body.timestamp || new Date().toISOString(),
    });

    // Simular guardado exitoso
    return NextResponse.json({
      success: true,
      message: 'Feedback recibido correctamente. ¡Gracias por ayudar a mejorar el modelo!',
      feedbackId: `fb_${Date.now()}`,
    });
  } catch (error) {
    console.error('Error al procesar feedback:', error);
    return NextResponse.json(
      { error: 'Error al procesar el feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'available',
    message: 'API de feedback disponible. Usar POST para enviar feedback.',
    fields: {
      required: ['analysisId', 'isCorrect'],
      optional: ['predictedDisease', 'actualDisease', 'comments', 'imageData'],
    },
  });
}
