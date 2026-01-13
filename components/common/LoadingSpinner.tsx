// Componente LoadingSpinner

import { cn } from '@/lib/utils';
import { Loader2, Leaf } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'leaf';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  text,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      {variant === 'leaf' ? (
        <Leaf className={cn(sizeClasses[size], 'text-green-600 animate-pulse')} />
      ) : (
        <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
      )}
      {text && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  );
}

// Componente de carga de página completa
export function PageLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card shadow-lg">
        <div className="relative">
          <Leaf className="h-16 w-16 text-green-600 animate-pulse" />
          <div className="absolute inset-0 h-16 w-16 border-4 border-green-200 rounded-full animate-ping" />
        </div>
        <p className="text-lg font-medium text-foreground">{text}</p>
      </div>
    </div>
  );
}

// Componente de overlay de análisis
export function AnalysisLoader({ 
  progress = 0,
  status = 'Analizando...'
}: { 
  progress?: number;
  status?: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg z-10">
      <div className="flex flex-col items-center gap-4 p-6">
        {/* Animación de escaneo */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-green-400 rounded-lg" />
          <div 
            className="absolute left-0 right-0 h-1 bg-green-400 animate-scan"
            style={{ top: `${progress}%` }}
          />
          <Leaf className="absolute inset-0 m-auto h-10 w-10 text-green-400" />
        </div>
        
        {/* Progreso */}
        <div className="w-48">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-white text-sm mt-2">{progress}%</p>
        </div>
        
        {/* Estado */}
        <p className="text-white font-medium">{status}</p>
      </div>
    </div>
  );
}
