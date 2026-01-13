// Componente Footer de la aplicación

import Link from 'next/link';
import { Leaf, Github, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Leaf className="h-6 w-6 text-green-600" />
              <span className="font-bold text-lg">Plant Disease Detector</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Aplicación de detección de enfermedades en plantas utilizando 
              inteligencia artificial y visión por computador. Analiza hojas 
              de manzano para detectar roya, sarna y otras enfermedades.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/analyze"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Analizar imagen
                </Link>
              </li>
              <li>
                <Link
                  href="/guide"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Guía de enfermedades
                </Link>
              </li>
              <li>
                <Link
                  href="/history"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Mi historial
                </Link>
              </li>
            </ul>
          </div>

          {/* Información */}
          <div>
            <h3 className="font-semibold mb-4">Información</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">
                Basado en el dataset Plant Pathology 2020
              </li>
              <li className="text-muted-foreground">
                Modelo: CNN (TensorFlow.js)
              </li>
              <li className="text-muted-foreground">
                Procesamiento: OpenCV.js
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            Hecho con <Heart className="h-4 w-4 text-red-500" /> para el curso de ML
          </p>
          <p className="mt-2 md:mt-0">
            © {new Date().getFullYear()} Plant Disease Detector. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
