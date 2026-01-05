// Información detallada de enfermedades de plantas

import { DiseaseInfo, TreatmentRecommendation } from '@/types/disease';
import { DiseaseType } from '@/types/analysis';

export const DISEASES_INFO: Record<DiseaseType, DiseaseInfo> = {
  healthy: {
    id: 'healthy',
    name: 'Healthy',
    nameEs: 'Saludable',
    description: 'La hoja se encuentra en buen estado de salud, sin signos visibles de enfermedades o plagas.',
    symptoms: [
      'Color verde uniforme y vibrante',
      'Textura lisa y firme',
      'Sin manchas ni decoloraciones',
      'Bordes intactos'
    ],
    causes: [],
    treatments: [
      'Continuar con el mantenimiento regular',
      'Mantener riego adecuado',
      'Fertilización periódica'
    ],
    prevention: [
      'Inspección regular de las plantas',
      'Mantener buena circulación de aire',
      'Evitar el exceso de humedad'
    ],
    severity: 'none',
    color: '#22c55e',
    icon: '🌿'
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    nameEs: 'Roya',
    description: 'Enfermedad fúngica causada por hongos del orden Pucciniales. Se caracteriza por pústulas de color naranja-marrón en el envés de las hojas.',
    symptoms: [
      'Pústulas de color naranja-marrón en el envés',
      'Manchas amarillas en el haz de la hoja',
      'Defoliación prematura',
      'Debilitamiento general de la planta'
    ],
    causes: [
      'Hongos del género Gymnosporangium',
      'Alta humedad ambiental',
      'Temperaturas entre 15-25°C',
      'Presencia de hospedadores alternos (enebros)'
    ],
    treatments: [
      'Aplicar fungicidas a base de azufre',
      'Eliminar hojas infectadas',
      'Tratamientos con fungicidas sistémicos',
      'Aplicar triazoles o estrobilurinas'
    ],
    prevention: [
      'Eliminar hospedadores alternos cercanos',
      'Mejorar ventilación del cultivo',
      'Aplicar tratamientos preventivos en primavera',
      'Seleccionar variedades resistentes'
    ],
    severity: 'medium',
    color: '#f97316',
    icon: '🍂'
  },
  scab: {
    id: 'scab',
    name: 'Scab',
    nameEs: 'Sarna (Moteado)',
    description: 'Enfermedad fúngica causada por Venturia inaequalis. Es una de las enfermedades más importantes del manzano a nivel mundial.',
    symptoms: [
      'Manchas oscuras de aspecto aterciopelado',
      'Lesiones en hojas, frutos y brotes',
      'Deformación de frutos',
      'Caída prematura de hojas'
    ],
    causes: [
      'Hongo Venturia inaequalis',
      'Lluvias frecuentes en primavera',
      'Temperaturas entre 16-24°C',
      'Humedad relativa alta (>70%)'
    ],
    treatments: [
      'Fungicidas de contacto (captan, mancozeb)',
      'Fungicidas sistémicos (difenoconazol)',
      'Eliminar hojas caídas infectadas',
      'Poda de ramas afectadas'
    ],
    prevention: [
      'Eliminar restos vegetales infectados',
      'Aplicar tratamientos preventivos',
      'Mejorar drenaje y ventilación',
      'Plantar variedades resistentes'
    ],
    severity: 'high',
    color: '#78716c',
    icon: '🔴'
  },
  multiple_diseases: {
    id: 'multiple_diseases',
    name: 'Multiple Diseases',
    nameEs: 'Múltiples Enfermedades',
    description: 'La hoja presenta signos de más de una enfermedad simultáneamente, lo que indica un estado de salud comprometido que requiere atención inmediata.',
    symptoms: [
      'Combinación de síntomas de roya y sarna',
      'Deterioro generalizado de la hoja',
      'Múltiples tipos de manchas y lesiones',
      'Debilitamiento severo de la planta'
    ],
    causes: [
      'Presencia simultánea de varios patógenos',
      'Sistema inmune de la planta debilitado',
      'Condiciones ambientales favorables para múltiples hongos',
      'Falta de tratamientos preventivos'
    ],
    treatments: [
      'Tratamiento fungicida de amplio espectro',
      'Eliminar todo el material vegetal afectado',
      'Fortalecer la planta con nutrientes',
      'Consultar con un especialista'
    ],
    prevention: [
      'Programa de tratamiento preventivo integral',
      'Monitoreo constante de la salud de las plantas',
      'Mantener plantas bien nutridas',
      'Control temprano de cualquier síntoma'
    ],
    severity: 'high',
    color: '#ef4444',
    icon: '⚠️'
  }
};

export const getTreatmentRecommendations = (disease: DiseaseType): TreatmentRecommendation[] => {
  const recommendations: Record<DiseaseType, TreatmentRecommendation[]> = {
    healthy: [
      {
        title: 'Mantenimiento preventivo',
        description: 'Continúe con inspecciones regulares y cuidados básicos.',
        urgency: 'preventive'
      }
    ],
    rust: [
      {
        title: 'Tratamiento fungicida inmediato',
        description: 'Aplique fungicidas a base de azufre o triazoles.',
        urgency: 'immediate',
        products: ['Fungicida de azufre', 'Myclobutanil', 'Propiconazol']
      },
      {
        title: 'Eliminación de material infectado',
        description: 'Retire y destruya las hojas afectadas.',
        urgency: 'immediate'
      },
      {
        title: 'Tratamiento preventivo',
        description: 'Aplique tratamientos cada 14-21 días durante la temporada de crecimiento.',
        urgency: 'preventive'
      }
    ],
    scab: [
      {
        title: 'Fungicida de contacto',
        description: 'Aplique fungicidas como captan o mancozeb.',
        urgency: 'immediate',
        products: ['Captan', 'Mancozeb', 'Difenoconazol']
      },
      {
        title: 'Limpieza del área',
        description: 'Elimine todas las hojas caídas y restos vegetales.',
        urgency: 'soon'
      },
      {
        title: 'Mejora de condiciones',
        description: 'Pode para mejorar la circulación de aire.',
        urgency: 'preventive'
      }
    ],
    multiple_diseases: [
      {
        title: 'Tratamiento de amplio espectro',
        description: 'Aplique fungicida sistémico de amplio espectro inmediatamente.',
        urgency: 'immediate',
        products: ['Fungicida sistémico multiuso']
      },
      {
        title: 'Consulta profesional',
        description: 'Considere consultar con un agrónomo o especialista.',
        urgency: 'immediate'
      },
      {
        title: 'Aislamiento',
        description: 'Aísle las plantas afectadas para evitar propagación.',
        urgency: 'immediate'
      }
    ]
  };

  return recommendations[disease] || [];
};
