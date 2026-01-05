import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, BookOpen, Leaf, Zap, Shield, Smartphone } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-100 rounded-full">
            <Leaf className="h-16 w-16 text-green-600" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Plant Disease Detector
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Detecta enfermedades en hojas de manzano usando inteligencia artificial.
          Simplemente toma una foto y obtén un diagnóstico instantáneo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/analyze">
            <Button size="lg" className="w-full sm:w-auto text-lg px-8">
              <Camera className="mr-2 h-5 w-5" />
              Analizar Planta
            </Button>
          </Link>
          <Link href="/guide">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
              <BookOpen className="mr-2 h-5 w-5" />
              Guía de Enfermedades
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          ¿Cómo funciona?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>1. Captura</CardTitle>
              <CardDescription className="text-base">
                Toma una foto de la hoja usando la cámara de tu dispositivo
                o sube una imagen existente de tu galería.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>2. Análisis</CardTitle>
              <CardDescription className="text-base">
                Nuestro sistema analiza la imagen usando técnicas avanzadas
                de visión por computadora y detección de color.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>3. Diagnóstico</CardTitle>
              <CardDescription className="text-base">
                Recibe un diagnóstico detallado con las áreas afectadas
                marcadas y recomendaciones de tratamiento.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Diseases Info */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Enfermedades Detectables
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
              <span className="text-5xl mb-4 block">🟢</span>
              <h3 className="font-bold text-lg mb-2">Saludable</h3>
              <p className="text-sm text-gray-600">Hoja sin signos de enfermedad</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
              <span className="text-5xl mb-4 block">🟠</span>
              <h3 className="font-bold text-lg mb-2">Roya (Rust)</h3>
              <p className="text-sm text-gray-600">Manchas naranjas/amarillas</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
              <span className="text-5xl mb-4 block">🟣</span>
              <h3 className="font-bold text-lg mb-2">Sarna (Scab)</h3>
              <p className="text-sm text-gray-600">Lesiones oscuras/marrones</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition-shadow">
              <span className="text-5xl mb-4 block">🔴</span>
              <h3 className="font-bold text-lg mb-2">Múltiples</h3>
              <p className="text-sm text-gray-600">Combinación de enfermedades</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Tecnología
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔬</span>
            </div>
            <h3 className="font-semibold mb-2">OpenCV.js</h3>
            <p className="text-sm text-gray-600">Análisis de color y segmentación de imágenes</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">PWA</h3>
            <p className="text-sm text-gray-600">Instalable en cualquier dispositivo</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-semibold mb-2">Tiempo Real</h3>
            <p className="text-sm text-gray-600">Procesamiento instantáneo en tu dispositivo</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-green-600 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para analizar tus plantas?
          </h2>
          <p className="text-lg mb-8 text-green-100 max-w-2xl mx-auto">
            Empieza ahora mismo a detectar enfermedades en tus cultivos.
            Sin registro, sin complicaciones.
          </p>
          <Link href="/analyze">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              <Camera className="mr-2 h-5 w-5" />
              Comenzar Análisis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        <p>
          Plant Disease Detector - Proyecto de Machine Learning
        </p>
        <p className="mt-2">
          Desarrollado con Next.js, OpenCV.js y ❤️
        </p>
      </footer>
    </main>
  );
}
