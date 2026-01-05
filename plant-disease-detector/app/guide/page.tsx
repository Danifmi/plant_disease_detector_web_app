import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, XCircle, Bug, Droplets } from 'lucide-react';

const diseases = [
  {
    id: 'healthy',
    name: 'Saludable',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    description: 'Hojas sanas sin signos de enfermedad',
    characteristics: [
      'Color verde uniforme y brillante',
      'Sin manchas ni decoloración',
      'Textura lisa y homogénea',
      'Bordes intactos sin daños',
      'Nervaduras claramente visibles'
    ],
    prevention: [
      'Mantener buenas prácticas de riego',
      'Fertilización equilibrada',
      'Poda regular para buena circulación de aire',
      'Inspección periódica de las plantas'
    ]
  },
  {
    id: 'rust',
    name: 'Roya (Rust)',
    scientificName: 'Gymnosporangium juniperi-virginianae',
    icon: Bug,
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    description: 'Enfermedad fúngica que produce manchas naranjas/amarillas',
    characteristics: [
      'Manchas circulares de color naranja brillante',
      'Pústulas elevadas en el envés de la hoja',
      'Anillos concéntricos en las lesiones',
      'Distribución dispersa por la superficie',
      'Puede causar defoliación prematura'
    ],
    treatment: [
      'Aplicar fungicidas a base de cobre',
      'Eliminar y destruir hojas severamente afectadas',
      'Tratar desde primavera hasta otoño',
      'Aplicaciones cada 10-14 días en época húmeda'
    ],
    prevention: [
      'Eliminar juníperos cercanos (huésped alternativo)',
      'Mejorar circulación de aire',
      'Evitar riego por aspersión',
      'Seleccionar variedades resistentes'
    ]
  },
  {
    id: 'scab',
    name: 'Sarna (Scab)',
    scientificName: 'Venturia inaequalis',
    icon: Droplets,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    description: 'Enfermedad fúngica que causa lesiones oscuras en hojas y frutos',
    characteristics: [
      'Manchas oscuras o negras aterciopeladas',
      'Lesiones con bordes bien definidos',
      'Deformación de la hoja en infecciones severas',
      'Puede afectar también a frutos',
      'Mayor incidencia en clima húmedo'
    ],
    treatment: [
      'Fungicidas preventivos (captan, mancozeb)',
      'Tratamientos curativos con DMI fungicidas',
      'Aplicar antes y después de lluvias',
      'Tratamiento desde brotación hasta verano'
    ],
    prevention: [
      'Recoger y destruir hojas caídas en otoño',
      'Podar para mejorar ventilación',
      'Evitar plantaciones muy densas',
      'Considerar variedades resistentes'
    ]
  },
  {
    id: 'multiple',
    name: 'Múltiples Enfermedades',
    icon: XCircle,
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    description: 'Presencia simultánea de varias enfermedades',
    characteristics: [
      'Combinación de síntomas de roya y sarna',
      'Manchas de diferentes colores',
      'Mayor extensión de área afectada',
      'Debilitamiento general de la planta',
      'Requiere atención urgente'
    ],
    treatment: [
      'Consultar con un agrónomo especialista',
      'Tratamiento fungicida de amplio espectro',
      'Posible necesidad de múltiples aplicaciones',
      'Evaluar estado general del cultivo'
    ],
    prevention: [
      'Programa preventivo integral',
      'Monitoreo constante del cultivo',
      'Rotación de fungicidas',
      'Mejora de condiciones culturales'
    ]
  }
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span>Volver</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              Guía de Enfermedades
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Intro */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Enfermedades del Manzano
          </h2>
          <p className="text-lg text-gray-600">
            Aprende a identificar las principales enfermedades que afectan a las hojas
            de manzano y cómo tratarlas efectivamente.
          </p>
        </div>

        {/* Disease Cards */}
        <div className="space-y-8 max-w-4xl mx-auto">
          {diseases.map((disease) => {
            const Icon = disease.icon;
            return (
              <Card key={disease.id} className={`${disease.bgColor} ${disease.borderColor} border-2`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${disease.iconBg}`}>
                      <Icon className={`h-8 w-8 ${disease.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{disease.name}</CardTitle>
                      {disease.scientificName && (
                        <p className="text-sm text-gray-500 italic mt-1">
                          {disease.scientificName}
                        </p>
                      )}
                      <CardDescription className="text-base mt-2">
                        {disease.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Características */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      🔍 Características visuales:
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {disease.characteristics.map((char, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <span className="text-green-600 mt-1">•</span>
                          {char}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tratamiento */}
                  {disease.treatment && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        💊 Tratamiento:
                      </h4>
                      <ul className="space-y-2">
                        {disease.treatment.map((treat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <span className="text-blue-600 mt-1">→</span>
                            {treat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prevención */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      🛡️ Prevención:
                    </h4>
                    <ul className="space-y-2">
                      {disease.prevention.map((prev, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-700">
                          <span className="text-purple-600 mt-1">✓</span>
                          {prev}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-green-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              ¿Tienes una hoja sospechosa?
            </h3>
            <p className="mb-6 text-green-100">
              Usa nuestra herramienta de análisis para obtener un diagnóstico rápido
            </p>
            <Link href="/analyze">
              <Button size="lg" variant="secondary">
                <Camera className="mr-2 h-5 w-5" />
                Analizar Ahora
              </Button>
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="max-w-2xl mx-auto mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Aviso importante:</p>
              <p>
                Esta guía es informativa y no sustituye el consejo de un profesional agrónomo.
                Para casos severos o persistentes, consulta con un especialista en fitopatología.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
