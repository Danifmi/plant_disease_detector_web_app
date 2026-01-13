'use client';

import Link from 'next/link';
import { Camera, Upload, BookOpen, History, Leaf, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';

export default function HomePage() {
  const features = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: 'Captura Instantánea',
      description: 'Usa la cámara de tu dispositivo para fotografiar hojas de plantas en tiempo real.',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'IA Avanzada',
      description: 'Modelo de machine learning entrenado con miles de imágenes para detectar enfermedades.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Resultados Rápidos',
      description: 'Obtén diagnósticos en segundos con visualización de áreas afectadas.',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Funciona Offline',
      description: 'Una vez cargada, la app funciona sin conexión a internet.',
    },
  ];

  const diseases = [
    { name: 'Saludable', color: 'bg-green-500', description: 'Planta sin enfermedades' },
    { name: 'Roya', color: 'bg-orange-500', description: 'Infección fúngica' },
    { name: 'Sarna', color: 'bg-stone-500', description: 'Manchas oscuras' },
    { name: 'Múltiples', color: 'bg-red-500', description: 'Varias enfermedades' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-green-600/10 to-transparent pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
              <Leaf className="w-4 h-4" />
              <span>Potenciado por Inteligencia Artificial</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Detecta Enfermedades en
              <span className="text-green-600"> Plantas</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Fotografía las hojas de tus plantas y obtén un diagnóstico instantáneo 
              usando inteligencia artificial. Identifica roya, sarna y otras enfermedades.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/analyze">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-lg px-8">
                  <Camera className="w-5 h-5" />
                  Analizar Planta
                </Button>
              </Link>
              
              <Link href="/guide">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-lg px-8">
                  <BookOpen className="w-5 h-5" />
                  Guía de Enfermedades
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-16 bg-white/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              ¿Cómo Funciona?
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-2">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Diseases Preview */}
        <section className="px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Enfermedades Detectables
            </h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Nuestro modelo puede identificar las siguientes condiciones en hojas de manzano:
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {diseases.map((disease, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 ${disease.color} rounded-full mb-4 mx-auto`} />
                  <h3 className="font-semibold text-gray-900 text-center">{disease.name}</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">{disease.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="px-4 py-16 bg-white/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Tres Simples Pasos
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-lg mb-2">Captura o Sube</h3>
                <p className="text-gray-600">
                  Toma una foto con tu cámara o sube una imagen de la galería.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-lg mb-2">Análisis IA</h3>
                <p className="text-gray-600">
                  Nuestro modelo analiza la imagen en busca de signos de enfermedad.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-lg mb-2">Diagnóstico</h3>
                <p className="text-gray-600">
                  Recibe el diagnóstico con recomendaciones de tratamiento.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Listo para empezar?
            </h2>
            <p className="text-gray-600 mb-8">
              Analiza tus plantas ahora y mantén tu jardín o cultivo saludable.
            </p>
            
            <Link href="/analyze">
              <Button size="lg" className="gap-2 text-lg px-8">
                <Camera className="w-5 h-5" />
                Comenzar Análisis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
