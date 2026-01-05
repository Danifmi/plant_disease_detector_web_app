import type { Metadata, Viewport } from 'next';
import './globals.css';

// Usar fuente local del sistema como fallback
const fontSans = {
  style: { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }
};

export const metadata: Metadata = {
  title: 'Plant Disease Detector - Detecta enfermedades en plantas con IA',
  description: 'Aplicación web PWA que utiliza inteligencia artificial para detectar enfermedades en hojas de plantas a través de la cámara de tu dispositivo.',
  manifest: '/manifest.json',
  keywords: ['plantas', 'enfermedades', 'detección', 'IA', 'machine learning', 'agricultura'],
  authors: [{ name: 'Plant Disease Detector Team' }],
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans antialiased" style={fontSans.style}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
          {children}
        </div>
      </body>
    </html>
  );
}
