// Iconos personalizados para la aplicación

import { Leaf, Camera, Upload, AlertTriangle, CheckCircle, Info, History, BookOpen } from 'lucide-react';

// Re-exportar iconos usados frecuentemente
export {
  Leaf as PlantIcon,
  Camera as CameraIcon,
  Upload as UploadIcon,
  AlertTriangle as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  BookOpen as GuideIcon,
};

// Icono personalizado de enfermedad
export function DiseaseIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

// Icono de hoja con enfermedad
export function DiseaseLeafIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      <circle cx="14" cy="9" r="2" fill="currentColor" />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Icono de hoja saludable
export function HealthyLeafIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      <path d="M15 9l-3 3 1 1 3-3-1-1Z" className="text-green-500" />
    </svg>
  );
}

// Icono de análisis
export function AnalysisIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.56.94 6.17 2.47" />
      <path d="M21 3v6h-6" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
