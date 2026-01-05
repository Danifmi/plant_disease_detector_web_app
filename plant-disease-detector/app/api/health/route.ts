import { NextResponse } from 'next/server';

// Health check endpoint para verificar el estado de la aplicación
// Usado por Vercel, balanceadores de carga, y sistemas de monitoreo

export async function GET() {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    services: {
      api: 'operational',
      // En producción, aquí se verificarían conexiones a DB, etc.
    },
  };

  return NextResponse.json(healthStatus);
}
